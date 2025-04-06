from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database.device_connection_models import DeviceConnection
from database.session import get_db
from pydantic import BaseModel
from datetime import datetime
from utils.device_connection_manager import device_connection_manager, ConnectionStatus
from database.credential_models import Credential

router = APIRouter(
    prefix="",
    tags=["device-connections"]
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
    return connections

@router.post("/", response_model=DeviceConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_device_connection(
    connection: DeviceConnectionCreate,
    db: Session = Depends(get_db)
):
    """创建新的设备连接配置"""
    # 验证凭证是否存在
    credential = db.query(Credential).filter(Credential.id == connection.credential_id).first()
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="凭证不存在"
        )
    
    try:
        # 创建连接配置
        db_connection = DeviceConnection(**connection.model_dump())
        db.add(db_connection)
        db.commit()
        db.refresh(db_connection)
        return db_connection
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建设备连接配置失败: {str(e)}"
        )

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
        db.delete(db_connection)
        db.commit()
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
    """获取特定连接的状态"""
    try:
        status = device_connection_manager.get_connection_status(connection_id, host)
        return {
            "pool_id": connection_id,
            "host": host,
            "status": status.value,
            "last_checked": datetime.now()
        }
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