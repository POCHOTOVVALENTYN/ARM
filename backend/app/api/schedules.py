from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select, update, func
from sqlalchemy.orm import selectinload
from typing import List, Optional, Union
from datetime import date

from app.api.dependencies import get_db
from app.schemas.schedule import GenerateGridRequest, StaticDutyResponse, ScheduleResponse
from app.models.schedule import Schedule, ScheduleStatus
from app.models.models import EtaLog
from app.services.schedule_engine import ScheduleEnginePipeline
from app.repositories.schedule_repo import ScheduleRepository
from app.services.telemetry_worker import cache_active_schedule_in_redis
from app.api.websocket import ws_manager

router = APIRouter(prefix="/schedules", tags=["Schedules"])

@router.post("/generate", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def generate_static_grid(request: GenerateGridRequest, db: AsyncSession = Depends(get_db)):
    try:
        pipeline = ScheduleEnginePipeline(request)
        target_date = date.today()
        
        schedule_id = await pipeline.execute_and_save_draft(db, request.route_id, target_date)
        
        repo = ScheduleRepository(db)
        full_schedule = await repo.get_schedule_with_full_hierarchy(schedule_id)
        
        if not full_schedule:
            raise HTTPException(status_code=500, detail="Помилка завантаження згенерованого розкладу з БД")
            
        return full_schedule

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Помилка генерації сітки: {str(e)}")

@router.post("/{schedule_id}/activate", status_code=status.HTTP_200_OK)
async def activate_schedule(schedule_id: int, db: AsyncSession = Depends(get_db)):
    # 1. Знайти чорновик
    query = select(Schedule).where(
        Schedule.id == schedule_id, 
        Schedule.status == ScheduleStatus.DRAFT
    )
    result = await db.execute(query)
    draft = result.scalar_one_or_none()
    
    if not draft:
        raise HTTPException(
            status_code=404, 
            detail="Чорновик не знайдено або він вже активований"
        )

    # 2. Архівувати поточний активний розклад для цього ж маршруту
    archive_stmt = (
        update(Schedule)
        .where(Schedule.route_id == draft.route_id)
        .where(Schedule.status == ScheduleStatus.ACTIVE)
        .values(status=ScheduleStatus.ARCHIVED)
    )
    await db.execute(archive_stmt)

    # 3. Активувати новий чорновик
    draft.status = ScheduleStatus.ACTIVE
    await db.commit()

    # 4. Завантажити ієрархію та закешувати в Redis для швидкісного розрахунку відхилень (telemetry_worker)
    repo = ScheduleRepository(db)
    full_schedule = await repo.get_schedule_with_full_hierarchy(draft.id)
    if full_schedule:
        await cache_active_schedule_in_redis(full_schedule)

    # 5. Real-time WebSocket інвалідація кешу TanStack Query для всіх підключених диспетчерів
    await ws_manager.broadcast({
        "type": "invalidate_schedules",
        "schedule_id": draft.id,
        "route_id": draft.route_id
    })

    return {"message": "Розклад успішно активовано", "schedule_id": draft.id, "status": "ACTIVE"}

@router.get("/active", response_model=List[ScheduleResponse])
async def get_all_active_schedules(
    route_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Повертає список усіх активних розкладів підприємства (або розклад конкретного маршруту).
    """
    repo = ScheduleRepository(db)
    if route_id:
        single_sched = await repo.get_active_schedule_for_route(route_id)
        return [single_sched] if single_sched else []
    
    active_schedules = await repo.get_all_active_schedules()
    return active_schedules

@router.get("/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule(schedule_id: int, db: AsyncSession = Depends(get_db)):
    repo = ScheduleRepository(db)
    schedule = await repo.get_schedule_with_full_hierarchy(schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Розклад не знайдено")
    return schedule

@router.get("/analytics/route/{route_id}/deviations")
async def get_route_deviations(
    route_id: str, 
    target_date: Optional[date] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    """
    Повертає середнє та максимальне відхилення по зупинках маршруту за конкретну дату.
    """
    actual_date = target_date or date.today()
    query = (
        select(
            EtaLog.stop_id,
            func.avg(EtaLog.deviation_min).label("avg_deviation"),
            func.max(EtaLog.deviation_min).label("max_deviation"),
            func.count(EtaLog.id).label("total_passages")
        )
        .where(EtaLog.route_id == route_id)
        .where(func.date(EtaLog.recorded_at) == actual_date)
        .group_by(EtaLog.stop_id)
    )
    
    result = await db.execute(query)
    stats = result.all()
    
    return [
        {
            "stop_id": row.stop_id, 
            "avg_deviation": round(float(row.avg_deviation or 0.0), 1),
            "max_deviation": round(float(row.max_deviation or 0.0), 1),
            "total_passages": int(row.total_passages or 0)
        } 
        for row in stats
    ]

# --- Модель та ендпоінт редагування рейсу ---
from pydantic import BaseModel
from datetime import time as dt_time
from app.models.schedule import StaticTrip, StaticStopTime
from app.api.dependencies import get_current_dispatcher

class TripUpdate(BaseModel):
    start_time: str
    end_time: str

def parse_time_str(t_str: str) -> dt_time:
    parts = t_str.strip().split(":")
    h = int(parts[0])
    m = int(parts[1])
    s = int(parts[2]) if len(parts) > 2 else 0
    return dt_time(hour=h, minute=m, second=s)

@router.put("/trips/{trip_id}", summary="Оновлення планового часу відправлення та прибуття для конкретного рейсу")
async def update_trip_time(
    trip_id: int,
    trip_data: TripUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Оновлення планового часу відправлення та прибуття для конкретного рейсу."""
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
            if end_mins < start_mins: # перехід через північ
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

    # Оскільки ми редагуємо розклад, інвалідуємо пов'язані кеші для інших диспетчерів
    await ws_manager.broadcast({
        "type": "schedule_draft_updated",
        "trip_id": trip_id
    })

    return {"message": "Час рейсу успішно оновлено", "trip_id": trip_id}


from app.services.transit_solver import generate_optimized_schedule

class GenerateScheduleRequest(BaseModel):
    route_id: str
    vehicles_count: int
    start_time: str
    end_time: str
    route_length_km: float
    avg_speed_kmh: float
    zero_trip_min: int = 15
    use_elastic_smoother: bool = True

@router.post("/generate-draft")
async def api_generate_draft(
    req: GenerateScheduleRequest
):
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


# --- Pydantic Схеми для валідації збереження розкладу ---
from app.models.schedule import (
    StaticDuty, 
    StaticShift, 
    StaticTrip, 
    StaticStopTime,
    ServiceDay, 
    DutyType, 
    TripDirection
)
from app.models.models import RouteStation, StationModel

class TripCreate(BaseModel):
    direction: str
    start_time: str
    end_time: str
    is_zero: bool = False

class ShiftCreate(BaseModel):
    id: Optional[Union[int, str]] = None
    shift_type: Optional[str] = "FULL"
    trips: List[TripCreate] = []

class DutyCreate(BaseModel):
    duty_number: str
    shifts: List[ShiftCreate] = []

class ScheduleCommitRequest(BaseModel):
    route_id: str
    duties: List[DutyCreate]
    version_name: Optional[str] = "Автоматична генерація"

@router.post("/commit-draft")
async def commit_schedule_draft(
    req: ScheduleCommitRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Зберігає згенерований Transit Solver-ом розклад як активний (Еталонний).
    """
    today = date.today()

    # 1. Створюємо шапку еталонного розкладу
    new_schedule = Schedule(
        route_id=req.route_id,
        active_date=today,
        status=ScheduleStatus.ACTIVE
    )
    db.add(new_schedule)
    await db.flush() # Отримуємо new_schedule.id
    
    # 2. Архівуємо всі інші активні розклади для цього маршруту
    archive_stmt = (
        update(Schedule)
        .where((Schedule.route_id == req.route_id) & (Schedule.id != new_schedule.id))
        .values(status=ScheduleStatus.ARCHIVED)
    )
    await db.execute(archive_stmt)

    # Отримуємо ID реальних зупинок маршруту
    stops_result = await db.execute(
        select(RouteStation.stop_id)
        .where(RouteStation.route_id == req.route_id)
        .order_by(RouteStation.stop_sequence)
    )
    route_stop_ids = stops_result.scalars().all()
    if not route_stop_ids or len(route_stop_ids) < 2:
        # Fallback до базових станцій
        st_res = await db.execute(select(StationModel.id).limit(2))
        route_stop_ids = st_res.scalars().all() or ["687083", "708888"]

    terminal_start = route_stop_ids[0]
    terminal_end = route_stop_ids[-1]

    # 3. Запис Нарядів (Duties), Змін (Shifts) та Рейсів (Trips)
    for duty in req.duties:
        new_duty = StaticDuty(
            schedule_id=new_schedule.id,
            route_id=req.route_id,
            duty_number=str(duty.duty_number),
            service_id=ServiceDay.WORKDAY,
            duty_type=DutyType.DOUBLE
        )
        db.add(new_duty)
        await db.flush() # Отримуємо new_duty.id
        
        for idx_shift, shift in enumerate(duty.shifts, start=1):
            new_shift = StaticShift(
                duty_id=new_duty.id,
                shift_sequence=idx_shift,
                has_break=False
            )
            db.add(new_shift)
            await db.flush()
            
            for idx_trip, trip in enumerate(shift.trips, start=1):
                dir_str = str(trip.direction).lower()
                if "нульовий" in dir_str or "виїзд" in dir_str:
                    tdir = TripDirection.PULL_OUT
                elif "заїзд" in dir_str:
                    tdir = TripDirection.PULL_IN
                elif "зворот" in dir_str or "reverse" in dir_str or "backward" in dir_str:
                    tdir = TripDirection.BACKWARD
                else:
                    tdir = TripDirection.FORWARD

                new_trip = StaticTrip(
                    shift_id=new_shift.id,
                    trip_sequence=idx_trip,
                    direction=tdir,
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

                stop1 = StaticStopTime(
                    trip_id=new_trip.id,
                    stop_id=terminal_start,
                    stop_sequence=1,
                    arrival_time=st_time,
                    departure_time=st_time
                )
                stop2 = StaticStopTime(
                    trip_id=new_trip.id,
                    stop_id=terminal_end,
                    stop_sequence=2,
                    arrival_time=en_time,
                    departure_time=en_time
                )
                db.add(stop1)
                db.add(stop2)

    await db.commit()

    # 4. Кешуємо в Redis для розрахунку відхилень у telemetry_worker
    repo = ScheduleRepository(db)
    full_schedule = await repo.get_schedule_with_full_hierarchy(new_schedule.id)
    if full_schedule:
        await cache_active_schedule_in_redis(full_schedule)

    # 5. Сповіщаємо підключених диспетчерів через WebSocket
    await ws_manager.broadcast({
        "type": "invalidate_schedules",
        "schedule_id": new_schedule.id,
        "route_id": req.route_id
    })
    
    return {
        "message": "Еталонний розклад успішно збережено", 
        "schedule_id": new_schedule.id,
        "status": "ACTIVE"
    }




