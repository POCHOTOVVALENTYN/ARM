from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.schedule import (
    Schedule, 
    StaticDuty, 
    StaticShift, 
    StaticTrip, 
    StaticStopTime,
    ScheduleStatus
)

class ScheduleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_schedule_with_full_hierarchy(self, schedule_id: int) -> Schedule | None:
        """
        Завантажує розклад з повним деревом (Наряди -> Зміни -> Рейси -> Зупинки)
        Використовує selectinload для уникнення N+1 проблеми та декартового добутку.
        """
        query = (
            select(Schedule)
            .where(Schedule.id == schedule_id)
            .options(
                selectinload(Schedule.duties)
                .selectinload(StaticDuty.shifts)
                .selectinload(StaticShift.trips)
                .selectinload(StaticTrip.stop_times)
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_active_schedule_for_route(self, route_id: str) -> Schedule | None:
        """
        Допоміжний метод: Отримує поточний РОБОЧИЙ розклад для маршруту
        з усім деревом для видачі диспетчеру чи на табло.
        """
        query = (
            select(Schedule)
            .where(
                Schedule.route_id == route_id,
                Schedule.status == ScheduleStatus.ACTIVE
            )
            .options(
                selectinload(Schedule.duties)
                .selectinload(StaticDuty.shifts)
                .selectinload(StaticShift.trips)
                .selectinload(StaticTrip.stop_times)
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
