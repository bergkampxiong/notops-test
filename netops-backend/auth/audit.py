from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json

from database.models import AuditLog, User

def log_event(
    db: Session,
    event_type: str,
    user: User = None,
    username: str = None,
    ip_address: str = None,
    user_agent: str = None,
    details: dict = None,
    success: bool = True
):
    """记录审计日志"""
    # 如果提供了user对象，从中获取username
    user_id = user.id if user else None
    user_name = user.username if user else username
    
    # 使用UTC+8时区
    utc_8_time = datetime.utcnow() + timedelta(hours=8)
    
    log_entry = AuditLog(
        timestamp=utc_8_time.isoformat(),
        user_id=user_id,
        username=user_name,
        event_type=event_type,
        ip_address=ip_address,
        user_agent=user_agent,
        details=json.dumps(details) if details else None,
        success=success
    )
    
    db.add(log_entry)
    db.commit()
    
    return log_entry

def get_audit_logs(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    username: str = None,
    event_type: str = None,
    start_date: str = None,
    end_date: str = None,
    success: bool = None
):
    """获取审计日志"""
    query = db.query(AuditLog)
    
    # 应用过滤条件
    if username:
        query = query.filter(AuditLog.username == username)
    
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)
    
    if success is not None:
        query = query.filter(AuditLog.success == success)
    
    # 排序和分页
    query = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit)
    
    return query.all() 