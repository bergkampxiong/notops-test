from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database.device_connection_models import SSHConnection, ConnectionPool, ConnectionStats
from database.session import get_db
from utils.connection_manager import connection_manager
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(
    prefix="",
    tags=["device-connections"]
)

class SSHConnectionBase(BaseModel):
    """SSH连接基础模型"""
    name: str
    credential_id: str
    port: int = 22
    description: Optional[str] = None

class SSHConnectionCreate(SSHConnectionBase):
    pass

class SSHConnectionUpdate(SSHConnectionBase):
    pass

class SSHConnectionResponse(SSHConnectionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ConnectionPoolBase(BaseModel):
    """连接池基础模型"""
    name: str
    ssh_config_id: int
    max_connections: int = 10
    description: Optional[str] = None

class ConnectionPoolCreate(ConnectionPoolBase):
    pass

class ConnectionPoolUpdate(ConnectionPoolBase):
    pass

class ConnectionPoolResponse(ConnectionPoolBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ConnectionStatsResponse(BaseModel):
    """连接统计响应模型"""
    pool_id: int
    current_connections: int
    total_connections: int
    failed_connections: int
    last_used: Optional[datetime]

    class Config:
        orm_mode = True

@router.get("/", response_model=List[SSHConnectionResponse])
async def get_ssh_connections(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """获取SSH连接配置列表"""
    connections = db.query(SSHConnection).offset(skip).limit(limit).all()
    return connections

@router.post("/", response_model=SSHConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_ssh_connection(
    connection: SSHConnectionCreate,
    db: Session = Depends(get_db)
):
    """创建新的SSH连接配置"""
    db_connection = SSHConnection(**connection.model_dump())
    db.add(db_connection)
    db.commit()
    db.refresh(db_connection)
    return db_connection

@router.get("/{connection_id}", response_model=SSHConnectionResponse)
async def get_ssh_connection(
    connection_id: int,
    db: Session = Depends(get_db)
):
    """获取特定的SSH连接配置"""
    connection = db.query(SSHConnection).filter(SSHConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="SSH连接配置不存在")
    return connection

@router.put("/{connection_id}", response_model=SSHConnectionResponse)
async def update_ssh_connection(
    connection_id: int,
    connection: SSHConnectionUpdate,
    db: Session = Depends(get_db)
):
    """更新SSH连接配置"""
    db_connection = db.query(SSHConnection).filter(SSHConnection.id == connection_id).first()
    if not db_connection:
        raise HTTPException(status_code=404, detail="SSH连接配置不存在")
    
    for key, value in connection.model_dump(exclude_unset=True).items():
        setattr(db_connection, key, value)
    
    db.commit()
    db.refresh(db_connection)
    return db_connection

@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ssh_connection(
    connection_id: int,
    db: Session = Depends(get_db)
):
    """删除SSH连接配置"""
    connection = db.query(SSHConnection).filter(SSHConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="SSH连接配置不存在")
    
    db.delete(connection)
    db.commit()
    return None

# 连接池相关接口
@router.get("/pools", response_model=List[ConnectionPoolResponse])
async def get_connection_pools(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """获取连接池列表"""
    pools = db.query(ConnectionPool).offset(skip).limit(limit).all()
    return pools

@router.post("/pools", response_model=ConnectionPoolResponse, status_code=status.HTTP_201_CREATED)
async def create_connection_pool(
    pool: ConnectionPoolCreate,
    db: Session = Depends(get_db)
):
    """创建新的连接池"""
    db_pool = ConnectionPool(**pool.model_dump())
    db.add(db_pool)
    db.commit()
    db.refresh(db_pool)
    return db_pool

@router.get("/pools/{pool_id}", response_model=ConnectionPoolResponse)
async def get_connection_pool(
    pool_id: int,
    db: Session = Depends(get_db)
):
    """获取特定的连接池"""
    pool = db.query(ConnectionPool).filter(ConnectionPool.id == pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="连接池不存在")
    return pool

@router.put("/pools/{pool_id}", response_model=ConnectionPoolResponse)
async def update_connection_pool(
    pool_id: int,
    pool: ConnectionPoolUpdate,
    db: Session = Depends(get_db)
):
    """更新连接池配置"""
    db_pool = db.query(ConnectionPool).filter(ConnectionPool.id == pool_id).first()
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
    pool = db.query(ConnectionPool).filter(ConnectionPool.id == pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="连接池不存在")
    
    # 清理连接池中的所有连接
    await connection_manager.cleanup_pool(db, pool_id)
    
    db.delete(pool)
    db.commit()
    return None

# 连接池统计信息接口
@router.get("/pools/{pool_id}/stats", response_model=ConnectionStatsResponse)
async def get_pool_stats(
    pool_id: int,
    db: Session = Depends(get_db)
):
    """获取连接池统计信息"""
    stats = db.query(ConnectionStats).filter(ConnectionStats.pool_id == pool_id).first()
    if not stats:
        raise HTTPException(status_code=404, detail="连接池统计信息不存在")
    return stats

@router.get("/pools/{pool_id}/status", response_model=ConnectionStatsResponse)
async def get_pool_status(
    pool_id: int,
    db: Session = Depends(get_db)
):
    """获取连接池状态"""
    stats = db.query(ConnectionStats).filter(ConnectionStats.pool_id == pool_id).first()
    if not stats:
        raise HTTPException(status_code=404, detail="连接池状态不存在")
    return stats

@router.post("/pools/{pool_id}/cleanup")
async def cleanup_pool(
    pool_id: int,
    db: Session = Depends(get_db)
):
    """清理连接池"""
    pool = db.query(ConnectionPool).filter(ConnectionPool.id == pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="连接池不存在")
    
    await connection_manager.cleanup_pool(db, pool_id)
    return {"message": "连接池已清理"} 