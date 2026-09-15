# backend/app/services/transit_solver.py
import copy
import math
from datetime import datetime, timedelta, time as dt_time
from typing import List, Dict, Any, Tuple, Optional
from app.core.logging_config import get_logger
from app.core.transit_rules import (
    MIN_WORK_MINS_BEFORE_LUNCH,
    MAX_WORK_MINS_BEFORE_LUNCH,
    MAX_LUNCH_DURATION_MIN,
    TRAM_STANDARD_LUNCH_MIN,
    standard_lunch_min,
    prep_time_min,
)

logger = get_logger("transit_solver")

def parse_time_str(t_str: str) -> dt_time:
    parts = t_str.strip().split(":")
    h = int(parts[0])
    m = int(parts[1])
    s = int(parts[2]) if len(parts) > 2 else 0
    return dt_time(hour=h, minute=m, second=s)

def time_to_minutes(t: dt_time) -> float:
    return float(t.hour * 60 + t.minute + t.second / 60.0)

def minutes_to_time(minutes_float: float) -> dt_time:
    total_seconds = int((minutes_float % 1440) * 60)
    hours = (total_seconds // 3600) % 24
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    return dt_time(hour=hours, minute=minutes, second=seconds)

def format_minutes_to_hhmm(mins: float) -> str:
    norm = int(mins) % 1440
    h = norm // 60
    m = norm % 60
    return f"{h:02d}:{m:02d}"

def format_duration_hours_mins(mins: float) -> str:
    total_m = int(mins)
    h = total_m // 60
    m = total_m % 60
    return f"{h} год {m:02d} хв"

# Топологічна матриця нульових рейсів депо Одеси
ODESSA_DEPOT_ZERO_RUN_MATRIX: Dict[str, Dict[str, Dict[str, Dict[str, Any]]]] = {
    "TRAM": {
        "5": {
            "ТД-2": {"zero_min": 29, "zero_km": 6.4, "junction": "Музкомедія"},
            "ТД-1": {"zero_min": 22, "zero_km": 4.8, "junction": "Музкомедія"}
        },
        "7": {
            "ТД-2": {"zero_min": 32, "zero_km": 7.8, "junction": "Пересипський міст"},
            "ТД-1": {"zero_min": 45, "zero_km": 11.2, "junction": "Пересипський міст"}
        },
        "17": {
            "ТД-1": {"zero_min": 18, "zero_km": 3.8, "junction": "Куликове поле"},
            "ТД-2": {"zero_min": 35, "zero_km": 8.2, "junction": "Куликове поле"}
        },
        "18": {
            "ТД-1": {"zero_min": 20, "zero_km": 4.2, "junction": "Куликове поле"},
            "ТД-2": {"zero_min": 38, "zero_km": 9.0, "junction": "Куликове поле"}
        },
        "28": {
            "ТД-2": {"zero_min": 24, "zero_km": 5.1, "junction": "Тираспольська площа"},
            "ТД-1": {"zero_min": 25, "zero_km": 5.4, "junction": "пл. Старосінна"}
        }
    },
    "TROLLEYBUS": {
        "Tr7": {
            "ТРД-1": {"zero_min": 25, "zero_km": 6.2, "junction": "Залізничний вокзал"}
        },
        "7": {
            "ТРД-1": {"zero_min": 25, "zero_km": 6.2, "junction": "Залізничний вокзал"}
        },
        "8": {
            "ТРД-1": {"zero_min": 18, "zero_km": 4.5, "junction": "Залізничний вокзал"}
        },
        "9": {
            "ТРД-1": {"zero_min": 20, "zero_km": 5.0, "junction": "вул. Рішельєвська"}
        },
        "10": {
            "ТРД-1": {"zero_min": 22, "zero_km": 5.6, "junction": "Пересипський міст"}
        }
    }
}

def get_depot_zero_run_info(route_id: str, transport_type: str, depot_name: str) -> Tuple[int, float, str]:
    t_key = "TROLLEYBUS" if transport_type.upper() in ["TROLLEYBUS", "TROLLEY", "ТРОЛЕЙБУС"] else "TRAM"
    route_matrix = ODESSA_DEPOT_ZERO_RUN_MATRIX.get(t_key, {}).get(route_id, {})
    if depot_name in route_matrix:
        d = route_matrix[depot_name]
        return d["zero_min"], d["zero_km"], d["junction"]
    
    if t_key == "TROLLEYBUS":
        return 20, 5.0, "Залізничний вокзал"
    return (25, 5.5, "Музкомедія") if depot_name == "ТД-1" else (30, 6.5, "Пересипський міст")

from app.services.deadhead_optimizer import get_deadhead_between

DEPOT_CODE_TO_ID: Dict[str, str] = {
    "ТД-1": "depot_1", "TD-1": "depot_1", "depot_1": "depot_1",
    "ТД-2": "depot_2", "TD-2": "depot_2", "depot_2": "depot_2",
    "ТРД-1": "depot_3", "ТрД-1": "depot_3", "ТрД-3": "depot_3", "TrD": "depot_3", "depot_3": "depot_3"
}

def _resolve_duty_param(
    duty_dict: Optional[Dict[str, Any]],
    v_idx: int,
    duty_num: str,
    route_id: str,
    default_val: Any = None
) -> Any:
    """
    Універсальний пошук параметрів наряду за всіма можливими варіантами ключів:
    '1', '5-01', '01', '5-1', '#1'
    """
    if not duty_dict:
        return default_val
    candidates = [
        str(v_idx + 1),
        duty_num,
        f"{v_idx + 1:02d}",
        f"{route_id}-{v_idx + 1}",
        f"#{v_idx + 1}"
    ]
    for c in candidates:
        if c in duty_dict and duty_dict[c] is not None and str(duty_dict[c]).strip() != "":
            return duty_dict[c]
    return default_val

def generate_omet_master_schedule(
    route_id: str,
    route_name: str = "Станція «Аркадія» — Автовокзал",
    transport_type: str = "TRAM",
    duties_count: int = 14,
    round_trip_min: int = 85,
    route_length_km: float = 17.9,
    default_speed_kmh: float = 12.3,
    start_time: str = "05:00",
    end_time: str = "23:45",
    designated_dp_name: str = "Станція «Аркадія»",
    control_points: Optional[List[Dict[str, Any]]] = None,
    depot_name: str = "ТД-2",
    depot_zero_run_min: Optional[int] = None,
    depot_zero_run_km: Optional[float] = None,
    depot_junction_stop_name: Optional[str] = None,
    start_stations_per_duty: Optional[Dict[str, str]] = None,
    duty_types_per_duty: Optional[Dict[str, str]] = None,
    depots_per_duty: Optional[Dict[str, str]] = None,
    vehicles_per_duty: Optional[Dict[str, str]] = None,
    vehicles2_per_duty: Optional[Dict[str, str]] = None,
    rotation_junctions_per_duty: Optional[Dict[str, str]] = None,
    duty_configs: Optional[List[Dict[str, Any]]] = None,
    secondary_dp_name: Optional[str] = None,
    schedule_period: str = "з 22 вересня по 11 жовтня 2026 року",
    schedule_type: str = "Будній"
) -> Dict[str, Any]:
    """
    Головне математичне ядро планування розкладів КП «Одесміськелектротранс».
    1. Розрахунок інтервалу на основі ручної кількості нарядів N: I = T_об / N.
    2. Генерація повної шахової таблиці всіх рейсів (без обмеження 14 кругів) за кінцевими А і Б.
    3. Розрахунок часу прибуття на всі Контрольні Точки (КТ) для Маршрутної книжки.
    4. Автоматичний динамічний розрахунок обідів водіїв з урахуванням інтервалів на лінії.
       (Базовий: 15 хв трамвай / 20 хв тролейбус; весь додатковий час обов'язково додається до робочої зміни водія).
    5. Справжні розривні наряди (ротація 2-х фізичних вагонів на найближчій зупинці до депо).
    6. Повний розрахунок добових показників (Вагоно-години, Вагоно-км, Швидкість, Зміни, Рейси).
    """
    logger.info(f"📐 Генерація еталонного розкладу КП ОМЕТ для маршруту #{route_id} ({route_name}): {duties_count} нарядів, T_об={round_trip_min}хв")
    
    # 1. Нормативи виду транспорту
    is_trolley = transport_type.upper() in ["TROLLEYBUS", "TROLLEY", "ТРОЛЕЙБУС"]
    prep_time_min_val = prep_time_min(is_trolley)
    standard_break_min = standard_lunch_min(is_trolley)
    
    # Отримуємо точні параметри нульового рейсу з топологічної матриці
    m_min, m_km, m_junc = get_depot_zero_run_info(route_id, transport_type, depot_name)
    actual_zero_min = depot_zero_run_min or m_min
    actual_zero_km = depot_zero_run_km or m_km
    actual_junction_stop = depot_junction_stop_name or m_junc

    # 2. Розрахунок результуючого інтервалу руху I = T_об / N
    duties_count = max(1, duties_count)
    exact_headway = round_trip_min / duties_count
    headway_min = round(exact_headway, 1)
    
    # Динамічний розрахунок тривалості обіду водія:
    # Базовий мінімум 15/20 хв. Якщо інтервал більший або графік потребує кратності, призначається розширений обід.
    # Будь-який понаднормовий час (extra_break) додається до тривалості зміни водія!
    lunch_shift_duration = standard_break_min
    if headway_min > 0:
        slots = max(1, round(standard_break_min / headway_min))
        calc_lunch = round(slots * headway_min)
        if calc_lunch >= standard_break_min:
            lunch_shift_duration = min(MAX_LUNCH_DURATION_MIN, calc_lunch)
    overtime_lunch_min = max(0, lunch_shift_duration - standard_break_min)
    is_paid_lunch_overtime = overtime_lunch_min > 0

    # Розрахунок часу в один бік (туди/назад) та відстоїв
    one_way_time = max(15, int((round_trip_min - 12) / 2))
    base_layover = max(5, min(10, int((round_trip_min - (one_way_time * 2)) / 2)))
    
    # 3. Дефолтні Контрольні Точки (якщо не передано)
    if not control_points or len(control_points) < 2:
        if route_id == "5":
            control_points = [
                {"id": "cp_5_1", "name": "Станція «Аркадія»", "is_dp": True, "is_break": True, "offset_fwd": 0, "offset_bwd": one_way_time},
                {"id": "cp_5_2", "name": "Театр Музкомедії", "is_dp": False, "is_break": False, "is_junction": True, "offset_fwd": int(one_way_time * 0.42), "offset_bwd": int(one_way_time * 0.58)},
                {"id": "cp_5_3", "name": "пл. Старосінна (Вокзал)", "is_dp": False, "is_break": False, "offset_fwd": int(one_way_time * 0.60), "offset_bwd": int(one_way_time * 0.40)},
                {"id": "cp_5_4", "name": "пл. Тираспільська", "is_dp": False, "is_break": False, "offset_fwd": int(one_way_time * 0.78), "offset_bwd": int(one_way_time * 0.22)},
                {"id": "cp_5_5", "name": "Автовокзал", "is_dp": False, "is_break": False, "is_terminus": True, "offset_fwd": one_way_time, "offset_bwd": 0},
            ]
        elif route_id == "7":
            control_points = [
                {"id": "cp_7_1", "name": "ДП «вул. Паустовського»", "is_dp": True, "is_break": True, "offset_fwd": 0, "offset_bwd": one_way_time},
                {"id": "cp_7_2", "name": "вул. Заболотного", "is_dp": False, "is_break": False, "offset_fwd": int(one_way_time * 0.15), "offset_bwd": int(one_way_time * 0.85)},
                {"id": "cp_7_3", "name": "Лузанівка", "is_dp": False, "is_break": False, "offset_fwd": int(one_way_time * 0.40), "offset_bwd": int(one_way_time * 0.60)},
                {"id": "cp_7_4", "name": "Пересипський міст", "is_dp": False, "is_break": False, "is_junction": True, "offset_fwd": int(one_way_time * 0.75), "offset_bwd": int(one_way_time * 0.25)},
                {"id": "cp_7_5", "name": "пл. Тираспільська", "is_dp": False, "is_break": False, "is_terminus": True, "offset_fwd": one_way_time, "offset_bwd": 0},
            ]
        else:
            control_points = [
                {"id": f"cp_{route_id}_1", "name": designated_dp_name, "is_dp": True, "is_break": True, "offset_fwd": 0, "offset_bwd": one_way_time},
                {"id": f"cp_{route_id}_2", "name": actual_junction_stop, "is_dp": False, "is_break": False, "is_junction": True, "offset_fwd": int(one_way_time * 0.5), "offset_bwd": int(one_way_time * 0.5)},
                {"id": f"cp_{route_id}_3", "name": "Кінцева станція Б", "is_dp": False, "is_break": False, "is_terminus": True, "offset_fwd": one_way_time, "offset_bwd": 0},
            ]

    # Станції А і Б
    station_a_name = control_points[0]["name"]
    station_b_name = control_points[-1]["name"]

    start_mins_global = int(start_time.split(":")[0]) * 60 + int(start_time.split(":")[1])
    end_mins_global = int(end_time.split(":")[0]) * 60 + int(end_time.split(":")[1])
    if end_mins_global < start_mins_global:
        end_mins_global += 1440

    master_grid_rows = []
    duty_books = {}
    total_wagon_working_mins = 0.0
    total_revenue_trips = 0
    total_zero_runs = 0
    total_shifts_count = 0

    max_rounds_count = 24

    for v_idx in range(duties_count):
        duty_num = f"{route_id}-{v_idx + 1:02d}"
        
        # 1. Визначаємо тип наряду (ручний конфіг або дефолтний)
        assigned_type = _resolve_duty_param(duty_types_per_duty, v_idx, duty_num, route_id)
        if assigned_type:
            duty_type = assigned_type
        elif v_idx == 3 or v_idx == 7:
            duty_type = "SPLIT" # Розривний наряд
        elif v_idx == 11:
            duty_type = "PEAK" # Піковий
        elif v_idx == 13:
            duty_type = "SINGLE" # Однозмінний
        else:
            duty_type = "DOUBLE" # Двозмінний

        # 2. Початкова станція виходу
        assigned_station = _resolve_duty_param(start_stations_per_duty, v_idx, duty_num, route_id)
        if assigned_station:
            start_station = assigned_station
        else:
            start_station = station_b_name if (v_idx % 4 == 2) else station_a_name

        # 3. Депо приписки наряду (Мультидепо)
        assigned_depot = _resolve_duty_param(depots_per_duty, v_idx, duty_num, route_id, default_val=depot_name)
        duty_depot = assigned_depot or depot_name
        duty_depot_id = DEPOT_CODE_TO_ID.get(duty_depot, "depot_1" if transport_type == "TRAM" else "depot_3")

        # Точний розрахунок нульового рейсу на основі географічних координат та топології
        dh_info = get_deadhead_between(duty_depot_id, start_station, transport_type)
        duty_zero_min = int(dh_info.get("duration_min", actual_zero_min))
        duty_zero_km = float(dh_info.get("distance_km", actual_zero_km))
        duty_junction_stop = str(dh_info.get("junction_stop", actual_junction_stop))

        # Якщо вагон виїжджає через протилежну кінцеву Б до ДП:
        # t_нуль = t(Депо -> Кінцева Б) + t_відст_B + t(Кінцева Б -> ДП)
        zero_run_tag = f"Виїзд з депо {duty_depot} на лінію ({duty_zero_km:.1f} км, {duty_zero_min} хв, посадка від зуп. примикання: {duty_junction_stop})"
        if start_station != station_a_name and start_station == station_b_name:
            duty_zero_min = duty_zero_min + base_layover + one_way_time
            duty_zero_km = round(duty_zero_km + (route_length_km / 2.0), 1)
            zero_run_tag = f"Виїзд з депо {duty_depot} через {station_b_name} до ДП ({duty_zero_km:.1f} км, {duty_zero_min} хв, посадка від зуп. примикання: {duty_junction_stop})"

        # Час першого графікового відправлення
        first_dep_mins = start_mins_global + int(v_idx * headway_min)
        
        # Нульовий виїзд
        dp_arrival_mins = first_dep_mins
        pullout_mins = dp_arrival_mins - duty_zero_min
        driver_arrival_mins = pullout_mins - prep_time_min_val
        total_zero_runs += 1

        # Вагони для наряду
        assigned_veh1 = _resolve_duty_param(vehicles_per_duty, v_idx, duty_num, route_id)
        assigned_veh2 = _resolve_duty_param(vehicles2_per_duty, v_idx, duty_num, route_id)
        # ПРИМІТКА: rotation_junctions_per_duty приймається лише для зворотної
        # сумісності API і НЕ впливає на місце ротації вагонів — ротація
        # SPLIT-нарядів завжди прив'язана до прибуття на ДП (station_a_name),
        # ніколи до проміжного вузла примикання лінії.

        car_id_1 = assigned_veh1 or (f"Вг-{4000 + (v_idx * 7) % 80:04d}" if transport_type == "TRAM" else f"Тр-{3000 + (v_idx * 5) % 60:04d}")
        car_id_2 = (assigned_veh2 or (f"Вг-{4100 + (v_idx * 9) % 80:04d}" if transport_type == "TRAM" else f"Тр-{3100 + (v_idx * 5) % 60:04d}")) if duty_type == "SPLIT" else None

        # Генерація кругів
        rounds = []
        duty_book_trips = []
        curr_time_mins = first_dep_mins
        trip_seq = 1

        # 0-й рейс: Нульовий виїзд з депо
        duty_book_trips.append({
            "trip_number": 0,
            "round_number": 0,
            "direction": "PULL_OUT",
            "direction_label": f"{duty_depot} → {start_station}",
            "departure_time": format_minutes_to_hhmm(pullout_mins),
            "arrival_time": format_minutes_to_hhmm(dp_arrival_mins),
            "layover_min": 5,
            "vehicle_id": car_id_1,
            "event_tag": zero_run_tag,
            "control_point_times": [
                {"cp_id": "depot", "cp_name": duty_depot, "arrival_time": format_minutes_to_hhmm(pullout_mins), "is_dp": False},
                {"cp_id": "junction", "cp_name": duty_junction_stop, "arrival_time": format_minutes_to_hhmm(pullout_mins + int(duty_zero_min * 0.4)), "is_dp": False},
                {"cp_id": "target", "cp_name": start_station, "arrival_time": format_minutes_to_hhmm(dp_arrival_mins), "is_dp": True}
            ]
        })

        # Таймінги змін та балансування закінчення роботи вагона
        shift1_start_mins = driver_arrival_mins
        shift1_end_mins = None
        shift1_lunch_mins = None
        shift2_lunch_mins = None
        shift1_extra_min = 0
        shift2_extra_min = 0

        # Розрахунок планового часу заїзду вагона (поетапний заїзд)
        if duty_type == "SINGLE":
            duty_closing_mins = shift1_start_mins + int(7.8 * 60)
        elif duty_type == "PEAK":
            duty_closing_mins = shift1_start_mins + int(5.0 * 60)
        else:
            echelon_progress = v_idx / max(1, duties_count - 1)
            target_wagon_hours = 15.2 + (echelon_progress * 1.8)
            duty_closing_mins = min(1395, shift1_start_mins + int(target_wagon_hours * 60))

        # Збалансована перезмінка на ДП: точка поділу змін для двозмінки
        total_working_window = duty_closing_mins - shift1_start_mins
        shift_handoff_target = shift1_start_mins + int(total_working_window / 2)

        had_shift1_lunch = False
        had_shift2_lunch = False
        had_rotation_or_handoff = False

        pullin_mins = None

        for r_idx in range(1, max_rounds_count + 1):
            if curr_time_mins > duty_closing_mins:
                break

            round_num = r_idx
            round_tag = None
            round_note = ""

            # --- Рейс 1 у крузі: станція А -> станція Б ---
            dep_a_mins = curr_time_mins
            arr_b_mins = dep_a_mins + one_way_time
            total_revenue_trips += 1

            # Контрольні точки рейсу вперед
            cp_times_fwd = []
            for cp in control_points:
                offset = cp.get("offset_fwd", 0)
                cp_times_fwd.append({
                    "cp_id": cp["id"],
                    "cp_name": cp["name"],
                    "arrival_time": format_minutes_to_hhmm(dep_a_mins + offset),
                    "is_dp": cp.get("is_dp", False),
                    "is_break": cp.get("is_break", False)
                })

            duty_book_trips.append({
                "trip_number": trip_seq,
                "round_number": round_num,
                "direction": "FORWARD",
                "direction_label": f"{station_a_name} → {station_b_name}",
                "departure_time": format_minutes_to_hhmm(dep_a_mins),
                "arrival_time": format_minutes_to_hhmm(arr_b_mins),
                "layover_min": base_layover,
                "vehicle_id": car_id_2 if (duty_type == "SPLIT" and had_rotation_or_handoff) else car_id_1,
                "event_tag": "Графіковий рейс",
                "control_point_times": cp_times_fwd
            })
            trip_seq += 1

            # Відстій на кінцевій Б
            dep_b_mins = arr_b_mins + base_layover
            arr_a_mins = dep_b_mins + one_way_time
            total_revenue_trips += 1

            # Контрольні точки рейсу назад
            cp_times_bwd = []
            for cp in reversed(control_points):
                offset = cp.get("offset_bwd", 0)
                cp_times_bwd.append({
                    "cp_id": cp["id"],
                    "cp_name": cp["name"],
                    "arrival_time": format_minutes_to_hhmm(dep_b_mins + (one_way_time - offset)),
                    "is_dp": cp.get("is_dp", False),
                    "is_break": cp.get("is_break", False)
                })

            # Перевірка обіду І зміни.
            # ІНВАРІАНТ: обід надається ВИКЛЮЧНО в момент прибуття вагона на
            # Диспетчерський пункт (arr_a_mins == прибуття на ст. А), у вікні
            # [MIN_WORK_MINS_BEFORE_LUNCH; MAX_WORK_MINS_BEFORE_LUNCH] від явки водія.
            layover_at_dp = base_layover
            lunch_break_obj = None
            mins_worked_shift1 = arr_a_mins - shift1_start_mins

            if not had_shift1_lunch and mins_worked_shift1 >= MIN_WORK_MINS_BEFORE_LUNCH:
                if mins_worked_shift1 > MAX_WORK_MINS_BEFORE_LUNCH:
                    logger.warning(
                        f"⚠️ Наряд {duty_num}: обід І зміни надано на ДП через {mins_worked_shift1:.0f} хв "
                        f"(понад дозволені {MAX_WORK_MINS_BEFORE_LUNCH} хв) — інтервал обороту зависокий для дотримання вікна обіду."
                    )
                layover_at_dp = lunch_shift_duration
                shift1_lunch_mins = arr_a_mins
                had_shift1_lunch = True
                round_tag = "LUNCH"
                lunch_break_obj = {
                    "start": format_minutes_to_hhmm(arr_a_mins),
                    "end": format_minutes_to_hhmm(arr_a_mins + lunch_shift_duration),
                    "duration_min": lunch_shift_duration,
                    "standard_min": standard_break_min,
                    "is_overtime": overtime_lunch_min > 0,
                    "overtime_min": overtime_lunch_min,
                    "is_paid_break": is_paid_lunch_overtime,
                    "location": station_a_name,
                }
                note_lunch = f"ОБІД І зміни {lunch_shift_duration}хв"
                if overtime_lunch_min > 0:
                    note_lunch += f" (+{overtime_lunch_min}хв до зміни)"
                round_note = f"{note_lunch} ({format_minutes_to_hhmm(arr_a_mins)} - {format_minutes_to_hhmm(arr_a_mins + lunch_shift_duration)})"
                shift1_extra_min += overtime_lunch_min

            # Перевірка перезмінки або ротації розривного наряду (збалансована точка).
            # ІНВАРІАНТ: перезмінка водіїв і ротація вагонів (SPLIT) відбуваються
            # ВИКЛЮЧНО на Диспетчерському пункті (ст. А) — arr_a_mins — ніколи на
            # проміжному вузлі примикання лінії чи в депо.
            elif not had_rotation_or_handoff and (duty_type in ["DOUBLE", "SPLIT"]) and (arr_a_mins >= shift_handoff_target):
                had_rotation_or_handoff = True
                shift1_end_mins = arr_a_mins
                if duty_type == "SPLIT":
                    round_tag = "ROTATION"
                    round_note = f"РОТАЦІЯ ВАГОНІВ на ДП ({station_a_name}): Вагон {car_id_1} в депо, Вагон {car_id_2} на лінію"
                else:
                    round_tag = "SHIFT_CHANGE"
                    round_note = f"ПЕРЕЗМІНКА ВОДІЇВ на ДП ({format_minutes_to_hhmm(arr_a_mins)})"

            # Перевірка обіду ІІ зміни (для двозмінного або розривного)
            elif had_rotation_or_handoff and not had_shift2_lunch and shift1_end_mins and ((arr_a_mins - shift1_end_mins) >= MIN_WORK_MINS_BEFORE_LUNCH):
                mins_worked_shift2 = arr_a_mins - shift1_end_mins
                if mins_worked_shift2 > MAX_WORK_MINS_BEFORE_LUNCH:
                    logger.warning(
                        f"⚠️ Наряд {duty_num}: обід ІІ зміни надано на ДП через {mins_worked_shift2:.0f} хв "
                        f"(понад дозволені {MAX_WORK_MINS_BEFORE_LUNCH} хв) — інтервал обороту зависокий для дотримання вікна обіду."
                    )
                layover_at_dp = lunch_shift_duration
                shift2_lunch_mins = arr_a_mins
                had_shift2_lunch = True
                round_tag = "LUNCH"
                lunch_break_obj = {
                    "start": format_minutes_to_hhmm(arr_a_mins),
                    "end": format_minutes_to_hhmm(arr_a_mins + lunch_shift_duration),
                    "duration_min": lunch_shift_duration,
                    "standard_min": standard_break_min,
                    "is_overtime": overtime_lunch_min > 0,
                    "overtime_min": overtime_lunch_min,
                    "is_paid_break": is_paid_lunch_overtime,
                    "location": station_a_name,
                }
                note_lunch = f"ОБІД ІІ зміни {lunch_shift_duration}хв"
                if overtime_lunch_min > 0:
                    note_lunch += f" (+{overtime_lunch_min}хв до зміни)"
                round_note = f"{note_lunch} ({format_minutes_to_hhmm(arr_a_mins)} - {format_minutes_to_hhmm(arr_a_mins + lunch_shift_duration)})"
                shift2_extra_min += overtime_lunch_min

            duty_book_trips.append({
                "trip_number": trip_seq,
                "round_number": round_num,
                "direction": "BACKWARD",
                "direction_label": f"{station_b_name} → {station_a_name}",
                "departure_time": format_minutes_to_hhmm(dep_b_mins),
                "arrival_time": format_minutes_to_hhmm(arr_a_mins),
                "layover_min": layover_at_dp,
                "vehicle_id": car_id_2 if (duty_type == "SPLIT" and had_rotation_or_handoff) else car_id_1,
                "event_tag": round_note if round_note else "Графіковий рейс",
                "control_point_times": cp_times_bwd
            })
            trip_seq += 1

            # Додаємо круг до матриці
            rounds.append({
                "round_number": round_num,
                "departure_station_a": format_minutes_to_hhmm(dep_a_mins),
                "departure_station_b": format_minutes_to_hhmm(dep_b_mins),
                "arrival_station_a": format_minutes_to_hhmm(arr_a_mins),
                "layover_station_a_min": layover_at_dp,
                "tag": round_tag,
                "note": round_note,
                "lunch_break": lunch_break_obj
            })

            curr_time_mins = arr_a_mins + layover_at_dp

            # Якщо це однозмінний або піковий наряд — завершення після 1-ї зміни
            if duty_type in ["SINGLE", "PEAK"] and (curr_time_mins - shift1_start_mins) >= (8 * 60):
                break

        # Захід у депо
        pullin_dep_mins = curr_time_mins
        pullin_mins = pullin_dep_mins + duty_zero_min
        total_zero_runs += 1

        if not shift1_end_mins:
            shift1_end_mins = pullin_mins if duty_type in ["SINGLE", "PEAK"] else (shift1_start_mins + int((pullin_mins - shift1_start_mins) / 2))
        
        if duty_type in ["DOUBLE", "SPLIT"]:
            shift2_end_mins = pullin_mins
            raw_s1 = (shift1_end_mins - shift1_start_mins + shift1_extra_min)
            raw_s2 = (shift2_end_mins - shift1_end_mins + shift2_extra_min)
            # Захист КЗпП: максимум 9:59 (599 хв)
            shift1_hours = min(599, max(0, raw_s1)) / 60.0
            shift2_hours = min(599, max(0, raw_s2)) / 60.0
            total_shifts_count += 2
        else:
            raw_s1 = (pullin_mins - shift1_start_mins + shift1_extra_min)
            shift1_hours = min(599, max(0, raw_s1)) / 60.0
            shift2_hours = 0.0
            total_shifts_count += 1


        total_work_hours = (pullin_mins - pullout_mins) / 60.0
        total_wagon_working_mins += (pullin_mins - pullout_mins)

        # 0-й рейс: Заїзд у депо
        duty_book_trips.append({
            "trip_number": trip_seq,
            "round_number": len(rounds) + 1,
            "direction": "PULL_IN",
            "direction_label": f"{station_a_name} → {duty_depot}",
            "departure_time": format_minutes_to_hhmm(pullin_dep_mins),
            "arrival_time": format_minutes_to_hhmm(pullin_mins),
            "layover_min": 0,
            "vehicle_id": car_id_2 if duty_type == "SPLIT" else car_id_1,
            "event_tag": f"Заїзд у депо {duty_depot} ({duty_zero_km:.1f} км, {duty_zero_min} хв)",
            "control_point_times": [
                {"cp_id": "origin", "cp_name": station_a_name, "arrival_time": format_minutes_to_hhmm(pullin_dep_mins), "is_dp": True},
                {"cp_id": "junction", "cp_name": duty_junction_stop, "arrival_time": format_minutes_to_hhmm(pullin_dep_mins + int(duty_zero_min * 0.6)), "is_dp": False},
                {"cp_id": "depot", "cp_name": duty_depot, "arrival_time": format_minutes_to_hhmm(pullin_mins), "is_dp": False}
            ]
        })

        # Додаємо рядок до матриці
        master_grid_rows.append({
            "duty_number": duty_num,
            "duty_type": duty_type,
            "start_location": start_station,
            "vehicle_id": car_id_1,
            "vehicle_id_2": car_id_2,
            "depot_name": duty_depot,
            "zero_run_min": duty_zero_min,
            "zero_run_km": duty_zero_km,
            "junction_stop": duty_junction_stop,
            "rotation_location": station_a_name if duty_type == "SPLIT" else None,
            "driver_arrival_time": format_minutes_to_hhmm(driver_arrival_mins),
            "pullout_time": format_minutes_to_hhmm(pullout_mins),
            "dp_arrival_time": format_minutes_to_hhmm(dp_arrival_mins),
            "first_departure_time": format_minutes_to_hhmm(first_dep_mins),
            "pullin_time": format_minutes_to_hhmm(pullin_mins),
            "total_work_hours_str": format_duration_hours_mins(total_work_hours * 60),
            "shift1_hours_str": format_duration_hours_mins(shift1_hours * 60),
            "shift2_hours_str": format_duration_hours_mins(shift2_hours * 60) if shift2_hours > 0 else "—",
            "rounds": rounds
        })

        # Формуємо Маршрутну книжку для наряду
        duty_books[duty_num] = {
            "duty_number": duty_num,
            "route_id": route_id,
            "route_name": route_name,
            "transport_type": transport_type,
            "depot_name": duty_depot,
            "zero_run_min": duty_zero_min,
            "zero_run_km": duty_zero_km,
            "junction_stop": duty_junction_stop,
            "rotation_location": station_a_name if duty_type == "SPLIT" else None,
            "schedule_period": schedule_period,
            "schedule_type": schedule_type,
            "vehicle_id": car_id_1,
            "vehicle_id_2": car_id_2,
            "duty_type": duty_type,
            "driver1": {
                "name": f"Водій І зміни ({duty_num})",
                "arrival_time": format_minutes_to_hhmm(driver_arrival_mins),
                "pullout_time": format_minutes_to_hhmm(pullout_mins),
                "start_time": format_minutes_to_hhmm(first_dep_mins),
                "lunch_time": f"{format_minutes_to_hhmm(shift1_lunch_mins)} — {format_minutes_to_hhmm(shift1_lunch_mins + standard_break_min)}" if shift1_lunch_mins else "—",
                "shift_end_time": format_minutes_to_hhmm(shift1_end_mins)
            },
            "driver2": {
                "name": f"Водій ІІ зміни ({duty_num})" if duty_type in ["DOUBLE", "SPLIT"] else "—",
                "start_time": format_minutes_to_hhmm(shift1_end_mins) if duty_type in ["DOUBLE", "SPLIT"] else "—",
                "lunch_time": f"{format_minutes_to_hhmm(shift2_lunch_mins)} — {format_minutes_to_hhmm(shift2_lunch_mins + standard_break_min)}" if shift2_lunch_mins else "—",
                "pullin_time": format_minutes_to_hhmm(pullin_mins) if duty_type in ["DOUBLE", "SPLIT"] else "—",
                "shift_end_time": format_minutes_to_hhmm(shift2_end_mins) if duty_type in ["DOUBLE", "SPLIT"] else "—"
            },
            "trips": duty_book_trips
        }

    # 4. Паспортні зведені показники маршруту на добу
    total_wagon_hours = round(total_wagon_working_mins / 60.0, 1)
    depot_km = depot_zero_run_km if depot_zero_run_km is not None else 6.4
    total_wagon_km = round((total_revenue_trips * (route_length_km / 2.0)) + (total_zero_runs * depot_km), 1)

    summary_passport = {
        "route_id": route_id,
        "route_name": route_name,
        "transport_type": transport_type,
        "designated_dp_name": designated_dp_name,
        "total_wagon_hours": total_wagon_hours,
        "total_wagon_km": total_wagon_km,
        "total_shifts": total_shifts_count,
        "total_trips": total_revenue_trips,
        "round_trip_min": round_trip_min,
        "operating_speed_kmh": default_speed_kmh,
        "route_length_km": route_length_km,
        "headway_min": headway_min,
        "duties_count": duties_count,
        "schedule_period": schedule_period,
        "schedule_type": schedule_type,
        "station_a_name": station_a_name,
        "station_b_name": station_b_name,
        "control_points": control_points
    }

    return {
        "summary_passport": summary_passport,
        "master_grid_rows": master_grid_rows,
        "duty_books": duty_books
    }

def generate_optimized_schedule(
    route_id: str, 
    vehicles_count: int, 
    start_time: str, 
    end_time: str, 
    route_length_km: float,
    avg_speed_kmh: float,
    zero_trip_min: int = 15,
    use_elastic_smoother: bool = True,
    duty_type_distribution: Optional[Dict[str, int]] = None, # single, double, peak, split
    stations_list: Optional[List[Dict[str, Any]]] = None # List of stops with name, id, is_control_point
):
    """
    Математичне ядро для генерації розкладів КП "ОМЕТ".
    """
    logger.info(f"📐 Розрахунок розкладу для Маршруту #{route_id}: {vehicles_count} випусків ({start_time} - {end_time}), довжина {route_length_km}км, швидкість {avg_speed_kmh}км/год")
    start_dt = datetime.strptime(start_time, "%H:%M")
    end_dt = datetime.strptime(end_time, "%H:%M")
    
    # 1. Фізичний розрахунок часу рейсу
    base_trip_min = max(10, math.ceil((route_length_km / max(1.0, avg_speed_kmh)) * 60))
    
    # 2. Розрахунок оборотного рейсу та інтервалу (х_min = 2..4 хв буфер на кінцевих)
    cycle_min = (base_trip_min * 2) + (3 * 2)
    headway_min = math.ceil(cycle_min / max(1, vehicles_count)) if vehicles_count > 0 else 5
    
    # 3. Обмеження відтяжки (Макс 10 хвилин)
    layover_min = (headway_min * vehicles_count - (base_trip_min * 2)) / 2 if vehicles_count > 0 else 3
    actual_trip_min = base_trip_min
    actual_layover_min = int(layover_min)
    
    if layover_min > 10:
        excess_time = layover_min - 10
        actual_trip_min = base_trip_min + int(excess_time)
        actual_layover_min = 10
        logger.info(f"⚖️ Відтяжка ({layover_min:.1f}хв > 10хв) скоригована демпфуванням: рейс={actual_trip_min}хв, відстій={actual_layover_min}хв")
    elif layover_min < 3:
        actual_layover_min = 3
        headway_min = max(2, math.ceil(((actual_trip_min * 2) + 6) / max(1, vehicles_count)))
        logger.info(f"⚡ Інтервал оптимізовано: рейс={actual_trip_min}хв, інтервал={headway_min}хв, відстій={actual_layover_min}хв")
    else:
        logger.info(f"⏱️ Стандартний графік: рейс={actual_trip_min}хв, інтервал={headway_min}хв, відстій={actual_layover_min}хв")
        
    duties = []
    global_trip_counter = 1
    total_generated_trips = 0
    
    for v_idx in range(vehicles_count):
        # Визначаємо тип наряду для цього виходу
        # За замовчуванням більшість випусків двозмінні (DOUBLE), частина пікові (PEAK) або розривні (SPLIT)
        if v_idx % 4 == 0:
            duty_type = "DOUBLE"
        elif v_idx % 4 == 1:
            duty_type = "SINGLE"
        elif v_idx % 4 == 2:
            duty_type = "SPLIT"
        else:
            duty_type = "PEAK"

        duty_num_str = f"{route_id}-{v_idx + 1:02d}"
        v_start = start_dt + timedelta(minutes=v_idx * headway_min)
        current_time = v_start
        
        shifts = []
        
        # --- ЛОГІКА ДВОЗМІННОГО НАРЯДУ (DOUBLE) ---
        if duty_type == "DOUBLE":
            # Зміна 1 (ранок-день)
            shift1_trips = []
            shift2_trips = []
            
            # Нульовий рейс 1-ї зміни
            zero_end = current_time + timedelta(minutes=zero_trip_min)
            shift1_trips.append({
                "id": global_trip_counter,
                "trip_sequence": len(shift1_trips) + 1,
                "direction": "PULL_OUT",
                "start_time": current_time.strftime("%H:%M"),
                "end_time": zero_end.strftime("%H:%M"),
                "is_zero": True,
                "trip_type": "PULL_OUT"
            })
            global_trip_counter += 1
            current_time = zero_end
            
            # Перезмінка приблизно о 14:00 - 14:30
            shift_split_time = start_dt + timedelta(hours=8, minutes=30)
            had_lunch_shift1 = False
            
            while current_time < shift_split_time and current_time < end_dt:
                dur = actual_trip_min
                if use_elastic_smoother and (7 <= current_time.hour <= 9):
                    dur = int(actual_trip_min * 1.25)
                
                t_end = current_time + timedelta(minutes=dur)
                direction = "FORWARD" if len(shift1_trips) % 2 != 0 else "BACKWARD"
                
                shift1_trips.append({
                    "id": global_trip_counter,
                    "trip_sequence": len(shift1_trips) + 1,
                    "direction": direction,
                    "start_time": current_time.strftime("%H:%M"),
                    "end_time": t_end.strftime("%H:%M"),
                    "is_zero": False,
                    "trip_type": "REGULAR"
                })
                global_trip_counter += 1
                total_generated_trips += 1
                current_time = t_end

                # Обід 1-ї зміни. ІНВАРІАНТ: обід можливий ЛИШЕ одразу після
                # BACKWARD-рейсу (тобто в момент прибуття на ДП/станцію А),
                # ніколи одразу після FORWARD-рейсу (прибуття на станцію Б).
                worked_mins = (current_time - v_start).total_seconds() / 60.0
                if not had_lunch_shift1 and direction == "BACKWARD" and worked_mins >= MIN_WORK_MINS_BEFORE_LUNCH:
                    current_time += timedelta(minutes=TRAM_STANDARD_LUNCH_MIN)
                    had_lunch_shift1 = True
                else:
                    current_time += timedelta(minutes=actual_layover_min)
                    
            shifts.append({
                "shift_sequence": 1,
                "shift_type": "FIRST_SHIFT",
                "has_break": had_lunch_shift1,
                "break_duration_minutes": TRAM_STANDARD_LUNCH_MIN if had_lunch_shift1 else 0,
                "trips": shift1_trips
            })
            
            # Зміна 2 (день-вечір)
            had_lunch_shift2 = False
            shift2_start = current_time
            
            while current_time < end_dt:
                dur = actual_trip_min
                if use_elastic_smoother and (16 <= current_time.hour <= 18):
                    dur = int(actual_trip_min * 1.25)
                    
                t_end = current_time + timedelta(minutes=dur)
                if t_end > end_dt:
                    break
                    
                direction = "FORWARD" if (len(shift1_trips) + len(shift2_trips)) % 2 != 0 else "BACKWARD"
                shift2_trips.append({
                    "id": global_trip_counter,
                    "trip_sequence": len(shift2_trips) + 1,
                    "direction": direction,
                    "start_time": current_time.strftime("%H:%M"),
                    "end_time": t_end.strftime("%H:%M"),
                    "is_zero": False,
                    "trip_type": "REGULAR"
                })
                global_trip_counter += 1
                total_generated_trips += 1
                current_time = t_end

                # ІНВАРІАНТ: те саме правило — обід ІІ зміни лише після прибуття на ДП (BACKWARD).
                worked_mins2 = (current_time - shift2_start).total_seconds() / 60.0
                if not had_lunch_shift2 and direction == "BACKWARD" and worked_mins2 >= MIN_WORK_MINS_BEFORE_LUNCH:
                    current_time += timedelta(minutes=TRAM_STANDARD_LUNCH_MIN)
                    had_lunch_shift2 = True
                else:
                    current_time += timedelta(minutes=actual_layover_min)
                    
            # Заїзд 2-ї зміни у депо
            shift2_trips.append({
                "id": global_trip_counter,
                "trip_sequence": len(shift2_trips) + 1,
                "direction": "PULL_IN",
                "start_time": current_time.strftime("%H:%M"),
                "end_time": (current_time + timedelta(minutes=zero_trip_min)).strftime("%H:%M"),
                "is_zero": True,
                "trip_type": "PULL_IN"
            })
            global_trip_counter += 1
            
            shifts.append({
                "shift_sequence": 2,
                "shift_type": "SECOND_SHIFT",
                "has_break": had_lunch_shift2,
                "break_duration_minutes": TRAM_STANDARD_LUNCH_MIN if had_lunch_shift2 else 0,
                "trips": shift2_trips
            })

        # --- ЛОГІКА РОЗРИВНОГО НАРЯДУ (SPLIT: 2 різних вагони для ТО в депо) ---
        elif duty_type == "SPLIT":
            shift1_trips = []
            shift2_trips = []
            
            # Виїзд першого вагона
            shift1_trips.append({
                "id": global_trip_counter,
                "trip_sequence": 1,
                "direction": "PULL_OUT",
                "start_time": current_time.strftime("%H:%M"),
                "end_time": (current_time + timedelta(minutes=zero_trip_min)).strftime("%H:%M"),
                "is_zero": True,
                "trip_type": "PULL_OUT"
            })
            global_trip_counter += 1
            current_time += timedelta(minutes=zero_trip_min)
            
            # Робота першого вагона до 14:00 (понад 8 годин).
            # ІНВАРІАНТ: ротація SPLIT-вагонів відбувається виключно на ДП —
            # тобто лише одразу після BACKWARD-рейсу (прибуття назад на початкову
            # точку наряду), ніколи одразу після FORWARD-рейсу (це була б станція
            # Б). Тому цикл не зупиняється рівно по `split_time`, а завершує
            # поточний оборотний рейс і виходить лише на BACKWARD-кроці.
            split_time = start_dt + timedelta(hours=8, minutes=15)
            direction = "BACKWARD"
            safety_guard = 0
            while current_time < split_time or direction != "BACKWARD":
                safety_guard += 1
                if safety_guard > 500:
                    break
                dur = actual_trip_min
                t_end = current_time + timedelta(minutes=dur)
                direction = "FORWARD" if len(shift1_trips) % 2 != 0 else "BACKWARD"
                shift1_trips.append({
                    "id": global_trip_counter,
                    "trip_sequence": len(shift1_trips) + 1,
                    "direction": direction,
                    "start_time": current_time.strftime("%H:%M"),
                    "end_time": t_end.strftime("%H:%M"),
                    "is_zero": False,
                    "trip_type": "REGULAR"
                })
                global_trip_counter += 1
                total_generated_trips += 1
                current_time = t_end + timedelta(minutes=actual_layover_min)

            # Перший вагон заїжджає в депо на ремонт/ТО — вагон гарантовано на ДП
            shift1_trips.append({
                "id": global_trip_counter,
                "trip_sequence": len(shift1_trips) + 1,
                "direction": "PULL_IN",
                "start_time": current_time.strftime("%H:%M"),
                "end_time": (current_time + timedelta(minutes=zero_trip_min)).strftime("%H:%M"),
                "is_zero": True,
                "trip_type": "PULL_IN"
            })
            global_trip_counter += 1
            
            shifts.append({
                "shift_sequence": 1,
                "shift_type": "SPLIT_VEHICLE_1_MAINTENANCE",
                "has_break": True,
                "trips": shift1_trips
            })
            
            # Другий вагон виїжджає з депо на ту саму ДП майже одночасно
            shift2_start = current_time + timedelta(minutes=5)
            current_time = shift2_start
            shift2_trips.append({
                "id": global_trip_counter,
                "trip_sequence": 1,
                "direction": "PULL_OUT",
                "start_time": current_time.strftime("%H:%M"),
                "end_time": (current_time + timedelta(minutes=zero_trip_min)).strftime("%H:%M"),
                "is_zero": True,
                "trip_type": "PULL_OUT"
            })
            global_trip_counter += 1
            current_time += timedelta(minutes=zero_trip_min)
            
            while current_time < end_dt:
                dur = actual_trip_min
                t_end = current_time + timedelta(minutes=dur)
                if t_end > end_dt:
                    break
                direction = "FORWARD" if len(shift2_trips) % 2 != 0 else "BACKWARD"
                shift2_trips.append({
                    "id": global_trip_counter,
                    "trip_sequence": len(shift2_trips) + 1,
                    "direction": direction,
                    "start_time": current_time.strftime("%H:%M"),
                    "end_time": t_end.strftime("%H:%M"),
                    "is_zero": False,
                    "trip_type": "REGULAR"
                })
                global_trip_counter += 1
                total_generated_trips += 1
                current_time = t_end + timedelta(minutes=actual_layover_min)
                
            shift2_trips.append({
                "id": global_trip_counter,
                "trip_sequence": len(shift2_trips) + 1,
                "direction": "PULL_IN",
                "start_time": current_time.strftime("%H:%M"),
                "end_time": (current_time + timedelta(minutes=zero_trip_min)).strftime("%H:%M"),
                "is_zero": True,
                "trip_type": "PULL_IN"
            })
            global_trip_counter += 1
            
            shifts.append({
                "shift_sequence": 2,
                "shift_type": "SPLIT_VEHICLE_2",
                "has_break": True,
                "trips": shift2_trips
            })

        # --- СТАНДАРТНИЙ ОДНОЗМІННИЙ / ПІКОВИЙ (SINGLE / PEAK) ---
        else:
            trips = []
            # Виїзд
            trips.append({
                "id": global_trip_counter,
                "trip_sequence": 1,
                "direction": "PULL_OUT",
                "start_time": current_time.strftime("%H:%M"),
                "end_time": (current_time + timedelta(minutes=zero_trip_min)).strftime("%H:%M"),
                "is_zero": True,
                "trip_type": "PULL_OUT"
            })
            global_trip_counter += 1
            current_time += timedelta(minutes=zero_trip_min)
            
            target_limit = start_dt + timedelta(hours=9) if duty_type == "SINGLE" else end_dt
            had_lunch = False
            
            while current_time < target_limit and current_time < end_dt:
                dur = actual_trip_min
                t_end = current_time + timedelta(minutes=dur)
                if t_end > end_dt:
                    break
                direction = "FORWARD" if len(trips) % 2 != 0 else "BACKWARD"
                trips.append({
                    "id": global_trip_counter,
                    "trip_sequence": len(trips) + 1,
                    "direction": direction,
                    "start_time": current_time.strftime("%H:%M"),
                    "end_time": t_end.strftime("%H:%M"),
                    "is_zero": False,
                    "trip_type": "REGULAR"
                })
                global_trip_counter += 1
                total_generated_trips += 1
                current_time = t_end
                
                worked_h = (current_time - v_start).total_seconds() / 3600
                if not had_lunch and worked_h >= 4.0:
                    current_time += timedelta(minutes=15)
                    had_lunch = True
                else:
                    current_time += timedelta(minutes=actual_layover_min)
                    
            # Заїзд у депо
            trips.append({
                "id": global_trip_counter,
                "trip_sequence": len(trips) + 1,
                "direction": "PULL_IN",
                "start_time": current_time.strftime("%H:%M"),
                "end_time": (current_time + timedelta(minutes=zero_trip_min)).strftime("%H:%M"),
                "is_zero": True,
                "trip_type": "PULL_IN"
            })
            global_trip_counter += 1
            
            shifts.append({
                "shift_sequence": 1,
                "shift_type": duty_type,
                "has_break": had_lunch,
                "trips": trips
            })

        duties.append({
            "duty_number": duty_num_str,
            "duty_type": duty_type,
            "metrics": {
                "total_shifts": len(shifts),
                "total_trips": sum(len(s["trips"]) for s in shifts)
            },
            "shifts": shifts
        })
    
    actual_speed = round(route_length_km / max(0.01, (actual_trip_min / 60)), 1)

    return {
        "route_id": route_id,
        "duties": duties,
        "metrics": {
            "headway_min": headway_min,
            "actual_trip_min": actual_trip_min,
            "layover_min": actual_layover_min,
            "actual_speed_kmh": actual_speed,
            "total_trips": total_generated_trips,
            "vehicles_used": vehicles_count
        }
    }


class TransitSolver:
    """
    Математичне ядро для розрахунку руху, каскадного застосування відтяжок/затримок,
    контролю норм КЗпП України та валідації електробусів.
    """
    def __init__(self):
        self.MAX_SHIFT_MINUTES = 600  # 10 годин граничного робочого часу за зміну
        self.MIN_LUNCH_WINDOW_MIN = 240  # 4 години від початку зміни
        self.MAX_LUNCH_WINDOW_MIN = 360  # 6 годин від початку зміни

        self.PREP_TIME_TRAM = 10
        self.PREP_TIME_TROLLEYBUS = 19
        self.PREP_TIME_ELECTROBUS = 15

        self.STANDARD_LUNCH_TRAM = 15
        self.STANDARD_LUNCH_TROLLEYBUS = 20
        self.STANDARD_LUNCH_ELECTROBUS = 20

    def validate_driver_duty(
        self,
        duty_id: str,
        transport_type: str,
        shift_start_min: int,
        shift_end_min: int,
        driving_min: int,
        actual_lunch_min: int,
        lunch_start_min: Optional[int] = None,
        lunch_location_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Валідує зміну водія відповідно до регламенту КП «ОМЕТ» та КЗпП України.
        """
        ttype = (transport_type or "tram").lower()

        if ttype == "trolleybus":
            prep_time = self.PREP_TIME_TROLLEYBUS
            std_lunch = self.STANDARD_LUNCH_TROLLEYBUS
        elif ttype == "electrobus":
            prep_time = self.PREP_TIME_ELECTROBUS
            std_lunch = self.STANDARD_LUNCH_ELECTROBUS
        else:
            prep_time = self.PREP_TIME_TRAM
            std_lunch = self.STANDARD_LUNCH_TRAM

        overtime_lunch = max(0, actual_lunch_min - std_lunch)
        total_shift_min = driving_min + prep_time + overtime_lunch

        is_violating_10h = total_shift_min > self.MAX_SHIFT_MINUTES

        lunch_window_violation = False
        is_lunch_compliant = True

        if lunch_start_min is not None:
            min_allowed = shift_start_min + self.MIN_LUNCH_WINDOW_MIN
            max_allowed = shift_start_min + self.MAX_LUNCH_WINDOW_MIN
            if lunch_start_min < min_allowed or lunch_start_min > max_allowed:
                lunch_window_violation = True
                is_lunch_compliant = False
        elif (shift_end_min - shift_start_min) > 360:
            lunch_window_violation = True
            is_lunch_compliant = False

        warnings = []
        if is_violating_10h:
            warnings.append(
                f"ПОРУШЕННЯ КЗпП: Зміна {duty_id} перевищує 10 годин ({total_shift_min} хв із урахуванням t_prep та понаднормового обіду +{overtime_lunch} хв)."
            )
        if lunch_window_violation:
            warnings.append(
                f"ПОПЕРЕДЖЕННЯ: Обід зміни {duty_id} випадає за межі нормативного вікна (4-6 годин від початку зміни)."
            )

        return {
            "duty_id": duty_id,
            "transport_type": ttype,
            "prep_time_min": prep_time,
            "standard_lunch_min": std_lunch,
            "actual_lunch_min": actual_lunch_min,
            "overtime_lunch_min": overtime_lunch,
            "driving_min": driving_min,
            "total_shift_min": total_shift_min,
            "is_violating_10h": is_violating_10h,
            "is_lunch_compliant": is_lunch_compliant,
            "lunch_window_violation": lunch_window_violation,
            "warnings": warnings,
            "lunch_location_name": lunch_location_name or "Старосінна площа (Хаб)"
        }

    def validate_electrobus_battery(
        self,
        block_id: str,
        route_length_km: float,
        idle_minutes_at_terminal: float,
        current_soc_pct: float,
        battery_capacity_kwh: float = 200.0,
        ambient_temp_c: float = 20.0
    ) -> Dict[str, Any]:
        """
        Розрахунок споживання енергії електробусом з урахуванням температури та залишку заряду (SoC).
        """
        temp_factor = 1.0
        if ambient_temp_c < 0:
            temp_factor = 1.0 + min(0.4, abs(ambient_temp_c) * 0.02)
        elif ambient_temp_c > 28:
            temp_factor = 1.0 + min(0.25, (ambient_temp_c - 28) * 0.025)

        base_kwh_per_km = 1.15
        consumed_kwh = route_length_km * base_kwh_per_km * temp_factor

        charging_power_kw = 120.0
        charged_kwh = (idle_minutes_at_terminal / 60.0) * charging_power_kw * 0.9

        current_kwh = (current_soc_pct / 100.0) * battery_capacity_kwh
        final_kwh = max(0.0, min(battery_capacity_kwh, current_kwh - consumed_kwh + charged_kwh))
        final_soc_pct = round((final_kwh / battery_capacity_kwh) * 100.0, 1)

        is_battery_low = final_soc_pct < 20.0
        required_charging_min = 0
        warnings = []

        if is_battery_low:
            needed_kwh = (0.35 * battery_capacity_kwh) - final_kwh
            required_charging_min = math.ceil((needed_kwh / (charging_power_kw * 0.9)) * 60)
            warnings.append(
                f"КРИТИЧНО: Рівень заряду {final_soc_pct}% нижче ліміту безпеки 20%. Потрібна підзарядка {required_charging_min} хв."
            )

        return {
            "block_id": block_id,
            "final_soc_pct": final_soc_pct,
            "consumed_kwh": round(consumed_kwh, 1),
            "charged_kwh": round(charged_kwh, 1),
            "is_battery_low": is_battery_low,
            "required_charging_min": required_charging_min,
            "ambient_temp_c": ambient_temp_c,
            "warnings": warnings
        }

    def apply_delay_cascade(
        self,
        schedule_data: List[Dict[str, Any]],
        block_id: str,
        start_time_min: int,
        delay_min: float,
        ambient_temp_c: float = 20.0
    ) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        Каскадно застосовує затримку/відтяжку до всіх наступних рейсів вагона (block_id)
        і повертає оновлений розклад та список застережень.
        """
        updated_schedule = copy.deepcopy(schedule_data)
        warnings = []

        target_block = next((b for b in updated_schedule if b.get("block_id") == block_id or b.get("id") == block_id), None)
        if not target_block or "trips" not in target_block:
            return updated_schedule, [f"Повідомлення: Блок {block_id} актуалізовано."]

        # 1. Каскадний зсув часу
        for trip in target_block["trips"]:
            trip_start = trip.get("start_time", 0)
            if trip_start >= start_time_min:
                trip["start_time"] = int(trip_start + delay_min)
                trip["end_time"] = int(trip.get("end_time", trip_start + 30) + delay_min)
                trip["is_delayed"] = True
                trip["slack_min"] = int(trip.get("slack_min", 0) + delay_min)

        # 2. Перевірка вагонного блоку та перерв
        block_trips = sorted(target_block["trips"], key=lambda x: x.get("start_time", 0))
        transport_type = target_block.get("vehicle_type", target_block.get("type", "tram")).lower()

        shift_start = block_trips[0].get("start_time", 0) if block_trips else start_time_min
        shift_end = block_trips[-1].get("end_time", 0) if block_trips else start_time_min

        total_driving = sum(t.get("end_time", 0) - t.get("start_time", 0) for t in block_trips)
        actual_lunch = 0
        lunch_start = None

        for i in range(len(block_trips) - 1):
            curr_trip = block_trips[i]
            next_trip = block_trips[i+1]
            break_dur = next_trip.get("start_time", 0) - curr_trip.get("end_time", 0)

            if break_dur >= 10:  # Вважається обідньою перервою
                actual_lunch += break_dur
                if lunch_start is None:
                    lunch_start = curr_trip.get("end_time", 0)

            if break_dur < 0:
                warnings.append(f"КРИТИЧНО: Накладання рейсів для борту {block_id}.")

        # 3. Валідація КЗпП
        duty_res = self.validate_driver_duty(
            duty_id=f"duty_{block_id}",
            transport_type=transport_type,
            shift_start_min=shift_start,
            shift_end_min=shift_end,
            driving_min=total_driving,
            actual_lunch_min=actual_lunch,
            lunch_start_min=lunch_start
        )
        warnings.extend(duty_res["warnings"])

        return updated_schedule, warnings

    def calculate_static_schedule_from_norms(
        self,
        route_id: str,
        route_name: str,
        route_type: str = "TRAM",
        vehicles_count: int = 14,
        start_time_str: str = "05:30",
        end_time_str: str = "23:30",
        round_trip_min: int = 84,
        t_dir0_min: int = 36,
        t_dir1_min: int = 36,
        layover_min: int = 6,
        depot_pullout_min: int = 15,
        depot_pullin_min: int = 15,
        standard_break_min: int = 15, # 15 for tram, 20 for trolleybus
        designated_break_hub: str = "ДП «вул. Паустовського»",
        stops_list: Optional[List[Dict[str, Any]]] = None,
        duty_types_sequence: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Класичний статичний розрахунок Служби Руху:
        - Формує стовпчикову дошку нарядів (Columnar Duty Board);
        - Формує діаграму Ганта з виділенням виїздів, рейсів, обідів (15/20хв) та перезмінок;
        - Формує похвилинну сітку всіх зупинок маршруту для друку книжки водія.
        """
        logger.info(f"📐 [StaticScheduleEngine] Розрахунок лінії #{route_id} ({route_name}): N={vehicles_count}, T_оборот={round_trip_min}хв, норма обіду={standard_break_min}хв")

        # 1. Розрахунок інтервалу
        headway_min = round(round_trip_min / max(1, vehicles_count), 1)
        
        start_h, start_m = map(int, start_time_str.split(":"))
        end_h, end_m = map(int, end_time_str.split(":"))
        start_total_min = start_h * 60 + start_m
        end_total_min = end_h * 60 + end_m

        columns = []
        gantt_tasks = []
        driver_book_trips = []
        total_daily_trips = 0

        # Стандартні типи нарядів: більшість DOUBLE, один SPLIT, один SINGLE
        default_duty_types = ["DOUBLE"] * vehicles_count
        if vehicles_count >= 6:
            default_duty_types[2] = "SPLIT" # Розривний
            default_duty_types[-1] = "SINGLE" # Однозмінний

        duty_types_map = {
            "DOUBLE": {"name": "Двозмінний", "code": "ДВ", "color": "#3b82f6"},
            "SINGLE": {"name": "Однозмінний", "code": "ОД", "color": "#10b981"},
            "SPLIT": {"name": "Розривний", "code": "РОЗ", "color": "#f59e0b"},
            "PEAK": {"name": "Піковий", "code": "ПІК", "color": "#ec4899"},
            "NIGHT": {"name": "Черговий", "code": "ЧЕР", "color": "#8b5cf6"}
        }

        # Зупинки маршруту для похвилинної сітки
        route_stops = stops_list or [
            {"id": "s1", "name": "Кінцева станція А", "is_dispatch_station": True},
            {"id": "s2", "name": "вул. Проміжна (КП-1)", "is_dispatch_station": True},
            {"id": "s3", "name": "вул. Центральна", "is_dispatch_station": False},
            {"id": "s4", "name": "Кінцева станція Б", "is_dispatch_station": True}
        ]

        def min_to_str(m: float) -> str:
            total_m = int(m) % 1440
            h = (total_m // 60) % 24
            mn = total_m % 60
            return f"{h:02d}:{mn:02d}"

        # 2. Розрахунок кожного наряду по колонках
        for v_idx in range(vehicles_count):
            duty_num = v_idx + 1
            duty_id = f"{route_id}-{duty_num:02d}"
            
            # Визначаємо тип наряду
            d_type = (duty_types_sequence[v_idx] if (duty_types_sequence and v_idx < len(duty_types_sequence)) 
                      else default_duty_types[v_idx])
            d_type_info = duty_types_map.get(d_type, duty_types_map["DOUBLE"])

            # Час виїзду з депо для цього випуску (зсув на інтервал headway)
            pullout_start_min = start_total_min + (v_idx * headway_min)
            line_start_min = pullout_start_min + depot_pullout_min
            
            curr_min = line_start_min
            direction = 0 # 0 - Forward, 1 - Backward
            
            events = []
            
            # 🚩 Подія 1: Виїзд з депо
            events.append({
                "id": f"ev_{duty_id}_0",
                "type": "PULL_OUT",
                "label": "Виїзд з депо на маршрут",
                "time": min_to_str(pullout_start_min),
                "duration_min": depot_pullout_min,
                "location": "Трамвайне депо №1",
                "badge_color": "indigo"
            })
            gantt_tasks.append({
                "duty_id": duty_id,
                "duty_number": duty_num,
                "type": "PULL_OUT",
                "label": "Нульовий виїзд",
                "start_min": pullout_start_min,
                "end_min": line_start_min,
                "start_time": min_to_str(pullout_start_min),
                "end_time": min_to_str(line_start_min),
                "color": "#6366f1"
            })

            shift1_trips_count = 0
            shift2_trips_count = 0
            lunch1_done = False
            lunch2_done = False
            shift_changed = False

            # Середина зміни для обіду 1-ї зміни (через 3.5 - 4.5 год після початку)
            lunch1_target_min = line_start_min + 220
            shift_change_target_min = line_start_min + 450 # ~7.5 год зміна 1
            lunch2_target_min = shift_change_target_min + 220

            trip_idx = 1
            while curr_min < end_total_min:
                # Перевірка на обід 1-ї зміни (на закріпленому ДП)
                if not lunch1_done and direction == 0 and curr_min >= lunch1_target_min:
                    lunch_dur = standard_break_min
                    excess_lunch = max(0, lunch_dur - (15 if route_type == "TRAM" else 20))
                    events.append({
                        "id": f"ev_{duty_id}_lunch1",
                        "type": "LUNCH",
                        "label": f"Обід водія (Зміна 1)",
                        "time": min_to_str(curr_min),
                        "duration_min": lunch_dur,
                        "standard_duration_min": 15 if route_type == "TRAM" else 20,
                        "excess_min": excess_lunch,
                        "location": designated_break_hub,
                        "shift": 1,
                        "badge_color": "amber"
                    })
                    gantt_tasks.append({
                        "duty_id": duty_id,
                        "duty_number": duty_num,
                        "type": "LUNCH",
                        "label": f"Обід 1-ї зміни ({lunch_dur}хв)",
                        "start_min": curr_min,
                        "end_min": curr_min + lunch_dur,
                        "start_time": min_to_str(curr_min),
                        "end_time": min_to_str(curr_min + lunch_dur),
                        "color": "#f59e0b"
                    })
                    curr_min += lunch_dur
                    lunch1_done = True
                    continue

                # Перевірка на перезмінку (тільки для DOUBLE)
                if d_type == "DOUBLE" and not shift_changed and direction == 0 and curr_min >= shift_change_target_min:
                    events.append({
                        "id": f"ev_{duty_id}_shift_chg",
                        "type": "SHIFT_CHANGE",
                        "label": "Перезмінка водіїв на ДП",
                        "time": min_to_str(curr_min),
                        "duration_min": layover_min,
                        "location": designated_break_hub,
                        "driver_out": "Водій 1-ї зміни",
                        "driver_in": "Водій 2-ї зміни",
                        "badge_color": "purple"
                    })
                    gantt_tasks.append({
                        "duty_id": duty_id,
                        "duty_number": duty_num,
                        "type": "SHIFT_CHANGE",
                        "label": "Перезмінка",
                        "start_min": curr_min,
                        "end_min": curr_min + layover_min,
                        "start_time": min_to_str(curr_min),
                        "end_time": min_to_str(curr_min + layover_min),
                        "color": "#8b5cf6"
                    })
                    curr_min += layover_min
                    shift_changed = True
                    continue

                # Перевірка на обід 2-ї зміни
                if d_type == "DOUBLE" and shift_changed and not lunch2_done and direction == 0 and curr_min >= lunch2_target_min:
                    lunch_dur = standard_break_min
                    events.append({
                        "id": f"ev_{duty_id}_lunch2",
                        "type": "LUNCH",
                        "label": f"Обід водія (Зміна 2)",
                        "time": min_to_str(curr_min),
                        "duration_min": lunch_dur,
                        "standard_duration_min": 15 if route_type == "TRAM" else 20,
                        "location": designated_break_hub,
                        "shift": 2,
                        "badge_color": "amber"
                    })
                    gantt_tasks.append({
                        "duty_id": duty_id,
                        "duty_number": duty_num,
                        "type": "LUNCH",
                        "label": f"Обід 2-ї зміни ({lunch_dur}хв)",
                        "start_min": curr_min,
                        "end_min": curr_min + lunch_dur,
                        "start_time": min_to_str(curr_min),
                        "end_time": min_to_str(curr_min + lunch_dur),
                        "color": "#f59e0b"
                    })
                    curr_min += lunch_dur
                    lunch2_done = True
                    continue

                # Регулярний рейс на лінії
                trip_dur = t_dir0_min if direction == 0 else t_dir1_min
                trip_start_min = curr_min
                trip_end_min = curr_min + trip_dur
                
                from_name = route_stops[0]["name"] if direction == 0 else route_stops[-1]["name"]
                to_name = route_stops[-1]["name"] if direction == 0 else route_stops[0]["name"]

                events.append({
                    "id": f"ev_{duty_id}_t{trip_idx}",
                    "type": "TRIP",
                    "trip_number": trip_idx,
                    "direction": "FORWARD" if direction == 0 else "BACKWARD",
                    "departure_time": min_to_str(trip_start_min),
                    "arrival_time": min_to_str(trip_end_min),
                    "from_stop": from_name,
                    "to_stop": to_name,
                    "duration_min": trip_dur,
                    "badge_color": "emerald"
                })

                gantt_tasks.append({
                    "duty_id": duty_id,
                    "duty_number": duty_num,
                    "type": "TRIP",
                    "label": f"Рейс #{trip_idx} ({min_to_str(trip_start_min)} ⇄ {min_to_str(trip_end_min)})",
                    "start_min": trip_start_min,
                    "end_min": trip_end_min,
                    "start_time": min_to_str(trip_start_min),
                    "end_time": min_to_str(trip_end_min),
                    "color": "#10b981"
                })

                if not shift_changed:
                    shift1_trips_count += 1
                else:
                    shift2_trips_count += 1

                total_daily_trips += 1
                trip_idx += 1
                curr_min = trip_end_min + layover_min
                direction = 1 if direction == 0 else 0

            # 🏁 Заїзд у депо
            pullin_start = curr_min - layover_min
            pullin_end = pullin_start + depot_pullin_min
            events.append({
                "id": f"ev_{duty_id}_pullin",
                "type": "PULL_IN",
                "label": "Заїзд у депо (закінчення наряду)",
                "time": min_to_str(pullin_start),
                "duration_min": depot_pullin_min,
                "location": "Трамвайне депо №1",
                "badge_color": "slate"
            })
            gantt_tasks.append({
                "duty_id": duty_id,
                "duty_number": duty_num,
                "type": "PULL_IN",
                "label": "Заїзд у депо",
                "start_min": pullin_start,
                "end_min": pullin_end,
                "start_time": min_to_str(pullin_start),
                "end_time": min_to_str(pullin_end),
                "color": "#64748b"
            })

            shift1_hours = round((min(curr_min, shift_change_target_min) - pullout_start_min) / 60.0, 1)
            shift2_hours = round(max(0, curr_min - shift_change_target_min) / 60.0, 1) if d_type == "DOUBLE" else 0.0

            columns.append({
                "duty_id": duty_id,
                "duty_number": duty_num,
                "duty_type": d_type,
                "duty_type_name": d_type_info["name"],
                "duty_type_code": d_type_info["code"],
                "badge_color": d_type_info["color"],
                "start_time": min_to_str(pullout_start_min),
                "end_time": min_to_str(pullin_end),
                "total_work_hours": round((pullin_end - pullout_start_min) / 60.0, 1),
                "shift1_hours": shift1_hours,
                "shift2_hours": shift2_hours,
                "events_count": len(events),
                "events": events
            })

        return {
            "kpi": {
                "route_id": route_id,
                "route_name": route_name,
                "route_type": route_type,
                "vehicles_count": vehicles_count,
                "round_trip_min": round_trip_min,
                "headway_min": headway_min,
                "standard_break_min": standard_break_min,
                "designated_break_hub": designated_break_hub,
                "total_duties_count": len(columns),
                "total_daily_trips": total_daily_trips,
                "total_daily_km": round(total_daily_trips * 13.5, 1)
            },
            "columns": columns,
            "gantt_tasks": gantt_tasks
        }

transit_solver = TransitSolver()
