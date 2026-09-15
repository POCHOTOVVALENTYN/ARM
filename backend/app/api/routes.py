from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.services.transit_solver import transit_solver

router = APIRouter()

class DelayCascadeRequest(BaseModel):
    block_id: str
    start_time: int  # minutes from midnight
    delay_minutes: float
    schedule_data: List[Dict[str, Any]]
    ambient_temp_c: Optional[float] = 20.0

class DutyValidationRequest(BaseModel):
    duty_id: str
    transport_type: str = "tram"
    shift_start_min: int
    shift_end_min: int
    driving_min: int
    actual_lunch_min: int
    lunch_start_min: Optional[int] = None
    lunch_location_name: Optional[str] = None

class ElectrobusBatteryRequest(BaseModel):
    block_id: str
    route_length_km: float = 12.4
    idle_minutes_at_terminal: float = 15.0
    current_soc_pct: float = 95.0
    battery_capacity_kwh: float = 200.0
    ambient_temp_c: float = 20.0

@router.post("/apply-delay")
async def apply_delay(request: DelayCascadeRequest):
    """
    Каскадне застосування відтяжки/затримки до рейсів вагона.
    """
    try:
        updated_schedule, warnings = transit_solver.apply_delay_cascade(
            schedule_data=request.schedule_data,
            block_id=request.block_id,
            start_time_min=request.start_time,
            delay_min=request.delay_minutes,
            ambient_temp_c=request.ambient_temp_c or 20.0
        )
        return {
            "status": "SUCCESS",
            "updated_schedule": updated_schedule,
            "warnings": warnings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/validate-duty")
async def validate_duty(request: DutyValidationRequest):
    """
    Валідація зміни водія відповідно до норм КЗпП та стандарту обідів КП «ОМЕТ».
    """
    result = transit_solver.validate_driver_duty(
        duty_id=request.duty_id,
        transport_type=request.transport_type,
        shift_start_min=request.shift_start_min,
        shift_end_min=request.shift_end_min,
        driving_min=request.driving_min,
        actual_lunch_min=request.actual_lunch_min,
        lunch_start_min=request.lunch_start_min,
        lunch_location_name=request.lunch_location_name
    )
    return result

@router.post("/validate-electrobus")
async def validate_electrobus(request: ElectrobusBatteryRequest):
    """
    Валідація розряду батареї та часу зарядки електробуса.
    """
    result = transit_solver.calculate_electrobus_battery(
        block_id=request.block_id,
        route_length_km=request.route_length_km,
        idle_minutes_at_terminal=request.idle_minutes_at_terminal,
        current_soc_pct=request.current_soc_pct,
        battery_capacity_kwh=request.battery_capacity_kwh,
        ambient_temp_c=request.ambient_temp_c
    )
    return result

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from app.core.database import get_db
from app.models.models import RouteShape, RouteModel

@router.get("", summary="Отримання списку всіх маршрутів КП ОМЕТ")
@router.get("/", summary="Отримання списку всіх маршрутів КП ОМЕТ")
async def get_all_routes(db: AsyncSession = Depends(get_db)):
    """Повертає список доступних маршрутів трамваїв та тролейбусів."""
    query = select(RouteModel)
    result = await db.execute(query)
    routes = result.scalars().all()
    
    if not routes:
        # Резервний список якщо база ще порожня
        return [
            {"id": "18", "number": "18", "name": "Куликове поле — 16-а ст. В. Фонтану", "type": "TRAM", "length_km": 10.5, "default_speed_kmh": 14.5},
            {"id": "5", "number": "5", "name": "Автовокзал — Аркадія", "type": "TRAM", "length_km": 12.0, "default_speed_kmh": 14.0},
            {"id": "7", "number": "7", "name": "вул. Паустовського — вул. Пастера", "type": "TRAM", "length_km": 16.2, "default_speed_kmh": 15.0},
            {"id": "28", "number": "28", "name": "вул. Пастера — Парк ім. Т. Шевченка", "type": "TRAM", "length_km": 6.8, "default_speed_kmh": 13.5}
        ]
        
    return [
        {
            "id": r.id,
            "number": r.number,
            "name": r.name,
            "type": (r.type or "TRAM").lower(),
            "status": (r.status or "ACTIVE").lower(),
            "color": r.color or ("#2563eb" if (r.type or "").upper() == "TRAM" else "#059669"),
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
            "segments": r.segments or [],
            "stations": r.stations or [],
            "allStations": r.allStations or [],
            "description": r.description or f"Маршрут №{r.number} КП «ОМЕТ»"
        }
        for r in routes
    ]

@router.get("/shapes", summary="Отримання геометрій усіх маршрутів міста")
@router.get("/shapes/all", summary="Отримання геометрій усіх маршрутів міста в обох напрямках")
async def get_all_route_shapes(db: AsyncSession = Depends(get_db)):
    """Повертає геометрії всіх маршрутів трамваїв та тролейбусів для обох напрямків."""
    query = select(RouteShape)
    result = await db.execute(query)
    shapes = result.scalars().all()
    
    routes_res = await db.execute(select(RouteModel))
    routes_map = {r.id: r for r in routes_res.scalars().all()}
    
    return [
        {
            "route_id": s.route_id,
            "direction_id": s.direction_id,
            "geometry": s.geometry,
            "type": routes_map.get(s.route_id).type if routes_map.get(s.route_id) else "TRAM",
            "color": routes_map.get(s.route_id).color if (routes_map.get(s.route_id) and routes_map.get(s.route_id).color) else ("#2563eb" if (routes_map.get(s.route_id) and routes_map.get(s.route_id).type == "TRAM") else "#059669"),
            "route_number": routes_map.get(s.route_id).number if routes_map.get(s.route_id) else s.route_id
        }
        for s in shapes
    ]

@router.get("/{route_id}/shapes", summary="Отримання геометрій маршруту для обох напрямків")
async def get_route_both_shapes(
    route_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Повертає масиви геометрій для прямого (0) та зворотного (1) напрямків маршруту."""
    query = select(RouteShape).where(RouteShape.route_id == route_id).order_by(RouteShape.direction_id)
    result = await db.execute(query)
    shapes = result.scalars().all()
    
    return {
        "route_id": route_id,
        "directions": [
            {
                "direction_id": s.direction_id,
                "geometry": s.geometry
            }
            for s in shapes
        ]
    }

@router.get("/{route_id}/shape")
async def get_route_shape(
    route_id: str,
    direction_id: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Повертає геометрію маршруту (масив координат) для вказаного напрямку."""
    query = select(RouteShape).where(
        (RouteShape.route_id == route_id) & 
        (RouteShape.direction_id == direction_id)
    )
    result = await db.execute(query)
    shape = result.scalar_one_or_none()
    
    if not shape:
        # Спробуємо будь-який наявний напрямок
        fallback = await db.execute(select(RouteShape).where(RouteShape.route_id == route_id))
        shape = fallback.scalar_one_or_none()
        if not shape:
            raise HTTPException(status_code=404, detail="Геометрію маршруту не знайдено")
        
    return shape.geometry

@router.get("/{route_id}/stops", summary="Отримання послідовності зупинок маршруту")
async def get_route_stops(
    route_id: str,
    direction_id: Optional[int] = Query(None, description="0=Прямий, 1=Зворотний, None=Обидва напрямки"),
    db: AsyncSession = Depends(get_db)
):
    """
    Повертає точну впорядковану послідовність зупинок маршруту з бази даних PostgreSQL.
    """
    from app.models.models import RouteStation, StationModel
    
    query = (
        select(RouteStation, StationModel)
        .join(StationModel, RouteStation.stop_id == StationModel.id)
        .where(RouteStation.route_id == route_id)
    )
    
    if direction_id is not None:
        query = query.where(RouteStation.direction_id == direction_id)
        
    query = query.order_by(RouteStation.direction_id, RouteStation.stop_sequence)
    result = await db.execute(query)
    rows = result.all()

    stops = []
    for r_st, st in rows:
        stops.append({
            "stop_sequence": r_st.stop_sequence,
            "direction_id": r_st.direction_id,
            "stop_id": st.id,
            "name": st.name,
            "lat": st.lat,
            "lng": st.lng or st.lon,
            "type": st.type,
            "is_dispatch_station": bool(st.is_dispatch_station),
            "break_capacity": st.break_capacity or 0
        })

    return {
        "route_id": route_id,
        "direction_id": direction_id,
        "stops_count": len(stops),
        "stops": stops
    }

class RouteCreate(BaseModel):
    id: str
    number: str
    name: str
    type: str = "TRAM"
    length_km: float = 10.5
    default_speed_kmh: float = 14.5
    color: Optional[str] = None

class RouteUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    length_km: Optional[float] = None
    default_speed_kmh: Optional[float] = None
    color: Optional[str] = None
    status: Optional[str] = None

@router.post("", summary="Створення нового маршруту")
@router.post("/", summary="Створення нового маршруту")
async def create_route(payload: RouteCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(RouteModel).where(RouteModel.id == payload.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Маршрут з ID {payload.id} вже існує")

    new_route = RouteModel(
        id=payload.id,
        number=payload.number,
        name=payload.name,
        type=payload.type.upper(),
        length_km=payload.length_km,
        default_speed_kmh=payload.default_speed_kmh,
        color=payload.color or ("#2563eb" if payload.type.upper() == "TRAM" else "#059669"),
        status="ACTIVE"
    )
    db.add(new_route)
    await db.commit()
    await db.refresh(new_route)
    return {"status": "success", "route": payload.model_dump()}

@router.put("/{route_id}", summary="Оновлення маршруту")
async def update_route(route_id: str, payload: RouteUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RouteModel).where(RouteModel.id == route_id))
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=404, detail=f"Маршрут {route_id} не знайдено")

    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is not None:
            setattr(route, k, v)

    await db.commit()
    await db.refresh(route)
    return {"status": "success", "message": f"Маршрут {route_id} оновлено"}

from app.models.models import RouteSharedCorridorModel, StopPassingRouteModel, RouteStation, StationModel
from sqlalchemy import or_

@router.get("/{route_id}/shared-corridors", summary="Отримання точних суміщених ділянок маршруту зі спільними зупинками")
async def get_route_shared_corridors(route_id: str, db: AsyncSession = Depends(get_db)):
    clean_id = route_id.strip()
    query = (
        select(RouteSharedCorridorModel)
        .where(
            or_(
                RouteSharedCorridorModel.base_route_id == clean_id,
                RouteSharedCorridorModel.base_route_number == clean_id
            ),
            RouteSharedCorridorModel.is_active == True
        )
        .order_by(RouteSharedCorridorModel.shared_stops_count.desc())
    )
    result = await db.execute(query)
    corridors = result.scalars().all()
    return [
        {
            "id": c.id,
            "targetRouteId": c.target_route_id,
            "targetRouteNumber": c.target_route_number,
            "targetRouteName": c.target_route_name,
            "targetRouteColor": c.target_route_color,
            "transportType": (c.transport_type or "TRAM").lower(),
            "sharedStopsCount": c.shared_stops_count,
            "startStop": c.start_stop,
            "endStop": c.end_stop,
            "sharedStops": c.shared_stops or [],
            "sharedStopIds": c.shared_stop_ids or [],
            "minHeadwayMin": c.min_headway_min,
            "corridorName": c.corridor_name
        }
        for c in corridors
    ]

@router.get("/{route_id}/variants", summary="Отримання доступних варіантів/схем руху маршруту")
async def get_route_variants(route_id: str, db: AsyncSession = Depends(get_db)):
    clean_id = route_id.strip()
    result = await db.execute(select(RouteModel).where(or_(RouteModel.id == clean_id, RouteModel.number == clean_id)))
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=404, detail="Маршрут не знайдено")

    is_r27 = route.number == "27" or route.id == "27"
    is_r7 = (route.number == "7" or route.id == "7") and (route.type or "").upper() == "TRAM"

    if is_r27:
        presets = [
            {
                "variant_key": "OPERATIONAL_SHORT",
                "title": "Скорочена схема (через дефіцит е/е)",
                "terminals": "11-а ст. Люстдорфської дороги — Рибний порт",
                "stops_count": 15,
                "length_km": 14.7,
                "round_trip_min": 56,
                "default_speed_kmh": 16.0,
                "is_active": (route.active_variant or "OPERATIONAL_SHORT") == "OPERATIONAL_SHORT"
            },
            {
                "variant_key": "BASE",
                "title": "Повна базова схема (паспортна)",
                "terminals": "пл. Старосінна — Рибний порт",
                "stops_count": 45,
                "length_km": 38.8,
                "round_trip_min": 140,
                "default_speed_kmh": 17.5,
                "is_active": route.active_variant == "BASE"
            }
        ]
    elif is_r7:
        presets = [
            {
                "variant_key": "BASE",
                "title": "Повна магістральна схема «Північ-Південь»",
                "terminals": "вул. Паустовського — 11-а ст. Люстдорфської дороги",
                "stops_count": 62,
                "length_km": 65.0,
                "round_trip_min": 220,
                "default_speed_kmh": 19.5,
                "is_active": (route.active_variant or "BASE") == "BASE"
            },
            {
                "variant_key": "OPERATIONAL_SHORT",
                "title": "Скорочена схема Північного куща",
                "terminals": "вул. Паустовського — Лузанівка",
                "stops_count": 28,
                "length_km": 28.0,
                "round_trip_min": 95,
                "default_speed_kmh": 20.0,
                "is_active": route.active_variant == "OPERATIONAL_SHORT"
            }
        ]
    else:
        presets = [
            {
                "variant_key": "BASE",
                "title": f"Повна базова схема: {route.name}",
                "terminals": route.name or "",
                "stops_count": 30,
                "length_km": route.length_km or 12.0,
                "round_trip_min": route.round_trip_min or 80,
                "default_speed_kmh": route.default_speed_kmh or 15.0,
                "is_active": True
            }
        ]

    return {
        "route_id": route.id,
        "route_number": route.number,
        "name": route.name,
        "active_variant": route.active_variant or "OPERATIONAL_SHORT",
        "variant_notes": route.variant_notes,
        "presets": presets
    }

class SwitchVariantRequest(BaseModel):
    variant_key: str # "BASE" | "OPERATIONAL_SHORT" | "DETOUR"

@router.post("/{route_id}/switch-variant", summary="Перемикання схеми курсування маршруту (базова / скорочена)")
async def switch_route_variant(route_id: str, payload: SwitchVariantRequest, db: AsyncSession = Depends(get_db)):
    clean_id = route_id.strip()
    result = await db.execute(select(RouteModel).where(or_(RouteModel.id == clean_id, RouteModel.number == clean_id)))
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=404, detail="Маршрут не знайдено")

    variant = payload.variant_key.upper()
    if route.number == "27" or route.id == "27":
        if variant == "BASE":
            route.name = "пл. Старосінна — Рибний порт"
            route.length_km = 38.8
            route.lengthDir1Km = 19.4
            route.lengthDir2Km = 19.4
            route.round_trip_min = 140
            route.default_speed_kmh = 17.5
            route.active_variant = "BASE"
            route.variant_notes = "Повна базова схема: пл. Старосінна — Рибний порт (45 зупинок)"
        else:
            route.name = "11-а ст. Люстдорфської дороги — Рибний порт"
            route.length_km = 14.7
            route.lengthDir1Km = 7.4
            route.lengthDir2Km = 7.3
            route.round_trip_min = 56
            route.default_speed_kmh = 16.0
            route.active_variant = "OPERATIONAL_SHORT"
            route.variant_notes = "Скорочена оперативна схема (через дефіцит е/е): 11-а ст. — Рибний порт (15 зупинок)"
    else:
        route.active_variant = variant

    await db.commit()

    # Запуск перерахунку мережі
    try:
        from scripts.sync_network_topology import run_sync
        run_sync()
    except Exception as err:
        pass

    return {
        "status": "success",
        "route_id": route.id,
        "active_variant": route.active_variant,
        "name": route.name,
        "length_km": route.length_km,
        "round_trip_min": route.round_trip_min
    }

@router.post("/recalculate-all-corridors", summary="Повний перерахунок спільних зупинок та суміщених коридорів мережі")
async def recalculate_all_corridors():
    try:
        from scripts.sync_network_topology import run_sync
        run_sync()
        return {"status": "success", "message": "Топологію та суміщені ділянки успішно синхронізовано"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

