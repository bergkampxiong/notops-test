from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 数据库连接配置
CMDB_DATABASE_URL = os.environ.get("CMDB_DATABASE_URL", "sqlite:///./cmdb.db")

# 创建数据库引擎
cmdb_engine = create_engine(
    CMDB_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 创建会话工厂
CMDBSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cmdb_engine)

# 创建基类
CMDBBase = declarative_base()

# 获取数据库会话
def get_cmdb_db():
    db = CMDBSessionLocal()
    try:
        yield db
    finally:
        db.close() 