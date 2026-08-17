import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import pytz

from sqlalchemy import insert
from app.core.redis import get_redis
from app.api.websocket import ws_manager
from app.utils.geo import calculate_distance
from app.models.schedule import Schedule, ScheduleStatus
from app.core.database import async_session_maker
from app.models.models import IncidentLog, EtaLog

logger = logging.getLogger(__name__)

# Збільшено до 75 метрів для страховки від "сліпих зон" 10-секундного пінгу
STOP_RADIUS_METERS = 75.0 
CRITICAL_DELAY_MINUTES = 5.0  # Поріг для автоматичного створення інциденту (хвилини)

def get_kyiv_current_minute() -> float:
    """Отримує час за Києвом для порівняння з розкладом КП ОМЕТ."""
    tz = pytz.timezone("Europe/Kyiv")
    now = datetime.now(tz)
    return float(now.hour * 60 + now.minute + now.second / 60.0)

async def check_and_trigger_incident(redis, vehicle: dict):
    """
    Генерує інцидент при критичному запізненні. 
    Ігнорує транспортні засоби, які знаходяться на оперативному перемиканні (DETOUR).
    """
    # Захист від хибних спрацювань під час об'їзду
    if vehicle.get("status") == "DETOUR":
        return

    vid = vehicle["vehicle_id"]
    is_detour = await redis.exists(f"active_detour:{vid}")
    if is_detour:
        return

    dev = vehicle.get("deviation_min", 0.0)
    lock_key = f"incident_lock:{vid}"

    # 1. Якщо запізнення критичне
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
                    
                    # Надсилаємо сповіщення через WebSocket
                    await ws_manager.broadcast({
                        "type": "new_incident",
                        "data": {
                            "id": new_incident.id,
                            "vehicle_id": vid,
                            "description": new_incident.description,
                            "route_id": new_incident.route_id,
                            "status": new_incident.status,
                            "source": new_incident.source,
                            "timestamp": new_incident.timestamp.isoformat() if new_incident.timestamp else None
                        }
                    })
                
                # Встановлюємо блокування у Redis на 2 години
                await redis.set(lock_key, "active", ex=7200)
                logger.warning(f"🚨 [ІНЦИДЕНТ] Створено авто-інцидент для ТЗ {vid} (запізнення: {dev} хв.)")
            except Exception as e:
                logger.error(f"Помилка створення інциденту в БД: {e}")

    # 2. Якщо вагон нагнав розклад — знімаємо блокування
    elif dev < CRITICAL_DELAY_MINUTES:
        await redis.delete(lock_key)

# Базові опорні точки одеських маршрутів (Трамвай 7, 18, 28, 5)
ODESSA_SAMPLE_VEHICLES = [
    {"vehicle_id": "3012", "route_id": "7", "lat": 46.5824, "lng": 30.7932, "speed": 22.0, "status": "active", "heading": 195},
    {"vehicle_id": "3014", "route_id": "7", "lat": 46.5412, "lng": 30.7610, "speed": 18.5, "status": "active", "heading": 190},
    {"vehicle_id": "3018", "route_id": "7", "lat": 46.4950, "lng": 30.7250, "speed": 24.0, "status": "active", "heading": 210},
    {"vehicle_id": "4015", "route_id": "18", "lat": 46.4710, "lng": 30.7450, "speed": 16.0, "status": "active", "heading": 175},
    {"vehicle_id": "4020", "route_id": "18", "lat": 46.4350, "lng": 30.7550, "speed": 20.0, "status": "active", "heading": 180},
    {"vehicle_id": "5001", "route_id": "28", "lat": 46.4780, "lng": 30.7300, "speed": 15.0, "status": "active", "heading": 90},
    {"vehicle_id": "5005", "route_id": "5", "lat": 46.4680, "lng": 30.7520, "speed": 0.0, "status": "break", "heading": 0},
    {"vehicle_id": "9901", "route_id": "7", "lat": 46.4678, "lng": 30.7334, "speed": 0.0, "status": "depot", "heading": 0},
]

async def fetch_wialon_data() -> List[Dict[str, Any]]:
    """
    Отримує телеметрію від сервісу Wialon або емулює переміщення активних вагонів КП «ОМЕТ».
    """
    now_ms = int(datetime.now().timestamp() * 1000)
    current_time_sec = datetime.now().timestamp()

    result = []
    for base in ODESSA_SAMPLE_VEHICLES:
        # Невелика синусоїдна зміна координат для створення живої динаміки на мапі
        lat_offset = 0.0003 * (base["speed"] > 0) * (0.5 - (current_time_sec % 60) / 60.0)
        lng_offset = 0.0002 * (base["speed"] > 0) * (0.5 - (current_time_sec % 45) / 45.0)

        vehicle_data = {
            "vehicle_id": base["vehicle_id"],
            "route_id": base["route_id"],
            "lat": round(base["lat"] + lat_offset, 6),
            "lng": round(base["lng"] + lng_offset, 6),
            "speed": base["speed"],
            "heading": base.get("heading", 0),
            "status": base["status"],
            "last_updated": now_ms,
            "deviation_min": 0.0
        }
        result.append(vehicle_data)

    return result

