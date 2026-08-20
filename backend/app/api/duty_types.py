import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.dependencies import get_db, get_current_dispatcher, get_current_active_superuser
from app.models.models import DutyTypeModel
from app.core.redis import get_cache, set_cache, invalidate_cache

logger = logging.getLogger("duty_types_api")

router = APIRouter(prefix="/duty-types", tags=["Duty Types Dictionary"])

DEFAULT_DUTY_TYPES = [
    {
        "id": "DOUBLE",
        "name": "Двозмінний",
        "code": "ДВ",
        "description": "Повний наряд у 2 зміни (ранок + вечір) із перезмінкою на ДП",
        "max_shift_hours": 8.0,
        "color": "#3b82f6",
        "is_active": True
    },
    {
        "id": "SINGLE",
        "name": "Однозмінний",
        "code": "ОД",
        "description": "Наряд на 1 робочу зміну (тільки ранкова або скорочена)",
        "max_shift_hours": 8.0,
        "color": "#10b981",
        "is_active": True
    },
    {
        "id": "SPLIT",
        "name": "Розривний",
        "code": "РОЗ",
        "description": "Робота в ранковий пік (06:00-10:00) та вечірній пік (16:00-20:00) з відстоєм у депо",
        "max_shift_hours": 10.0,
        "color": "#f59e0b",
        "is_active": True
    },
    {
        "id": "PEAK",
        "name": "Піковий",
        "code": "ПІК",
        "description": "Додатковий випуск для зменшення інтервалів у години пік",
        "max_shift_hours": 5.5,
        "color": "#ec4899",
        "is_active": True
    },
    {
        "id": "NIGHT",
        "name": "Черговий / Нічний",
        "code": "ЧЕР",
        "description": "Нічний черговий вагон для розвезення працівників та нічного сполучення",
        "max_shift_hours": 7.0,
        "color": "#8b5cf6",
        "is_active": True
    }
]

class DutyTypeCreate(BaseModel):
    id: str = Field(..., description="Унікальний код англійською, напр. DOUBLE, SINGLE")
    name: str
    code: str
    description: Optional[str] = ""
    max_shift_hours: float = 8.0
    color: str = "#3b82f6"
    is_active: bool = True

class DutyTypeUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    max_shift_hours: Optional[float] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("", summary="Отримання списку типів нарядів")
@router.get("/", summary="Отримання списку типів нарядів")
async def get_duty_types(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """Повертає перелік типів нарядів з PostgreSQL (або ініціалізує стандартні 5 типів)."""
    cached = await get_cache("duty_types:all")
    if cached:
        return cached

    result = await db.execute(select(DutyTypeModel))
    types = result.scalars().all()

    if not types:
        for item in DEFAULT_DUTY_TYPES:
            m = DutyTypeModel(**item)
            db.add(m)
        await db.commit()
        result = await db.execute(select(DutyTypeModel))
        types = result.scalars().all()

    data = [
        {
            "id": t.id,
            "name": t.name,
            "code": t.code,
            "description": t.description,
            "max_shift_hours": t.max_shift_hours,
            "color": t.color,
            "is_active": t.is_active
        }
        for t in types
    ]

    await set_cache("duty_types:all", data, expire_seconds=3600)
    return data

@router.post("", summary="Створення нового типу наряду")
@router.post("/", summary="Створення нового типу наряду")
async def create_duty_type(
    payload: DutyTypeCreate,
    db: AsyncSession = Depends(get_db),
    dispatcher = Depends(get_current_dispatcher)
) -> Dict[str, Any]:
    """Створює новий тип наряду."""
    d_id = payload.id.strip().upper()
    existing = await db.execute(select(DutyTypeModel).where(DutyTypeModel.id == d_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Тип наряду з кодом {d_id} вже існує")

    new_type = DutyTypeModel(
        id=d_id,
        name=payload.name.strip(),
        code=payload.code.strip(),
        description=payload.description or "",
        max_shift_hours=payload.max_shift_hours,
        color=payload.color,
        is_active=payload.is_active
    )
    db.add(new_type)
    await db.commit()
    await db.refresh(new_type)

    await invalidate_cache("duty_types:*")

    return {"status": "success", "duty_type": payload.model_dump()}

@router.put("/{duty_type_id}", summary="Оновлення типу наряду")
async def update_duty_type(
    duty_type_id: str,
    payload: DutyTypeUpdate,
    db: AsyncSession = Depends(get_db),
    dispatcher = Depends(get_current_dispatcher)
) -> Dict[str, Any]:
    """Оновлює параметри типу наряду."""
    result = await db.execute(select(DutyTypeModel).where(DutyTypeModel.id == duty_type_id.upper()))
    dt = result.scalar_one_or_none()
    if not dt:
        raise HTTPException(status_code=404, detail=f"Тип наряду {duty_type_id} не знайдено")

    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(dt, k, v)

    await db.commit()
    await db.refresh(dt)
    await invalidate_cache("duty_types:*")

    return {"status": "success", "message": f"Тип наряду {duty_type_id} оновлено"}

@router.delete("/{duty_type_id}", summary="Видалення типу наряду")
async def delete_duty_type(
    duty_type_id: str,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_active_superuser)
) -> Dict[str, Any]:
    """Видаляє тип наряду."""
    result = await db.execute(select(DutyTypeModel).where(DutyTypeModel.id == duty_type_id.upper()))
    dt = result.scalar_one_or_none()
    if not dt:
        raise HTTPException(status_code=404, detail=f"Тип наряду {duty_type_id} не знайдено")

    await db.delete(dt)
    await db.commit()
    await invalidate_cache("duty_types:*")

    return {"status": "success", "message": f"Тип наряду {duty_type_id} видалено"}
