from pydantic import BaseModel, Field
from typing import List, Optional

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
