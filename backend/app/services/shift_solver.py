from typing import List, Dict, Any, Optional
import math
from datetime import datetime, timedelta

def parse_time_str(t_str: str) -> int:
    """Перетворює рядок "HH:MM" у хвилини від початку доби"""
    try:
        parts = t_str.split(':')
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return 0

def minutes_to_time(mins: int) -> str:
    """Перетворює хвилини від початку доби у рядок "HH:MM" """
    mins = int(mins) % 1440
    h = mins // 60
    m = mins % 60
    return f"{h:02d}:{m:02d}"

class ShiftSolverEngine:
    """
    Інженерний алгоритм розрізання та комплектування змін водіїв (Run Cutting)
    для КП «Одесміськелектротранс».
    """

    def cut_vehicle_duties_into_driver_shifts(
        self,
        route_id: str,
        route_type: str,
        static_columns: List[Dict[str, Any]],
        prep_tram_min: int = 10,
        prep_trolley_min: int = 19
    ) -> List[Dict[str, Any]]:
        """
        Розрізає добові наряди 1..N на нормативні зміни водіїв.
        Ураховує підготовчий час в депо, часове вікно обідів (4-6h) та типи нарядів.
        """
        is_tram = (route_type or 'TRAM').upper() == 'TRAM'
        prep_time_min = prep_tram_min if is_tram else prep_trolley_min
        std_lunch_min = 15 if is_tram else 20

        driver_shifts = []

        for col in static_columns:
            duty_num = col['duty_number']
            duty_type = col.get('duty_type', 'DOUBLE')
            start_min = parse_time_str(col['start_time'])
            end_min = parse_time_str(col['end_time'])
            
            # Підготовчо-заключний час в депо перед нульовим виїздом
            depot_arrival_min = max(0, start_min - prep_time_min)
            depot_arrival_str = minutes_to_time(depot_arrival_min)

            if duty_type in ['DOUBLE', 'DOUBLE_SHIFT']:
                # ДВОЗМІННИЙ НАРЯД: Зміна 1 (Ранкова) + Зміна 2 (Вечірня)
                # Точка перезмінки: шукаємо подій SHIFT_CHANGE або середину випуску
                shift_change_event = next((e for e in col['events'] if e['type'] == 'SHIFT_CHANGE'), None)
                if shift_change_event:
                    mid_min = parse_time_str(shift_change_event['time'])
                else:
                    mid_min = start_min + (end_min - start_min) // 2

                # --- ЗМІНА 1 (Ранкова) ---
                # Обід має бути між 4-ю та 6-ю годинами роботи
                s1_start_work = depot_arrival_min
                s1_end_work = mid_min
                s1_total_work = (s1_end_work - s1_start_work) / 60.0

                # Шукаємо обід у першій половині
                lunch_event_1 = next((e for e in col['events'] if e['type'] == 'LUNCH' and parse_time_str(e['time']) < mid_min), None)
                l1_duration = lunch_event_1['duration_min'] if lunch_event_1 else std_lunch_min
                l1_excess = max(0, l1_duration - std_lunch_min)
                l1_time_str = lunch_event_1['time'] if lunch_event_1 else minutes_to_time(s1_start_work + 300)

                shift1 = {
                    "id": f"SHIFT_{route_id}_{duty_num}_S1",
                    "duty_number": duty_num,
                    "duty_type": duty_type,
                    "shift_index": 1,
                    "shift_name": "Зміна 1 (Ранкова)",
                    "driver_id": f"DRV_{route_id}_{duty_num}_1",
                    "driver_name": f"Водій {duty_num}-1",
                    "driver_tab_num": f"Т-{1000 + duty_num * 2}",
                    "vehicle_num": f"Вг-{4000 + duty_num}",
                    "second_vehicle_num": None,
                    "prep_time_min": prep_time_min,
                    "depot_arrival_time": depot_arrival_str,
                    "pullout_time": col['start_time'],
                    "start_time": depot_arrival_str,
                    "end_time": minutes_to_time(s1_end_work),
                    "lunch_start_time": l1_time_str,
                    "lunch_end_time": minutes_to_time(parse_time_str(l1_time_str) + l1_duration),
                    "lunch_duration_min": l1_duration,
                    "paid_excess_break_min": l1_excess,
                    "lunch_location": col['events'][0].get('location', 'ДП «Паустовського»'),
                    "work_hours": round(s1_total_work, 2),
                    "driving_hours": round(s1_total_work - (l1_duration / 60.0), 2),
                    "night_hours": 0.0,
                    "compliance_status": "VALID" if s1_total_work <= 8.0 else "WARNING_OVERTIME",
                    "timeline_events": col['events']
                }

                # --- ЗМІНА 2 (Вечірня) ---
                s2_start_work = mid_min
                s2_end_work = end_min
                s2_total_work = (s2_end_work - s2_start_work) / 60.0

                lunch_event_2 = next((e for e in col['events'] if e['type'] == 'LUNCH' and parse_time_str(e['time']) >= mid_min), None)
                l2_duration = lunch_event_2['duration_min'] if lunch_event_2 else std_lunch_min
                l2_excess = max(0, l2_duration - std_lunch_min)
                l2_time_str = lunch_event_2['time'] if lunch_event_2 else minutes_to_time(s2_start_work + 270)

                # Нічні години з 22:00 (1320 хв)
                night_min = max(0, end_min - 1320)
                night_hours = round(night_min / 60.0, 2)

                shift2 = {
                    "id": f"SHIFT_{route_id}_{duty_num}_S2",
                    "duty_number": duty_num,
                    "duty_type": duty_type,
                    "shift_index": 2,
                    "shift_name": "Зміна 2 (Вечірня)",
                    "driver_id": f"DRV_{route_id}_{duty_num}_2",
                    "driver_name": f"Водій {duty_num}-2",
                    "driver_tab_num": f"Т-{1001 + duty_num * 2}",
                    "vehicle_num": f"Вг-{4000 + duty_num}",
                    "second_vehicle_num": None,
                    "prep_time_min": 0, # Отримання на лінії на ДП
                    "depot_arrival_time": minutes_to_time(s2_start_work),
                    "pullout_time": minutes_to_time(s2_start_work),
                    "start_time": minutes_to_time(s2_start_work),
                    "end_time": col['end_time'],
                    "lunch_start_time": l2_time_str,
                    "lunch_end_time": minutes_to_time(parse_time_str(l2_time_str) + l2_duration),
                    "lunch_duration_min": l2_duration,
                    "paid_excess_break_min": l2_excess,
                    "lunch_location": col['events'][0].get('location', 'ДП «Паустовського»'),
                    "work_hours": round(s2_total_work, 2),
                    "driving_hours": round(s2_total_work - (l2_duration / 60.0), 2),
                    "night_hours": night_hours,
                    "compliance_status": "VALID" if s2_total_work <= 8.0 else "WARNING_OVERTIME",
                    "timeline_events": col['events']
                }

                driver_shifts.extend([shift1, shift2])

            elif duty_type in ['SPLIT', 'ROZRYVNYI']:
                # РОЗРИВНИЙ НАРЯД: 2 РІЗНІ ВАГОНИ (Вагон А для Зміни 1, Вагон Б для Зміни 2)
                # Зміна 1: Вагон А працює ранок (> 8 год) -> заїзд в депо на ТО.
                # Зміна 2: Вагон Б з депо виїжджає під тим же номером наряду.
                v1_num = f"Вг-{4000 + duty_num} (ТО Депо)"
                v2_num = f"Вг-{4500 + duty_num} (Резерв Депо)"

                mid_min = start_min + 480 # ~8 год першої зміни

                shift1 = {
                    "id": f"SHIFT_{route_id}_{duty_num}_SPLIT1",
                    "duty_number": duty_num,
                    "duty_type": "SPLIT",
                    "shift_index": 1,
                    "shift_name": "Розривна Зміна 1 (Вагон А -> ТО)",
                    "driver_id": f"DRV_{route_id}_{duty_num}_1",
                    "driver_name": f"Водій {duty_num}-1",
                    "driver_tab_num": f"Т-{1000 + duty_num * 2}",
                    "vehicle_num": v1_num,
                    "second_vehicle_num": v2_num,
                    "prep_time_min": prep_time_min,
                    "depot_arrival_time": depot_arrival_str,
                    "pullout_time": col['start_time'],
                    "start_time": depot_arrival_str,
                    "end_time": minutes_to_time(mid_min),
                    "lunch_start_time": minutes_to_time(start_min + 300),
                    "lunch_end_time": minutes_to_time(start_min + 300 + std_lunch_min),
                    "lunch_duration_min": std_lunch_min,
                    "paid_excess_break_min": 0,
                    "lunch_location": "ДП біля Депо",
                    "work_hours": 8.0,
                    "driving_hours": 7.75,
                    "night_hours": 0.0,
                    "compliance_status": "VALID",
                    "timeline_events": col['events']
                }

                shift2 = {
                    "id": f"SHIFT_{route_id}_{duty_num}_SPLIT2",
                    "duty_number": duty_num,
                    "duty_type": "SPLIT",
                    "shift_index": 2,
                    "shift_name": "Розривна Зміна 2 (Вагон Б з Депо)",
                    "driver_id": f"DRV_{route_id}_{duty_num}_2",
                    "driver_name": f"Водій {duty_num}-2",
                    "driver_tab_num": f"Т-{1001 + duty_num * 2}",
                    "vehicle_num": v2_num,
                    "second_vehicle_num": v1_num,
                    "prep_time_min": prep_time_min,
                    "depot_arrival_time": minutes_to_time(mid_min - prep_time_min),
                    "pullout_time": minutes_to_time(mid_min),
                    "start_time": minutes_to_time(mid_min - prep_time_min),
                    "end_time": col['end_time'],
                    "lunch_start_time": minutes_to_time(mid_min + 240),
                    "lunch_end_time": minutes_to_time(mid_min + 240 + std_lunch_min),
                    "lunch_duration_min": std_lunch_min,
                    "paid_excess_break_min": 0,
                    "lunch_location": "ДП біля Депо",
                    "work_hours": round((end_min - mid_min) / 60.0, 2),
                    "driving_hours": round((end_min - mid_min) / 60.0 - 0.25, 2),
                    "night_hours": round(max(0, end_min - 1320) / 60.0, 2),
                    "compliance_status": "VALID",
                    "timeline_events": col['events']
                }

                driver_shifts.extend([shift1, shift2])

            else:
                # ОДНОЗМІННИЙ АБО ПІКОВИЙ НАРЯД (1 зміна)
                total_work = (end_min - depot_arrival_min) / 60.0
                single_shift = {
                    "id": f"SHIFT_{route_id}_{duty_num}_SINGLE",
                    "duty_number": duty_num,
                    "duty_type": duty_type,
                    "shift_index": 1,
                    "shift_name": "Однозмінний наряд",
                    "driver_id": f"DRV_{route_id}_{duty_num}_1",
                    "driver_name": f"Водій {duty_num}",
                    "driver_tab_num": f"Т-{1000 + duty_num}",
                    "vehicle_num": f"Вг-{4000 + duty_num}",
                    "second_vehicle_num": None,
                    "prep_time_min": prep_time_min,
                    "depot_arrival_time": depot_arrival_str,
                    "pullout_time": col['start_time'],
                    "start_time": depot_arrival_str,
                    "end_time": col['end_time'],
                    "lunch_start_time": minutes_to_time(start_min + 300),
                    "lunch_end_time": minutes_to_time(start_min + 300 + std_lunch_min),
                    "lunch_duration_min": std_lunch_min,
                    "paid_excess_break_min": 0,
                    "lunch_location": col['events'][0].get('location', 'ДП «Паустовського»'),
                    "work_hours": round(total_work, 2),
                    "driving_hours": round(total_work - (std_lunch_min / 60.0), 2),
                    "night_hours": 0.0,
                    "compliance_status": "VALID",
                    "timeline_events": col['events']
                }
                driver_shifts.append(single_shift)

        return driver_shifts

shift_solver_engine = ShiftSolverEngine()
