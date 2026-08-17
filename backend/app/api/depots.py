from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
import uuid

from app.api.dependencies import get_db, get_current_active_superuser
from app.models.models import DepotModel, Vehicle

router = APIRouter(prefix="/depots", tags=["Depots & Fleet Configs"])

# --- Схеми Pydantic ---
class VehicleCreate(BaseModel):
    id: str  # Бортовий номер
    model: str
    type: str  # TRAM / TROLLEYBUS
    depot_id: Optional[str] = None

class VehicleResponse(BaseModel):
    id: str
    model: str
    type: str
    status: str = "AVAILABLE"
    depot_id: Optional[str] = None

    class Config:
        from_attributes = True

class DepotCreate(BaseModel):
    name: str
    address: Optional[str] = None
    type: Optional[str] = "TRAM"

class DepotResponse(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    vehicles: List[VehicleResponse] = []

    class Config:
        from_attributes = True

# --- Ендпоінти Депо ---
@router.get("", response_model=List[DepotResponse])
@router.get("/", response_model=List[DepotResponse])
async def get_depots(db: AsyncSession = Depends(get_db)):
    """Отримання списку всіх депо разом з їхнім рухомим складом"""
    result = await db.execute(
        select(DepotModel).options(selectinload(DepotModel.vehicles))
    )
    return result.scalars().all()

@router.post("", response_model=DepotResponse)
@router.post("/", response_model=DepotResponse)
async def create_depot(
    depot_in: DepotCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_active_superuser)
):
    """Створення нового депо (Тільки для Admin)"""
    new_id = f"depot_{uuid.uuid4().hex[:8]}"
    new_depot = DepotModel(
        id=new_id,
        name=depot_in.name,
        address=depot_in.address,
        type=depot_in.type or "TRAM",
        prepTimeMin=15
    )
    db.add(new_depot)
    await db.commit()
    await db.refresh(new_depot)
    result = await db.execute(
        select(DepotModel).options(selectinload(DepotModel.vehicles)).where(DepotModel.id == new_depot.id)
    )
    return result.scalar_one()

# --- Ендпоінти Рухомого складу (Vehicles) ---
@router.post("/vehicles", response_model=VehicleResponse)
async def register_vehicle(
    vehicle_in: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_active_superuser)
):
    """Реєстрація нового транспортного засобу та прив'язка до депо"""
    existing = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_in.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Транспортний засіб з таким бортовим номером вже існує")

    new_vehicle = Vehicle(
        id=vehicle_in.id,
        model=vehicle_in.model,
        type=vehicle_in.type,
        depot_id=str(vehicle_in.depot_id) if vehicle_in.depot_id else None,
        status="AVAILABLE"
    )
    db.add(new_vehicle)
    await db.commit()
    await db.refresh(new_vehicle)
    return new_vehicle

@router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(
    vehicle_id: str,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_active_superuser)
):
    """Видалення транспортного засобу з системи"""
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Транспортний засіб не знайдено")
        
    await db.delete(vehicle)
    await db.commit()
    return {"message": "Транспортний засіб успішно видалено"}
