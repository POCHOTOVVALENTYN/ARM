from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Trip(BaseModel):
    id: str
    route_id: str
    start_time: int  # час у хвилинах від початку доби
    end_time: int
    start_station_id: str
    end_station_id: str

class VehicleBlock(BaseModel):
    block_id: str
    vehicle_type: str  # 'TRAM' або 'TROLLEYBUS'
    trips: List[Trip]

class ShiftValidation(BaseModel):
    duty_id: str
    is_valid: bool = True
    errors: List[str] = []

class IncidentEvent(BaseModel):
    trip_id: str
    node_id: str
    delay_minutes: int
    incident_type: str

class RecalculationRequest(BaseModel):
    incident: IncidentEvent
    current_blocks: List[VehicleBlock]
    safety_headway: int = Field(default=2)


class VehiclePosition(BaseModel):
    vehicle_id: str
    lat: float
    lon: float
    speed: float
    timestamp: float
    status: str  # 'ACTIVE', 'OFFLINE', 'ANOMALY'

class HotReserveActivationRequest(BaseModel):
    reserve_vehicle_id: str = Field(..., description="Ідентифікатор борту гарячого резерву")
    target_trip_id: str = Field(..., description="Ідентифікатор рейсу, який потребує заміни")
    incident_id: Optional[str] = Field(None, description="ID інциденту (якщо резерв викликано через ДТП/поламку)")
    reason: str = Field(..., description="Причина введення резерву")

class HotReserveActivationResponse(BaseModel):
    status: str
    trip_id: str
    new_vehicle_id: str
    activation_time: datetime

class DriverAssignRequest(BaseModel):
    driver_id: str
    vehicle_id: str

class DriverStatusUpdate(BaseModel):
    status: str  # 'WORK', 'BREAK', 'OFF'

class StationStatusUpdate(BaseModel):
    status: str  # 'ACTIVE', 'OFFLINE', 'MAINTENANCE'

class EtaUpdateRequest(BaseModel):
    trip_id: str
    station_id: str
    estimated_arrival_time: datetime
    actual_arrival_time: Optional[datetime] = None
