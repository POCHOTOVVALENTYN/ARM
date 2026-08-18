from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional, Union
from datetime import date
from pydantic import BaseModel
import uuid

from app.api.dependencies import get_db, get_current_dispatcher
from app.models.models import Driver, Vehicle, Waybill, StationModel
from app.models.schedule import StaticDuty, StaticShift, StaticTrip, StaticStopTime
from app.api.websocket import ws_manager

router = APIRouter(prefix="/crew", tags=["Crew & Resources"])

# Схеми для валідації
class AssignmentCreate(BaseModel):
    duty_id: int
    driver_id: Union[int, str]
    vehicle_id: str
    target_date: date

class AssignmentResponse(BaseModel):
    id: int
    duty_id: int
    driver_id: str
    vehicle_id: str
    target_date: Optional[date] = None
    dispatcher_id: Optional[int] = None
    status: Optional[str] = "ACTIVE"

    class Config:
        from_attributes = True

@router.get("/available", summary="Отримання вільних водіїв та ТЗ")
async def get_available_resources(
    target_date: Optional[date] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Повертає списки водіїв та рухомого складу, які ще не призначені на вказану дату."""
    check_date = target_date or date.today()
    
    # 1. Знаходимо вже призначених водіїв та ТЗ на цю дату у таблиці waybills
    assigned_query = select(Waybill.driver_id, Waybill.vehicle_id).where(Waybill.date == check_date)
    result = await db.execute(assigned_query)
    assigned = result.all()
    
    assigned_drivers = [str(row.driver_id) for row in assigned if row.driver_id is not None]
    assigned_vehicles = [str(row.vehicle_id) for row in assigned if row.vehicle_id is not None]

    # 2. Отримуємо вільних водіїв
    drivers_query = select(Driver).where(
        and_(
            Driver.is_active == True,
            Driver.id.notin_(assigned_drivers) if assigned_drivers else True
        )
    )
    drivers = (await db.execute(drivers_query)).scalars().all()

    # 3. Отримуємо вільні транспортні засоби
    vehicles_query = select(Vehicle).where(
        and_(
            Vehicle.status.in_(["AVAILABLE", "ACTIVE"]),
            Vehicle.id.notin_(assigned_vehicles) if assigned_vehicles else True
        )
    )
    vehicles = (await db.execute(vehicles_query)).scalars().all()

    return {
        "drivers": [
            {
                "id": d.id,
                "full_name": d.full_name or d.name or f"Водій #{d.id}",
                "class_rank": d.class_rank or 1
            }
            for d in drivers
        ],
        "vehicles": [
            {
                "id": str(v.id),
                "type": v.type or "tram",
                "model": v.model or "Tatra T3"
            }
            for v in vehicles
        ]
    }

@router.get("/daily-deployments", summary="Отримання списку призначень на дату")
async def get_daily_deployments(
    target_date: Optional[date] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Повертає всі активні призначення екіпажів на вказану дату (з Waybill)."""
    check_date = target_date or date.today()
    query = (
        select(Waybill)
        .where(Waybill.date == check_date)
        .options(selectinload(Waybill.duty), selectinload(Waybill.driver), selectinload(Waybill.vehicle))
    )
    result = await db.execute(query)
    waybills = result.scalars().all()
    
    return [
        {
            "id": w.id,
            "duty_id": w.duty_id,
            "duty_number": w.duty.duty_number if w.duty else f"#{w.duty_id}",
            "route_id": w.duty.route_id if w.duty else "UNKNOWN",
            "driver_id": w.driver_id,
            "driver_name": w.driver.full_name if w.driver else f"Водій #{w.driver_id}",
            "vehicle_id": w.vehicle_id,
            "vehicle_model": w.vehicle.model if w.vehicle else "Tatra T3",
            "target_date": str(w.date),
            "status": w.status
        }
        for w in waybills
    ]

@router.post("/assign", response_model=AssignmentResponse, summary="Призначення водія та рухомого складу на наряд")
async def assign_crew_to_duty(
    assignment: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Створює електронну путівку (Waybill): прив'язує водія та вагон до наряду."""
    
    new_waybill = Waybill(
        duty_id=assignment.duty_id,
        driver_id=str(assignment.driver_id),
        vehicle_id=str(assignment.vehicle_id),
        date=assignment.target_date,
        dispatcher_id=current_user.id,
        status="ACTIVE"
    )
    
    db.add(new_waybill)
    await db.commit()
    await db.refresh(new_waybill)
    
    # WebSocket сповіщення диспетчерам про нову путівку
    await ws_manager.broadcast({
        "type": "CREW_ASSIGNED",
        "payload": {
            "duty_id": assignment.duty_id,
            "driver_id": str(assignment.driver_id),
            "vehicle_id": str(assignment.vehicle_id),
            "target_date": assignment.target_date.isoformat(),
            "assignment_id": new_waybill.id
        }
    })
    
    return AssignmentResponse(
        id=new_waybill.id,
        duty_id=new_waybill.duty_id,
        driver_id=new_waybill.driver_id,
        vehicle_id=new_waybill.vehicle_id,
        target_date=new_waybill.date,
        dispatcher_id=new_waybill.dispatcher_id,
        status=new_waybill.status
    )
