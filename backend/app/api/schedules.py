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

