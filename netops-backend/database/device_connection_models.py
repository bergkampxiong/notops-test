from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class SSHConnection(Base):
    """SSH连接配置表"""
    __tablename__ = "ssh_connections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, comment="连接配置名称")
    host = Column(String(255), nullable=False, comment="主机地址")
    port = Column(Integer, default=22, comment="SSH端口")
    credential_id = Column(String(36), nullable=False, comment="凭证ID")
    system_type = Column(String(50), nullable=False, comment="系统类型")
    description = Column(Text, comment="描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    is_active = Column(Boolean, default=True, comment="是否启用")

    # 关联连接池
    pools = relationship("ConnectionPool", back_populates="ssh_config", cascade="all, delete-orphan")

class ConnectionPool(Base):
    """SSH连接池表"""
    __tablename__ = "connection_pools"

    id = Column(Integer, primary_key=True, index=True)
    ssh_config_id = Column(Integer, ForeignKey("ssh_connections.id", ondelete="CASCADE"), nullable=False)
    max_connections = Column(Integer, default=5, comment="最大连接数")
    min_connections = Column(Integer, default=1, comment="最小连接数")
    idle_timeout = Column(Integer, default=300, comment="空闲超时时间(秒)")
    connection_timeout = Column(Integer, default=30, comment="连接超时时间(秒)")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    is_active = Column(Boolean, default=True, comment="是否启用")

    # 关联
    ssh_config = relationship("SSHConnection", back_populates="pools")
    stats = relationship("ConnectionStats", back_populates="pool", uselist=False, cascade="all, delete-orphan")

class ConnectionStats(Base):
    """连接池统计信息表"""
    __tablename__ = "connection_stats"

    id = Column(Integer, primary_key=True, index=True)
    pool_id = Column(Integer, ForeignKey("connection_pools.id", ondelete="CASCADE"), nullable=False)
    current_connections = Column(Integer, default=0, comment="当前连接数")
    total_connections = Column(Integer, default=0, comment="总连接数")
    failed_connections = Column(Integer, default=0, comment="失败连接数")
    last_used = Column(DateTime(timezone=True), comment="最后使用时间")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关联
    pool = relationship("ConnectionPool", back_populates="stats") 