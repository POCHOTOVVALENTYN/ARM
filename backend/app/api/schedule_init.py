from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, Any

from app.api.dependencies import get_db
from app.models.models import RouteModel, VehicleBlockModel, DriverDutyModel

router = APIRouter()

@router.get("/init", summary="Get initial schedule data (routes, blocks, duties)")
async def get_schedule_init(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    # Query routes
    routes_result = await db.execute(select(RouteModel))
    routes = routes_result.scalars().all()
    
    # Query blocks
    blocks_result = await db.execute(select(VehicleBlockModel))
    blocks = blocks_result.scalars().all()
    
    # Query duties
    duties_result = await db.execute(select(DriverDutyModel))
    duties = duties_result.scalars().all()
    
    def to_dict(obj):
        return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
        
    return {
        "routes": [to_dict(r) for r in routes],
        "vehicle_blocks": [to_dict(b) for b in blocks],
        "driver_duties": [to_dict(d) for d in duties]
    }
