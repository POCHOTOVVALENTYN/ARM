from typing import List
from app.services.capacity_tracker import StationCapacityTracker

class ShiftBreakAllocator:
    def __init__(self, duties_data: List[dict], tracker: StationCapacityTracker):
        self.duties = duties_data
        self.tracker = tracker
        
        # Константи (можуть витягуватися з БД)
        self.MIN_WORK_BEFORE_BREAK = 240 # 4 години
        self.MAX_WORK_BEFORE_BREAK = 360 # 6 годин
        self.BREAK_DURATION = 15         # 15 хв для трамвая

    def execute(self) -> List[dict]:
        """Головний метод розподілу обідів"""
        
        # 1. Збираємо всі зміни з усіх нарядів у єдиний плоский список
        all_shifts = []
        for duty in self.duties:
            for shift in duty.get("shifts", []):
                all_shifts.append(shift)
                
        # 2. Сортуємо зміни за часом початку (FIFO), щоб перші вагони першими займали місця
        all_shifts.sort(key=lambda s: s["start_time_minutes"])

        # 3. Розподіл
        for shift in all_shifts:
            self._allocate_break_for_shift(shift)

        return self.duties

    def _allocate_break_for_shift(self, shift: dict):
        shift_start = shift["start_time_minutes"]
        
        # Кандидати на обід (можливі зупинки на кінцевих)
        candidates = []
        
        # Проходимо по всіх рейсах зміни, щоб знайти диспетчерські у потрібному вікні
        for trip in shift["trips"]:
            last_stop = trip["stop_times"][-1] # Кінцева зупинка рейсу
            arrival_min = last_stop["arrival_minute"]
            
            worked_time = arrival_min - shift_start
            
            # Перевіряємо, чи потрапляє прибуття у вікно 4-6 годин
            if self.MIN_WORK_BEFORE_BREAK <= worked_time <= self.MAX_WORK_BEFORE_BREAK:
                if last_stop.get("is_dispatch_station"):
                    candidates.append({
                        "trip": trip,
                        "stop": last_stop,
                        "arrival": arrival_min,
                        "worked_time": worked_time
                    })

        # Якщо є кандидати, пробуємо їх забронювати, починаючи з найближчого до ідеальних 5 годин (300 хв)
        candidates.sort(key=lambda c: abs(c["worked_time"] - 300))

        for candidate in candidates:
            station_id = candidate["stop"]["stop_id"]
            start_break = candidate["arrival"]
            end_break = start_break + self.BREAK_DURATION
            
            if self.tracker.can_accommodate(station_id, start_break, end_break):
                # Бронюємо місце (шаховий порядок дотримано)
                self.tracker.book_slot(station_id, start_break, end_break)
                
                # Записуємо дані про обід у зміну
                shift["has_break"] = True
                shift["break_start_min"] = start_break
                
                # Мутуємо час відправлення рейсу та зсуваємо ВСІ наступні рейси цієї зміни вперед на 15 хв
                self._shift_subsequent_schedule(shift, candidate["trip"]["trip_sequence"], self.BREAK_DURATION)
                return # Обід успішно призначено

        # Fallback: Якщо всі диспетчерські забиті, беремо першого кандидата, 
        # і посуваємо його розклад до першої ВІЛЬНОЇ хвилини на станції (робимо відтяжку в дорозі або на кінцевій)
        self._resolve_capacity_conflict(shift, candidates)
        
    def _resolve_capacity_conflict(self, shift: dict, candidates: List[dict]):
        if not candidates:
            return
            
        # Беремо найкращого кандидата (вже відсортовані, перший = найближчий до ідеального часу)
        candidate = candidates[0]
        station_id = candidate["stop"]["stop_id"]
        arrival_min = candidate["arrival"]
        
        # Скануємо таймлайн з кроком +1 хвилина, поки не знайдемо вільне вікно для обіду
        current_start = arrival_min
        while True:
            end_break = current_start + self.BREAK_DURATION
            if self.tracker.can_accommodate(station_id, current_start, end_break):
                break
            current_start += 1
            
        # Розраховуємо час "відтяжки" (очікування колії)
        wait_time = current_start - arrival_min
        
        # Бронюємо знайдене вікно
        self.tracker.book_slot(station_id, current_start, end_break)
        
        # Записуємо обід
        shift["has_break"] = True
        shift["break_start_min"] = current_start
        
        # Загальна затримка для наступних рейсів: очікування + тривалість обіду
        total_delay = wait_time + self.BREAK_DURATION
        
        self._shift_subsequent_schedule(shift, candidate["trip"]["trip_sequence"], total_delay)

    def _shift_subsequent_schedule(self, shift: dict, from_trip_seq: int, delay_minutes: int):
        """Зміщує розклад всіх наступних рейсів зміни після обіду"""
        for trip in shift["trips"]:
            if trip["trip_sequence"] >= from_trip_seq:
                for st in trip["stop_times"]:
                    # Додаємо час обіду до відправлення з поточної і прибуття на наступні
                    # Логіка оновлення хвилин -> datetime.time відбувається перед записом в БД
                    st["arrival_minute"] += delay_minutes
                    st["departure_minute"] += delay_minutes
