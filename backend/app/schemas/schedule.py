from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import time, date, datetime
from app.models.schedule import TripDirection, ScheduleStatus, DutyType

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
    stops_forward: List[StopTimeConfig] = []
    stops_backward: List[StopTimeConfig] = []

# --- ВИХІДНІ ДАНІ (Response) ---

class StaticStopTimeResponse(BaseModel):
    id: int
    stop_id: str
    stop_sequence: int
    arrival_time: time
    departure_time: time
    is_break_location: bool = False
    is_control_point: bool = False

    model_config = ConfigDict(from_attributes=True)

class StaticTripResponse(BaseModel):
    id: int
    trip_sequence: int
    direction: TripDirection
    trip_type: str = "REGULAR"
    is_zero_run: bool = False
    smoothing_state: str = Field(default="normal")
    smoothing_delta: float = Field(default=0.0)
    stop_times: List[StaticStopTimeResponse] = []

    model_config = ConfigDict(from_attributes=True)

class StaticShiftResponse(BaseModel):
    id: int
    shift_sequence: int
    vehicle_id: Optional[str] = None
    has_break: bool
    break_start_time: Optional[time] = None
    break_duration_minutes: Optional[int] = None
    trips: List[StaticTripResponse] = []

    model_config = ConfigDict(from_attributes=True)

class StaticDutyResponse(BaseModel):
    id: int
    duty_number: str
    duty_type: DutyType = DutyType.DOUBLE
    shifts: List[StaticShiftResponse] = []

    model_config = ConfigDict(from_attributes=True)

class ScheduleResponse(BaseModel):
    id: int
    route_id: str
    active_date: date
    status: ScheduleStatus
    version_name: Optional[str] = "Еталонний розклад"
    created_at: datetime
    duties: List[StaticDutyResponse] = []

    model_config = ConfigDict(from_attributes=True)
