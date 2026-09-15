import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, delete

from app.api.dependencies import get_db, get_current_dispatcher
from app.models.models import StationModel, RouteStation, RouteModel
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

class AddSharedStopRoutePayload(BaseModel):
    stop_id: str
    route_id: str
    direction_id: int = 0
    stop_sequence: Optional[int] = None

class UpdateSharedStopPayload(BaseModel):
    name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    type: Optional[str] = None
    is_dispatch_station: Optional[bool] = None
    break_capacity: Optional[int] = None
    routes: Optional[List[str]] = None

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

ODESSA_CORRIDOR_RULES = [
    {"id": "corridor_peresyp", "name": "Пересипський магістральний коридор", "type": "TRAM", "routes": ["1", "6", "7"]},
    {"id": "corridor_fontan", "name": "Коридор Великого Фонтану", "type": "TRAM", "routes": ["17", "18"]},
    {"id": "corridor_lustdorf", "name": "Люстдорфський магістральний коридор", "type": "TRAM", "routes": ["7", "13", "26", "27"]},
    {"id": "corridor_slobidka", "name": "Слобідський трамвайний коридор", "type": "TRAM", "routes": ["12", "15"]},
    {"id": "corridor_privoz_vokzal", "name": "Привокзально-Преображенський коридор", "type": "TRAM", "routes": ["5", "28"]},
    {"id": "corridor_moldavanka", "name": "Молдаваньско-Тираспольський коридор", "type": "TRAM", "routes": ["7", "10", "11", "15"]},
    {"id": "corridor_shevchenko", "name": "Фонтансько-Шевченківський тролейбусний коридор", "type": "TROLLEYBUS", "routes": ["Tr7", "Tr9", "Tr10"]},
    {"id": "corridor_tairova", "name": "Таїровський тролейбусний коридор", "type": "TROLLEYBUS", "routes": ["Tr7", "Tr12"]},
    {"id": "corridor_preobrazhenska_trolley", "name": "Преображенсько-Мечниковський коридор", "type": "TROLLEYBUS", "routes": ["Tr3", "Tr8"]},
    {"id": "corridor_center_trolley", "name": "Новосельського — Соборна площа", "type": "TROLLEYBUS", "routes": ["Tr2", "Tr7"]}
]

def find_matching_corridor(route_ids: List[str]) -> Optional[Dict[str, str]]:
    route_set = set(route_ids)
    best_corridor = None
    max_match = 1
    for c in ODESSA_CORRIDOR_RULES:
        c_set = set(c["routes"])
        intersection = route_set.intersection(c_set)
        if len(intersection) > max_match:
            max_match = len(intersection)
            best_corridor = {"id": c["id"], "name": c["name"]}
    return best_corridor

