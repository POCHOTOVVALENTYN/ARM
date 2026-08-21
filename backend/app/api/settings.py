from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any
from pydantic import BaseModel
import json

from app.core.database import AsyncSessionLocal
from app.api.dependencies import get_db, get_current_dispatcher, get_current_active_superuser
from app.models.models import DepotModel, HubNodeModel, RouteDepotConfigModel, BreakLocationConfigModel, SystemConfig, Dispatcher
from app.core.redis import get_cache, set_cache, invalidate_cache
from app.schemas.settings import (
    DepotCreate, HubNodeCreate, RouteDepotConfigCreate, BreakLocationConfigCreate,
    SystemConfigResponse, SystemConfigUpdate
)

router = APIRouter(prefix="/settings", tags=["Settings & Fleet Config"])

class TechNormsResponse(BaseModel):
    tram_prep_min: int = 10
    trolleybus_prep_min: int = 19
    min_headway_min: int = 2

@router.get("/norms", response_model=TechNormsResponse)
async def get_tech_norms():
    """
    Отримання нормативів підготовчо-заключного часу (ПЗЧ) та міжрейсових інтервалів КП «ОМЕТ».
    (10 хв - Трамвай, 19 хв - Тролейбус, 2-3 хв - Мінімальний інтервал на суміщених ділянках)
    """
    return TechNormsResponse(
        tram_prep_min=10,
        trolleybus_prep_min=19,
        min_headway_min=2
    )

