from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from typing import List

from app.api.dependencies import get_db
from app.schemas.schedule import GenerateGridRequest, StaticDutyResponse
from app.models.schedule import StaticDuty, StaticShift, StaticTrip, StaticStopTime
from app.services.schedule_engine import ScheduleEnginePipeline

router = APIRouter(prefix="/schedules", tags=["Schedules"])

@router.post("/generate", response_model=List[StaticDutyResponse])
async def generate_static_grid(request: GenerateGridRequest, db: AsyncSession = Depends(get_db)):
    try:
        # 1. Генерація масиву даних у пам'яті через 4-прохідний пайплайн
        pipeline = ScheduleEnginePipeline(request)
        duties_data = pipeline.execute()
        
        # 2. Очищення старої сітки для цього маршруту (транзакційно)
        await db.execute(delete(StaticDuty).where(StaticDuty.route_id == request.route_id))
        
        # 3. Наповнення бази новими даними
        new_duties = []
        for duty_dict in duties_data:
            duty_obj = StaticDuty(
                route_id=request.route_id,
                duty_number=duty_dict["duty_number"],
                service_id=duty_dict.get("service_id", "WORKDAY"),
                duty_type=duty_dict.get("duty_type", "SINGLE")
            )
            
            for shift_dict in duty_dict.get("shifts", []):
                shift_obj = StaticShift(
                    shift_sequence=shift_dict.get("shift_sequence", 1),
                    has_break=shift_dict.get("has_break", False),
                    break_start_time=shift_dict.get("break_start_time"),
                    break_duration_minutes=shift_dict.get("break_duration_minutes")
                )
                
                for trip_dict in shift_dict.get("trips", []):
                    trip_obj = StaticTrip(
                        trip_sequence=trip_dict["trip_sequence"],
                        direction=trip_dict["direction"],
                        smoothing_state=trip_dict.get("smoothing_state", "normal"),
                        smoothing_delta=trip_dict.get("smoothing_delta", 0.0)
                    )
                    
                    for st_dict in trip_dict["stop_times"]:
                        trip_obj.stop_times.append(StaticStopTime(
                            stop_id=st_dict["stop_id"],
                            stop_sequence=st_dict["stop_sequence"],
                            arrival_time=st_dict["arrival_time"],
                            departure_time=st_dict["departure_time"],
                            is_break_location=st_dict.get("is_break_location", False)
                        ))
                        
                    shift_obj.trips.append(trip_obj)
                    
                duty_obj.shifts.append(shift_obj)
                
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
