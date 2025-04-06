from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database.device_connection_models import DeviceConnection, DeviceConnectionPool, DeviceConnectionStats
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
        orm_mode = True

class DeviceConnectionPoolBase(BaseModel):
    """设备连接池基础模型"""
    connection_id: int
    max_connections: int = 5
    min_idle: int = 1
    idle_timeout: int = 300
    connection_timeout: int = 30
    description: Optional[str] = None
    is_active: bool = True

class DeviceConnectionPoolCreate(DeviceConnectionPoolBase):
    pass

class DeviceConnectionPoolUpdate(DeviceConnectionPoolBase):
    pass

class DeviceConnectionPoolResponse(BaseModel):
    """设备连接池响应模型"""
    id: int
    connection_id: int
    max_connections: int = 5
    min_idle: int = 1
    idle_timeout: int = 300
    connection_timeout: int = 30
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_active: bool = True

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class DeviceConnectionStatsResponse(BaseModel):
    """设备连接统计响应模型"""
    pool_id: int
    current_connections: int
    total_connections: int
    failed_connections: int
    last_used: Optional[datetime]

    class Config:
        orm_mode = True

class ConnectionStatusResponse(BaseModel):
    """连接状态响应模型"""
    pool_id: int
    host: str
    status: str
    last_checked: datetime

@router.get("/", response_model=List[DeviceConnectionResponse])
async def get_device_connections(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """获取设备连接配置列表"""
    try:
        connections = db.query(DeviceConnection).offset(skip).limit(limit).all()
        return connections
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取设备连接配置列表失败: {str(e)}"
        )

@router.post("/", response_model=DeviceConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_device_connection(
    connection: DeviceConnectionCreate,
    db: Session = Depends(get_db)
):
    """创建新的设备连接配置"""
    db_connection = DeviceConnection(**connection.model_dump())
    db.add(db_connection)
    db.commit()
    db.refresh(db_connection)
    return db_connection

@router.get("/{connection_id}", response_model=DeviceConnectionResponse)
async def get_device_connection(
    connection_id: int,
    db: Session = Depends(get_db)
):
    """获取特定的设备连接配置"""
    connection = db.query(DeviceConnection).filter(DeviceConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="设备连接配置不存在")
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
        raise HTTPException(status_code=404, detail="设备连接配置不存在")
    
    for key, value in connection.model_dump(exclude_unset=True).items():
        setattr(db_connection, key, value)
    
    db.commit()
    db.refresh(db_connection)
    return db_connection

@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device_connection(
    connection_id: int,
    db: Session = Depends(get_db)
):
    """删除设备连接配置"""
    connection = db.query(DeviceConnection).filter(DeviceConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="设备连接配置不存在")
    
    db.delete(connection)
    db.commit()
    return None

# 连接池相关接口
@router.get("/pools", response_model=DeviceConnectionPoolResponse)
async def get_connection_pools(
    db: Session = Depends(get_db)
):
    """获取连接池配置"""
    # 先检查是否存在凭证
    credential = db.query(Credential).first()
    if not credential:
        # 如果没有凭证，创建一个默认的
        credential = Credential(
            name="默认凭证",
            username="admin",
            password="admin",
            description="默认设备凭证",
            is_active=True
        )
        db.add(credential)
        db.commit()
        db.refresh(credential)
    
    # 检查是否存在设备连接配置
    connection = db.query(DeviceConnection).first()
    if not connection:
        # 如果没有设备连接配置，创建一个默认的
        connection = DeviceConnection(
            name="默认连接配置",
            device_type="cisco_ios",
            credential_id=credential.id,
            port=22,
            description="默认设备连接配置",
            is_active=True
        )
        db.add(connection)
        db.commit()
        db.refresh(connection)
    
    # 获取或创建连接池
    pool = db.query(DeviceConnectionPool).first()
    if not pool:
        # 如果没有找到连接池，创建一个默认的
        pool = DeviceConnectionPool(
            connection_id=connection.id,  # 使用实际的connection.id
            max_connections=5,
            min_idle=1,  # 使用min_idle而不是min_connections
            idle_timeout=300,
            connection_timeout=30,
            description="默认连接池配置",
            is_active=True
        )
        db.add(pool)
        db.commit()
        db.refresh(pool)
    
    # 确保返回的数据格式正确
    return {
        "id": pool.id,
        "connection_id": pool.connection_id,
        "max_connections": pool.max_connections,
        "min_idle": pool.min_idle,  # 使用min_idle
        "idle_timeout": pool.idle_timeout,
        "connection_timeout": pool.connection_timeout,
        "description": pool.description,
        "created_at": pool.created_at,
        "updated_at": pool.updated_at,
        "is_active": pool.is_active
    }

@router.post("/pools", response_model=DeviceConnectionPoolResponse, status_code=status.HTTP_201_CREATED)
async def create_connection_pool(
    pool: DeviceConnectionPoolCreate,
    db: Session = Depends(get_db)
):
    """创建新的连接池"""
    db_pool = DeviceConnectionPool(**pool.model_dump())
    db.add(db_pool)
    db.commit()
    db.refresh(db_pool)
    return db_pool

@router.get("/pools/{pool_id}", response_model=DeviceConnectionPoolResponse)
async def get_connection_pool(
    pool_id: int,
    db: Session = Depends(get_db)
):
    """获取特定的连接池"""
    pool = db.query(DeviceConnectionPool).filter(DeviceConnectionPool.id == pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="连接池不存在")
    return pool

@router.put("/pools/{pool_id}", response_model=DeviceConnectionPoolResponse)
async def update_connection_pool(
    pool_id: int,
    pool: DeviceConnectionPoolUpdate,
    db: Session = Depends(get_db)
):
    """更新连接池配置"""
    db_pool = db.query(DeviceConnectionPool).filter(DeviceConnectionPool.id == pool_id).first()
    if not db_pool:
        raise HTTPException(status_code=404, detail="连接池不存在")
    
    for key, value in pool.model_dump(exclude_unset=True).items():
        setattr(db_pool, key, value)
    
    db.commit()
    db.refresh(db_pool)
    return db_pool

@router.delete("/pools/{pool_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection_pool(
    pool_id: int,
    db: Session = Depends(get_db)
):
    """删除连接池"""
    pool = db.query(DeviceConnectionPool).filter(DeviceConnectionPool.id == pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="连接池不存在")
    
    db.delete(pool)
    db.commit()
    return None

@router.get("/pools/{pool_id}/status", response_model=DeviceConnectionStatsResponse)
async def get_pool_status(
    pool_id: int,
    db: Session = Depends(get_db)
):
    """获取连接池状态"""
    stats = db.query(DeviceConnectionStats).filter(DeviceConnectionStats.pool_id == pool_id).first()
    if not stats:
        raise HTTPException(status_code=404, detail="连接池状态不存在")
    return stats

@router.post("/pools/{pool_id}/connect")
async def connect_to_device(
    pool_id: int,
    host: str,
    db: Session = Depends(get_db)
):
    """连接到设备"""
    try:
        connection = await device_connection_manager.get_connection(db, pool_id, host)
        return {"message": "连接成功", "host": host}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"连接失败: {str(e)}")

