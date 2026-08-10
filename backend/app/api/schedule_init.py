from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, Any

from app.api.dependencies import get_db
from app.models.models import RouteModel, VehicleBlockModel, DriverDutyModel, StationModel

router = APIRouter(prefix="/schedule", tags=["Schedule Init"])

@router.get("/init", summary="Get initial schedule data (routes, blocks, duties, stops)")
async def get_schedule_init(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    try:
        # Query routes
        routes_result = await db.execute(select(RouteModel))
        routes = routes_result.scalars().all()
        
        # Query blocks
        blocks_result = await db.execute(select(VehicleBlockModel))
        blocks = blocks_result.scalars().all()
        
        # Query duties
        duties_result = await db.execute(select(DriverDutyModel))
        duties = duties_result.scalars().all()

        # Query stops/stations
        stations_result = await db.execute(select(StationModel))
        stations = stations_result.scalars().all()
        
        def to_dict(obj):
            return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
            
        return {
            "routes": [to_dict(r) for r in routes],
            "blocks": [to_dict(b) for b in blocks],
            "vehicle_blocks": [to_dict(b) for b in blocks], # Retained for backward compatibility
            "driver_duties": [to_dict(d) for d in duties],
            "stops": [to_dict(s) for s in stations],
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка завантаження розкладу: {str(e)}")
