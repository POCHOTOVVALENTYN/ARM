from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

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

    async def get_schedule_with_full_hierarchy(self, schedule_id: int) -> Optional[Schedule]:
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

    async def get_active_schedule_for_route(self, route_id: str, active_date: Optional[str] = None) -> Optional[Schedule]:
        """
        Отримує поточний РОБОЧИЙ розклад для маршруту з повним деревом зв'язків.
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

    async def get_all_active_schedules(self) -> List[Schedule]:
        """
        Отримує список ВСІХ активних розкладів підприємства для сайдбару диспетчера.
        """
        query = (
            select(Schedule)
            .where(Schedule.status == ScheduleStatus.ACTIVE)
            .order_by(Schedule.route_id)
            .options(
                selectinload(Schedule.duties)
                .selectinload(StaticDuty.shifts)
                .selectinload(StaticShift.trips)
                .selectinload(StaticTrip.stop_times)
            )
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
