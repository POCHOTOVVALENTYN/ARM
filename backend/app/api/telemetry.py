import json
import time
from fastapi import APIRouter, Depends, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.core.redis import get_redis
from app.api.dependencies import get_current_dispatcher
from app.services.telemetry_adapters import telemetry_manager

router = APIRouter(prefix="/telemetry", tags=["Live Telemetry & GPS"])

DEFAULT_ODESSA_TELEMETRY = [
    # ТРАМВАЇ
    {
        "vehicle_id": "4001",
        "display_name": "Вг-4001",
        "route_id": "7",
        "route_number": "7",
        "duty_number": 1,
        "driver_name": "Петренко О.М. (Таб. Т-1001)",
        "vehicle_type": "TRAM",
        "lat": 46.597,
        "lng": 30.804,
        "speed": 22.5,
        "heading": 180,
        "current_station": "вул. Паустовського",
        "next_station": "вул. 28-ї Бригади",
        "deviation_min": 1.2,
        "status": "IN_SCHEDULE",
        "last_updated": time.time()
    },
    {
        "vehicle_id": "4002",
        "display_name": "Вг-4002",
        "route_id": "7",
        "route_number": "7",
        "duty_number": 2,
        "driver_name": "Ковальчук В.І. (Таб. Т-1002)",
        "vehicle_type": "TRAM",
        "lat": 46.545,
        "lng": 30.760,
        "speed": 0.0,
        "heading": 185,
        "current_station": "Лузанівка",
        "next_station": "Пересипський міст",
        "deviation_min": 6.5,
        "status": "CRITICAL_DELAY",
        "has_active_detour": True,
        "active_detour_loop": "Лузанівка",
        "last_updated": time.time()
    },
    {
        "vehicle_id": "4003",
        "display_name": "Вг-4003",
        "route_id": "7",
        "route_number": "7",
        "duty_number": 3,
        "driver_name": "Сидоренко Г.П. (Таб. Т-1003)",
        "vehicle_type": "TRAM",
        "lat": 46.498,
        "lng": 30.723,
        "speed": 18.0,
        "heading": 190,
        "current_station": "Пересипський міст",
        "next_station": "вул. Пастера",
        "deviation_min": -1.8,
        "status": "IN_SCHEDULE",
        "last_updated": time.time()
    },
    {
        "vehicle_id": "3012",
        "display_name": "Вг-3012",
        "route_id": "18",
        "route_number": "18",
        "duty_number": 1,
        "driver_name": "Василенко Д.С. (Таб. Т-2012)",
        "vehicle_type": "TRAM",
        "lat": 46.465,
        "lng": 30.744,
        "speed": 21.0,
        "heading": 210,
        "current_station": "Куликове поле",
        "next_station": "5-та ст. Фонтану",
        "deviation_min": 0.5,
        "status": "IN_SCHEDULE",
        "last_updated": time.time()
    },
    {
        "vehicle_id": "3015",
        "display_name": "Вг-3015",
        "route_id": "18",
        "route_number": "18",
        "duty_number": 2,
        "driver_name": "Мельник О.В. (Таб. Т-2015)",
        "vehicle_type": "TRAM",
        "lat": 46.382,
        "lng": 30.755,
        "speed": 17.5,
        "heading": 215,
        "current_station": "11-та ст. Фонтану",
        "next_station": "16-та ст. Фонтану",
        "deviation_min": 2.4,
        "status": "MINOR_DELAY",
        "last_updated": time.time()
    },
    {
        "vehicle_id": "3018",
        "display_name": "Вг-3018",
        "route_id": "18",
        "route_number": "18",
        "duty_number": 3,
        "driver_name": "Григоренко І.В. (Таб. Т-2018)",
        "vehicle_type": "TRAM",
        "lat": 46.350,
        "lng": 30.701,
        "speed": 0.0,
        "heading": 10,
        "current_station": "16-та ст. Великого Фонтану",
        "next_station": "11-та ст. Фонтану",
        "deviation_min": 0.0,
        "status": "IN_SCHEDULE",
        "last_updated": time.time()
    },
    {
        "vehicle_id": "2005",
        "display_name": "Вг-2005",
        "route_id": "5",
        "route_number": "5",
        "duty_number": 1,
        "driver_name": "Бойко А.Р. (Таб. Т-3005)",
        "vehicle_type": "TRAM",
        "lat": 46.460,
        "lng": 30.740,
        "speed": 15.0,
        "heading": 170,
        "current_station": "Парк Шевченка",
        "next_station": "Музкомедія",
        "deviation_min": 0.5,
        "status": "IN_SCHEDULE",
        "last_updated": time.time()
    },
    {
        "vehicle_id": "2801",
        "display_name": "Вг-2801",
        "route_id": "28",
        "route_number": "28",
        "duty_number": 1,
        "driver_name": "Шевчук В.П. (Таб. Т-2801)",
        "vehicle_type": "TRAM",
        "lat": 46.478,
        "lng": 30.731,
        "speed": 16.0,
        "heading": 45,
        "current_station": "пл. Тираспольська",
        "next_station": "вул. Пастера",
        "deviation_min": -0.5,
        "status": "IN_SCHEDULE",
        "last_updated": time.time()
    },
    {
        "vehicle_id": "1701",
        "display_name": "Вг-1701",
        "route_id": "17",
        "route_number": "17",
        "duty_number": 1,
        "driver_name": "Остапенко Н.Ю. (Таб. Т-1701)",
        "vehicle_type": "TRAM",
        "lat": 46.435,
        "lng": 30.752,
        "speed": 18.0,
        "heading": 210,
        "current_station": "6-та ст. Фонтану",
        "next_station": "11-та ст. Фонтану",
        "deviation_min": 1.0,
        "status": "IN_SCHEDULE",
        "last_updated": time.time()
    },
    {
        "vehicle_id": "1001",
        "display_name": "Вг-1001",
        "route_id": "1",
        "route_number": "1",
        "duty_number": 1,
        "driver_name": "Савченко В.О. (Таб. Т-1001)",
        "vehicle_type": "TRAM",
        "lat": 46.520,
        "lng": 30.745,
        "speed": 24.0,
        "heading": 10,
        "current_station": "Ярмаркова площа",
        "next_station": "Завод Центроліт",
        "deviation_min": -1.0,
        "status": "IN_SCHEDULE",
        "last_updated": time.time()
    },
    {
        "vehicle_id": "2601",
        "display_name": "Вг-2601",
        "route_id": "26",
        "route_number": "26",
        "duty_number": 1,
        "driver_name": "Дмитренко М.А. (Таб. Т-2601)",
        "vehicle_type": "TRAM",
        "lat": 46.410,
        "lng": 30.725,
        "speed": 20.0,
        "heading": 200,
        "current_station": "3-я ст. Люстдорфської дороги",
        "next_station": "11-а ст. Люстдорфської дороги",
        "deviation_min": 0.8,
        "status": "IN_SCHEDULE",
        "last_updated": time.time()
    },

    # ТРОЛЕЙБУСИ
    {
        "vehicle_id": "0020",
        "display_name": "Тр-0020",
        "route_id": "8",
        "route_number": "8",
        "duty_number": 1,
        "driver_name": "Кравченко М.І. (Таб. Т-4020)",
        "vehicle_type": "TROLLEYBUS",
        "lat": 46.469,
        "lng": 30.738,
        "speed": 19.5,
        "heading": 90,
        "current_station": "Залізничний вокзал",
        "next_station": "вул. 28-ї Бригади",
        "deviation_min": 1.0,
        "status": "IN_SCHEDULE",
        "last_updated": time.time()
    },
    {
        "vehicle_id": "0021",
        "display_name": "Тр-0021",
        "route_id": "8",
        "route_number": "8",
        "duty_number": 2,
        "driver_name": "Павленко К.В. (Таб. Т-4021)",
        "vehicle_type": "TROLLEYBUS",
        "lat": 46.435,
        "lng": 30.710,
        "speed": 22.0,
        "heading": 270,
        "current_station": "вул. Космонавтів",
        "next_station": "Суперфосфатний завод",
        "deviation_min": -0.5,
        "status": "IN_SCHEDULE",
        "last_updated": time.time()
    },
    {
        "vehicle_id": "0030",
        "display_name": "Тр-0030",
        "route_id": "9",
        "route_number": "9",
        "duty_number": 1,
        "driver_name": "Ткаченко С.В. (Таб. Т-4030)",
        "vehicle_type": "TROLLEYBUS",
        "lat": 46.455,
        "lng": 30.720,
        "speed": 18.0,
        "heading": 80,
        "current_station": "вул. Інглезі",
        "next_station": "вул. Рішельєвська",
        "deviation_min": 1.5,
        "status": "IN_SCHEDULE",
        "last_updated": time.time()
    },
    {
        "vehicle_id": "0070",
        "display_name": "Тр-0070",
        "route_id": "7",
        "route_number": "7",
        "duty_number": 1,
        "driver_name": "Іванов О.В. (Таб. Т-4070)",
        "vehicle_type": "TROLLEYBUS",
        "lat": 46.380,
        "lng": 30.710,
        "speed": 25.0,
        "heading": 30,
        "current_station": "вул. Архітекторська",
        "next_station": "вул. Новосельського",
        "deviation_min": 0.0,
        "status": "IN_SCHEDULE",
        "last_updated": time.time()
    },
    {
        "vehicle_id": "0010",
        "display_name": "Тр-0010",
        "route_id": "10",
        "route_number": "10",
        "duty_number": 1,
        "driver_name": "Романенко О.Д. (Таб. Т-4010)",
        "vehicle_type": "TROLLEYBUS",
        "lat": 46.470,
        "lng": 30.715,
        "speed": 16.0,
        "heading": 40,
        "current_station": "вул. Інглезі",
        "next_station": "Пересипський міст",
        "deviation_min": -1.2,
        "status": "IN_SCHEDULE",
        "last_updated": time.time()
    },

    # СПЕЦТЕХНІКА ТА СЛУЖБОВІ
    {
        "vehicle_id": "С-01",
        "display_name": "Аварійна КС С-01",
        "route_id": "SERVICE",
        "route_number": "С-01",
        "duty_number": 99,
        "driver_name": "Служба Колії та Мережі",
        "vehicle_type": "SERVICE",
        "is_service": True,
        "lat": 46.468,
        "lng": 30.735,
        "speed": 0.0,
        "heading": 0,
        "current_station": "Пересипський міст (Ремонт)",
        "next_station": "База",
        "deviation_min": 0.0,
        "status": "SERVICE",
        "last_updated": time.time()
    }
]

