from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel

from app.api.dependencies import get_db, get_current_dispatcher
from app.models.models import EmergencyTemplateModel, ActiveDetour
from app.core.redis import get_cache, set_cache, invalidate_cache, get_redis
from app.schemas.emergencies import EmergencyTemplateCreate
from app.api.websocket import manager as ws_manager

router = APIRouter(prefix="/emergencies", tags=["Emergencies & Detours"])

# ----------------- ШАБЛОНИ НС (Emergency Templates) -----------------

@router.get("/templates", response_model=List[Dict[str, Any]])
async def get_emergency_templates(db: AsyncSession = Depends(get_db)):
    cached = await get_cache("settings:emergencies")
    if cached:
        return cached

    result = await db.execute(select(EmergencyTemplateModel))
    templates = result.scalars().all()
    data = [
        {
            "id": t.id,
            "title": t.title,
            "type": t.type,
            "severity": t.severity,
            "affectedRoutes": t.affectedRoutes,
            "instructions": t.instructions
        }
        for t in templates
    ]
    await set_cache("settings:emergencies", data)
    return data

@router.post("/templates", response_model=Dict[str, Any])
async def create_emergency_template(template: EmergencyTemplateCreate, db: AsyncSession = Depends(get_db)):
    new_template = EmergencyTemplateModel(**template.model_dump())
    db.add(new_template)
    await db.commit()
    await invalidate_cache("settings:emergencies")
    return template.model_dump()

@router.delete("/templates/{template_id}")
async def delete_emergency_template(template_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EmergencyTemplateModel).where(EmergencyTemplateModel.id == template_id))
    template = result.scalar_one_or_none()
    if template:
        await db.delete(template)
        await db.commit()
        await invalidate_cache("settings:emergencies")
    return {"status": "ok"}


# ----------------- ОПЕРАТИВНІ ПЕРЕМИКАННЯ (Active Detours) -----------------

class DetourCreate(BaseModel):
    vehicle_id: str
    route_id: str
    reason: str
    new_path_description: str

class DetourResponse(BaseModel):
    id: int
    vehicle_id: str
    route_id: str
    reason: str
    new_path_description: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    dispatcher_id: Optional[int] = None

    class Config:
        from_attributes = True

@router.get("/detours/active", response_model=List[DetourResponse], summary="Отримання всіх поточних активних об'їздів")
async def get_active_detours(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Отримання всіх поточних активних об'їздів"""
    query = select(ActiveDetour).where(ActiveDetour.ended_at == None).order_by(ActiveDetour.id.desc())
    result = await db.execute(query)
    detours = result.scalars().all()
    return detours

@router.post("/detours/activate", response_model=DetourResponse, summary="Активація оперативного перемикання для ТЗ")
async def activate_detour(
    detour: DetourCreate, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Активація оперативного перемикання для ТЗ"""
    new_detour = ActiveDetour(
        vehicle_id=detour.vehicle_id,
        route_id=detour.route_id,
        reason=detour.reason,
        new_path_description=detour.new_path_description,
        dispatcher_id=current_user.id
    )
    db.add(new_detour)
    await db.commit()
    await db.refresh(new_detour)

    # Ставимо мітку об'їзду в Redis для telemetry_worker
    try:
        redis = await get_redis()
        await redis.set(f"active_detour:{detour.vehicle_id}", "true")
    except Exception as e:
        print(f"Помилка оновлення Redis мітки detour: {e}")

    # Транслюємо подію на фронтенд для миттєвого оновлення
    await ws_manager.broadcast({
        "type": "detour_updated",
        "payload": {
            "action": "activate",
            "vehicle_id": detour.vehicle_id,
            "route_id": detour.route_id,
            "detour_id": new_detour.id
        }
    })
    return new_detour

@router.put("/detours/{detour_id}/deactivate", summary="Повернення ТЗ на плановий маршрут")
@router.post("/detours/{detour_id}/deactivate", summary="Повернення ТЗ на плановий маршрут (POST)")
async def deactivate_detour(
    detour_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Повернення ТЗ на плановий маршрут"""
    result = await db.execute(select(ActiveDetour).where(ActiveDetour.id == detour_id))
    detour = result.scalar_one_or_none()
    
    if not detour or detour.ended_at is not None:
        raise HTTPException(status_code=400, detail="Об'їзд не знайдено або вже завершено")

    detour.ended_at = datetime.utcnow()
    await db.commit()
    
    # Видаляємо мітку об'їзду з Redis
    try:
        redis = await get_redis()
        await redis.delete(f"active_detour:{detour.vehicle_id}")
    except Exception as e:
        print(f"Помилка видалення Redis мітки detour: {e}")

    # Сповіщаємо всіх диспетчерів через WebSocket
    await ws_manager.broadcast({
        "type": "detour_updated",
        "payload": {
            "action": "deactivate",
            "detour_id": detour_id,
            "vehicle_id": detour.vehicle_id
        }
    })
    return {"message": "Транспорт повернуто на плановий маршрут", "id": detour_id}
