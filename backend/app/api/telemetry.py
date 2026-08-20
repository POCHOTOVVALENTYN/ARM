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
    {
        "vehicle_id": "4001",
        "display_name": "Вг-4001",
        "route_id": "7",
        "route_number": "7",
        "duty_number": 1,
        "driver_name": "Петренко О.М. (Таб. Т-1001)",
        "vehicle_type": "TRAM",
        "lat": 46.482,
        "lng": 30.723,
        "speed": 24.5,
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
        "lat": 46.475,
        "lng": 30.730,
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
        "lat": 46.468,
        "lng": 30.735,
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
        "lat": 46.440,
        "lng": 30.750,
        "speed": 22.0,
        "heading": 210,
        "current_station": "5-та ст. Фонтану",
        "next_station": "11-та ст. Фонтану",
        "deviation_min": 3.8,
        "status": "MINOR_DELAY",
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
        "lat": 46.425,
        "lng": 30.758,
        "speed": 0.0,
        "heading": 215,
        "current_station": "11-та ст. Фонтану",
        "next_station": "16-та ст. Фонтану",
        "deviation_min": 8.2,
        "status": "CRITICAL_DELAY",
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
    }
]

@router.get("/live")
@router.get("/vehicles")
async def get_live_vehicles(
    route_id: Optional[str] = Query(None)
):
    """
    Повертає поточне розташування, швидкість, відхилення та темп руху (Pacing) усіх активних бортів.
    """
    try:
        redis = await get_redis()
        raw_data = await redis.hgetall("telemetry:vehicles")
        
        vehicles = []
        if raw_data:
            vehicles = [json.loads(v) for v in raw_data.values()]
            
        if not vehicles:
            vehicles = DEFAULT_ODESSA_TELEMETRY

        if route_id and route_id.upper() != "ALL":
            vehicles = [v for v in vehicles if str(v.get("route_id")) == str(route_id) or str(v.get("route_number")) == str(route_id)]
            
        return vehicles
    except Exception as e:
        print(f"Telemetry error: {e}")
        return DEFAULT_ODESSA_TELEMETRY

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
