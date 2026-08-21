import asyncio
import math
import time
import json
import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.services.telemetry_adapters import WialonAdapter, get_odessa_route_for_vehicle
from app.services.easyway import easyway_service
from app.core.logging_config import get_logger

logger = get_logger("telemetry_fusion")

def calculate_distance_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    dlat = (lat2 - lat1) * 111139.0
    dlng = (lng2 - lng1) * 76530.0
    return math.hypot(dlat, dlng)

class TelemetryFusionService:
    """
    Гібридний диспетчерський рушій склеювання телеметрії КП «ОМЕТ»:
    1. Швидкий потік (Wialon Remote API): щосекундний GPS (1 запит на всі 170+ вагонів).
    2. Повільний потік (EasyWay Registry): достовірний реєстр маршрутів (1 цикл раз на 45 сек).
    3. Шар кореляції (Spatial & ID Fusion): поєднує GPS трекера із офіційним номером маршруту.
    """
    def __init__(self):
        self.wialon_adapter = WialonAdapter()
        self._route_registry: Dict[str, Dict[str, Any]] = {} # body_num -> {route_number, vehicle_type, etc.}
        self._spatial_tracker_map: Dict[str, str] = {} # wialon_disp_num -> eway_route
        self._last_registry_update = 0.0
        self._registry_lock = asyncio.Lock()
        self._is_running = False

    async def update_easyway_registry(self):
        """Оновлює маршрутну таблицю EasyWay (раз на 45-60 секунд)."""
        now = time.time()
        if now - self._last_registry_update < 40.0:
            return

        async with self._registry_lock:
            now = time.time()
            if now - self._last_registry_update < 40.0:
                return

            try:
                eway_vehs = await easyway_service.fetch_all_live_vehicles()
                if not eway_vehs:
                    return

                # Отримуємо свіжий зріз Wialon для просторової прив'язки
                wialon_vehs = await self.wialon_adapter.fetch_vehicles()
                
                new_spatial_map: Dict[str, Dict[str, Any]] = {}
                
                # Просторова кореляція між точками EasyWay та бортами Wialon (пошук найближчого < 80м)
                for ew in eway_vehs:
                    ew_lat, ew_lng = float(ew["lat"]), float(ew["lng"])
                    ew_route = str(ew["route_number"])
                    ew_type = ew.get("vehicle_type", "TRAM")
                    is_accessible = bool(ew.get("is_accessible"))
                    has_wifi = bool(ew.get("has_wifi"))
                    has_aircond = bool(ew.get("has_aircond"))

                    best_wialon_disp = None
                    min_dist = 100.0 # макс 100м для збігу

                    for wi in wialon_vehs:
                        dist = calculate_distance_meters(ew_lat, ew_lng, float(wi["lat"]), float(wi["lng"]))
                        if dist < min_dist:
                            min_dist = dist
                            best_wialon_disp = wi["display_name"]

                    if best_wialon_disp:
                        new_spatial_map[best_wialon_disp] = {
                            "route_number": ew_route,
                            "route_id": ew_route,
                            "vehicle_type": ew_type,
                            "is_accessible": is_accessible,
                            "has_wifi": has_wifi,
                            "has_aircond": has_aircond,
                            "matched_at": now
                        }

                if new_spatial_map:
                    # Оновлюємо постійну пам'ять
                    self._spatial_tracker_map.update(new_spatial_map)
                    self._last_registry_update = now
                    logger.info(f"🔄 [FUSION] Синхронізовано {len(new_spatial_map)} бортів Wialon з маршрутами EasyWay (Всього в реєстрі: {len(self._spatial_tracker_map)})")

            except Exception as e:
                logger.error(f"❌ [FUSION] Помилка оновлення реєстру EasyWay: {e}")

    async def get_fused_telemetry(self) -> List[Dict[str, Any]]:
        """
        Повертає повний живий флот КП «ОМЕТ» (170+ бортів) із 100% точними GPS-координатами Wialon
        та офіційними достовірними номерами маршрутів EasyWay.
        """
        # 1. Фонове оновлення реєстру EasyWay раз на 45 сек
        if time.time() - self._last_registry_update > 45.0:
            asyncio.create_task(self.update_easyway_registry())

        # 2. Отримуємо свіжий швидкий GPS з Wialon
        wialon_vehs = await self.wialon_adapter.fetch_vehicles()
        if not wialon_vehs:
            # Якщо Wialon тимчасово недоступний — фолбек на прямий EasyWay
            return await easyway_service.fetch_all_live_vehicles()

        fused_list: List[Dict[str, Any]] = []
        now_ms = int(time.time() * 1000)

        for w in wialon_vehs:
            disp_name = w["display_name"]
            v_id = w["vehicle_id"]
            is_service = bool(w.get("is_service"))

            # Якщо це спецтехніка
            if is_service:
                fused_list.append(w)
                continue

            # Шукаємо офіційний номер маршруту з EasyWay реєстру
            reg_info = self._spatial_tracker_map.get(disp_name)
            if reg_info:
                route_num = reg_info["route_number"]
                v_type = reg_info["vehicle_type"]
                is_accessible = reg_info.get("is_accessible", False)
                has_wifi = reg_info.get("has_wifi", False)
                has_aircond = reg_info.get("has_aircond", False)
            else:
                # Якщо вагон новий / на маневрах у депо
                route_num = get_odessa_route_for_vehicle(disp_name, w.get("vehicle_type", "TRAM"), w["lat"], w["lng"])
                v_type = w.get("vehicle_type", "TRAM")
                is_accessible = False
                has_wifi = False
                has_aircond = False

            fused_list.append({
                "vehicle_id": disp_name or v_id,
                "display_name": f"Борт {disp_name}",
                "route_id": route_num,
                "route_number": route_num,
                "duty_number": 1,
                "vehicle_type": v_type,
                "is_service": False,
                "is_accessible": is_accessible,
                "has_wifi": has_wifi,
                "has_aircond": has_aircond,
                "lat": w["lat"],
                "lng": w["lng"],
                "speed": w["speed"],
                "heading": w["heading"],
                "deviation_min": 0.0,
                "status": "ON_ROUTE" if w["speed"] > 1.0 else "STANDING",
                "source": "WIALON+EWAY",
                "last_updated": w.get("last_updated", now_ms)
            })

        return fused_list

telemetry_fusion = TelemetryFusionService()
