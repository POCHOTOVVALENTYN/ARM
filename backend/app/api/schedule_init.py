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

        routes_list = []
        for r in routes:
            routes_list.append({
                "id": r.id,
                "number": r.number,
                "name": r.name,
                "type": (r.type or "TRAM").lower(),
                "status": (r.status or "ACTIVE").lower(),
                "length_km": r.length_km or 10.5,
                "lengthDir1Km": r.lengthDir1Km or round((r.length_km or 10.5) / 2, 1),
                "lengthDir2Km": r.lengthDir2Km or round((r.length_km or 10.5) / 2, 1),
                "default_speed_kmh": r.default_speed_kmh or 14.5,
                "round_trip_min": r.round_trip_min or (84 if (r.type or "").upper() == "TRAM" else 60),
                "standard_break_min": r.standard_break_min or (15 if (r.type or "").upper() == "TRAM" else 20),
                "designated_break_hub": r.designated_break_hub or "Диспетчерський пункт",
                "t_dir0_min": r.t_dir0_min or 36,
                "t_dir1_min": r.t_dir1_min or 36,
                "layover_min": r.layover_min or 6,
                "color": r.color or ("#2563eb" if (r.type or "").upper() == "TRAM" else "#059669"),
                "segments": r.segments or [],
                "stations": r.stations or [],
                "allStations": r.allStations or [],
                "description": r.description or f"Маршрут №{r.number} КП «ОМЕТ»"
            })

        stations_list = []
        for s in stations:
            stations_list.append({
                "id": str(s.id),
                "name": s.name,
                "code": s.name[:3].upper() if s.name else f"ЗП{s.id}",
                "type": s.type or "STOP",
                "status": s.status or "ACTIVE",
                "isTerminal": bool(s.is_dispatch_station or s.type == "HUB"),
                "is_dispatch_station": bool(s.is_dispatch_station),
                "break_capacity": s.break_capacity or 0,
                "lat": s.lat,
                "lon": s.lon or s.lng or s.lat,
                "lng": s.lng or s.lon or s.lat
            })

        def to_dict(obj):
            return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}

        return {
            "routes": routes_list,
            "stops": stations_list,
            "stations": stations_list,
            "drivers": [to_dict(d) for d in drivers],
            "vehicles": [to_dict(v) for v in vehicles],
            "active_schedules_count": len(schedules),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка завантаження розкладу: {str(e)}")
