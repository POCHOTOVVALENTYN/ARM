from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import math

from app.api.dependencies import get_db, get_current_dispatcher
from app.models.models import RouteModel, SystemConfig, DriverModel, Vehicle
from app.models.schedule import Schedule, ScheduleStatus, StaticDuty, StaticShift, StaticTrip, StaticStopTime, DutyType, TripDirection
from app.models.shift import DriverShiftModel, KPZCardModel
from app.services.transit_solver import transit_solver
from app.services.shift_solver import shift_solver_engine, parse_time_str, minutes_to_time
from app.services.interline_sync import interline_sync_engine
from app.core.transit_rules import (
    TRAM_PREP_MIN,
    TROLLEY_PREP_MIN,
    TRAM_STANDARD_LUNCH_MIN,
    TROLLEY_STANDARD_LUNCH_MIN,
    MIN_WORK_MINS_BEFORE_LUNCH,
    MAX_WORK_MINS_BEFORE_LUNCH,
)

router = APIRouter(prefix="/shifts", tags=["Shifts & KPZ Run Cutting"])

class RunCuttingRequest(BaseModel):
    route_id: str
    vehicles_count: Optional[int] = 14
    day_type: Optional[str] = "WORKDAY"

class InterlineSyncRequest(BaseModel):
    route_ids: List[str]
    min_headway_min: Optional[float] = 2.0

class DriverAssignmentRequest(BaseModel):
    shift_id: str
    schedule_id: Optional[str] = None
    route_id: str
    duty_number: int
    shift_index: int
    driver_name: str
    driver_tab_num: str
    vehicle_num: str
    second_vehicle_num: Optional[str] = None
    notes: Optional[str] = None

