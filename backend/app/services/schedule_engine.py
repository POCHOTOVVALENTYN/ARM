from app.services.elastic_smoother import ElasticSmoother
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from app.models.schedule import Schedule, ScheduleStatus, StaticDuty, StaticShift, StaticTrip, StaticStopTime

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

    async def execute_and_save_draft(self, db: AsyncSession, route_id: str, target_date: date) -> int:
        duties_data = self.execute()
        
        new_schedule = Schedule(
            route_id=route_id,
            active_date=target_date,
            status=ScheduleStatus.DRAFT
        )
        db.add(new_schedule)
        await db.flush()
        
        for duty_dict in duties_data:
            duty_obj = StaticDuty(
                schedule_id=new_schedule.id,
                route_id=route_id,
                duty_number=duty_dict["duty_number"],
                service_id=duty_dict.get("service_id", "WORKDAY"),
                duty_type=duty_dict.get("duty_type", "SINGLE")
            )
            
            for shift_dict in duty_dict.get("shifts", []):
                shift_obj = StaticShift(
                    shift_sequence=shift_dict.get("shift_sequence", 1),
                    has_break=shift_dict.get("has_break", False),
                    break_start_time=shift_dict.get("break_start_time"),
                    break_duration_minutes=shift_dict.get("break_duration_minutes")
                )
                
                for trip_dict in shift_dict.get("trips", []):
                    trip_obj = StaticTrip(
                        trip_sequence=trip_dict["trip_sequence"],
                        direction=trip_dict["direction"],
                        smoothing_state=trip_dict.get("smoothing_state", "normal"),
                        smoothing_delta=trip_dict.get("smoothing_delta", 0.0)
                    )
                    
                    for st_dict in trip_dict["stop_times"]:
                        trip_obj.stop_times.append(StaticStopTime(
                            stop_id=st_dict["stop_id"],
                            stop_sequence=st_dict["stop_sequence"],
                            arrival_time=st_dict["arrival_time"],
                            departure_time=st_dict["departure_time"],
                            is_break_location=st_dict.get("is_break_location", False)
                        ))
                        
                    shift_obj.trips.append(trip_obj)
                duty_obj.shifts.append(shift_obj)
            db.add(duty_obj)
            
        await db.commit()
        return new_schedule.id
        
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
