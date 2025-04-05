import logging
from sqlalchemy.orm import Session
from database.session import SessionLocal
from database.init_all_db import ConnectionPool
from services.connection_pool_monitor import ConnectionPoolMonitor
from utils.logger_config import get_connection_pool_logger

# 配置日志
logger = get_connection_pool_logger()

def init_connection_pools():
    """
    初始化连接池监控服务
    
    在应用启动时调用此函数，初始化所有连接池并启动监控服务
    """
    try:
        logger.info("开始初始化连接池监控服务")
        
        # 获取连接池监控服务实例
        monitor = ConnectionPoolMonitor()
        
        # 启动监控服务
        monitor.start()
        
        logger.info("连接池监控服务初始化完成")
        return True
    except Exception as e:
        logger.error(f"初始化连接池监控服务时发生错误: {str(e)}", exc_info=True)
        return False

def shutdown_connection_pools():
    """
    关闭连接池监控服务
    
    在应用关闭时调用此函数，停止所有连接池监控服务
    """
    try:
        logger.info("开始关闭连接池监控服务")
        
        # 获取连接池监控服务实例
        monitor = ConnectionPoolMonitor()
        
        # 停止监控服务
        monitor.stop()
        
        logger.info("连接池监控服务已关闭")
        return True
    except Exception as e:
        logger.error(f"关闭连接池监控服务时发生错误: {str(e)}", exc_info=True)
        return False 