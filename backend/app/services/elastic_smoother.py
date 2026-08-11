from typing import List, Dict

class ElasticSmoother:
    def __init__(self, duties: List[dict], base_headway: float):
        self.duties = duties
        self.base_headway = base_headway
        
        # Константи еластичності (можна винести в БД/конфіг)
        self.MAX_DELAY_MINUTES = 4.0      # Максимальна відтяжка на кінцевій (хв)
        self.CATCHUP_FACTOR = 0.85        # Дозволений нагін (швидше на 15%)
        self.SMOOTHING_RADIUS = 3         # Кількість вагонів до/після дірки для згладжування

    def execute(self):
        """Головний метод згладжування"""
        # 1. Формуємо плоский хронологічний список всіх рейсів прямого напрямку (FORWARD)
        all_forward_trips = self._get_chronological_trips("FORWARD")
        
        # 2. Знаходимо "дірки" (інтервали, що суттєво перевищують базові)
        gaps = self._find_gaps(all_forward_trips)
        
        # 3. Застосовуємо згладжування для кожної дірки
        for gap in gaps:
            self._smooth_gap(all_forward_trips, gap["index"], gap["delta"])

    def _get_chronological_trips(self, direction: str) -> List[dict]:
        """Повертає всі рейси заданого напрямку, відсортовані за часом відправлення"""
        trips = []
        for duty in self.duties:
            for shift in duty.get("shifts", []):
                for trip in shift.get("trips", []):
                    if trip["direction"] == direction and trip["stop_times"]:
                        trips.append({
                            "duty_number": duty["duty_number"],
                            "trip": trip,
                            "start_time": trip["stop_times"][0]["departure_minute"]
                        })
        return sorted(trips, key=lambda t: t["start_time"])

    def _find_gaps(self, sorted_trips: List[dict]) -> List[dict]:
        """Аналізує фактичні інтервали і знаходить аномалії"""
        gaps = []
        for i in range(1, len(sorted_trips)):
            actual_headway = sorted_trips[i]["start_time"] - sorted_trips[i-1]["start_time"]
            
            # Якщо інтервал більший за базовий на 50% — це "дірка", яку треба згладити
            if actual_headway > self.base_headway * 1.5:
                delta = actual_headway - self.base_headway
                gaps.append({
                    "index": i,          # Індекс вагона, що йде ПІСЛЯ дірки
                    "delta": delta       # Зайві хвилини, які треба "розмазати"
                })
        return gaps

    def _smooth_gap(self, sorted_trips: List[dict], gap_index: int, delta: float):
        """
        Розподіляє дельту між сусідніми вагонами.
        Вагони ДО дірки - відтягуються. Вагони ПІСЛЯ дірки - наганяють час.
        """
        # --- 1. Відтяжка (Delay) для вагонів ПЕРЕД діркою ---
        delay_step = min(delta / (self.SMOOTHING_RADIUS * 2), self.MAX_DELAY_MINUTES)
        
        for step, idx in enumerate(range(gap_index - 1, max(-1, gap_index - 1 - self.SMOOTHING_RADIUS), -1)):
            delay_amount = delay_step * (self.SMOOTHING_RADIUS - step)
            target_trip = sorted_trips[idx]["trip"]
            self._apply_delay(target_trip, delay_amount)

        # --- 2. Нагін (Catch-up) для вагонів ПІСЛЯ дірки ---
        # Нагін реалізується за рахунок стиснення travel_time_to_next
        for step, idx in enumerate(range(gap_index, min(len(sorted_trips), gap_index + self.SMOOTHING_RADIUS))):
            target_trip = sorted_trips[idx]["trip"]
            self._apply_catchup(target_trip, self.CATCHUP_FACTOR)

    def _apply_delay(self, trip: dict, delay_minutes: float):
        """Зміщує весь рейс вперед (відтяжка на кінцевій)"""
        for st in trip["stop_times"]:
            st["arrival_minute"] += delay_minutes
            st["departure_minute"] += delay_minutes

    def _apply_catchup(self, trip: dict, catchup_factor: float):
        """Прискорює рейс, пропорційно зменшуючи час ходу між зупинками"""
        if not trip["stop_times"]:
            return
            
        start_time = trip["stop_times"][0]["departure_minute"]
        current_time = start_time
        
        for i in range(len(trip["stop_times"]) - 1):
            current_stop = trip["stop_times"][i]
            next_stop = trip["stop_times"][i+1]
            
            # Оригінальний час ходу
            travel_time = next_stop["arrival_minute"] - current_stop["departure_minute"]
            
            # Новий прискорений час ходу
            fast_travel_time = travel_time * catchup_factor
            
            current_time += fast_travel_time
            next_stop["arrival_minute"] = current_time
            next_stop["departure_minute"] = current_time # Якщо транзитна зупинка
