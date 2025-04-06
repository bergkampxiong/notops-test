from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from database.device_connection_models import DeviceConnection
from database.session import get_db
from pydantic import BaseModel
from datetime import datetime
from utils.device_connection_manager import device_connection_manager, ConnectionStatus
from database.category_models import Credential
import logging
from auth.authentication import get_current_active_user
from auth.rbac import role_required
from auth.audit import log_event
from database.models import User
from schemas.device_connection import SSHConnectionCreate, SSHConnectionResponse

router = APIRouter(
    prefix="/api/device/connections",
    tags=["device_connections"]
)

class DeviceConnectionBase(BaseModel):
    """设备连接基础模型"""
    name: str
    device_type: str
    credential_id: int
    port: int = 22
    enable_secret: Optional[str] = None
    global_delay_factor: float = 1.0
    auth_timeout: int = 60
    banner_timeout: int = 20
    fast_cli: bool = False
    session_timeout: int = 60
    conn_timeout: int = 20
    keepalive: int = 20
    verbose: bool = False
    description: Optional[str] = None

class DeviceConnectionCreate(DeviceConnectionBase):
    pass

class DeviceConnectionUpdate(DeviceConnectionBase):
    pass

class DeviceConnectionResponse(DeviceConnectionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ConnectionStatusResponse(BaseModel):
    """连接状态响应模型"""
    pool_id: int
    host: str
    status: str
    last_checked: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

@router.get("/", response_model=List[DeviceConnectionResponse])
async def get_device_connections(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """获取设备连接配置列表"""
    connections = db.query(DeviceConnection).offset(skip).limit(limit).all()
    # 确保每个连接对象都有正确的 datetime 字段
    for connection in connections:
        if connection.created_at is None:
            connection.created_at = datetime.now()
        if connection.updated_at is None:
            connection.updated_at = datetime.now()
    return connections

@router.post("/", response_model=DeviceConnectionResponse)
async def create_device_connection(
    connection: DeviceConnectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建设备连接配置"""
    try:
        # 检查凭证是否存在
        credential = db.query(Credential).filter(Credential.id == connection.credential_id).first()
        if not credential:
            raise HTTPException(status_code=404, detail=f"凭证 {connection.credential_id} 不存在")
        
        # 创建设备连接配置
        db_connection = DeviceConnection(
            name=connection.name,
            device_type=connection.device_type,
            host=connection.host,
            port=connection.port,
            credential_id=connection.credential_id,
            global_delay_factor=connection.global_delay_factor,
            auth_timeout=connection.auth_timeout,
            banner_timeout=connection.banner_timeout,
            fast_cli=connection.fast_cli,
            session_timeout=connection.session_timeout,
            conn_timeout=connection.conn_timeout,
            keepalive=connection.keepalive,
            verbose=connection.verbose,
            enable_secret=connection.enable_secret,
            is_active=connection.is_active
        )
        
        db.add(db_connection)
        db.commit()
        db.refresh(db_connection)
        
        # 初始化连接池
        await device_connection_manager.initialize_pool()
        
        return db_connection
    except Exception as e:
        db.rollback()
        logger.error(f"创建设备连接配置失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"创建设备连接配置失败: {str(e)}")

@router.get("/{connection_id}", response_model=DeviceConnectionResponse)
async def get_device_connection(
    connection_id: int,
    db: Session = Depends(get_db)
):
    """获取特定的设备连接配置"""
    connection = db.query(DeviceConnection).filter(DeviceConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="连接配置不存在")
    return connection

@router.put("/{connection_id}", response_model=DeviceConnectionResponse)
async def update_device_connection(
    connection_id: int,
    connection: DeviceConnectionUpdate,
    db: Session = Depends(get_db)
):
    """更新设备连接配置"""
    db_connection = db.query(DeviceConnection).filter(DeviceConnection.id == connection_id).first()
    if not db_connection:
        raise HTTPException(status_code=404, detail="连接配置不存在")
    
    # 验证凭证是否存在
    credential = db.query(Credential).filter(Credential.id == connection.credential_id).first()
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="凭证不存在"
        )
    
    try:
        # 更新连接配置
        for key, value in connection.model_dump().items():
            setattr(db_connection, key, value)
        db.commit()
        db.refresh(db_connection)
        return db_connection
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新设备连接配置失败: {str(e)}"
        )

@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device_connection(
    connection_id: int,
    db: Session = Depends(get_db)
):
    """删除设备连接配置"""
    db_connection = db.query(DeviceConnection).filter(DeviceConnection.id == connection_id).first()
    if not db_connection:
        raise HTTPException(status_code=404, detail="连接配置不存在")
    
    try:
        # 先删除配置
        db.delete(db_connection)
        db.commit()
        
        # 然后清理连接池
        try:
            await device_connection_manager.cleanup_pool(db, connection_id)
        except Exception as e:
            logger.error(f"清理连接池失败: {str(e)}")
            # 即使清理失败也不影响删除操作
            pass
            
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除设备连接配置失败: {str(e)}"
        )

@router.post("/{connection_id}/connect")
async def connect_to_device(
    connection_id: int,
    host: str,
    db: Session = Depends(get_db)
):
    """连接到设备"""
    try:
        connection = await device_connection_manager.get_connection(db, connection_id, host)
        return {"message": "连接成功", "host": host}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"连接失败: {str(e)}")

@router.post("/{connection_id}/disconnect")
async def disconnect_from_device(
    connection_id: int,
    host: str,
    db: Session = Depends(get_db)
):
    """断开设备连接"""
    try:
        await device_connection_manager.release_connection(db, connection_id, host, None)
        return {"message": "断开连接成功", "host": host}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"断开连接失败: {str(e)}")

@router.get("/{connection_id}/connections/{host}/status", response_model=ConnectionStatusResponse)
async def get_connection_status(
    connection_id: int,
    host: str,
    db: Session = Depends(get_db)
):
    """获取连接状态"""
    try:
        status = await device_connection_manager.get_connection_status(db, connection_id, host)
        return status
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取连接状态失败: {str(e)}")

@router.get("/{connection_id}/connections/status", response_model=List[ConnectionStatusResponse])
async def get_all_connection_statuses(
    connection_id: int,
    db: Session = Depends(get_db)
):
    """获取连接池中所有连接的状态"""
    try:
        statuses = []
        for host in device_connection_manager._connection_status.get(connection_id, {}):
            status = device_connection_manager.get_connection_status(connection_id, host)
            statuses.append({
                "pool_id": connection_id,
                "host": host,
                "status": status.value,
                "last_checked": datetime.now()
            })
        return statuses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取连接状态列表失败: {str(e)}") 