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
            "type": r.type,
            "color": r.color or ("#2563eb" if r.type == "TRAM" else "#059669"),
            "length_km": r.length_km or 10.5,
            "default_speed_kmh": r.default_speed_kmh or 14.5
        }
        for r in routes
    ]

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
