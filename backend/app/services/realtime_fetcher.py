import asyncio
import logging
import json
from app.core.redis import get_redis
from app.api.websocket import ws_manager
from app.services.telemetry_adapters import telemetry_manager
from app.services.telemetry_worker import process_deviations, check_and_trigger_incident

logger = logging.getLogger("app.realtime_fetcher")

async def fetch_and_process_realtime_data():
    """
    Головний фоновий цикл збору телеметрії КП «ОМЕТ» (інтервал: 10 секунд).
    Автоматично опитує: Wialon -> GTFS-RT (ОМР) -> Симулятор Одеси,
    розраховує відхилення, фільтрує Анти-РЕБ та транслює по WebSocket.
    """
    logger.info("📡 Запущено модульний диспетчерський збір телеметрії (Wialon / GTFS-RT ОМР / Симуляція)")

    while True:
        try:
            redis = await get_redis()
            
            # 1. Отримуємо сиру телеметрію через CompositeTelemetryManager
            raw_telemetry = await telemetry_manager.get_live_telemetry()

            if raw_telemetry:
                # 2. Розраховуємо відхилення від розкладу та Pacing Guidance для водіїв
                processed_data = await process_deviations(redis, raw_telemetry)

                # 3. Перевірка на критичні запізнення та генерація інцидентів
                for veh in processed_data:
                    await check_and_trigger_incident(redis, veh)

                # 4. Пакетне збереження в Redis Hash
                pipeline = redis.pipeline()
                for v in processed_data:
                    pipeline.hset("telemetry:vehicles", v["vehicle_id"], json.dumps(v))
                await pipeline.execute()

                # 5. Миттєва розсилка координат та темпу руху через WebSocket
                await ws_manager.broadcast({
                    "type": "TELEMETRY_UPDATE",
                    "data": processed_data
                })

        except asyncio.CancelledError:
            logger.info("🛑 Фоновий воркер телеметрії зупинено")
            break
        except Exception as e:
            logger.error(f"Помилка в циклі телеметрії: {e}")

        await asyncio.sleep(10)
