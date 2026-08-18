from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import Dict, Any

from app.api.dependencies import get_db
from app.models.models import RouteModel, StationModel, Waybill, Driver, Vehicle
from app.models.schedule import Schedule, ScheduleStatus, StaticDuty, StaticShift, StaticTrip, StaticStopTime

router = APIRouter(prefix="/schedule", tags=["Schedule Init"])

@router.get("/init", summary="Get initial system data (routes, active schedules, stops, vehicles)")
async def get_schedule_init(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    try:
        # 1. Маршрути
        routes_result = await db.execute(select(RouteModel))
        routes = routes_result.scalars().all()
        
        # 2. Зупинки
        stations_result = await db.execute(select(StationModel))
        stations = stations_result.scalars().all()

        # 3. Активні розклади
        sched_result = await db.execute(
            select(Schedule)
            .where(Schedule.status == ScheduleStatus.ACTIVE)
            .options(
                selectinload(Schedule.duties)
                .selectinload(StaticDuty.shifts)
                .selectinload(StaticShift.trips)
                .selectinload(StaticTrip.stop_times)
            )
        )
        schedules = sched_result.scalars().all()

        # 4. Водії та рухомий склад
        drivers_res = await db.execute(select(Driver))
        drivers = drivers_res.scalars().all()

        vehicles_res = await db.execute(select(Vehicle))
        vehicles = vehicles_res.scalars().all()

        def to_dict(obj):
            return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
            
        return {
            "routes": [to_dict(r) for r in routes],
            "stops": [to_dict(s) for s in stations],
            "stations": [to_dict(s) for s in stations],
            "drivers": [to_dict(d) for d in drivers],
            "vehicles": [to_dict(v) for v in vehicles],
            "active_schedules_count": len(schedules),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка завантаження розкладу: {str(e)}")
