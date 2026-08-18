from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel

from app.api.dependencies import get_db, get_current_dispatcher, get_current_active_superuser
from app.models.models import EmergencyTemplateModel, ActiveDetour, Dispatcher
from app.core.redis import get_cache, set_cache, invalidate_cache, get_redis
from app.schemas.emergencies import EmergencyTemplateCreate
from app.api.websocket import ws_manager

router = APIRouter(prefix="/emergencies", tags=["Emergencies & Detours"])

# Базові фізично валідні шаблони розворотів та перемикань Одеси (суворо за наявною колійною топологією)
ODESSA_DEFAULT_DETOUR_TEMPLATES = [
    {
        "id": "detour_t18_fontan_11",
        "title": "Трамвай №18: Блокування 12-16 ст. Фонтану",
        "cause": "ДТП / обрив контактної мережі на Фонтанській дорозі (12-16 ст.)",
        "affectedRouteIds": ["18"],
        "affectedStationIds": ["st_12_fontan", "st_13_fontan", "st_14_fontan", "st_15_fontan", "st_16_fontan"],
        "detourDescription": "Скорочення рейсів: розворот на єдиному проміжному кільці лінії Фонтану — 11-та станція Великого Фонтану (Ванний провулок).",
        "alternativeStations": ["Куликове поле", "4-та ст. Фонтану", "5-та ст. Фонтану", "11-та ст. Великого Фонтану (Кільце)"],
        "validLoops": ["11-та ст. Великого Фонтану", "Куликове поле"]
    },
    {
        "id": "detour_t18_kulykove",
        "title": "Трамвай №18/17: Блокування Фонтанської дороги (4-10 ст.)",
        "cause": "ДТП / блокування колій стороннім транспортом на Фонтанській дорозі",
        "affectedRouteIds": ["17", "18"],
        "affectedStationIds": ["st_4_fontan", "st_5_fontan", "st_6_fontan", "st_7_fontan", "st_8_fontan", "st_9_fontan"],
        "detourDescription": "Оскільки проміжних кілець до 11 ст. немає, вагони з боку вокзалу розвертаються на Куликовому полі; вагони за місцем ДТП працюють у човниковому режимі 11 ст. — 16 ст.",
        "alternativeStations": ["Куликове поле (Кільце)", "11-та ст. Великого Фонтану (Кільце)", "16-та ст. Великого Фонтану (Кільце)"],
        "validLoops": ["Куликове поле", "11-та ст. Великого Фонтану", "16-та ст. Великого Фонтану"]
    },
    {
        "id": "detour_t5_shevchenko_park",
        "title": "Трамвай №5: Розворот у Парку Шевченка (кільце №28)",
        "cause": "ДТП / скупчення авто на вул. Пантелеймонівській або біля Привозу",
        "affectedRouteIds": ["5", "28"],
        "affectedStationIds": ["st_privoz", "st_panteleymon"],
        "detourDescription": "Оперативне скорочення з Французького бульвару: вагони з Аркадії на перетині біля Музкомедії повертають праворуч на вул. Леонтовича та розвертаються на кільці «Парк ім. Т. Шевченка» (траса маршруту №28).",
        "alternativeStations": ["Аркадія (Кільце)", "Французький бульвар", "Музкомедія", "Парк Шевченка (Кільце)"],
        "validLoops": ["Парк ім. Т. Шевченка", "Куликове поле", "Олексіївська площа", "Аркадія"]
    },
    {
        "id": "detour_t5_oleksiivska",
        "title": "Трамвай №5: Блокування вул. Колонтаївської / Автовокзалу",
        "cause": "Ремонт колії або блокування руху біля Автовокзалу",
        "affectedRouteIds": ["5"],
        "affectedStationIds": ["st_autovokzal"],
        "detourDescription": "Направлення вагонів з Аркадії через Старосінну площу на розворотне кільце «Олексіївська площа» або трикутник «ст. Одеса-Товарна».",
        "alternativeStations": ["Аркадія (Кільце)", "Французький бульвар", "Куликове поле", "Старосінна площа", "Олексіївська площа (Кільце)"],
        "validLoops": ["Олексіївська площа", "ст. Одеса-Товарна", "Парк ім. Т. Шевченка", "Куликове поле", "Аркадія"]
    },
    {
        "id": "detour_t7_luzanivka",
        "title": "Трамвай №7: Блокування просп. Князя Володимира Великого / Пересипу",
        "cause": "ДТП / обрив контактної мережі на Миколаївській дорозі або в районі Молодої Гвардії",
        "affectedRouteIds": ["7", "1"],
        "affectedStationIds": ["st_moloda_gvardiya", "st_kryzhanivka"],
        "detourDescription": "Оперативне скорочення: вагони з центру розвертаються на проміжному кільці «Лузанівка» або «Херсонський сквер» (Пересипський міст); з боку селища Котовського — до Молодої Гвардії.",
        "alternativeStations": ["Старосінна площа", "Пересипський міст", "Лузанівка (Кільце)", "вул. Паустовського (Кільце)"],
        "validLoops": ["Лузанівка", "Херсонський сквер / Пересипський міст", "Старосінна площа", "вул. Паустовського"]
    },
    {
        "id": "detour_t28_tyraspolska",
        "title": "Трамвай №28: Блокування вул. Пастера / Старопортофранківської",
        "cause": "Перекриття руху / ДТП біля Медичного університету",
        "affectedRouteIds": ["28"],
        "affectedStationIds": ["st_pastera", "st_medin"],
        "detourDescription": "Оперативний розворот через кільце «Тираспольська площа» з поверненням до кінцевої «Парк ім. Т. Шевченка».",
        "alternativeStations": ["Парк Шевченка (Кільце)", "вул. Леонтовича", "Тираспольська площа (Кільце)"],
        "validLoops": ["Тираспольська площа", "Парк Шевченка", "Старосінна площа"]
    }
]

