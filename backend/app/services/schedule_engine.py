from app.services.elastic_smoother import ElasticSmoother

class ScheduleEnginePipeline:
    def __init__(self, params):
        self.params = params
        self.duties = []

    def execute(self):
        # Прохід 1: Базова сітка (ідеальні умови)
        self._generate_base_grid()
        
        # Прохід 2: Виїзди, Заїзди та Розриви змін
        self._apply_duty_types_and_depot_runs()
        
        # Прохід 3: Призначення обідів у шаховому порядку
        self._allocate_staggered_breaks()
        
        # Прохід 4: Еластичне згладжування (Нагін/Відтяжка)
        self._apply_elastic_smoothing()
        
        return self.duties
        
    def _generate_base_grid(self):
        pass
        
    def _apply_duty_types_and_depot_runs(self):
        pass

    def _allocate_staggered_breaks(self):
        """
        Логіка шахового порядку. 
        Перевіряє break_capacity станції (напр. Старосінна = 4, інші = 1-2).
        """
        for duty in self.duties:
            for shift in duty.shifts:
                if getattr(shift, 'requires_break', False):
                    # Шукаємо найближчу кінцеву у вікні 4-6 годин
                    # Якщо ліміт станції вичерпано (інші вже обідають) -> переносимо обід на наступне коло
                    pass

    def _apply_elastic_smoothing(self):
        """Прохід 4: Еластичне згладжування інтервалів"""
        # Розраховуємо базовий інтервал (headway) для поточного маршруту
        time_forward = sum(s.travel_time_to_next for s in self.params.stops_forward)
        time_backward = sum(s.travel_time_to_next for s in self.params.stops_backward)
        round_trip_time = time_forward + self.params.layover_minutes + time_backward + self.params.layover_minutes
        base_headway = round_trip_time / self.params.num_vehicles

        smoother = ElasticSmoother(self.duties, base_headway)
        smoother.execute()