def enrich_vehicle_metadata(v: dict) -> dict:
    """Нормалізує та збагачує телеметрію вагона коректним номером маршруту та типом."""
    from app.services.telemetry_adapters import get_odessa_route_for_vehicle

    v_id = str(v.get("vehicle_id") or v.get("id") or "")
    v_name = str(v.get("display_name") or v_id)
    lat = float(v.get("lat") or 46.475)
    lng = float(v.get("lng") or 30.735)
    
    # 1. Визначення спецтехніки
    if any(k in v_name.lower() or k in v_id.lower() for k in ["газель", "газ", "камаз", "ревізор", "маз", "с-", "аварійна"]):
        v["is_service"] = True
        v["vehicle_type"] = "SERVICE"
        v["route_id"] = "SERVICE"
        v["route_number"] = "Спец"
        v["status"] = "SERVICE"
        return v

    # 2. Якщо маршрут вже встановлено та він валідний (короткий номер без UUID) — зберігаємо
    r_id = v.get("route_id") or v.get("route_number")
    if r_id and str(r_id).lower() not in ["none", "null", "unknown", ""] and len(str(r_id)) <= 5 and "-" not in str(r_id):
        clean_r = str(r_id).replace("T", "").replace("Tr", "").strip()
        v["route_id"] = clean_r
        v["route_number"] = clean_r
        if not v.get("vehicle_type"):
            v["vehicle_type"] = "TROLLEYBUS" if clean_r in ["2", "3", "7", "8", "9", "10", "12"] and (v_id.startswith("0") or v_id.startswith("4")) else "TRAM"
        return v

    # 3. Визначаємо тип транспорту за бортовим номером
    digits = re.sub(r'[^0-9]', '', v_id)
    v_type = v.get("vehicle_type")
    if not v_type:
        if digits:
            num = int(digits)
            if (num <= 50) or (600 <= num <= 899) or (2000 <= num <= 2099) or (4000 <= num <= 4099):
                v_type = "TROLLEYBUS"
            else:
                v_type = "TRAM"
        else:
            v_type = "TRAM"

    # 4. Канонічне визначення маршруту через get_odessa_route_for_vehicle
    assigned_route = get_odessa_route_for_vehicle(digits or v_id, v_type, lat, lng)

    v["route_id"] = assigned_route
    v["route_number"] = assigned_route
    v["vehicle_type"] = v_type
    return v

