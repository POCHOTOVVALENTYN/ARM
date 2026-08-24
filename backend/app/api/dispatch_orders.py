import logging
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from pydantic import BaseModel

from app.core.database import get_db
from app.models.models import DispatchOrderModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dispatch/orders", tags=["Dispatch Orders Journal"])

# --- Pydantic Schemas ---

class DispatchOrderCreate(BaseModel):
    route_id: str
    route_number: str
    transport_type: str = "TRAM" # TRAM / TROLLEYBUS
    vehicle_id: Optional[str] = None
    duty_number: Optional[int] = 1
    driver_name: Optional[str] = None
    order_type: str # SHORT_TURN, PACING, CAR_SWAP, PULL_IN, DETOUR, SERVICE_CALL, SPEED_RESTRICTION
    target_location: Optional[str] = None
    duration_min: Optional[int] = None
    reason: str
    description: str
    dispatcher_name: Optional[str] = "Черговий диспетчер ЦД"
    notes: Optional[str] = None

class DispatchOrderOut(BaseModel):
    id: int
    order_number: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    dispatcher_name: str
    dispatcher_id: Optional[str] = None
    route_id: str
    route_number: str
    transport_type: str
    vehicle_id: Optional[str] = None
    duty_number: Optional[int] = None
    driver_name: Optional[str] = None
    order_type: str
    target_location: Optional[str] = None
    duration_min: Optional[int] = None
    reason: str
    description: str
    status: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class DispatchStatsOut(BaseModel):
    total_today: int
    active_count: int
    completed_count: int
    short_turns_count: int
    pacing_count: int
    pull_in_count: int
    detour_count: int
    service_calls_count: int

# --- API Endpoints ---

@router.get("", response_model=List[DispatchOrderOut])
async def get_dispatch_orders(
    date_str: Optional[str] = Query(None, description="YYYY-MM-DD or 'today'"),
    route_id: Optional[str] = Query(None),
    order_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
):
    """Отримати журнал диспетчерських розпоряджень із фільтрами"""
    stmt = select(DispatchOrderModel)

    if route_id and route_id != "ALL":
        stmt = stmt.where(DispatchOrderModel.route_id == route_id)

    if order_type and order_type != "ALL":
        stmt = stmt.where(DispatchOrderModel.order_type == order_type)

    if status and status != "ALL":
        stmt = stmt.where(DispatchOrderModel.status == status)

    if date_str and date_str != "ALL":
        if date_str == "today":
            today_date = date.today()
            stmt = stmt.where(func.date(DispatchOrderModel.created_at) == today_date)
        else:
            try:
                filter_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                stmt = stmt.where(func.date(DispatchOrderModel.created_at) == filter_date)
            except ValueError:
                pass

    stmt = stmt.order_by(desc(DispatchOrderModel.created_at)).limit(limit)
    res = await db.execute(stmt)
    orders = res.scalars().all()

    # Якщо записів немає взагалі в базі, посіємо кілька зразків для реалістичного вигляду журналу
    if not orders:
        total_res = await db.execute(select(func.count(DispatchOrderModel.id)))
        total_count = total_res.scalar() or 0
        if total_count == 0:
            sample_orders = await _seed_sample_orders(db)
            return sample_orders

    return orders


@router.post("", response_model=DispatchOrderOut)
async def create_dispatch_order(
    payload: DispatchOrderCreate,
    db: AsyncSession = Depends(get_db)
):
    """Створити нове диспетчерське розпорядження в офіційному журналі"""
    now = datetime.utcnow()
    month_str = now.strftime("%Y/%m")
    
    # Підрахунок кількості наказів за цей місяць
    res = await db.execute(
        select(func.count(DispatchOrderModel.id)).where(
            DispatchOrderModel.order_number.like(f"Р-{month_str}-%")
        )
    )
    count_this_month = (res.scalar() or 0) + 1
    order_number = f"Р-{month_str}-{count_this_month:03d}"

    order = DispatchOrderModel(
        order_number=order_number,
        created_at=now,
        dispatcher_name=payload.dispatcher_name or "Черговий диспетчер ЦД",
        route_id=payload.route_id,
        route_number=payload.route_number,
        transport_type=payload.transport_type,
        vehicle_id=payload.vehicle_id,
        duty_number=payload.duty_number,
        driver_name=payload.driver_name,
        order_type=payload.order_type,
        target_location=payload.target_location,
        duration_min=payload.duration_min,
        reason=payload.reason,
        description=payload.description,
        status="ACTIVE",
        notes=payload.notes
    )

    db.add(order)
    await db.commit()
    await db.refresh(order)
    logger.info(f"📋 [DISPATCH ORDER] Створено наказ {order.order_number}: {order.order_type} для маршруту {order.route_number} (Борт {order.vehicle_id})")
    return order


