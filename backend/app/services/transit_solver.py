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

transit_solver = TransitSolver()
