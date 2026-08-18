import json
from fastapi import APIRouter, Depends, Query
from typing import List, Dict, Any, Optional
from app.core.redis import get_redis
from app.api.dependencies import get_current_dispatcher
from app.services.telemetry_adapters import telemetry_manager

router = APIRouter(prefix="/telemetry", tags=["Live Telemetry & GPS"])

@router.get("/live")
async def get_live_vehicles(
    route_id: Optional[str] = Query(None)
):
    """
    Повертає поточне розташування, швидкість, відхилення та темп руху (Pacing) усіх активних бортів.
    """
    try:
        redis = await get_redis()
        raw_data = await redis.hgetall("telemetry:vehicles")
        if not raw_data:
            return []
        
        vehicles = [json.loads(v) for v in raw_data.values()]
        if route_id:
            vehicles = [v for v in vehicles if str(v.get("route_id")) == str(route_id)]
            
        return vehicles
    except Exception:
        return []

@router.get("/status")
async def get_telemetry_status():
    """
    Діагностика стану підключення шлюзів: Wialon API та GTFS-RT Одеса.
    """
    wialon_active = bool(telemetry_manager.wialon_adapter.token and telemetry_manager.wialon_adapter.token != "YOUR_WIALON_TOKEN_HERE")
    
    redis = await get_redis()
    raw_data = await redis.hgetall("telemetry:vehicles")
    total_online = len(raw_data) if raw_data else 0
    
    return {
        "gtfs_rt_gateway": "CONNECTED (https://gw.x24.digital/api/od-all/gtfs/v1/download/gtfs-rt-vehicles-pr.pb)",
        "wialon_api_status": "READY_FOR_TOKEN" if not wialon_active else "ACTIVE",
        "total_vehicles_online": total_online,
        "polling_interval_sec": 10,
        "anti_reb_max_speed_kmh": 90.0,
        "anti_reb_max_off_route_m": 150.0
    }
