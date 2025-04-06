import asyncio
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database.device_connection_models import DeviceConnection, DeviceConnectionPool, DeviceConnectionStats
from database.credential_models import Credential
from netmiko import ConnectHandler
from netmiko.ssh_exception import NetMikoAuthenticationException, NetMikoTimeoutException
import logging
from enum import Enum

logger = logging.getLogger(__name__)

class ConnectionStatus(Enum):
    """连接状态枚举"""
    ACTIVE = "active"
    IDLE = "idle"
    FAILED = "failed"
    DISCONNECTED = "disconnected"

class DeviceConnectionManager:
    """设备连接管理器"""
    
    def __init__(self):
        """初始化连接管理器"""
        self._pools: Dict[int, Dict[str, asyncio.Queue]] = {}
        self._pool_locks: Dict[int, asyncio.Lock] = {}
        self._connection_stats: Dict[int, Dict[str, int]] = {}
        self._connection_times: Dict[int, Dict[str, datetime]] = {}
        self._connection_status: Dict[int, Dict[str, ConnectionStatus]] = {}
        self._cleanup_task = None
        self._health_check_task = None
    
    async def start(self):
        """启动连接管理器"""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        if self._health_check_task is None:
            self._health_check_task = asyncio.create_task(self._health_check_loop())
    
    async def stop(self):
        """停止连接管理器"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None
            
        if self._health_check_task:
            self._health_check_task.cancel()
            try:
                await self._health_check_task
            except asyncio.CancelledError:
                pass
            self._health_check_task = None
    
    async def _cleanup_loop(self):
        """定期清理空闲连接"""
        while True:
            try:
                await self._cleanup_idle_connections()
                await asyncio.sleep(300)  # 每5分钟执行一次清理
            except Exception as e:
                logger.error(f"清理空闲连接时发生错误: {str(e)}")
                await asyncio.sleep(60)  # 发生错误时等待1分钟后重试
    
    async def _cleanup_idle_connections(self):
        """清理空闲连接"""
        current_time = datetime.now()
        for pool_id, host_times in self._connection_times.items():
            for host, last_used in host_times.items():
                if current_time - last_used > timedelta(minutes=30):  # 30分钟未使用的连接将被清理
                    try:
                        await self.cleanup_host_connections(pool_id, host)
                    except Exception as e:
                        logger.error(f"清理主机 {host} 的连接时发生错误: {str(e)}")
    
    async def cleanup_host_connections(self, pool_id: int, host: str):
        """清理特定主机的所有连接"""
        if pool_id not in self._pools or host not in self._pools[pool_id]:
            return
            
        async with self._pool_locks[pool_id]:
            queue = self._pools[pool_id][host]
            while not queue.empty():
                try:
                    connection = await queue.get()
                    connection.disconnect()
                except:
                    pass
    
    async def _retry_connection(self, device_params: dict, max_retries: int = 3, initial_delay: float = 1.0) -> ConnectHandler:
        """重试建立连接"""
        delay = initial_delay
        last_exception = None
        
        for attempt in range(max_retries):
            try:
                return ConnectHandler(**device_params)
            except (NetMikoAuthenticationException, NetMikoTimeoutException) as e:
                last_exception = e
                logger.warning(f"连接尝试 {attempt + 1}/{max_retries} 失败: {str(e)}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(delay)
                    delay *= 2  # 指数退避
                    
        raise last_exception
    
    async def _health_check_loop(self):
        """定期检查连接健康状态"""
        while True:
            try:
                await self._check_connections_health()
                await asyncio.sleep(60)  # 每分钟检查一次
            except Exception as e:
                logger.error(f"健康检查时发生错误: {str(e)}")
                await asyncio.sleep(30)  # 发生错误时等待30秒后重试
    
    async def _check_connections_health(self):
        """检查所有连接的健康状态"""
        for pool_id, host_status in self._connection_status.items():
            for host, status in host_status.items():
                if status == ConnectionStatus.ACTIVE:
                    try:
                        # 获取连接但不从队列中移除
                        connection = await self._check_connection_health(pool_id, host)
                        if connection:
                            # 将连接放回队列
                            await self._pools[pool_id][host].put(connection)
                    except Exception as e:
                        logger.error(f"检查主机 {host} 连接健康状态时发生错误: {str(e)}")
                        self._connection_status[pool_id][host] = ConnectionStatus.FAILED
    
    async def _check_connection_health(self, pool_id: int, host: str) -> Optional[ConnectHandler]:
        """检查特定连接的健康状态"""
        if pool_id not in self._pools or host not in self._pools[pool_id]:
            return None
            
        try:
            connection = await self._pools[pool_id][host].get()
            if connection.is_alive():
                # 尝试执行简单命令来验证连接
                try:
                    connection.send_command("show version", strip_command=False, strip_prompt=False)
                    self._connection_status[pool_id][host] = ConnectionStatus.ACTIVE
                    return connection
                except:
                    connection.disconnect()
                    self._connection_status[pool_id][host] = ConnectionStatus.FAILED
                    return None
            else:
                self._connection_status[pool_id][host] = ConnectionStatus.DISCONNECTED
                return None
        except:
            self._connection_status[pool_id][host] = ConnectionStatus.FAILED
            return None
    
    def get_connection_status(self, pool_id: int, host: str) -> ConnectionStatus:
        """获取连接状态"""
        if pool_id in self._connection_status and host in self._connection_status[pool_id]:
            return self._connection_status[pool_id][host]
        return ConnectionStatus.DISCONNECTED
    
    async def get_connection(self, db: Session, pool_id: int, host: str) -> Optional[ConnectHandler]:
        """从连接池获取设备连接"""
        pool = db.query(DeviceConnectionPool).filter(DeviceConnectionPool.id == pool_id).first()
        if not pool:
            raise ValueError(f"连接池 {pool_id} 不存在")
            
        connection = db.query(DeviceConnection).filter(DeviceConnection.id == pool.connection_id).first()
        if not connection:
            raise ValueError(f"设备连接配置 {pool.connection_id} 不存在")
            
        credential = db.query(Credential).filter(Credential.id == connection.credential_id).first()
        if not credential:
            raise ValueError(f"凭证 {connection.credential_id} 不存在")
            
        # 获取或创建连接池
        if pool_id not in self._pools:
            self._pools[pool_id] = {}
            self._pool_locks[pool_id] = asyncio.Lock()
            self._connection_stats[pool_id] = {
                "current": 0,
                "total": 0,
                "failed": 0
            }
            self._connection_times[pool_id] = {}
            self._connection_status[pool_id] = {}
            
        if host not in self._pools[pool_id]:
            self._pools[pool_id][host] = asyncio.Queue(maxsize=pool.max_connections)
            self._connection_times[pool_id][host] = datetime.now()
            
        # 尝试从连接池获取连接
        try:
            connection = await self._pools[pool_id][host].get()
            # 检查连接是否仍然有效
            if not connection.is_alive():
                connection.disconnect()
                raise asyncio.QueueEmpty
            
            # 在成功获取连接后更新状态
            self._connection_status[pool_id][host] = ConnectionStatus.ACTIVE
            return connection
        except asyncio.QueueEmpty:
            # 如果连接池为空，创建新连接
            if self._connection_stats[pool_id]["current"] >= pool.max_connections:
                raise ValueError(f"连接池 {pool_id} 已达到最大连接数")
                
            try:
                # 创建设备连接参数
                device_params = {
                    "device_type": connection.device_type,
                    "host": host,
                    "username": credential.username,
                    "password": credential.password,
                    "port": connection.port,
                    "global_delay_factor": connection.global_delay_factor,
                    "auth_timeout": connection.auth_timeout,
                    "banner_timeout": connection.banner_timeout,
                    "fast_cli": connection.fast_cli,
                    "session_timeout": connection.session_timeout,
                    "conn_timeout": connection.conn_timeout,
                    "keepalive": connection.keepalive,
                    "verbose": connection.verbose
                }
                
                if connection.enable_secret:
                    device_params["secret"] = connection.enable_secret
                    
                # 使用重试机制创建新连接
                netmiko_conn = await self._retry_connection(device_params)
                
                # 更新统计信息
                self._connection_stats[pool_id]["current"] += 1
                self._connection_stats[pool_id]["total"] += 1
                self._connection_times[pool_id][host] = datetime.now()
                
                # 更新数据库统计信息
                stats = db.query(DeviceConnectionStats).filter(DeviceConnectionStats.pool_id == pool_id).first()
                if not stats:
                    stats = DeviceConnectionStats(pool_id=pool_id)
                    db.add(stats)
                
                stats.current_connections = self._connection_stats[pool_id]["current"]
                stats.total_connections = self._connection_stats[pool_id]["total"]
                stats.last_used = datetime.now()
                db.commit()
                
                # 在成功获取连接后更新状态
                self._connection_status[pool_id][host] = ConnectionStatus.ACTIVE
                return netmiko_conn
                
            except (NetMikoAuthenticationException, NetMikoTimeoutException) as e:
                self._connection_stats[pool_id]["failed"] += 1
                stats = db.query(DeviceConnectionStats).filter(DeviceConnectionStats.pool_id == pool_id).first()
                if stats:
                    stats.failed_connections = self._connection_stats[pool_id]["failed"]
                    db.commit()
                raise ValueError(f"连接设备失败: {str(e)}")
    
    async def release_connection(self, db: Session, pool_id: int, host: str, connection: ConnectHandler):
        """释放设备连接回连接池"""
        if pool_id not in self._pools or host not in self._pools[pool_id]:
            return
            
        try:
            # 检查连接是否仍然有效
            if connection and connection.is_alive():
                self._connection_times[pool_id][host] = datetime.now()
                await self._pools[pool_id][host].put(connection)
            else:
                # 如果连接已断开，关闭并更新统计信息
                if connection:
                    connection.disconnect()
                self._connection_stats[pool_id]["current"] -= 1
                
                # 更新数据库统计信息
                stats = db.query(DeviceConnectionStats).filter(DeviceConnectionStats.pool_id == pool_id).first()
                if stats:
                    stats.current_connections = self._connection_stats[pool_id]["current"]
                    db.commit()
                    
            # 更新连接状态
            if connection and connection.is_alive():
                self._connection_status[pool_id][host] = ConnectionStatus.IDLE
            else:
                self._connection_status[pool_id][host] = ConnectionStatus.DISCONNECTED
                
        except Exception as e:
            # 如果发生错误，确保连接被关闭
            if connection:
                try:
                    connection.disconnect()
                except:
                    pass
            self._connection_stats[pool_id]["current"] -= 1
            logger.error(f"释放连接失败: {str(e)}")
            raise ValueError(f"释放连接失败: {str(e)}")
    
    async def cleanup_pool(self, db: Session, pool_id: int):
        """清理连接池中的所有连接"""
        if pool_id not in self._pools:
            return
            
        async with self._pool_locks[pool_id]:
            for host, queue in self._pools[pool_id].items():
                while not queue.empty():
                    try:
                        connection = await queue.get()
                        connection.disconnect()
                    except:
                        pass
                        
            # 重置统计信息
            self._connection_stats[pool_id] = {
                "current": 0,
                "total": 0,
                "failed": 0
            }
            
            # 更新数据库统计信息
            stats = db.query(DeviceConnectionStats).filter(DeviceConnectionStats.pool_id == pool_id).first()
            if stats:
                stats.current_connections = 0
                stats.total_connections = 0
                stats.failed_connections = 0
                db.commit()
                
            # 清理连接池
            del self._pools[pool_id]
            del self._pool_locks[pool_id]
            del self._connection_stats[pool_id]
            if pool_id in self._connection_times:
                del self._connection_times[pool_id]
            
            # 清理连接状态
            if pool_id in self._connection_status:
                del self._connection_status[pool_id]

# 创建全局实例
device_connection_manager = DeviceConnectionManager() 