@router.get("/shared-stops", summary="Отримання списку спільних зупинок")
async def get_shared_stops(
    search: Optional[str] = Query(None, description="Пошук за назвою чи ID"),
    transport_type: Optional[str] = Query(None, description="TRAM, TROLLEYBUS або ALL"),
    route_id: Optional[str] = Query(None, description="Фільтр за ID маршруту"),
    corridor_id: Optional[str] = Query(None, description="Фільтр за коридором"),
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Повертає список зупинок, через які проходять 2 або більше маршрутів."""
    # Отримуємо всі зв'язки станцій з маршрутами
    query = (
        select(
            StationModel.id,
            StationModel.name,
            StationModel.lat,
            StationModel.lon,
            StationModel.lng,
            StationModel.type,
            StationModel.is_dispatch_station,
            StationModel.break_capacity,
            RouteStation.route_id,
            RouteStation.direction_id,
            RouteStation.stop_sequence,
            RouteModel.name.label("route_name"),
            RouteModel.number.label("route_number"),
            RouteModel.type.label("route_type")
        )
        .join(RouteStation, StationModel.id == RouteStation.stop_id)
        .outerjoin(RouteModel, RouteStation.route_id == RouteModel.id)
    )

    result = await db.execute(query)
    rows = result.all()

    # Групуємо за stop_id
    stops_map: Dict[str, Dict[str, Any]] = {}
    for r in rows:
        s_id = r[0]
        if s_id not in stops_map:
            stops_map[s_id] = {
                "id": s_id,
                "name": r[1] or f"Зупинка {s_id}",
                "lat": r[2] or 46.468,
                "lng": r[4] or r[3] or 30.741,
                "type": r[5] or "STOP",
                "is_dispatch_station": bool(r[6]),
                "break_capacity": r[7] or 0,
                "routes_map": {}
            }
        r_id = r[8]
        if r_id and r_id not in stops_map[s_id]["routes_map"]:
            r_num = r[12] if r[12] else (r_id.replace("Tr", "") if r_id.startswith("Tr") else r_id)
            r_type = (r[13] or ("TROLLEYBUS" if r_id.startswith("Tr") else "TRAM")).upper()
            stops_map[s_id]["routes_map"][r_id] = {
                "route_id": r_id,
                "route_number": str(r_num),
                "route_name": r[11] or f"Маршрут №{r_num}",
                "transport_type": r_type,
                "direction_id": r[9],
                "stop_sequence": r[10]
            }

    # Фільтруємо лише спільні (де 2 або більше маршрутів)
    shared_stops: List[Dict[str, Any]] = []
    for s_id, item in stops_map.items():
        routes_list = list(item["routes_map"].values())
        if len(routes_list) < 2 and not route_id:
            continue

        r_ids = [r["route_id"] for r in routes_list]
        t_types = sorted(list(set(r["transport_type"] for r in routes_list)))
        corridor = find_matching_corridor(r_ids)

        # Фільтри
        if search:
            st = search.strip().lower()
            if st not in item["name"].lower() and st not in s_id.lower() and not any(st in r["route_number"].lower() for r in routes_list):
                continue

        if transport_type and transport_type.upper() != "ALL":
            tt = transport_type.upper()
            if tt not in t_types:
                continue

        if route_id:
            if route_id not in r_ids and route_id.replace("Tr", "") not in [r["route_number"] for r in routes_list]:
                continue

        if corridor_id:
            if not corridor or corridor["id"] != corridor_id:
                continue

        shared_stops.append({
            "id": item["id"],
            "name": item["name"],
            "lat": item["lat"],
            "lng": item["lng"],
            "type": item["type"],
            "is_dispatch_station": item["is_dispatch_station"],
            "break_capacity": item["break_capacity"],
            "route_count": len(routes_list),
            "routes": routes_list,
            "transport_types": t_types,
            "is_multimodal": len(t_types) > 1,
            "corridor": corridor
        })

    # Сортування: найбільша кількість спільних маршрутів спочатку, потім за назвою
    shared_stops.sort(key=lambda x: (-x["route_count"], x["name"]))
    return shared_stops

from app.models.models import StopPassingRouteModel

@router.get("/stops-with-routes", summary="Каталог зупинок із прикріпленими маршрутами (з таблиці stop_passing_routes)")
async def get_stops_with_routes(
    transport_type: Optional[str] = Query(None, description="TRAM або TROLLEYBUS"),
    is_shared_only: Optional[bool] = Query(False, description="Тільки спільні зупинки (>=2 маршрутів)"),
    db: AsyncSession = Depends(get_db)
):
    query = select(StopPassingRouteModel)
    if transport_type and transport_type.upper() != "ALL":
        query = query.where(StopPassingRouteModel.transport_type == transport_type.upper())
    if is_shared_only:
        query = query.where(StopPassingRouteModel.is_shared == True)
    query = query.order_by(StopPassingRouteModel.route_count.desc(), StopPassingRouteModel.stop_name)
    result = await db.execute(query)
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "stop_id": r.stop_id,
            "stop_name": r.stop_name,
            "transport_type": r.transport_type,
            "routes": r.routes_list or [],
            "route_count": r.route_count,
            "is_shared": r.is_shared,
            "is_dispatch_station": r.is_dispatch_station,
            "break_capacity": r.break_capacity,
            "lat": r.lat,
            "lng": r.lng
        }
        for r in rows
    ]

@router.post("/shared-stops", summary="Прив'язка маршруту до спільної зупинки")
async def add_shared_stop_route(
    payload: AddSharedStopRoutePayload,
    db: AsyncSession = Depends(get_db),
    dispatcher = Depends(get_current_dispatcher)
) -> Dict[str, Any]:
    """Додає маршрут до зупинки (створює запис RouteStation)."""
    # Перевіряємо існування зупинки
    st_res = await db.execute(select(StationModel).where(StationModel.id == payload.stop_id))
    st = st_res.scalar_one_or_none()
    if not st:
        raise HTTPException(status_code=404, detail=f"Зупинку {payload.stop_id} не знайдено")

    # Перевіряємо існування зв'язку
    link_res = await db.execute(
        select(RouteStation).where(
            RouteStation.stop_id == payload.stop_id,
            RouteStation.route_id == payload.route_id,
            RouteStation.direction_id == payload.direction_id
        )
    )
    if link_res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Маршрут {payload.route_id} вже закріплено за цією зупинкою")

    seq = payload.stop_sequence or 1
    new_link = RouteStation(
        route_id=payload.route_id,
        direction_id=payload.direction_id,
        stop_id=payload.stop_id,
        stop_sequence=seq
    )
    db.add(new_link)
    await db.commit()
    await invalidate_cache("stations:*")

    return {
        "status": "success",
        "message": f"Маршрут {payload.route_id} успішно прив'язано до зупинки «{st.name}»"
    }

@router.put("/shared-stops/{stop_id}", summary="Оновлення спільної зупинки та її маршрутів")
async def update_shared_stop(
    stop_id: str,
    payload: UpdateSharedStopPayload,
    db: AsyncSession = Depends(get_db),
    dispatcher = Depends(get_current_dispatcher)
) -> Dict[str, Any]:
    """Оновлює метадані зупинки та синхронізує перелік закріплених маршрутів."""
    st_res = await db.execute(select(StationModel).where(StationModel.id == stop_id))
    st = st_res.scalar_one_or_none()
    if not st:
        raise HTTPException(status_code=404, detail=f"Зупинку {stop_id} не знайдено")

    if payload.name is not None:
        st.name = payload.name.strip()
    if payload.lat is not None:
        st.lat = payload.lat
    if payload.lng is not None:
        st.lng = payload.lng
        st.lon = payload.lng
    if payload.type is not None:
        st.type = payload.type.upper()
    if payload.is_dispatch_station is not None:
        st.is_dispatch_station = payload.is_dispatch_station
    if payload.break_capacity is not None:
        st.break_capacity = payload.break_capacity

    # Якщо передано оновлений список маршрутів, синхронізуємо RouteStation
    if payload.routes is not None:
        target_routes = set(payload.routes)
        # Отримуємо поточні маршрути
        curr_res = await db.execute(select(RouteStation).where(RouteStation.stop_id == stop_id))
        curr_links = curr_res.scalars().all()
        curr_routes = set(l.route_id for l in curr_links)

        # Видаляємо зв'язки, яких більше немає
        to_remove = curr_routes - target_routes
        if to_remove:
            await db.execute(
                delete(RouteStation).where(
                    RouteStation.stop_id == stop_id,
                    RouteStation.route_id.in_(list(to_remove))
                )
            )

        # Додаємо нові зв'язки
        to_add = target_routes - curr_routes
        for new_r in to_add:
            db.add(RouteStation(
                route_id=new_r,
                direction_id=0,
                stop_id=stop_id,
                stop_sequence=1
            ))

    await db.commit()
    await invalidate_cache("stations:*")

    return {
        "status": "success",
        "message": f"Параметри та маршрути спільної зупинки «{st.name}» успішно синхронізовано"
    }

@router.delete("/shared-stops/{stop_id}/routes/{route_id}", summary="Видалення маршруту зі спільної зупинки")
async def delete_shared_stop_route(
    stop_id: str,
    route_id: str,
    db: AsyncSession = Depends(get_db),
    dispatcher = Depends(get_current_dispatcher)
) -> Dict[str, Any]:
    """Видаляє прив'язку маршруту до зупинки."""
    await db.execute(
        delete(RouteStation).where(
            RouteStation.stop_id == stop_id,
            RouteStation.route_id == route_id
        )
    )
    await db.commit()
    await invalidate_cache("stations:*")
    return {"status": "success", "message": f"Маршрут {route_id} відкріплено від зупинки {stop_id}"}

@router.delete("/shared-stops/{stop_id}", summary="Видалення всіх маршрутних прив'язок спільної зупинки")
async def delete_shared_stop(
    stop_id: str,
    db: AsyncSession = Depends(get_db),
    dispatcher = Depends(get_current_dispatcher)
) -> Dict[str, Any]:
    """Видаляє всі прив'язки маршрутів до цієї зупинки."""
    await db.execute(delete(RouteStation).where(RouteStation.stop_id == stop_id))
    await db.commit()
    await invalidate_cache("stations:*")
    return {"status": "success", "message": f"Всі зв'язки спільної зупинки {stop_id} видалено"}

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
    """Видаляє зупинку з бази даних та очищує прив'язані маршрути."""
    result = await db.execute(select(StationModel).where(StationModel.id == station_id))
    station = result.scalar_one_or_none()

    if not station:
        raise HTTPException(status_code=404, detail=f"Зупинку {station_id} не знайдено")

    # Clean up any RouteStation links referencing this stop
    await db.execute(delete(RouteStation).where(RouteStation.stop_id == station_id))

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
    
    return {"status": "success", "station_id": station.id, "new_status": station.status}


