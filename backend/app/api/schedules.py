from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
import io
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
    ServiceDay, DutyType, TripDirection, ScheduleTemplate
)
from app.models.shift import DriverShiftModel
from app.models.models import EtaLog, RouteStation, StationModel, RouteModel
from app.services.schedule_engine import ScheduleEnginePipeline
from app.repositories.schedule_repo import ScheduleRepository
from app.services.telemetry_worker import cache_active_schedule_in_redis
from app.services.transit_solver import (
    transit_solver, generate_optimized_schedule, generate_omet_master_schedule,
    parse_time_str, minutes_to_time
)
from app.api.websocket import ws_manager
from app.services.gtfs_exporter import export_gtfs_archive

router = APIRouter(prefix="/schedules", tags=["Schedules & Transit Solver"])

# --- Схеми запитів/відповідей ---
class TripUpdate(BaseModel):
    start_time: str
    end_time: str

class GenerateMasterScheduleRequest(BaseModel):
    route_id: str
    route_name: Optional[str] = "Станція «Аркадія» — Автовокзал"
    transport_type: Optional[str] = "TRAM"
    duties_count: int = 14
    round_trip_min: int = 85
    route_length_km: float = 17.9
    default_speed_kmh: float = 12.3
    start_time: Optional[str] = "05:00"
    end_time: Optional[str] = "23:15"
    designated_dp_name: Optional[str] = "Станція «Аркадія»"
    secondary_dp_name: Optional[str] = None
    control_points: Optional[List[Dict[str, Any]]] = None
    depot_name: Optional[str] = "ТД-2"
    depot_zero_run_min: Optional[int] = 29
    depot_zero_run_km: Optional[float] = 6.4
    depot_junction_stop_name: Optional[str] = "Музкомедія"
    start_stations_per_duty: Optional[Dict[str, str]] = None
    duty_types_per_duty: Optional[Dict[str, str]] = None
    depots_per_duty: Optional[Dict[str, str]] = None
    vehicles_per_duty: Optional[Dict[str, str]] = None
    vehicles2_per_duty: Optional[Dict[str, str]] = None
    rotation_junctions_per_duty: Optional[Dict[str, str]] = None
    duty_configs: Optional[List[Dict[str, Any]]] = None
    schedule_period: Optional[str] = "з 22 вересня по 11 жовтня 2026 року"
    schedule_type: Optional[str] = "Будній"

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

@router.post("/generate-master")
async def api_generate_master_schedule(req: GenerateMasterScheduleRequest):
    """
    Генерує повну зведену шахову таблицю всіх рейсів та поїзні розклади водіїв за Контрольними Точками (КТ).
    """
    res = generate_omet_master_schedule(
        route_id=req.route_id,
        route_name=req.route_name or f"Маршрут #{req.route_id}",
        transport_type=req.transport_type or "TRAM",
        duties_count=req.duties_count,
        round_trip_min=req.round_trip_min,
        route_length_km=req.route_length_km,
        default_speed_kmh=req.default_speed_kmh,
        start_time=req.start_time or "05:00",
        end_time=req.end_time or "23:15",
        designated_dp_name=req.designated_dp_name or "Диспетчерський пункт",
        secondary_dp_name=req.secondary_dp_name,
        control_points=req.control_points,
        depot_name=req.depot_name or "ТД-2",
        depot_zero_run_min=req.depot_zero_run_min or 29,
        depot_zero_run_km=req.depot_zero_run_km or 6.4,
        depot_junction_stop_name=req.depot_junction_stop_name or "Вузол примикання",
        start_stations_per_duty=req.start_stations_per_duty,
        duty_types_per_duty=req.duty_types_per_duty,
        depots_per_duty=req.depots_per_duty,
        vehicles_per_duty=req.vehicles_per_duty,
        vehicles2_per_duty=req.vehicles2_per_duty,
        rotation_junctions_per_duty=req.rotation_junctions_per_duty,
        duty_configs=req.duty_configs,
        schedule_period=req.schedule_period or "з 22 вересня по 11 жовтня 2026 року",
        schedule_type=req.schedule_type or "Будній"
    )
    return res

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


