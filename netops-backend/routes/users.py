from fastapi import APIRouter, Depends, HTTPException, Body, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import re

from database.session import get_db
from database.models import User, SecuritySettings
from schemas.user import UserOut, UserCreate
from auth.authentication import get_current_active_user, verify_password, get_password_hash
from auth.rbac import role_required, roles_required, permission_required
from auth.user_management import (
    create_user as create_user_service,
    disable_user as disable_user_service,
    reset_password as reset_password_service,
    toggle_2fa as toggle_2fa_service,
    get_users as get_users_service,
    update_user_role as update_user_role_service,
    update_user_department as update_user_department_service
)
from auth.audit import log_event

router = APIRouter(prefix="/api/users", tags=["users"])

# 用户更新模型
class UserUpdate(BaseModel):
    email: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    totp_enabled: Optional[bool] = None

# 用户删除请求模型
class UserDeleteRequest(BaseModel):
    username: str

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """获取当前用户信息"""
    return current_user

@router.get("/", response_model=List[UserOut])
# 暂时移除角色检查以便调试
# @roles_required(["admin", "auditor"])
async def get_users(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取用户列表"""
    try:
        # 手动检查角色
        if current_user.role not in ["admin", "auditor"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # 获取所有用户
        users = db.query(User).offset(skip).limit(limit).all()
        return users
    except Exception as e:
        raise

@router.post("/create")
@role_required("admin")
async def create_user(
    request: Request,
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建用户"""
    # 获取客户端IP
    client_ip = request.state.client_ip if hasattr(request.state, 'client_ip') else request.client.host
    
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        log_event(
            db=db,
            event_type="create_user",
            user=current_user,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=False,
            details={"reason": "Username already registered", "username": user.username}
        )
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = create_user_service(db, user)
    
    log_event(
        db=db,
        event_type="create_user",
        user=current_user,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
        success=True,
        details={"username": user.username}
    )
    
    return {"detail": "User created successfully"}

@router.post("/disable")
@role_required("admin")
async def disable_user(
    request: Request,
    username: str = Body(...),
    enable: Optional[bool] = Body(None),  # 添加可选参数，用于指定是启用还是禁用
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """禁用/启用用户"""
    # 获取客户端IP
    client_ip = request.state.client_ip if hasattr(request.state, 'client_ip') else request.client.host
    
    # 查找用户
    user = db.query(User).filter(User.username == username).first()
    if not user:
        log_event(
            db=db,
            event_type="toggle_user_status",
            user=current_user,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=False,
            details={"reason": "User not found", "username": username}
        )
        raise HTTPException(status_code=404, detail="User not found")
    
    # 如果提供了enable参数，则使用它；否则，切换当前状态
    if enable is not None:
        user.is_active = enable
    else:
        user.is_active = not user.is_active
    
    db.commit()
    
    action = "enable" if user.is_active else "disable"
    log_event(
        db=db,
        event_type=f"{action}_user",
        user=current_user,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
        success=True,
        details={"username": username, "is_active": user.is_active}
    )
    
    return {"detail": f"User {action}d successfully"}

@router.post("/reset-password")
@role_required("admin")
async def reset_password(
    request: Request,
    username: str = Body(...),
    new_password: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """重置用户密码"""
    # 获取客户端IP
    client_ip = request.state.client_ip if hasattr(request.state, 'client_ip') else request.client.host
    
    user = reset_password_service(db, username, new_password)
    if not user:
        log_event(
            db=db,
            event_type="reset_password",
            user=current_user,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=False,
            details={"reason": "User not found", "username": username}
        )
        raise HTTPException(status_code=404, detail="User not found")
    
    log_event(
        db=db,
        event_type="reset_password",
        user=current_user,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
        success=True,
        details={"username": username}
    )
    
    return {"detail": "Password reset successfully"}

@router.post("/toggle-2fa")
@role_required("admin")
async def toggle_2fa(
    request: Request,
    username: str = Body(...),
    enable: bool = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """启用/禁用2FA"""
    # 获取客户端IP
    client_ip = request.state.client_ip if hasattr(request.state, 'client_ip') else request.client.host
    
    user = toggle_2fa_service(db, username, enable)
    if not user:
        log_event(
            db=db,
            event_type="toggle_2fa",
            user=current_user,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=False,
            details={"reason": "User not found", "username": username}
        )
        raise HTTPException(status_code=404, detail="User not found")
    
    log_event(
        db=db,
        event_type="toggle_2fa",
        user=current_user,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
        success=True,
        details={"username": username, "enable": enable}
    )
    
    return {"detail": "2FA status updated successfully"}

@router.post("/update-role")
@role_required("admin")
async def update_role(
    request: Request,
    username: str = Body(...),
    role: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新用户角色"""
    # 获取客户端IP
    client_ip = request.state.client_ip if hasattr(request.state, 'client_ip') else request.client.host
    
    if role not in ["Admin", "Operator", "Auditor"]:
        log_event(
            db=db,
            event_type="update_role",
            user=current_user,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=False,
            details={"reason": "Invalid role", "username": username, "role": role}
        )
        raise HTTPException(status_code=400, detail="Invalid role")
    
    user = update_user_role_service(db, username, role)
    if not user:
        log_event(
            db=db,
            event_type="update_role",
            user=current_user,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=False,
            details={"reason": "User not found", "username": username}
        )
        raise HTTPException(status_code=404, detail="User not found")
    
    log_event(
        db=db,
        event_type="update_role",
        user=current_user,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
        success=True,
        details={"username": username, "role": role}
    )
    
    return {"detail": "User role updated successfully"}

@router.post("/update-department")
@role_required("admin")
async def update_department(
    request: Request,
    username: str = Body(...),
    department: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新用户部门"""
    # 获取客户端IP
    client_ip = request.state.client_ip if hasattr(request.state, 'client_ip') else request.client.host
    
    user = update_user_department_service(db, username, department)
    if not user:
        log_event(
            db=db,
            event_type="update_department",
            user=current_user,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=False,
            details={"reason": "User not found", "username": username}
        )
        raise HTTPException(status_code=404, detail="User not found")
    
    log_event(
        db=db,
        event_type="update_department",
        user=current_user,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
        success=True,
        details={"username": username, "department": department}
    )
    
    return {"detail": "User department updated successfully"}

@router.put("/{user_id}")
@role_required("admin")
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新用户信息"""
    # 获取客户端IP
    client_ip = request.state.client_ip if hasattr(request.state, 'client_ip') else request.client.host
    
    # 查找用户
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        log_event(
            db=db,
            event_type="update_user",
            user=current_user,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=False,
            details={"reason": "User not found", "user_id": user_id}
        )
        raise HTTPException(status_code=404, detail="User not found")
    
    # 不允许修改LDAP用户的某些属性
    if user.is_ldap_user and (user_update.email is not None or user_update.role is not None):
        log_event(
            db=db,
            event_type="update_user",
            user=current_user,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=False,
            details={"reason": "Cannot modify LDAP user attributes", "user_id": user_id}
        )
        raise HTTPException(status_code=400, detail="Cannot modify LDAP user attributes")
    
    # 更新用户信息
    if user_update.email is not None:
        user.email = user_update.email
    if user_update.department is not None:
        user.department = user_update.department
    if user_update.role is not None:
        user.role = user_update.role
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    if user_update.totp_enabled is not None:
        user.totp_enabled = user_update.totp_enabled
    
    db.commit()
    
    log_event(
        db=db,
        event_type="update_user",
        user=current_user,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
        success=True,
        details={"user_id": user_id, "updated_fields": user_update.dict(exclude_unset=True)}
    )
    
    return {"detail": "User updated successfully"}

@router.post("/delete")
@role_required("admin")
async def delete_user(
    request: Request,
    user_delete: UserDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除用户"""
    # 获取客户端IP
    client_ip = request.state.client_ip if hasattr(request.state, 'client_ip') else request.client.host
    
    # 不允许删除自己
    if user_delete.username == current_user.username:
        log_event(
            db=db,
            event_type="delete_user",
            user=current_user,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=False,
            details={"reason": "Cannot delete yourself", "username": user_delete.username}
        )
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    # 查找用户
    user = db.query(User).filter(User.username == user_delete.username).first()
    if not user:
        log_event(
            db=db,
            event_type="delete_user",
            user=current_user,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=False,
            details={"reason": "User not found", "username": user_delete.username}
        )
        raise HTTPException(status_code=404, detail="User not found")
    
    # 删除用户
    db.delete(user)
    db.commit()
    
    log_event(
        db=db,
        event_type="delete_user",
        user=current_user,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
        success=True,
        details={"username": user_delete.username}
    )
    
    return {"detail": "User deleted successfully"}

@router.post("/change-password")
async def change_password(
    request: Request,
    old_password: str = Body(...),
    new_password: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """修改当前用户密码"""
    # 获取客户端IP
    client_ip = request.state.client_ip if hasattr(request.state, 'client_ip') else request.client.host
    
    # 验证旧密码
    if not verify_password(old_password, current_user.hashed_password):
        log_event(
            db=db,
            event_type="change_password",
            user=current_user,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=False,
            details={"reason": "Invalid old password"}
        )
        raise HTTPException(status_code=400, detail="Invalid old password")
    
    # 获取密码策略
    settings = db.query(SecuritySettings).first()
    if not settings:
        settings = SecuritySettings()
    
    # 验证新密码是否符合密码策略
    if settings.password_complexity_enabled:
        # 检查密码长度
        if len(new_password) < settings.password_min_length:
            raise HTTPException(
                status_code=400, 
                detail=f"Password must be at least {settings.password_min_length} characters long"
            )
        
        # 检查是否包含大写字母
        if settings.password_require_uppercase and not re.search(r'[A-Z]', new_password):
            raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
        
        # 检查是否包含小写字母
        if settings.password_require_lowercase and not re.search(r'[a-z]', new_password):
            raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
        
        # 检查是否包含数字
        if settings.password_require_numbers and not re.search(r'[0-9]', new_password):
            raise HTTPException(status_code=400, detail="Password must contain at least one number")
        
        # 检查是否包含特殊字符
        if settings.password_require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', new_password):
            raise HTTPException(status_code=400, detail="Password must contain at least one special character")
    
    # 更新密码
    current_user.hashed_password = get_password_hash(new_password)
    current_user.password_changed_at = datetime.utcnow().isoformat()
    db.commit()
    
    log_event(
        db=db,
        event_type="change_password",
        user=current_user,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
        success=True
    )
    
    return {"detail": "Password changed successfully"} 