-- 创建设备类型表
CREATE TABLE IF NOT EXISTS cmdb_device_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE,
    description VARCHAR(200),
    created_at VARCHAR(50),
    updated_at VARCHAR(50)
);

-- 创建厂商表
CREATE TABLE IF NOT EXISTS cmdb_vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE,
    description VARCHAR(200),
    contact VARCHAR(100),
    website VARCHAR(100),
    created_at VARCHAR(50),
    updated_at VARCHAR(50)
);

-- 创建位置表
CREATE TABLE IF NOT EXISTS cmdb_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE,
    address VARCHAR(200),
    description VARCHAR(200),
    created_at VARCHAR(50),
    updated_at VARCHAR(50)
);

-- 创建部门表
CREATE TABLE IF NOT EXISTS cmdb_departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE,
    description VARCHAR(200),
    created_at VARCHAR(50),
    updated_at VARCHAR(50)
);

-- 创建资产状态表
CREATE TABLE IF NOT EXISTS cmdb_asset_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE,
    description VARCHAR(200),
    created_at VARCHAR(50),
    updated_at VARCHAR(50)
);

-- 创建资产表
CREATE TABLE IF NOT EXISTS cmdb_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100),
    asset_tag VARCHAR(50) UNIQUE,
    ip_address VARCHAR(50),
    serial_number VARCHAR(50),
    device_type_id INTEGER,
    vendor_id INTEGER,
    department_id INTEGER,
    location_id INTEGER,
    status_id INTEGER,
    owner VARCHAR(50),
    purchase_date VARCHAR(50),
    purchase_cost FLOAT,
    current_value FLOAT,
    online_date VARCHAR(50),
    warranty_expiry VARCHAR(50),
    notes TEXT,
    created_at VARCHAR(50),
    updated_at VARCHAR(50),
    FOREIGN KEY (device_type_id) REFERENCES cmdb_device_types (id),
    FOREIGN KEY (vendor_id) REFERENCES cmdb_vendors (id),
    FOREIGN KEY (department_id) REFERENCES cmdb_departments (id),
    FOREIGN KEY (location_id) REFERENCES cmdb_locations (id),
    FOREIGN KEY (status_id) REFERENCES cmdb_asset_statuses (id)
);

-- 创建网络设备表
CREATE TABLE IF NOT EXISTS cmdb_network_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER UNIQUE,
    device_model VARCHAR(100),
    os_version VARCHAR(50),
    management_ip VARCHAR(50),
    console_port VARCHAR(50),
    device_role VARCHAR(50),
    created_at VARCHAR(50),
    updated_at VARCHAR(50),
    FOREIGN KEY (asset_id) REFERENCES cmdb_assets (id)
);

-- 创建网络接口表
CREATE TABLE IF NOT EXISTS cmdb_network_interfaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER,
    name VARCHAR(50),
    type VARCHAR(50),
    mac_address VARCHAR(50),
    ip_address VARCHAR(50),
    subnet_mask VARCHAR(50),
    status VARCHAR(50),
    speed VARCHAR(50),
    description VARCHAR(200),
    created_at VARCHAR(50),
    updated_at VARCHAR(50),
    FOREIGN KEY (device_id) REFERENCES cmdb_network_devices (id)
);

-- 创建服务器表
CREATE TABLE IF NOT EXISTS cmdb_servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER UNIQUE,
    server_type VARCHAR(50),
    cpu_model VARCHAR(100),
    cpu_cores INTEGER,
    memory_size FLOAT,
    disk_size FLOAT,
    os_type VARCHAR(50),
    os_version VARCHAR(50),
    management_ip VARCHAR(50),
    created_at VARCHAR(50),
    updated_at VARCHAR(50),
    FOREIGN KEY (asset_id) REFERENCES cmdb_assets (id)
);

-- 创建虚拟机表
CREATE TABLE IF NOT EXISTS cmdb_virtual_machines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER UNIQUE,
    host_server_id INTEGER,
    vm_type VARCHAR(50),
    vcpu_count INTEGER,
    memory_size FLOAT,
    disk_size FLOAT,
    os_type VARCHAR(50),
    os_version VARCHAR(50),
    created_at VARCHAR(50),
    updated_at VARCHAR(50),
    FOREIGN KEY (asset_id) REFERENCES cmdb_assets (id),
    FOREIGN KEY (host_server_id) REFERENCES cmdb_servers (id)
);

-- 创建K8s集群表
CREATE TABLE IF NOT EXISTS cmdb_k8s_clusters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER UNIQUE,
    cluster_version VARCHAR(50),
    control_plane_count INTEGER,
    worker_node_count INTEGER,
    pod_cidr VARCHAR(50),
    service_cidr VARCHAR(50),
    ingress_domain VARCHAR(100),
    api_endpoint VARCHAR(100),
    dashboard_url VARCHAR(100),
    created_at VARCHAR(50),
    updated_at VARCHAR(50),
    FOREIGN KEY (asset_id) REFERENCES cmdb_assets (id)
);

