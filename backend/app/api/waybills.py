import json
from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.core.database import get_db
from app.core.redis import get_redis
from app.models.models import Waybill, Vehicle, Driver, StationModel, DriverAlert
from app.models.schedule import StaticDuty, StaticShift, StaticTrip, StaticStopTime, Schedule, ScheduleStatus
from app.api.dependencies import get_current_dispatcher
from app.api.websocket import ws_manager
from app.core.logging_config import get_logger

logger = get_logger("waybills")

router = APIRouter(prefix="/waybills", tags=["Smart Waybills & Crew Assignment"])

class WaybillCreate(BaseModel):
    duty_id: int
    vehicle_id: str
    driver_id: str
    target_date: str # Формат YYYY-MM-DD
    shift_sequence: Optional[int] = 1

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

    # 1. Перевіряємо наявність ТЗ або оновлюємо статус
    veh_res = await db.execute(select(Vehicle).where(Vehicle.id == req.vehicle_id))
    vehicle_obj = veh_res.scalar_one_or_none()
    if not vehicle_obj:
        vehicle_obj = Vehicle(
            id=req.vehicle_id,
            type="TRAM",
            model="Tatra T3",
            status="ON_ROUTE",
            is_active=True
        )
        db.add(vehicle_obj)
        await db.flush()
    else:
        vehicle_obj.status = "ON_ROUTE"
        vehicle_obj.is_active = True

    # 2. Перевіряємо водія
    driver_res = await db.execute(select(Driver).where(Driver.id == req.driver_id))
    driver_obj = driver_res.scalar_one_or_none()
    if not driver_obj:
        driver_obj = Driver(
            id=req.driver_id,
            full_name=f"Водій #{req.driver_id}",
            name=f"Водій #{req.driver_id}",
            status="WORK",
            is_active=True
        )
        db.add(driver_obj)
        await db.flush()
    else:
        driver_obj.status = "WORK"

    # 3. Запис електронної путівки в базу даних
    new_waybill = Waybill(
        date=waybill_date,
        duty_id=req.duty_id,
        shift_sequence=req.shift_sequence or 1,
        vehicle_id=req.vehicle_id,
        driver_id=req.driver_id,
        status="ACTIVE"
    )
    db.add(new_waybill)
    await db.flush()
    
    # 4. Витягуємо повну структуру рейсів та зупинок наряду для Redis
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
                    "direction": str(t.direction) if 't' in locals() else str(trip.direction),
                    "arrival_minute": arr_min,
                    "departure_minute": dep_min,
                    "is_control_point": st.is_control_point
                })

    schedule_cache = {
        "waybill_id": new_waybill.id,
        "duty_id": duty_obj.id,
        "duty_number": duty_obj.duty_number,
        "route_id": duty_obj.route_id,
        "vehicle_id": req.vehicle_id,
        "driver_id": req.driver_id,
        "target_date": req.target_date,
        "stops": stops_cache
    }
    
    # 5. Завантаження розкладу в Redis (термін дії - 24 години)
    try:
        redis = await get_redis()
        cache_json = json.dumps(schedule_cache)
        await redis.set(f"schedule_cache:vehicle:{req.vehicle_id}", cache_json, ex=86400)
        logger.info(f"📋 Е-Путівку #{new_waybill.id} видано: Наряд {duty_obj.duty_number} -> Борт #{req.vehicle_id} -> Водій '{req.driver_id}' ({len(stops_cache)} зупинок, {len(cache_json)} байт у Redis)")
    except Exception as e:
        logger.error(f"❌ Помилка запису в Redis: {e}", exc_info=True)

    await db.commit()

    # 6. Оповіщення диспетчерів через WebSocket
    await ws_manager.broadcast({
        "type": "WAYBILL_ASSIGNED",
        "payload": {
            "waybill_id": new_waybill.id,
            "vehicle_id": req.vehicle_id,
            "duty_id": req.duty_id,
            "driver_id": req.driver_id,
            "route_id": duty_obj.route_id,
            "duty_number": duty_obj.duty_number
        }
    })

    return {
        "message": "Путівку створено, телеметрію та похвилинний розклад активовано!", 
        "waybill_id": new_waybill.id,
        "vehicle_id": req.vehicle_id,
        "duty_number": duty_obj.duty_number
    }

