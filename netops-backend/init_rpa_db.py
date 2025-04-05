#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 添加当前目录到路径
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# 导入数据库配置和会话
from database.config import DATABASE_URL
from database.init_all_db import (
    Base, RpaDeviceConnection, RpaConnectionLog, RpaCommandLog,
    RpaConnectionPool, RpaPoolStats, RpaPoolMetrics
)

def init_rpa_db():
    """初始化RPA功能相关数据库表"""
    try:
        # 创建数据库引擎
        engine = create_engine(DATABASE_URL)
        
        # 仅创建RPA相关表
        tables = [
            RpaDeviceConnection.__table__, 
            RpaConnectionLog.__table__, 
            RpaCommandLog.__table__,
            RpaConnectionPool.__table__, 
            RpaPoolStats.__table__, 
            RpaPoolMetrics.__table__
        ]
        
        # 创建表
        Base.metadata.create_all(bind=engine, tables=tables)
        print("RPA功能数据库表已创建")
        
        # 创建会话
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
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
    print("=== 开始RPA功能数据库初始化过程 ===")
    
    # 初始化RPA数据库表
    success = init_rpa_db()
    
    if success:
        print("RPA功能数据库初始化成功")
    else:
        print("RPA功能数据库初始化失败")
    
    # 总结
    print("\n=== RPA功能数据库初始化过程完成 ===")
    if success:
        print("所有RPA功能数据库表初始化成功！")
        return 0
    else:
        print("RPA功能数据库初始化失败，请检查错误信息")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 