import os
import sys
from datetime import datetime
import traceback
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 添加当前目录到路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 导入数据库模型和会话
from database.cmdb_session import CMDBBase, cmdb_engine
from database.cmdb_models import (
    DeviceType, Vendor, Location, Department, AssetStatus, 
    Asset, NetworkDevice, Server, VirtualMachine, K8sCluster,
    InventoryTask, InventoryItem, K8sNode, K8sPod, NetworkInterface, SystemType
)

def init_db():
    """初始化CMDB数据库"""
    try:
        print("正在创建CMDB数据库表...")
        # 创建所有表
        CMDBBase.metadata.create_all(bind=cmdb_engine)
        print("CMDB数据库表创建完成！")
        return True
    except Exception as e:
        print(f"创建数据库表失败: {e}")
        traceback.print_exc()
        return False

def init_base_data():
    """初始化基础数据"""
    from sqlalchemy.orm import Session
    from database.cmdb_session import CMDBSessionLocal
    
    db = CMDBSessionLocal()
    success = False
    try:
        # 检查是否已有数据
        try:
            device_type_count = db.query(DeviceType).count()
            print(f"当前设备类型数量: {device_type_count}")
        except Exception as e:
            print(f"查询设备类型失败: {e}")
            device_type_count = 0
            
        if device_type_count == 0:
            print("正在初始化基础数据...")
            
            # 添加设备类型
            device_types = [
                {"name": "Server", "description": "服务器设备"},
                {"name": "Network", "description": "网络设备"},
                {"name": "K8S Node", "description": "Kubernetes节点"},
                {"name": "K8S Cluster", "description": "Kubernetes集群"}
            ]
            for dt in device_types:
                try:
                    now = datetime.utcnow().isoformat()
                    db.add(DeviceType(
                        name=dt["name"], 
                        description=dt["description"],
                        created_at=now,
                        updated_at=now
                    ))
                    print(f"添加设备类型: {dt['name']}")
                except Exception as e:
                    print(f"添加设备类型 {dt['name']} 失败: {e}")
            
            # 添加厂商
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
            for v in vendors:
                try:
                    now = datetime.utcnow().isoformat()
                    db.add(Vendor(
                        name=v["name"], 
                        description=v["description"],
                        created_at=now,
                        updated_at=now
                    ))
                    print(f"添加厂商: {v['name']}")
                except Exception as e:
                    print(f"添加厂商 {v['name']} 失败: {e}")
            
            # 添加位置
            locations = [
                {"name": "机房A", "description": "主数据中心机房A"},
                {"name": "机房B", "description": "主数据中心机房B"},
                {"name": "机房C", "description": "灾备数据中心机房C"}
            ]
            for loc in locations:
                try:
                    now = datetime.utcnow().isoformat()
                    db.add(Location(
                        name=loc["name"], 
                        description=loc["description"],
                        created_at=now,
                        updated_at=now
                    ))
                    print(f"添加位置: {loc['name']}")
                except Exception as e:
                    print(f"添加位置 {loc['name']} 失败: {e}")
            
            # 添加部门
            departments = [
                {"name": "IT部门", "description": "信息技术部门"},
                {"name": "研发部门", "description": "研发部门"},
                {"name": "运维部门", "description": "运维部门"},
                {"name": "测试部门", "description": "测试部门"}
            ]
            for dept in departments:
                try:
                    now = datetime.utcnow().isoformat()
                    db.add(Department(
                        name=dept["name"], 
                        description=dept["description"],
                        created_at=now,
                        updated_at=now
                    ))
                    print(f"添加部门: {dept['name']}")
                except Exception as e:
                    print(f"添加部门 {dept['name']} 失败: {e}")
            
            # 添加资产状态
            statuses = [
                {"name": "在线", "description": "设备正常运行"},
                {"name": "离线", "description": "设备已关机或不可访问"},
                {"name": "维护中", "description": "设备正在维护"}
            ]
            for status in statuses:
                try:
                    now = datetime.utcnow().isoformat()
                    db.add(AssetStatus(
                        name=status["name"], 
                        description=status["description"],
                        created_at=now,
                        updated_at=now
                    ))
                    print(f"添加资产状态: {status['name']}")
                except Exception as e:
                    print(f"添加资产状态 {status['name']} 失败: {e}")
            
            # 添加系统类型
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
            for system_type in system_types:
                try:
                    now = datetime.utcnow().isoformat()
                    db.add(SystemType(
                        name=system_type["name"], 
                        description=system_type["description"],
                        created_at=now,
                        updated_at=now
                    ))
                    print(f"添加系统类型: {system_type['name']}")
                except Exception as e:
                    print(f"添加系统类型 {system_type['name']} 失败: {e}")
            
            try:
                db.commit()
                print("基础数据初始化完成！")
                success = True
            except Exception as e:
                print(f"提交数据失败: {e}")
                db.rollback()
        else:
            print("基础数据已存在，跳过初始化。")
            success = True
    except Exception as e:
        db.rollback()
        print(f"初始化基础数据失败: {e}")
        traceback.print_exc()
    finally:
        db.close()
    return success

if __name__ == "__main__":
    if init_db():
        if init_base_data():
            print("CMDB数据库初始化完成！")
        else:
            print("CMDB基础数据初始化失败！")
    else:
        print("CMDB数据库表创建失败！") 