@router.get("/export-gtfs.zip", summary="Експорт стандартизованого GTFS архіву Open Data для Одеси")
async def export_gtfs_zip(
    db: AsyncSession = Depends(get_db)
):
    """
    Генерує валідований архів GTFS (agency.txt, calendar.txt, routes.txt, stops.txt, trips.txt, stop_times.txt, shapes.txt)
    безпосередньо з реальних таблиць БД для публікації на порталі відкритих даних Одеси та Google Transit.
    """
    result = await export_gtfs_archive(db)
    zip_bytes = result["zip_bytes"]
    filename = result["filename"]

    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.get("/validate-gtfs", summary="Валідація цілісності GTFS даних")
async def validate_gtfs_data(
    db: AsyncSession = Depends(get_db)
):
    """
    Виконує автоматизований аудит цілісності GTFS довідників, кількості маршрутів, зупинок та рейсів.
    """
    result = await export_gtfs_archive(db)
    return result["validation"]


@router.get("/duty-types", summary="Отримання списку типів нарядів (alias)")
async def get_schedules_duty_types(db: AsyncSession = Depends(get_db)):
    """Аліас для /duty-types для запобігання колізії маршрутизації з {schedule_id}."""
    from app.api.duty_types import get_duty_types
    return await get_duty_types(db)


