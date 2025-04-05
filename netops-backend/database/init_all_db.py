from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# 设备连接配置表
class DeviceConnection(Base):
    __tablename__ = "device_connections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    device_type = Column(String(50), nullable=False)
    credential_id = Column(Integer, ForeignKey("credential_mgt_credentials.id"), nullable=False)
    pool_config_id = Column(Integer, ForeignKey("connection_pools.id"), nullable=True)
    port = Column(Integer, nullable=False, default=22)
    enable_secret = Column(String(255), nullable=True)
    global_delay_factor = Column(Float, nullable=True, default=1.0)
    auth_timeout = Column(Integer, nullable=True, default=20)
    banner_timeout = Column(Integer, nullable=True, default=20)
    fast_cli = Column(Boolean, nullable=True, default=False)
    session_timeout = Column(Integer, nullable=True, default=60)
    conn_timeout = Column(Integer, nullable=True, default=10)
    keepalive = Column(Integer, nullable=True, default=10)
    verbose = Column(Boolean, nullable=True, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联关系
    credential = relationship("Credential", back_populates="device_connections")
    pool_config = relationship("ConnectionPool", back_populates="device_connections")

# 连接池配置表
class ConnectionPool(Base):
    __tablename__ = "connection_pools"

    id = Column(Integer, primary_key=True, index=True)
    max_connections = Column(Integer, nullable=False, default=100)
    connection_timeout = Column(Integer, nullable=False, default=30)
    idle_timeout = Column(Integer, nullable=False, default=300)
    max_lifetime = Column(Integer, nullable=False, default=3600)
    min_idle = Column(Integer, nullable=False, default=5)
    max_idle = Column(Integer, nullable=False, default=20)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联关系
    device_connections = relationship("DeviceConnection", back_populates="pool_config")
    stats = relationship("ConnectionPoolStats", back_populates="pool")
    metrics = relationship("ConnectionPoolMetrics", back_populates="pool")

# 连接池状态表
class ConnectionPoolStats(Base):
    __tablename__ = "connection_pool_stats"

    id = Column(Integer, primary_key=True, index=True)
    pool_id = Column(Integer, ForeignKey("connection_pools.id"), nullable=False)
    total_connections = Column(Integer, nullable=False, default=0)
    active_connections = Column(Integer, nullable=False, default=0)
    idle_connections = Column(Integer, nullable=False, default=0)
    waiting_connections = Column(Integer, nullable=False, default=0)
    connection_errors = Column(Integer, nullable=False, default=0)
    avg_connection_time = Column(Float, nullable=False, default=0)
    cpu_usage = Column(Float, nullable=False, default=0)
    memory_usage = Column(Float, nullable=False, default=0)
    network_usage = Column(Float, nullable=False, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # 关联关系
    pool = relationship("ConnectionPool", back_populates="stats")

# 连接池指标表
class ConnectionPoolMetrics(Base):
    __tablename__ = "connection_pool_metrics"

    id = Column(Integer, primary_key=True, index=True)
    pool_id = Column(Integer, ForeignKey("connection_pools.id"), nullable=False)
    metric_type = Column(String(50), nullable=False)  # active_connections, idle_connections, waiting_connections
    value = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # 关联关系
    pool = relationship("ConnectionPool", back_populates="metrics")

# 凭证管理表
class Credential(Base):
    __tablename__ = "credential_mgt_credentials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    username = Column(String(100), nullable=False)
    password = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联关系
    device_connections = relationship("DeviceConnection", back_populates="credential")

# CMDB 基础数据模型
class DeviceType(Base):
    """设备类型模型"""
    __tablename__ = "cmdb_device_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)  # 设备类型名称
    description = Column(String(200), nullable=True)  # 描述
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    assets = relationship("Asset", back_populates="device_type")

class Vendor(Base):
    """厂商模型"""
    __tablename__ = "cmdb_vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)  # 厂商名称
    description = Column(String(200), nullable=True)  # 描述
    contact = Column(String(100), nullable=True)  # 联系方式
    website = Column(String(100), nullable=True)  # 网站
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    assets = relationship("Asset", back_populates="vendor")

class Location(Base):
    """位置模型"""
    __tablename__ = "cmdb_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)  # 位置名称
    address = Column(String(200), nullable=True)  # 地址
    description = Column(String(200), nullable=True)  # 描述
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    assets = relationship("Asset", back_populates="location")

class Department(Base):
    """部门模型"""
    __tablename__ = "cmdb_departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)  # 部门名称
    description = Column(String(200), nullable=True)  # 描述
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    assets = relationship("Asset", back_populates="department")

class AssetStatus(Base):
    """资产状态模型"""
    __tablename__ = "cmdb_asset_statuses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)  # 状态名称
    description = Column(String(200), nullable=True)  # 描述
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    assets = relationship("Asset", back_populates="status")

class SystemType(Base):
    """系统类型模型"""
    __tablename__ = "cmdb_system_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)  # 系统类型名称
    description = Column(String(200), nullable=True)  # 描述
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    assets = relationship("Asset", back_populates="system_type")

# 资产模型
class Asset(Base):
    """资产模型"""
    __tablename__ = "cmdb_assets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)  # 资产名称
    asset_tag = Column(String(50), unique=True, index=True)  # 资产标签
    ip_address = Column(String(50), nullable=True, index=True)  # IP地址
    serial_number = Column(String(50), nullable=True, index=True)  # SN码
    device_type_id = Column(Integer, ForeignKey("cmdb_device_types.id"), nullable=True)
    vendor_id = Column(Integer, ForeignKey("cmdb_vendors.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("cmdb_departments.id"), nullable=True)
    location_id = Column(Integer, ForeignKey("cmdb_locations.id"), nullable=True)
    status_id = Column(Integer, ForeignKey("cmdb_asset_statuses.id"), nullable=True)
    system_type_id = Column(Integer, ForeignKey("cmdb_system_types.id"), nullable=True)  # 新增系统类型ID
    owner = Column(String(50), nullable=True)  # 资产所有者
    purchase_date = Column(DateTime, nullable=True)  # 购买日期
    purchase_cost = Column(Float, nullable=True)  # 购买成本
    current_value = Column(Float, nullable=True)  # 当前价值
    online_date = Column(DateTime, nullable=True)  # 上线时间
    warranty_expiry = Column(DateTime, nullable=True)  # 保修到期
    notes = Column(Text, nullable=True)  # 备注
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    device_type = relationship("DeviceType", back_populates="assets")
    vendor = relationship("Vendor", back_populates="assets")
    department = relationship("Department", back_populates="assets")
    location = relationship("Location", back_populates="assets")
    status = relationship("AssetStatus", back_populates="assets")
    system_type = relationship("SystemType", back_populates="assets")  # 新增系统类型关系
    
    # 多态关联
    network_device = relationship("NetworkDevice", back_populates="asset", uselist=False)
    server = relationship("Server", back_populates="asset", uselist=False)
    virtual_machine = relationship("VirtualMachine", back_populates="asset", uselist=False)
    k8s_cluster = relationship("K8sCluster", back_populates="asset", uselist=False)

# 网络设备模型
class NetworkDevice(Base):
    """网络设备模型"""
    __tablename__ = "cmdb_network_devices"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("cmdb_assets.id"), unique=True)
    device_model = Column(String(100), nullable=True)  # 设备型号
    os_version = Column(String(50), nullable=True)  # 操作系统版本
    management_ip = Column(String(50), nullable=True)  # 管理IP
    console_port = Column(String(50), nullable=True)  # 控制台端口
    device_role = Column(String(50), nullable=True)  # 设备角色（核心、汇聚、接入）
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    asset = relationship("Asset", back_populates="network_device")
    interfaces = relationship("NetworkInterface", back_populates="device")

class NetworkInterface(Base):
    """网络接口模型"""
    __tablename__ = "cmdb_network_interfaces"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("cmdb_network_devices.id"))
    name = Column(String(50))  # 接口名称
    type = Column(String(50), nullable=True)  # 接口类型
    mac_address = Column(String(50), nullable=True)  # MAC地址
    ip_address = Column(String(50), nullable=True)  # IP地址
    subnet_mask = Column(String(50), nullable=True)  # 子网掩码
    status = Column(String(50), nullable=True)  # 状态
    speed = Column(String(50), nullable=True)  # 速率
    description = Column(String(200), nullable=True)  # 描述
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    device = relationship("NetworkDevice", back_populates="interfaces")

# 服务器模型
class Server(Base):
    """服务器模型"""
    __tablename__ = "cmdb_servers"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("cmdb_assets.id"), unique=True)
    server_type = Column(String(50), nullable=True)  # 服务器类型（物理、虚拟）
    cpu_model = Column(String(100), nullable=True)  # CPU型号
    cpu_cores = Column(Integer, nullable=True)  # CPU核心数
    memory_size = Column(Float, nullable=True)  # 内存大小(GB)
    disk_size = Column(Float, nullable=True)  # 磁盘大小(GB)
    os_type = Column(String(50), nullable=True)  # 操作系统类型
    os_version = Column(String(50), nullable=True)  # 操作系统版本
    management_ip = Column(String(50), nullable=True)  # 管理IP
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    asset = relationship("Asset", back_populates="server")
    virtual_machines = relationship("VirtualMachine", back_populates="host_server")

class VirtualMachine(Base):
    """虚拟机模型"""
    __tablename__ = "cmdb_virtual_machines"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("cmdb_assets.id"), unique=True)
    host_server_id = Column(Integer, ForeignKey("cmdb_servers.id"), nullable=True)
    vm_type = Column(String(50), nullable=True)  # 虚拟机类型（VMware、KVM等）
    vcpu_count = Column(Integer, nullable=True)  # vCPU数量
    memory_size = Column(Float, nullable=True)  # 内存大小(GB)
    disk_size = Column(Float, nullable=True)  # 磁盘大小(GB)
    os_type = Column(String(50), nullable=True)  # 操作系统类型
    os_version = Column(String(50), nullable=True)  # 操作系统版本
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    asset = relationship("Asset", back_populates="virtual_machine", uselist=False)
    host_server = relationship("Server", back_populates="virtual_machines")

