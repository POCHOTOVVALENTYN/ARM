# backend/app/services/transit_solver.py
from typing import List, Dict, Any

class TransitSolver:
    def __init__(self):
        # Константи для валідації (згідно з нормами)
        self.MAX_DRIVING_MINUTES = 240  # 4 години безперервного керування
        self.MIN_BREAK_MINUTES = 30     # Мінімальна тривалість обіду

    def apply_delay_cascade(self, schedule_data: List[Dict[str, Any]], block_id: str, start_time_sec: int, delay_sec: int) -> tuple[List[Dict[str, Any]], List[str]]:
        """
        Каскадно застосовує затримку до всіх наступних рейсів вагона (block_id) 
        і повертає оновлений розклад та список попереджень.
        """
        updated_schedule = []
        warnings = []
        
        # 1. Каскадний зсув часу
        for trip in schedule_data:
            if trip.get("block_id") == block_id and trip.get("departure_time") >= start_time_sec:
                # Зсуваємо час відправлення та прибуття
                trip["departure_time"] += delay_sec
                trip["arrival_time"] += delay_sec
                trip["is_delayed"] = True
            updated_schedule.append(trip)

        # 2. Валідація обідніх перерв для зміненого блоку
        block_trips = sorted(
            [t for t in updated_schedule if t.get("block_id") == block_id], 
            key=lambda x: x["departure_time"]
        )
        
        continuous_driving_time = 0
        
        for i in range(len(block_trips) - 1):
            current_trip = block_trips[i]
            next_trip = block_trips[i+1]
            
            # Рахуємо час у дорозі
            trip_duration = (current_trip["arrival_time"] - current_trip["departure_time"]) / 60
            continuous_driving_time += trip_duration
            
            # Рахуємо час стоянки (перерви) між рейсами
            break_duration = (next_trip["departure_time"] - current_trip["arrival_time"]) / 60
            
            if break_duration >= self.MIN_BREAK_MINUTES:
                # Обід відбувся, скидаємо лічильник водіння
                continuous_driving_time = 0
            elif break_duration < 0:
                warnings.append(f"КРИТИЧНО: Накладання рейсів для борту {block_id}.")
            
            if continuous_driving_time > self.MAX_DRIVING_MINUTES:
                warnings.append(f"ПОРУШЕННЯ: Водій борту {block_id} перевищив ліміт керування ({int(continuous_driving_time)} хв без обіду).")

        return updated_schedule, warnings

transit_solver = TransitSolver()
