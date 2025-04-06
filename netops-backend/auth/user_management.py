from sqlalchemy.orm import Session
from datetime import datetime
import pytz

from database.models import User
from auth.authentication import get_password_hash
from schemas.user import UserCreate

def create_user(db: Session, user: UserCreate):
    """创建用户"""
    tz = pytz.timezone('Asia/Shanghai')
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        is_active=user.is_active if user.is_active is not None else True,
        is_ldap_user=False,
        role=user.role if user.role else "Operator",
        department=user.department,
        totp_enabled=user.totp_enabled if user.totp_enabled is not None else False,
        password_changed_at=datetime.now(tz).isoformat()
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

def disable_user(db: Session, username: str):
    """禁用用户"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    
    user.is_active = False
    db.commit()
    
    return user

def reset_password(db: Session, username: str, new_password: str):
    """重置用户密码"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    
    user.hashed_password = get_password_hash(new_password)
    user.password_changed_at = datetime.utcnow().isoformat()
    db.commit()
    
    return user

def toggle_2fa(db: Session, username: str, enable: bool):
    """启用/禁用2FA"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    
    user.totp_enabled = enable
    db.commit()
    
    return user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """获取用户列表"""
    return db.query(User).offset(skip).limit(limit).all()

def get_user_by_id(db: Session, user_id: int):
    """根据ID获取用户"""
    return db.query(User).filter(User.id == user_id).first()

def update_user_role(db: Session, username: str, role: str):
    """更新用户角色"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    
    user.role = role
    db.commit()
    
    return user

def update_user_department(db: Session, username: str, department: str):
    """更新用户部门"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    
    user.department = department
    db.commit()
    
    return user 