from pydantic import BaseModel
from typing import List, Optional

class AffectedRouteCreate(BaseModel):
    routeId: str
    detourType: str
    temporaryTerminals: List[str]
    description: str

class EmergencyTemplateCreate(BaseModel):
    id: str
    title: str
    type: str
    severity: str
    affectedRoutes: List[AffectedRouteCreate]
    instructions: List[str]
