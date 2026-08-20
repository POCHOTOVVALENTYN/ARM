from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select, update, func
from sqlalchemy.orm import selectinload
from typing import List, Optional, Union, Dict, Any
from datetime import date, time as dt_time
from pydantic import BaseModel

from app.api.dependencies import get_db, get_current_dispatcher
from app.schemas.schedule import GenerateGridRequest, StaticDutyResponse, ScheduleResponse
from app.models.schedule import (
    Schedule, ScheduleStatus, StaticDuty, StaticShift, StaticTrip, StaticStopTime,
    ServiceDay, DutyType, TripDirection
)
from app.models.models import EtaLog, RouteStation, StationModel, RouteModel
from app.services.schedule_engine import ScheduleEnginePipeline
from app.repositories.schedule_repo import ScheduleRepository
from app.services.telemetry_worker import cache_active_schedule_in_redis
from app.services.transit_solver import transit_solver, generate_optimized_schedule, parse_time_str, minutes_to_time
from app.api.websocket import ws_manager

router = APIRouter(prefix="/schedules", tags=["Schedules & Transit Solver"])

# --- Схеми запитів/відповідей ---
class TripUpdate(BaseModel):
    start_time: str
    end_time: str

class GenerateScheduleRequest(BaseModel):
    route_id: str
    vehicles_count: int
    start_time: str
    end_time: str
    route_length_km: float
    avg_speed_kmh: float
    zero_trip_min: int = 15
    use_elastic_smoother: bool = True

class TripCreate(BaseModel):
    direction: str
    start_time: str
    end_time: str
    is_zero: bool = False
    trip_type: Optional[str] = "REGULAR"

class ShiftCreate(BaseModel):
    id: Optional[Union[int, str]] = None
    shift_sequence: Optional[int] = 1
    shift_type: Optional[str] = "FULL"
    vehicle_id: Optional[str] = None
    has_break: Optional[bool] = False
    break_duration_minutes: Optional[int] = 0
    trips: List[TripCreate] = []

class DutyCreate(BaseModel):
    duty_number: str
    duty_type: Optional[str] = "DOUBLE"
    shifts: List[ShiftCreate] = []

class ScheduleCommitRequest(BaseModel):
    route_id: str
    duties: List[DutyCreate]
    version_name: Optional[str] = "Еталонний розклад ОМЕТ"

# --- Ендпоінти генерації та збереження розкладів ---

@router.post("/generate-draft")
async def api_generate_draft(
    req: GenerateScheduleRequest
):
    """
    Генерує математичну модель добового розкладу в пам'яті (Transit Solver).
    """
    draft_data = generate_optimized_schedule(
        route_id=req.route_id,
        vehicles_count=req.vehicles_count,
        start_time=req.start_time,
        end_time=req.end_time,
        route_length_km=req.route_length_km,
        avg_speed_kmh=req.avg_speed_kmh,
        zero_trip_min=req.zero_trip_min,
        use_elastic_smoother=req.use_elastic_smoother
    )
    return draft_data

