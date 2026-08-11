from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from typing import List

from app.api.dependencies import get_db
from app.schemas.schedule import GenerateGridRequest, StaticDutyResponse
from app.models.schedule import StaticDuty, StaticTrip, StaticStopTime
from app.services.static_schedule_engine import StaticScheduleEngine

router = APIRouter(prefix="/schedules", tags=["Schedules"])

@router.post("/generate", response_model=List[StaticDutyResponse])
async def generate_static_grid(request: GenerateGridRequest, db: AsyncSession = Depends(get_db)):
    try:
        # 1. Генерація масиву даних у пам'яті
        duties_data = StaticScheduleEngine.build_grid_data(request)
        
        # 2. Очищення старої сітки для цього маршруту (транзакційно)
        # Увага: завдяки cascade="all, delete-orphan", видалення StaticDuty
        # автоматично видалить усі пов'язані рейси та зупинки.
        await db.execute(delete(StaticDuty).where(StaticDuty.route_id == request.route_id))
        
        # 3. Наповнення бази новими даними
        new_duties = []
        for duty_dict in duties_data:
            duty_obj = StaticDuty(
                route_id=request.route_id,
                duty_number=duty_dict["duty_number"]
            )
            
            for trip_dict in duty_dict["trips"]:
                trip_obj = StaticTrip(
                    trip_sequence=trip_dict["trip_sequence"],
                    direction=trip_dict["direction"]
                )
                
                for st_dict in trip_dict["stop_times"]:
                    trip_obj.stop_times.append(StaticStopTime(**st_dict))
                    
                duty_obj.trips.append(trip_obj)
                
            db.add(duty_obj)
            new_duties.append(duty_obj)
            
        # Збереження всіх змін єдиною транзакцією
        await db.commit()
        
        # Завантажуємо пов'язані дані для Pydantic Response
        for d in new_duties:
            await db.refresh(d)
            
        return new_duties

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Помилка генерації сітки: {str(e)}")