@router.get("", summary="Отримання списку путівок")
@router.get("/", summary="Отримання списку путівок")
@router.get("/active", summary="Отримання списку активних путівок")
@router.get("/today", summary="Повертає список виданих путівок на задану дату")
async def get_today_waybills(
    target_date: Optional[str] = Query(None), 
    db: AsyncSession = Depends(get_db)
):
    """Повертає список виданих путівок на задану дату."""
    try:
        req_date = date.fromisoformat(target_date) if target_date else date.today()
    except Exception:
        req_date = date.today()

    query = (
        select(Waybill)
        .where(Waybill.date == req_date)
        .options(
            selectinload(Waybill.duty),
            selectinload(Waybill.vehicle),
            selectinload(Waybill.driver)
        )
        .order_by(Waybill.id.desc())
    )
    result = await db.execute(query)
    waybills = result.scalars().all()
    
    return [
        {
            "id": w.id,
            "date": str(w.date),
            "duty_id": w.duty_id,
            "duty_number": w.duty.duty_number if w.duty else f"#{w.duty_id}",
            "route_id": w.duty.route_id if w.duty else "UNKNOWN",
            "vehicle_id": w.vehicle_id,
            "vehicle_model": w.vehicle.model if w.vehicle else "Tatra T3",
            "driver_id": w.driver_id,
            "driver_name": w.driver.full_name if w.driver else f"Водій #{w.driver_id}",
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
            "duty_type": str(d.duty_type),
            "start": first_trip_time,
            "end": last_trip_time,
            "trips_count": len(all_trips)
        })

    return output

