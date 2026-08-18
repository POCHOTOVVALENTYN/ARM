import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import pytz

from sqlalchemy import insert, select
from app.core.redis import get_redis
from app.api.websocket import ws_manager
from app.utils.geo import calculate_distance
from app.models.schedule import Schedule, ScheduleStatus
from app.core.database import async_session_maker
from app.models.models import IncidentLog, EtaLog, StationModel
from app.services.telemetry_adapters import telemetry_manager

logger = logging.getLogger("app.telemetry_worker")

STOP_RADIUS_METERS = 75.0
CRITICAL_DELAY_MINUTES = 5.0

def get_kyiv_current_minute() -> float:
    """Отримує поточний час за Києвом у хвилинах від опівночі."""
    tz = pytz.timezone("Europe/Kyiv")
    now = datetime.now(tz)
    return float(now.hour * 60 + now.minute + now.second / 60.0)

async def check_and_trigger_incident(redis, vehicle: dict):
    """
    Автоматично фіксує інцидент при критичному запізненні вагона.
    Ігнорує транспортні засоби на оперативному перемиканні (DETOUR).
    """
    if vehicle.get("status") == "DETOUR":
        return

    vid = vehicle["vehicle_id"]
    is_detour = await redis.exists(f"active_detour:{vid}")
    if is_detour:
        return

    dev = vehicle.get("deviation_min", 0.0)
    lock_key = f"incident_lock:{vid}"

    if dev >= CRITICAL_DELAY_MINUTES:
        is_locked = await redis.exists(lock_key)
        if not is_locked:
            try:
                async with async_session_maker() as db:
                    new_incident = IncidentLog(
                        vehicle_id=vid,
                        route_id=vehicle.get("route_id") or "UNKNOWN",
                        description=f"Автоматична фіксація: критичне запізнення на {dev} хв.",
                        status="NEW",
                        source="SYSTEM"
                    )
                    db.add(new_incident)
                    await db.commit()
                    await db.refresh(new_incident)
                    
                    await ws_manager.broadcast({
                        "type": "NEW_INCIDENT",
                        "payload": {
                            "id": new_incident.id,
                            "vehicle_id": vid,
                            "description": new_incident.description,
                            "route_id": new_incident.route_id,
                            "status": new_incident.status,
                            "source": new_incident.source,
                            "timestamp": new_incident.recorded_at.isoformat() if new_incident.recorded_at else None
                        }
                    })
                
                await redis.set(lock_key, "active", ex=7200) # 2 години блокування повтору
                logger.warning(f"🚨 [ІНЦИДЕНТ] Створено авто-інцидент для ТЗ {vid} (запізнення: {dev} хв)")
            except Exception as e:
                logger.error(f"Помилка створення інциденту в БД: {e}")
    elif dev < CRITICAL_DELAY_MINUTES:
        await redis.delete(lock_key)

async def cache_active_schedule_in_redis(schedule: Schedule):
    """
    Кешує зупинки та розклади активного випуску у Redis із РЕАЛЬНИМИ GPS координатами станцій.
    """
    try:
        redis = await get_redis()
        
        # Отримуємо реальні координати станцій з бази
        async with async_session_maker() as db:
            st_res = await db.execute(select(StationModel))
            stations_dict = {s.id: {"lat": s.lat or 46.4700, "lng": s.lng or 30.7300, "name": s.name} for s in st_res.scalars().all()}

        for duty in schedule.duties:
            vid = getattr(duty, "vehicle_id", None) or f"DUTY_{duty.duty_number}"
            stops_list = []

            for shift in duty.shifts:
                for trip in shift.trips:
                    for st in trip.stop_times:
                        arr_min = st.arrival_time.hour * 60 + st.arrival_time.minute if st.arrival_time else 0.0
                        real_coords = stations_dict.get(str(st.stop_id), {"lat": 46.4685, "lng": 30.7380, "name": f"Зупинка #{st.stop_id}"})

                        stops_list.append({
                            "stop_id": str(st.stop_id),
                            "stop_name": real_coords.get("name"),
                            "lat": real_coords["lat"],
                            "lng": real_coords["lng"],
                            "arrival_minute": float(arr_min),
                            "trip_id": trip.id,
                            "is_control_point": getattr(st, "is_control_point", False)
                        })
            
            cache_payload = {
                "schedule_id": schedule.id,
                "route_id": schedule.route_id,
                "duty_number": duty.duty_number,
                "stops": stops_list
            }
            await redis.set(f"schedule_cache:vehicle:{vid}", json.dumps(cache_payload), ex=86400)
            logger.info(f"💾 [REDIS] Закешовано розклад для вагона {vid} ({len(stops_list)} зупинок)")
    except Exception as e:
        logger.error(f"Помилка кешування розкладу в Redis: {e}")