-- 创建K8s节点表
CREATE TABLE IF NOT EXISTS cmdb_k8s_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cluster_id INTEGER,
    server_id INTEGER,
    node_name VARCHAR(100),
    node_role VARCHAR(50),
    node_ip VARCHAR(50),
    kubelet_version VARCHAR(50),
    os_type VARCHAR(50),
    os_version VARCHAR(50),
    cpu_cores INTEGER,
    memory_size FLOAT,
    disk_size FLOAT,
    status VARCHAR(50),
    created_at VARCHAR(50),
    updated_at VARCHAR(50),
    FOREIGN KEY (cluster_id) REFERENCES cmdb_k8s_clusters (id),
    FOREIGN KEY (server_id) REFERENCES cmdb_servers (id)
);

-- 创建K8s Pod表
CREATE TABLE IF NOT EXISTS cmdb_k8s_pods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER,
    name VARCHAR(100),
    namespace VARCHAR(100),
    status VARCHAR(50),
    ip_address VARCHAR(50),
    created_at VARCHAR(50),
    updated_at VARCHAR(50),
    FOREIGN KEY (node_id) REFERENCES cmdb_k8s_nodes (id)
);

-- 创建资产盘点任务表
CREATE TABLE IF NOT EXISTS cmdb_inventory_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100),
    description VARCHAR(200),
    task_type VARCHAR(50),
    status VARCHAR(50),
    start_time VARCHAR(50),
    end_time VARCHAR(50),
    result TEXT,
    created_by VARCHAR(50),
    location_id INTEGER,
    department_id INTEGER,
    created_at VARCHAR(50),
    updated_at VARCHAR(50),
    FOREIGN KEY (location_id) REFERENCES cmdb_locations (id),
    FOREIGN KEY (department_id) REFERENCES cmdb_departments (id)
);

-- 创建资产盘点项表
CREATE TABLE IF NOT EXISTS cmdb_inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    asset_id INTEGER,
    status VARCHAR(50),
    notes VARCHAR(200),
    checked_by VARCHAR(100),
    checked_at VARCHAR(50),
    created_at VARCHAR(50),
    updated_at VARCHAR(50),
    FOREIGN KEY (task_id) REFERENCES cmdb_inventory_tasks (id),
    FOREIGN KEY (asset_id) REFERENCES cmdb_assets (id)
);

-- 插入设备类型数据
INSERT OR IGNORE INTO cmdb_device_types (name, description, created_at, updated_at) VALUES
('Router', 'Network router device', datetime('now'), datetime('now')),
('Switch', 'Network switch device', datetime('now'), datetime('now')),
('Firewall', 'Network security device', datetime('now'), datetime('now')),
('Server', 'Physical server', datetime('now'), datetime('now')),
('Virtual Machine', 'Virtual server', datetime('now'), datetime('now')),
('K8s Cluster', 'Kubernetes cluster', datetime('now'), datetime('now'));

-- 插入厂商数据
INSERT OR IGNORE INTO cmdb_vendors (name, description, created_at, updated_at) VALUES
('Huawei', 'Huawei Technologies', datetime('now'), datetime('now')),
('H3C', 'H3C Technologies', datetime('now'), datetime('now')),
('Ruijie', 'Ruijie Networks', datetime('now'), datetime('now')),
('Cisco', 'Cisco Systems', datetime('now'), datetime('now')),
('Fortinet', 'Fortinet Security', datetime('now'), datetime('now')),
('Palo Alto', 'Palo Alto Networks', datetime('now'), datetime('now')),
('Dell', 'Dell Technologies', datetime('now'), datetime('now')),
('HPE', 'Hewlett Packard Enterprise', datetime('now'), datetime('now')),
('Lenovo', 'Lenovo Group Limited', datetime('now'), datetime('now'));

-- 插入位置数据
INSERT OR IGNORE INTO cmdb_locations (name, address, description, created_at, updated_at) VALUES
('Beijing DC', 'Beijing, China', 'Beijing Data Center', datetime('now'), datetime('now')),
('Shanghai DC', 'Shanghai, China', 'Shanghai Data Center', datetime('now'), datetime('now')),
('Guangzhou DC', 'Guangzhou, China', 'Guangzhou Data Center', datetime('now'), datetime('now'));

-- 插入部门数据
INSERT OR IGNORE INTO cmdb_departments (name, description, created_at, updated_at) VALUES
('IT', 'IT Department', datetime('now'), datetime('now')),
('Finance', 'Finance Department', datetime('now'), datetime('now')),
('HR', 'Human Resources', datetime('now'), datetime('now')),
('R&D', 'Research and Development', datetime('now'), datetime('now'));

-- 插入资产状态数据
INSERT OR IGNORE INTO cmdb_asset_statuses (name, description, created_at, updated_at) VALUES
('In Use', 'Asset is currently in use', datetime('now'), datetime('now')),
('In Stock', 'Asset is in stock', datetime('now'), datetime('now')),
('Under Maintenance', 'Asset is under maintenance', datetime('now'), datetime('now')),
('Retired', 'Asset is retired', datetime('now'), datetime('now')); 