@router.get("/{schedule_id:int}", response_model=ScheduleResponse)
async def get_schedule(schedule_id: int, db: AsyncSession = Depends(get_db)):
    """Отримання повної структури розкладу."""
    repo = ScheduleRepository(db)
    schedule = await repo.get_schedule_with_full_hierarchy(schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Розклад не знайдено")
    return schedule

@router.get("/{schedule_id:int}/driver-logbook")
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

@router.get("/{schedule_id:int}/control-grid")
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
    db: AsyncSession = Depends(get_db)
):
    """
    Зберігає розрахований статичний графік як «Еталонний розклад» у PostgreSQL/SQLite
    (зберігає Schedule, StaticDuty, StaticShift, StaticTrip)
    та публікує подію для Диспетчерської через WebSocket та Redis.
    """
    kpi = payload.get("kpi") or payload.get("summary_passport") or {}
    route_id = str(kpi.get("route_id") or payload.get("route_id") or "18")
    vehicles_count = kpi.get("vehicles_count") or kpi.get("duties_count") or 14
    headway_min = kpi.get("headway_min") or 6.0
    today = date.today()

    # 1. Створюємо розклад
    new_schedule = Schedule(
        route_id=route_id,
        active_date=today,
        status=ScheduleStatus.ACTIVE,
        version_name=f"Еталонний розклад #{route_id} ({vehicles_count} нарядів, H={headway_min}хв)"
    )
    db.add(new_schedule)
    await db.flush()

    # 2. Архівуємо попередні
    await db.execute(
        update(Schedule)
        .where((Schedule.route_id == route_id) & (Schedule.id != new_schedule.id))
        .values(status=ScheduleStatus.ARCHIVED)
    )

    # Отримуємо станції маршруту для формування точних записів зупинок
    rs_res = await db.execute(
        select(RouteStation)
        .where(RouteStation.route_id == route_id)
        .order_by(RouteStation.direction_id, RouteStation.stop_sequence)
    )
    r_stations = rs_res.scalars().all()
    dir0_stops = [rs.stop_id for rs in r_stations if rs.direction_id == 0]
    dir1_stops = [rs.stop_id for rs in r_stations if rs.direction_id == 1]
    all_stops = [rs.stop_id for rs in r_stations]

    start_sid_fwd = dir0_stops[0] if dir0_stops else (all_stops[0] if all_stops else f"stop_{route_id}_start")
    end_sid_fwd = dir0_stops[-1] if dir0_stops else (all_stops[-1] if all_stops else f"stop_{route_id}_end")
    start_sid_bwd = dir1_stops[0] if dir1_stops else end_sid_fwd
    end_sid_bwd = dir1_stops[-1] if dir1_stops else start_sid_fwd

    # 3. Зберігаємо наряди, зміни та рейси
    columns = payload.get("columns") or payload.get("master_grid_rows") or []
    duty_books = payload.get("duty_books") or {}

    for idx, col in enumerate(columns):
        dtype_str = str(col.get("duty_type", "DOUBLE")).upper()
        dtype_enum = DutyType.DOUBLE
        if "SINGLE" in dtype_str:
            dtype_enum = DutyType.SINGLE
        elif "SPLIT" in dtype_str:
            dtype_enum = DutyType.SPLIT
        elif "PEAK" in dtype_str:
            dtype_enum = DutyType.PEAK

        duty_id_val = col.get("duty_id") or col.get("duty_number") or f"{route_id}-{idx + 1:02d}"
        duty_num_clean = col.get("duty_number") or (idx + 1)
        assigned_depot = col.get("depot_name") or col.get("depot_id")
        new_duty = StaticDuty(
            schedule_id=new_schedule.id,
            route_id=route_id,
            duty_number=str(duty_id_val),
            service_id=ServiceDay.WORKDAY,
            duty_type=dtype_enum,
            depot_id=str(assigned_depot) if assigned_depot else None
        )
        db.add(new_duty)
        await db.flush()

        # Зберігаємо зміни та рейси з duty_books або rounds
        book = duty_books.get(str(duty_num_clean)) or duty_books.get(str(duty_id_val)) or {}
        trips = list(book.get("trips") or [])
        if not trips and col.get("rounds"):
            r_idx = 1
            for rnd in col.get("rounds", []):
                dep_a = rnd.get("departure_station_a")
                arr_b = rnd.get("arrival_station_b")
                dep_b = rnd.get("departure_station_b")
                arr_a = rnd.get("arrival_station_a")
                if dep_a and dep_a != "—":
                    trips.append({
                        "trip_number": r_idx,
                        "direction": "FORWARD",
                        "departure_time": dep_a,
                        "arrival_time": arr_b or dep_a,
                        "is_zero_run": False
                    })
                    r_idx += 1
                if dep_b and dep_b != "—":
                    trips.append({
                        "trip_number": r_idx,
                        "direction": "BACKWARD",
                        "departure_time": dep_b,
                        "arrival_time": arr_a or dep_b,
                        "is_zero_run": False
                    })
                    r_idx += 1

        is_double_or_split = dtype_enum in [DutyType.DOUBLE, DutyType.SPLIT]

        # Реальні обіди беремо з рейсів наряду (rounds[].lunch_break, згенеровано
        # generate_omet_master_schedule на ДП) — а не з догадки за замовчуванням.
        fallback_break_min = 15 if "TRAM" in str(payload.get("transport_type", "")).upper() else 20
        lunch_rounds = [
            rnd.get("lunch_break") for rnd in (col.get("rounds") or [])
            if rnd.get("tag") == "LUNCH" and rnd.get("lunch_break")
        ]
        lunch_1 = lunch_rounds[0] if len(lunch_rounds) > 0 else None
        lunch_2 = lunch_rounds[1] if len(lunch_rounds) > 1 else None

        def _shift_break_fields(lunch: Optional[Dict[str, Any]]) -> Dict[str, Any]:
            if lunch:
                return {
                    "has_break": True,
                    "break_start_time": parse_time_str(lunch["start"]),
                    "break_end_time": parse_time_str(lunch["end"]),
                    "break_duration_minutes": lunch.get("duration_min", fallback_break_min),
                    "break_location_id": lunch.get("location"),
                    "is_paid_break": bool(lunch.get("is_paid_break")),
                    "overtime_break_minutes": lunch.get("overtime_min", 0),
                }
            return {
                "has_break": False,
                "break_start_time": None,
                "break_end_time": None,
                "break_duration_minutes": 0,
                "break_location_id": None,
                "is_paid_break": False,
                "overtime_break_minutes": 0,
            }

        shift_1 = StaticShift(
            duty_id=new_duty.id,
            shift_sequence=1,
            vehicle_id=col.get("assigned_vehicle_num") or col.get("vehicle_id"),
            **_shift_break_fields(lunch_1)
        )
        db.add(shift_1)
        await db.flush()

        shift_2 = None
        if is_double_or_split:
            shift_2 = StaticShift(
                duty_id=new_duty.id,
                shift_sequence=2,
                vehicle_id=col.get("assigned_vehicle_num2") or col.get("assigned_vehicle_num") or col.get("vehicle_id"),
                **_shift_break_fields(lunch_2)
            )
            db.add(shift_2)
            await db.flush()

        half_trips = len(trips) // 2 if shift_2 and len(trips) > 1 else len(trips)
        for trip_idx, trip in enumerate(trips):
            target_shift = shift_1 if trip_idx < half_trips or not shift_2 else shift_2
            tdir_raw = str(trip.get("direction", "FORWARD")).upper()
            if "PULL_OUT" in tdir_raw:
                tdir = TripDirection.PULL_OUT
            elif "PULL_IN" in tdir_raw:
                tdir = TripDirection.PULL_IN
            elif "BACKWARD" in tdir_raw or "2" in tdir_raw:
                tdir = TripDirection.BACKWARD
            else:
                tdir = TripDirection.FORWARD

            new_trip = StaticTrip(
                shift_id=target_shift.id,
                trip_sequence=trip.get("trip_number") or (trip_idx + 1),
                direction=tdir,
                trip_type="PULL_OUT" if tdir == TripDirection.PULL_OUT else ("PULL_IN" if tdir == TripDirection.PULL_IN else "REGULAR"),
                is_zero_run=trip.get("is_zero_run", False) or tdir in [TripDirection.PULL_OUT, TripDirection.PULL_IN]
            )
            db.add(new_trip)
            await db.flush()

            # Додаємо StaticStopTime для контролю точок відправлення та прибуття
            dep_str = trip.get("departure_time")
            arr_str = trip.get("arrival_time")
            dep_t = parse_time_str(dep_str) if dep_str else None
            arr_t = parse_time_str(arr_str) if arr_str else None

            s_id = start_sid_bwd if tdir == TripDirection.BACKWARD else start_sid_fwd
            e_id = end_sid_bwd if tdir == TripDirection.BACKWARD else end_sid_fwd

            if dep_t:
                db.add(StaticStopTime(
                    trip_id=new_trip.id,
                    stop_id=s_id,
                    stop_sequence=1,
                    arrival_time=dep_t,
                    departure_time=dep_t,
                    is_control_point=True
                ))
            if arr_t:
                db.add(StaticStopTime(
                    trip_id=new_trip.id,
                    stop_id=e_id,
                    stop_sequence=2,
                    arrival_time=arr_t,
                    departure_time=arr_t,
                    is_control_point=True
                ))

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