async def process_deviations(redis, raw_telemetry: list[dict]) -> list[dict]:
    """
    Аналізує координати за формулою Гаверсина, розраховує відхилення (Schedule Adherence),
    формує рекомендації темпу руху (Pacing Guidance) та фіксує проходження контрольних точок в UTC.
    """
    processed_telemetry = []
    eta_logs_buffer = []
    
    current_minute = get_kyiv_current_minute()
    utc_now = datetime.now(timezone.utc)

    for vehicle in raw_telemetry:
        vid = vehicle["vehicle_id"]
        v_lat, v_lng = vehicle["lat"], vehicle["lng"]
        route_id = vehicle.get("route_id")

        # 1. Завантаження стану з Redis
        prev_state_raw = await redis.hget("telemetry:vehicles", vid)
        if prev_state_raw:
            try:
                prev_state = json.loads(prev_state_raw)
                vehicle["deviation_min"] = prev_state.get("deviation_min", 0.0)
                target_stop_idx = prev_state.get("target_stop_idx", 0)
                is_at_stop = prev_state.get("is_at_stop", False)
                status = prev_state.get("status", "ON_ROUTE")
            except Exception:
                vehicle["deviation_min"] = 0.0
                target_stop_idx = 0
                is_at_stop = False
                status = "ON_ROUTE"
        else:
            vehicle["deviation_min"] = 0.0
            target_stop_idx = 0
            is_at_stop = False
            status = "ON_ROUTE"

        # Перевірка оперативного об'їзду (DETOUR)
        is_detour = await redis.exists(f"active_detour:{vid}")
        if is_detour or vehicle.get("status") == "DETOUR":
            status = "DETOUR"

        vehicle["target_stop_idx"] = target_stop_idx
        vehicle["is_at_stop"] = is_at_stop
        vehicle["status"] = status

        # Розрахунок темпу (Pacing) за замовчуванням
        dev = float(vehicle["deviation_min"])
        if status == "DETOUR":
            vehicle["pacing"] = {"status": "DETOUR", "recommendation": "Слідувати за оперативною вказівкою диспетчера"}
        elif dev > 2.0:
            vehicle["pacing"] = {"status": "SPEED_UP", "recommendation": f"Запізнення +{dev:.1f} хв! Пришвидшіть посадку та рух."}
        elif dev < -1.0:
            vehicle["pacing"] = {"status": "SLOW_DOWN", "recommendation": f"Випередження графіка на {abs(dev):.1f} хв! Уповільніть хід / витримайте відстій."}
        else:
            vehicle["pacing"] = {"status": "ON_TIME", "recommendation": "Рух у графіку. Рекомендована швидкість 16-18 км/год."}

        # Якщо ТЗ в об'їзді або в депо — припиняємо геофенсинг графіка
        if status != "ON_ROUTE" and status != "active":
            processed_telemetry.append(vehicle)
            continue

        # 2. Зіставлення з розкладом
        sched_cache_raw = await redis.get(f"schedule_cache:vehicle:{vid}")
        if not sched_cache_raw:
            processed_telemetry.append(vehicle)
            continue
            
        try:
            sched_data = json.loads(sched_cache_raw)
            stops = sched_data.get("stops", [])

            if target_stop_idx < len(stops):
                target_stop = stops[target_stop_idx]
                dist = calculate_distance(v_lat, v_lng, target_stop["lat"], target_stop["lng"])
                
                # Вагон увійшов у радіус зупинки
                if dist <= STOP_RADIUS_METERS and not is_at_stop:
                    deviation = current_minute - target_stop["arrival_minute"]
                    vehicle["deviation_min"] = round(deviation, 1)
                    vehicle["is_at_stop"] = True
                    vehicle["current_stop_name"] = target_stop.get("stop_name")
                    
                    eta_logs_buffer.append({
                        "vehicle_id": vid,
                        "route_id": route_id or "UNKNOWN",
                        "stop_id": target_stop["stop_id"],
                        "trip_id": target_stop.get("trip_id"),
                        "deviation_min": vehicle["deviation_min"],
                        "recorded_at": utc_now
                    })

                # Вагон покинув зупинку
                elif dist > STOP_RADIUS_METERS and is_at_stop:
                    vehicle["is_at_stop"] = False
                    vehicle["target_stop_idx"] = target_stop_idx + 1
        except Exception as e:
            logger.debug(f"Помилка аналізу розкладу для {vid}: {e}")

        processed_telemetry.append(vehicle)

    # 3. Батч-запис у PostgreSQL
    if eta_logs_buffer:
        try:
            async with async_session_maker() as db:
                await db.execute(insert(EtaLog).values(eta_logs_buffer))
                await db.commit()
        except Exception as e:
            logger.error(f"Помилка запису в eta_logs: {e}")

    return processed_telemetry
