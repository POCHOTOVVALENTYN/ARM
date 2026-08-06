# backend/app/services/transit_solver.py
import copy
from typing import List, Dict, Any

class TransitSolver:
    def __init__(self):
        # Константи для валідації (згідно з нормами)
        self.MAX_DRIVING_MINUTES = 240  # 4 години безперервного керування
        self.MIN_BREAK_MINUTES = 30     # Мінімальна тривалість обіду

    def apply_delay_cascade(self, schedule_data: List[Dict[str, Any]], block_id: str, start_time_min: int, delay_min: int) -> tuple[List[Dict[str, Any]], List[str]]:
        """
        Каскадно застосовує затримку до всіх наступних рейсів вагона (block_id) 
        і повертає оновлений розклад (deep copy) та список попереджень.
        """
        # Створюємо глибоку копію для уникнення пошкодження стану (RORO)
        updated_schedule = copy.deepcopy(schedule_data)
        warnings = []
        
        # 1. Каскадний зсув часу
        target_block = next((b for b in updated_schedule if b.get("block_id") == block_id), None)
        if not target_block or "trips" not in target_block:
            return updated_schedule, ["КРИТИЧНО: Блок не знайдено."]

        for trip in target_block["trips"]:
            if trip.get("start_time", 0) >= start_time_min:
                trip["start_time"] += delay_min
                trip["end_time"] += delay_min
                trip["is_delayed"] = True

        # 2. Валідація обідніх перерв для зміненого блоку
        block_trips = sorted(target_block["trips"], key=lambda x: x.get("start_time", 0))
        
        continuous_driving_time = 0
        
        for i in range(len(block_trips) - 1):
            current_trip = block_trips[i]
            next_trip = block_trips[i+1]
            
            # Рахуємо час у дорозі
            trip_duration = current_trip.get("end_time", 0) - current_trip.get("start_time", 0)
            continuous_driving_time += trip_duration
            
            # Рахуємо час стоянки (перерви) між рейсами
            break_duration = next_trip.get("start_time", 0) - current_trip.get("end_time", 0)
            
            if break_duration >= self.MIN_BREAK_MINUTES:
                # Обід відбувся, скидаємо лічильник водіння
                continuous_driving_time = 0
            elif break_duration < 0:
                warnings.append(f"КРИТИЧНО: Накладання рейсів для борту {block_id}.")
            
            if continuous_driving_time > self.MAX_DRIVING_MINUTES:
                warnings.append(f"ПОРУШЕННЯ: Водій борту {block_id} перевищив ліміт керування ({int(continuous_driving_time)} хв без обіду).")

        return updated_schedule, warnings

transit_solver = TransitSolver()
