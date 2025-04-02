import sqlite3
import os
import sys

def restore_database(backup_file):
    """从备份文件恢复数据库"""
    if not os.path.exists(backup_file):
        print(f"错误：备份文件 {backup_file} 不存在")
        return False
    
    try:
        # 连接到数据库（如果不存在会自动创建）
        conn = sqlite3.connect('netops.db')
        
        # 读取备份文件
        with open(backup_file, 'r', encoding='utf-8') as f:
            # 执行SQL语句
            conn.executescript(f.read())
        
        # 提交更改
        conn.commit()
        conn.close()
        
        print(f"数据库已成功从 {backup_file} 恢复")
        return True
        
    except Exception as e:
        print(f"恢复数据库时出错: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("使用方法: python restore_database.py <备份文件路径>")
        sys.exit(1)
    
    backup_file = sys.argv[1]
    restore_database(backup_file) 