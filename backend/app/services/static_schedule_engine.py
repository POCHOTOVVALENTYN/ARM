from datetime import time
from typing import List, Dict, Any
from app.schemas.schedule import GenerateGridRequest

class StaticScheduleEngine:
    
    @staticmethod
    def _minutes_to_time(minutes_float: float) -> time:
        """Конвертує абстрактні хвилини від опівночі в об'єкт datetime.time"""
        total_seconds = int(minutes_float * 60)
        hours = (total_seconds // 3600) % 24
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        return time(hour=hours, minute=minutes, second=seconds)

    @classmethod
    def build_grid_data(cls, params: GenerateGridRequest) -> List[Dict[str, Any]]:
        """Генерує детерміновану сітку нарядів у пам'яті"""
        time_forward = sum(s.travel_time_to_next for s in params.stops_forward)
        time_backward = sum(s.travel_time_to_next for s in params.stops_backward)
        
        round_trip_time = time_forward + params.layover_minutes + time_backward + params.layover_minutes
        headway = round_trip_time / params.num_vehicles

        duties_data = []

        for i in range(params.num_vehicles):
            current_min = params.start_time_minutes + (i * headway)
            trips_data = []
            trip_counter = 1
            
            while current_min < params.end_time_minutes:
                # --- Генерація прямого рейсу ---
                forward_stop_times = []
                trip_min = current_min
                
                for seq, stop_cfg in enumerate(params.stops_forward, start=1):
                    t_point = cls._minutes_to_time(trip_min)
                    forward_stop_times.append({
                        "stop_id": stop_cfg.stop_id,
                        "stop_sequence": seq,
                        "arrival_time": t_point,
                        "departure_time": t_point # Для транзиту без тривалих зупинок
                    })
                    trip_min += stop_cfg.travel_time_to_next
                
                trips_data.append({
                    "trip_sequence": trip_counter,
                    "direction": "FORWARD",
                    "stop_times": forward_stop_times
                })
                trip_counter += 1
                current_min += time_forward + params.layover_minutes
                
                if current_min >= params.end_time_minutes:
                    break
                    
                # --- Генерація зворотного рейсу ---
                backward_stop_times = []
                trip_min = current_min
                
                for seq, stop_cfg in enumerate(params.stops_backward, start=1):
                    t_point = cls._minutes_to_time(trip_min)
                    backward_stop_times.append({
                        "stop_id": stop_cfg.stop_id,
                        "stop_sequence": seq,
                        "arrival_time": t_point,
                        "departure_time": t_point
                    })
                    trip_min += stop_cfg.travel_time_to_next
                    
                trips_data.append({
                    "trip_sequence": trip_counter,
                    "direction": "BACKWARD",
                    "stop_times": backward_stop_times
                })
                trip_counter += 1
                current_min += time_backward + params.layover_minutes
                
            duties_data.append({
                "duty_number": str(i + 1),
                "trips": trips_data
            })
            
        return duties_data