async def cache_active_schedule_in_redis(schedule: Schedule):
    """
    Кешує зупинки та розклади активного випуску у Redis для швидкісного розрахунку відхилень.
    """
    try:
        redis = await get_redis()
        for duty in schedule.duties:
            vid = duty.vehicle_id or f"DUTY_{duty.duty_number}"
            
            stops_list = []
            for shift in duty.shifts:
                for trip in shift.trips:
                    for st in trip.stop_times:
                        # Парсимо час у хвилини від опівночі
                        arr_parts = st.arrival_time.split(":")
                        arr_min = int(arr_parts[0]) * 60 + int(arr_parts[1]) if len(arr_parts) >= 2 else 0.0
                        
                        stops_list.append({
                            "stop_id": st.stop_id,
                            "lat": 46.4820 + (st.stop_sequence * 0.003),  # Опорні координати зупинки
                            "lng": 30.7320 + (st.stop_sequence * 0.002),
                            "arrival_minute": float(arr_min),
                            "trip_id": trip.id
                        })
            
            cache_payload = {
                "schedule_id": schedule.id,
                "route_id": schedule.route_id,
                "stops": stops_list
            }
            await redis.set(f"schedule_cache:vehicle:{vid}", json.dumps(cache_payload), ex=86400)
            logger.info(f"💾 [REDIS] Закешовано розклад для вагона {vid} ({len(stops_list)} зупинок)")
    except Exception as e:
        logger.error(f"Помилка кешування розкладу в Redis: {e}")

async def process_deviations(redis, raw_telemetry: list[dict]) -> list[dict]:
    """
    Аналізує координати за формулою Гаверсина, розраховує відхилення (Schedule Adherence)
    з алгоритмом анти-дрифту (State Machine) та фіксує пакетний запис у eta_logs в UTC.
    """
    processed_telemetry = []
    eta_logs_buffer = []
    
    current_minute = get_kyiv_current_minute()
    utc_now = datetime.now(timezone.utc)  # Формуємо точну UTC мітку для БД

    for vehicle in raw_telemetry:
        vid = vehicle["vehicle_id"]
        v_lat, v_lng = vehicle["lat"], vehicle["lng"]
        route_id = vehicle.get("route_id")

        # 1. Завантаження попереднього стану з Redis
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

        # Ініціалізація внутрішнього стану для поточного кроку
        vehicle["target_stop_idx"] = target_stop_idx
        vehicle["is_at_stop"] = is_at_stop
        vehicle["status"] = status

        # 2. Якщо ТЗ в об'їзді або в депо/на перерві - припиняємо математику розкладів
        if status != "ON_ROUTE" and status != "active":
            processed_telemetry.append(vehicle)
            continue

        # 3. Аналіз розкладу
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
                
                # --- ЛОГІКА АНТИ-ДРИФТУ (State Machine) ---
                
                # А. Вагон щойно УВІЙШОВ у зону зупинки
                if dist <= STOP_RADIUS_METERS and not is_at_stop:
                    deviation = current_minute - target_stop["arrival_minute"]
                    vehicle["deviation_min"] = round(deviation, 1)
                    vehicle["is_at_stop"] = True  # Блокуємо стан: "Ми на зупинці"
                    
                    # Додаємо запис у буфер для БД
                    eta_logs_buffer.append({
                        "vehicle_id": vid,
                        "route_id": route_id or "UNKNOWN",
                        "stop_id": target_stop["stop_id"],
                        "trip_id": target_stop.get("trip_id"),
                        "deviation_min": vehicle["deviation_min"],
                        "recorded_at": utc_now
                    })
                    logger.debug(f"ТЗ {vid} прибув на {target_stop['stop_id']}. Відхилення: {vehicle['deviation_min']} хв.")

                # Б. Вагон ПОКИНУВ зону зупинки
                elif dist > STOP_RADIUS_METERS and is_at_stop:
                    vehicle["is_at_stop"] = False
                    vehicle["target_stop_idx"] = target_stop_idx + 1  # Перемикаємо ціль на наступну
                    logger.debug(f"ТЗ {vid} покинув зупинку {target_stop['stop_id']}.")
        except Exception as e:
            logger.debug(f"Помилка аналізу розкладу для {vid}: {e}")

        processed_telemetry.append(vehicle)

    # 4. Батч-запис у PostgreSQL
    if eta_logs_buffer:
        try:
            async with async_session_maker() as db:
                await db.execute(insert(EtaLog).values(eta_logs_buffer))
                await db.commit()
                logger.debug(f"💾 [ETA_LOGS] Збережено {len(eta_logs_buffer)} записів в UTC")
        except Exception as e:
            logger.error(f"Помилка запису в eta_logs: {e}")

    return processed_telemetry

async def telemetry_polling_loop():
    """
    Нескінченний цикл опитування телеметрії, розрахунку відхилень та розсилки по WebSocket.
    """
    logger.info("📡 Запущено фоновий збір телеметрії Wialon / GPS (інтервал: 10с, радіус: 75м)")
    
    while True:
        try:
            redis = await get_redis()
            # 1. Отримуємо дані телеметрії
            raw_telemetry = await fetch_wialon_data()

            if raw_telemetry:
                # 2. Розраховуємо відхилення від графіка
                processed_data = await process_deviations(redis, raw_telemetry)

                # 3. Перевірка на критичні запізнення та генерація інцидентів (із Redis-блокуванням)
                for v in processed_data:
                    await check_and_trigger_incident(redis, v)

                # 4. Пакетне збереження в Redis Hash
                pipeline = redis.pipeline()
                for vehicle in processed_data:
                    pipeline.hset("telemetry:vehicles", vehicle["vehicle_id"], json.dumps(vehicle))
                await pipeline.execute()

                # 5. Трансляція підключеним диспетчерам
                await ws_manager.broadcast({
                    "type": "telemetry_update",
                    "data": processed_data
                })

        except asyncio.CancelledError:
            logger.info("🛑 Фоновий воркер телеметрії зупинено")
            break
        except Exception as e:
            logger.error(f"Помилка в циклі телеметрії: {e}")

        # Інтервал опитування — 10 секунд
        await asyncio.sleep(10)