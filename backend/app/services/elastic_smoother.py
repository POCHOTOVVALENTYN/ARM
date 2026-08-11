from typing import List, Dict

class ElasticSmoother:
    def __init__(self, duties_data: List[dict], base_headway: float):
        self.duties = duties_data
        self.base_headway = base_headway
        
        # Налаштування еластичності
        self.MAX_DELAY_MINUTES = 3.0       # Максимальна відтяжка на кінцевій
        self.MAX_CATCHUP_FACTOR = 0.85     # Максимальний нагін (їхати за 85% від базового часу)
        self.SMOOTHING_RADIUS = 2          # Кількість нарядів до/після дірки для компенсації
        self.GAP_THRESHOLD = 1.5           # Вважати діркою, якщо інтервал > 1.5 * headway

    def execute(self) -> List[dict]:
        """Точка входу. Згладжує обидва напрямки незалежно."""
        for direction in ["FORWARD", "BACKWARD"]:
            chronological_trips = self._get_chronological_trips(direction)
            gaps = self._find_gaps(chronological_trips)
            
            # Згладжуємо кожну знайдену дірку
            for gap in gaps:
                self._smooth_gap(chronological_trips, gap["index"], gap["delta"])
                
        return self.duties

    def _get_chronological_trips(self, direction: str) -> List[dict]:
        """Збирає всі рейси напрямку і сортує за часом відправлення"""
        trips_list = []
        for duty in self.duties:
            for shift in duty.get("shifts", []):
                for trip in shift.get("trips", []):
                    if trip["direction"] == direction and trip["stop_times"]:
                        # Беремо час відправлення з першої зупинки
                        start_min = trip["stop_times"][0]["departure_minute"]
                        trips_list.append({
                            "duty_number": duty["duty_number"],
                            "trip": trip,
                            "start_minute": start_min
                        })
                        
        # Сортування за часом старту
        return sorted(trips_list, key=lambda t: t["start_minute"])

    def _find_gaps(self, sorted_trips: List[dict]) -> List[dict]:
        """Шукає аномальні інтервали між відправленнями"""
        gaps = []
        for i in range(1, len(sorted_trips)):
            actual_headway = sorted_trips[i]["start_minute"] - sorted_trips[i-1]["start_minute"]
            
            if actual_headway > (self.base_headway * self.GAP_THRESHOLD):
                delta = actual_headway - self.base_headway
                gaps.append({
                    "index": i,    # Індекс рейсу, що їде ПІСЛЯ дірки
                    "delta": delta # Зайвий час, який треба розмазати
                })
        return gaps

    def _smooth_gap(self, sorted_trips: List[dict], gap_index: int, delta: float):
        """
        Механіка "гумової стрічки":
        Вагони ДО дірки відтягуються назад.
        Вагони ПІСЛЯ дірки наганяють розклад.
        """
        # Розподіляємо компенсацію порівну між відтяжкою та нагоном
        compensation_needed = delta / 2.0 
        
        # 1. ВІДТЯЖКА (Delay) для вагонів ПЕРЕД діркою
        delay_step = min(compensation_needed / self.SMOOTHING_RADIUS, self.MAX_DELAY_MINUTES)
        
        for step in range(self.SMOOTHING_RADIUS):
            trip_idx = gap_index - 1 - step
            if trip_idx >= 0:
                # Вагон ближче до дірки отримує більшу відтяжку
                delay_amount = delay_step * (self.SMOOTHING_RADIUS - step)
                self._apply_delay(sorted_trips[trip_idx]["trip"], delay_amount)

        # 2. НАГІН (Catch-up) для вагонів ПІСЛЯ дірки
        for step in range(self.SMOOTHING_RADIUS):
            trip_idx = gap_index + step
            if trip_idx < len(sorted_trips):
                # Нагін реалізується через компресію часу між зупинками
                self._apply_catchup(sorted_trips[trip_idx]["trip"], self.MAX_CATCHUP_FACTOR)

    def _apply_delay(self, trip: dict, delay_minutes: float):
        """Зсуває всі зупинки рейсу вперед у часі (імітація затримки відправлення)"""
        for st in trip["stop_times"]:
            st["arrival_minute"] += delay_minutes
            st["departure_minute"] += delay_minutes

    def _apply_catchup(self, trip: dict, catchup_factor: float):
        """
        Прискорює рейс на маршруті. Відправлення з першої зупинки залишається тим самим, 
        але час прибуття на наступні зупинки скорочується.
        """
        stop_times = trip["stop_times"]
        if not stop_times:
            return
            
        current_time = stop_times[0]["departure_minute"]
        
        for i in range(len(stop_times) - 1):
            current_st = stop_times[i]
            next_st = stop_times[i+1]
            
            # Оригінальний час проїзду до наступної зупинки
            original_travel_time = next_st["arrival_minute"] - current_st["departure_minute"]
            
            # Стиснутий час (нагін)
            fast_travel_time = original_travel_time * catchup_factor
            
            current_time += fast_travel_time
            
            # Оновлюємо розклад для наступної зупинки
            next_st["arrival_minute"] = current_time
            # Якщо це не кінцева/обід, відправлення дорівнює прибуттю
            if not next_st.get("is_break_location", False):
                next_st["departure_minute"] = current_time
