# backend/app/services/transit_solver.py
import copy
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional

def generate_optimized_schedule(
    route_id: str, 
    vehicles_count: int, 
    start_time: str, 
    end_time: str, 
    route_length_km: float,
    avg_speed_kmh: float,
    zero_trip_min: int = 15,
    use_elastic_smoother: bool = True
):
    """
    Математичне ядро для генерації розкладів КП "ОМЕТ".
    Враховує фізику (швидкість/відстань), нульові рейси (з пасажирами) та обіди на кільці.
    """
    start_dt = datetime.strptime(start_time, "%H:%M")
    end_dt = datetime.strptime(end_time, "%H:%M")
    
    # 1. Фізичний розрахунок часу рейсу
    # Час (год) = Відстань / Швидкість * 60 -> Хвилини
    base_trip_min = math.ceil((route_length_km / max(1.0, avg_speed_kmh)) * 60)
    
    # 2. Розрахунок оборотного рейсу та інтервалу
    # Мінімальний відстій - 3 хвилини
    cycle_min = (base_trip_min * 2) + (3 * 2)
    headway_min = math.ceil(cycle_min / max(1, vehicles_count)) if vehicles_count > 0 else 0
    
    # 3. Обмеження відтяжки (Макс 10 хвилин)
    # Якщо розрахований інтервал дає занадто великий відстій, ми ШТУЧНО УПОВІЛЬНЮЄМО вагон (додаємо час у рейс)
    layover_min = (headway_min * vehicles_count - (base_trip_min * 2)) / 2 if vehicles_count > 0 else 3
    actual_trip_min = base_trip_min
    actual_layover_min = int(layover_min)
    
    if layover_min > 10:
        excess_time = layover_min - 10
        actual_trip_min += int(excess_time)
        actual_layover_min = 10
    elif layover_min < 3:
        actual_layover_min = 3
        # Якщо інтервал не вміщається, вагони їздитимуть "хвіст у хвіст"
        headway_min = math.ceil(((actual_trip_min * 2) + 6) / max(1, vehicles_count))
        
    duties = []
    global_trip_counter = 1
    total_generated_trips = 0
    
    for v_idx in range(vehicles_count):
        # Зсув випуску з депо
        v_start = start_dt + timedelta(minutes=v_idx * headway_min)
        current_time = v_start
        
        trips = []
        had_lunch = False
        
        # --- НУЛЬОВИЙ РЕЙС (Виїзд з депо з пасажирами) ---
        zero_trip_end = current_time + timedelta(minutes=zero_trip_min)
        trips.append({
            "id": global_trip_counter,
            "direction": "Нульовий (з пасажирами)",
            "start_time": current_time.strftime("%H:%M"),
            "end_time": zero_trip_end.strftime("%H:%M"),
            "is_zero": True
        })
        global_trip_counter += 1
        current_time = zero_trip_end
        
        # --- РОБОТА НА ЛІНІЇ ---
        while current_time < end_dt:
            # Пікове розтягування (Elastic Smoother)
            trip_duration = actual_trip_min
            if use_elastic_smoother and ((7 <= current_time.hour <= 9) or (16 <= current_time.hour <= 18)):
                trip_duration = int(actual_trip_min * 1.25)
                
            trip_end = current_time + timedelta(minutes=trip_duration)
            if trip_end > end_dt:
                break
                
            direction = "Прямий" if len(trips) % 2 != 0 else "Зворотній"
            
            trips.append({
                "id": global_trip_counter,
                "direction": direction,
                "start_time": current_time.strftime("%H:%M"),
                "end_time": trip_end.strftime("%H:%M"),
                "is_zero": False
            })
            
            global_trip_counter += 1
            total_generated_trips += 1
            current_time = trip_end
            
            # --- ОБІД ВОДІЯ ТА ВАГОНА НА КІЛЬЦІ ---
            worked_hours = (current_time - v_start).total_seconds() / 3600
            if not had_lunch and worked_hours >= 4.0:
                # Вагон стає на кільце на 20 хвилин (перевищує стандартну відтяжку)
                current_time += timedelta(minutes=20)
                had_lunch = True
            else:
                # Стандартна відтяжка (до 10 хв)
                current_time += timedelta(minutes=actual_layover_min)

        # --- ЗАЇЗД В ДЕПО ---
        trips.append({
            "id": global_trip_counter,
            "direction": "Заїзд у Депо",
            "start_time": current_time.strftime("%H:%M"),
            "end_time": (current_time + timedelta(minutes=zero_trip_min)).strftime("%H:%M"),
            "is_zero": True
        })
        global_trip_counter += 1

        duties.append({
            "duty_number": f"{route_id}-{v_idx + 1:02d}",
            "metrics": {"total_trips": len(trips), "had_lunch": had_lunch},
            "shifts": [{"id": v_idx + 1, "shift_type": "FULL", "trips": trips}]
        })
    
    # Розрахунок штучно заниженої швидкості, якщо застосовувалася відтяжка 10 хв
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
        # Константи КЗпП та трудового права
        self.MAX_SHIFT_MINUTES = 600  # 10 годин граничного робочого часу за зміну
        self.MIN_LUNCH_WINDOW_MIN = 240  # 4 години від початку зміни
        self.MAX_LUNCH_WINDOW_MIN = 360  # 6 годин від початку зміни

        # Стандарти підготовчого часу (хвилини)
        self.PREP_TIME_TRAM = 10
        self.PREP_TIME_TROLLEYBUS = 19
        self.PREP_TIME_ELECTROBUS = 15

        # Нормативні перерви на обід (хвилини)
        self.STANDARD_LUNCH_TRAM = 15      # 15 хв (або 10 хв залежно від графіка)
        self.STANDARD_LUNCH_TROLLEYBUS = 20 # 20 хв
        self.STANDARD_LUNCH_ELECTROBUS = 20 # 20 хв

        # Параметри Електробуса
        self.ELECTROBUS_BASE_CONSUMPTION_KWH_PER_KM = 1.3
        self.ELECTROBUS_CHARGING_POWER_KW = 150.0  # Пантограф / Швидкісна станція 150 кВт
        self.ELECTROBUS_MIN_SOC_PCT = 20.0        # Мінімальний поріг акумулятора 20%
        self.ELECTROBUS_TARGET_SOC_PCT = 90.0     # Цільовий рівень зарядки 90%

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
        Валідує зміну водія відповідно до регламенту КП «ОМЕТ» та КЗпП України:
        1. Автоматичний облік підготовчо-заключного часу (10 хв трамвай / 19 хв тролейбус).
        2. Нормативний обід (15 хв трамвай / 20 хв тролейбус).
        3. Понаднормовий обід (перевищення норми) сумується в робочий час.
        4. Граничний ліміт зміни: 10 годин (600 хв).
        5. Вікно обіду: від 4 до 6 годин від початку зміни.
        """
        ttype = (transport_type or "tram").lower()

        # Підготовчий час
        if ttype == "trolleybus":
            prep_time = self.PREP_TIME_TROLLEYBUS
            std_lunch = self.STANDARD_LUNCH_TROLLEYBUS
        elif ttype == "electrobus":
            prep_time = self.PREP_TIME_ELECTROBUS
            std_lunch = self.STANDARD_LUNCH_ELECTROBUS
        else:
            prep_time = self.PREP_TIME_TRAM
            std_lunch = self.STANDARD_LUNCH_TRAM

        # Понаднормовий час обіду
        overtime_lunch = max(0, actual_lunch_min - std_lunch)

        # Загальний робочий час
        total_shift_min = driving_min + prep_time + overtime_lunch

        # Перевірки
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
                f"ПОРУШЕННЯ КЗпП: Зміна {duty_id} перевищує 10 годин ({total_shift_min} хв із урахуванням підготовчого часу та понаднормового обіду +{overtime_lunch} хв)."
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
            "lunch_location_name": lunch_location_name or "Старосінна площа (Вузол)"
        }

    def calculate_electrobus_battery(
        self,
        block_id: str,
        route_length_km: float,
        idle_minutes_at_terminal: float,
        current_soc_pct: float = 95.0,
        battery_capacity_kwh: float = 200.0,
        ambient_temp_c: float = 20.0
    ) -> Dict[str, Any]:
        """
        Валідація стану акумулятора та зарядки для Електробуса.
        Враховує сезонні коефіцієнти (зима +40%, літо +25%).
        """
        multiplier = 1.0
        if ambient_temp_c < 0:
            multiplier = 1.40  # Зима (+40% на опалення)
        elif ambient_temp_c > 28:
            multiplier = 1.25  # Літо (+25% на кондиціонер)

        effective_consumption = self.ELECTROBUS_BASE_CONSUMPTION_KWH_PER_KM * multiplier
        consumed_kwh = route_length_km * effective_consumption

        # Отриманий заряд за час вистою на станції 150 кВт (ККД 90%)
        charged_kwh = (self.ELECTROBUS_CHARGING_POWER_KW * (idle_minutes_at_terminal / 60.0)) * 0.90

        net_kwh_change = charged_kwh - consumed_kwh
        net_soc_pct_change = (net_kwh_change / battery_capacity_kwh) * 100.0

        end_soc = min(100.0, max(0.0, current_soc_pct + net_soc_pct_change))
        is_battery_low = end_soc < self.ELECTROBUS_MIN_SOC_PCT

        # Необхідний час зарядки до 90% SoC
        target_kwh = battery_capacity_kwh * (self.ELECTROBUS_TARGET_SOC_PCT / 100.0)
        current_kwh = (current_soc_pct / 100.0) * battery_capacity_kwh
        needed_kwh = max(0.0, target_kwh - current_kwh + consumed_kwh)
        required_charging_min = math.ceil((needed_kwh / (self.ELECTROBUS_CHARGING_POWER_KW * 0.90)) * 60)

        warnings = []
        if is_battery_low:
            warnings.append(
                f"УВАГА: Низький заряд батареї електробуса {block_id} (залишок {round(end_soc, 1)}%). Необхідна додаткова зарядка."
            )
        if required_charging_min > idle_minutes_at_terminal:
            warnings.append(
                f"ПОПЕРЕДЖЕННЯ: Час вистою ({int(idle_minutes_at_terminal)} хв) менший за необхідний час зарядки ({required_charging_min} хв) для електробуса {block_id}."
            )

        return {
            "block_id": block_id,
            "battery_capacity_kwh": battery_capacity_kwh,
            "start_soc_pct": current_soc_pct,
            "end_soc_pct": round(end_soc, 1),
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
        delay_min: int,
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
            return updated_schedule, [f"КРИТИЧНО: Блок {block_id} не знайдено."]

        # 1. Каскадний зсув часу
        for trip in target_block["trips"]:
            trip_start = trip.get("start_time", 0)
            if trip_start >= start_time_min:
                trip["start_time"] = trip_start + delay_min
                trip["end_time"] = trip.get("end_time", trip_start + 30) + delay_min
                trip["is_delayed"] = True
                trip["slack_min"] = trip.get("slack_min", 0) + delay_min

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

        # 4. Валідація електробуса
        if transport_type == "electrobus":
            battery_res = self.calculate_electrobus_battery(
                block_id=block_id,
                route_length_km=12.4,
                idle_minutes_at_terminal=actual_lunch or 15,
                ambient_temp_c=ambient_temp_c
            )
            warnings.extend(battery_res["warnings"])

        return updated_schedule, warnings

transit_solver = TransitSolver()
