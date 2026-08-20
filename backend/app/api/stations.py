import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, delete

from app.api.dependencies import get_db, get_current_dispatcher
from app.models.models import StationModel, RouteStation
from app.models.schemas import StationStatusUpdate
from app.api.websocket import manager as ws_manager
from app.core.redis import get_cache, set_cache, invalidate_cache

logger = logging.getLogger("stations_api")

router = APIRouter(prefix="/stations", tags=["Stations & Stops"])

class StationCreate(BaseModel):
    id: Optional[str] = None
    name: str
    lat: float = Field(..., description="WGS-84 Latitude")
    lng: float = Field(..., description="WGS-84 Longitude")
    type: str = "STOP" # STOP, HUB, TERMINAL, DEPOT, CONTROL_POINT
    status: str = "ACTIVE"
    is_dispatch_station: bool = False
    break_capacity: int = 0

class StationUpdate(BaseModel):
    name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    type: Optional[str] = None
    status: Optional[str] = None
    is_dispatch_station: Optional[bool] = None
    break_capacity: Optional[int] = None

@router.get("", summary="Отримання списку всіх зупинок та КП")
@router.get("/", summary="Отримання списку всіх зупинок та КП")
async def get_stations(
    search: Optional[str] = Query(None, description="Пошуковий запит (назва або ID)"),
    type: Optional[str] = Query(None, description="Фільтр типу (STOP, HUB, TERMINAL, DEPOT)"),
    is_cp: Optional[bool] = Query(None, description="Фільтр контрольних пунктів"),
    limit: Optional[int] = Query(None, ge=1, le=1000),
    offset: Optional[int] = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Повертає список зупинок електротранспорту Одеси з підтримкою пошуку та фільтрації.
    """
    cache_key = f"stations:list:{search}:{type}:{is_cp}:{limit}:{offset}"
    cached = await get_cache(cache_key)
    if cached:
        return cached

    query = select(StationModel)

    if search:
        s_term = f"%{search.strip()}%"
        query = query.where(or_(StationModel.name.ilike(s_term), StationModel.id.ilike(s_term)))
    
    if type:
        query = query.where(StationModel.type == type.upper())
        
    if is_cp is not None:
        query = query.where(StationModel.is_dispatch_station == is_cp)

    query = query.order_by(StationModel.name)

    if limit:
        query = query.limit(limit).offset(offset)

    result = await db.execute(query)
    stations = result.scalars().all()

    data = [
        {
            "id": s.id,
            "name": s.name,
            "lat": s.lat,
            "lng": s.lng or s.lon or 30.741,
            "lon": s.lon or s.lng or 30.741,
            "type": s.type or "STOP",
            "status": s.status or "ACTIVE",
            "is_dispatch_station": bool(s.is_dispatch_station),
            "break_capacity": s.break_capacity or 0
        }
        for s in stations
    ]

    await set_cache(cache_key, data, expire_seconds=300)
    return data

@router.get("/{station_id}", summary="Отримання деталей зупинки")
async def get_station_detail(
    station_id: str,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Повертає повну інформацію про зупинку та маршрути, які через неї курсують."""
    result = await db.execute(select(StationModel).where(StationModel.id == station_id))
    station = result.scalar_one_or_none()
    
    if not station:
        raise HTTPException(status_code=404, detail=f"Зупинку {station_id} не знайдено")

    # Знаходимо маршрути, що проходять через зупинку
    routes_res = await db.execute(
        select(RouteStation.route_id, RouteStation.direction_id)
        .where(RouteStation.stop_id == station_id)
        .distinct()
    )
    passing_routes = [{"route_id": r[0], "direction_id": r[1]} for r in routes_res.all()]

    return {
        "id": station.id,
        "name": station.name,
        "lat": station.lat,
        "lng": station.lng or station.lon or 30.741,
        "lon": station.lon or station.lng or 30.741,
        "type": station.type or "STOP",
        "status": station.status or "ACTIVE",
        "is_dispatch_station": bool(station.is_dispatch_station),
        "break_capacity": station.break_capacity or 0,
        "passing_routes": passing_routes
    }

@router.post("", summary="Створення нової зупинки")
@router.post("/", summary="Створення нової зупинки")
async def create_station(
    payload: StationCreate,
    db: AsyncSession = Depends(get_db),
    dispatcher = Depends(get_current_dispatcher)
) -> Dict[str, Any]:
    """Створює нову зупинку в базі даних та сповіщає диспетчерів."""
    s_id = payload.id.strip() if payload.id else f"st_{int(payload.lat*10000)}_{int(payload.lng*10000)}"

    existing = await db.execute(select(StationModel).where(StationModel.id == s_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Зупинка з ID {s_id} вже існує")

    new_station = StationModel(
        id=s_id,
        name=payload.name.strip(),
        lat=payload.lat,
        lon=payload.lng,
        lng=payload.lng,
        type=payload.type.upper(),
        status=payload.status.upper(),
        is_dispatch_station=payload.is_dispatch_station,
        break_capacity=payload.break_capacity
    )
    db.add(new_station)
    await db.commit()
    await db.refresh(new_station)

    await invalidate_cache("stations:*")

    # WebSocket Broadcast
    await ws_manager.broadcast({
        "type": "STATION_UPDATE",
        "payload": {
            "action": "CREATE",
            "station_id": new_station.id,
            "name": new_station.name,
            "status": new_station.status
        }
    })

    return {
        "status": "success",
        "station": {
            "id": new_station.id,
            "name": new_station.name,
            "lat": new_station.lat,
            "lng": new_station.lng,
            "type": new_station.type,
            "is_dispatch_station": new_station.is_dispatch_station,
            "break_capacity": new_station.break_capacity
        }
    }

@router.put("/{station_id}", summary="Оновлення параметрів зупинки")
async def update_station(
    station_id: str,
    payload: StationUpdate,
    db: AsyncSession = Depends(get_db),
    dispatcher = Depends(get_current_dispatcher)
) -> Dict[str, Any]:
    """Оновлює параметри зупинки (назва, координати, статус, КП)."""
    result = await db.execute(select(StationModel).where(StationModel.id == station_id))
    station = result.scalar_one_or_none()

    if not station:
        raise HTTPException(status_code=404, detail=f"Зупинку {station_id} не знайдено")

    update_dict = payload.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        if val is not None:
            if field == "lng":
                setattr(station, "lng", val)
                setattr(station, "lon", val)
            elif field == "type" or field == "status":
                setattr(station, field, str(val).upper())
            else:
                setattr(station, field, val)

    await db.commit()
    await db.refresh(station)

    await invalidate_cache("stations:*")

    # WebSocket Broadcast
    await ws_manager.broadcast({
        "type": "STATION_UPDATE",
        "payload": {
            "action": "UPDATE",
            "station_id": station.id,
            "name": station.name,
            "status": station.status,
            "is_dispatch_station": station.is_dispatch_station
        }
    })

    return {
        "status": "success",
        "station": {
            "id": station.id,
            "name": station.name,
            "lat": station.lat,
            "lng": station.lng or station.lon,
            "type": station.type,
            "is_dispatch_station": station.is_dispatch_station,
            "break_capacity": station.break_capacity
        }
    }

@router.delete("/{station_id}", summary="Видалення зупинки")
async def delete_station(
    station_id: str,
    db: AsyncSession = Depends(get_db),
    dispatcher = Depends(get_current_dispatcher)
) -> Dict[str, Any]:
    """Видаляє зупинку з бази даних."""
    result = await db.execute(select(StationModel).where(StationModel.id == station_id))
    station = result.scalar_one_or_none()

    if not station:
        raise HTTPException(status_code=404, detail=f"Зупинку {station_id} не знайдено")

    await db.delete(station)
    await db.commit()

    await invalidate_cache("stations:*")

    await ws_manager.broadcast({
        "type": "STATION_UPDATE",
        "payload": {
            "action": "DELETE",
            "station_id": station_id
        }
    })

    return {"status": "success", "message": f"Зупинку {station_id} успішно видалено"}

@router.post("/{station_id}/status")
async def update_station_status(
    station_id: str,
    payload: StationStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(StationModel).where(StationModel.id == station_id))
    station = result.scalars().first()
    
    if not station:
        station = StationModel(id=station_id, name=f"Станція {station_id}", type="HUB", status=payload.status)
        db.add(station)
    else:
        station.status = payload.status
        
    await db.commit()
    await db.refresh(station)
    await invalidate_cache("stations:*")
    
    await ws_manager.broadcast({
        "type": "STATION_UPDATE",
        "payload": {
            "station_id": station.id,
            "status": station.status
        }
    })
    
    return {"status": "success", "station_id": station.id, "new_status": station.status}
