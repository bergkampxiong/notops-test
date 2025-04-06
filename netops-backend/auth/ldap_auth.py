from ldap3 import Server, Connection, ALL, NTLM
from sqlalchemy.orm import Session
from datetime import datetime
import json

from database.models import User, LDAPConfig

def get_ldap_config(db: Session):
    """获取LDAP配置"""
    return db.query(LDAPConfig).first()

def ldap_authenticate(username: str, password: str, db: Session):
    """LDAP认证"""
    ldap_config = get_ldap_config(db)
    if not ldap_config:
        return None, "LDAP configuration not found"
    
    try:
        # 创建LDAP服务器连接
        server = Server(ldap_config.server_url, get_info=ALL)
        
        # 构建用户DN
        user_filter = ldap_config.user_search_filter.replace("{username}", username)
        
        # 尝试绑定
        conn = Connection(
            server,
            user=ldap_config.bind_dn,
            password=ldap_config.bind_password,
            authentication=NTLM
        )
        
        if not conn.bind():
            return None, "Failed to bind to LDAP server"
        
        # 搜索用户
        conn.search(
            ldap_config.search_base,
            user_filter,
            attributes=['cn', 'mail', 'distinguishedName', 'memberOf']
        )
        
        if len(conn.entries) == 0:
            return None, "User not found in LDAP"
        
        user_dn = conn.entries[0].distinguishedName.value
        
        # 尝试使用用户凭据绑定
        user_conn = Connection(server, user=user_dn, password=password)
        if not user_conn.bind():
            return None, "Invalid LDAP credentials"
        
        # 获取用户信息
        user_info = {
            "dn": user_dn,
            "email": conn.entries[0].mail.value if hasattr(conn.entries[0], 'mail') else None,
            "groups": conn.entries[0].memberOf.values if hasattr(conn.entries[0], 'memberOf') else []
        }
        
        # 确定用户角色
        role = "Operator"  # 默认角色
        if ldap_config.admin_group_dn and ldap_config.admin_group_dn in user_info["groups"]:
            role = "Admin"
        elif ldap_config.auditor_group_dn and ldap_config.auditor_group_dn in user_info["groups"]:
            role = "Auditor"
        
        # 检查用户是否已存在
        db_user = db.query(User).filter(User.username == username).first()
        
        if db_user:
            # 更新现有用户
            db_user.is_ldap_user = True
            db_user.ldap_dn = user_dn
            db_user.email = user_info["email"] or db_user.email
            db_user.role = role
            db_user.last_login = datetime.utcnow().isoformat()
        else:
            # 创建新用户
            db_user = User(
                username=username,
                email=user_info["email"],
                hashed_password="",  # LDAP用户不使用本地密码
                is_active=True,
                is_ldap_user=True,
                ldap_dn=user_dn,
                role=role,
                last_login=datetime.utcnow().isoformat()
            )
            db.add(db_user)
        
        # 如果LDAP配置要求2FA，则启用
        if ldap_config.require_2fa and not db_user.totp_enabled:
            db_user.totp_enabled = True
        
        db.commit()
        
        return db_user, None
    
    except Exception as e:
        return None, str(e) 