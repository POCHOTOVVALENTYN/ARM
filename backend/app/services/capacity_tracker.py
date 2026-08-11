from typing import Dict

class StationCapacityTracker:
    def __init__(self, stations_capacity: Dict[str, int]):
        # station_id -> максимальна місткість
        self.limits = stations_capacity 
        # station_id -> minute -> к-сть вагонів, що стоять у цю хвилину
        self.usage: Dict[str, Dict[int, int]] = {st: {} for st in stations_capacity}

    def can_accommodate(self, station_id: str, start_min: int, end_min: int) -> bool:
        """Перевіряє, чи не буде перевищено ліміт колій у заданий проміжок часу"""
        if station_id not in self.limits or self.limits[station_id] == 0:
            return False
            
        limit = self.limits[station_id]
        for minute in range(start_min, end_min + 1):
            if self.usage[station_id].get(minute, 0) >= limit:
                return False # Хоча б в одну хвилину колії забиті
        return True

    def book_slot(self, station_id: str, start_min: int, end_min: int):
        """Бронює колію на станції під обід"""
        for minute in range(start_min, end_min + 1):
            self.usage[station_id][minute] = self.usage[station_id].get(minute, 0) + 1
