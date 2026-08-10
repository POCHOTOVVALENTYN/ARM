from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any

from app.core.database import AsyncSessionLocal
from app.models.models import EmergencyTemplateModel
from app.core.redis import get_cache, set_cache, invalidate_cache
from app.schemas.emergencies import EmergencyTemplateCreate

router = APIRouter(prefix="/emergencies", tags=["Emergencies"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

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