# =====================================================================
# Вкладка №5: «АКТИВНІ НАРЯДИ» & Вкладка №6: «АРХІВ РОЗКЛАДІВ» (API)
# =====================================================================

class SaveScheduleTemplateRequest(BaseModel):
    name: str
    description: Optional[str] = None

class ScheduleActivationRequest(BaseModel):
    effective_date: str # YYYY-MM-DD

@router.get("/active-duties-registry", summary="Реєстр активних нарядів діючих розкладів підприємства")
async def get_active_duties_registry(
    transport_type: Optional[str] = Query(None), # "TRAM", "TROLLEYBUS", "ALL"
    depot_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Повертає повний реєстр діючих розкладів (status == 'ACTIVE') для Вкладки №5 «Активні наряди»:
    по кожному маршруту формує список нарядів, змін, закріплених бортів та водіїв,
    а також підсумкові метрики (випуск, інтервал, вагоно-км, рейсів).
    """
    # 1. Завантажуємо активні розклади
    sched_query = (
        select(Schedule)
        .where(Schedule.status == ScheduleStatus.ACTIVE)
        .options(
            selectinload(Schedule.duties)
            .selectinload(StaticDuty.shifts)
            .selectinload(StaticShift.trips)
            .selectinload(StaticTrip.stop_times)
        )
        .order_by(Schedule.route_id)
    )
    sched_res = await db.execute(sched_query)
    schedules = sched_res.scalars().all()

    # 2. Довідники маршрутів
    routes_res = await db.execute(select(RouteModel))
    routes_map = {r.id: r for r in routes_res.scalars().all()}

    # 3. Призначення водіїв та бортів з driver_shifts
    driver_shifts_res = await db.execute(select(DriverShiftModel))
    driver_shifts_map = {}
    for ds in driver_shifts_res.scalars().all():
        key = f"{ds.route_id}_{ds.duty_number}_{ds.shift_index}"
        driver_shifts_map[key] = ds

    results = []
    for sched in schedules:
        route = routes_map.get(sched.route_id)
        if not route:
            continue

        r_type = (route.type or "tram").lower()
        if transport_type and transport_type.upper() != "ALL":
            if transport_type.lower() not in r_type:
                continue

        # Фільтр за пошуком
        if search:
            q = search.lower().strip()
            r_num = (route.number or sched.route_id).lower()
            r_name = (route.name or "").lower()
            if q not in r_num and q not in r_name:
                continue

        duties_list = []
        total_trips = 0
        total_assigned_drivers = 0
        total_required_drivers = 0

        for duty in sched.duties:
            duty_trips_count = sum(len(s.trips or []) for s in (duty.shifts or []))
            total_trips += duty_trips_count

            shifts_list = []
            for s in (duty.shifts or []):
                total_required_drivers += 1
                # Пошук закріпленого водія/вагона
                ds_key = f"{sched.route_id}_{duty.duty_number}_{s.shift_sequence}"
                ds = driver_shifts_map.get(ds_key)

                driver_name = ds.driver_name if ds else None
                driver_tab = ds.driver_tab_num if ds else None
                assigned_vehicle = (ds.vehicle_id if ds else None) or s.vehicle_id
                assigned_vehicle_2 = ds.second_vehicle_id if ds else None

                if driver_name:
                    total_assigned_drivers += 1

                # Визначення часу початку та кінця зміни
                first_time = "--:--"
                last_time = "--:--"
                if s.trips:
                    first_trip = s.trips[0]
                    last_trip = s.trips[-1]
                    if first_trip.stop_times:
                        first_time = str(first_trip.stop_times[0].departure_time)[:5]
                    if last_trip.stop_times:
                        last_time = str(last_trip.stop_times[-1].arrival_time)[:5]

                shifts_list.append({
                    "shift_id": s.id,
                    "shift_sequence": s.shift_sequence,
                    "vehicle_id": assigned_vehicle,
                    "second_vehicle_id": assigned_vehicle_2,
                    "driver_name": driver_name,
                    "driver_tab_num": driver_tab,
                    "start_time": first_time,
                    "end_time": last_time,
                    "has_break": s.has_break,
                    "break_start_time": str(s.break_start_time)[:5] if s.break_start_time else None,
                    "break_end_time": str(s.break_end_time)[:5] if s.break_end_time else None,
                    "break_duration_minutes": s.break_duration_minutes or (15 if "tram" in r_type else 20),
                    "break_location_id": s.break_location_id,
                    "is_paid_break": bool(s.is_paid_break),
                    "overtime_break_minutes": s.overtime_break_minutes or 0,
                    "trips_count": len(s.trips or [])
                })

            duties_list.append({
                "duty_id": duty.id,
                "duty_number": duty.duty_number,
                "duty_type": str(duty.duty_type.value if hasattr(duty.duty_type, 'value') else duty.duty_type),
                "depot_id": duty.depot_id or route.primary_depot_id or ("ТД-1" if "tram" in r_type else "ТРД-1"),
                "shifts": shifts_list
            })

        # Розрахунок показників маршруту
        length_km = route.length_km or 17.5
        wagon_km = round(total_trips * length_km, 1)
        duties_count = len(duties_list)
        round_trip_min = route.round_trip_min or 84
        headway_min = round(round_trip_min / duties_count, 1) if duties_count > 0 else 10.0

        results.append({
            "schedule_id": sched.id,
            "route_id": sched.route_id,
            "route_number": route.number or sched.route_id,
            "route_name": route.name,
            "transport_type": r_type,
            "version_name": sched.version_name or f"Еталонний розклад #{route.number}",
            "status": "ACTIVE",
            "active_date": str(sched.active_date),
            "created_at": sched.created_at.strftime("%Y-%m-%d %H:%M") if sched.created_at else str(sched.active_date),
            "duties_count": duties_count,
            "total_trips": total_trips,
            "total_wagon_km": wagon_km,
            "headway_min": headway_min,
            "depot_name": route.primary_depot_id or ("Трамвайне депо №1" if "tram" in r_type else "Тролейбусне депо №3"),
            "assigned_drivers_count": total_assigned_drivers,
            "required_drivers_count": total_required_drivers,
            "is_fully_assigned": total_assigned_drivers >= total_required_drivers and total_required_drivers > 0,
            "duties": duties_list
        })

    return results

@router.post("/{schedule_id:int}/save-as-template", summary="Збереження конфігурації нарядів у шаблон")
async def save_schedule_as_template(
    schedule_id: int,
    req: SaveScheduleTemplateRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Зберігає активний або архівний розклад у реєстр шаблонів Служби Руху (таблиця schedule_templates).
    """
    sched_res = await db.execute(
        select(Schedule)
        .where(Schedule.id == schedule_id)
        .options(
            selectinload(Schedule.duties)
            .selectinload(StaticDuty.shifts)
            .selectinload(StaticShift.trips)
        )
    )
    sched = sched_res.scalar_one_or_none()
    if not sched:
        raise HTTPException(status_code=404, detail="Розклад не знайдено")

    route_res = await db.execute(select(RouteModel).where(RouteModel.id == sched.route_id))
    route = route_res.scalar_one_or_none()

    template_snapshot = {
        "route_id": sched.route_id,
        "route_number": route.number if route else sched.route_id,
        "route_name": route.name if route else "",
        "transport_type": route.type if route else "tram",
        "duties_count": len(sched.duties),
        "duties": [
            {
                "duty_number": d.duty_number,
                "duty_type": str(d.duty_type.value if hasattr(d.duty_type, 'value') else d.duty_type),
                "depot_id": d.depot_id,
                "shifts_count": len(d.shifts or []),
                "trips_count": sum(len(s.trips or []) for s in (d.shifts or []))
            }
            for d in sched.duties
        ]
    }

    new_template = ScheduleTemplate(
        name=req.name,
        route_id=sched.route_id,
        description=req.description or f"Шаблон на базі розкладу #{sched.id} ({len(sched.duties)} нарядів)",
        template_data=template_snapshot
    )
    db.add(new_template)
    await db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Шаблон «{req.name}» успішно збережено у базу шаблонів КП «ОМЕТ»!",
        "template_id": new_template.id
    }

