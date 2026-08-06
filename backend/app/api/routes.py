# backend/app/api/routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.transit_solver import transit_solver
from app.api.websocket import manager as ws_manager

router = APIRouter()

# Тимчасова заглушка для зберігання розкладу в пам'яті (замінити на БД)
current_global_schedule = [] 

class DelayRequest(BaseModel):
    block_id: str
    start_time: int # Unix timestamp з якого починається затримка
    delay_minutes: int

@router.post("/apply-delay")
async def apply_delay(request: DelayRequest):
    global current_global_schedule
    
    delay_sec = request.delay_minutes * 60
    
    # Виконуємо каскадний перерахунок та валідацію
    updated_schedule, warnings = transit_solver.apply_delay_cascade(
        schedule_data=current_global_schedule,
        block_id=request.block_id,
        start_time_sec=request.start_time,
        delay_sec=delay_sec
    )
    
    # Зберігаємо новий стан
    current_global_schedule = updated_schedule
    
    # Broadcast нового розкладу всім підключеним клієнтам
    await ws_manager.broadcast({
        "type": "STATE_UPDATE",
        "payload": current_global_schedule
    })
    
    # Якщо є порушення обідів, відправляємо попередження
    if warnings:
        await ws_manager.broadcast({
            "type": "VALIDATION_WARNING",
            "payload": warnings
        })

    return {"status": "success", "message": "Delay applied and broadcasted."}