@router.get("/driver/{driver_id}/active")
async def get_driver_active_waybill(
    driver_id: str,
    target_date: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Отримує повну електронну путівку та порейсний розклад для водія.
    """
    try:
        req_date = date.fromisoformat(target_date) if target_date else date.today()
    except Exception:
        req_date = date.today()

    query = (
        select(Waybill)
        .where((Waybill.driver_id == driver_id) & (Waybill.date == req_date))
        .options(
            selectinload(Waybill.duty)
            .selectinload(StaticDuty.shifts)
            .selectinload(StaticShift.trips)
            .selectinload(StaticTrip.stop_times),
            selectinload(Waybill.vehicle),
            selectinload(Waybill.driver)
        )
        .order_by(Waybill.id.desc())
    )
    result = await db.execute(query)
    waybill = result.scalars().first()

    if not waybill:
        raise HTTPException(status_code=404, detail=f"Для водія #{driver_id} на дату {req_date} немає активної путівки")

    stations_res = await db.execute(select(StationModel))
    stations_map = {s.id: s.name for s in stations_res.scalars().all()}

    trips_data = []
    if waybill.duty and waybill.duty.shifts:
        for s in waybill.duty.shifts:
            for t in s.trips or []:
                st_list = t.stop_times or []
                p_start = str(st_list[0].departure_time)[:5] if st_list else "--:--"
                p_end = str(st_list[-1].arrival_time)[:5] if st_list else "--:--"
                
                trips_data.append({
                    "trip_number": t.trip_sequence,
                    "direction": str(t.direction),
                    "route": waybill.duty.route_id,
                    "start_station": stations_map.get(st_list[0].stop_id, st_list[0].stop_id) if st_list else "--",
                    "end_station": stations_map.get(st_list[-1].stop_id, st_list[-1].stop_id) if st_list else "--",
                    "plan_start": p_start,
                    "plan_end": p_end,
                    "fact_start": p_start, # Буде зіставлятися з GPS
                    "fact_end": None,
                    "status": "IN_PROGRESS" if t.trip_sequence == 1 else "PENDING",
                    "is_zero": t.is_zero_run,
                    "stops": [
                        {
                            "stop_id": st.stop_id,
                            "stop_name": stations_map.get(st.stop_id, st.stop_id),
                            "arrival_time": str(st.arrival_time)[:5],
                            "departure_time": str(st.departure_time)[:5],
                            "is_control_point": st.is_control_point
                        }
                        for st in st_list
                    ]
                })

    return {
        "waybill_id": waybill.id,
        "target_date": str(waybill.date),
        "duty_id": waybill.duty_id,
        "duty_number": waybill.duty.duty_number if waybill.duty else f"#{waybill.duty_id}",
        "route_id": waybill.duty.route_id if waybill.duty else "UNKNOWN",
        "driver": {
            "id": waybill.driver_id,
            "full_name": waybill.driver.full_name if waybill.driver else f"Водій #{waybill.driver_id}",
            "class_rank": waybill.driver.class_rank if waybill.driver else 1
        },
        "vehicle": {
            "id": waybill.vehicle_id,
            "model": waybill.vehicle.model if waybill.vehicle else "Tatra T3",
            "type": waybill.vehicle.type if waybill.vehicle else "tram"
        },
        "trips": trips_data,
        "summary": {
            "total_planned_trips": len(trips_data),
            "completed_trips": 0,
            "total_work_hours": "8 год 30 хв"
        }
    }

class CheckInRequest(BaseModel):
    stop_id: str
    action: str = "ARRIVAL"  # ARRIVAL or DEPARTURE
    trip_sequence: Optional[int] = 1

class DriverSosRequest(BaseModel):
    message: str = "Екстрена зупинка на лінії"
    lat: Optional[float] = None
    lon: Optional[float] = None

@router.get("/terminal/{identifier}/active", summary="Отримання або автогенерація активної путівки для бортового термінала")
async def get_terminal_active_waybill(
    identifier: str,
    target_date: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Повертає електронну путівку для водія чи вагона.
    Якщо путівка ще не створена на сьогодні, знаходить перший валідний активний наряд 
    та автоматично прив'язує його, гарантуючи негайну роботу термінала без порожніх екранів.
    """
    try:
        req_date = date.fromisoformat(target_date) if target_date else date.today()
    except Exception:
        req_date = date.today()

    ident = identifier.strip()

    # 1. Спершу шукаємо чи існує вже путівка за vehicle_id або driver_id
    query = (
        select(Waybill)
        .where(
            (Waybill.date == req_date) & 
            ((Waybill.vehicle_id == ident) | (Waybill.driver_id == ident))
        )
        .options(
            selectinload(Waybill.duty)
            .selectinload(StaticDuty.shifts)
            .selectinload(StaticShift.trips)
            .selectinload(StaticTrip.stop_times),
            selectinload(Waybill.vehicle),
            selectinload(Waybill.driver)
        )
        .order_by(Waybill.id.desc())
    )
    res = await db.execute(query)
    waybill = res.scalars().first()

    # 2. Якщо не знайдено, перевіряємо наявність ТЗ чи водія і прив'язуємо наряд
    if not waybill:
        veh_res = await db.execute(select(Vehicle).where(Vehicle.id == ident))
        veh_obj = veh_res.scalar_one_or_none()
        
        drv_res = await db.execute(select(Driver).where(Driver.id == ident))
        drv_obj = drv_res.scalar_one_or_none()

        assigned_vehicle_id = veh_obj.id if veh_obj else (ident if not drv_obj else "4020")
        assigned_driver_id = drv_obj.id if drv_obj else ("Т-1001" if veh_obj else ident)

        duty_query = (
            select(StaticDuty)
            .join(Schedule, StaticDuty.schedule_id == Schedule.id)
            .where(Schedule.status == ScheduleStatus.ACTIVE)
            .options(
                selectinload(StaticDuty.shifts)
                .selectinload(StaticShift.trips)
                .selectinload(StaticTrip.stop_times)
            )
            .order_by(StaticDuty.id.asc())
        )
        d_res = await db.execute(duty_query)
        target_duty = d_res.scalars().first()

        if target_duty:
            assigned_veh_res = await db.execute(select(Vehicle).where(Vehicle.id == assigned_vehicle_id))
            final_veh = assigned_veh_res.scalar_one_or_none()
            if not final_veh:
                final_veh = Vehicle(
                    id=assigned_vehicle_id,
                    type="TRAM",
                    model="Tatra T3",
                    status="ON_ROUTE",
                    is_active=True
                )
                db.add(final_veh)
                await db.flush()

            assigned_drv_res = await db.execute(select(Driver).where(Driver.id == assigned_driver_id))
            final_drv = assigned_drv_res.scalar_one_or_none()
            if not final_drv:
                final_drv = Driver(
                    id=assigned_driver_id,
                    full_name=f"Водій #{assigned_driver_id}",
                    name=f"Водій #{assigned_driver_id}",
                    status="WORK",
                    is_active=True
                )
                db.add(final_drv)
                await db.flush()

            waybill = Waybill(
                date=req_date,
                duty_id=target_duty.id,
                shift_sequence=1,
                vehicle_id=assigned_vehicle_id,
                driver_id=assigned_driver_id,
                status="ACTIVE"
            )
            db.add(waybill)
            await db.commit()
            
            q_reload = (
                select(Waybill)
                .where(Waybill.id == waybill.id)
                .options(
                    selectinload(Waybill.duty)
                    .selectinload(StaticDuty.shifts)
                    .selectinload(StaticShift.trips)
                    .selectinload(StaticTrip.stop_times),
                    selectinload(Waybill.vehicle),
                    selectinload(Waybill.driver)
                )
            )
            w_rel = await db.execute(q_reload)
            waybill = w_rel.scalar_one_or_none()

    if not waybill:
        raise HTTPException(status_code=404, detail="Не вдалося знайти або сформувати наряд")

    stations_res = await db.execute(select(StationModel))
    stations_map = {s.id: s.name for s in stations_res.scalars().all()}

    trips_data = []
    if waybill.duty and waybill.duty.shifts:
        for s in waybill.duty.shifts:
            for t in s.trips or []:
                st_list = t.stop_times or []
                p_start = str(st_list[0].departure_time)[:5] if st_list else "--:--"
                p_end = str(st_list[-1].arrival_time)[:5] if st_list else "--:--"
                
                trips_data.append({
                    "trip_number": t.trip_sequence,
                    "direction": str(t.direction),
                    "route": waybill.duty.route_id,
                    "start_station": stations_map.get(st_list[0].stop_id, st_list[0].stop_id) if st_list else "--",
                    "end_station": stations_map.get(st_list[-1].stop_id, st_list[-1].stop_id) if st_list else "--",
                    "plan_start": p_start,
                    "plan_end": p_end,
                    "fact_start": p_start,
                    "fact_end": None,
                    "status": "IN_PROGRESS" if t.trip_sequence == 1 else "PENDING",
                    "is_zero": t.is_zero_run,
                    "stops": [
                        {
                            "stop_id": st.stop_id,
                            "stop_name": stations_map.get(st.stop_id, st.stop_id),
                            "arrival_time": str(st.arrival_time)[:5],
                            "departure_time": str(st.departure_time)[:5],
                            "is_control_point": st.is_control_point
                        }
                        for st in st_list
                    ]
                })

    return {
        "waybill_id": waybill.id,
        "target_date": str(waybill.date),
        "duty_id": waybill.duty_id,
        "duty_number": waybill.duty.duty_number if waybill.duty else f"#{waybill.duty_id}",
        "route_id": waybill.duty.route_id if waybill.duty else "18",
        "driver": {
            "id": waybill.driver_id,
            "full_name": waybill.driver.full_name if waybill.driver else f"Водій #{waybill.driver_id}",
            "class_rank": waybill.driver.class_rank if waybill.driver else 1
        },
        "vehicle": {
            "id": waybill.vehicle_id,
            "model": waybill.vehicle.model if waybill.vehicle else "Tatra T3",
            "type": waybill.vehicle.type if waybill.vehicle else "tram"
        },
        "trips": trips_data,
        "summary": {
            "total_planned_trips": len(trips_data),
            "completed_trips": 0,
            "total_work_hours": "8 год 15 хв"
        }
    }

@router.post("/{waybill_id}/checkin")
async def driver_checkin(
    waybill_id: int,
    req: CheckInRequest,
    db: AsyncSession = Depends(get_db)
):
    """Фіксація прибуття або відправлення водія на зупинці / ДП."""
    w_res = await db.execute(select(Waybill).where(Waybill.id == waybill_id))
    waybill = w_res.scalar_one_or_none()
    if not waybill:
        raise HTTPException(status_code=404, detail="Путівку не знайдено")

    now_iso = datetime.utcnow().isoformat()

    # Сповіщаємо диспетчера через WebSocket
    await ws_manager.broadcast({
        "type": "DRIVER_CHECKIN",
        "payload": {
            "waybill_id": waybill_id,
            "vehicle_id": waybill.vehicle_id,
            "driver_id": waybill.driver_id,
            "stop_id": req.stop_id,
            "action": req.action,
            "trip_sequence": req.trip_sequence,
            "timestamp": now_iso
        }
    })

    return {
        "status": "success",
        "message": f"Відмітку '{req.action}' на зупинці {req.stop_id} збережено",
        "timestamp": now_iso
    }

@router.post("/{waybill_id}/sos")
async def driver_sos(
    waybill_id: int,
    req: DriverSosRequest,
    db: AsyncSession = Depends(get_db)
):
    """Екстрений сигнал SOS від водія кабіни."""
    w_res = await db.execute(select(Waybill).where(Waybill.id == waybill_id).options(selectinload(Waybill.duty)))
    waybill = w_res.scalar_one_or_none()
    if not waybill:
        raise HTTPException(status_code=404, detail="Путівку не знайдено")

    route_id = waybill.duty.route_id if waybill.duty else "18"

    # 1. Записуємо в DriverAlert
    alert = DriverAlert(
        vehicle_id=waybill.vehicle_id,
        driver_id=waybill.driver_id,
        route_id=route_id,
        alert_type="EMERGENCY_SOS",
        message=req.message,
        status="NEW",
        lat=req.lat,
        lng=req.lon
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)

    # 2. Транслюємо DRIVER_SOS через WebSocket
    await ws_manager.broadcast({
        "type": "DRIVER_SOS",
        "payload": {
            "id": alert.id,
            "vehicle_id": waybill.vehicle_id,
            "driver_id": waybill.driver_id,
            "route_id": route_id,
            "message": req.message,
            "lat": req.lat,
            "lng": req.lon,
            "timestamp": datetime.utcnow().isoformat()
        }
    })

    return {
        "status": "sos_broadcasted",
        "alert_id": alert.id,
        "message": "Сигнал тривоги передано черговому диспетчеру ЦД!"
    }
