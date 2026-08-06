from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import OperationalError
from fastapi import HTTPException, status
from app.models.models import Vehicle, Trip, IncidentLog # Припускаємо наявність ORM-моделей
from app.models.schemas import HotReserveActivationRequest
from datetime import datetime, timezone
from app.api.websocket import manager  # Імпорт для розсилки івентів WebSocket

async def activate_hot_reserve_tx(db: AsyncSession, payload: HotReserveActivationRequest):
    """
    Атомарна операція введення гарячого резерву.
    Усі зміни фіксуються лише за умови успішного виконання всього блоку.
    """
    async with db.begin():
        # 1. Песимістичне блокування резервного борту
        stmt_vehicle = select(Vehicle).where(
            Vehicle.id == payload.reserve_vehicle_id
        ).with_for_update(nowait=True)
        
        try:
            result = await db.execute(stmt_vehicle)
            vehicle = result.scalar_one_or_none()
        except OperationalError:
            # Обробка помилки блокування, якщо інша транзакція вже тримає лок
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Цей резервний борт вже обробляється іншим диспетчером."
            )

        # 2. Валідація стану борту
        if not vehicle:
            raise HTTPException(status_code=404, detail="Борт не знайдено.")
        if vehicle.status != 'HOT_RESERVE':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Борт {vehicle.id} не має статусу гарячого резерву."
            )

        # 3. Блокування цільового рейсу
        stmt_trip = select(Trip).where(Trip.id == payload.target_trip_id).with_for_update(nowait=True)
        try:
            result_trip = await db.execute(stmt_trip)
            trip = result_trip.scalar_one_or_none()
        except OperationalError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Рейс вже редагується іншим диспетчером."
            )

        if not trip:
            raise HTTPException(status_code=404, detail="Цільовий рейс не знайдено.")

        # 4. Виконання мутацій (в пам'яті транзакції)
        old_vehicle_id = trip.vehicle_id
        
        # Переводимо резерв у статус роботи на лінії
        vehicle.status = 'ON_ROUTE'
        vehicle.current_trip_id = trip.id
        
        # Оновлюємо прив'язку борту до рейсу
        trip.vehicle_id = vehicle.id
        trip.status = 'MODIFIED_RESERVE'

        # 5. Логування операції для аналітики та історії
        audit_log = IncidentLog(
            incident_id=payload.incident_id,
            trip_id=trip.id,
            old_vehicle_id=old_vehicle_id,
            new_vehicle_id=vehicle.id,
            action='HOT_RESERVE_ACTIVATION',
            reason=payload.reason,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(audit_log)

        # Комміт відбувається автоматично при виході з блоку async with db.begin()

    # Після виходу з async with db.begin() транзакція успішно закоммічена.
    # Транслюємо подію зміну статусу всім клієнтам по WebSocket
    await manager.broadcast({
        "type": "VEHICLE_STATUS_CHANGED",
        "payload": {
            "vehicle_id": vehicle.id,
            "status": vehicle.status,
            "trip_id": trip.id
        }
    })

    return {
        "status": "success",
        "trip_id": trip.id,
        "new_vehicle_id": vehicle.id,
        "activation_time": audit_log.timestamp
    }
