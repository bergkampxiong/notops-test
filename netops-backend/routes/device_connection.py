from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from database.session import get_db
from services.device_connection_service import DeviceConnectionService, ConnectionPoolService
from schemas.device_connection import (
    DeviceConnection, DeviceConnectionCreate, DeviceConnectionUpdate,
    ConnectionPool, ConnectionPoolCreate, ConnectionPoolUpdate,
    ConnectionPoolStats, ConnectionPoolMetricsResponse
)

router = APIRouter(
    prefix="/api/device/connections",
    tags=["device_connections"],
    responses={404: {"description": "Not found"}},
)

# 设备连接配置路由
@router.post("/", response_model=DeviceConnection)
def create_connection(
    connection: DeviceConnectionCreate,
    db: Session = Depends(get_db)
):
    service = DeviceConnectionService(db)
    return service.create_connection(connection)

@router.put("/{connection_id}", response_model=DeviceConnection)
def update_connection(
    connection_id: int,
    connection: DeviceConnectionUpdate,
    db: Session = Depends(get_db)
):
    service = DeviceConnectionService(db)
    result = service.update_connection(connection_id, connection)
    if not result:
        raise HTTPException(status_code=404, detail="Connection not found")
    return result

@router.delete("/{connection_id}")
def delete_connection(
    connection_id: int,
    db: Session = Depends(get_db)
):
    service = DeviceConnectionService(db)
    if not service.delete_connection(connection_id):
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"message": "Connection deleted successfully"}

@router.get("/{connection_id}", response_model=DeviceConnection)
def get_connection(
    connection_id: int,
    db: Session = Depends(get_db)
):
    service = DeviceConnectionService(db)
    result = service.get_connection(connection_id)
    if not result:
        raise HTTPException(status_code=404, detail="Connection not found")
    return result

@router.get("/", response_model=List[DeviceConnection])
def get_connections(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    service = DeviceConnectionService(db)
    return service.get_connections(skip=skip, limit=limit)

# 连接池配置路由
@router.post("/pools", response_model=ConnectionPool)
def create_pool(
    pool: ConnectionPoolCreate,
    db: Session = Depends(get_db)
):
    service = ConnectionPoolService(db)
    return service.create_pool(pool)

@router.put("/pools/{pool_id}", response_model=ConnectionPool)
def update_pool(
    pool_id: int,
    pool: ConnectionPoolUpdate,
    db: Session = Depends(get_db)
):
    service = ConnectionPoolService(db)
    result = service.update_pool(pool_id, pool)
    if not result:
        raise HTTPException(status_code=404, detail="Pool not found")
    return result

@router.get("/pools/{pool_id}", response_model=ConnectionPool)
def get_pool(
    pool_id: int,
    db: Session = Depends(get_db)
):
    service = ConnectionPoolService(db)
    result = service.get_pool(pool_id)
    if not result:
        raise HTTPException(status_code=404, detail="Pool not found")
    return result

@router.get("/pools", response_model=List[ConnectionPool])
def get_pools(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    service = ConnectionPoolService(db)
    return service.get_pools(skip=skip, limit=limit)

# 连接池状态和指标路由
@router.get("/pools/{pool_id}/stats", response_model=ConnectionPoolStats)
def get_pool_stats(
    pool_id: int,
    db: Session = Depends(get_db)
):
    service = ConnectionPoolService(db)
    result = service.get_pool_stats(pool_id)
    if not result:
        raise HTTPException(status_code=404, detail="Pool stats not found")
    return result

@router.get("/pools/{pool_id}/metrics", response_model=ConnectionPoolMetricsResponse)
def get_pool_metrics(
    pool_id: int,
    time_range: str = Query('1h', regex='^(1h|6h|24h)$'),
    db: Session = Depends(get_db)
):
    service = ConnectionPoolService(db)
    return service.get_pool_metrics(pool_id, time_range)

@router.post("/pools/{pool_id}/cleanup")
def cleanup_pool(
    pool_id: int,
    db: Session = Depends(get_db)
):
    service = ConnectionPoolService(db)
    if not service.cleanup_connections(pool_id):
        raise HTTPException(status_code=404, detail="Pool not found")
    return {"message": "Connections cleaned up successfully"}

# 连接池管理路由
@router.post("/pools/{pool_id}/start")
def start_pool_monitoring(
    pool_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """启动连接池监控"""
    service = ConnectionPoolService(db)
    pool = service.get_pool(pool_id)
    if not pool:
        raise HTTPException(status_code=404, detail="连接池不存在")
    
    # 在后台任务中启动监控
    background_tasks.add_task(service._pool_monitor.start)
    return {"message": "连接池监控已启动"}

@router.post("/pools/{pool_id}/stop")
def stop_pool_monitoring(
    pool_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """停止连接池监控"""
    service = ConnectionPoolService(db)
    pool = service.get_pool(pool_id)
    if not pool:
        raise HTTPException(status_code=404, detail="连接池不存在")
    
    # 在后台任务中停止监控
    background_tasks.add_task(service._pool_monitor.stop)
    return {"message": "连接池监控已停止"}

@router.get("/pools/{pool_id}/status")
def get_pool_status(
    pool_id: int,
    db: Session = Depends(get_db)
):
    """获取连接池状态"""
    service = ConnectionPoolService(db)
    pool = service.get_pool(pool_id)
    if not pool:
        raise HTTPException(status_code=404, detail="连接池不存在")
    
    status = service.get_pool_status(pool_id)
    if not status:
        raise HTTPException(status_code=500, detail="获取连接池状态失败")
    
    return status

@router.post("/pools/{pool_id}/close-all")
def close_all_connections(
    pool_id: int,
    db: Session = Depends(get_db)
):
    """关闭连接池中的所有连接"""
    service = ConnectionPoolService(db)
    pool = service.get_pool(pool_id)
    if not pool:
        raise HTTPException(status_code=404, detail="连接池不存在")
    
    if not service.close_all_connections(pool_id):
        raise HTTPException(status_code=500, detail="关闭连接池中的所有连接失败")
    
    return {"message": "连接池中的所有连接已关闭"}

@router.post("/connections/{connection_id}/release")
def release_connection(
    connection_id: int,
    pool_id: int = Query(..., description="连接池ID"),
    db: Session = Depends(get_db)
):
    """释放连接回连接池"""
    service = ConnectionPoolService(db)
    connection = service.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="连接不存在")
    
    pool = service.get_pool(pool_id)
    if not pool:
        raise HTTPException(status_code=404, detail="连接池不存在")
    
    service.release_connection(pool_id, connection_id)
    return {"message": "连接已释放回连接池"}

@router.get("/connections/{connection_id}/get")
def get_connection(
    connection_id: int,
    pool_id: int = Query(..., description="连接池ID"),
    db: Session = Depends(get_db)
):
    """从连接池获取连接"""
    service = ConnectionPoolService(db)
    connection = service.get_connection(connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="连接不存在")
    
    pool = service.get_pool(pool_id)
    if not pool:
        raise HTTPException(status_code=404, detail="连接池不存在")
    
    conn = service.get_connection(pool_id, connection_id)
    if not conn:
        raise HTTPException(status_code=500, detail="获取连接失败")
    
    return {"message": "连接获取成功", "connection_id": connection_id} 