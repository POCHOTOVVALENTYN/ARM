from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.dependencies import get_db
from app.models.models import StationModel
from app.models.schemas import StationStatusUpdate
from app.api.websocket import manager as ws_manager

router = APIRouter(prefix="/stations", tags=["Stations"])

@router.post("/{station_id}/status")
async def update_station_status(
    station_id: str,
    payload: StationStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(StationModel).where(StationModel.id == station_id))
    station = result.scalars().first()
    
    if not station:
        # Для демо-цілей створюємо
        station = StationModel(id=station_id, name=f"Станція {station_id}", type="HUB", status=payload.status)
        db.add(station)
    else:
        station.status = payload.status
        
    await db.commit()
    await db.refresh(station)
    
    # Сповіщаємо через WebSocket
    await ws_manager.broadcast({
        "type": "STATION_UPDATE",
        "payload": {
            "station_id": station.id,
            "status": station.status
        }
    })
    
    return {"status": "success", "station_id": station.id, "new_status": station.status}
