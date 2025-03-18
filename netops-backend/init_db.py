from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from datetime import datetime
import os

# 导入数据库模型
from database.models import Base, User, LDAPConfig
from database.session import SessionLocal

# 创建数据库连接
DATABASE_URL = "sqlite:///./netops.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建密码哈希上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    """生成密码哈希"""
    return pwd_context.hash(password)

def init_db():
    """初始化数据库"""
    # 创建所有表（如果不存在）
    Base.metadata.create_all(bind=engine)
    print("已创建数据库表（如果不存在）")
    
    db = SessionLocal()
    try:
        # 检查是否已有管理员用户
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            # 创建管理员用户
            admin_user = User(
                username="admin",
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
                role="Admin",
                department="IT",
                last_login=datetime.utcnow().isoformat(),
                password_changed_at=datetime.utcnow().isoformat()
            )
            db.add(admin_user)
            print("创建管理员用户成功")
        else:
            print("管理员用户已存在")
        
        # 检查是否已有LDAP配置
        ldap_config = db.query(LDAPConfig).first()
        if not ldap_config:
            # 创建LDAP配置
            ldap_config = LDAPConfig(
                server_url="ldap://ldap.example.com:389",
                bind_dn="cn=admin,dc=example,dc=com",
                bind_password="admin123",
                search_base="dc=example,dc=com",
                user_search_filter="(sAMAccountName={username})",
                group_search_filter="(objectClass=group)",
                require_2fa=False,
                admin_group_dn="cn=Administrators,ou=Groups,dc=example,dc=com",
                operator_group_dn="cn=Operators,ou=Groups,dc=example,dc=com",
                auditor_group_dn="cn=Auditors,ou=Groups,dc=example,dc=com"
            )
            db.add(ldap_config)
            print("创建LDAP配置成功")
        else:
            print("LDAP配置已存在")
        
        db.commit()
        print("数据库初始化完成")
    except Exception as e:
        db.rollback()
        print(f"初始化数据库失败: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db() 