# backend/app/services/telemetry_worker.py
import asyncio
import aiohttp
import time
import math
from typing import Dict
from app.core.config import settings
from app.models.schemas import VehiclePosition

class TelemetryService:
    def __init__(self):
        # In-memory кеш для зберігання останніх валідних позицій
        # В майбутньому можна замінити на Redis
        self.active_vehicles: Dict[str, VehiclePosition] = {}
        # Трекінг перебування вагона у депо
        self.vehicle_in_depot: Dict[str, bool] = {}

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Обчислює відстань між двома GPS-координатами у кілометрах."""
        R = 6371.0 # Радіус Землі в км
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def _apply_anti_ew_filter(self, vehicle_id: str, new_lat: float, new_lon: float, new_timestamp: float) -> bool:
        """
        Фільтр Анти-РЕБ. Повертає True, якщо координата валідна, і False, якщо це аномалія.
        """
        last_pos = self.active_vehicles.get(vehicle_id)
        
        if not last_pos:
            return True # Перша точка завжди валідна

        time_delta_sec = new_timestamp - last_pos.timestamp
        if time_delta_sec <= 0:
            return False

        distance_km = self._haversine_distance(last_pos.lat, last_pos.lon, new_lat, new_lon)
        calculated_speed_kmh = (distance_km / time_delta_sec) * 3600

        # Якщо розрахована швидкість перевищує ліміт (напр. 100 км/год) — це стрибок РЕБ
        if calculated_speed_kmh > settings.MAX_VALID_SPEED_KMH:
            return False
            
        return True

    def _check_offline_timeouts(self, current_time: float):
        """Позначає транспортні засоби як OFFLINE, якщо немає валідних даних більше 3 хвилин."""
        for vid, pos in self.active_vehicles.items():
            if current_time - pos.timestamp > settings.OFFLINE_TIMEOUT_SEC:
                pos.status = 'OFFLINE'

    def _is_in_depot(self, lat: float, lon: float) -> bool:
        """Перевіряє чи знаходяться координати всередині контрольних зон депо."""
        dist_to_exit = self._haversine_distance(lat, lon, settings.DEPOT_EXIT_LAT, settings.DEPOT_EXIT_LON)
        dist_to_entry = self._haversine_distance(lat, lon, settings.DEPOT_ENTRY_LAT, settings.DEPOT_ENTRY_LON)
        
        return dist_to_exit <= settings.DEPOT_RADIUS_KM or dist_to_entry <= settings.DEPOT_RADIUS_KM

    def _check_geofence_crossings(self, vehicle_id: str, new_lat: float, new_lon: float, ws_manager) -> None:
        """Визначає перетин воріт депо і фіксує виїзд/заїзд."""
        currently_in_depot = self._is_in_depot(new_lat, new_lon)
        was_in_depot = self.vehicle_in_depot.get(vehicle_id)

        # Ініціалізація початкового стану
        if was_in_depot is None:
            self.vehicle_in_depot[vehicle_id] = currently_in_depot
            return

        if was_in_depot and not currently_in_depot:
            # Вагон виїхав з депо
            print(f"[DISPATCH] Вагон {vehicle_id} ВИЇХАВ з депо (перетнув геозону).")
            # TODO: Зберегти подію виїзду у БД та оновити статус зміни
            # Відправимо подію через WebSocket для логування диспетчеру
            asyncio.create_task(ws_manager.broadcast({
                "type": "GEOFENCE_EVENT",
                "payload": {"vehicle_id": vehicle_id, "event": "DISPATCHED"}
            }))

        elif not was_in_depot and currently_in_depot:
            # Вагон заїхав у депо
            print(f"[DISPATCH] Вагон {vehicle_id} ЗАЇХАВ у депо.")
            asyncio.create_task(ws_manager.broadcast({
                "type": "GEOFENCE_EVENT",
                "payload": {"vehicle_id": vehicle_id, "event": "RETURNED"}
            }))

        self.vehicle_in_depot[vehicle_id] = currently_in_depot

    async def fetch_wialon_data(self, session: aiohttp.ClientSession):
        """Імітація запиту до Wialon API. Тут має бути реальний виклик `core/search_items`."""
        # TODO: Замінити на реальний виклик Wialon API з використанням settings.WIALON_TOKEN
        # params = {"svc": "core/search_items", "params": "...", "sid": "..."}
        # async with session.post(settings.WIALON_HOST, data=params) as resp:
        #     return await resp.json()
        
        # Заглушка для демонстрації:
        return [
            {"id": "tram_3012", "pos": {"y": 46.4825, "x": 30.7233, "s": 15}},
            {"id": "troll_4001", "pos": {"y": 46.4775, "x": 30.7326, "s": 22}}
        ]

    async def polling_loop(self, ws_manager):
        """Нескінченний цикл опитування."""
        print("Воркер Wialon запущено...")
        async with aiohttp.ClientSession() as session:
            while True:
                try:
                    current_time = time.time()
                    raw_data = await self.fetch_wialon_data(session)
                    
                    for unit in raw_data:
                        vid = unit.get("id")
                        pos_data = unit.get("pos")
                        
                        if not pos_data:
                            continue
                            
                        new_lat = pos_data.get("y")
                        new_lon = pos_data.get("x")
                        reported_speed = pos_data.get("s", 0)

                        # Застосування фільтра РЕБ
                        if self._apply_anti_ew_filter(vid, new_lat, new_lon, current_time):
                            self.active_vehicles[vid] = VehiclePosition(
                                vehicle_id=vid,
                                lat=new_lat,
                                lon=new_lon,
                                speed=reported_speed,
                                timestamp=current_time,
                                status='ACTIVE'
                            )
                        else:
                            print(f"[РЕБ АНОМАЛІЯ] Вагон {vid} заблоковано фільтром.")

                    # Перевірка на таймаути (втрата зв'язку)
                    self._check_offline_timeouts(current_time)

                    # Перевірка геозон виїзду/заїзду
                    for vid, pos in self.active_vehicles.items():
                        self._check_geofence_crossings(vid, pos.lat, pos.lon, ws_manager)

                    # ---> ВІДПРАВКА ДАНИХ ЧЕРЕЗ WEBSOCKET <---
                    # Конвертуємо об'єкти VehiclePosition в словники
                    vehicles_data = {vid: pos.dict() for vid, pos in self.active_vehicles.items()}
                    await ws_manager.broadcast({
                        "type": "TELEMETRY_UPDATE",
                        "payload": vehicles_data
                    })

                except Exception as e:
                    print(f"Помилка поллінгу Wialon: {e}")
                
                # Чекаємо 10 секунд до наступного запиту
                await asyncio.sleep(settings.POLLING_INTERVAL_SEC)

# Глобальний екземпляр сервісу для доступу з інших частин програми
telemetry_service = TelemetryService()