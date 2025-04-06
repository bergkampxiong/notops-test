from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class DeviceConnection(Base):
    """设备连接配置表"""
    __tablename__ = "device_connections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, comment="连接配置名称")
    device_type = Column(String(50), nullable=False, comment="设备类型")
    credential_id = Column(Integer, nullable=False, comment="凭证ID")
    port = Column(Integer, default=22, comment="SSH端口")
    enable_secret = Column(String(100), comment="Enable密码")
    global_delay_factor = Column(Float, default=1.0, comment="全局延迟因子")
    auth_timeout = Column(Integer, default=60, comment="认证超时时间(秒)")
    banner_timeout = Column(Integer, default=20, comment="Banner超时时间(秒)")
    fast_cli = Column(Boolean, default=False, comment="是否启用快速CLI模式")
    session_timeout = Column(Integer, default=60, comment="会话超时时间(秒)")
    conn_timeout = Column(Integer, default=20, comment="连接超时时间(秒)")
    keepalive = Column(Integer, default=20, comment="保活间隔(秒)")
    verbose = Column(Boolean, default=False, comment="是否启用详细日志")
    description = Column(Text, comment="描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    is_active = Column(Boolean, default=True, comment="是否启用")

    # 关联连接池
    pools = relationship("DeviceConnectionPool", back_populates="connection", cascade="all, delete-orphan")

class DeviceConnectionPool(Base):
    """设备连接池表"""
    __tablename__ = "device_connection_pools"

    id = Column(Integer, primary_key=True, index=True)
    connection_id = Column(Integer, ForeignKey("device_connections.id", ondelete="CASCADE"), nullable=False)
    max_connections = Column(Integer, default=5, comment="最大连接数")
    min_idle = Column(Integer, default=1, comment="最小空闲连接数")
    idle_timeout = Column(Integer, default=300, comment="空闲超时时间(秒)")
    connection_timeout = Column(Integer, default=30, comment="连接超时时间(秒)")
    description = Column(Text, comment="描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    is_active = Column(Boolean, default=True, comment="是否启用")

    # 关联
    connection = relationship("DeviceConnection", back_populates="pools")
    stats = relationship("DeviceConnectionStats", back_populates="pool", uselist=False, cascade="all, delete-orphan")

class DeviceConnectionStats(Base):
    """设备连接池统计信息表"""
    __tablename__ = "device_connection_stats"

    id = Column(Integer, primary_key=True, index=True)
    pool_id = Column(Integer, ForeignKey("device_connection_pools.id", ondelete="CASCADE"), nullable=False)
    current_connections = Column(Integer, default=0, comment="当前连接数")
    total_connections = Column(Integer, default=0, comment="总连接数")
    failed_connections = Column(Integer, default=0, comment="失败连接数")
    last_used = Column(DateTime(timezone=True), comment="最后使用时间")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关联
    pool = relationship("DeviceConnectionPool", back_populates="stats") 