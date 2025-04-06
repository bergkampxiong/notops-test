from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SSHConnectionBase(BaseModel):
    """SSH连接基础模型"""
    name: str = Field(..., description="连接配置名称")
    host: str = Field(..., description="主机地址")
    port: int = Field(default=22, description="SSH端口")
    credential_id: str = Field(..., description="凭证ID")
    system_type: str = Field(..., description="系统类型")
    description: Optional[str] = Field(None, description="描述")
    is_active: bool = Field(default=True, description="是否启用")

class SSHConnectionCreate(SSHConnectionBase):
    """创建SSH连接请求模型"""
    pass

class SSHConnectionUpdate(BaseModel):
    """更新SSH连接请求模型"""
    name: Optional[str] = Field(None, description="连接配置名称")
    host: Optional[str] = Field(None, description="主机地址")
    port: Optional[int] = Field(None, description="SSH端口")
    credential_id: Optional[str] = Field(None, description="凭证ID")
    system_type: Optional[str] = Field(None, description="系统类型")
    description: Optional[str] = Field(None, description="描述")
    is_active: Optional[bool] = Field(None, description="是否启用")

class SSHConnectionResponse(SSHConnectionBase):
    """SSH连接响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ConnectionPoolBase(BaseModel):
    """连接池基础模型"""
    ssh_config_id: int = Field(..., description="SSH配置ID")
    max_connections: int = Field(default=5, description="最大连接数")
    min_connections: int = Field(default=1, description="最小连接数")
    idle_timeout: int = Field(default=300, description="空闲超时时间(秒)")
    connection_timeout: int = Field(default=30, description="连接超时时间(秒)")
    is_active: bool = Field(default=True, description="是否启用")

class ConnectionPoolCreate(ConnectionPoolBase):
    """创建连接池请求模型"""
    pass

class ConnectionPoolUpdate(BaseModel):
    """更新连接池请求模型"""
    max_connections: Optional[int] = Field(None, description="最大连接数")
    min_connections: Optional[int] = Field(None, description="最小连接数")
    idle_timeout: Optional[int] = Field(None, description="空闲超时时间(秒)")
    connection_timeout: Optional[int] = Field(None, description="连接超时时间(秒)")
    is_active: Optional[bool] = Field(None, description="是否启用")

class ConnectionPoolResponse(ConnectionPoolBase):
    """连接池响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ConnectionStatsResponse(BaseModel):
    """连接池统计信息响应模型"""
    id: int
    pool_id: int
    current_connections: int = Field(default=0, description="当前连接数")
    total_connections: int = Field(default=0, description="总连接数")
    failed_connections: int = Field(default=0, description="失败连接数")
    last_used: Optional[datetime] = Field(None, description="最后使用时间")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 