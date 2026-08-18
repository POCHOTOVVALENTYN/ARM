import asyncio
import logging
import httpx
import json
import os
import csv
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from google.transit import gtfs_realtime_pb2
from app.core.config import settings

logger = logging.getLogger("app.telemetry_adapters")

class BaseTelemetryAdapter(ABC):
    @abstractmethod
    async def fetch_vehicles(self) -> List[Dict[str, Any]]:
        """Отримує сирі координати та параметри руху транспортних засобів."""
        pass

class GtfsRealtimeAdapter(BaseTelemetryAdapter):
    """
    Бойовий адаптер GTFS-Realtime Protocol Buffers шлюзу Одеської міської ради (ОМР).
    """
    def __init__(self):
        self.url = "https://gw.x24.digital/api/od-all/gtfs/v1/download/gtfs-rt-vehicles-pr.pb"
        self.api_key = "a8c6d35e-f2c1-4f72-b902-831fa9215009"
        self.route_map: Dict[str, str] = {}
        self._load_static_routes()

    def _load_static_routes(self):
        possible_dirs = [
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "gtfs_static_data"),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "gtfs_static_data"),
            "/app/gtfs_static_data",
            "gtfs_static_data"
        ]
        gtfs_dir = next((d for d in possible_dirs if os.path.exists(d)), possible_dirs[0])
        routes_file = os.path.join(gtfs_dir, "routes.txt")
        try:
            if os.path.exists(routes_file):
                with open(routes_file, encoding="utf-8-sig") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        self.route_map[row['route_id']] = row['route_short_name'].strip()
                logger.info(f"🗺️ [GTFS-RT] Завантажено мапінг для {len(self.route_map)} маршрутів Одеси")
        except Exception as e:
            logger.error(f"Помилка завантаження routes.txt: {e}")

    async def fetch_vehicles(self) -> List[Dict[str, Any]]:
        headers = {"ApiKey": self.api_key}
        vehicles = []

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(self.url, headers=headers, timeout=8.0)
                if response.status_code == 200:
                    feed = gtfs_realtime_pb2.FeedMessage()
                    feed.ParseFromString(response.content)

                    for entity in feed.entity:
                        if entity.HasField('vehicle'):
                            v = entity.vehicle
                            vehicle_id = v.vehicle.id if v.vehicle.HasField('id') else entity.id
                            gtfs_route_id = v.trip.route_id if v.HasField('trip') else None
                            short_route_name = self.route_map.get(gtfs_route_id) or str(gtfs_route_id or "")

                            speed_kmh = round(v.position.speed * 3.6, 1) if v.position.HasField('speed') else 0.0

                            # Анти-РЕБ фільтр
                            if speed_kmh > settings.MAX_VALID_SPEED_KMH:
                                continue

                            vehicles.append({
                                "vehicle_id": str(vehicle_id).strip(),
                                "lat": round(float(v.position.latitude), 6),
                                "lng": round(float(v.position.longitude), 6),
                                "speed": speed_kmh,
                                "route_id": short_route_name,
                                "heading": round(v.position.bearing, 1) if v.position.HasField('bearing') else 0,
                                "status": "active" if speed_kmh > 0 else "idle",
                                "source": "GTFS-RT",
                                "last_updated": int(datetime.now(timezone.utc).timestamp() * 1000)
                            })
            except Exception as e:
                logger.warning(f"⚠️ Помилка шлюзу GTFS-RT Одеса: {e}")

        return vehicles


class WialonAdapter(BaseTelemetryAdapter):
    """
    Адаптер телеметрії Wialon Remote API (готовий до активації за токеном).
    """
    def __init__(self):
        self.host = settings.WIALON_HOST
        self.token = settings.WIALON_TOKEN
        self.eid: Optional[str] = None
        self._lock = asyncio.Lock()

    async def authenticate(self, client: httpx.AsyncClient) -> bool:
        if not self.token or self.token == "YOUR_WIALON_TOKEN_HERE":
            return False
        params = {
            "svc": "token/login",
            "params": f'{{"token":"{self.token}"}}'
        }
        try:
            resp = await client.post(self.host, params=params, timeout=10.0)
            data = resp.json()
            if "eid" in data:
                self.eid = data["eid"]
                logger.info(f"⚡ [Wialon] Сесію відкрито (eid: {self.eid[:8]}...)")
                return True
            return False
        except Exception as e:
            logger.error(f"Wialon auth error: {e}")
            return False

    async def fetch_vehicles(self) -> List[Dict[str, Any]]:
        if not self.token or self.token == "YOUR_WIALON_TOKEN_HERE":
            return []

        async with httpx.AsyncClient() as client:
            async with self._lock:
                if not self.eid:
                    success = await self.authenticate(client)
                    if not success:
                        return []

            search_params = {
                "spec": {
                    "itemsType": "avl_unit",
                    "propName": "sys_name",
                    "propValueMask": "*",
                    "sortType": "sys_name"
                },
                "force": 1,
                "flags": 1025,
                "from": 0,
                "to": 0
            }
            req_params = {
                "svc": "core/search_items",
                "params": json.dumps(search_params),
                "sid": self.eid
            }

            try:
                resp = await client.post(self.host, data=req_params, timeout=10.0)
                data = resp.json()
                if "error" in data and data["error"] == 1:
                    await self.authenticate(client)
                    req_params["sid"] = self.eid
                    resp = await client.post(self.host, data=req_params, timeout=10.0)
                    data = resp.json()

                units = data.get("items", [])
                telemetry_list = []
                for u in units:
                    pos = u.get("pos")
                    if not pos:
                        continue
                    speed = float(pos.get("s", 0))
                    if speed > settings.MAX_VALID_SPEED_KMH:
                        continue
                    telemetry_list.append({
                        "vehicle_id": str(u.get("nm", "")).strip(),
                        "lat": round(float(pos.get("y", 0.0)), 6),
                        "lng": round(float(pos.get("x", 0.0)), 6),
                        "speed": round(speed, 1),
                        "heading": int(pos.get("c", 0)),
                        "source": "WIALON",
                        "status": "active" if speed > 0 else "idle",
                        "last_updated": int(pos.get("t", 0)) * 1000
                    })
                return telemetry_list
            except Exception as e:
                logger.error(f"Wialon search error: {e}")
                return []


