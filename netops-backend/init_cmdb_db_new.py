from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# 添加当前目录到路径
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 导入模型
from database.cmdb_models import (
    CMDBBase, DeviceType, Vendor, Location, Department, AssetStatus, SystemType
)

# 创建数据库引擎
engine = create_engine("sqlite:///./cmdb.db", connect_args={"check_same_thread": False})

# 创建表
CMDBBase.metadata.create_all(bind=engine)
print("CMDB数据库表创建完成！")

# 创建会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    print("正在初始化基础数据...")
    
    # 初始化设备类型数据
    device_types = [
        {"name": "Server", "description": "服务器设备"},
        {"name": "Network", "description": "网络设备"},
        {"name": "K8S Node", "description": "Kubernetes节点"},
        {"name": "K8S Cluster", "description": "Kubernetes集群"}
    ]
    
    # 初始化厂商数据
    vendors = [
        {"name": "Cisco", "description": "思科公司"},
        {"name": "Huawei", "description": "华为公司"},
        {"name": "H3C", "description": "新华三公司"},
        {"name": "Ruijie", "description": "锐捷网络"},
        {"name": "Dell", "description": "戴尔公司"},
        {"name": "HP", "description": "惠普公司"},
        {"name": "Lenovo", "description": "联想公司"},
        {"name": "Palo Alto", "description": "帕洛阿尔托网络"}
    ]
    
    # 初始化位置数据
    locations = [
        {"name": "机房A", "description": "主数据中心机房A"},
        {"name": "机房B", "description": "主数据中心机房B"},
        {"name": "机房C", "description": "灾备数据中心机房C"}
    ]
    
    # 初始化部门数据
    departments = [
        {"name": "IT部门", "description": "信息技术部门"},
        {"name": "研发部门", "description": "研发部门"},
        {"name": "运维部门", "description": "运维部门"},
        {"name": "测试部门", "description": "测试部门"}
    ]
    
    # 初始化资产状态数据
    statuses = [
        {"name": "在线", "description": "设备正常运行"},
        {"name": "离线", "description": "设备已关机或不可访问"},
        {"name": "维护中", "description": "设备正在维护"}
    ]
    
    # 初始化系统类型数据
    system_types = [
        {"name": "cisco_ios", "description": "Cisco IOS操作系统"},
        {"name": "huawei_vrp", "description": "华为VRP操作系统"},
        {"name": "ruijie_os_telnet", "description": "锐捷OS通过Telnet访问"},
        {"name": "HPE Comware7", "description": "HPE Comware7操作系统"},
        {"name": "cisco_nxos", "description": "Cisco NX-OS操作系统"},
        {"name": "cisco_xe", "description": "Cisco IOS XE操作系统"},
        {"name": "cisco_xr", "description": "Cisco IOS XR操作系统"},
        {"name": "huawei_vrpv8", "description": "华为VRP V8操作系统"},
        {"name": "linux", "description": "Linux操作系统"},
        {"name": "paloalto_panos", "description": "Palo Alto PAN-OS操作系统"},
        {"name": "ruijie_os", "description": "锐捷OS操作系统"},
        {"name": "hp_comware_telnet", "description": "HP Comware通过Telnet访问"},
        {"name": "huawei_telnet", "description": "华为设备通过Telnet访问"},
        {"name": "其他", "description": "其他操作系统"}
    ]
    
    # 添加设备类型
    for dt in device_types:
        now = datetime.utcnow().isoformat()
        db_device_type = DeviceType(
            name=dt["name"],
            description=dt["description"],
            created_at=now,
            updated_at=now
        )
        db.add(db_device_type)
        db.flush()
        print(f"添加设备类型: {dt['name']}")
    
    # 添加厂商
    for v in vendors:
        now = datetime.utcnow().isoformat()
        db_vendor = Vendor(
            name=v["name"],
            description=v["description"],
            created_at=now,
            updated_at=now
        )
        db.add(db_vendor)
        db.flush()
        print(f"添加厂商: {v['name']}")
    
    # 添加位置
    for loc in locations:
        now = datetime.utcnow().isoformat()
        db_location = Location(
            name=loc["name"],
            description=loc["description"],
            created_at=now,
            updated_at=now
        )
        db.add(db_location)
        db.flush()
        print(f"添加位置: {loc['name']}")
    
    # 添加部门
    for dept in departments:
        now = datetime.utcnow().isoformat()
        db_department = Department(
            name=dept["name"],
            description=dept["description"],
            created_at=now,
            updated_at=now
        )
        db.add(db_department)
        db.flush()
        print(f"添加部门: {dept['name']}")
    
    # 添加资产状态
    for status in statuses:
        now = datetime.utcnow().isoformat()
        db_status = AssetStatus(
            name=status["name"],
            description=status["description"],
            created_at=now,
            updated_at=now
        )
        db.add(db_status)
        db.flush()
        print(f"添加资产状态: {status['name']}")
    
    # 添加系统类型
    for system_type in system_types:
        now = datetime.utcnow().isoformat()
        db_system_type = SystemType(
            name=system_type["name"],
            description=system_type["description"],
            created_at=now,
            updated_at=now
        )
        db.add(db_system_type)
        db.flush()
        print(f"添加系统类型: {system_type['name']}")
    
    # 提交事务
    db.commit()
    print("CMDB基础数据初始化成功！")
except Exception as e:
    db.rollback()
    print(f"CMDB基础数据初始化失败！错误: {str(e)}")
finally:
    db.close() 