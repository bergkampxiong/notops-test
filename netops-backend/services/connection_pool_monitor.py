import logging
import threading
import time
from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from database.session import SessionLocal
from database.init_all_db import ConnectionPool
from services.connection_pool_manager import ConnectionPoolManager
from utils.logger_config import get_connection_pool_logger

# 配置日志
logger = get_connection_pool_logger()

class ConnectionPoolMonitor:
    """
    连接池监控服务，负责定期监控和清理连接池
    """
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ConnectionPoolMonitor, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self._initialized = True
        self._monitor_thread = None
        self._cleanup_thread = None
        self._running = False
        self._pool_manager = ConnectionPoolManager()
        logger.info("连接池监控服务初始化完成")
    
    def start(self):
        """启动监控服务"""
        if self._running:
            logger.warning("监控服务已经在运行")
            return
            
        self._running = True
        
        # 启动监控线程
        self._monitor_thread = threading.Thread(target=self._monitor_pools, daemon=True)
        self._monitor_thread.start()
        
        # 启动清理线程
        self._cleanup_thread = threading.Thread(target=self._cleanup_pools, daemon=True)
        self._cleanup_thread.start()
        
        logger.info("连接池监控服务已启动")
    
    def stop(self):
        """停止监控服务"""
        if not self._running:
            logger.warning("监控服务未运行")
            return
            
        self._running = False
        
        # 停止监控线程
        if self._monitor_thread is not None:
            self._monitor_thread.join(timeout=5)
        
        # 停止清理线程
        if self._cleanup_thread is not None:
            self._cleanup_thread.join(timeout=5)
        
        logger.info("连接池监控服务已停止")
    
    def _monitor_pools(self):
        """监控所有连接池的状态"""
        while self._running:
            try:
                # 获取所有连接池
                db = SessionLocal()
                try:
                    pools = db.query(ConnectionPool).all()
                    
                    # 初始化连接池管理器
                    for pool in pools:
                        self._pool_manager.initialize_pool(pool.id, pool)
                    
                    # 启动连接池监控
                    self._pool_manager.start_monitoring()
                except Exception as e:
                    logger.error(f"获取连接池时发生错误: {str(e)}", exc_info=True)
                finally:
                    db.close()
                
                # 等待一段时间再次检查
                time.sleep(300)  # 5分钟检查一次
            except Exception as e:
                logger.error(f"监控连接池时发生错误: {str(e)}", exc_info=True)
                time.sleep(60)  # 发生错误时等待一分钟后重试
    
    def _cleanup_pools(self):
        """定期清理连接池"""
        while self._running:
            try:
                # 获取所有连接池
                db = SessionLocal()
                try:
                    pools = db.query(ConnectionPool).all()
                    
                    # 清理每个连接池
                    for pool in pools:
                        try:
                            self._pool_manager.cleanup_pool(pool.id)
                        except Exception as e:
                            logger.error(f"清理连接池 {pool.id} 时发生错误: {str(e)}", exc_info=True)
                except Exception as e:
                    logger.error(f"获取连接池时发生错误: {str(e)}", exc_info=True)
                finally:
                    db.close()
                
                # 等待一段时间再次清理
                time.sleep(600)  # 10分钟清理一次
            except Exception as e:
                logger.error(f"清理连接池时发生错误: {str(e)}", exc_info=True)
                time.sleep(60)  # 发生错误时等待一分钟后重试
    
    def get_pool_status(self, pool_id: int) -> Optional[Dict]:
        """获取连接池状态"""
        try:
            return self._pool_manager.get_pool_info(pool_id)
        except Exception as e:
            logger.error(f"获取连接池 {pool_id} 状态时发生错误: {str(e)}", exc_info=True)
            return None
    
    def cleanup_pool(self, pool_id: int) -> bool:
        """手动清理连接池"""
        try:
            return self._pool_manager.cleanup_pool(pool_id)
        except Exception as e:
            logger.error(f"清理连接池 {pool_id} 时发生错误: {str(e)}", exc_info=True)
            return False
    
    def close_all_connections(self, pool_id: int) -> bool:
        """手动关闭连接池中的所有连接"""
        try:
            return self._pool_manager.close_all_connections(pool_id)
        except Exception as e:
            logger.error(f"关闭连接池 {pool_id} 中的所有连接时发生错误: {str(e)}", exc_info=True)
            return False 