# Kubernetes模型
class K8sCluster(Base):
    """Kubernetes集群模型"""
    __tablename__ = "cmdb_k8s_clusters"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("cmdb_assets.id"), unique=True)
    cluster_version = Column(String(50), nullable=True)  # Kubernetes版本
    control_plane_count = Column(Integer, nullable=True)
    worker_node_count = Column(Integer, nullable=True)
    pod_cidr = Column(String(50), nullable=True)
    service_cidr = Column(String(50), nullable=True)
    ingress_domain = Column(String(100), nullable=True)
    api_endpoint = Column(String(100), nullable=True)
    dashboard_url = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    asset = relationship("Asset", back_populates="k8s_cluster")
    nodes = relationship("K8sNode", back_populates="cluster")

class K8sNode(Base):
    """Kubernetes节点模型"""
    __tablename__ = "cmdb_k8s_nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(Integer, ForeignKey("cmdb_k8s_clusters.id"))
    server_id = Column(Integer, ForeignKey("cmdb_servers.id"), nullable=True)
    node_name = Column(String(100))
    node_role = Column(String(50), nullable=True)  # control-plane/worker
    node_ip = Column(String(50), nullable=True)
    kubelet_version = Column(String(50), nullable=True)
    os_type = Column(String(50), nullable=True)
    os_version = Column(String(50), nullable=True)
    cpu_cores = Column(Integer, nullable=True)
    memory_size = Column(Float, nullable=True)  # GB
    disk_size = Column(Float, nullable=True)  # GB
    status = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    cluster = relationship("K8sCluster", back_populates="nodes")
    pods = relationship("K8sPod", back_populates="node")

