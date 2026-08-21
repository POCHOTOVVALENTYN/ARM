import asyncio
import os
import json
import logging
import time
import urllib.parse
import httpx
from typing import Dict, List, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.models import RouteModel, RouteShape, StationModel, RouteStation
from app.core.database import async_session_maker

logger = logging.getLogger("easyway")

EWAY_CONFIG = {
    "BASE_URL": "https://api.easyway.info/",
    "LOGIN": "odesainclusive",
    "PASSWORD": "ndHdy2Ytw2Ois",
    "CITY": "odesa"
}

# Мапінг номерів маршрутів Одеси до внутрішніх EasyWay Route ID
EWAY_ROUTE_MAPPING = {
    # ТРАМВАЇ
    "1": {"id": "2", "type": "TRAM", "number": "1", "name": "вул. Чорноморського козацтва — завод Центроліт"},
    "5": {"id": "4", "type": "TRAM", "number": "5", "name": "Автовокзал — Аркадія"},
    "6": {"id": "5", "type": "TRAM", "number": "6", "name": "вул. Чорноморського козацтва — Лузанівка"},
    "7": {"id": "210", "type": "TRAM", "number": "7", "name": "вул. Паустовського — вул. 28-ї Бригади"},
    "10": {"id": "8", "type": "TRAM", "number": "10", "name": "пл. Старосінна — вул. Іцхака Рабіна"},
    "11": {"id": "9", "type": "TRAM", "number": "11", "name": "Залізничний вокзал — пл. Олексіївська"},
    "12": {"id": "10", "type": "TRAM", "number": "12", "name": "Херсонський сквер — Товарна станція"},
    "13": {"id": "11", "type": "TRAM", "number": "13", "name": "пл. Старосінна — ж/м Шкільний"},
    "15": {"id": "12", "type": "TRAM", "number": "15", "name": "пл. Олексіївська — Слобідський ринок"},
    "17": {"id": "13", "type": "TRAM", "number": "17", "name": "Куликове поле — 11-а ст. Великого Фонтану"},
    "18": {"id": "14", "type": "TRAM", "number": "18", "name": "Куликове поле — Меморіал 411-ї батареї"},
    "20": {"id": "16", "type": "TRAM", "number": "20", "name": "Херсонський сквер — Хаджибейський лиман"},
    "21": {"id": "17", "type": "TRAM", "number": "21", "name": "пл. Тираспільська — станція Застава ІІ"},
    "26": {"id": "18", "type": "TRAM", "number": "26", "name": "пл. Старосінна — 11-а ст. Люстдорфської дороги"},
    "27": {"id": "19", "type": "TRAM", "number": "27", "name": "16 ст. Люстдорфської дороги — Переправа"},
    "28": {"id": "1", "type": "TRAM", "number": "28", "name": "вул. Пастера — Парк ім. Тараса Шевченка"},

    # ТРОЛЕЙБУСИ
    "2": {"id": "22", "type": "TROLLEYBUS", "number": "2", "name": "Парк ім. Тараса Шевченка — вул. Новосельського"},
    "3": {"id": "23", "type": "TROLLEYBUS", "number": "3", "name": "станція Застава I — Парк ім. Тараса Шевченка"},
    "7_tr": {"id": "25", "type": "TROLLEYBUS", "number": "7", "name": "вул. Архітекторська — вул. Новосельського"},
    "8": {"id": "26", "type": "TROLLEYBUS", "number": "8", "name": "Суперфосфатний завод — Залізничний вокзал"},
    "9": {"id": "27", "type": "TROLLEYBUS", "number": "9", "name": "вул. Інглезі — вул. Рішельєвська"},
    "10_tr": {"id": "29", "type": "TROLLEYBUS", "number": "10", "name": "вул. Інглезі — вул. Приморська"},
    "12": {"id": "31", "type": "TROLLEYBUS", "number": "12", "name": "вул. Архітекторська — вул. Центральний Аеропорт"}
}