class SimulationAdapter(BaseTelemetryAdapter):
    """
    Резервний інтелектуальний симулятор переміщення вагонів Одеси
    (використовується, коли реальний онлайн-фід порожній / у нічний час).
    """
    def __init__(self):
        self.sample_vehicles = [
            {"vehicle_id": "3012", "route_id": "7", "lat": 46.5824, "lng": 30.7932, "speed": 22.0, "status": "active", "heading": 195},
            {"vehicle_id": "3014", "route_id": "7", "lat": 46.5412, "lng": 30.7610, "speed": 18.5, "status": "active", "heading": 190},
            {"vehicle_id": "3018", "route_id": "7", "lat": 46.4950, "lng": 30.7250, "speed": 24.0, "status": "active", "heading": 210},
            {"vehicle_id": "4015", "route_id": "18", "lat": 46.4668, "lng": 30.7441, "speed": 16.0, "status": "active", "heading": 175},
            {"vehicle_id": "4020", "route_id": "18", "lat": 46.4290, "lng": 30.7558, "speed": 20.0, "status": "active", "heading": 180},
            {"vehicle_id": "5001", "route_id": "28", "lat": 46.4815, "lng": 30.7320, "speed": 15.0, "status": "active", "heading": 90},
            {"vehicle_id": "5005", "route_id": "5", "lat": 46.4295, "lng": 30.7660, "speed": 0.0, "status": "break", "heading": 0},
            {"vehicle_id": "5008", "route_id": "8", "lat": 46.4421, "lng": 30.7012, "speed": 19.0, "status": "active", "heading": 270},
            {"vehicle_id": "5012", "route_id": "9", "lat": 46.4600, "lng": 30.7200, "speed": 17.5, "status": "active", "heading": 45},
            {"vehicle_id": "9901", "route_id": "7", "lat": 46.4678, "lng": 30.7334, "speed": 0.0, "status": "depot", "heading": 0},
        ]

    async def fetch_vehicles(self) -> List[Dict[str, Any]]:
        now_ms = int(datetime.now().timestamp() * 1000)
        current_time_sec = datetime.now().timestamp()
        result = []
        for base in self.sample_vehicles:
            lat_offset = 0.0003 * (base["speed"] > 0) * (0.5 - (current_time_sec % 60) / 60.0)
            lng_offset = 0.0002 * (base["speed"] > 0) * (0.5 - (current_time_sec % 45) / 45.0)
            result.append({
                "vehicle_id": base["vehicle_id"],
                "route_id": base["route_id"],
                "lat": round(base["lat"] + lat_offset, 6),
                "lng": round(base["lng"] + lng_offset, 6),
                "speed": base["speed"],
                "heading": base.get("heading", 0),
                "status": base["status"],
                "source": "SIMULATION",
                "last_updated": now_ms
            })
        return result


class CompositeTelemetryManager:
    """
    Головний менеджер телеметрії з автоматичним перемиканням джерел:
    Wialon -> GTFS-RT (ОМР) -> Симулятор Одеси.
    """
    def __init__(self):
        self.gtfs_adapter = GtfsRealtimeAdapter()
        self.wialon_adapter = WialonAdapter()
        self.sim_adapter = SimulationAdapter()

    async def get_live_telemetry(self) -> List[Dict[str, Any]]:
        # 1. Пробуємо Wialon (якщо токен валідний)
        wialon_data = await self.wialon_adapter.fetch_vehicles()
        if wialon_data:
            return wialon_data

        # 2. Бойовий GTFS-RT шлюз Одеси
        gtfs_data = await self.gtfs_adapter.fetch_vehicles()
        if gtfs_data:
            return gtfs_data

        # 3. Резервний симулятор
        return await self.sim_adapter.fetch_vehicles()

telemetry_manager = CompositeTelemetryManager()
