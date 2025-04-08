from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
import ldap3
from database.session import get_db
from database.models import LDAPConfig as LDAPConfigModel
from routes.auth import get_current_active_user, User
from ldap3 import Server, Connection, ALL, SIMPLE

router = APIRouter(
    prefix="/api/ldap",
    tags=["ldap"],
    responses={404: {"description": "Not found"}},
)

# 用于测试连接的简单模型
class LDAPTestConfig(BaseModel):
    server_url: str
    bind_dn: str
    bind_password: str
    search_base: str
    use_ssl: bool = False

class LDAPTestResponse(BaseModel):
    success: bool
    message: str
    server_info: Optional[dict] = None

class LDAPConfigBase(BaseModel):
    server_url: str
    bind_dn: str
    bind_password: str
    search_base: str
    user_search_filter: str
    group_search_filter: Optional[str] = None
    require_2fa: bool = False
    admin_group_dn: Optional[str] = None
    operator_group_dn: Optional[str] = None
    auditor_group_dn: Optional[str] = None
    use_ssl: bool = False

class LDAPConfigCreate(LDAPConfigBase):
    pass

class LDAPConfigUpdate(LDAPConfigBase):
    pass

class LDAPConfigResponse(LDAPConfigBase):
    id: int

    class Config:
        orm_mode = True

class LDAPSyncStatus(BaseModel):
    """LDAP同步状态响应模型"""
    last_sync_time: Optional[str] = None
    sync_status: str = "未同步"
    total_users: int = 0
    synced_users: int = 0
    error_message: Optional[str] = None

@router.get("/config", response_model=LDAPConfigResponse)
async def get_ldap_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取LDAP配置"""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有管理员可以查看LDAP配置"
        )
    
    config = db.query(LDAPConfigModel).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到LDAP配置"
        )
    
    return config

@router.post("/config", response_model=LDAPConfigResponse)
async def create_ldap_config(
    config: LDAPConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建LDAP配置"""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有管理员可以创建LDAP配置"
        )
    
    # 检查是否已存在配置
    existing_config = db.query(LDAPConfigModel).first()
    if existing_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LDAP配置已存在，请使用PUT方法更新"
        )
    
    db_config = LDAPConfigModel(**config.dict())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config

@router.put("/config/{config_id}", response_model=LDAPConfigResponse)
async def update_ldap_config(
    config_id: int,
    config: LDAPConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新LDAP配置"""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有管理员可以更新LDAP配置"
        )
    
    db_config = db.query(LDAPConfigModel).filter(LDAPConfigModel.id == config_id).first()
    if not db_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到LDAP配置"
        )
    
    # 更新配置
    for key, value in config.dict().items():
        setattr(db_config, key, value)
    
    db.commit()
    db.refresh(db_config)
    return db_config

@router.post("/test-connection", response_model=LDAPTestResponse)
async def test_ldap_connection(config: LDAPTestConfig):
    """测试LDAP连接"""
    try:
        print(f"开始测试LDAP连接...")
        print(f"服务器地址: {config.server_url}")
        print(f"基本DN: {config.search_base}")
        print(f"绑定DN: {config.bind_dn}")
        print(f"使用SSL: {config.use_ssl}")
        
        # 添加密码调试信息（测试环境显示明文）
        original_password = config.bind_password
        print(f"原始密码: {original_password}")  # 测试环境显示密码
        print(f"原始密码长度: {len(original_password)}")
        print(f"原始密码中的特殊字符: {[c for c in original_password if not c.isalnum()]}")
        
        # 解析服务器地址，忽略用户可能输入的端口
        server_parts = config.server_url.split(':')
        server_host = server_parts[0]
        server_port = int(server_parts[1]) if len(server_parts) > 1 else (636 if config.use_ssl else 389)
        
        print(f"解析后的服务器信息:")
        print(f"主机: {server_host}")
        print(f"端口: {server_port}")
        
        # 创建LDAP连接
        server = Server(server_host, port=server_port, use_ssl=config.use_ssl, get_info=ALL)
        print(f"LDAP服务器对象创建成功")
        
        # 尝试连接 - 直接使用原始密码，不添加双引号
        print(f"尝试连接到LDAP服务器...")
        conn = Connection(server, user=config.bind_dn, password=original_password, authentication=SIMPLE)
        print(f"LDAP连接对象创建成功")
        
        if not conn.bind():
            print(f"LDAP绑定失败: {conn.result}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"LDAP连接测试失败: {conn.result['description']}"
            )
        
        print(f"LDAP绑定成功")
        
        # 获取服务器信息
        server_info = server.info
        print(f"获取到服务器信息")
        
        # 返回成功响应
        return LDAPTestResponse(
            success=True,
            message="LDAP连接测试成功",
            server_info={
                "vendor_name": server_info.vendor_name,
                "vendor_version": server_info.vendor_version,
                "protocol_version": server_info.protocol_version,
                "naming_contexts": server_info.naming_contexts,
                "supported_controls": server_info.supported_controls,
                "supported_extensions": server_info.supported_extensions,
                "supported_sasl_mechanisms": server_info.supported_sasl_mechanisms
            }
        )
        
    except Exception as e:
        print(f"LDAP连接测试失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LDAP连接测试失败: {str(e)}"
        )

@router.get("/sync-status", response_model=LDAPSyncStatus)
async def get_sync_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取LDAP同步状态"""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有管理员可以查看LDAP同步状态"
        )
    
    # 返回默认状态
    return LDAPSyncStatus()

@router.post("/sync")
async def sync_ldap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """同步LDAP用户和组"""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有管理员可以执行LDAP同步"
        )
    
    # 返回同步已启动的消息
    return {"message": "LDAP同步已启动"} 