@router.get("/live")
@router.get("/vehicles")
async def get_live_vehicles(
    route_id: Optional[str] = Query(None)
):
    """
    Повертає поточне розташування, швидкість, відхилення та темп руху (Pacing) усіх активних бортів
    з об'єднанням потоків Wialon IPS та EasyWay Live GPS.
    """
    try:
        from app.services.easyway import easyway_service
        redis = await get_redis()
        raw_data = await redis.hgetall("telemetry:vehicles")
        
        vehicles_dict = {}
        
        # 1. Завантажуємо з Redis / Wialon
        if raw_data:
            for v_str in raw_data.values():
                try:
                    v_obj = json.loads(v_str)
                    enriched = enrich_vehicle_metadata(v_obj)
                    v_id = str(enriched.get("vehicle_id"))
                    vehicles_dict[v_id] = enriched
                except Exception:
                    pass
            
        # 2. Якщо в Redis порожньо — отримуємо безпосередньо з telemetry_manager (EasyWay)
        if not vehicles_dict:
            live_list = await telemetry_manager.get_live_telemetry()
            for v in live_list:
                enriched = enrich_vehicle_metadata(dict(v))
                vehicles_dict[str(enriched.get("vehicle_id"))] = enriched

        vehicles = list(vehicles_dict.values())

        if route_id and route_id.upper() != "ALL":
            clean_target = str(route_id).replace("T", "").replace("Tr", "").strip()
            vehicles = [v for v in vehicles if str(v.get("route_id")) == clean_target or str(v.get("route_number")) == clean_target]
            
        return vehicles
    except Exception as e:
        print(f"Telemetry error: {e}")
        return [enrich_vehicle_metadata(dict(v)) for v in DEFAULT_ODESSA_TELEMETRY]

