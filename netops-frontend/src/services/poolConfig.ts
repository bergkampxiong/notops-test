import { api } from '../utils/api';

export interface PoolConfig {
  id: number;
  max_connections: number;
  connection_timeout: number;
  idle_timeout: number;
  max_lifetime: number;
  min_idle: number;
  max_idle: number;
  created_at: string;
  updated_at: string;
}

export interface PoolStats {
  total_connections: number;
  active_connections: number;
  idle_connections: number;
  waiting_connections: number;
  connection_errors: number;
  avg_connection_time: number;
  resource_usage: {
    cpu: number;
    memory: number;
    network: number;
  };
}

export interface PoolConfigCreate {
  max_connections: number;
  connection_timeout: number;
  idle_timeout: number;
  max_lifetime: number;
  min_idle: number;
  max_idle: number;
}

export interface PoolMetricData {
  timestamp: string;
  type: string;
  value: number;
}

export interface PoolMetricsResponse {
  connection_history: PoolMetricData[];
}

/**
 * 获取连接池配置
 * @returns Promise<PoolConfig> 连接池配置
 */
export const getPoolConfig = async (): Promise<PoolConfig> => {
  // 定义默认连接池配置
  const defaultConfig: PoolConfig = {
    id: 1,
    max_connections: 100,
    connection_timeout: 30,
    idle_timeout: 300,
    max_lifetime: 3600,
    min_idle: 5,
    max_idle: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  try {
    console.log('正在获取连接池配置...');
    const response = await api.get('/api/device/connections/pools');
    console.log('连接池配置获取成功:', response.data);
    
    // 确保返回的是数组且非空
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0];
    } else {
      console.log('API返回空数组或非数组数据，使用默认配置');
      return defaultConfig;
    }
  } catch (error) {
    console.error('获取连接池配置失败:', error);
    // 返回默认配置而不是抛出错误
    return defaultConfig;
  }
};

/**
 * 获取连接池状态
 * @returns Promise<PoolStats> 连接池状态
 */
export const getPoolStats = async (): Promise<PoolStats> => {
  try {
    const response = await api.get('/api/device/connections/pools/1/stats');
    return response.data;
  } catch (error) {
    console.error('获取连接池状态失败:', error);
    throw error;
  }
};

/**
 * 清理连接池中的连接
 * @returns Promise<void>
 */
export const cleanupConnections = async (): Promise<void> => {
  try {
    await api.post('/api/device/connections/pools/1/cleanup');
  } catch (error) {
    console.error('清理连接池失败:', error);
    throw error;
  }
};

/**
 * 获取连接池指标
 * @param timeRange 时间范围，可选值：1h, 6h, 24h
 * @returns Promise<PoolMetricsResponse> 连接池指标
 */
export const getPoolMetrics = async (timeRange: string = '1h'): Promise<PoolMetricsResponse> => {
  try {
    const response = await api.get(`/api/device/connections/pools/1/metrics?time_range=${timeRange}`);
    return response.data;
  } catch (error) {
    console.error('获取连接池指标失败:', error);
    throw error;
  }
};

/**
 * 更新连接池配置
 * @param id 连接池ID
 * @param data 更新的配置数据
 * @returns Promise<PoolConfig> 更新后的连接池配置
 */
export const updatePoolConfig = async (id: number, data: Partial<PoolConfigCreate>): Promise<PoolConfig> => {
  try {
    const response = await api.put(`/api/device/connections/pools/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('更新连接池配置失败:', error);
    throw error;
  }
}; 