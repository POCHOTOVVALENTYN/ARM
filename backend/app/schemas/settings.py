from pydantic import BaseModel
from typing import List, Optional

class DepotCreate(BaseModel):
    id: str
    name: str
    type: str
    address: str
    lat: float
    lng: float
    prepTimeMin: int

class HubNodeCreate(BaseModel):
    id: str
    name: str
    locationDescription: str
    availableTracksCount: int
    minHeadwayMin: int
    routesConnecting: List[str]
    channels: List[str]

class RouteDepotConfigCreate(BaseModel):
    id: str
    routeId: str
    primaryDepotId: str
    secondaryDepotId: str
    defaultOutboundTime: int
    defaultInboundTime: int

class BreakLocationConfigCreate(BaseModel):
    id: str
    routeId: str
    locationId: str
    locationName: str
    locationType: str
    maxCapacityVehicles: int
    durationMin: int

class SystemConfigBase(BaseModel):
    map_tile_url: Optional[str] = None
    map_attribution: Optional[str] = None
    enterprise_logo_url: Optional[str] = None
    theme: Optional[str] = None

    # Технологічні нормативи підприємства (КП «Одесміськелектротранс»)
    prep_time_tram_min: Optional[int] = 10
    prep_time_trolleybus_min: Optional[int] = 19
    lunch_window_start_hours: Optional[float] = 4.0
    lunch_window_end_hours: Optional[float] = 6.0
    interline_min_headway_min: Optional[float] = 2.0
    interline_max_headway_min: Optional[float] = 3.0
    min_intershift_rest_hours: Optional[float] = 12.0
    max_single_shift_hours: Optional[float] = 8.0

class SystemConfigUpdate(SystemConfigBase):
    pass

class SystemConfigResponse(SystemConfigBase):
    id: int

    class Config:
        from_attributes = True

