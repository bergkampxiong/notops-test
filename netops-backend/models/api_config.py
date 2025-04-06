from sqlalchemy import Column, String, DateTime
from database.base import Base
import datetime
import pytz

class ApiConfig(Base):
    __tablename__ = "api_configs"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    method = Column(String, nullable=False)
    headers = Column(String)
    body = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(pytz.timezone('Asia/Shanghai')))
    created_by = Column(String, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(pytz.timezone('Asia/Shanghai')), onupdate=lambda: datetime.datetime.now(pytz.timezone('Asia/Shanghai')))
    updated_by = Column(String, nullable=False) 