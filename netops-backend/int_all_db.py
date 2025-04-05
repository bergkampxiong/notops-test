import os
import sys
import shutil
from datetime import datetime
from passlib.context import CryptContext

# 添加当前目录到路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# 导入数据库模型和会话
from database.models import Base, User
from database.session import engine as main_engine, SessionLocal
from database.cmdb_session import CMDBBase, cmdb_engine
from database.cmdb_models import (
    DeviceType, Vendor, Location, Department, AssetStatus, 
    Asset, NetworkDevice, Server, VirtualMachine, K8sCluster,
    InventoryTask, InventoryItem, K8sNode, K8sPod, NetworkInterface, SystemType
)
from database.init_all_db import (
    Base as NetOpsBase, 
    RpaDeviceConnection, RpaConnectionLog, RpaCommandLog,
    RpaConnectionPool, RpaPoolStats, RpaPoolMetrics
)

# 创建密码哈希上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    """生成密码哈希"""
    return pwd_context.hash(password)

def init_main_db():
    """初始化主数据库并创建管理员账户"""
    try:
        # 创建表
        Base.metadata.create_all(bind=main_engine)
        print("主数据库表已创建")
        
        # 创建管理员用户
        db = SessionLocal()
        try:
            # 检查是否已有管理员用户
            admin_user = db.query(User).filter(User.username == "admin").first()
            if not admin_user:
                # 创建管理员用户
                admin_user = User(
                    username="admin",
                    email="admin@example.com",
                    hashed_password=get_password_hash("admin123"),
                    is_active=True,
                    role="Admin",
                    department="IT",
                    last_login=datetime.utcnow().isoformat(),
                    password_changed_at=datetime.utcnow().isoformat()
                )
                db.add(admin_user)
                db.commit()
                print("创建管理员用户成功")
                print("管理员登录信息:")
                print("  用户名: admin")
                print("  密码: admin123")
            else:
                print("管理员用户已存在")
            
            return True
        except Exception as e:
            db.rollback()
            print(f"创建管理员用户失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            db.close()
    except Exception as e:
        print(f"初始化主数据库失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def init_cmdb_db():
    """通过ORM初始化CMDB数据库"""
    from sqlalchemy.orm import sessionmaker
    
    try:
        # 创建表
        CMDBBase.metadata.create_all(bind=cmdb_engine)
        print("CMDB数据库表已创建")
        
        # 创建会话
        CMDBSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cmdb_engine)
        db = CMDBSessionLocal()
        
        try:
            # 初始化设备类型数据
            device_types = [
                {"name": "Router", "description": "Network router device"},
                {"name": "Switch", "description": "Network switch device"},
                {"name": "Firewall", "description": "Network security device"},
                {"name": "Server", "description": "Physical server"},
                {"name": "Virtual Machine", "description": "Virtual server"},
                {"name": "K8s Cluster", "description": "Kubernetes cluster"}
            ]
            
            # 初始化厂商数据
            vendors = [
                {"name": "Cisco", "description": "思科公司"},
                {"name": "Huawei", "description": "华为公司"},
                {"name": "H3C", "description": "新华三公司"},
                {"name": "Ruijie", "description": "锐捷网络"},
                {"name": "Dell", "description": "戴尔公司"},
                {"name": "HPE", "description": "惠普公司"},
                {"name": "Lenovo", "description": "联想公司"},
                {"name": "Palo Alto", "description": "帕洛阿尔托网络"}
            ]
            
            # 初始化位置数据
            locations = [
                {"name": "Beijing DC", "description": "北京数据中心"},
                {"name": "Shanghai DC", "description": "上海数据中心"},
                {"name": "Guangzhou DC", "description": "广州数据中心"}
            ]
            
            # 初始化部门数据
            departments = [
                {"name": "IT", "description": "IT部门"},
                {"name": "Finance", "description": "财务部门"},
                {"name": "HR", "description": "人力资源部门"},
                {"name": "R&D", "description": "研发部门"}
            ]
            
            # 初始化资产状态数据
            statuses = [
                {"name": "In Use", "description": "正在使用"},
                {"name": "In Stock", "description": "库存中"},
                {"name": "Under Maintenance", "description": "维护中"},
                {"name": "Retired", "description": "已退役"}
            ]
            
            # 初始化系统类型数据
            system_types = [
                {"name": "cisco_ios", "description": "Cisco IOS操作系统"},
                {"name": "huawei_vrp", "description": "华为VRP操作系统"},
                {"name": "ruijie_os", "description": "锐捷OS操作系统"},
                {"name": "h3c_comware", "description": "H3C Comware操作系统"},
                {"name": "cisco_nxos", "description": "Cisco NX-OS操作系统"},
                {"name": "cisco_xe", "description": "Cisco IOS XE操作系统"},
                {"name": "cisco_xr", "description": "Cisco IOS XR操作系统"},
                {"name": "linux", "description": "Linux操作系统"},
                {"name": "paloalto_panos", "description": "Palo Alto PAN-OS操作系统"},
                {"name": "其他", "description": "其他操作系统"}
            ]
            
            # 添加设备类型
            for dt in device_types:
                # 检查是否已存在
                existing = db.query(DeviceType).filter(DeviceType.name == dt["name"]).first()
                if not existing:
                    now = datetime.utcnow().isoformat()
                    db_device_type = DeviceType(
                        name=dt["name"],
                        description=dt["description"],
                        created_at=now,
                        updated_at=now
                    )
                    db.add(db_device_type)
            
            # 添加厂商
            for v in vendors:
                # 检查是否已存在
                existing = db.query(Vendor).filter(Vendor.name == v["name"]).first()
                if not existing:
                    now = datetime.utcnow().isoformat()
                    db_vendor = Vendor(
                        name=v["name"],
                        description=v["description"],
                        created_at=now,
                        updated_at=now
                    )
                    db.add(db_vendor)
            
            # 添加位置
            for loc in locations:
                # 检查是否已存在
                existing = db.query(Location).filter(Location.name == loc["name"]).first()
                if not existing:
                    now = datetime.utcnow().isoformat()
                    db_location = Location(
                        name=loc["name"],
                        description=loc["description"],
                        created_at=now,
                        updated_at=now
                    )
                    db.add(db_location)
            
            # 添加部门
            for dept in departments:
                # 检查是否已存在
                existing = db.query(Department).filter(Department.name == dept["name"]).first()
                if not existing:
                    now = datetime.utcnow().isoformat()
                    db_department = Department(
                        name=dept["name"],
                        description=dept["description"],
                        created_at=now,
                        updated_at=now
                    )
                    db.add(db_department)
            
            # 添加资产状态
            for status in statuses:
                # 检查是否已存在
                existing = db.query(AssetStatus).filter(AssetStatus.name == status["name"]).first()
                if not existing:
                    now = datetime.utcnow().isoformat()
                    db_status = AssetStatus(
                        name=status["name"],
                        description=status["description"],
                        created_at=now,
                        updated_at=now
                    )
                    db.add(db_status)
            
            # 添加系统类型
            for system_type in system_types:
                # 检查是否已存在
                existing = db.query(SystemType).filter(SystemType.name == system_type["name"]).first()
                if not existing:
                    now = datetime.utcnow().isoformat()
                    db_system_type = SystemType(
                        name=system_type["name"],
                        description=system_type["description"],
                        created_at=now,
                        updated_at=now
                    )
                    db.add(db_system_type)
            
            # 提交事务
            db.commit()
            print("CMDB基础数据初始化成功")
            return True
        
        except Exception as e:
            db.rollback()
            print(f"CMDB基础数据初始化失败: {str(e)}")
            return False
        
        finally:
            db.close()
    
    except Exception as e:
        print(f"初始化CMDB数据库失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def init_rpa_db():
    """初始化RPA功能相关数据库表"""
    try:
        # 创建表
        tables = [
            RpaDeviceConnection.__table__, 
            RpaConnectionLog.__table__, 
            RpaCommandLog.__table__,
            RpaConnectionPool.__table__, 
            RpaPoolStats.__table__, 
            RpaPoolMetrics.__table__
        ]
        
        # 创建表
        NetOpsBase.metadata.create_all(bind=main_engine, tables=tables)
        print("RPA功能数据库表已创建")
        
        # 创建会话
        db = SessionLocal()
        
        try:
            # 初始化示例连接池
            sample_pools = [
                {
                    "name": "默认连接池",
                    "max_connections": 50,
                    "min_connections": 5,
                    "connection_timeout": 30,
                    "idle_timeout": 300,
                    "max_lifetime": 3600,
                    "description": "系统默认连接池"
                },
                {
                    "name": "高性能连接池",
                    "max_connections": 100,
                    "min_connections": 10,
                    "connection_timeout": 20,
                    "idle_timeout": 600,
                    "max_lifetime": 7200,
                    "description": "用于高性能设备连接"
                }
            ]
            
            # 添加示例连接池
            for pool_data in sample_pools:
                # 检查是否已存在
                existing = db.query(RpaConnectionPool).filter(
                    RpaConnectionPool.name == pool_data["name"]
                ).first()
                
                if not existing:
                    pool = RpaConnectionPool(
                        name=pool_data["name"],
                        max_connections=pool_data["max_connections"],
                        min_connections=pool_data["min_connections"],
                        connection_timeout=pool_data["connection_timeout"],
                        idle_timeout=pool_data["idle_timeout"],
                        max_lifetime=pool_data["max_lifetime"],
                        description=pool_data["description"],
                        status="active",
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    db.add(pool)
            
            # 提交事务
            db.commit()
            print("RPA连接池初始化成功")
            return True
            
        except Exception as e:
            db.rollback()
            print(f"RPA连接池初始化失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"初始化RPA数据库失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """主函数"""
    print("=== 开始数据库初始化过程 ===")
    
    # 初始化主数据库
    print("\n1. 初始化主数据库")
    main_db_success = init_main_db()
    
    if main_db_success:
        print("主数据库初始化成功")
    else:
        print("主数据库初始化失败")
    
    # 初始化CMDB数据库
    print("\n2. 初始化CMDB数据库")
    cmdb_db_success = init_cmdb_db()
    
    if cmdb_db_success:
        print("CMDB数据库初始化成功")
    else:
        print("CMDB数据库初始化失败")
        
    # 初始化RPA功能数据库
    print("\n3. 初始化RPA功能数据库")
    rpa_db_success = init_rpa_db()
    
    if rpa_db_success:
        print("RPA功能数据库初始化成功")
    else:
        print("RPA功能数据库初始化失败")
    
    # 总结
    print("\n=== 数据库初始化过程完成 ===")
    if main_db_success and cmdb_db_success and rpa_db_success:
        print("所有数据库初始化成功！")
        print("\n登录信息:")
        print("  用户名: admin")
        print("  密码: admin123")
        return 0
    else:
        print("部分数据库初始化失败，请检查错误信息")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 