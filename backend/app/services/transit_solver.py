# backend/app/services/transit_solver.py
import copy
import math
from datetime import datetime, timedelta, time as dt_time
from typing import List, Dict, Any, Tuple, Optional
from app.core.logging_config import get_logger

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
                
                # Обід 1-ї зміни
                worked_h = (current_time - v_start).total_seconds() / 3600
                if not had_lunch_shift1 and worked_h >= 4.0:
                    current_time += timedelta(minutes=15)
                    had_lunch_shift1 = True
                else:
                    current_time += timedelta(minutes=actual_layover_min)
                    
            shifts.append({
                "shift_sequence": 1,
                "shift_type": "FIRST_SHIFT",
                "has_break": had_lunch_shift1,
                "break_duration_minutes": 15 if had_lunch_shift1 else 0,
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
                
                worked_h2 = (current_time - shift2_start).total_seconds() / 3600
                if not had_lunch_shift2 and worked_h2 >= 4.0:
                    current_time += timedelta(minutes=15)
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
                "break_duration_minutes": 15 if had_lunch_shift2 else 0,
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
            
            # Робота першого вагона до 14:00 (понад 8 годин)
            split_time = start_dt + timedelta(hours=8, minutes=15)
            while current_time < split_time:
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
                
            # Перший вагон заїжджає в депо на ремонт/ТО з найближчої зупинки
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
            
            # Другий вагон виїжджає з депо на ту саму зупинку майже одночасно
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
