from pydantic import BaseModel, ConfigDict
from typing import Optional

class DispatcherResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    is_active: bool
    is_superuser: bool

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[DispatcherResponse] = None

class DispatcherCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    is_superuser: bool = False