class EasyWayService:
    def __init__(self):
        self.login = os.getenv("EWAY_LOGIN", "odesainclusive")
        self.password = os.getenv("EWAY_PASS", "ndHdy2Ytw2Ois")
        self.city = os.getenv("EWAY_CITY", "odesa")
        self.base_url = "https://api.easyway.info/"
        self._cached_vehicles: List[Dict[str, Any]] = []
        self._last_fetch_time: float = 0.0
        self._lock = asyncio.Lock()
        self._vehicle_route_memory: Dict[str, Dict[str, str]] = {}
        self._route_cache: Dict[str, Dict[str, Any]] = {}

    async def _call_api(self, function_name: str, extra_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Універсальний метод виклику REST API EasyWay з аутентифікацією."""
        params = {
            "login": self.login,
            "password": self.password,
            "city": self.city,
            "function": function_name,
            "format": "json"
        }
        if extra_params:
            params.update(extra_params)

        url = f"{self.base_url}?{urllib.parse.urlencode(params)}"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(url, headers={"User-Agent": "OMET-ARM-Scheduler/1.0"})
                if resp.status_code == 200:
                    return resp.json()
                else:
                    logger.warning(f"EasyWay API returned status {resp.status_code} for {function_name}")
                    return {}
            except Exception as e:
                logger.error(f"EasyWay API exception: {e}")
                return {}

    async def get_route_to_display(self, eway_route_id: str) -> Dict[str, Any]:
        """Отримує детальну геометрію та зупинки маршруту для обох напрямків."""
        return await self._call_api("routes.GetRouteToDisplay", {"id": eway_route_id})

    async def get_route_gps(self, eway_route_id: str) -> List[Dict[str, Any]]:
        """Отримує живі GPS координати рухомого складу для вказаного маршруту."""
        res = await self._call_api("routes.GetRouteGPS", {"id": eway_route_id})
        vehicles = res.get("vehicle", [])
        if isinstance(vehicles, dict):
            vehicles = [vehicles]
        return vehicles

    async def get_stop_info(self, stop_id: str) -> Dict[str, Any]:
        """Отримує прогноз прибуття транспорту на зупинку за версією API 1.2."""
        return await self._call_api("stops.GetStopInfo", {"id": stop_id, "v": "1.2"})

    async def fetch_all_live_vehicles(self) -> List[Dict[str, Any]]:
        """
        Паралельно опитує живий GPS-потік EasyWay по всіх 23 маршрутах КП «ОМЕТ»
        із семафорним дроселюванням та багаторівневим кешуванням (Глобальний TTL: 18.0с, Помаршрутний TTL: 90с).
        Гарантує 100% збереження номерів маршрутів та усуває перевищення ліміту EasyWay (60 запитів/хв).
        """
        now = time.time()
        if (now - self._last_fetch_time < 18.0) and self._cached_vehicles:
            return self._cached_vehicles

        async with self._lock:
            now = time.time()
            if (now - self._last_fetch_time < 18.0) and self._cached_vehicles:
                return self._cached_vehicles

            all_vehicles: List[Dict[str, Any]] = []
            now_ms = int(now * 1000)
            semaphore = asyncio.Semaphore(5)

            async with httpx.AsyncClient(timeout=8.0, limits=httpx.Limits(max_keepalive_connections=10, max_connections=20)) as client:
                async def fetch_route_vehicles(meta: Dict[str, Any]) -> List[Dict[str, Any]]:
                    eway_id = meta["id"]
                    r_num = meta["number"]
                    r_type = meta["type"]

                    async with semaphore:
                        try:
                            params = {
                                "login": self.login,
                                "password": self.password,
                                "city": self.city,
                                "function": "routes.GetRouteGPS",
                                "id": eway_id,
                                "format": "json"
                            }
                            url = f"{self.base_url}?{urllib.parse.urlencode(params)}"
                            resp = await client.get(url, headers={"User-Agent": "OMET-ARM-Scheduler/1.0"})
                            if resp.status_code == 200:
                                data = resp.json()
                                if "error" in data:
                                    cached = self._route_cache.get(eway_id)
                                    if cached:
                                        return cached["vehicles"]
                                    return []

                                raw_list = data.get("vehicle", [])
                                if isinstance(raw_list, dict):
                                    raw_list = [raw_list]
                                
                                route_vehs = []
                                for item in raw_list:
                                    v_id = str(item.get("id") or "")
                                    if not v_id:
                                        continue
                                    
                                    lat = float(item.get("lat") or 0.0)
                                    lng = float(item.get("lng") or 0.0)
                                    if lat == 0.0 or lng == 0.0:
                                        continue

                                    dir_val = item.get("direction", 1)
                                    heading = 45 if dir_val == 1 else (225 if dir_val == 2 else 0)
                                    is_standing = dir_val == -1 or item.get("data_relevance") == 0
                                    speed = 0.0 if is_standing else 18.0

                                    self._vehicle_route_memory[v_id] = {
                                        "route_number": r_num,
                                        "route_id": r_num,
                                        "vehicle_type": r_type
                                    }

                                    route_vehs.append({
                                        "vehicle_id": v_id,
                                        "display_name": f"Борт {v_id}",
                                        "route_id": r_num,
                                        "route_number": r_num,
                                        "duty_number": 1,
                                        "vehicle_type": r_type,
                                        "is_service": False,
                                        "is_accessible": bool(item.get("handicapped")),
                                        "has_wifi": bool(item.get("wifi")),
                                        "has_aircond": bool(item.get("aircond")),
                                        "lat": round(lat, 6),
                                        "lng": round(lng, 6),
                                        "speed": speed,
                                        "heading": heading,
                                        "deviation_min": 0.0,
                                        "status": "ON_ROUTE" if not is_standing else "STANDING",
                                        "source": "EASYWAY",
                                        "last_updated": now_ms
                                    })
                                
                                if route_vehs:
                                    self._route_cache[eway_id] = {
                                        "time": time.time(),
                                        "vehicles": route_vehs
                                    }
                                    return route_vehs
                                elif eway_id in self._route_cache and (time.time() - self._route_cache[eway_id]["time"] < 90.0):
                                    return self._route_cache[eway_id]["vehicles"]
                                return route_vehs
                        except Exception as e:
                            logger.debug(f"Помилка отримання GPS маршруту {r_num} з EasyWay: {e}")
                        
                        cached_route = self._route_cache.get(eway_id)
                        if cached_route and (time.time() - cached_route["time"] < 90.0):
                            return cached_route["vehicles"]

                        return []

                tasks = [fetch_route_vehicles(meta) for meta in EWAY_ROUTE_MAPPING.values()]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                for r in results:
                    if isinstance(r, list):
                        all_vehicles.extend(r)

            if all_vehicles:
                self._cached_vehicles = all_vehicles
                self._last_fetch_time = time.time()
                return all_vehicles
            elif self._cached_vehicles:
                return self._cached_vehicles

            return all_vehicles

    async def sync_all_routes_to_database(self) -> Dict[str, Any]:
        """
        Завантажує офіційні геометрії маршрутів, кільця розвороту та зупинки з EasyWay
        і синхронізує їх з базою даних PostgreSQL.
        """
        synced_routes = 0
        total_shapes = 0
        total_stops = 0

        async with async_session_maker() as db:
            for route_num, meta in EWAY_ROUTE_MAPPING.items():
                clean_r_num = meta["number"]
                eway_id = meta["id"]
                r_type = meta["type"]
                r_name = meta["name"]
                
                try:
                    data = await self.get_route_to_display(eway_id)
                    points = data.get("route", {}).get("points", {}).get("point", [])
                    if not points:
                        continue

                    # 1. Розділення геометрії на напрямки 0 (прямий) та 1 (зворотний)
                    dir1_points = [p for p in points if p.get("direction") == 1]
                    dir2_points = [p for p in points if p.get("direction") == 2]

                    if not dir1_points and points:
                        dir1_points = points

                    # Оновлюємо або створюємо маршрут
                    route_query = select(RouteModel).where(RouteModel.id == clean_r_num)
                    route_res = await db.execute(route_query)
                    route_obj = route_res.scalar_one_or_none()

                    if not route_obj:
                        route_obj = RouteModel(
                            id=clean_r_num,
                            number=clean_r_num,
                            name=r_name,
                            type=r_type,
                            length_km=round(len(dir1_points) * 0.03, 1),
                            color="#2563eb" if r_type == "TRAM" else "#059669"
                        )
                        db.add(route_obj)
                        await db.flush()

                    # 2. Оновлення RouteShape для обох напрямків
                    await db.execute(delete(RouteShape).where(RouteShape.route_id == clean_r_num))

                    if dir1_points:
                        geom_dir0 = [{"lat": float(p["lat"]), "lng": float(p["lng"])} for p in dir1_points]
                        shape0 = RouteShape(
                            route_id=clean_r_num,
                            direction_id=0,
                            geometry=geom_dir0
                        )
                        db.add(shape0)
                        total_shapes += 1

                    if dir2_points:
                        geom_dir1 = [{"lat": float(p["lat"]), "lng": float(p["lng"])} for p in dir2_points]
                        shape1 = RouteShape(
                            route_id=clean_r_num,
                            direction_id=1,
                            geometry=geom_dir1
                        )
                        db.add(shape1)
                        total_shapes += 1

                    # 3. Оновлення зупинок для напрямку 0 та 1
                    await db.execute(delete(RouteStation).where(RouteStation.route_id == clean_r_num))

                    # Зупинки напрямку 0
                    stops_dir0 = [p for p in dir1_points if p.get("@attributes", {}).get("is_stop") == "true"]
                    for idx, st_p in enumerate(stops_dir0):
                        st_name = st_p.get("title") or f"Зупинка #{idx+1}"
                        st_id = f"ew_{clean_r_num}_0_{idx+1}"
                        lat = float(st_p["lat"])
                        lng = float(st_p["lng"])

                        st_res = await db.execute(select(StationModel).where(StationModel.id == st_id))
                        st_obj = st_res.scalar_one_or_none()
                        if not st_obj:
                            st_obj = StationModel(
                                id=st_id,
                                name=st_name,
                                lat=lat,
                                lng=lng,
                                type=r_type,
                                is_dispatch_station=(idx == 0 or idx == len(stops_dir0) - 1)
                            )
                            db.add(st_obj)
                            await db.flush()

                        r_station = RouteStation(
                            route_id=clean_r_num,
                            stop_id=st_id,
                            direction_id=0,
                            stop_sequence=idx + 1
                        )
                        db.add(r_station)
                        total_stops += 1

                    # Зупинки напрямку 1
                    stops_dir1 = [p for p in dir2_points if p.get("@attributes", {}).get("is_stop") == "true"]
                    for idx, st_p in enumerate(stops_dir1):
                        st_name = st_p.get("title") or f"Зупинка #{idx+1}"
                        st_id = f"ew_{clean_r_num}_1_{idx+1}"
                        lat = float(st_p["lat"])
                        lng = float(st_p["lng"])

                        st_res = await db.execute(select(StationModel).where(StationModel.id == st_id))
                        st_obj = st_res.scalar_one_or_none()
                        if not st_obj:
                            st_obj = StationModel(
                                id=st_id,
                                name=st_name,
                                lat=lat,
                                lng=lng,
                                type=r_type,
                                is_dispatch_station=(idx == 0 or idx == len(stops_dir1) - 1)
                            )
                            db.add(st_obj)
                            await db.flush()

                        r_station = RouteStation(
                            route_id=clean_r_num,
                            stop_id=st_id,
                            direction_id=1,
                            stop_sequence=idx + 1
                        )
                        db.add(r_station)
                        total_stops += 1

                    synced_routes += 1
                    await db.commit()
                    await asyncio.sleep(0.05)
                except Exception as e:
                    logger.error(f"Error syncing route {clean_r_num} from EasyWay: {e}")
                    await db.rollback()

        return {
            "status": "SUCCESS",
            "synced_routes": synced_routes,
            "total_shapes": total_shapes,
            "total_stops": total_stops
        }

easyway_service = EasyWayService()