@router.patch("/{order_id}/complete", response_model=DispatchOrderOut)
async def complete_dispatch_order(order_id: int, db: AsyncSession = Depends(get_db)):
    """Позначити розпорядження як успішно виконане"""
    res = await db.execute(select(DispatchOrderModel).where(DispatchOrderModel.id == order_id))
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Розпорядження не знайдено")
    
    order.status = "COMPLETED"
    order.completed_at = datetime.utcnow()
    await db.commit()
    await db.refresh(order)
    logger.info(f"✅ [DISPATCH ORDER] Розпорядження {order.order_number} виконано.")
    return order


@router.patch("/{order_id}/cancel", response_model=DispatchOrderOut)
async def cancel_dispatch_order(order_id: int, db: AsyncSession = Depends(get_db)):
    """Скасувати розпорядження"""
    res = await db.execute(select(DispatchOrderModel).where(DispatchOrderModel.id == order_id))
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Розпорядження не знайдено")
    
    order.status = "CANCELLED"
    order.completed_at = datetime.utcnow()
    await db.commit()
    await db.refresh(order)
    logger.info(f"🛑 [DISPATCH ORDER] Розпорядження {order.order_number} скасовано.")
    return order


@router.get("/stats", response_model=DispatchStatsOut)
async def get_dispatch_stats(db: AsyncSession = Depends(get_db)):
    """Отримати статистику наказів за сьогоднішню зміну"""
    today_date = date.today()
    
    # Перевірка чи є взагалі записи
    total_db_res = await db.execute(select(func.count(DispatchOrderModel.id)))
    if (total_db_res.scalar() or 0) == 0:
        await _seed_sample_orders(db)

    # Підрахунок сьогоднішніх
    total_res = await db.execute(select(func.count(DispatchOrderModel.id)).where(func.date(DispatchOrderModel.created_at) == today_date))
    total_today = total_res.scalar() or 0

    active_res = await db.execute(select(func.count(DispatchOrderModel.id)).where(func.date(DispatchOrderModel.created_at) == today_date, DispatchOrderModel.status == "ACTIVE"))
    active_count = active_res.scalar() or 0

    comp_res = await db.execute(select(func.count(DispatchOrderModel.id)).where(func.date(DispatchOrderModel.created_at) == today_date, DispatchOrderModel.status == "COMPLETED"))
    completed_count = comp_res.scalar() or 0

    st_res = await db.execute(select(func.count(DispatchOrderModel.id)).where(func.date(DispatchOrderModel.created_at) == today_date, DispatchOrderModel.order_type == "SHORT_TURN"))
    short_turns_count = st_res.scalar() or 0

    pac_res = await db.execute(select(func.count(DispatchOrderModel.id)).where(func.date(DispatchOrderModel.created_at) == today_date, DispatchOrderModel.order_type == "PACING"))
    pacing_count = pac_res.scalar() or 0

    pull_res = await db.execute(select(func.count(DispatchOrderModel.id)).where(func.date(DispatchOrderModel.created_at) == today_date, DispatchOrderModel.order_type == "PULL_IN"))
    pull_in_count = pull_res.scalar() or 0

    det_res = await db.execute(select(func.count(DispatchOrderModel.id)).where(func.date(DispatchOrderModel.created_at) == today_date, DispatchOrderModel.order_type == "DETOUR"))
    detour_count = det_res.scalar() or 0

    serv_res = await db.execute(select(func.count(DispatchOrderModel.id)).where(func.date(DispatchOrderModel.created_at) == today_date, DispatchOrderModel.order_type == "SERVICE_CALL"))
    service_calls_count = serv_res.scalar() or 0

    return DispatchStatsOut(
        total_today=total_today,
        active_count=active_count,
        completed_count=completed_count,
        short_turns_count=short_turns_count,
        pacing_count=pacing_count,
        pull_in_count=pull_in_count,
        detour_count=detour_count,
        service_calls_count=service_calls_count
    )


