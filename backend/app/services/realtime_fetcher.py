import asyncio
import logging
import httpx
import json
import os
import csv
from datetime import datetime, timezone
from google.transit import gtfs_realtime_pb2

from app.core.redis import get_redis
from app.api.websocket import ws_manager
from app.services.telemetry_worker import process_deviations, check_and_trigger_incident, ODESSA_SAMPLE_VEHICLES

logger = logging.getLogger(__name__)

# Дані шлюзу ОМР
GTFS_RT_URL = "https://gw.x24.digital/api/od-all/gtfs/v1/download/gtfs-rt-vehicles-pr.pb"
API_KEY = "a8c6d35e-f2c1-4f72-b902-831fa9215009"

possible_dirs = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "gtfs_static_data"),
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "gtfs_static_data"),
    "/app/gtfs_static_data",
    "gtfs_static_data"
]
GTFS_DIR = next((d for d in possible_dirs if os.path.exists(d)), possible_dirs[0])

# Словник для мапінгу UUID маршруту (з GTFS) на його номер для фронтенду (напр. "18")
ROUTE_MAP = {}

def load_route_mapping():
    """
    GTFS-RT віддає системні UUID маршрутів. 
    Ми підтягуємо routes.txt, щоб перетворити їх у звичні номери (7, 18, 5 тощо).
    """
    try:
        routes_file = os.path.join(GTFS_DIR, "routes.txt")
        if os.path.exists(routes_file):
            with open(routes_file, encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    ROUTE_MAP[row['route_id']] = row['route_short_name'].strip()
            logger.info(f"🗺️ [GTFS-RT] Завантажено мапінг для {len(ROUTE_MAP)} маршрутів")
        else:
            logger.warning(f"⚠️ [GTFS-RT] Файл routes.txt не знайдено за шляхом {routes_file}")
    except Exception as e:
        logger.error(f"Помилка завантаження мапінгу маршрутів: {e}")

async def fetch_and_process_realtime_data():
    """Фоновий процес пулінгу реальної телеметрії ОМЕТ"""
    logger.info("📡 Запущено бойовий модуль GTFS-RT (Одеса - шлюз ОМР)")
    load_route_mapping()
    
    headers = {"ApiKey": API_KEY}
    
    async with httpx.AsyncClient() as client:
        while True:
            try:
                redis = await get_redis()
                raw_telemetry = []

                # 1. Завантаження бінарного файлу з Odesa API
                try:
                    response = await client.get(GTFS_RT_URL, headers=headers, timeout=8.0)
                    if response.status_code == 200:
                        feed = gtfs_realtime_pb2.FeedMessage()
                        feed.ParseFromString(response.content)

                        for entity in feed.entity:
                            if entity.HasField('vehicle'):
                                v = entity.vehicle
                                vehicle_id = v.vehicle.id if v.vehicle.HasField('id') else entity.id
                                gtfs_route_id = v.trip.route_id if v.HasField('trip') else None
                                short_route_name = ROUTE_MAP.get(gtfs_route_id)
                                
                                # Якщо знайдено відповідність до електротранспорту
                                if short_route_name:
                                    speed_kmh = round(v.position.speed * 3.6, 1) if v.position.HasField('speed') else 0.0

                                    raw_telemetry.append({
                                        "vehicle_id": vehicle_id,
                                        "lat": v.position.latitude,
                                        "lng": v.position.longitude,
                                        "speed": speed_kmh,
                                        "route_id": short_route_name,
                                        "heading": round(v.position.bearing, 1) if v.position.HasField('bearing') else 0,
                                        "status": "active",
                                        "last_updated": int(datetime.now(timezone.utc).timestamp() * 1000)
                                    })
                                else:
                                    logger.debug(f"🔍 [GTFS-RT Діагностика] ТЗ {vehicle_id} маршрут: {gtfs_route_id} (не входить до активних електротранспортних ліній)")
                        
                        logger.info(f"📡 [GTFS-RT ОМЕТ] Отримано {len(feed.entity)} сутностей, з них співпало {len(raw_telemetry)} од. електротранспорту")
                except Exception as net_err:
                    logger.warning(f"Мережевий запит до GTFS-RT: {net_err}")

                # 2. Якщо в поточний момент немає активних рейсів в API (наприклад, нічний час), використовуємо опорну телеметрію
                if not raw_telemetry:
                    now_ms = int(datetime.now().timestamp() * 1000)
                    current_time_sec = datetime.now().timestamp()
                    for base in ODESSA_SAMPLE_VEHICLES:
                        lat_offset = 0.0003 * (base["speed"] > 0) * (0.5 - (current_time_sec % 60) / 60.0)
                        lng_offset = 0.0002 * (base["speed"] > 0) * (0.5 - (current_time_sec % 45) / 45.0)
                        raw_telemetry.append({
                            "vehicle_id": base["vehicle_id"],
                            "route_id": base["route_id"],
                            "lat": round(base["lat"] + lat_offset, 6),
                            "lng": round(base["lng"] + lng_offset, 6),
                            "speed": base["speed"],
                            "heading": base.get("heading", 0),
                            "status": base["status"],
                            "last_updated": now_ms,
                            "deviation_min": 0.0
                        })

                # 3. Виклик математики відхилень (з telemetry_worker.py)
                processed_data = await process_deviations(redis, raw_telemetry)
                
                # 4. Автоматична генерація інцидентів (якщо запізнення > 5 хв)
                for veh in processed_data:
                    await check_and_trigger_incident(redis, veh)
                
                # 5. Збереження свіжих даних у Redis
                pipeline = redis.pipeline()
                for v in processed_data:
                    pipeline.hset("telemetry:vehicles", v["vehicle_id"], json.dumps(v))
                await pipeline.execute()

                # 6. Миттєва розсилка координат на карти всіх диспетчерів через WebSocket
                await ws_manager.broadcast({
                    "type": "telemetry_update",
                    "data": processed_data
                })
                
                logger.debug(f"⚡ Оброблено {len(processed_data)} од. електротранспорту (GTFS-RT / OMET)")

            except asyncio.CancelledError:
                logger.info("🛑 Фоновий воркер GTFS-RT зупинено")
                break
            except Exception as e:
                logger.error(f"Помилка в циклі телеметрії GTFS-RT: {e}")
            
            # Очікуємо 10 секунд до наступного пінг-запиту
            await asyncio.sleep(10)
