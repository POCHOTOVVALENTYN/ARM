from app.services.elastic_smoother import ElasticSmoother

class ScheduleEnginePipeline:
    def __init__(self, params):
        self.params = params
        self.duties = []

    def execute(self):
        # 1. Створюємо ідеальну маятникову сітку
        self._generate_base_grid()
        
        # 2. Нарізаємо на зміни (ранок/вечір/пік), додаємо нульові рейси в/з депо
        self._apply_duty_types_and_depot_runs()
        
        # 3. Розподіляємо обіди, перевіряючи місткість (Break Allocator)
        # Це створить "дірки" у розкладі
        self._allocate_staggered_breaks()
        
        # 4. Згладжуємо утворені дірки еластичним методом
        base_headway = self._calculate_base_headway()
        smoother = ElasticSmoother(self.duties, base_headway)
        self.duties = smoother.execute()
        
        # 5. Конвертуємо всі `minute` у `datetime.time` для SQLAlchemy
        self._finalize_time_formats()
        
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

    def _calculate_base_headway(self):
        time_forward = sum(s.travel_time_to_next for s in self.params.stops_forward)
        time_backward = sum(s.travel_time_to_next for s in self.params.stops_backward)
        round_trip_time = time_forward + self.params.layover_minutes + time_backward + self.params.layover_minutes
        return round_trip_time / self.params.num_vehicles

    def _finalize_time_formats(self):
        pass
