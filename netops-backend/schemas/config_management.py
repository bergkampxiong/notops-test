from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ConfigFileBase(BaseModel):
    name: str
    type: str
    content: str
    description: Optional[str] = None

class ConfigFileCreate(ConfigFileBase):
    pass

class ConfigFileUpdate(ConfigFileBase):
    pass

class ConfigFile(ConfigFileBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 