from pydantic import BaseModel, Field
from typing import List
from datetime import time
from app.models.schedule import TripDirection

# --- ВХІДНІ ДАНІ (Request) ---

class StopTimeConfig(BaseModel):
    stop_id: str
    travel_time_to_next: float = Field(..., description="Час ходу до наступної зупинки у хвилинах")

class GenerateGridRequest(BaseModel):
    route_id: str
    num_vehicles: int = Field(..., gt=0)
    start_time_minutes: int = Field(..., description="Хвилини від опівночі (напр., 360 для 06:00)")
    end_time_minutes: int = Field(..., description="Хвилини від опівночі (напр., 1380 для 23:00)")
    layover_minutes: int = Field(..., description="Час відстою на кінцевій")
    stops_forward: List[StopTimeConfig]
    stops_backward: List[StopTimeConfig]

# --- ВИХІДНІ ДАНІ (Response) ---

class StaticStopTimeResponse(BaseModel):
    stop_id: str
    stop_sequence: int
    arrival_time: time
    departure_time: time

    class Config:
        from_attributes = True

class StaticTripResponse(BaseModel):
    trip_sequence: int
    direction: TripDirection
    smoothing_state: str = "normal"
    smoothing_delta: float = 0.0
    stop_times: List[StaticStopTimeResponse]

    class Config:
        from_attributes = True

class StaticShiftResponse(BaseModel):
    id: int
    shift_sequence: int
    has_break: bool
    break_start_time: time | None = None
    break_duration_minutes: int | None = None
    trips: List[StaticTripResponse]

    class Config:
        from_attributes = True

class StaticDutyResponse(BaseModel):
    id: int
    duty_number: str
    shifts: List[StaticShiftResponse]

    class Config:
        from_attributes = True
