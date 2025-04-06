from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from database.config import get_database_url

# 创建数据库引擎
cmdb_engine = create_engine(
    get_database_url("cmdb"),
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800
)

# 创建会话工厂
CMDBSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cmdb_engine)

# 创建基类
CMDBBase = declarative_base()

# 在连接时设置schema
@event.listens_for(cmdb_engine, 'connect')
def set_search_path(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("SET search_path TO cmdb")
    cursor.close()

def get_cmdb_db():
    """获取CMDB数据库会话"""
    db = CMDBSessionLocal()
    try:
        yield db
    finally:
        db.close() 