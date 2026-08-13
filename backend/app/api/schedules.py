from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select, update
from sqlalchemy.orm import selectinload
from typing import List
from datetime import date

from app.api.dependencies import get_db
from app.schemas.schedule import GenerateGridRequest, StaticDutyResponse, ScheduleResponse
from app.models.schedule import Schedule, ScheduleStatus
from app.services.schedule_engine import ScheduleEnginePipeline
from app.repositories.schedule_repo import ScheduleRepository

router = APIRouter(prefix="/schedules", tags=["Schedules"])

@router.post("/generate", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def generate_static_grid(request: GenerateGridRequest, db: AsyncSession = Depends(get_db)):
    try:
        # 1. Виконуємо розрахунки та записуємо в БД
        pipeline = ScheduleEnginePipeline(request)
        
        # Для сумісності, беремо target_date = date.today() або з реквесту якщо є
        target_date = date.today()
        
        schedule_id = await pipeline.execute_and_save_draft(db, request.route_id, target_date)
        
        # 2. Використовуємо Репозиторій для ефективного завантаження ієрархії
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

    return {"message": "Розклад успішно активовано", "schedule_id": draft.id}
