from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# 数据库连接配置
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./netops.db")

# 创建数据库引擎
engine = create_engine(DATABASE_URL)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 