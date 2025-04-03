from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import get_database_url

# 创建数据库引擎 - 使用与netops相同的数据库
cmdb_engine = create_engine(
    get_database_url("netops"),  # 使用netops数据库
    connect_args={
        "options": "-c datestyle=ISO"
    }
)

# 创建会话工厂
CMDBSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cmdb_engine)

# 创建基类
CMDBBase = declarative_base()

def get_cmdb_db():
    """获取CMDB数据库会话"""
    db = CMDBSessionLocal()
    try:
        yield db
    finally:
        db.close() 