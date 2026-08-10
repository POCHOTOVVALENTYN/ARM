from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.api.dependencies import get_db
from app.models.models import ControlPointEtaModel
from app.models.schemas import EtaUpdateRequest
from app.api.websocket import manager as ws_manager

router = APIRouter(prefix="/control_points", tags=["Control Points"])

@router.post("/eta")
async def update_eta(
    payload: EtaUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    eta_log = ControlPointEtaModel(
        trip_id=payload.trip_id,
        station_id=payload.station_id,
        estimated_arrival_time=payload.estimated_arrival_time,
        actual_arrival_time=payload.actual_arrival_time,
        timestamp=datetime.utcnow()
    )
    db.add(eta_log)
    await db.commit()
    
    # Сповіщаємо через WebSocket
    await ws_manager.broadcast({
        "type": "ETA_UPDATE",
        "payload": {
            "trip_id": payload.trip_id,
            "station_id": payload.station_id,
            "estimated_arrival_time": payload.estimated_arrival_time.isoformat(),
            "actual_arrival_time": payload.actual_arrival_time.isoformat() if payload.actual_arrival_time else None
        }
    })
    
    return {"status": "success", "message": "ETA updated successfully"}
