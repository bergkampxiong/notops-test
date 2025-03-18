import os
import sqlite3
import sys

# 获取当前脚本所在目录
current_dir = os.path.dirname(os.path.abspath(__file__))
# 数据库文件路径
db_path = os.path.join(current_dir, 'cmdb.db')
# SQL脚本文件路径
sql_path = os.path.join(current_dir, 'init_cmdb_db.sql')

def init_db():
    """初始化CMDB数据库"""
    try:
        print(f"正在连接数据库: {db_path}")
        # 连接数据库
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 读取SQL脚本
        with open(sql_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        # 执行SQL脚本
        print("正在执行SQL脚本...")
        cursor.executescript(sql_script)
        
        # 提交事务
        conn.commit()
        
        # 验证表是否创建成功
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print("创建的表:")
        for table in tables:
            print(f"- {table[0]}")
        
        # 验证数据是否插入成功
        cursor.execute("SELECT COUNT(*) FROM cmdb_device_types;")
        device_type_count = cursor.fetchone()[0]
        print(f"设备类型数量: {device_type_count}")
        
        cursor.execute("SELECT COUNT(*) FROM cmdb_vendors;")
        vendor_count = cursor.fetchone()[0]
        print(f"厂商数量: {vendor_count}")
        
        cursor.execute("SELECT COUNT(*) FROM cmdb_locations;")
        location_count = cursor.fetchone()[0]
        print(f"位置数量: {location_count}")
        
        cursor.execute("SELECT COUNT(*) FROM cmdb_departments;")
        department_count = cursor.fetchone()[0]
        print(f"部门数量: {department_count}")
        
        cursor.execute("SELECT COUNT(*) FROM cmdb_asset_statuses;")
        status_count = cursor.fetchone()[0]
        print(f"资产状态数量: {status_count}")
        
        # 关闭连接
        cursor.close()
        conn.close()
        
        print("CMDB数据库初始化完成！")
        return True
    except Exception as e:
        print(f"初始化数据库失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    init_db() 