# --- SYSTEM CONFIG (SINGLE-ROW TABLE PATTERN + RBAC) ---
@router.get("", response_model=SystemConfigResponse)
@router.get("/", response_model=SystemConfigResponse)
@router.get("/config", response_model=SystemConfigResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Отримання глобальних налаштувань підприємства (OSM тайли, логотип КП, тема).
    Доступно всім авторизованим диспетчерам.
    """
    result = await db.execute(select(SystemConfig).where(SystemConfig.id == 1))
    config = result.scalar_one_or_none()
    
    # Lazy initialization якщо запису ще немає
    if not config:
        config = SystemConfig(id=1)
        db.add(config)
        await db.commit()
        await db.refresh(config)
        
    return config

@router.put("", response_model=SystemConfigResponse)
@router.put("/", response_model=SystemConfigResponse)
@router.put("/config", response_model=SystemConfigResponse)
async def update_settings(
    settings_in: SystemConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_superuser)
):
    """
    Оновлення глобальних налаштувань підприємства.
    RBAC: Доступно виключно суперкористувачам (адміністраторам).
    """
    result = await db.execute(select(SystemConfig).where(SystemConfig.id == 1))
    config = result.scalar_one_or_none()
    
    if not config:
        config = SystemConfig(id=1)
        db.add(config)
    
    for field, val in settings_in.model_dump(exclude_unset=True).items():
        setattr(config, field, val)
        
    await db.commit()
    await db.refresh(config)
    return config

# --- DEPOTS (ДЕПО ТА ТРАНСПОРТНІ ПАРКИ) ---
@router.get("/depots", response_model=List[Dict[str, Any]])
async def get_depots(db: AsyncSession = Depends(get_db)):
    cached = await get_cache("settings:depots")
    if cached:
        return cached

    result = await db.execute(select(DepotModel))
    depots = result.scalars().all()
    data = [
        {
            "id": d.id, 
            "code": getattr(d, "code", d.id), 
            "name": d.name, 
            "type": d.type,
            "address": d.address, 
            "capacity": getattr(d, "capacity", 100),
            "prepTimeMin": getattr(d, "prepTimeMin", 15),
            "lat": d.lat, 
            "lng": d.lng
        }
        for d in depots
    ]
    await set_cache("settings:depots", data)
    return data

@router.post("/depots", response_model=Dict[str, Any])
async def create_depot(
    depot: DepotCreate, 
    db: AsyncSession = Depends(get_db),
    admin: Dispatcher = Depends(get_current_active_superuser)
):
    new_depot = DepotModel(**depot.model_dump())
    db.add(new_depot)
    await db.commit()
    await invalidate_cache("settings:depots")
    return depot.model_dump()

@router.delete("/depots/{depot_id}")
async def delete_depot(
    depot_id: str, 
    db: AsyncSession = Depends(get_db),
    admin: Dispatcher = Depends(get_current_active_superuser)
):
    result = await db.execute(select(DepotModel).where(DepotModel.id == depot_id))
    depot = result.scalar_one_or_none()
    if depot:
        await db.delete(depot)
        await db.commit()
        await invalidate_cache("settings:depots")
    return {"status": "ok"}

# --- HUB NODES (ТРАНСПОРТНІ ХАБИ ТА ВУЗЛИ) ---
@router.get("/hubs", response_model=List[Dict[str, Any]])
async def get_hubs(db: AsyncSession = Depends(get_db)):
    cached = await get_cache("settings:hubs")
    if cached:
        return cached

    result = await db.execute(select(HubNodeModel))
    hubs = result.scalars().all()
    data = [
        {
            "id": h.id, "name": h.name, "stationIds": json.loads(h.stationIdsJson or "[]"),
            "maxCapacity": h.maxCapacity, "isInterlineTransferAllowed": h.isInterlineTransferAllowed,
            "notes": h.notes
        }
        for h in hubs
    ]
    await set_cache("settings:hubs", data)
    return data

@router.post("/hubs", response_model=Dict[str, Any])
async def create_hub(
    hub: HubNodeCreate, 
    db: AsyncSession = Depends(get_db),
    admin: Dispatcher = Depends(get_current_active_superuser)
):
    data = hub.model_dump()
    station_ids = data.pop("stationIds", [])
    data["stationIdsJson"] = json.dumps(station_ids)
    
    new_hub = HubNodeModel(**data)
    db.add(new_hub)
    await db.commit()
    await invalidate_cache("settings:hubs")
    return hub.model_dump()

@router.delete("/hubs/{hub_id}")
async def delete_hub(
    hub_id: str, 
    db: AsyncSession = Depends(get_db),
    admin: Dispatcher = Depends(get_current_active_superuser)
):
    result = await db.execute(select(HubNodeModel).where(HubNodeModel.id == hub_id))
    hub = result.scalar_one_or_none()
    if hub:
        await db.delete(hub)
        await db.commit()
        await invalidate_cache("settings:hubs")
    return {"status": "ok"}

# --- ROUTE DEPOT CONFIGS (ЗВ'ЯЗОК МАРШРУТ-ДЕПО) ---
@router.get("/route-depots", response_model=List[Dict[str, Any]])
@router.get("/route-depot-configs", response_model=List[Dict[str, Any]])
async def get_route_depot_configs(db: AsyncSession = Depends(get_db)):
    cached = await get_cache("settings:route_depots")
    if cached:
        return cached

    result = await db.execute(select(RouteDepotConfigModel))
    configs = result.scalars().all()
    data = [
        {
            "id": c.id, "routeId": c.routeId, "depotId": c.depotId,
            "zeroTripDurationMin": c.zeroTripDurationMin, "zeroTripDistanceKm": c.zeroTripDistanceKm,
            "preferredFleetRatio": c.preferredFleetRatio
        }
        for c in configs
    ]
    await set_cache("settings:route_depots", data)
    return data

@router.post("/route-depots", response_model=Dict[str, Any])
@router.post("/route-depot-configs", response_model=Dict[str, Any])
async def create_route_depot_config(
    cfg: RouteDepotConfigCreate, 
    db: AsyncSession = Depends(get_db),
    admin: Dispatcher = Depends(get_current_active_superuser)
):
    new_cfg = RouteDepotConfigModel(**cfg.model_dump())
    db.add(new_cfg)
    await db.commit()
    await invalidate_cache("settings:route_depots")
    return cfg.model_dump()

@router.delete("/route-depots/{cfg_id}")
@router.delete("/route-depot-configs/{cfg_id}")
async def delete_route_depot_config(
    cfg_id: str, 
    db: AsyncSession = Depends(get_db),
    admin: Dispatcher = Depends(get_current_active_superuser)
):
    result = await db.execute(select(RouteDepotConfigModel).where(RouteDepotConfigModel.id == cfg_id))
    cfg = result.scalar_one_or_none()
    if cfg:
        await db.delete(cfg)
        await db.commit()
        await invalidate_cache("settings:route_depots")
    return {"status": "ok"}

# --- BREAK LOCATIONS (ПУНКТИ ХАРЧУВАННЯ ТА ОБІДУ) ---
@router.get("/break-locations", response_model=List[Dict[str, Any]])
async def get_break_locations(db: AsyncSession = Depends(get_db)):
    cached = await get_cache("settings:break_locations")
    if cached:
        return cached

    result = await db.execute(select(BreakLocationConfigModel))
    locations = result.scalars().all()
    data = [
        {
            "id": loc.id, "routeId": loc.routeId, "locationId": loc.locationId,
            "locationName": loc.locationName, "locationType": loc.locationType,
            "maxCapacityVehicles": loc.maxCapacityVehicles, "durationMin": loc.durationMin
        }
        for loc in locations
    ]
    await set_cache("settings:break_locations", data)
    return data

@router.post("/break-locations", response_model=Dict[str, Any])
async def create_break_location(
    loc: BreakLocationConfigCreate, 
    db: AsyncSession = Depends(get_db),
    admin: Dispatcher = Depends(get_current_active_superuser)
):
    new_loc = BreakLocationConfigModel(**loc.model_dump())
    db.add(new_loc)
    await db.commit()
    await invalidate_cache("settings:break_locations")
    return loc.model_dump()

@router.delete("/break-locations/{loc_id}")
async def delete_break_location(
    loc_id: str, 
    db: AsyncSession = Depends(get_db),
    admin: Dispatcher = Depends(get_current_active_superuser)
):
    result = await db.execute(select(BreakLocationConfigModel).where(BreakLocationConfigModel.id == loc_id))
    loc = result.scalar_one_or_none()
    if loc:
        await db.delete(loc)
        await db.commit()
        await invalidate_cache("settings:break_locations")
    return {"status": "ok"}

# --- GTFS DATA IMPORT & SYNC ---
@router.post("/gtfs/sync-local")
async def sync_gtfs_data(
    db: AsyncSession = Depends(get_db),
    admin: Dispatcher = Depends(get_current_dispatcher)
):
    """
    Імпорт та синхронізація реальних статичних даних GTFS (Одеса) у PostgreSQL.
    """
    try:
        from scripts.migrate_gtfs import parse_gtfs
        await parse_gtfs()
        await invalidate_cache("routes:all")
        await invalidate_cache("stations:all")
        return {
            "status": "success",
            "message": "Реальні дані GTFS (638 зупинок, 20 маршрутів) успішно синхронізовано з PostgreSQL!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка синхронізації GTFS: {str(e)}")
