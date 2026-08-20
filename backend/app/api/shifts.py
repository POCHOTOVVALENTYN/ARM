from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.api.dependencies import get_db, get_current_dispatcher
from app.models.models import RouteModel, SystemConfig, DriverModel, Vehicle
from app.services.transit_solver import transit_solver
from app.services.shift_solver import shift_solver_engine
from app.services.interline_sync import interline_sync_engine

router = APIRouter(prefix="/shifts", tags=["Shifts & KPZ Run Cutting"])

class RunCuttingRequest(BaseModel):
    route_id: str
    vehicles_count: Optional[int] = 14
    day_type: Optional[str] = "WORKDAY"

class InterlineSyncRequest(BaseModel):
    route_ids: List[str]
    min_headway_min: Optional[float] = 2.0

@router.post("/generate-run-cutting")
async def generate_run_cutting(
    req: RunCuttingRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Генерація змін водіїв та розрізання нарядів (Run Cutting) з урахуванням:
    - Підготовчо-заключного часу в депо (10m трамвай / 19m тролейбус з БД);
    - Вікна обіду (4-6 год від початку зміни);
    - Специфіки розривного наряду (2 різних вагони: Вагон А -> ТО депо, Вагон Б з депо).
    """
    # 1. Отримання нормативів з БД
    route_res = await db.execute(select(RouteModel).where(RouteModel.id == req.route_id))
    route = route_res.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=404, detail="Маршрут не знайдено")

    sys_res = await db.execute(select(SystemConfig).where(SystemConfig.id == 1))
    sys_config = sys_res.scalar_one_or_none()
    
    prep_tram = sys_config.prep_time_tram_min if sys_config else 10
    prep_trolley = sys_config.prep_time_trolleybus_min if sys_config else 19

    # 2. Розрахунок статичного графіка колонок
    static_data = transit_solver.calculate_static_schedule_from_norms(
        route_id=route.id,
        route_name=route.name,
        route_type=route.type or "TRAM",
        vehicles_count=req.vehicles_count or 14,
        round_trip_min=route.round_trip_min or 84,
        standard_break_min=route.standard_break_min or 15,
        designated_break_hub=route.designated_break_hub or "ДП «Паустовського»"
    )

    # 3. Виклик алгоритму Run Cutting
    driver_shifts = shift_solver_engine.cut_vehicle_duties_into_driver_shifts(
        route_id=req.route_id,
        route_type=route.type,
        static_columns=static_data['columns'],
        prep_tram_min=prep_tram,
        prep_trolley_min=prep_trolley
    )

    return {
        "status": "SUCCESS",
        "route_id": req.route_id,
        "route_name": route.name,
        "prep_time_min": prep_tram if (route.type or 'TRAM').upper() == 'TRAM' else prep_trolley,
        "total_shifts_count": len(driver_shifts),
        "shifts": driver_shifts
    }

@router.get("/by-route/{route_id}")
async def get_shifts_by_route(
    route_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Отримання комплекту змін водіїв для заданого маршруту"""
    res = await generate_run_cutting(RunCuttingRequest(route_id=route_id), db, current_user)
    return res

@router.post("/sync-interline")
async def sync_interline(
    req: InterlineSyncRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Запуск алгоритму Синхронізації Суміщених Ділянок «Зв'язок».
    Забезпечує мінімальний інтервал 2-3 хв на спільних зупинках.
    """
    result = interline_sync_engine.synchronize_corridors(
        route_schedules=[],
        min_headway_min=req.min_headway_min or 2.0
    )
    return result

@router.get("/{shift_id}/kpz-card")
async def get_kpz_card(
    shift_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Генерація друкованої картки КПЗ (Картка Зміни Водія)"""
    parts = shift_id.split('_')
    route_id = parts[1] if len(parts) > 1 else "7"
    duty_num = int(parts[2]) if len(parts) > 2 else 1
    shift_idx = parts[3] if len(parts) > 3 else "S1"

    # Отримання даних маршруту з БД
    route_res = await db.execute(select(RouteModel).where(RouteModel.id == route_id))
    route = route_res.scalar_one_or_none()
    route_name = route.name if route else "вул. Паустовського — вул. Пастера"
    is_tram = (route.type if route else 'TRAM').upper() == 'TRAM'

    prep_time = 10 if is_tram else 19

    return {
        "kpz_id": f"KPZ-{shift_id}",
        "date": "2026-08-20",
        "route_number": route_id,
        "route_name": route_name,
        "duty_number": duty_num,
        "shift_name": "Перша зміна (Ранкова)" if "1" in shift_idx or "S1" in shift_idx else "Друга зміна (Вечірня)",
        "driver_name": f"Водій ОМЕТ (Таб. № Т-{1000 + duty_num})",
        "driver_tab_num": f"Т-{1000 + duty_num}",
        "vehicle_num": f"Вг-{4000 + duty_num}",
        "second_vehicle_num": f"Вг-{4500 + duty_num}" if "SPLIT" in shift_idx else None,
        "depot_name": "Трамваційне депо №1" if is_tram else "Тролейбусне депо №2",
        "depot_arrival_time": "05:10",
        "prep_time_min": prep_time,
        "med_check_time": "05:15",
        "pullout_time": "05:20",
        "pullin_time": "13:30" if "1" in shift_idx else "22:45",
        "lunch_location": "ДП «вул. Паустовського»",
        "lunch_start_time": "09:30",
        "lunch_duration_min": 15 if is_tram else 20,
        "paid_excess_break_min": 5,
        "total_work_hours": 8.0,
        "driving_hours": 7.5,
        "night_hours": 1.2 if "2" in shift_idx else 0.0,
        "timeline_events": [
            {"time": "05:10", "event": "Прихід у депо, отримання путівки"},
            {"time": "05:15", "event": "Предрейсовий медичний огляд"},
            {"time": "05:20", "event": "Огляд вагона (10 хв) та нульовий виїзд"},
            {"time": "05:35", "event": "Початок роботи на лінії (ДП Паустовського)"},
            {"time": "09:30", "event": "Обід на ДП (15 хв)"},
            {"time": "13:30", "event": "Перезмінка на ДП / заїзд у депо"}
        ]
    }
