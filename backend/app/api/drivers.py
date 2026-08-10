from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.dependencies import get_db
from app.models.models import DriverModel, DriverDutyModel
from app.models.schemas import DriverAssignRequest, DriverStatusUpdate
from app.api.websocket import manager as ws_manager
import uuid

router = APIRouter(prefix="/drivers", tags=["Drivers"])

@router.post("/assign")
async def assign_driver(
    payload: DriverAssignRequest,
    db: AsyncSession = Depends(get_db)
):
    # Шукаємо водія
    result = await db.execute(select(DriverModel).where(DriverModel.id == payload.driver_id))
    driver = result.scalars().first()
    
    if not driver:
        # Для демо-цілей створюємо, якщо не існує
        driver = DriverModel(id=payload.driver_id, name=f"Водій {payload.driver_id}", status="WORK", current_vehicle_id=payload.vehicle_id)
        db.add(driver)
    else:
        driver.current_vehicle_id = payload.vehicle_id
        driver.status = "WORK"
        
    await db.commit()
    await db.refresh(driver)
    
    # Сповіщаємо через WebSocket
    await ws_manager.broadcast({
        "type": "DRIVER_UPDATE",
        "payload": {
            "driver_id": driver.id,
            "status": driver.status,
            "vehicle_id": driver.current_vehicle_id
        }
    })
    
    return {"status": "success", "driver_id": driver.id, "vehicle_id": driver.current_vehicle_id}

@router.post("/{driver_id}/status")
async def update_driver_status(
    driver_id: str,
    payload: DriverStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(DriverModel).where(DriverModel.id == driver_id))
    driver = result.scalars().first()
    
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    driver.status = payload.status
    
    await db.commit()
    await db.refresh(driver)
    
    await ws_manager.broadcast({
        "type": "DRIVER_UPDATE",
        "payload": {
            "driver_id": driver.id,
            "status": driver.status,
            "vehicle_id": driver.current_vehicle_id
        }
    })
    
    return {"status": "success", "driver_id": driver.id, "new_status": driver.status}
