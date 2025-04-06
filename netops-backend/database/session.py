from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .config import get_database_url

# 创建数据库引擎
engine = create_engine(get_database_url())

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 