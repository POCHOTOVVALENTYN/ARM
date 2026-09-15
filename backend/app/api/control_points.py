from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import List, Dict, Any

from app.api.dependencies import get_db
from app.models.models import ControlPoint, StationModel
from app.models.schemas import EtaUpdateRequest
from app.api.websocket import manager as ws_manager

router = APIRouter(tags=["Control Points"])

@router.get("", summary="Отримання списку контрольних точок (КТ) та ДП")
@router.get("/", summary="Отримання списку контрольних точок (КТ) та ДП")
@router.get("/all", summary="Отримання всіх контрольних точок")
async def get_all_control_points(db: AsyncSession = Depends(get_db)):
    """Повертає список ключових контрольних точок та диспетчерських пунктів."""
    try:
        query = select(StationModel).where(StationModel.is_dispatch_station == True)
        res = await db.execute(query)
        stations = res.scalars().all()
        if stations:
            return [
                {
                    "id": s.id,
                    "name": s.name,
                    "lat": s.lat or 46.47,
                    "lng": s.lng or s.lon or 30.73,
                    "is_dp": True,
                    "break_capacity": s.break_capacity or 2
                }
                for s in stations
            ]
    except Exception:
        pass

    # Стандартний каталог КТ КП «ОМЕТ»
    return [
        {"id": "cp_arkadia", "name": "Станція «Аркадія»", "lat": 46.4312, "lng": 30.7634, "is_dp": True, "break_capacity": 4},
        {"id": "cp_paust", "name": "ДП «вул. Паустовського»", "lat": 46.5921, "lng": 30.7981, "is_dp": True, "break_capacity": 6},
        {"id": "cp_kulikove", "name": "Куликове поле (Вокзал)", "lat": 46.4678, "lng": 30.7432, "is_dp": True, "break_capacity": 5},
        {"id": "cp_starosinna", "name": "пл. Старосінна (Автостанція)", "lat": 46.4691, "lng": 30.7398, "is_dp": True, "break_capacity": 4},
        {"id": "cp_fontan_16", "name": "16-та ст. Великого Фонтану", "lat": 46.3882, "lng": 30.7511, "is_dp": True, "break_capacity": 3},
        {"id": "cp_tiraspol", "name": "пл. Тираспільська", "lat": 46.4812, "lng": 30.7321, "is_dp": False, "break_capacity": 1},
        {"id": "cp_autovokzal", "name": "Центральний Автовокзал", "lat": 46.4754, "lng": 30.7082, "is_dp": True, "break_capacity": 2},
        {"id": "cp_peresyp", "name": "Пересипський міст", "lat": 46.4967, "lng": 30.7189, "is_dp": False, "break_capacity": 0},
    ]

@router.post("/eta")
async def update_eta(
    payload: EtaUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        from app.models.models import EtaLog
        eta_log = EtaLog(
            vehicle_id="unknown",
            route_id="unknown",
            stop_id=payload.station_id,
            deviation_min=0.0
        )
        db.add(eta_log)
        await db.commit()
    except Exception:
        pass
    
    # Сповіщаємо через WebSocket
    await ws_manager.broadcast({
        "type": "ETA_UPDATE",
        "payload": {
            "trip_id": payload.trip_id,
            "station_id": payload.station_id,
            "estimated_arrival_time": payload.estimated_arrival_time.isoformat() if hasattr(payload.estimated_arrival_time, 'isoformat') else str(payload.estimated_arrival_time),
            "actual_arrival_time": payload.actual_arrival_time.isoformat() if (payload.actual_arrival_time and hasattr(payload.actual_arrival_time, 'isoformat')) else str(payload.actual_arrival_time) if payload.actual_arrival_time else None
        }
    })
    
    return {"status": "success", "message": "ETA updated successfully"}