@router.post("/commit-draft")
async def commit_schedule_draft(
    req: ScheduleCommitRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Зберігає згенерований розклад як активний (Еталонний).
    Реалізує ДВОРІВНЕВИЙ розрахунок:
    - Рівень 1: Контрольні точки (is_control_point = True) для «Сітки статичних нарядів».
    - Рівень 2: Повна похвилинна інтерполяція ВСІХ проміжних зупинок для «Табеля та книжки водія».
    """
    today = date.today()

    # 1. Створюємо шапку еталонного розкладу
    new_schedule = Schedule(
        route_id=req.route_id,
        active_date=today,
        status=ScheduleStatus.ACTIVE,
        version_name=req.version_name or "Еталонний розклад ОМЕТ"
    )
    db.add(new_schedule)
    await db.flush() # new_schedule.id
    
    # 2. Архівуємо всі інші активні розклади для цього маршруту
    archive_stmt = (
        update(Schedule)
        .where((Schedule.route_id == req.route_id) & (Schedule.id != new_schedule.id))
        .values(status=ScheduleStatus.ARCHIVED)
    )
    await db.execute(archive_stmt)

    # 3. Завантажуємо всі зупинки маршруту для прямого та зворотного напрямків
    dir0_query = (
        select(RouteStation.stop_id, RouteStation.stop_sequence, StationModel.name, StationModel.is_dispatch_station)
        .join(StationModel, RouteStation.stop_id == StationModel.id, isouter=True)
        .where((RouteStation.route_id == req.route_id) & (RouteStation.direction_id == 0))
        .order_by(RouteStation.stop_sequence.asc())
    )
    dir0_stops = (await db.execute(dir0_query)).all()

    dir1_query = (
        select(RouteStation.stop_id, RouteStation.stop_sequence, StationModel.name, StationModel.is_dispatch_station)
        .join(StationModel, RouteStation.stop_id == StationModel.id, isouter=True)
        .where((RouteStation.route_id == req.route_id) & (RouteStation.direction_id == 1))
        .order_by(RouteStation.stop_sequence.asc())
    )
    dir1_stops = (await db.execute(dir1_query)).all()

    # Fallback якщо RouteStation не заповнено для цього маршруту
    if not dir0_stops:
        all_st_res = (await db.execute(select(StationModel).limit(15))).scalars().all()
        dir0_stops = [(s.id, idx + 1, s.name, s.is_dispatch_station) for idx, s in enumerate(all_st_res)]
        dir1_stops = list(reversed(dir0_stops))

    # 4. Запис Нарядів (Duties), Змін (Shifts) та Рейсів (Trips) з повною інтерполяцією зупинок
    for duty in req.duties:
        duty_t_str = str(duty.duty_type or "DOUBLE").upper()
        dtype_enum = DutyType.DOUBLE
        if "SINGLE" in duty_t_str:
            dtype_enum = DutyType.SINGLE
        elif "SPLIT" in duty_t_str:
            dtype_enum = DutyType.SPLIT
        elif "PEAK" in duty_t_str:
            dtype_enum = DutyType.PEAK

        new_duty = StaticDuty(
            schedule_id=new_schedule.id,
            route_id=req.route_id,
            duty_number=str(duty.duty_number),
            service_id=ServiceDay.WORKDAY,
            duty_type=dtype_enum
        )
        db.add(new_duty)
        await db.flush()
        
        for idx_shift, shift in enumerate(duty.shifts, start=1):
            new_shift = StaticShift(
                duty_id=new_duty.id,
                shift_sequence=shift.shift_sequence or idx_shift,
                vehicle_id=shift.vehicle_id,
                has_break=shift.has_break or False,
                break_duration_minutes=shift.break_duration_minutes or (15 if shift.has_break else 0)
            )
            db.add(new_shift)
            await db.flush()
            
            for idx_trip, trip in enumerate(shift.trips, start=1):
                dir_str = str(trip.direction).upper()
                if "PULL_OUT" in dir_str or "ВИЇЗД" in dir_str or "НУЛЬОВИЙ" in dir_str:
                    tdir = TripDirection.PULL_OUT
                    trip_type = "PULL_OUT"
                    is_zero = True
                    trip_stops = dir0_stops
                elif "PULL_IN" in dir_str or "ЗАЇЗД" in dir_str:
                    tdir = TripDirection.PULL_IN
                    trip_type = "PULL_IN"
                    is_zero = True
                    trip_stops = dir1_stops
                elif "BACKWARD" in dir_str or "ЗВОРОТ" in dir_str or "2" in dir_str:
                    tdir = TripDirection.BACKWARD
                    trip_type = "REGULAR"
                    is_zero = False
                    trip_stops = dir1_stops or list(reversed(dir0_stops))
                else:
                    tdir = TripDirection.FORWARD
                    trip_type = "REGULAR"
                    is_zero = False
                    trip_stops = dir0_stops

                new_trip = StaticTrip(
                    shift_id=new_shift.id,
                    trip_sequence=idx_trip,
                    direction=tdir,
                    trip_type=trip_type,
                    is_zero_run=is_zero,
                    smoothing_state="normal",
                    smoothing_delta=0.0
                )
                db.add(new_trip)
                await db.flush()

                try:
                    st_time = parse_time_str(trip.start_time)
                    en_time = parse_time_str(trip.end_time)
                except Exception:
                    st_time = parse_time_str("06:00")
                    en_time = parse_time_str("06:45")

                st_mins = st_time.hour * 60 + st_time.minute + st_time.second / 60.0
                en_mins = en_time.hour * 60 + en_time.minute + en_time.second / 60.0
                if en_mins < st_mins:
                    en_mins += 1440
                total_duration = max(1.0, en_mins - st_mins)

                num_stops = len(trip_stops)
                if num_stops == 0:
                    continue

                for s_idx, stop_row in enumerate(trip_stops):
                    fraction = (s_idx / (num_stops - 1)) if num_stops > 1 else 0.0
                    stop_point_min = (st_mins + fraction * total_duration) % 1440
                    t_point = minutes_to_time(stop_point_min)

                    is_ctrl = (s_idx == 0) or (s_idx == num_stops - 1) or bool(stop_row[3])

                    stop_time_entry = StaticStopTime(
                        trip_id=new_trip.id,
                        stop_id=str(stop_row[0]),
                        stop_sequence=s_idx + 1,
                        arrival_time=t_point,
                        departure_time=t_point,
                        is_break_location=bool(s_idx == num_stops - 1 and shift.has_break),
                        is_control_point=is_ctrl
                    )
                    db.add(stop_time_entry)

    await db.commit()

    repo = ScheduleRepository(db)
    full_schedule = await repo.get_schedule_with_full_hierarchy(new_schedule.id)
    if full_schedule:
        await cache_active_schedule_in_redis(full_schedule)

    await ws_manager.broadcast({
        "type": "invalidate_schedules",
        "schedule_id": new_schedule.id,
        "route_id": req.route_id
    })
    
    return {
        "message": "Еталонний розклад успішно збережено з повною похвилинною інтерполяцією зупинок!", 
        "schedule_id": new_schedule.id,
        "status": "ACTIVE"
    }

@router.get("/active", response_model=List[ScheduleResponse])
async def get_all_active_schedules(
    route_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Повертає список усіх активних розкладів підприємства."""
    repo = ScheduleRepository(db)
    if route_id:
        single_sched = await repo.get_active_schedule_for_route(route_id)
        return [single_sched] if single_sched else []
    
    active_schedules = await repo.get_all_active_schedules()
    return active_schedules

@router.get("/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule(schedule_id: int, db: AsyncSession = Depends(get_db)):
    """Отримання повної структури розкладу."""
    repo = ScheduleRepository(db)
    schedule = await repo.get_schedule_with_full_hierarchy(schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Розклад не знайдено")
    return schedule

@router.get("/{schedule_id}/driver-logbook")
async def get_driver_logbook(
    schedule_id: int,
    duty_number: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Повертає похвилинний розклад руху з усіма проміжними зупинками
    спеціально для розділу «Персональний» / «Табель та книжка водіїв».
    """
    query = (
        select(StaticDuty)
        .where(StaticDuty.schedule_id == schedule_id)
        .options(
            selectinload(StaticDuty.shifts)
            .selectinload(StaticShift.trips)
            .selectinload(StaticTrip.stop_times)
        )
    )
    if duty_number:
        query = query.where(StaticDuty.duty_number == duty_number)

    result = await db.execute(query)
    duties = result.scalars().all()

    stations_res = await db.execute(select(StationModel))
    stations_map = {s.id: s.name for s in stations_res.scalars().all()}

    output = []
    for d in duties:
        for s in d.shifts or []:
            for t in s.trips or []:
                stops_detail = []
                for st in t.stop_times or []:
                    stops_detail.append({
                        "sequence": st.stop_sequence,
                        "stop_id": st.stop_id,
                        "stop_name": stations_map.get(st.stop_id, f"Зупинка #{st.stop_id}"),
                        "arrival_time": str(st.arrival_time)[:5],
                        "departure_time": str(st.departure_time)[:5],
                        "is_control_point": st.is_control_point,
                        "is_break": st.is_break_location
                    })

                output.append({
                    "duty_number": d.duty_number,
                    "shift_sequence": s.shift_sequence,
                    "trip_sequence": t.trip_sequence,
                    "direction": str(t.direction),
                    "trip_type": t.trip_type,
                    "is_zero_run": t.is_zero_run,
                    "start_time": str(t.stop_times[0].arrival_time)[:5] if t.stop_times else "--:--",
                    "end_time": str(t.stop_times[-1].arrival_time)[:5] if t.stop_times else "--:--",
                    "stops": stops_detail
                })

    return output

@router.get("/{schedule_id}/control-grid")
async def get_control_points_grid(
    schedule_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Повертає сітку розкладу ТІЛЬКИ по контрольних точках (кінцеві + хаби)
    для розділу «Планування» / «Сітка статичних нарядів».
    """
    query = (
        select(StaticDuty)
        .where(StaticDuty.schedule_id == schedule_id)
        .options(
            selectinload(StaticDuty.shifts)
            .selectinload(StaticShift.trips)
            .selectinload(StaticTrip.stop_times)
        )
    )
    result = await db.execute(query)
    duties = result.scalars().all()

    stations_res = await db.execute(select(StationModel))
    stations_map = {s.id: s.name for s in stations_res.scalars().all()}

    grid = []
    for d in duties:
        duty_trips = []
        for s in d.shifts or []:
            for t in s.trips or []:
                control_stops = [st for st in (t.stop_times or []) if st.is_control_point]
                duty_trips.append({
                    "trip_sequence": t.trip_sequence,
                    "direction": str(t.direction),
                    "start_control_point": stations_map.get(control_stops[0].stop_id, control_stops[0].stop_id) if control_stops else "--",
                    "start_time": str(control_stops[0].departure_time)[:5] if control_stops else "--:--",
                    "end_control_point": stations_map.get(control_stops[-1].stop_id, control_stops[-1].stop_id) if control_stops else "--",
                    "end_time": str(control_stops[-1].arrival_time)[:5] if control_stops else "--:--",
                    "intermediate_controls": [
                        {
                            "name": stations_map.get(st.stop_id, st.stop_id),
                            "time": str(st.arrival_time)[:5]
                        }
                        for st in control_stops[1:-1]
                    ]
                })
        grid.append({
            "duty_number": d.duty_number,
            "duty_type": str(d.duty_type),
            "trips": duty_trips
        })

    return grid

@router.put("/trips/{trip_id}", summary="Оновлення планового часу відправлення та прибуття для конкретного рейсу")
async def update_trip_time(
    trip_id: int,
    trip_data: TripUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Оновлення планового часу рейсу з пропорційною інтерполяцією проміжних зупинок."""
    try:
        start_t = parse_time_str(trip_data.start_time)
        end_t = parse_time_str(trip_data.end_time)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Некоректний формат часу (очікується ГГ:ХХ): {str(e)}")

    query = (
        select(StaticTrip)
        .where(StaticTrip.id == trip_id)
        .options(selectinload(StaticTrip.stop_times))
    )
    result = await db.execute(query)
    trip = result.scalar_one_or_none()

    if not trip:
        raise HTTPException(status_code=404, detail="Рейс не знайдено")

    if trip.stop_times:
        sorted_stops = sorted(trip.stop_times, key=lambda s: s.stop_sequence)
        if len(sorted_stops) == 1:
            sorted_stops[0].departure_time = start_t
            sorted_stops[0].arrival_time = end_t
        elif len(sorted_stops) > 1:
            sorted_stops[0].departure_time = start_t
            sorted_stops[0].arrival_time = start_t
            sorted_stops[-1].arrival_time = end_t
            sorted_stops[-1].departure_time = end_t
            
            # Пропорційна інтерполяція для проміжних зупинок
            start_mins = start_t.hour * 60 + start_t.minute + start_t.second / 60.0
            end_mins = end_t.hour * 60 + end_t.minute + end_t.second / 60.0
            if end_mins < start_mins:
                end_mins += 1440
            total_span = max(1.0, end_mins - start_mins)
            n_segments = len(sorted_stops) - 1

            for idx, stop in enumerate(sorted_stops[1:-1], start=1):
                fraction = idx / n_segments
                inter_mins = (start_mins + fraction * total_span) % 1440
                ih = int(inter_mins // 60)
                im = int(inter_mins % 60)
                isec = int((inter_mins * 60) % 60)
                stop.arrival_time = dt_time(hour=ih, minute=im, second=isec)
                stop.departure_time = dt_time(hour=ih, minute=im, second=isec)

    await db.commit()

    await ws_manager.broadcast({
        "type": "schedule_draft_updated",
        "trip_id": trip_id
    })

    return {"message": "Час рейсу успішно оновлено", "trip_id": trip_id}

# --- СТАТИЧНИЙ РОЗРАХУНОК СЛУЖБИ РУХУ (STATIC SCHEDULE ENGINE) ---

class StaticCalculationRequest(BaseModel):
    route_id: str
    vehicles_count: int = 14
    day_type: str = "WORKDAY"
    start_time: Optional[str] = "05:30"
    end_time: Optional[str] = "23:30"
    duty_types_sequence: Optional[List[str]] = None

@router.post("/calculate-static", summary="Інженерний розрахунок статичного графіка служби руху")
async def calculate_static_schedule(
    payload: StaticCalculationRequest,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Автоматично завантажує зафіксовані нормативи маршруту з PostgreSQL
    (T_оборот, час рейсу, відстої, норматив обіду 15/20хв, закріплений ДП)
    та розраховує повну статичну сітку нарядів (колонки та діаграму Ганта).
    """
    # 1. Завантажуємо маршрут та нормативи
    r_res = await db.execute(select(RouteModel).where(RouteModel.id == payload.route_id))
    route = r_res.scalar_one_or_none()

    if not route:
        # Fallback параметри якщо маршрут новий
        r_name = f"Маршрут №{payload.route_id}"
        r_type = "TRAM"
        round_trip_min = 84
        t_dir0_min = 36
        t_dir1_min = 36
        layover_min = 6
        depot_pullout_min = 15
        depot_pullin_min = 15
        standard_break_min = 15
        designated_break_hub = "ДП «вул. Паустовського»"
    else:
        r_name = route.name or f"Маршрут №{route.number or route.id}"
        r_type = (route.type or "TRAM").upper()
        round_trip_min = route.round_trip_min or 84
        t_dir0_min = route.t_dir0_min or 36
        t_dir1_min = route.t_dir1_min or 36
        layover_min = route.layover_min or 6
        depot_pullout_min = route.depot_pullout_min or 15
        depot_pullin_min = route.depot_pullin_min or 15
        standard_break_min = route.standard_break_min or (15 if r_type == "TRAM" else 20)
        designated_break_hub = route.designated_break_hub or "ДП «вул. Паустовського»"

    # 2. Завантажуємо реальні зупинки маршруту
    st_res = await db.execute(
        select(StationModel.id, StationModel.name, StationModel.is_dispatch_station)
        .join(RouteStation, RouteStation.stop_id == StationModel.id)
        .where((RouteStation.route_id == payload.route_id) & (RouteStation.direction_id == 0))
        .order_by(RouteStation.stop_sequence.asc())
    )
    stops = [{"id": s[0], "name": s[1], "is_dispatch_station": bool(s[2])} for s in st_res.all()]

    # 3. Виконуємо інженерний розрахунок
    result = transit_solver.calculate_static_schedule_from_norms(
        route_id=payload.route_id,
        route_name=r_name,
        route_type=r_type,
        vehicles_count=payload.vehicles_count,
        start_time_str=payload.start_time or "05:30",
        end_time_str=payload.end_time or "23:30",
        round_trip_min=round_trip_min,
        t_dir0_min=t_dir0_min,
        t_dir1_min=t_dir1_min,
        layover_min=layover_min,
        depot_pullout_min=depot_pullout_min,
        depot_pullin_min=depot_pullin_min,
        standard_break_min=standard_break_min,
        designated_break_hub=designated_break_hub,
        stops_list=stops,
        duty_types_sequence=payload.duty_types_sequence
    )

    return result

@router.post("/commit-static", summary="Затвердження еталонного статичного графіка")
async def commit_static_schedule(
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    dispatcher = Depends(get_current_dispatcher)
):
    """
    Зберігає розрахований статичний графік як «Еталонний розклад» у PostgreSQL
    та публікує подію для Диспетчерської через WebSocket та Redis.
    """
    kpi = payload.get("kpi", {})
    route_id = kpi.get("route_id", "7")
    today = date.today()

    # 1. Створюємо розклад
    new_schedule = Schedule(
        route_id=route_id,
        active_date=today,
        status=ScheduleStatus.ACTIVE,
        version_name=f"Еталонний розклад #{route_id} ({kpi.get('vehicles_count', 14)} нарядів, H={kpi.get('headway_min', 6.0)}хв)"
    )
    db.add(new_schedule)
    await db.flush()

    # 2. Архівуємо попередні
    await db.execute(
        update(Schedule)
        .where((Schedule.route_id == route_id) & (Schedule.id != new_schedule.id))
        .values(status=ScheduleStatus.ARCHIVED)
    )

    # 3. Зберігаємо наряди
    columns = payload.get("columns", [])
    for col in columns:
        dtype_str = str(col.get("duty_type", "DOUBLE")).upper()
        dtype_enum = DutyType.DOUBLE
        if "SINGLE" in dtype_str:
            dtype_enum = DutyType.SINGLE
        elif "SPLIT" in dtype_str:
            dtype_enum = DutyType.SPLIT
        elif "PEAK" in dtype_str:
            dtype_enum = DutyType.PEAK

        new_duty = StaticDuty(
            schedule_id=new_schedule.id,
            route_id=route_id,
            duty_number=str(col.get("duty_id", f"{route_id}-{col.get('duty_number', 1):02d}")),
            service_id=ServiceDay.WORKDAY,
            duty_type=dtype_enum
        )
        db.add(new_duty)

    await db.commit()

    # 4. Сповіщаємо диспетчерів про новий еталонний розклад
    await ws_manager.broadcast({
        "type": "STATIC_SCHEDULE_ACTIVATED",
        "payload": {
            "schedule_id": new_schedule.id,
            "route_id": route_id,
            "version_name": new_schedule.version_name,
            "headway_min": kpi.get("headway_min", 6.0),
            "vehicles_count": kpi.get("vehicles_count", 14)
        }
    })

    return {
        "status": "success",
        "schedule_id": new_schedule.id,
        "message": f"Еталонний статичний розклад для маршруту №{route_id} успішно затверджено в PostgreSQL!"
    }