@router.get("/by-route/{route_id}")
async def get_shifts_by_route(
    route_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Отримання комплекту змін водіїв для заданого маршруту.
    БЕЗ фонової автогенерації: якщо активного розкладу немає в БД — повертає NO_ACTIVE_SCHEDULE.
    Якщо є — витягує збережені static_duties, static_shifts та static_trips.
    """
    # 1. Інформація про маршрут
    route_res = await db.execute(select(RouteModel).where(RouteModel.id == route_id))
    route = route_res.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=404, detail=f"Маршрут #{route_id} не знайдено")

    is_tram = (route.type or 'TRAM').upper() == 'TRAM'

    # Отримуємо нормативи ПЗЧ
    sys_res = await db.execute(select(SystemConfig).where(SystemConfig.id == 1))
    sys_config = sys_res.scalar_one_or_none()
    prep_tram = sys_config.prep_time_tram_min if sys_config else 10
    prep_trolley = sys_config.prep_time_trolleybus_min if sys_config else 19
    prep_time_norm = prep_tram if is_tram else prep_trolley
    std_lunch_min = 15 if is_tram else 20

    # 2. Перевірка наявності АКТИВНОГО розкладу в БД
    sched_res = await db.execute(
        select(Schedule)
        .where((Schedule.route_id == route_id) & (Schedule.status == ScheduleStatus.ACTIVE))
        .order_by(Schedule.id.desc())
    )
    active_sched = sched_res.scalars().first()

    if not active_sched:
        return {
            "status": "NO_ACTIVE_SCHEDULE",
            "route_id": route_id,
            "route_name": route.name,
            "prep_time_min": prep_time_norm,
            "total_shifts_count": 0,
            "shifts": [],
            "message": f"Для маршруту №{route.number or route_id} відсутній активний затверджений розклад. Складіть розклад у Конструкторі нарядів."
        }

    # 3. Завантаження збережених нарядів та змін для активного графіка
    duties_res = await db.execute(
        select(StaticDuty)
        .where(StaticDuty.schedule_id == active_sched.id)
        .options(
            selectinload(StaticDuty.shifts)
            .selectinload(StaticShift.trips)
            .selectinload(StaticTrip.stop_times)
        )
        .order_by(StaticDuty.duty_number.asc())
    )
    duties = duties_res.scalars().all()

    # Завантаження збережених призначень водіїв/вагонів (DriverShiftModel)
    saved_assignments_res = await db.execute(
        select(DriverShiftModel).where(DriverShiftModel.schedule_id == str(active_sched.id))
    )
    saved_assignments = {a.id: a for a in saved_assignments_res.scalars().all()}

    driver_shifts = []

    for d_idx, duty in enumerate(duties, start=1):
        try:
            duty_num = int(''.join(filter(str.isdigit, str(duty.duty_number))))
        except Exception:
            duty_num = d_idx

        duty_type_str = duty.duty_type.value if hasattr(duty.duty_type, 'value') else str(duty.duty_type)

        for shift in sorted(duty.shifts, key=lambda s: s.shift_sequence):
            shift_seq = shift.shift_sequence
            shift_id = f"SHIFT_{route_id}_{duty_num}_S{shift_seq}"

            # Перевіряємо, чи є збережені дані призначення
            saved = saved_assignments.get(shift_id)

            trips = sorted(shift.trips, key=lambda t: t.trip_sequence)
            if not trips:
                continue

            # Визначаємо початок та кінець зміни
            first_trip = trips[0]
            last_trip = trips[-1]

            first_st = first_trip.stop_times[0] if first_trip.stop_times else None
            last_st = last_trip.stop_times[-1] if last_trip.stop_times else None

            start_t_str = first_st.departure_time.strftime("%H:%M") if first_st and first_st.departure_time else "06:00"
            end_t_str = last_st.arrival_time.strftime("%H:%M") if last_st and last_st.arrival_time else "14:00"

            start_min = parse_time_str(start_t_str)
            end_min = parse_time_str(end_t_str)
            if end_min < start_min:
                end_min += 1440

            # ПЗЧ: 10 хв трамвай / 19 хв тролейбус для виїзду з депо (Зміна 1)
            is_pullout = shift_seq == 1 or any(t.is_zero_run or t.trip_type == 'PULL_OUT' for t in trips)
            prep_min = prep_time_norm if is_pullout else 0

            depot_arr_min = max(0, start_min - prep_min)
            depot_arr_str = minutes_to_time(depot_arr_min)

            # Обід
            lunch_dur = shift.break_duration_minutes or std_lunch_min
            lunch_excess = max(0, lunch_dur - std_lunch_min)
            lunch_start_min = start_min + min(270, (end_min - start_min) // 2)
            lunch_start_str = minutes_to_time(lunch_start_min)
            lunch_end_str = minutes_to_time(lunch_start_min + lunch_dur)

            # Тривалість роботи: від явки до здачі мінус неоплачувана норма обіду
            total_elapsed_min = end_min - depot_arr_min
            # За КЗпП: стандартний обід (15/20хв) не входить у робочий час, понаднормовий - оплачується
            work_min = total_elapsed_min - std_lunch_min
            work_hours = round(work_min / 60.0, 2)
            driving_hours = round(max(0, work_min - prep_min - lunch_excess) / 60.0, 2)

            # Нічні години (з 22:00 = 1320 хв)
            night_min = 0
            if end_min > 1320:
                night_min = end_min - max(1320, start_min)
            night_hours = round(max(0, night_min) / 60.0, 2)

            # Відповідність нормам КЗпП:
            # <= 8:00 (480 min) -> VALID (темно-зелений)
            # 8:01 - 9:59 (481 - 599 min) -> EXTENDED (світло-зелений, законне подовження)
            # >= 10:00 (600+ min) -> VIOLATION (червоний)
            if work_min > 599:
                compliance_status = "VIOLATION"
            elif work_min > 480:
                compliance_status = "EXTENDED"
            else:
                compliance_status = "VALID"

            # Назви та транспорт
            shift_name = f"Зміна {shift_seq} ({'Ранкова' if shift_seq == 1 else 'Вечірня'})"
            if duty_type_str == "SPLIT":
                shift_name = f"Розривна Зміна {shift_seq} ({'Вагон А -> ТО' if shift_seq == 1 else 'Вагон Б з Депо'})"

            v1_default = f"Вг-{4000 + duty_num}"
            v2_default = f"Вг-{4500 + duty_num} (ТО)" if duty_type_str == "SPLIT" else None

            driver_name = saved.driver_name if saved and saved.driver_name else f"Водій {duty_num}-{shift_seq}"
            driver_tab = saved.driver_tab_num if saved and saved.driver_tab_num else f"Т-{1000 + duty_num * 2 + (shift_seq - 1)}"
            veh_num = saved.vehicle_id if saved and saved.vehicle_id else v1_default
            sec_veh_num = saved.second_vehicle_id if saved and saved.second_vehicle_id else v2_default

            # Побудова хронології подій (timeline)
            timeline_events = []
            if prep_min > 0:
                timeline_events.append({"time": depot_arr_str, "event": f"Явка в депо, передрейсовий медогляд (3 хв) та огляд техніки ({prep_min} хв)"})
                timeline_events.append({"time": start_t_str, "event": "Нульовий виїзд на лінію до диспетчерського пункту"})

            for t_i, tr in enumerate(trips, start=1):
                t_dir = "Прямий напрямок" if tr.direction == TripDirection.FORWARD else ("Зворотний напрямок" if tr.direction == TripDirection.BACKWARD else "Нульовий рейс")
                t_st = tr.stop_times[0].departure_time.strftime("%H:%M") if tr.stop_times and tr.stop_times[0].departure_time else ""
                t_en = tr.stop_times[-1].arrival_time.strftime("%H:%M") if tr.stop_times and tr.stop_times[-1].arrival_time else ""
                if t_st and t_en:
                    timeline_events.append({"time": t_st, "event": f"Рейс #{t_i}: {t_dir} ({t_st} — {t_en})"})

            timeline_events.append({"time": lunch_start_str, "event": f"Обідня перерва на ДП ({lunch_dur} хв)"})
            timeline_events.append({"time": end_t_str, "event": "Завершення зміни / перезмінка на ДП" if shift_seq == 1 else "Заїзд у депо та здача вагона"})

            driver_shifts.append({
                "id": shift_id,
                "duty_number": duty_num,
                "duty_type": duty_type_str,
                "shift_index": shift_seq,
                "shift_name": shift_name,
                "driver_id": f"DRV_{route_id}_{duty_num}_{shift_seq}",
                "driver_name": driver_name,
                "driver_tab_num": driver_tab,
                "vehicle_num": veh_num,
                "second_vehicle_num": sec_veh_num,
                "prep_time_min": prep_min,
                "depot_arrival_time": depot_arr_str,
                "pullout_time": start_t_str,
                "start_time": depot_arr_str if prep_min > 0 else start_t_str,
                "end_time": end_t_str,
                "lunch_start_time": lunch_start_str,
                "lunch_end_time": lunch_end_str,
                "lunch_duration_min": lunch_dur,
                "paid_excess_break_min": lunch_excess,
                "lunch_location": route.designated_break_hub or "ДП «вул. Паустовського»",
                "work_hours": work_hours,
                "driving_hours": driving_hours,
                "night_hours": night_hours,
                "compliance_status": compliance_status,
                "notes": saved.notes if saved else None,
                "timeline_events": timeline_events
            })

    return {
        "status": "SUCCESS",
        "route_id": route_id,
        "route_name": route.name,
        "prep_time_min": prep_time_norm,
        "total_shifts_count": len(driver_shifts),
        "shifts": driver_shifts
    }

@router.post("/assign-driver")
async def assign_driver(
    req: DriverAssignmentRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Призначення водія (ПІБ, табельний номер) та закріплення бортового номера вагона
    для конкретної зміни водія зі збереженням у БД.
    """
    # Перевіряємо існування запису
    res = await db.execute(
        select(DriverShiftModel).where(DriverShiftModel.id == req.shift_id)
    )
    existing = res.scalar_one_or_none()

    if existing:
        existing.driver_name = req.driver_name
        existing.driver_tab_num = req.driver_tab_num
        existing.vehicle_id = req.vehicle_num
        existing.second_vehicle_id = req.second_vehicle_num
        existing.notes = req.notes
    else:
        new_assignment = DriverShiftModel(
            id=req.shift_id,
            schedule_id=req.schedule_id,
            route_id=req.route_id,
            duty_number=req.duty_number,
            shift_index=req.shift_index,
            driver_name=req.driver_name,
            driver_tab_num=req.driver_tab_num,
            vehicle_id=req.vehicle_num,
            second_vehicle_id=req.second_vehicle_num,
            start_time="06:00",
            end_time="14:00",
            notes=req.notes
        )
        db.add(new_assignment)

    await db.commit()
    return {
        "status": "SUCCESS",
        "message": "Призначення водія та вагона успішно збережено в БД",
        "shift_id": req.shift_id
    }

@router.get("/{shift_id}/kpz-card")
async def get_kpz_card(
    shift_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Генерація друкованої картки КПЗ (Картка Зміни Водія КП «Одесміськелектротранс»).
    Завантажує актуальні дані з БД.
    """
    parts = shift_id.split('_')
    route_id = parts[1] if len(parts) > 1 else "7"
    duty_num = int(parts[2]) if len(parts) > 2 else 1
    shift_idx = int(parts[3].replace('S', '').replace('SPLIT', '')) if len(parts) > 3 else 1

    # Завантажуємо маршрут
    route_res = await db.execute(select(RouteModel).where(RouteModel.id == route_id))
    route = route_res.scalar_one_or_none()
    route_name = route.name if route else "вул. Паустовського — вул. Пастера"
    is_tram = (route.type if route else 'TRAM').upper() == 'TRAM'

    prep_time = 10 if is_tram else 19

    # Отримуємо збережені призначення водія, якщо є
    saved_res = await db.execute(select(DriverShiftModel).where(DriverShiftModel.id == shift_id))
    saved = saved_res.scalar_one_or_none()

    driver_name = saved.driver_name if saved and saved.driver_name else f"Водій ОМЕТ #{duty_num}-{shift_idx}"
    driver_tab = saved.driver_tab_num if saved and saved.driver_tab_num else f"Т-{1000 + duty_num * 2 + (shift_idx - 1)}"
    vehicle_num = saved.vehicle_id if saved and saved.vehicle_id else f"Вг-{4000 + duty_num}"
    sec_vehicle_num = saved.second_vehicle_id if saved and saved.second_vehicle_id else None

    # Шукаємо активний розклад
    sched_res = await db.execute(
        select(Schedule)
        .where((Schedule.route_id == route_id) & (Schedule.status == ScheduleStatus.ACTIVE))
        .order_by(Schedule.id.desc())
    )
    active_sched = sched_res.scalars().first()

    timeline_events = [
        {"time": "05:10" if shift_idx == 1 else "13:30", "event": "Явка в депо, отримання дорожнього листа (путівки)" if shift_idx == 1 else "Явка на диспетчерський пункт для прийому зміни"},
        {"time": "05:15" if shift_idx == 1 else "13:32", "event": "Передрейсовий медичний огляд (вимірювання тиску, алкоконтроль)" if shift_idx == 1 else "Прийом вагона на зупинці примикання/ДП"},
        {"time": "05:20" if shift_idx == 1 else "13:35", "event": f"Огляд рухомого складу ({prep_time} хв, ходова, гальма, струмоприймач) та нульовий виїзд" if shift_idx == 1 else "Вихід у рейс за розкладом"},
        {"time": "09:30" if shift_idx == 1 else "18:00", "event": f"Обідня перерва на ДП ({15 if is_tram else 20} хв)"},
        {"time": "13:30" if shift_idx == 1 else "22:45", "event": "Здача вагона водію ІІ зміни на ДП" if shift_idx == 1 else "Нульовий заїзд у депо, післярейсовий огляд та здача путівки"}
    ]

    return {
        "kpz_id": f"KPZ-{shift_id}",
        "date": "2026-09-12",
        "route_number": route.number if route and route.number else route_id,
        "route_name": route_name,
        "duty_number": duty_num,
        "shift_name": f"Зміна {shift_idx} ({'Ранкова' if shift_idx == 1 else 'Вечірня'})",
        "driver_name": driver_name,
        "driver_tab_num": driver_tab,
        "vehicle_num": vehicle_num,
        "second_vehicle_num": sec_vehicle_num,
        "depot_name": "Трамвайне депо №1" if is_tram else "Тролейбусне депо №1",
        "depot_arrival_time": "05:10" if shift_idx == 1 else "13:30",
        "prep_time_min": prep_time if shift_idx == 1 else 0,
        "med_check_time": "05:15" if shift_idx == 1 else "13:32",
        "pullout_time": "05:20" if shift_idx == 1 else "13:35",
        "pullin_time": "13:30" if shift_idx == 1 else "22:45",
        "lunch_location": route.designated_break_hub if route and route.designated_break_hub else "ДП «вул. Паустовського»",
        "lunch_start_time": "09:30" if shift_idx == 1 else "18:00",
        "lunch_duration_min": 15 if is_tram else 20,
        "paid_excess_break_min": 0,
        "total_work_hours": 8.0,
        "driving_hours": 7.75,
        "night_hours": 0.75 if shift_idx == 2 else 0.0,
        "timeline_events": timeline_events
    }

@router.post("/generate-run-cutting")
async def generate_run_cutting(
    req: RunCuttingRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Прямий виклик за маршрутом. Повертає збережені зміни або NO_ACTIVE_SCHEDULE.
    """
    return await get_shifts_by_route(req.route_id, db, current_user)

@router.get("/interline/corridors-status")
async def get_interline_corridors_status(
    min_headway_min: float = 2.0,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Отримання статусу готовності всіх 10 магістральних коридорів Одеси:
    перевіряє, які маршрути мають активні наряди в БД, а які потребують переходу в Конструктор нарядів.
    """
    return await interline_sync_engine.get_corridors_status(db, min_headway_min)

@router.get("/interline/check-pair")
async def check_interline_pair(
    route_a: str,
    route_b: str,
    min_headway_min: float = 2.0,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Перевірка суміщеного руху обраної пари маршрутів:
    - Якщо хоча б один маршрут не має розкладу — видає попередження та пропонує перейти у Вкладку 1.
    - Якщо обидва активні — видає похвилинну стрічку перетину на вузлі та лічильник скупчень (< min_headway_min).
    """
    return await interline_sync_engine.check_route_pair(db, route_a, route_b, min_headway_min)

@router.post("/interline/apply-sync")
async def apply_interline_sync(
    req: InterlineSyncRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """
    Застосування алгоритму фазових мікро-зсувів для пари або групи маршрутів зв'язки.
    Забезпечує мінімальний інтервал 2.0-3.0 хв та зберігає зміни у static_trips і static_stop_times.
    """
    return await interline_sync_engine.apply_sync_pair(
        db=db,
        route_ids=req.route_ids,
        min_headway_min=req.min_headway_min or 2.0
    )

@router.post("/sync-interline")
async def sync_interline(
    req: InterlineSyncRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_dispatcher)
):
    """Зворотна сумісність для швидкого виклику синхронізації"""
    return await interline_sync_engine.apply_sync_pair(
        db=db,
        route_ids=req.route_ids or ["5", "28"],
        min_headway_min=req.min_headway_min or 2.0
    )

@router.get("/templates", summary="Отримання шаблонів змін водіїв")
async def get_shift_templates():
    return [
        {"id": "tmpl_double_1", "name": "Двозмінний: Зміна 1 (Ранкова 05:00 - 13:30)", "hours": 8.0, "type": "DOUBLE"},
        {"id": "tmpl_double_2", "name": "Двозмінний: Зміна 2 (Вечірня 13:30 - 22:30)", "hours": 8.0, "type": "DOUBLE"},
        {"id": "tmpl_split_1", "name": "Розривний: Зміна 1 (05:20 - 14:00 ТО депо)", "hours": 8.0, "type": "SPLIT"},
        {"id": "tmpl_split_2", "name": "Розривний: Зміна 2 (14:00 - 23:00 підхоплення)", "hours": 8.0, "type": "SPLIT"},
        {"id": "tmpl_single", "name": "Однозмінний (06:00 - 14:30)", "hours": 8.0, "type": "SINGLE"},
    ]

@router.get("/kpz-norms", summary="Отримання нормативів КПЗ КП ОМЕТ")
async def get_kpz_norms():
    """Єдине джерело істини — transit_rules.py (ідентично transitRules.ts на фронтенді)."""
    return {
        "prep_tram_min": TRAM_PREP_MIN,
        "prep_trolley_min": TROLLEY_PREP_MIN,
        "lunch_tram_min": TRAM_STANDARD_LUNCH_MIN,
        "lunch_trolley_min": TROLLEY_STANDARD_LUNCH_MIN,
        "lunch_window_hours": f"{MIN_WORK_MINS_BEFORE_LUNCH / 60:.1f}–{MAX_WORK_MINS_BEFORE_LUNCH / 60:.1f} годин від явки водія (до прибуття на ДП)",
        "max_shift_hours": 9.98,
        "max_shift_minutes": 599
    }
