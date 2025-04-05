from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import os
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
import warnings
from sqlalchemy import exc as sa_exc

# 禁用SQLAlchemy的警告
warnings.filterwarnings('ignore', category=sa_exc.SAWarning)

# 导入数据库模型和会话
from database.models import Base, UsedTOTP, RefreshToken
from database.session import engine, get_db
import database.cmdb_models  # 先导入CMDB模型
import database.category_models  # 再导入设备分类模型
import database.config_management_models  # 导入配置管理模型
# 导入设备连接和连接池模型
from database.init_all_db import (
    Base as NetOpsBase, 
    DeviceConnection, ConnectionPool, ConnectionPoolStats, ConnectionPoolMetrics,
    RpaDeviceConnection, RpaConnectionLog, RpaCommandLog,
    RpaConnectionPool, RpaPoolStats, RpaPoolMetrics
)

# 导入路由
from routes import auth, users, audit, ldap, security, config_management, config_generator_router, device_connection
from routes.cmdb import router as cmdb_router
from routes.device import router as device_router

# 导入连接池监控服务
from utils.init_connection_pools import init_connection_pools, shutdown_connection_pools

# 创建应用
app = FastAPI(title="NetOps API", version="1.0.0")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有请求头
)

def init_db():
    """初始化数据库，确保所有表都被创建"""
    try:
        # 创建标准表
        Base.metadata.create_all(bind=engine)
        # 创建连接池和设备连接相关表
        NetOpsBase.metadata.create_all(bind=engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Error creating database tables: {e}")
        raise e

# 初始化数据库
init_db()

# 包含路由
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(audit.router)
app.include_router(ldap.router)
app.include_router(security.router, prefix="/api/security")
app.include_router(cmdb_router, prefix="/api")
app.include_router(device_router, prefix="/api/device")
app.include_router(config_management.router, prefix="/api", tags=["config"])
app.include_router(config_generator_router, prefix="/api/config-generator", tags=["config-generator"])
app.include_router(device_connection.router)

# 定期清理任务
def cleanup_expired_records():
    """清理过期的记录"""
    from sqlalchemy.orm import Session
    from database.session import SessionLocal
    
    db = SessionLocal()
    try:
        # 当前时间
        now = datetime.utcnow().isoformat()
        
        # 清理过期的TOTP记录
        db.query(UsedTOTP).filter(UsedTOTP.expires_at < now).delete()
        
        # 清理过期的刷新令牌
        db.query(RefreshToken).filter(RefreshToken.expires_at < now).delete()
        
        db.commit()
        print(f"Cleanup task completed at {now}")
    except Exception as e:
        print(f"Error in cleanup task: {e}")
    finally:
        db.close()

# 启动定期清理任务
scheduler = BackgroundScheduler()
scheduler.add_job(cleanup_expired_records, 'interval', hours=24)  # 每24小时执行一次
scheduler.start()

# 根路由
@app.get("/")
async def root():
    return {"message": "Welcome to NetOps API"}

# 健康检查
@app.get("/health")
async def health():
    return {"status": "ok"}

# 应用启动事件
@app.on_event("startup")
async def startup_event():
    """应用启动时执行的操作"""
    # 初始化连接池监控服务
    init_connection_pools()

# 应用关闭事件
@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时执行的操作"""
    # 关闭连接池监控服务
    shutdown_connection_pools()
    # 停止调度器
    scheduler.shutdown()

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """处理favicon.ico请求，返回204状态码（无内容）"""
    return Response(status_code=204)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 