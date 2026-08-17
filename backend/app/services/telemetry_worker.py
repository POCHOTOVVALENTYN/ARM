import asyncio
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

from sqlalchemy import insert
from app.core.redis import get_redis
from app.api.websocket import ws_manager
from app.utils.geo import calculate_distance
from app.models.schedule import Schedule, ScheduleStatus
from app.core.database import async_session_maker
from app.models.models import IncidentLog, EtaLog

logger = logging.getLogger(__name__)

STOP_RADIUS_METERS = 50.0  # Радіус захоплення зупинки (метри)
CRITICAL_DELAY_MINUTES = 5.0  # Поріг для автоматичного створення інциденту (хвилини)

async def check_and_trigger_incident(redis, vehicle: dict):
    """
    Перевіряє відхилення та створює інцидент у PostgreSQL без спаму,
    використовуючи Redis як тимчасовий Lock-менеджер.
    Якщо ТЗ в оперативному об'їзді (DETOUR) — інциденти запізнення не генеруються.
    """
    vid = vehicle["vehicle_id"]
    
    # 0. Якщо ТЗ на об'їзді (DETOUR) — пропускаємо
    is_detour = await redis.exists(f"active_detour:{vid}")
    if is_detour or vehicle.get("status") == "DETOUR":
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
                        route_id=vehicle.get("route_id"),
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

def get_current_minute() -> float:
    """Повертає поточний час у хвилинах від опівночі за київським часом."""
    now = datetime.now()
    return float(now.hour * 60 + now.minute + now.second / 60.0)

async def fetch_wialon_data() -> List[Dict[str, Any]]:
    """
    Отримує телеметрію від сервісу Wialon або емулює переміщення активних вагонів КП «ОМЕТ».
    """
    # Емуляція плавного руху по місту для демонстрації
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

async def process_deviations(redis, raw_telemetry: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Аналізує координати за формулою Гаверсина, розраховує відхилення (Schedule Adherence)
    та формує пакетний запис у eta_logs при проходженні контрольних зупинок.
    """
    processed_telemetry = []
    eta_logs_buffer = []
    current_minute = get_current_minute()

    for vehicle in raw_telemetry:
        vid = vehicle["vehicle_id"]
        v_lat, v_lng = vehicle["lat"], vehicle["lng"]
        route_id = vehicle.get("route_id")
        vehicle["deviation_min"] = 0.0

        # Перевірка чи ТЗ в оперативному перемиканні/об'їзді (DETOUR)
        is_detour = await redis.exists(f"active_detour:{vid}")
        if is_detour or vehicle.get("status") == "DETOUR":
            vehicle["status"] = "DETOUR"
            vehicle["deviation_min"] = 0.0
            processed_telemetry.append(vehicle)
            continue

        # 1. Отримуємо попередній стан вагона з Redis
        prev_state_raw = await redis.hget("telemetry:vehicles", vid)
        target_stop_idx = 0
        if prev_state_raw:
            try:
                prev_state = json.loads(prev_state_raw)
                vehicle["deviation_min"] = prev_state.get("deviation_min", 0.0)
                target_stop_idx = prev_state.get("target_stop_idx", 0)
            except Exception:
                pass

        # 2. Отримуємо закешований розклад для цього вагона
        sched_cache_raw = await redis.get(f"schedule_cache:vehicle:{vid}")
        if not sched_cache_raw:
            processed_telemetry.append(vehicle)
            continue

        try:
            sched_data = json.loads(sched_cache_raw)
            stops = sched_data.get("stops", [])

            # 3. Перевірка прибуття на цільову зупинку
            if target_stop_idx < len(stops):
                target_stop = stops[target_stop_idx]
                dist = calculate_distance(v_lat, v_lng, target_stop["lat"], target_stop["lng"])

                # Якщо вагон увійшов у радіус зупинки (<= 50 метрів)
                if dist <= STOP_RADIUS_METERS:
                    # Рахуємо відхилення: Фактичний час мінус Плановий
                    deviation = current_minute - target_stop["arrival_minute"]
                    vehicle["deviation_min"] = round(deviation, 1)
                    vehicle["target_stop_idx"] = target_stop_idx + 1
                    
                    # Формуємо запис для збереження в PostgreSQL (eta_logs)
                    eta_logs_buffer.append({
                        "vehicle_id": vid,
                        "route_id": route_id or vehicle.get("route_id", "UNKNOWN"),
                        "stop_id": target_stop["stop_id"],
                        "trip_id": target_stop.get("trip_id"),
                        "deviation_min": round(deviation, 1),
                        "recorded_at": datetime.utcnow()
                    })
                    logger.info(f"🚊 ТЗ {vid} прибув на зупинку {target_stop['stop_id']}. Відхилення: {deviation:+.1f} хв.")
                else:
                    vehicle["target_stop_idx"] = target_stop_idx
        except Exception as e:
            logger.debug(f"Помилка розрахунку зупинки для {vid}: {e}")

        processed_telemetry.append(vehicle)

    # 4. Пакетний запис у PostgreSQL (Bulk Insert)
    if eta_logs_buffer:
        try:
            async with async_session_maker() as db:
                await db.execute(insert(EtaLog).values(eta_logs_buffer))
                await db.commit()
                logger.debug(f"💾 [ETA_LOGS] Пакетно збережено {len(eta_logs_buffer)} записів до PostgreSQL.")
        except Exception as e:
            logger.error(f"Помилка запису в eta_logs: {e}")

    return processed_telemetry

async def telemetry_polling_loop():
    """
    Нескінченний цикл опитування телеметрії, розрахунку відхилень та розсилки по WebSocket.
    """
    logger.info("📡 Запущено фоновий збір телеметрії Wialon / GPS (інтервал: 10с)")
    
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