async def _seed_sample_orders(db: AsyncSession) -> List[DispatchOrderModel]:
    """Створення реалістичних зразків розпоряджень КП ОМЕТ за сьогодні"""
    now = datetime.utcnow()
    month_str = now.strftime("%Y/%m")
    
    sample_data = [
        {
            "order_number": f"Р-{month_str}-001",
            "created_at": now.replace(hour=max(0, now.hour - 4), minute=15),
            "completed_at": now.replace(hour=max(0, now.hour - 3), minute=20),
            "dispatcher_name": "Іванова О.В. (Таб. Д-104)",
            "route_id": "7",
            "route_number": "7",
            "transport_type": "TRAM",
            "vehicle_id": "4002",
            "duty_number": 2,
            "driver_name": "Коваленко С.М.",
            "order_type": "SHORT_TURN",
            "target_location": "Кільце «Лузанівка»",
            "reason": "Запізнення +12.0 хв через затор на Пересипу",
            "description": "Скорочення рейсу через кільце «Лузанівка» для входження в плановий інтервал 6 хв напрямку сел. Котовського.",
            "status": "COMPLETED",
            "notes": "Успішно виконано, інтервал відновлено."
        },
        {
            "order_number": f"Р-{month_str}-002",
            "created_at": now.replace(hour=max(0, now.hour - 2), minute=30),
            "completed_at": now.replace(hour=max(0, now.hour - 2), minute=45),
            "dispatcher_name": "Іванова О.В. (Таб. Д-104)",
            "route_id": "10",
            "route_number": "10",
            "transport_type": "TRAM",
            "vehicle_id": "3012",
            "duty_number": 1,
            "driver_name": "Бондарчук В.П.",
            "order_type": "PACING",
            "target_location": "1-ша ст. Люстдорфської дороги",
            "duration_min": 4,
            "reason": "Усунення спарювання з вагоном №2978 (інтервал < 1.5 хв)",
            "description": "Наказ на регулювальний відстій 4 хвилини на зупинці «1-ша ст. Люстдорфської дороги».",
            "status": "COMPLETED",
            "notes": "Розрив між вагонами збільшено до нормативних 7 хв."
        },
        {
            "order_number": f"Р-{month_str}-003",
            "created_at": now.replace(hour=max(0, now.hour - 1), minute=10),
            "completed_at": None,
            "dispatcher_name": "Сидоренко В.А. (Таб. Д-108)",
            "route_id": "8",
            "route_number": "8",
            "transport_type": "TROLLEYBUS",
            "vehicle_id": "0013",
            "duty_number": 3,
            "driver_name": "Шевченко А.І.",
            "order_type": "CAR_SWAP",
            "target_location": "Тролейбусне депо №1",
            "reason": "Технічний огляд компресора пневмосистеми",
            "description": "Заїзд до ТрД-1 на ТО. На заміну випущено резервний тролейбус №0036 (наряд #3).",
            "status": "ACTIVE",
            "notes": "Резервний борт на лінії."
        },
        {
            "order_number": f"Р-{month_str}-004",
            "created_at": now.replace(hour=max(0, now.hour), minute=max(0, now.minute - 15)),
            "completed_at": None,
            "dispatcher_name": "Сидоренко В.А. (Таб. Д-108)",
            "route_id": "5",
            "route_number": "5",
            "transport_type": "TRAM",
            "vehicle_id": "7012",
            "duty_number": 2,
            "driver_name": "Мельник В.О.",
            "order_type": "DETOUR",
            "target_location": "Кільце «Парк Шевченка»",
            "reason": "ДТП стороннього автотранспорту на вул. Пантелеймонівській",
            "description": "Тимчасовий рух маршруту №5 в об'їзд: через вул. Старопортофранківську та Тираспільську площу.",
            "status": "ACTIVE",
            "notes": "Службу безпеки руху викликано на місце ДТП."
        }
    ]

    orders = []
    for d in sample_data:
        ord_obj = DispatchOrderModel(**d)
        db.add(ord_obj)
        orders.append(ord_obj)

    await db.commit()
    for o in orders:
        await db.refresh(o)
    return orders
