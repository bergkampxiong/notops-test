from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime, timedelta
from typing import List, Optional, Any, Dict
from database.init_all_db import DeviceConnection, ConnectionPool, ConnectionPoolStats, ConnectionPoolMetrics
from schemas.device_connection import (
    DeviceConnectionCreate, DeviceConnectionUpdate,
    ConnectionPoolCreate, ConnectionPoolUpdate,
    ConnectionPoolStats as PoolStatsSchema,
    ConnectionPoolMetricsResponse
)
from services.connection_pool_manager import ConnectionPoolManager
from services.connection_pool_monitor import ConnectionPoolMonitor
from utils.logger_config import get_device_connection_logger

# 配置日志
logger = get_device_connection_logger()

class DeviceConnectionService:
    def __init__(self, db: Session):
        self.db = db

    def create_connection(self, connection: DeviceConnectionCreate) -> DeviceConnection:
        db_connection = DeviceConnection(**connection.dict())
        self.db.add(db_connection)
        self.db.commit()
        self.db.refresh(db_connection)
        return db_connection

    def update_connection(self, connection_id: int, connection: DeviceConnectionUpdate) -> Optional[DeviceConnection]:
        db_connection = self.db.query(DeviceConnection).filter(DeviceConnection.id == connection_id).first()
        if not db_connection:
            return None
        
        update_data = connection.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_connection, key, value)
        
        self.db.commit()
        self.db.refresh(db_connection)
        return db_connection

    def delete_connection(self, connection_id: int) -> bool:
        db_connection = self.db.query(DeviceConnection).filter(DeviceConnection.id == connection_id).first()
        if not db_connection:
            return False
        
        self.db.delete(db_connection)
        self.db.commit()
        return True

    def get_connection(self, connection_id: int) -> Optional[DeviceConnection]:
        return self.db.query(DeviceConnection).filter(DeviceConnection.id == connection_id).first()

    def get_connections(self, skip: int = 0, limit: int = 100) -> List[DeviceConnection]:
        return self.db.query(DeviceConnection).offset(skip).limit(limit).all()

class ConnectionPoolService:
    def __init__(self, db: Session):
        self.db = db
        self._pool_manager = ConnectionPoolManager()
        self._pool_monitor = ConnectionPoolMonitor()

    def create_pool(self, pool: ConnectionPoolCreate) -> ConnectionPool:
        db_pool = ConnectionPool(**pool.dict())
        self.db.add(db_pool)
        self.db.commit()
        self.db.refresh(db_pool)
        return db_pool

    def update_pool(self, pool_id: int, pool: ConnectionPoolUpdate) -> Optional[ConnectionPool]:
        db_pool = self.db.query(ConnectionPool).filter(ConnectionPool.id == pool_id).first()
        if not db_pool:
            return None
        
        update_data = pool.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_pool, key, value)
        
        self.db.commit()
        self.db.refresh(db_pool)
        return db_pool

    def get_pool(self, pool_id: int) -> Optional[ConnectionPool]:
        return self.db.query(ConnectionPool).filter(ConnectionPool.id == pool_id).first()

    def get_pools(self, skip: int = 0, limit: int = 100) -> List[ConnectionPool]:
        return self.db.query(ConnectionPool).offset(skip).limit(limit).all()

    def update_pool_stats(self, pool_id: int, stats: dict) -> ConnectionPoolStats:
        db_stats = ConnectionPoolStats(
            pool_id=pool_id,
            **stats
        )
        self.db.add(db_stats)
        self.db.commit()
        self.db.refresh(db_stats)
        return db_stats

    def get_pool_stats(self, pool_id: int) -> Optional[PoolStatsSchema]:
        db_stats = self.db.query(ConnectionPoolStats)\
            .filter(ConnectionPoolStats.pool_id == pool_id)\
            .order_by(desc(ConnectionPoolStats.timestamp))\
            .first()
        return db_stats

    def get_pool_metrics(self, pool_id: int, time_range: str = '1h') -> ConnectionPoolMetricsResponse:
        # 计算时间范围
        now = datetime.utcnow()
        if time_range == '1h':
            start_time = now - timedelta(hours=1)
        elif time_range == '6h':
            start_time = now - timedelta(hours=6)
        else:  # 24h
            start_time = now - timedelta(hours=24)

        # 获取指标数据
        metrics = self.db.query(ConnectionPoolMetrics)\
            .filter(
                ConnectionPoolMetrics.pool_id == pool_id,
                ConnectionPoolMetrics.timestamp >= start_time
            )\
            .order_by(ConnectionPoolMetrics.timestamp)\
            .all()

        return ConnectionPoolMetricsResponse(connection_history=metrics)

    def cleanup_connections(self, pool_id: int) -> bool:
        """清理连接池中的异常连接"""
        try:
            # 使用连接池管理器清理连接
            return self._pool_manager.cleanup_pool(pool_id)
        except Exception as e:
            logger.error(f"清理连接池 {pool_id} 时发生错误: {str(e)}", exc_info=True)
            return False
    
    def get_connection(self, pool_id: int, connection_id: int) -> Optional[Any]:
        """从连接池获取连接"""
        try:
            return self._pool_manager.get_connection(pool_id, connection_id, self.db)
        except Exception as e:
            logger.error(f"从连接池 {pool_id} 获取连接 {connection_id} 时发生错误: {str(e)}", exc_info=True)
            return None
    
    def release_connection(self, pool_id: int, connection_id: int):
        """释放连接回连接池"""
        try:
            self._pool_manager.release_connection(pool_id, connection_id)
        except Exception as e:
            logger.error(f"释放连接 {connection_id} 回连接池 {pool_id} 时发生错误: {str(e)}", exc_info=True)
    
    def close_all_connections(self, pool_id: int) -> bool:
        """关闭连接池中的所有连接"""
        try:
            return self._pool_manager.close_all_connections(pool_id)
        except Exception as e:
            logger.error(f"关闭连接池 {pool_id} 中的所有连接时发生错误: {str(e)}", exc_info=True)
            return False
    
    def get_pool_status(self, pool_id: int) -> Optional[Dict]:
        """获取连接池状态"""
        try:
            return self._pool_monitor.get_pool_status(pool_id)
        except Exception as e:
            logger.error(f"获取连接池 {pool_id} 状态时发生错误: {str(e)}", exc_info=True)
            return None 