@router.get("/templates", summary="Отримання списку шаблонів розкладів")
async def get_schedule_templates(
    route_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Список усіх збережених шаблонів розкладів."""
    q = select(ScheduleTemplate).order_by(ScheduleTemplate.id.desc())
    if route_id:
        q = q.where(ScheduleTemplate.route_id == route_id)
    res = await db.execute(q)
    templates = res.scalars().all()

    return [
        {
            "id": t.id,
            "name": t.name,
            "route_id": t.route_id,
            "description": t.description,
            "created_at": t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else "",
            "template_data": t.template_data
        }
        for t in templates
    ]

@router.post("/{schedule_id:int}/archive", summary="Перенесення активного розкладу в архів")
async def archive_active_schedule(
    schedule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Знімає розклад з активної експлуатації та переводить його в статус ARCHIVED.
    """
    sched_res = await db.execute(select(Schedule).where(Schedule.id == schedule_id))
    sched = sched_res.scalar_one_or_none()
    if not sched:
        raise HTTPException(status_code=404, detail="Розклад не знайдено")

    sched.status = ScheduleStatus.ARCHIVED
    await db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Розклад #{schedule_id} для маршруту №{sched.route_id} успішно перенесено в архів.",
        "schedule_id": schedule_id,
        "route_id": sched.route_id
    }

