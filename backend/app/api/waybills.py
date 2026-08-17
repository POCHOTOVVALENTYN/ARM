import json
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.core.database import get_db
from app.core.redis import get_redis
from app.models.models import Waybill, Vehicle
from app.models.schedule import StaticDuty, StaticShift, StaticTrip, StaticStopTime, Schedule, ScheduleStatus
from app.api.dependencies import get_current_dispatcher
from app.api.websocket import ws_manager

router = APIRouter(prefix="/waybills", tags=["Smart Waybills"])

class WaybillCreate(BaseModel):
    duty_id: int
    vehicle_id: str
    driver_id: str
    target_date: str # Формат YYYY-MM-DD

@router.post("/assign")
async def assign_waybill(
    req: WaybillCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Призначає вагон та водія на наряд, зберігає електронну путівку в БД 
    та активує плоский кеш розкладу в Redis для telemetry_worker.
    """
    try:
        waybill_date = date.fromisoformat(req.target_date)
    except Exception:
        waybill_date = date.today()

    # 1. Перевіряємо наявність ТЗ або створюємо/оновлюємо його статус
    veh_res = await db.execute(select(Vehicle).where(Vehicle.id == req.vehicle_id))
    vehicle_obj = veh_res.scalar_one_or_none()
    if not vehicle_obj:
        vehicle_obj = Vehicle(
            id=req.vehicle_id,
            type="TRAM",
            model="Tatra T3",
            status="ACTIVE",
            is_active=True
        )
        db.add(vehicle_obj)
        await db.flush()
    else:
        vehicle_obj.status = "ACTIVE"
        vehicle_obj.is_active = True

    # 2. Запис електронної путівки в базу даних
    new_waybill = Waybill(
        date=waybill_date,
        duty_id=req.duty_id,
        vehicle_id=req.vehicle_id,
        driver_id=req.driver_id,
        status="ACTIVE"
    )
    db.add(new_waybill)
    await db.flush()
    
    # 3. Витягуємо повну структуру рейсів та зупинок наряду для Redis
    query = (
        select(StaticDuty)
        .where(StaticDuty.id == req.duty_id)
        .options(
            selectinload(StaticDuty.shifts)
            .selectinload(StaticShift.trips)
            .selectinload(StaticTrip.stop_times)
        )
    )
    duty_res = await db.execute(query)
    duty_obj = duty_res.scalar_one_or_none()
    
    if not duty_obj:
        raise HTTPException(status_code=404, detail="Наряд не знайдено")

    stops_cache = []
    for shift in duty_obj.shifts or []:
        for trip in shift.trips or []:
            for st in trip.stop_times or []:
                arr_min = st.arrival_time.hour * 60 + st.arrival_time.minute if st.arrival_time else 0
                dep_min = st.departure_time.hour * 60 + st.departure_time.minute if st.departure_time else 0
                stops_cache.append({
                    "stop_id": str(st.stop_id),
                    "stop_sequence": st.stop_sequence,
                    "trip_id": trip.id,
                    "direction": str(trip.direction),
                    "arrival_minute": arr_min,
                    "departure_minute": dep_min
                })

    schedule_cache = {
        "duty_id": duty_obj.id,
        "duty_number": duty_obj.duty_number,
        "route_id": duty_obj.route_id,
        "vehicle_id": req.vehicle_id,
        "driver_id": req.driver_id,
        "target_date": req.target_date,
        "stops": stops_cache
    }
    
    # 4. Завантаження розкладу в Redis (термін дії - 24 години = 86400 с)
    try:
        redis = await get_redis()
        await redis.set(f"schedule_cache:vehicle:{req.vehicle_id}", json.dumps(schedule_cache), ex=86400)
    except Exception as e:
        print(f"Помилка запису в Redis: {e}")

    await db.commit()

    # 5. Оповіщення диспетчерів через WebSocket
    await ws_manager.broadcast({
        "type": "waybill_assigned",
        "waybill_id": new_waybill.id,
        "vehicle_id": req.vehicle_id,
        "duty_id": req.duty_id,
        "route_id": duty_obj.route_id
    })

    return {
        "message": "Путівку створено, телеметрію активовано!", 
        "waybill_id": new_waybill.id,
        "vehicle_id": req.vehicle_id,
        "duty_number": duty_obj.duty_number
    }

@router.get("/today")
async def get_today_waybills(
    target_date: Optional[str] = Query(None), 
    db: AsyncSession = Depends(get_db)
):
    """Повертає список виданих путівок на задану дату."""
    try:
        req_date = date.fromisoformat(target_date) if target_date else date.today()
    except Exception:
        req_date = date.today()

    query = select(Waybill).where(Waybill.date == req_date)
    result = await db.execute(query)
    waybills = result.scalars().all()
    
    return [
        {
            "id": w.id,
            "date": str(w.date),
            "duty_id": w.duty_id,
            "vehicle_id": w.vehicle_id,
            "driver_id": w.driver_id,
            "status": w.status
        }
        for w in waybills
    ]

@router.get("/duties-available")
async def get_available_duties(
    target_date: Optional[str] = Query(None),
    route_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Повертає перелік усіх активних статичних нарядів для рознарядки.
    """
    query = (
        select(StaticDuty)
        .join(Schedule, StaticDuty.schedule_id == Schedule.id)
        .where(Schedule.status == ScheduleStatus.ACTIVE)
        .options(
            selectinload(StaticDuty.shifts)
            .selectinload(StaticShift.trips)
            .selectinload(StaticTrip.stop_times)
        )
    )
    if route_id:
        query = query.where(StaticDuty.route_id == route_id)

    result = await db.execute(query)
    duties = result.scalars().all()

    output = []
    for d in duties:
        first_trip_time = "05:30"
        last_trip_time = "22:00"
        
        all_trips = [t for s in (d.shifts or []) for t in (s.trips or [])]
        if all_trips:
            sorted_trips = sorted(all_trips, key=lambda x: x.trip_sequence)
            if sorted_trips[0].stop_times:
                first_trip_time = str(sorted_trips[0].stop_times[0].departure_time)[:5]
            if sorted_trips[-1].stop_times:
                last_trip_time = str(sorted_trips[-1].stop_times[-1].arrival_time)[:5]

        output.append({
            "id": d.id,
            "number": d.duty_number,
            "route": d.route_id,
            "start": first_trip_time,
            "end": last_trip_time,
            "trips_count": len(all_trips)
        })

    return output
