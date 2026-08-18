from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class DriverAlertCreate(BaseModel):
    vehicle_id: str
    driver_id: str
    route_id: str
    alert_type: str # ACCIDENT_TRACK, POWER_OUTAGE, VEHICLE_BREAKDOWN, MEDICAL_EMERGENCY, TRAFFIC_LIGHT_DELAY, CUSTOM
    message: str
    lat: Optional[float] = None
    lng: Optional[float] = None

class DriverAlertResponse(BaseModel):
    id: int
    vehicle_id: str
    driver_id: str
    route_id: str
    alert_type: str
    message: str
    status: str # NEW, SEEN, ACKNOWLEDGED, RESOLVED
    lat: Optional[float] = None
    lng: Optional[float] = None
    created_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    dispatcher_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class DispatcherDirectiveCreate(BaseModel):
    vehicle_id: str
    driver_id: Optional[str] = None
    route_id: Optional[str] = None
    directive_type: str # DETOUR, SPEED_UP, SLOW_DOWN, HOLD_AT_STOP, DEPOT_RETURN, CUSTOM
    message: str

class DispatcherDirectiveResponse(BaseModel):
    id: int
    vehicle_id: str
    driver_id: Optional[str] = None
    route_id: Optional[str] = None
    directive_type: str
    message: str
    is_acknowledged: bool = False
    acknowledged_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    dispatcher_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
