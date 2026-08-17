from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional, Union
from datetime import date
from pydantic import BaseModel
import uuid

from app.api.dependencies import get_db, get_current_dispatcher
from app.models.models import Driver, Vehicle, DriverDuty
from app.api.websocket import manager as ws_manager

router = APIRouter(prefix="/crew", tags=["Crew Assignment"])

# Схеми для валідації
class AssignmentCreate(BaseModel):
    duty_id: int
    driver_id: Union[int, str]
    vehicle_id: str
    target_date: date

class AssignmentResponse(BaseModel):
    id: Union[int, str]
    duty_id: Optional[int] = None
    driver_id: Optional[Union[int, str]] = None
    vehicle_id: Optional[str] = None
    target_date: Optional[date] = None
    dispatcher_id: Optional[int] = None
    status: Optional[str] = "ASSIGNED"

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
    
    # 1. Знаходимо вже призначених водіїв та ТЗ на цю дату
    assigned_query = select(DriverDuty.driver_id, DriverDuty.vehicle_id).where(DriverDuty.target_date == check_date)
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
            Vehicle.status == "AVAILABLE",
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
    """Повертає всі активні призначення екіпажів на вказану дату."""
    check_date = target_date or date.today()
    query = select(DriverDuty).where(DriverDuty.target_date == check_date)
    result = await db.execute(query)
    duties = result.scalars().all()
    return duties

@router.post("/assign", response_model=AssignmentResponse, summary="Призначення водія та рухомого складу на наряд")
async def assign_crew_to_duty(
    assignment: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Створює електронну путівку: прив'язує водія та вагон до наряду."""
    
    new_assignment = DriverDuty(
        id=str(uuid.uuid4()),
        duty_id=assignment.duty_id,
        driver_id=str(assignment.driver_id),
        vehicle_id=str(assignment.vehicle_id),
        target_date=assignment.target_date,
        dispatcher_id=current_user.id,
        status="ASSIGNED"
    )
    
    db.add(new_assignment)
    await db.commit()
    await db.refresh(new_assignment)
    
    # WebSocket сповіщення диспетчерам про нову путівку
    await ws_manager.broadcast({
        "type": "CREW_ASSIGNED",
        "payload": {
            "duty_id": assignment.duty_id,
            "driver_id": str(assignment.driver_id),
            "vehicle_id": str(assignment.vehicle_id),
            "target_date": assignment.target_date.isoformat(),
            "assignment_id": new_assignment.id
        }
    })
    
    return new_assignment

@router.get("/waybill", summary="Генерація електронного шляхового листа")
async def get_smart_waybill(
    driver_id: Union[int, str] = Query(...),
    target_date: date = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Генерує електронний шляховий лист (путівку) для водія на вказану дату."""
    
    # 1. Шукаємо призначення (путівку)
    driver_id_str = str(driver_id)
    duty_query = select(DriverDuty).where(
        and_(
            (DriverDuty.driver_id == driver_id_str) | (DriverDuty.driver_id == driver_id),
            DriverDuty.target_date == target_date
        )
    ).order_by(DriverDuty.id.desc())
    assignment = (await db.execute(duty_query)).scalars().first()
    
    if not assignment:
        raise HTTPException(
            status_code=404, 
            detail=f"На дату {target_date} для водія #{driver_id} немає відкритих путівок"
        )

    # 2. Отримуємо дані про водія та вагон
    driver_query = select(Driver).where((Driver.id == driver_id_str) | (Driver.id == driver_id))
    driver = (await db.execute(driver_query)).scalars().first()
    
    vehicle_query = select(Vehicle).where(Vehicle.id == str(assignment.vehicle_id))
    vehicle = (await db.execute(vehicle_query)).scalars().first()
    
    driver_info = {
        "id": driver.id if driver else driver_id,
        "full_name": (driver.full_name or driver.name) if driver else f"Водій #{driver_id}",
        "class_rank": (driver.class_rank or 1) if driver else 1
    }
    vehicle_info = {
        "id": vehicle.id if vehicle else str(assignment.vehicle_id),
        "model": vehicle.model if vehicle else "Tatra T3"
    }

    mock_trips = [
        {"trip_number": 1, "route": "18", "plan_start": "06:00", "plan_end": "06:45", "fact_start": "06:01", "fact_end": "06:47", "status": "COMPLETED"},
        {"trip_number": 2, "route": "18", "plan_start": "07:00", "plan_end": "07:45", "fact_start": "07:02", "fact_end": "07:46", "status": "COMPLETED"},
        {"trip_number": 3, "route": "18", "plan_start": "08:00", "plan_end": "08:45", "fact_start": "08:05", "fact_end": None, "status": "IN_PROGRESS"},
        {"trip_number": 4, "route": "18", "plan_start": "09:00", "plan_end": "09:45", "fact_start": None, "fact_end": None, "status": "PENDING"},
    ]

    return {
        "waybill_id": assignment.id,
        "target_date": target_date.isoformat(),
        "driver": driver_info,
        "vehicle": vehicle_info,
        "duty_id": assignment.duty_id,
        "trips": mock_trips,
        "summary": {
            "total_planned_trips": 4,
            "completed_trips": 2,
            "total_work_hours": "8 год 15 хв"
        }
    }
