from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from database.session import get_db
from database.models import User
from schemas.user import Token
from auth.authentication import (
    authenticate_user, create_access_token, get_current_active_user,
    create_refresh_token, verify_refresh_token, revoke_refresh_token, revoke_all_user_refresh_tokens
)
from auth.ldap_auth import ldap_authenticate
from auth.totp import setup_totp, generate_qr_code, verify_totp
from auth.audit import log_event

router = APIRouter(prefix="/api/auth", tags=["authentication"])

def get_client_ip(request: Request) -> str:
    """获取客户端真实IP地址"""
    # 优先使用X-Forwarded-For头
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # 取第一个IP（最原始的客户端IP）
        return forwarded_for.split(",")[0].strip()
    
    # 其次使用X-Real-IP头
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # 最后使用客户端IP
    return request.client.host

@router.post("/login", response_model=Token)
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """本地用户登录"""
    # 获取用户
    user = db.query(User).filter(User.username == form_data.username).first()
    
    # 获取客户端IP
    client_ip = get_client_ip(request)
    
    # 检查用户是否被锁定
    if user and user.locked_until:
        lock_time = datetime.fromisoformat(user.locked_until)
        if lock_time > datetime.utcnow():
            log_event(
                db=db,
                event_type="login",
                user=user,
                ip_address=client_ip,
                user_agent=request.headers.get("user-agent"),
                success=False,
                details={"reason": "Account locked"}
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Account locked until {user.locked_until}",
                headers={"WWW-Authenticate": "Bearer"},
            )
        else:
            # 锁定时间已过，重置失败次数
            user.failed_login_attempts = 0
            user.locked_until = None
            db.commit()
    
    # 验证用户
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        # 增加失败登录尝试次数
        if user := db.query(User).filter(User.username == form_data.username).first():
            user.failed_login_attempts += 1
            
            # 检查是否需要锁定账号
            if user.failed_login_attempts >= 5:
                lock_time = datetime.utcnow() + timedelta(minutes=15)
                user.locked_until = lock_time.isoformat()
                
                log_event(
                    db=db,
                    event_type="account_locked",
                    user=user,
                    ip_address=client_ip,
                    user_agent=request.headers.get("user-agent"),
                    success=True,
                    details={"reason": "5 failed login attempts", "locked_until": user.locked_until}
                )
            
            db.commit()
        
        log_event(
            db=db,
            event_type="login",
            username=form_data.username,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=False,
            details={"reason": "Invalid credentials"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 检查是否是首次登录（没有last_login记录）
    is_first_login = user.last_login is None
    print(f"User {user.username} is_first_login: {is_first_login}, role: {user.role}, is_ldap_user: {user.is_ldap_user}, totp_enabled: {user.totp_enabled}")
    
    # 检查是否需要2FA
    if user.totp_enabled:
        # 已启用2FA，需要验证
        print(f"User {user.username} has 2FA enabled, requiring verification")
        log_event(
            db=db,
            event_type="login_2fa_required",
            user=user,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=True
        )
        return {"access_token": f"2FA_REQUIRED_{user.username}", "token_type": "bearer"}
    elif is_first_login and user.role in ["Admin", "Operator"] and not user.is_ldap_user and user.username != "admin":
        # 首次登录的管理员和操作员需要设置2FA，但admin用户除外
        print(f"User {user.username} is first login and needs to setup 2FA")
        log_event(
            db=db,
            event_type="login_2fa_setup_required",
            user=user,
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=True
        )
        return {"access_token": f"2FA_REQUIRED_SETUP_{user.username}", "token_type": "bearer"}
    
    # 重置失败登录尝试次数
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.utcnow().isoformat()
    db.commit()
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # 创建刷新令牌
    refresh_token, refresh_token_expires = create_refresh_token(user.id, db)
    
    log_event(
        db=db,
        event_type="login",
        user=user,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
        success=True
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "expires_in": 1800  # 30分钟，单位秒
    }

@router.post("/ldap-login")
async def ldap_login(
    request: Request,
    username: str = Body(...),
    password: str = Body(...),
    db: Session = Depends(get_db)
):
    """LDAP用户登录"""
    user, error = ldap_authenticate(username, password, db)
    
    if not user:
        log_event(
            db=db,
            event_type="ldap_login",
            username=username,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("user-agent"),
            success=False,
            details={"reason": error}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error,
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 检查是否需要2FA
    if user.totp_enabled:
        # 返回需要2FA的标志
        log_event(
            db=db,
            event_type="ldap_login_2fa_required",
            user=user,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("user-agent"),
            success=True
        )
        return {"access_token": f"2FA_REQUIRED_{user.username}", "token_type": "bearer"}
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # 创建刷新令牌
    refresh_token, refresh_token_expires = create_refresh_token(user.id, db)
    
    log_event(
        db=db,
        event_type="ldap_login",
        user=user,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
        success=True
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "expires_in": 1800  # 30分钟，单位秒
    }

@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """用户登出"""
    # 这里可以实现令牌黑名单等功能
    
    log_event(
        db=db,
        event_type="logout",
        user=current_user,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
        success=True
    )
    
    return {"detail": "Successfully logged out"}

@router.get("/verify")
async def verify_token(current_user: User = Depends(get_current_active_user)):
    """验证令牌"""
    return {"username": current_user.username, "role": current_user.role}

@router.post("/totp-setup")
async def setup_totp_endpoint(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """设置TOTP"""
    totp_data = setup_totp(current_user, db)
    
    log_event(
        db=db,
        event_type="totp_setup",
        user=current_user,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
        success=True
    )
    
    return totp_data

@router.get("/totp-qrcode")
async def get_totp_qrcode(
    uri: str
):
    """获取TOTP QR码"""
    return generate_qr_code(uri)

@router.post("/totp-verify")
async def verify_totp_endpoint(
    request: Request,
    totp_code: str = Body(...),
    username: str = Body(...),
    db: Session = Depends(get_db)
):
    """验证TOTP"""
    try:
        print(f"Verifying TOTP for user: {username}, code: {totp_code}")
        
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"User not found: {username}")
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.totp_secret:
            print(f"User {username} has no TOTP secret")
            raise HTTPException(status_code=400, detail="TOTP not set up for this user")
        
        if not verify_totp(user, totp_code, db):
            print(f"Invalid TOTP code for user: {username}")
            log_event(
                db=db,
                event_type="totp_verify",
                user=user,
                ip_address=get_client_ip(request),
                user_agent=request.headers.get("user-agent"),
                success=False,
                details={"reason": "Invalid TOTP code"}
            )
            raise HTTPException(status_code=401, detail="Invalid TOTP code")
        
        # 如果用户还没有启用TOTP，则启用它
        if not user.totp_enabled:
            print(f"Enabling TOTP for user: {username}")
            user.totp_enabled = True
            db.commit()
            
            log_event(
                db=db,
                event_type="totp_enabled",
                user=user,
                ip_address=get_client_ip(request),
                user_agent=request.headers.get("user-agent"),
                success=True
            )
        
        # 验证成功，创建访问令牌
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        # 创建刷新令牌
        refresh_token, refresh_token_expires = create_refresh_token(user.id, db)
        
        # 更新用户最后登录时间
        user.last_login = datetime.utcnow().isoformat()
        db.commit()
        
        log_event(
            db=db,
            event_type="totp_verify",
            user=user,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("user-agent"),
            success=True
        )
        
        print(f"TOTP verification successful for user: {username}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": refresh_token,
            "expires_in": 1800  # 30分钟，单位秒
        }
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        print(f"Error verifying TOTP for user {username}: {str(e)}")
        # 记录失败事件
        try:
            user = db.query(User).filter(User.username == username).first()
            if user:
                log_event(
                    db=db,
                    event_type="totp_verify",
                    user=user,
                    ip_address=get_client_ip(request),
                    user_agent=request.headers.get("user-agent"),
                    success=False,
                    details={"error": str(e)}
                )
        except Exception as log_error:
            print(f"Error logging event: {str(log_error)}")
        
        # 抛出通用错误
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/refresh")
async def refresh_access_token(
    request: Request,
    refresh_token: str = Body(...),
    db: Session = Depends(get_db)
):
    """刷新访问令牌"""
    # 获取客户端IP
    client_ip = get_client_ip(request)
    
    user = verify_refresh_token(refresh_token, db)
    
    if not user:
        log_event(
            db=db,
            event_type="token_refresh",
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent"),
            success=False,
            details={"reason": "Invalid refresh token"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 创建新的访问令牌
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # 记录成功事件
    log_event(
        db=db,
        event_type="token_refresh",
        user=user,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
        success=True
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/revoke")
async def revoke_token(
    request: Request,
    refresh_token: str = Body(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """撤销刷新令牌"""
    success = revoke_refresh_token(refresh_token, db)
    
    log_event(
        db=db,
        event_type="token_revoke",
        user=current_user,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
        success=success
    )
    
    if success:
        return {"detail": "Token revoked successfully"}
    else:
        raise HTTPException(status_code=404, detail="Token not found")

@router.post("/revoke-all")
async def revoke_all_tokens(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """撤销用户的所有刷新令牌"""
    count = revoke_all_user_refresh_tokens(current_user.id, db)
    
    log_event(
        db=db,
        event_type="token_revoke_all",
        user=current_user,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
        success=True,
        details={"count": count}
    )
    
    return {"detail": f"{count} tokens revoked successfully"}

@router.post("/totp-setup-for-user")
async def setup_totp_for_user(
    request: Request,
    db: Session = Depends(get_db)
):
    """为指定用户设置TOTP"""
    try:
        # 打印请求信息
        body = await request.body()
        print(f"Request body: {body}")
        print(f"Request headers: {request.headers}")
        
        # 解析请求体
        form_data = await request.form()
        username = form_data.get('username')
        
        if not username:
            # 尝试从JSON中获取
            try:
                json_data = await request.json()
                username = json_data.get('username')
            except:
                pass
        
        if not username:
            print("Username not provided in request")
            raise HTTPException(status_code=422, detail="Username is required")
        
        print(f"Setting up TOTP for user: {username}, type: {type(username)}")
        
        # 确保username是字符串类型
        if not isinstance(username, str):
            print(f"Username is not a string: {username}, type: {type(username)}")
            username = str(username)
            print(f"Converted username to string: {username}")
        
        # 查找用户
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"User not found: {username}")
            raise HTTPException(status_code=404, detail="User not found")
        
        # 检查用户是否已经完全设置了2FA
        if user.totp_enabled and user.totp_secret:
            print(f"User {username} already has TOTP fully enabled")
            raise HTTPException(status_code=400, detail="User already has 2FA enabled")
        
        # 设置TOTP
        totp_data = setup_totp(user, db)
        
        log_event(
            db=db,
            event_type="totp_setup",
            user=user,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("user-agent"),
            success=True
        )
        
        print(f"TOTP setup successful for user: {username}")
        return totp_data
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        print(f"Error setting up TOTP for user {username}: {str(e)}")
        # 记录失败事件
        try:
            user = db.query(User).filter(User.username == username).first()
            if user:
                log_event(
                    db=db,
                    event_type="totp_setup",
                    user=user,
                    ip_address=get_client_ip(request),
                    user_agent=request.headers.get("user-agent"),
                    success=False,
                    details={"error": str(e)}
                )
        except Exception as log_error:
            print(f"Error logging event: {str(log_error)}")
        
        # 抛出通用错误
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/direct-totp-setup")
async def direct_totp_setup(
    request: Request,
    username: str = Body(...),
    password: str = Body(...),
    db: Session = Depends(get_db)
):
    """直接设置TOTP，不需要用户登录，只需要用户名和密码"""
    try:
        print(f"Direct TOTP setup for user: {username}")
        
        # 验证用户身份
        user = authenticate_user(db, username, password)
        if not user:
            print(f"Authentication failed for user: {username}")
            raise HTTPException(status_code=401, detail="Incorrect username or password")
        
        # 检查用户是否已经设置了TOTP
        if user.totp_enabled:
            print(f"User {username} already has TOTP enabled")
            raise HTTPException(status_code=400, detail="TOTP already enabled for this user")
        
        # 设置TOTP
        totp_data = setup_totp(user, db)
        
        log_event(
            db=db,
            event_type="totp_setup",
            user=user,
            ip_address=get_client_ip(request),
            user_agent=request.headers.get("user-agent"),
            success=True
        )
        
        print(f"Direct TOTP setup successful for user: {username}")
        return totp_data
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        print(f"Error in direct TOTP setup for user {username}: {str(e)}")
        # 记录失败事件
        try:
            user = db.query(User).filter(User.username == username).first()
            if user:
                log_event(
                    db=db,
                    event_type="totp_setup",
                    user=user,
                    ip_address=get_client_ip(request),
                    user_agent=request.headers.get("user-agent"),
                    success=False,
                    details={"error": str(e)}
                )
        except Exception as log_error:
            print(f"Error logging event: {str(log_error)}")
        
        # 抛出通用错误
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """获取当前用户信息"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "department": current_user.department,
        "is_active": current_user.is_active,
        "is_ldap_user": current_user.is_ldap_user,
        "totp_enabled": current_user.totp_enabled,
        "last_login": current_user.last_login
    } 