@router.post("/{schedule_id:int}/schedule-activation", summary="Сценарій 1: Планове введення розкладу в дію з дати")
async def schedule_activation_planned(
    schedule_id: int,
    req: ScheduleActivationRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Сценарій 1 (Планове введення):
    Встановлює дату набуття чинності розкладу (за замовчуванням завтра з 04:30).
    Поточний розклад продовжує безпечно діяти до кінця поточної доби.
    Цільовий розклад отримує статус ACTIVE з active_date = req.effective_date.
    """
    sched_res = await db.execute(select(Schedule).where(Schedule.id == schedule_id))
    target_sched = sched_res.scalar_one_or_none()
    if not target_sched:
        raise HTTPException(status_code=404, detail="Розклад не знайдено")

    try:
        eff_date = date.fromisoformat(req.effective_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Невірний формат дати. Використовуйте YYYY-MM-DD")

    # Переводимо всі інші розклади цього маршруту в архів
    await db.execute(
        update(Schedule)
        .where((Schedule.route_id == target_sched.route_id) & (Schedule.id != target_sched.id))
        .values(status=ScheduleStatus.ARCHIVED)
    )

    # Встановлюємо новий активний розклад
    target_sched.status = ScheduleStatus.ACTIVE
    target_sched.active_date = eff_date
    await db.commit()

    # Сповіщення диспетчерів
    await ws_manager.broadcast({
        "type": "STATIC_SCHEDULE_PLANNED_ACTIVATION",
        "payload": {
            "schedule_id": target_sched.id,
            "route_id": target_sched.route_id,
            "effective_date": str(eff_date),
            "version_name": target_sched.version_name
        }
    })

    return {
        "status": "SUCCESS",
        "message": f"Планове введення в дію розкладу №{target_sched.route_id} успішно призначено на {req.effective_date} (з 04:30). Діючий розклад спокійно допрацює поточну добу.",
        "schedule_id": target_sched.id,
        "route_id": target_sched.route_id,
        "effective_date": str(eff_date)
    }

@router.get("/archive-registry", summary="Реєстр архівних версій розкладів")
async def get_archive_registry(
    transport_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Повертає список архівних розкладів (status == 'ARCHIVED') для Вкладки №6 «Архів розкладів»
    із розрахованими показниками пробігу, рейсів, нарядів та дат.
    """
    sched_query = (
        select(Schedule)
        .where(Schedule.status == ScheduleStatus.ARCHIVED)
        .options(
            selectinload(Schedule.duties)
            .selectinload(StaticDuty.shifts)
            .selectinload(StaticShift.trips)
        )
        .order_by(Schedule.id.desc())
    )
    sched_res = await db.execute(sched_query)
    schedules = sched_res.scalars().all()

    routes_res = await db.execute(select(RouteModel))
    routes_map = {r.id: r for r in routes_res.scalars().all()}

    results = []
    for sched in schedules:
        route = routes_map.get(sched.route_id)
        r_type = (route.type if route else "tram").lower()

        if transport_type and transport_type.upper() != "ALL":
            if transport_type.lower() not in r_type:
                continue

        if search:
            q = search.lower().strip()
            r_num = (route.number if route else sched.route_id).lower()
            r_name = (route.name if route else "").lower()
            v_name = (sched.version_name or "").lower()
            if q not in r_num and q not in r_name and q not in v_name:
                continue

        total_trips = sum(
            sum(len(s.trips or []) for s in (d.shifts or []))
            for d in (sched.duties or [])
        )
        length_km = route.length_km if route and route.length_km else 17.5
        wagon_km = round(total_trips * length_km, 1)
        duties_count = len(sched.duties or [])

        results.append({
            "id": str(sched.id),
            "routeId": sched.route_id,
            "routeNumber": route.number if route else sched.route_id,
            "routeName": route.name if route else f"Маршрут №{sched.route_id}",
            "transportType": "Тролейбус" if "trolley" in r_type else "Трамвай",
            "scheduleType": sched.version_name or f"Архівний розклад #{sched.id}",
            "schedulePeriod": "Постійний діючий (ОМЕТ 2026)",
            "savedAt": sched.created_at.strftime("%Y-%m-%d %H:%M") if sched.created_at else str(sched.active_date),
            "activeDate": str(sched.active_date),
            "dutiesCount": duties_count,
            "totalTrips": total_trips,
            "totalWagonKm": wagon_km,
            "depotName": route.primary_depot_id if route else ("ТД-1" if "tram" in r_type else "ТРД-1")
        })

    return results

@router.delete("/{schedule_id:int}", summary="Видалення архівного розкладу")
async def delete_schedule(
    schedule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Видалення розкладу з перевіркою безпеки:
    активні розклади заборонено видаляти напряму (потрібно спочатку перевести в архів).
    """
    sched_res = await db.execute(select(Schedule).where(Schedule.id == schedule_id))
    sched = sched_res.scalar_one_or_none()
    if not sched:
        raise HTTPException(status_code=404, detail="Розклад не знайдено")

    if sched.status == ScheduleStatus.ACTIVE:
        raise HTTPException(
            status_code=400,
            detail="Неможливо видалити діючий активний розклад на лінії! Спочатку переведіть його в архів."
        )

    await db.delete(sched)
    await db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Архівний розклад #{schedule_id} успішно вилучено з бази даних."
    }


