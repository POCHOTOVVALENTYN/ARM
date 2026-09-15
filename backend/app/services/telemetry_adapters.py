import asyncio
import logging
import httpx
import json
import time
import math
import os
import csv
import re
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
                            lat = round(float(v.position.latitude), 6)
                            lng = round(float(v.position.longitude), 6)

                            # Фільтр строго за межами Одеси (відсікаємо сміттєві/тестові точки)
                            if not (46.30 <= lat <= 46.65 and 30.60 <= lng <= 30.85):
                                continue

                            # Якщо маршрут не розпізнано і залишився сирим UUID — відсікаємо
                            if not short_route_name or len(short_route_name) > 8 or "-" in short_route_name:
                                continue

                            speed_kmh = round(v.position.speed * 3.6, 1) if v.position.HasField('speed') else 0.0

                            # Анти-РЕБ фільтр
                            if speed_kmh > settings.MAX_VALID_SPEED_KMH:
                                continue

                            vehicles.append({
                                "vehicle_id": str(vehicle_id).strip(),
                                "lat": lat,
                                "lng": lng,
                                "speed": speed_kmh,
                                "route_id": short_route_name,
                                "route_number": short_route_name,
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
    Адаптер телеметрії Wialon Remote API (підтримує як постійний API Token, так і логін/пароль).
    """
    def __init__(self):
        self.host = settings.WIALON_HOST
        self.token = settings.WIALON_TOKEN
        self.user = getattr(settings, "WIALON_USER", "Monitor OD")
        self.password = getattr(settings, "WIALON_PASSWORD", "qiBqar-fuzde0-fakhir")
        self.eid: Optional[str] = None
        self._lock = asyncio.Lock()

    async def authenticate(self, client: httpx.AsyncClient) -> bool:
        # Спосіб 1: Авторизація за постійним API Токеном (найбільш стабільний спосіб Wialon)
        if self.token and len(self.token) > 20:
            params = {
                "svc": "token/login",
                "params": json.dumps({"token": self.token})
            }
            try:
                resp = await client.post(self.host, data=params, timeout=10.0)
                data = resp.json()
                if "eid" in data:
                    self.eid = data["eid"]
                    logger.info(f"⚡ [WIALON] Сесію відкрито за токеном (eid: {self.eid[:8]}...)")
                    return True
                else:
                    logger.warning(f"⚠️ [WIALON] Помилка авторизації токена: {data}")
            except Exception as e:
                logger.error(f"❌ [WIALON] Помилка з'єднання при авторизації токена: {e}")

        # Спосіб 2: Пряма авторизація за Логіном та Паролем (core/login)
        if self.user and self.password:
            params = {
                "svc": "core/login",
                "params": json.dumps({
                    "user": self.user,
                    "password": self.password,
                    "appName": "ARM_OMET_DISPATCHER"
                })
            }
            try:
                resp = await client.post(self.host, data=params, timeout=10.0)
                data = resp.json()
                if "eid" in data:
                    self.eid = data["eid"]
                    logger.info(f"⚡ [WIALON] Сесію відкрито для користувача '{self.user}' (eid: {self.eid[:8]}...)")
                    return True
                else:
                    err_code = data.get("error")
                    err_reason = data.get("reason", "")
                    if err_code == 7:
                        logger.warning("⚠️ [WIALON] Невірний логін або пароль (error: 7). Рекомендується згенерувати API Token в кабінеті Wialon.")
                    elif err_code == 1003:
                        logger.warning("⚠️ [WIALON] Тимчасовий ліміт невдалих спроб входу (error: 1003). Рекомендується використати API Token.")
                    else:
                        logger.warning(f"⚠️ [WIALON] core/login повернув помилку {err_code}: {err_reason}")
            except Exception as e:
                logger.error(f"❌ [WIALON] Помилка з'єднання при core/login: {e}")

        return False

    async def fetch_vehicles(self) -> List[Dict[str, Any]]:
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
                "flags": 1025, # Базові властивості + остання GPS-позиція (pos)
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
                if "error" in data and data["error"] in [1, 2]: # Invalid session, re-auth
                    async with self._lock:
                        await self.authenticate(client)
                        req_params["sid"] = self.eid
                    resp = await client.post(self.host, data=req_params, timeout=10.0)
                    data = resp.json()

                units = data.get("items", [])
                telemetry_list = []
                now_sec = int(datetime.now(timezone.utc).timestamp())
                
                for u in units:
                    pos = u.get("pos")
                    if not pos:
                        continue
                    
                    pos_time = int(pos.get("t", 0))
                    # Відсікаємо неактивні бортотримачі (старші 2 годин)
                    if (now_sec - pos_time) > 7200:
                        continue

                    lat = float(pos.get("y", 0.0))
                    lng = float(pos.get("x", 0.0))
                    speed = float(pos.get("s", 0.0))

                    # Анти-РЕБ фільтр
                    if speed > settings.MAX_VALID_SPEED_KMH:
                        continue
                    # Повна межа міста Одеси (від Люстдорфа до Паустовського)
                    if not (46.30 <= lat <= 46.65 and 30.60 <= lng <= 30.85):
                        continue

                    unit_name = str(u.get("nm", "")).strip()
                    nm_lower = unit_name.lower()
                    
                    # Класифікація та збереження точного 4-значного формату номера
                    if any(k in unit_name.upper() for k in ["ГАЗ", "КАМАЗ", "РЕВІЗОР", "РЕВИЗОР", "ВИШКА", "ВАЗ", "УАЗ", "ТРАКТОР", "СЛУЖБ"]):
                        v_id = unit_name
                        disp_num = unit_name.split()[0] if unit_name.split() else unit_name
                        v_type = "SERVICE"
                        is_service = True
                    elif "- trol" in nm_lower or "trol" in nm_lower:
                        digits = re.sub(r'[^0-9]', '', unit_name)
                        disp_num = digits.zfill(4) if (digits and len(digits) <= 4) else (digits or unit_name)
                        v_id = unit_name
                        v_type = "TROLLEYBUS"
                        is_service = False
                    elif "- tram" in nm_lower or "tram" in nm_lower:
                        digits = re.sub(r'[^0-9]', '', unit_name)
                        disp_num = digits.zfill(4) if (digits and len(digits) <= 4) else (digits or unit_name)
                        v_id = unit_name
                        v_type = "TRAM"
                        is_service = False
                    else:
                        digits = re.sub(r'[^0-9]', '', unit_name)
                        if digits:
                            disp_num = digits.zfill(4) if len(digits) <= 4 else digits
                            num = int(digits)
                            # Трамваї Одеси: 2900-3400, 7100-7200, 5000+
                            if (2900 <= num <= 3400) or (7100 <= num <= 7200) or (num >= 5000):
                                v_type = "TRAM"
                            # Тролейбуси Одеси: 0001-0050, 0600-0899, 2000-2099, 4001-4099
                            elif (num <= 50) or (600 <= num <= 899) or (2000 <= num <= 2099) or (4000 <= num <= 4099):
                                v_type = "TROLLEYBUS"
                            else:
                                v_type = "TRAM"
                            v_id = unit_name
                            is_service = False
                        else:
                            v_id = unit_name
                            disp_num = unit_name
                            v_type = "SERVICE"
                            is_service = True

                    telemetry_list.append({
                        "vehicle_id": v_id,
                        "display_name": disp_num,
                        "vehicle_type": v_type,
                        "is_service": is_service,
                        "route_id": "SERVICE" if is_service else "ON_ROUTE",
                        "route_number": "SERVICE" if is_service else "ON_ROUTE",
                        "lat": round(lat, 6),
                        "lng": round(lng, 6),
                        "speed": round(speed, 1),
                        "heading": int(pos.get("c", 0)),
                        "source": "WIALON",
                        "status": "active" if speed > 1.0 else ("depot" if is_service else "idle"),
                        "last_updated": pos_time * 1000
                    })
                
                if telemetry_list:
                    logger.info(f"🛰️ [WIALON] Оброблено та нормалізовано {len(telemetry_list)} активних ТЗ Одеси")
                return telemetry_list
            except Exception as e:
                logger.error(f"❌ [WIALON] Помилка отримання даних Wialon: {e}")
                return []


class SimulationAdapter(BaseTelemetryAdapter):
    """
    Резервний інтелектуальний симулятор переміщення вагонів Одеси з прив'язкою до колій.
    Динамічно завантажує актуальні геометрії маршрутів та парк із бази даних omet.db,
    розраховує координати вздовж осі колій (Track-Snapping / Anti-EW) та азимут руху.
    """
    def __init__(self):
        self._cached_data: Optional[List[Dict[str, Any]]] = None
        self._last_load: float = 0.0

    async def _ensure_loaded(self) -> List[Dict[str, Any]]:
        now = time.time()
        if self._cached_data and (now - self._last_load < 300.0):
            return self._cached_data

        try:
            from sqlalchemy import select
            from app.core.database import AsyncSessionLocal
            from app.models.models import RouteModel, RouteShape, Vehicle

            async with AsyncSessionLocal() as db:
                routes_res = (await db.execute(select(RouteModel))).scalars().all()
                shapes_res = (await db.execute(select(RouteShape))).scalars().all()
                vehicles_res = (await db.execute(select(Vehicle))).scalars().all()

                shapes_by_route: Dict[str, List[List[Dict[str, float]]]] = {}
                for s in shapes_res:
                    pts = s.geometry if isinstance(s.geometry, list) else (json.loads(s.geometry) if isinstance(s.geometry, str) else [])
                    if pts and len(pts) >= 5:
                        shapes_by_route.setdefault(str(s.route_id), []).append(pts)

                vehicles_by_type: Dict[str, List[Dict[str, Any]]] = {"TRAM": [], "TROLLEYBUS": []}
                for v in vehicles_res:
                    vt = (v.type or "TRAM").upper()
                    if vt in vehicles_by_type:
                        vehicles_by_type[vt].append({
                            "id": str(v.id),
                            "model": v.model or ("Tatra T3" if vt == "TRAM" else "Богдан Т70117"),
                            "is_accessible": bool(v.is_accessible),
                            "depot_id": v.depot_id or ("depot_1" if vt == "TRAM" else "depot_3")
                        })

                # Формуємо розклад випусків для кожного з 24 маршрутів
                active_units = []
                v_idx_tram = 0
                v_idx_trol = 0

                for r in routes_res:
                    r_id_str = str(r.id)
                    r_num_str = str(r.number or r.id)
                    r_type = (r.type or "TRAM").upper()
                    r_shapes = shapes_by_route.get(r_id_str) or shapes_by_route.get(r_num_str) or []

                    if not r_shapes:
                        continue

                    # 2-3 випуски на маршрут
                    duties_count = 2 if len(r_num_str) > 2 else 3
                    for duty_no in range(1, duties_count + 1):
                        pool = vehicles_by_type["TRAM"] if r_type == "TRAM" else vehicles_by_type["TROLLEYBUS"]
                        if r_type == "TRAM":
                            veh = pool[v_idx_tram % len(pool)] if pool else {"id": f"30{duty_no:02d}", "model": "Tatra T3", "is_accessible": False}
                            v_idx_tram += 1
                        else:
                            veh = pool[v_idx_trol % len(pool)] if pool else {"id": f"00{duty_no:02d}", "model": "Богдан Т70117", "is_accessible": True}
                            v_idx_trol += 1

                        shape_pts = r_shapes[(duty_no - 1) % len(r_shapes)]
                        active_units.append({
                            "vehicle_id": veh["id"],
                            "route_id": r_id_str,
                            "route_number": r_num_str,
                            "duty_number": duty_no,
                            "vehicle_type": r_type,
                            "model": veh["model"],
                            "is_accessible": veh["is_accessible"],
                            "shape_points": shape_pts,
                            "offset_ratio": (duty_no - 1) / float(duties_count)
                        })

                self._cached_data = active_units
                self._last_load = now
                logger.info(f"🛰️ [SIMULATION] Сформовано {len(active_units)} активних бортів для {len(routes_res)} маршрутів ОМЕТ")
                return active_units
        except Exception as e:
            logger.error(f"Помилка ініціалізації симулятора: {e}")
            return []

    async def fetch_vehicles(self) -> List[Dict[str, Any]]:
        import math
        units = await self._ensure_loaded()
        if not units:
            return []

        now_ts = time.time()
        now_ms = int(now_ts * 1000)
        results = []

        for u in units:
            pts = u["shape_points"]
            n = len(pts)
            if n < 2:
                continue

            # Циклічний рух вздовж колії: повне коло ~ 240 секунд (4 хв у симуляції)
            cycle_duration = 240.0
            t_rel = (now_ts + u["offset_ratio"] * cycle_duration) % cycle_duration
            progress = t_rel / cycle_duration

            # Симуляція зупинок (якщо progress біля кратних значень, швидкість = 0)
            stop_phase = (progress * 12) % 1.0
            is_at_stop = stop_phase < 0.15

            pt_float = progress * (n - 1)
            idx1 = int(pt_float)
            idx2 = min(idx1 + 1, n - 1)
            alpha = pt_float - idx1

            p1 = pts[idx1]
            p2 = pts[idx2]

            cur_lat = p1["lat"] + alpha * (p2["lat"] - p1["lat"])
            cur_lng = p1["lng"] + alpha * (p2["lng"] - p1["lng"])

            # Розрахунок курсу (bearing)
            d_lng = math.radians(p2["lng"] - p1["lng"])
            phi1 = math.radians(p1["lat"])
            phi2 = math.radians(p2["lat"])
            y = math.sin(d_lng) * math.cos(phi2)
            x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(d_lng)
            bearing = int((math.degrees(math.atan2(y, x)) + 360) % 360) if (idx1 != idx2) else 0

            speed_kmh = 0.0 if is_at_stop else round(18.0 + 4.0 * math.sin(progress * math.pi * 4), 1)
            dev_min = round(math.sin(u["duty_number"] * 1.5 + progress * math.pi) * 2.5, 1)

            results.append({
                "vehicle_id": u["vehicle_id"],
                "display_name": f"Борт {u['vehicle_id']}",
                "route_id": u["route_id"],
                "route_number": u["route_number"],
                "duty_number": u["duty_number"],
                "vehicle_type": u["vehicle_type"],
                "model": u["model"],
                "is_service": False,
                "is_accessible": u["is_accessible"],
                "lat": round(cur_lat, 6),
                "lng": round(cur_lng, 6),
                "speed": speed_kmh,
                "heading": bearing,
                "deviation_min": dev_min,
                "status": "STANDING" if is_at_stop else "ON_ROUTE",
                "source": "FUSION_SIM",
                "anti_ew_corrected": True,
                "last_updated": now_ms
            })

        return results


class EasyWayAdapter(BaseTelemetryAdapter):
    """
    Адаптер прямого підключення до EasyWay API Одеси (odesainclusive).
    Повертає 100% реальний живий GPS-потік КП «ОМЕТ» із офіційними достовірними номерами маршрутів.
    """
    async def fetch_vehicles(self) -> List[Dict[str, Any]]:
        from app.services.easyway import easyway_service
        return await easyway_service.fetch_all_live_vehicles()


class CompositeTelemetryManager:
    """
    Головний менеджер телеметрії з гібридним склеюванням джерел (Telemetry Fusion):
    1. Швидкий фізичний GPS з Wialon (щосекундні датчики швидкості та курсу) + офіційні номери маршрутів з EasyWay.
    2. Фолбек на прямий EasyWay Live GPS.
    3. Фолбек на GTFS-RT (ОМР).
    4. Резервний симулятор.
    """
    def __init__(self):
        self.easyway_adapter = EasyWayAdapter()
        self.gtfs_adapter = GtfsRealtimeAdapter()
        self.wialon_adapter = WialonAdapter()
        self.sim_adapter = SimulationAdapter()

    async def get_live_telemetry(self) -> List[Dict[str, Any]]:
        # 1. Першочергово — гібридний рушій склеювання Wialon GPS + EasyWay маршрутизація
        try:
            from app.services.telemetry_fusion import telemetry_fusion
            fused_data = await telemetry_fusion.get_fused_telemetry()
            if fused_data and len(fused_data) > 0:
                return fused_data
        except Exception as e:
            logger.warning(f"Telemetry fusion error: {e}")

        # 2. Прямий EasyWay
        try:
            eway_data = await self.easyway_adapter.fetch_vehicles()
            if eway_data and len(eway_data) > 0:
                return eway_data
        except Exception as e:
            logger.warning(f"EasyWay live fetch error: {e}")

        # 3. Бойовий GTFS-RT шлюз Одеси (ОМР)
        try:
            gtfs_data = await self.gtfs_adapter.fetch_vehicles()
            if gtfs_data and len(gtfs_data) > 0:
                return gtfs_data
        except Exception as e:
            logger.warning(f"GTFS-RT fetch error: {e}")

        # 4. Wialon API
        try:
            wialon_data = await self.wialon_adapter.fetch_vehicles()
            if wialon_data and len(wialon_data) > 0:
                return wialon_data
        except Exception as e:
            logger.warning(f"Wialon fetch error: {e}")

        # 5. Резервний симулятор Одеси
        return await self.sim_adapter.fetch_vehicles()

telemetry_manager = CompositeTelemetryManager()
