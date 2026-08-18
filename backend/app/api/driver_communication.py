from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from datetime import datetime

from app.api.dependencies import get_db, get_current_dispatcher
from app.models.models import DriverAlert, DispatcherDirective, Dispatcher
from app.schemas.driver_communication import (
    DriverAlertCreate, DriverAlertResponse,
    DispatcherDirectiveCreate, DispatcherDirectiveResponse
)
from app.api.websocket import ws_manager

router = APIRouter(prefix="/driver-comm", tags=["Driver & Dispatcher Communication"])

# ----------------- ТРИВОГИ ТА СИГНАЛИ ВІД ВОДІЯ (Driver Alerts) -----------------

@router.post("/alert", response_model=DriverAlertResponse, status_code=status.HTTP_201_CREATED)
async def send_driver_alert(
    alert_in: DriverAlertCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Водій надсилає швидкий сигнал або тривожне повідомлення диспетчеру (ДТП, відсутність струму, поломка тощо).
    Працює з кабінету водія на планшеті.
    """
    new_alert = DriverAlert(
        vehicle_id=alert_in.vehicle_id,
        driver_id=alert_in.driver_id,
        route_id=alert_in.route_id,
        alert_type=alert_in.alert_type,
        message=alert_in.message,
        status="NEW",
        lat=alert_in.lat,
        lng=alert_in.lng
    )
    db.add(new_alert)
    await db.commit()
    await db.refresh(new_alert)

    # Миттєва трансляція тривожного сигналу на робочі місця всіх диспетчерів
    await ws_manager.broadcast({
        "type": "DRIVER_ALERT",
        "payload": {
            "id": new_alert.id,
            "vehicle_id": new_alert.vehicle_id,
            "driver_id": new_alert.driver_id,
            "route_id": new_alert.route_id,
            "alert_type": new_alert.alert_type,
            "message": new_alert.message,
            "status": new_alert.status,
            "lat": new_alert.lat,
            "lng": new_alert.lng,
            "created_at": new_alert.created_at.isoformat() if new_alert.created_at else None
        }
    })

    return new_alert

@router.get("/alerts/active", response_model=List[DriverAlertResponse])
async def get_active_driver_alerts(
    route_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Dispatcher = Depends(get_current_dispatcher)
):
    """Отримання всіх нерозглянутих або активних тривожних сигналів від водіїв."""
    query = select(DriverAlert).where(DriverAlert.status.in_(["NEW", "SEEN", "ACKNOWLEDGED"])).order_by(DriverAlert.id.desc())
    if route_id:
        query = query.where(DriverAlert.route_id == route_id)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.put("/alerts/{alert_id}/resolve", response_model=DriverAlertResponse)
async def resolve_driver_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Dispatcher = Depends(get_current_dispatcher)
):
    """Диспетчер закриває / опрацьовує тривожний сигнал водія."""
    query = select(DriverAlert).where(DriverAlert.id == alert_id)
    result = await db.execute(query)
    alert = result.scalar_one_or_none()

    if not alert:
        raise HTTPException(status_code=404, detail="Сигнал не знайдено")

    alert.status = "RESOLVED"
    alert.resolved_at = datetime.utcnow()
    alert.dispatcher_id = current_user.id
    await db.commit()
    await db.refresh(alert)

    # Оповіщення через WebSocket
    await ws_manager.broadcast({
        "type": "DRIVER_ALERT_RESOLVED",
        "payload": {"id": alert.id, "vehicle_id": alert.vehicle_id, "status": "RESOLVED"}
    })

    return alert


# ----------------- ВКАЗІВКИ ДИСПЕТЧЕРА ВОДІЄВІ (Dispatcher Directives) -----------------

@router.post("/directive", response_model=DispatcherDirectiveResponse, status_code=status.HTTP_201_CREATED)
async def send_dispatcher_directive(
    directive_in: DispatcherDirectiveCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Dispatcher = Depends(get_current_dispatcher)
):
    """
    Диспетчер надсилає наказ / вказівку водію конкретного вагона (зміна темпу, оперативний розворот, заїзд у депо).
    """
    new_directive = DispatcherDirective(
        vehicle_id=directive_in.vehicle_id,
        driver_id=directive_in.driver_id,
        route_id=directive_in.route_id,
        directive_type=directive_in.directive_type,
        message=directive_in.message,
        is_acknowledged=False,
        dispatcher_id=current_user.id
    )
    db.add(new_directive)
    await db.commit()
    await db.refresh(new_directive)

    # Трансляція водію через WebSocket
    await ws_manager.broadcast({
        "type": "DISPATCHER_DIRECTIVE",
        "payload": {
            "id": new_directive.id,
            "vehicle_id": new_directive.vehicle_id,
            "driver_id": new_directive.driver_id,
            "directive_type": new_directive.directive_type,
            "message": new_directive.message,
            "created_at": new_directive.created_at.isoformat() if new_directive.created_at else None,
            "dispatcher_name": current_user.full_name or current_user.username
        }
    })

    return new_directive

@router.get("/directives/vehicle/{vehicle_id}", response_model=List[DispatcherDirectiveResponse])
async def get_vehicle_directives(
    vehicle_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Отримання останніх вказівок для конкретного вагона (з кабінету водія)."""
    query = (
        select(DispatcherDirective)
        .where(DispatcherDirective.vehicle_id == vehicle_id)
        .order_by(DispatcherDirective.id.desc())
        .limit(20)
    )
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/directives/{directive_id}/ack")
async def acknowledge_directive(
    directive_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Водій підтверджує отримання наказу диспетчера («Прийнято до виконання»).
    """
    query = select(DispatcherDirective).where(DispatcherDirective.id == directive_id)
    result = await db.execute(query)
    directive = result.scalar_one_or_none()

    if not directive:
        raise HTTPException(status_code=404, detail="Вказівку не знайдено")

    directive.is_acknowledged = True
    directive.acknowledged_at = datetime.utcnow()
    await db.commit()

    # Сповіщаємо диспетчера про підтвердження
    await ws_manager.broadcast({
        "type": "DIRECTIVE_ACK",
        "payload": {
            "directive_id": directive.id,
            "vehicle_id": directive.vehicle_id,
            "acknowledged_at": directive.acknowledged_at.isoformat()
        }
    })

    return {"message": "Вказівку прийнято до виконання", "directive_id": directive.id, "is_acknowledged": True}
