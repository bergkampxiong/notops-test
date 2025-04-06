import asyncio
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database.device_connection_models import DeviceConnection
from database.credential_models import Credential
from netmiko import ConnectHandler
from netmiko.ssh_exception import NetMikoAuthenticationException, NetMikoTimeoutException
import logging
from enum import Enum
import pickle
import os
from .redis_manager import redis_manager

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
        self._pools = {}  # 连接池字典
        self._pool_locks = {}  # 连接池锁字典
        self._connection_stats = {}  # 连接统计信息
        self._connection_times = {}  # 连接时间记录
        self._connection_status = {}  # 连接状态记录
        self._cleanup_task = None  # 清理任务
        self._health_check_task = None  # 健康检查任务
        self._use_memory_storage = False  # 是否使用内存存储
        
        try:
            # 尝试获取 Redis 客户端
            self.redis_client = redis_manager.client
            logger.info("成功获取 Redis 客户端")
        except Exception as e:
            logger.error(f"Redis 连接失败: {str(e)}，将使用内存存储")
            self._use_memory_storage = True
    
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
    
    def _get_pool_key(self, pool_id: int, host: str) -> str:
        """获取连接池的 Redis 键"""
        return f"device_connection_pool:{pool_id}:{host}"
    
    def _get_stats_key(self, pool_id: int) -> str:
        """获取统计信息的 Redis 键"""
        return f"device_connection_stats:{pool_id}"
    
    def _get_status_key(self, pool_id: int, host: str) -> str:
        """获取连接状态的 Redis 键"""
        return f"device_connection_status:{pool_id}:{host}"
    
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
        if self._use_memory_storage:
            current_time = datetime.now()
            for pool_id, host_times in self._connection_times.items():
                for host, last_used in host_times.items():
                    if current_time - last_used > timedelta(minutes=30):  # 30分钟未使用的连接将被清理
                        try:
                            await self.cleanup_host_connections(pool_id, host)
                        except Exception as e:
                            logger.error(f"清理主机 {host} 的连接时发生错误: {str(e)}")
        else:
            try:
                current_time = datetime.now()
                # 获取所有连接池键
                pool_keys = self.redis_client.keys("device_connection_pool:*")
                for pool_key in pool_keys:
                    pool_key = pool_key.decode('utf-8')
                    _, pool_id, host = pool_key.split(':')
                    last_used = self.redis_client.get(f"device_connection_last_used:{pool_id}:{host}")
                    if last_used:
                        last_used = datetime.fromtimestamp(float(last_used))
                        if current_time - last_used > timedelta(minutes=30):  # 30分钟未使用的连接将被清理
                            try:
                                await self.cleanup_host_connections(int(pool_id), host)
                            except Exception as e:
                                logger.error(f"清理主机 {host} 的连接时发生错误: {str(e)}")
            except redis.ConnectionError as e:
                logger.error(f"Redis 连接错误: {str(e)}")
                # 如果 Redis 连接失败，切换到内存存储
                self._use_memory_storage = True
                self._pools = {}
                self._pool_locks = {}
                self._connection_stats = {}
                self._connection_times = {}
                self._connection_status = {}
    
    async def cleanup_host_connections(self, pool_id: int, host: str):
        """清理特定主机的所有连接"""
        if self._use_memory_storage:
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
        else:
            try:
                pool_key = self._get_pool_key(pool_id, host)
                # 删除连接池中的所有连接
                self.redis_client.delete(pool_key)
                # 删除相关的状态和统计信息
                self.redis_client.delete(self._get_status_key(pool_id, host))
                self.redis_client.delete(f"device_connection_last_used:{pool_id}:{host}")
            except redis.ConnectionError as e:
                logger.error(f"Redis 连接错误: {str(e)}")
                # 如果 Redis 连接失败，切换到内存存储
                self._use_memory_storage = True
                self._pools = {}
                self._pool_locks = {}
                self._connection_stats = {}
                self._connection_times = {}
                self._connection_status = {}
    
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
        if self._use_memory_storage:
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
        else:
            try:
                # 获取所有连接池键
                pool_keys = self.redis_client.keys("device_connection_pool:*")
                for pool_key in pool_keys:
                    pool_key = pool_key.decode('utf-8')
                    _, pool_id, host = pool_key.split(':')
                    status = self.redis_client.get(self._get_status_key(int(pool_id), host))
                    if status and status.decode('utf-8') == ConnectionStatus.ACTIVE.value:
                        try:
                            # 获取连接但不从队列中移除
                            connection = await self._check_connection_health(int(pool_id), host)
                            if connection:
                                # 将连接放回队列
                                await self._add_connection_to_pool(int(pool_id), host, connection)
                        except Exception as e:
                            logger.error(f"检查主机 {host} 连接健康状态时发生错误: {str(e)}")
                            self.redis_client.set(self._get_status_key(int(pool_id), host), ConnectionStatus.FAILED.value)
            except redis.ConnectionError as e:
                logger.error(f"Redis 连接错误: {str(e)}")
                # 如果 Redis 连接失败，切换到内存存储
                self._use_memory_storage = True
                self._pools = {}
                self._pool_locks = {}
                self._connection_stats = {}
                self._connection_times = {}
                self._connection_status = {}
    
    async def _check_connection_health(self, pool_id: int, host: str) -> Optional[ConnectHandler]:
        """检查特定连接的健康状态"""
        if self._use_memory_storage:
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
        else:
            try:
                pool_key = self._get_pool_key(pool_id, host)
                connection_data = self.redis_client.rpop(pool_key)
                if not connection_data:
                    return None
                    
                try:
                    connection = pickle.loads(connection_data)
                    if connection.is_alive():
                        # 尝试执行简单命令来验证连接
                        try:
                            connection.send_command("show version", strip_command=False, strip_prompt=False)
                            self.redis_client.set(self._get_status_key(pool_id, host), ConnectionStatus.ACTIVE.value)
                            return connection
                        except:
                            connection.disconnect()
                            self.redis_client.set(self._get_status_key(pool_id, host), ConnectionStatus.FAILED.value)
                            return None
                    else:
                        self.redis_client.set(self._get_status_key(pool_id, host), ConnectionStatus.DISCONNECTED.value)
                        return None
                except:
                    self.redis_client.set(self._get_status_key(pool_id, host), ConnectionStatus.FAILED.value)
                    return None
            except redis.ConnectionError as e:
                logger.error(f"Redis 连接错误: {str(e)}")
                # 如果 Redis 连接失败，切换到内存存储
                self._use_memory_storage = True
                self._pools = {}
                self._pool_locks = {}
                self._connection_stats = {}
                self._connection_times = {}
                self._connection_status = {}
                return None
    
    def get_connection_status(self, pool_id: int, host: str) -> ConnectionStatus:
        """获取连接状态"""
        if self._use_memory_storage:
            if pool_id in self._connection_status and host in self._connection_status[pool_id]:
                return self._connection_status[pool_id][host]
            return ConnectionStatus.DISCONNECTED
        else:
            try:
                status = self.redis_client.get(self._get_status_key(pool_id, host))
                if status:
                    return ConnectionStatus(status.decode('utf-8'))
                return ConnectionStatus.DISCONNECTED
            except redis.ConnectionError as e:
                logger.error(f"Redis 连接错误: {str(e)}")
                # 如果 Redis 连接失败，切换到内存存储
                self._use_memory_storage = True
                self._pools = {}
                self._pool_locks = {}
                self._connection_stats = {}
                self._connection_times = {}
                self._connection_status = {}
                return ConnectionStatus.DISCONNECTED
    
    async def _add_connection_to_pool(self, pool_id: int, host: str, connection: ConnectHandler):
        """添加连接到连接池"""
        if self._use_memory_storage:
            if pool_id not in self._pools:
                self._pools[pool_id] = {}
                self._pool_locks[pool_id] = asyncio.Lock()
            if host not in self._pools[pool_id]:
                self._pools[pool_id][host] = asyncio.Queue()
            await self._pools[pool_id][host].put(connection)
            self._connection_times[pool_id][host] = datetime.now()
        else:
            try:
                pool_key = self._get_pool_key(pool_id, host)
                self.redis_client.rpush(pool_key, pickle.dumps(connection))
                self.redis_client.set(f"device_connection_last_used:{pool_id}:{host}", datetime.now().timestamp())
            except redis.ConnectionError as e:
                logger.error(f"Redis 连接错误: {str(e)}")
                # 如果 Redis 连接失败，切换到内存存储
                self._use_memory_storage = True
                self._pools = {}
                self._pool_locks = {}
                self._connection_stats = {}
                self._connection_times = {}
                self._connection_status = {}
                # 重试添加到内存存储
                await self._add_connection_to_pool(pool_id, host, connection)
    
    async def get_connection(self, db: Session, pool_id: int, host: str) -> Optional[ConnectHandler]:
        """从连接池获取设备连接"""
        connection = db.query(DeviceConnection).filter(DeviceConnection.id == pool_id).first()
        if not connection:
            raise ValueError(f"设备连接配置 {pool_id} 不存在")
            
        credential = db.query(Credential).filter(Credential.id == connection.credential_id).first()
        if not credential:
            raise ValueError(f"凭证 {connection.credential_id} 不存在")
            
        if self._use_memory_storage:
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
                self._pools[pool_id][host] = asyncio.Queue(maxsize=5)  # 默认最大连接数
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
                if self._connection_stats[pool_id]["current"] >= 5:  # 默认最大连接数
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
                    
                    # 在成功获取连接后更新状态
                    self._connection_status[pool_id][host] = ConnectionStatus.ACTIVE
                    return netmiko_conn
                except Exception as e:
                    self._connection_stats[pool_id]["failed"] += 1
                    raise e
        else:
            try:
                pool_key = self._get_pool_key(pool_id, host)
                stats_key = self._get_stats_key(pool_id)
                
                # 尝试从连接池获取连接
                connection_data = self.redis_client.rpop(pool_key)
                if connection_data:
                    try:
                        connection = pickle.loads(connection_data)
                        # 检查连接是否仍然有效
                        if not connection.is_alive():
                            connection.disconnect()
                            connection_data = None
                        else:
                            # 在成功获取连接后更新状态
                            self.redis_client.set(self._get_status_key(pool_id, host), ConnectionStatus.ACTIVE.value)
                            self.redis_client.set(f"device_connection_last_used:{pool_id}:{host}", datetime.now().timestamp())
                            return connection
                    except:
                        connection_data = None
                
                # 如果连接池为空或连接无效，创建新连接
                stats = self.redis_client.hgetall(stats_key)
                current_connections = int(stats.get(b'current_connections', 0))
                max_connections = 5  # 默认最大连接数
                
                if current_connections >= max_connections:
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
                    self.redis_client.hincrby(stats_key, 'current_connections', 1)
                    self.redis_client.hincrby(stats_key, 'total_connections', 1)
                    self.redis_client.hset(stats_key, 'last_used', datetime.now().timestamp())
                    
                    # 将新连接添加到连接池
                    await self._add_connection_to_pool(pool_id, host, netmiko_conn)
                    
                    return netmiko_conn
                except Exception as e:
                    # 更新失败统计
                    self.redis_client.hincrby(stats_key, 'failed_connections', 1)
                    raise e
            except redis.ConnectionError as e:
                logger.error(f"Redis 连接错误: {str(e)}")
                # 如果 Redis 连接失败，切换到内存存储
                self._use_memory_storage = True
                self._pools = {}
                self._pool_locks = {}
                self._connection_stats = {}
                self._connection_times = {}
                self._connection_status = {}
                # 重试使用内存存储
                return await self.get_connection(db, pool_id, host)
    
    async def release_connection(self, db: Session, pool_id: int, host: str, connection: ConnectHandler):
        """释放设备连接回连接池"""
        if self._use_memory_storage:
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
        else:
            try:
                # 检查连接是否仍然有效
                if connection and connection.is_alive():
                    await self._add_connection_to_pool(pool_id, host, connection)
                    self.redis_client.set(self._get_status_key(pool_id, host), ConnectionStatus.IDLE.value)
                else:
                    # 如果连接已断开，关闭并更新统计信息
                    if connection:
                        connection.disconnect()
                    stats_key = self._get_stats_key(pool_id)
                    self.redis_client.hincrby(stats_key, 'current_connections', -1)
            except redis.ConnectionError as e:
                logger.error(f"Redis 连接错误: {str(e)}")
                # 如果 Redis 连接失败，切换到内存存储
                self._use_memory_storage = True
                self._pools = {}
                self._pool_locks = {}
                self._connection_stats = {}
                self._connection_times = {}
                self._connection_status = {}
                # 重试使用内存存储
                await self.release_connection(db, pool_id, host, connection)
            except Exception as e:
                # 如果发生错误，确保连接被关闭
                if connection:
                    try:
                        connection.disconnect()
                    except:
                        pass
                stats_key = self._get_stats_key(pool_id)
                self.redis_client.hincrby(stats_key, 'current_connections', -1)
                logger.error(f"释放连接失败: {str(e)}")
                raise ValueError(f"释放连接失败: {str(e)}")
    
    async def cleanup_pool(self, db: Session, pool_id: int):
        """清理连接池中的所有连接"""
        if self._use_memory_storage:
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
            
            # 清理连接池
            del self._pools[pool_id]
            del self._pool_locks[pool_id]
            del self._connection_stats[pool_id]
            if pool_id in self._connection_times:
                del self._connection_times[pool_id]
            
            # 清理连接状态
            if pool_id in self._connection_status:
                del self._connection_status[pool_id]
        else:
            try:
                # 获取所有连接池键
                pool_keys = self.redis_client.keys(f"device_connection_pool:{pool_id}:*")
                for pool_key in pool_keys:
                    pool_key = pool_key.decode('utf-8')
                    _, _, host = pool_key.split(':')
                    try:
                        await self.cleanup_host_connections(pool_id, host)
                    except Exception as e:
                        logger.error(f"清理主机 {host} 的连接时发生错误: {str(e)}")
                        
                # 重置统计信息
                stats_key = self._get_stats_key(pool_id)
                self.redis_client.delete(stats_key)
                self.redis_client.hset(stats_key, 'current_connections', 0)
                self.redis_client.hset(stats_key, 'total_connections', 0)
                self.redis_client.hset(stats_key, 'failed_connections', 0)
            except redis.ConnectionError as e:
                logger.error(f"Redis 连接错误: {str(e)}")
                # 如果 Redis 连接失败，切换到内存存储
                self._use_memory_storage = True
                self._pools = {}
                self._pool_locks = {}
                self._connection_stats = {}
                self._connection_times = {}
                self._connection_status = {}
                # 重试使用内存存储
                await self.cleanup_pool(db, pool_id)

# 创建全局实例
device_connection_manager = DeviceConnectionManager() 