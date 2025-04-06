from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from utils.connection_pool_manager import connection_pool_manager
import time

router = APIRouter(
    tags=["pool-config"]
)

class PoolConfigResponse(BaseModel):
    id: int = 1
    connection_id: int = 0
    max_connections: int
    min_idle: int
    idle_timeout: int
    connection_timeout: int
    description: str
    created_at: str
    updated_at: str
    is_active: bool

    class Config:
        from_attributes = True

class PoolConfigUpdate(BaseModel):
    max_connections: Optional[int] = None
    min_idle: Optional[int] = None
    idle_timeout: Optional[int] = None
    connection_timeout: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PoolStatsResponse(BaseModel):
    total_connections: int
    active_connections: int
    idle_connections: int
    waiting_connections: int
    max_wait_time: int
    avg_wait_time: float
    created_at: str

class PoolMetricsResponse(BaseModel):
    timestamp: str
    value: float

@router.get("", response_model=PoolConfigResponse)
async def get_pool_config():
    """获取连接池配置"""
    try:
        config = connection_pool_manager.get_pool_config()
        return PoolConfigResponse(
            id=int(config['id']),
            connection_id=int(config['connection_id']),
            max_connections=int(config['max_connections']),
            min_idle=int(config['min_idle']),
            idle_timeout=int(config['idle_timeout']),
            connection_timeout=int(config['connection_timeout']),
            description=config['description'],
            created_at=config['created_at'],
            updated_at=config['updated_at'],
            is_active=config['is_active'].lower() == 'true'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("", response_model=PoolConfigResponse)
async def update_pool_config(config: PoolConfigUpdate):
    """更新连接池配置"""
    try:
        update_data = {k: str(v) for k, v in config.dict(exclude_unset=True).items()}
        updated_config = connection_pool_manager.update_pool_config(update_data)
        return PoolConfigResponse(
            id=int(updated_config['id']),
            connection_id=int(updated_config['connection_id']),
            max_connections=int(updated_config['max_connections']),
            min_idle=int(updated_config['min_idle']),
            idle_timeout=int(updated_config['idle_timeout']),
            connection_timeout=int(updated_config['connection_timeout']),
            description=updated_config['description'],
            created_at=updated_config['created_at'],
            updated_at=updated_config['updated_at'],
            is_active=updated_config['is_active'].lower() == 'true'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{pool_id}/stats", response_model=PoolStatsResponse)
async def get_pool_stats(pool_id: int):
    """获取连接池状态"""
    try:
        # 从连接池管理器获取真实状态数据
        stats = connection_pool_manager.get_pool_stats()
        
        return PoolStatsResponse(
            total_connections=int(stats['total_connections']),
            active_connections=int(stats['active_connections']),
            idle_connections=int(stats['idle_connections']),
            waiting_connections=int(stats['waiting_connections']),
            max_wait_time=int(stats['max_wait_time']),
            avg_wait_time=float(stats['avg_wait_time']),
            created_at=stats['created_at']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{pool_id}/metrics", response_model=List[PoolMetricsResponse])
async def get_pool_metrics(pool_id: int, time_range: str = "1h"):
    """获取连接池指标"""
    try:
        # 这里返回模拟数据，实际项目中应该从监控系统获取真实数据
        current_time = int(time.time())
        metrics = []
        
        # 根据时间范围生成数据点
        if time_range == "1h":
            interval = 60  # 1分钟一个数据点
            points = 60    # 60个数据点
        elif time_range == "6h":
            interval = 360  # 6分钟一个数据点
            points = 60     # 60个数据点
        elif time_range == "24h":
            interval = 1440  # 24分钟一个数据点
            points = 60      # 60个数据点
        else:
            interval = 60
            points = 60
        
        for i in range(points):
            timestamp = current_time - (points - i - 1) * interval
            # 模拟一些波动
            value = 5 + (i % 10) / 2
            metrics.append(PoolMetricsResponse(
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(timestamp)),
                value=value
            ))
        
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 