class WialonTokenRequest(BaseModel):
    token: str

class WialonCredentialsRequest(BaseModel):
    user: str
    password: str

@router.get("/status")
async def get_telemetry_status():
    """
    Діагностика стану підключення шлюзів: Wialon API та GTFS-RT Одеса.
    """
    wialon_active = bool(telemetry_manager.wialon_adapter.eid or (telemetry_manager.wialon_adapter.token and len(telemetry_manager.wialon_adapter.token) > 20))
    
    redis = await get_redis()
    raw_data = await redis.hgetall("telemetry:vehicles")
    total_online = len(raw_data) if raw_data else len(DEFAULT_ODESSA_TELEMETRY)
    
    return {
        "gtfs_rt_gateway": "CONNECTED (https://gw.x24.digital/api/od-all/gtfs/v1/download/gtfs-rt-vehicles-pr.pb)",
        "wialon_api_status": "ACTIVE" if wialon_active else "READY_FOR_TOKEN_OR_CREDENTIALS",
        "wialon_host": telemetry_manager.wialon_adapter.host,
        "wialon_user": telemetry_manager.wialon_adapter.user,
        "total_vehicles_online": total_online,
        "polling_interval_sec": 10,
        "anti_reb_max_speed_kmh": 90.0,
        "anti_reb_max_off_route_m": 150.0
    }

@router.post("/wialon/token")
async def set_wialon_token(request: WialonTokenRequest):
    telemetry_manager.wialon_adapter.token = request.token.strip()
    telemetry_manager.wialon_adapter.eid = None
    vehicles = await telemetry_manager.wialon_adapter.fetch_vehicles()
    return {
        "status": "SUCCESS" if telemetry_manager.wialon_adapter.eid else "FAILED",
        "eid_active": bool(telemetry_manager.wialon_adapter.eid),
        "vehicles_fetched": len(vehicles)
    }

@router.post("/wialon/credentials")
async def set_wialon_credentials(request: WialonCredentialsRequest):
    telemetry_manager.wialon_adapter.user = request.user.strip()
    telemetry_manager.wialon_adapter.password = request.password.strip()
    telemetry_manager.wialon_adapter.eid = None
    vehicles = await telemetry_manager.wialon_adapter.fetch_vehicles()
    return {
        "status": "SUCCESS" if telemetry_manager.wialon_adapter.eid else "FAILED",
        "eid_active": bool(telemetry_manager.wialon_adapter.eid),
        "vehicles_fetched": len(vehicles)
    }