@router.post("/pools/{pool_id}/disconnect")
async def disconnect_from_device(
    pool_id: int,
    host: str,
    db: Session = Depends(get_db)
):
    """断开设备连接"""
    try:
        await device_connection_manager.release_connection(db, pool_id, host, None)
        return {"message": "断开连接成功", "host": host}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"断开连接失败: {str(e)}")

@router.post("/pools/{pool_id}/cleanup")
async def cleanup_connection_pool(
    pool_id: int,
    db: Session = Depends(get_db)
):
    """清理连接池"""
    try:
        await device_connection_manager.cleanup_pool(db, pool_id)
        return {"message": "连接池清理成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"清理连接池失败: {str(e)}")

@router.post("/pools/{pool_id}/execute")
async def execute_command(
    pool_id: int,
    host: str,
    command: str,
    db: Session = Depends(get_db)
):
    """在设备上执行命令"""
    try:
        connection = await device_connection_manager.get_connection(db, pool_id, host)
        try:
            output = connection.send_command(command)
            return {"message": "命令执行成功", "output": output}
        finally:
            await device_connection_manager.release_connection(db, pool_id, host, connection)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"命令执行失败: {str(e)}")

@router.get("/pools/{pool_id}/connections/{host}/status", response_model=ConnectionStatusResponse)
async def get_connection_status(
    pool_id: int,
    host: str,
    db: Session = Depends(get_db)
):
    """获取特定连接的状态"""
    try:
        status = device_connection_manager.get_connection_status(pool_id, host)
        return {
            "pool_id": pool_id,
            "host": host,
            "status": status.value,
            "last_checked": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取连接状态失败: {str(e)}")

@router.get("/pools/{pool_id}/connections/status", response_model=List[ConnectionStatusResponse])
async def get_all_connection_statuses(
    pool_id: int,
    db: Session = Depends(get_db)
):
    """获取连接池中所有连接的状态"""
    try:
        statuses = []
        for host in device_connection_manager._connection_status.get(pool_id, {}):
            status = device_connection_manager.get_connection_status(pool_id, host)
            statuses.append({
                "pool_id": pool_id,
                "host": host,
                "status": status.value,
                "last_checked": datetime.now()
            })
        return statuses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取连接状态列表失败: {str(e)}") 