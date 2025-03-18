from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
import ldap3
from database.session import get_db
from database.models import LDAPConfig as LDAPConfigModel
from routes.auth import get_current_active_user, User

router = APIRouter(
    prefix="/api/ldap",
    tags=["ldap"],
    responses={404: {"description": "Not found"}},
)

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

class LDAPConfigCreate(LDAPConfigBase):
    pass

class LDAPConfigUpdate(LDAPConfigBase):
    pass

class LDAPConfigResponse(LDAPConfigBase):
    id: int

    class Config:
        orm_mode = True

class LDAPTestResponse(BaseModel):
    success: bool
    message: str

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
async def test_ldap_connection(
    config: LDAPConfigBase = Body(...),
    current_user: User = Depends(get_current_active_user)
):
    """测试LDAP连接"""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有管理员可以测试LDAP连接"
        )
    
    try:
        # 解析服务器URL
        server_url = config.server_url
        if server_url.startswith('ldap://'):
            server_url = server_url[7:]
        elif server_url.startswith('ldaps://'):
            server_url = server_url[8:]
            use_ssl = True
        else:
            use_ssl = False
            
        # 如果URL包含端口，分离主机和端口
        if ':' in server_url:
            host, port_str = server_url.split(':')
            port = int(port_str)
        else:
            host = server_url
            port = 636 if use_ssl else 389
        
        # 初始化LDAP连接
        server = ldap3.Server(host, port=port, use_ssl=use_ssl)
        conn = ldap3.Connection(server, user=config.bind_dn, password=config.bind_password)
        
        # 尝试绑定
        if not conn.bind():
            return {
                "success": False,
                "message": f"LDAP绑定失败: {conn.result}"
            }
        
        # 尝试搜索
        search_filter = "(objectClass=*)"
        conn.search(config.search_base, search_filter, attributes=['*'])
        
        # 关闭连接
        conn.unbind()
        
        return {
            "success": True,
            "message": "LDAP连接测试成功"
        }
    except ldap3.core.exceptions.LDAPBindError as e:
        return {
            "success": False,
            "message": f"LDAP认证失败：{str(e)}"
        }
    except ldap3.core.exceptions.LDAPSocketOpenError as e:
        return {
            "success": False,
            "message": f"LDAP服务器连接失败：{str(e)}"
        }
    except ldap3.core.exceptions.LDAPException as e:
        return {
            "success": False,
            "message": f"LDAP错误：{str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"连接测试失败：{str(e)}"
        } 