# ----------------- ШАБЛОНИ НС (Emergency Templates) -----------------

@router.get("/templates", response_model=List[Dict[str, Any]])
async def get_emergency_templates(db: AsyncSession = Depends(get_db)):
    cached = await get_cache("settings:emergencies")
    if cached:
        return cached

    result = await db.execute(select(EmergencyTemplateModel))
    templates = result.scalars().all()
    
    if not templates:
        for t_data in ODESSA_DEFAULT_DETOUR_TEMPLATES:
            t_obj = EmergencyTemplateModel(**t_data)
            db.add(t_obj)
        await db.commit()
        result = await db.execute(select(EmergencyTemplateModel))
        templates = result.scalars().all()

    data = [
        {
            "id": t.id,
            "title": t.title,
            "cause": t.cause,
            "affectedRouteIds": t.affectedRouteIds,
            "affectedStationIds": t.affectedStationIds,
            "detourDescription": t.detourDescription,
            "alternativeStations": t.alternativeStations,
            "validLoops": getattr(t, "validLoops", [])
        }
        for t in templates
    ]
    await set_cache("settings:emergencies", data)
    return data

@router.post("/templates", response_model=Dict[str, Any])
async def create_emergency_template(
    template: EmergencyTemplateCreate, 
    db: AsyncSession = Depends(get_db),
    admin: Dispatcher = Depends(get_current_active_superuser)
):
    new_template = EmergencyTemplateModel(**template.model_dump())
    db.add(new_template)
    await db.commit()
    await invalidate_cache("settings:emergencies")
    return template.model_dump()

@router.delete("/templates/{template_id}")
async def delete_emergency_template(
    template_id: str, 
    db: AsyncSession = Depends(get_db),
    admin: Dispatcher = Depends(get_current_active_superuser)
):
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
    target_loop: Optional[str] = None
    new_path_description: str

class DetourResponse(BaseModel):
    id: int
    vehicle_id: str
    route_id: str
    reason: str
    target_loop: Optional[str] = None
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
    """Отримання всіх поточних активних оперативних перемикань (об'їздів)."""
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
    """
    Активація оперативного перемикання (розворот на кільці/зміна траси).
    Автоматично вимикає генерацію хибних штрафів за запізнення та сповіщає водія.
    """
    new_detour = ActiveDetour(
        vehicle_id=detour.vehicle_id,
        route_id=detour.route_id,
        reason=detour.reason,
        target_loop=detour.target_loop,
        new_path_description=detour.new_path_description,
        dispatcher_id=current_user.id
    )
    db.add(new_detour)
    await db.commit()
    await db.refresh(new_detour)

    try:
        redis = await get_redis()
        await redis.set(f"active_detour:{detour.vehicle_id}", "true")
    except Exception as e:
        print(f"Помилка оновлення Redis мітки detour: {e}")

    await ws_manager.broadcast({
        "type": "DETOUR_UPDATED",
        "payload": {
            "action": "activate",
            "vehicle_id": detour.vehicle_id,
            "route_id": detour.route_id,
            "target_loop": detour.target_loop,
            "new_path_description": detour.new_path_description,
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
    """Повернення транспорту з оперативного перемикання на штатний маршрут."""
    result = await db.execute(select(ActiveDetour).where(ActiveDetour.id == detour_id))
    detour = result.scalar_one_or_none()
    
    if not detour or detour.ended_at is not None:
        raise HTTPException(status_code=400, detail="Об'їзд не знайдено або вже завершено")

    detour.ended_at = datetime.utcnow()
    await db.commit()
    
    try:
        redis = await get_redis()
        await redis.delete(f"active_detour:{detour.vehicle_id}")
    except Exception as e:
        print(f"Помилка видалення Redis мітки detour: {e}")

    await ws_manager.broadcast({
        "type": "DETOUR_UPDATED",
        "payload": {
            "action": "deactivate",
            "detour_id": detour_id,
            "vehicle_id": detour.vehicle_id
        }
    })
    return {"message": "Транспорт повернуто на плановий маршрут", "id": detour_id}
