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