class K8sPod(Base):
    """Kubernetes Pod模型"""
    __tablename__ = "cmdb_k8s_pods"
    
    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(Integer, ForeignKey("cmdb_k8s_nodes.id"))
    name = Column(String(100), index=True)  # Pod名称
    namespace = Column(String(100), nullable=True)  # 命名空间
    status = Column(String(50), nullable=True)  # 状态
    ip_address = Column(String(50), nullable=True)  # IP地址
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    node = relationship("K8sNode", back_populates="pods")

# 资产盘点模型
class InventoryTask(Base):
    """资产盘点任务模型"""
    __tablename__ = "cmdb_inventory_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    description = Column(String(200), nullable=True)
    task_type = Column(String(50))  # discovery/audit
    status = Column(String(50))  # pending/running/completed/failed
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    result = Column(Text, nullable=True)
    created_by = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 添加外键
    location_id = Column(Integer, ForeignKey("cmdb_locations.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("cmdb_departments.id"), nullable=True)
    
    # 关联关系
    location = relationship("Location")
    department = relationship("Department")
    items = relationship("InventoryItem", back_populates="task")

class InventoryItem(Base):
    """资产盘点项模型"""
    __tablename__ = "cmdb_inventory_items"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("cmdb_inventory_tasks.id"))
    asset_id = Column(Integer, ForeignKey("cmdb_assets.id"))
    status = Column(String(50), nullable=True)  # 状态（待盘点、已盘点、丢失、位置不符）
    notes = Column(String(200), nullable=True)  # 备注
    checked_by = Column(String(100), nullable=True)  # 盘点人
    checked_at = Column(DateTime, nullable=True)  # 盘点时间
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    task = relationship("InventoryTask", back_populates="items")
    asset = relationship("Asset")

# RPA设备连接功能模型
class RpaDeviceConnection(Base):
    """RPA设备连接模型"""
    __tablename__ = "rpa_device_connections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    device_type = Column(String(50), nullable=False)  # 设备类型（如：cisco_ios, cisco_nxos等）
    host = Column(String(100), nullable=False)  # 设备主机地址
    port = Column(Integer, nullable=False, default=22)  # 连接端口
    username = Column(String(100), nullable=False)  # 用户名
    password = Column(String(255), nullable=False)  # 密码
    enable_secret = Column(String(255), nullable=True)  # 特权模式密码
    global_delay_factor = Column(Float, nullable=True, default=1.0)  # 全局延迟因子
    auth_timeout = Column(Integer, nullable=True, default=20)  # 认证超时时间
    banner_timeout = Column(Integer, nullable=True, default=20)  # Banner超时时间
    fast_cli = Column(Boolean, nullable=True, default=False)  # 快速CLI模式
    session_timeout = Column(Integer, nullable=True, default=60)  # 会话超时时间
    conn_timeout = Column(Integer, nullable=True, default=10)  # 连接超时时间
    keepalive = Column(Integer, nullable=True, default=10)  # 保活时间
    verbose = Column(Boolean, nullable=True, default=False)  # 详细模式
    description = Column(String(255), nullable=True)  # 描述
    status = Column(String(50), nullable=True, default="inactive")  # 状态（active/inactive）
    last_connected = Column(DateTime, nullable=True)  # 最后连接时间
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联关系
    connection_logs = relationship("RpaConnectionLog", back_populates="device_connection")
    command_logs = relationship("RpaCommandLog", back_populates="device_connection")

class RpaConnectionLog(Base):
    """RPA连接日志模型"""
    __tablename__ = "rpa_connection_logs"

    id = Column(Integer, primary_key=True, index=True)
    device_connection_id = Column(Integer, ForeignKey("rpa_device_connections.id"), nullable=False)
    event_type = Column(String(50), nullable=False)  # 事件类型（connect/disconnect/error）
    status = Column(String(50), nullable=False)  # 状态（success/failed）
    message = Column(Text, nullable=True)  # 详细信息
    ip_address = Column(String(50), nullable=True)  # 连接IP地址
    timestamp = Column(DateTime, default=datetime.utcnow)

    # 关联关系
    device_connection = relationship("RpaDeviceConnection", back_populates="connection_logs")

class RpaCommandLog(Base):
    """RPA命令日志模型"""
    __tablename__ = "rpa_command_logs"

    id = Column(Integer, primary_key=True, index=True)
    device_connection_id = Column(Integer, ForeignKey("rpa_device_connections.id"), nullable=False)
    command = Column(Text, nullable=False)  # 执行的命令
    output = Column(Text, nullable=True)  # 命令输出
    status = Column(String(50), nullable=False)  # 状态（success/failed）
    execution_time = Column(Float, nullable=True)  # 执行时间（秒）
    timestamp = Column(DateTime, default=datetime.utcnow)

    # 关联关系
    device_connection = relationship("RpaDeviceConnection", back_populates="command_logs")

class RpaConnectionPool(Base):
    """RPA连接池模型"""
    __tablename__ = "rpa_connection_pools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    max_connections = Column(Integer, nullable=False, default=10)  # 最大连接数
    min_connections = Column(Integer, nullable=False, default=1)  # 最小连接数
    connection_timeout = Column(Integer, nullable=False, default=30)  # 连接超时时间
    idle_timeout = Column(Integer, nullable=False, default=300)  # 空闲超时时间
    max_lifetime = Column(Integer, nullable=False, default=3600)  # 最大生命周期
    description = Column(String(255), nullable=True)  # 描述
    status = Column(String(50), nullable=True, default="active")  # 状态（active/inactive）
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关联关系
    pool_stats = relationship("RpaPoolStats", back_populates="connection_pool")
    pool_metrics = relationship("RpaPoolMetrics", back_populates="connection_pool")

class RpaPoolStats(Base):
    """RPA连接池统计模型"""
    __tablename__ = "rpa_pool_stats"

    id = Column(Integer, primary_key=True, index=True)
    pool_id = Column(Integer, ForeignKey("rpa_connection_pools.id"), nullable=False)
    total_connections = Column(Integer, nullable=False, default=0)  # 总连接数
    active_connections = Column(Integer, nullable=False, default=0)  # 活动连接数
    idle_connections = Column(Integer, nullable=False, default=0)  # 空闲连接数
    waiting_connections = Column(Integer, nullable=False, default=0)  # 等待连接数
    connection_errors = Column(Integer, nullable=False, default=0)  # 连接错误数
    avg_connection_time = Column(Float, nullable=False, default=0)  # 平均连接时间
    timestamp = Column(DateTime, default=datetime.utcnow)

    # 关联关系
    connection_pool = relationship("RpaConnectionPool", back_populates="pool_stats")

class RpaPoolMetrics(Base):
    """RPA连接池指标模型"""
    __tablename__ = "rpa_pool_metrics"

    id = Column(Integer, primary_key=True, index=True)
    pool_id = Column(Integer, ForeignKey("rpa_connection_pools.id"), nullable=False)
    metric_type = Column(String(50), nullable=False)  # 指标类型（active_connections, idle_connections, waiting_connections）
    value = Column(Integer, nullable=False)  # 指标值
    timestamp = Column(DateTime, default=datetime.utcnow)

    # 关联关系
    connection_pool = relationship("RpaConnectionPool", back_populates="pool_metrics") 