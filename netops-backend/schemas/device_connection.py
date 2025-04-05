from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DeviceConnectionBase(BaseModel):
    name: str
    device_type: str
    credential_id: int
    pool_config_id: Optional[int] = None
    port: int = 22
    enable_secret: Optional[str] = None
    global_delay_factor: Optional[float] = 1.0
    auth_timeout: Optional[int] = 20
    banner_timeout: Optional[int] = 20
    fast_cli: Optional[bool] = False
    session_timeout: Optional[int] = 60
    conn_timeout: Optional[int] = 10
    keepalive: Optional[int] = 10
    verbose: Optional[bool] = False

class DeviceConnectionCreate(DeviceConnectionBase):
    pass

class DeviceConnectionUpdate(DeviceConnectionBase):
    name: Optional[str] = None
    device_type: Optional[str] = None
    credential_id: Optional[int] = None

class DeviceConnection(DeviceConnectionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ConnectionPoolBase(BaseModel):
    max_connections: int = 100
    connection_timeout: int = 30
    idle_timeout: int = 300
    max_lifetime: int = 3600
    min_idle: int = 5
    max_idle: int = 20

class ConnectionPoolCreate(ConnectionPoolBase):
    pass

class ConnectionPoolUpdate(ConnectionPoolBase):
    max_connections: Optional[int] = None
    connection_timeout: Optional[int] = None
    idle_timeout: Optional[int] = None
    max_lifetime: Optional[int] = None
    min_idle: Optional[int] = None
    max_idle: Optional[int] = None

class ConnectionPool(ConnectionPoolBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ConnectionPoolStats(BaseModel):
    total_connections: int
    active_connections: int
    idle_connections: int
    waiting_connections: int
    connection_errors: int
    avg_connection_time: float
    cpu_usage: float
    memory_usage: float
    network_usage: float
    timestamp: datetime

    class Config:
        orm_mode = True

class ConnectionPoolMetric(BaseModel):
    metric_type: str
    value: int
    timestamp: datetime

    class Config:
        orm_mode = True

class ConnectionPoolMetricsResponse(BaseModel):
    connection_history: List[ConnectionPoolMetric] 