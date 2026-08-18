from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from typing import List, Dict, Any
from app.models.schedule import Schedule, ScheduleStatus, StaticDuty, StaticShift, StaticTrip, StaticStopTime, ServiceDay, DutyType, TripDirection
from app.services.transit_solver import generate_optimized_schedule, parse_time_str, minutes_to_time

class ScheduleEnginePipeline:
    def __init__(self, params):
        self.params = params

    def execute(self) -> Dict[str, Any]:
        """Генерує оптимізовану сітку розкладу за параметрами."""
        return generate_optimized_schedule(
            route_id=self.params.route_id,
            vehicles_count=getattr(self.params, "num_vehicles", getattr(self.params, "vehicles_count", 10)),
            start_time=getattr(self.params, "start_time", "05:30"),
            end_time=getattr(self.params, "end_time", "23:00"),
            route_length_km=getattr(self.params, "route_length_km", 11.5),
            avg_speed_kmh=getattr(self.params, "avg_speed_kmh", 14.5),
            zero_trip_min=getattr(self.params, "zero_trip_min", 15),
            use_elastic_smoother=getattr(self.params, "use_elastic_smoother", True)
        )
