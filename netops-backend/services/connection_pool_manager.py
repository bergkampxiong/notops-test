import logging
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import netmiko
from sqlalchemy.orm import Session
from database.init_all_db import DeviceConnection, ConnectionPool, ConnectionPoolStats, ConnectionPoolMetrics
from utils.logger_config import get_connection_pool_logger

# 配置日志
logger = get_connection_pool_logger()

class ConnectionPoolManager:
    """
    连接池管理器，负责管理设备连接池
    """
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ConnectionPoolManager, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self._initialized = True
        self._pools: Dict[int, Dict[str, Any]] = {}  # 存储所有连接池
        self._pool_locks: Dict[int, threading.Lock] = {}  # 每个连接池的锁
        self._monitor_thread = None
        self._running = False
        logger.info("连接池管理器初始化完成")
    
    def start_monitoring(self):
        """启动连接池监控线程"""
        if self._monitor_thread is not None and self._monitor_thread.is_alive():
            logger.warning("监控线程已经在运行")
            return
            
        self._running = True
        self._monitor_thread = threading.Thread(target=self._monitor_pools, daemon=True)
        self._monitor_thread.start()
        logger.info("连接池监控线程已启动")
    
    def stop_monitoring(self):
        """停止连接池监控线程"""
        self._running = False
        if self._monitor_thread is not None:
            self._monitor_thread.join(timeout=5)
            logger.info("连接池监控线程已停止")
    
    def _monitor_pools(self):
        """监控所有连接池的状态"""
        while self._running:
            try:
                for pool_id in list(self._pools.keys()):
                    self._update_pool_stats(pool_id)
                time.sleep(60)  # 每分钟更新一次状态
            except Exception as e:
                logger.error(f"监控连接池时发生错误: {str(e)}", exc_info=True)
                time.sleep(60)  # 发生错误时等待一分钟后重试
    
    def _update_pool_stats(self, pool_id: int):
        """更新连接池状态"""
        if pool_id not in self._pools:
            return
            
        pool = self._pools[pool_id]
        with self._get_pool_lock(pool_id):
            try:
                # 获取当前连接池状态
                total = len(pool.get("connections", []))
                active = sum(1 for conn in pool.get("connections", []) if conn.get("in_use", False))
                idle = total - active
                waiting = pool.get("waiting_count", 0)
                errors = pool.get("error_count", 0)
                
                # 计算平均连接时间
                connection_times = [conn.get("connection_time", 0) for conn in pool.get("connections", [])]
                avg_time = sum(connection_times) / len(connection_times) if connection_times else 0
                
                # 获取系统资源使用情况
                import psutil
                cpu_usage = psutil.cpu_percent()
                memory_usage = psutil.virtual_memory().percent
                network_usage = 0  # 简化处理，实际应该计算网络使用率
                
                # 更新数据库中的状态
                from database.session import SessionLocal
                db = SessionLocal()
                try:
                    # 延迟导入ConnectionPoolService以避免循环导入
                    from services.device_connection_service import ConnectionPoolService
                    service = ConnectionPoolService(db)
                    stats = {
                        "total_connections": total,
                        "active_connections": active,
                        "idle_connections": idle,
                        "waiting_connections": waiting,
                        "connection_errors": errors,
                        "avg_connection_time": avg_time,
                        "cpu_usage": cpu_usage,
                        "memory_usage": memory_usage,
                        "network_usage": network_usage,
                        "timestamp": datetime.utcnow()
                    }
                    service.update_pool_stats(pool_id, stats)
                    
                    # 记录指标
                    metrics = [
                        {"metric_type": "active_connections", "value": active},
                        {"metric_type": "idle_connections", "value": idle},
                        {"metric_type": "waiting_connections", "value": waiting}
                    ]
                    
                    for metric in metrics:
                        db_metric = ConnectionPoolMetrics(
                            pool_id=pool_id,
                            metric_type=metric["metric_type"],
                            value=metric["value"],
                            timestamp=datetime.utcnow()
                        )
                        db.add(db_metric)
                    
                    db.commit()
                except Exception as e:
                    logger.error(f"更新连接池 {pool_id} 状态时发生错误: {str(e)}", exc_info=True)
                    db.rollback()
                finally:
                    db.close()
            except Exception as e:
                logger.error(f"更新连接池 {pool_id} 状态时发生错误: {str(e)}", exc_info=True)
    
    def _get_pool_lock(self, pool_id: int) -> threading.Lock:
        """获取连接池的锁"""
        if pool_id not in self._pool_locks:
            with self._lock:
                if pool_id not in self._pool_locks:
                    self._pool_locks[pool_id] = threading.Lock()
        return self._pool_locks[pool_id]
    
    def initialize_pool(self, pool_id: int, db_pool: ConnectionPool):
        """初始化连接池"""
        if pool_id in self._pools:
            logger.warning(f"连接池 {pool_id} 已经存在，将被重新初始化")
            
        with self._lock:
            self._pools[pool_id] = {
                "config": db_pool,
                "connections": [],
                "waiting_count": 0,
                "error_count": 0,
                "last_cleanup": datetime.utcnow()
            }
            logger.info(f"连接池 {pool_id} 初始化完成")
    
    def get_connection(self, pool_id: int, connection_id: int, db: Session) -> Optional[Any]:
        """从连接池获取连接"""
        if pool_id not in self._pools:
            logger.error(f"连接池 {pool_id} 不存在")
            return None
            
        pool = self._pools[pool_id]
        with self._get_pool_lock(pool_id):
            # 查找空闲连接
            for conn in pool["connections"]:
                if not conn.get("in_use", False) and conn.get("connection_id") == connection_id:
                    conn["in_use"] = True
                    conn["last_used"] = datetime.utcnow()
                    logger.info(f"从连接池 {pool_id} 获取连接 {connection_id}")
                    return conn.get("connection")
            
            # 如果没有空闲连接，检查是否达到最大连接数
            if len(pool["connections"]) >= pool["config"].max_connections:
                logger.warning(f"连接池 {pool_id} 已达到最大连接数 {pool['config'].max_connections}")
                pool["waiting_count"] += 1
                return None
            
            # 创建新连接
            try:
                # 获取设备连接配置
                device_conn = db.query(DeviceConnection).filter(DeviceConnection.id == connection_id).first()
                if not device_conn:
                    logger.error(f"设备连接配置 {connection_id} 不存在")
                    return None
                
                # 获取认证信息
                from routes.device.credential import get_credential_by_id
                credential = get_credential_by_id(db, device_conn.credential_id)
                if not credential:
                    logger.error(f"认证信息 {device_conn.credential_id} 不存在")
                    return None
                
                # 构建连接参数
                device_params = {
                    "device_type": device_conn.device_type,
                    "host": credential.host,
                    "username": credential.username,
                    "password": credential.password,
                    "port": device_conn.port,
                    "timeout": device_conn.conn_timeout,
                    "auth_timeout": device_conn.auth_timeout,
                    "banner_timeout": device_conn.banner_timeout,
                    "session_timeout": device_conn.session_timeout,
                    "keepalive": device_conn.keepalive,
                    "global_delay_factor": device_conn.global_delay_factor,
                    "fast_cli": device_conn.fast_cli,
                    "verbose": device_conn.verbose
                }
                
                # 如果有启用密码，添加
                if device_conn.enable_secret:
                    device_params["secret"] = device_conn.enable_secret
                
                # 建立连接
                start_time = datetime.utcnow()
                connection = netmiko.ConnectHandler(**device_params)
                connection_time = (datetime.utcnow() - start_time).total_seconds()
                
                # 添加到连接池
                conn_info = {
                    "connection": connection,
                    "connection_id": connection_id,
                    "in_use": True,
                    "created_at": datetime.utcnow(),
                    "last_used": datetime.utcnow(),
                    "connection_time": connection_time
                }
                pool["connections"].append(conn_info)
                
                logger.info(f"为连接池 {pool_id} 创建新连接 {connection_id}")
                return connection
            except Exception as e:
                pool["error_count"] += 1
                logger.error(f"创建连接时发生错误: {str(e)}", exc_info=True)
                return None
    
    def release_connection(self, pool_id: int, connection_id: int):
        """释放连接回连接池"""
        if pool_id not in self._pools:
            logger.error(f"连接池 {pool_id} 不存在")
            return
            
        pool = self._pools[pool_id]
        with self._get_pool_lock(pool_id):
            for conn in pool["connections"]:
                if conn.get("connection_id") == connection_id and conn.get("in_use", False):
                    conn["in_use"] = False
                    conn["last_used"] = datetime.utcnow()
                    logger.info(f"连接 {connection_id} 已释放回连接池 {pool_id}")
                    return
            
            logger.warning(f"未找到连接 {connection_id} 或连接未被使用")
    
    def cleanup_pool(self, pool_id: int):
        """清理连接池中的空闲连接"""
        if pool_id not in self._pools:
            logger.error(f"连接池 {pool_id} 不存在")
            return False
            
        pool = self._pools[pool_id]
        with self._get_pool_lock(pool_id):
            try:
                # 检查是否需要清理
                now = datetime.utcnow()
                if (now - pool["last_cleanup"]).total_seconds() < pool["config"].idle_timeout:
                    logger.info(f"连接池 {pool_id} 不需要清理")
                    return True
                
                # 清理空闲连接
                idle_connections = [conn for conn in pool["connections"] if not conn.get("in_use", False)]
                idle_count = len(idle_connections)
                
                # 如果空闲连接数超过最大空闲连接数，关闭多余的连接
                if idle_count > pool["config"].max_idle:
                    to_close = idle_connections[:(idle_count - pool["config"].max_idle)]
                    for conn in to_close:
                        try:
                            conn["connection"].disconnect()
                            pool["connections"].remove(conn)
                            logger.info(f"关闭连接池 {pool_id} 中的空闲连接")
                        except Exception as e:
                            logger.error(f"关闭连接时发生错误: {str(e)}", exc_info=True)
                
                # 清理超时连接
                max_lifetime = timedelta(seconds=pool["config"].max_lifetime)
                for conn in pool["connections"][:]:
                    if (now - conn["created_at"]).total_seconds() > pool["config"].max_lifetime:
                        try:
                            conn["connection"].disconnect()
                            pool["connections"].remove(conn)
                            logger.info(f"关闭连接池 {pool_id} 中的超时连接")
                        except Exception as e:
                            logger.error(f"关闭超时连接时发生错误: {str(e)}", exc_info=True)
                
                # 更新清理时间
                pool["last_cleanup"] = now
                logger.info(f"连接池 {pool_id} 清理完成")
                return True
            except Exception as e:
                logger.error(f"清理连接池 {pool_id} 时发生错误: {str(e)}", exc_info=True)
                return False
    
    def close_all_connections(self, pool_id: int):
        """关闭连接池中的所有连接"""
        if pool_id not in self._pools:
            logger.error(f"连接池 {pool_id} 不存在")
            return False
            
        pool = self._pools[pool_id]
        with self._get_pool_lock(pool_id):
            try:
                for conn in pool["connections"]:
                    try:
                        conn["connection"].disconnect()
                        logger.info(f"关闭连接池 {pool_id} 中的连接")
                    except Exception as e:
                        logger.error(f"关闭连接时发生错误: {str(e)}", exc_info=True)
                
                pool["connections"] = []
                logger.info(f"连接池 {pool_id} 中的所有连接已关闭")
                return True
            except Exception as e:
                logger.error(f"关闭连接池 {pool_id} 中的所有连接时发生错误: {str(e)}", exc_info=True)
                return False
    
    def get_pool_info(self, pool_id: int) -> Optional[Dict[str, Any]]:
        """获取连接池信息"""
        if pool_id not in self._pools:
            logger.error(f"连接池 {pool_id} 不存在")
            return None
            
        pool = self._pools[pool_id]
        with self._get_pool_lock(pool_id):
            return {
                "total_connections": len(pool["connections"]),
                "active_connections": sum(1 for conn in pool["connections"] if conn.get("in_use", False)),
                "idle_connections": sum(1 for conn in pool["connections"] if not conn.get("in_use", False)),
                "waiting_count": pool["waiting_count"],
                "error_count": pool["error_count"],
                "last_cleanup": pool["last_cleanup"]
            } 