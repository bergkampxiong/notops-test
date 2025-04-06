import request from '../utils/request';

export interface PoolConfig {
  id: number;
  connection_id: number;
  max_connections: number;
  min_connections: number;
  idle_timeout: number;
  connection_timeout: number;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
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

export interface PoolMetricsResponse {
  connection_history: Array<{
    timestamp: string;
    value: number;
    type: string;
  }>;
  error_history: Array<{
    timestamp: string;
    value: number;
    type: string;
  }>;
  resource_usage: Array<{
    timestamp: string;
    value: number;
    type: string;
  }>;
}

export interface PoolConfigCreate {
  max_connections: number;
  connection_timeout: number;
  idle_timeout: number;
  max_lifetime: number;
  min_idle: number;
  max_idle: number;
}

/**
 * 获取连接池配置
 * @returns Promise<PoolConfig> 连接池配置
 */
export const getPoolConfig = async (): Promise<PoolConfig> => {
  // 定义默认连接池配置
  const defaultConfig: PoolConfig = {
    id: 1,
    connection_id: 0,
    max_connections: 5,
    min_connections: 1,
    idle_timeout: 300,
    connection_timeout: 30,
    description: "默认连接池配置",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true
  };
  
  try {
    console.log('正在获取连接池配置...');
    const response = await request.get<PoolConfig>('device/connections/pools');
    console.log('连接池配置获取成功:', response);
    
    // 如果返回的是对象，直接返回
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return response.data;
    } else {
      console.log('API返回格式不正确，使用默认配置');
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
    const response = await request.get('device/connections/pools/1/stats');
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
    await request.post('device/connections/pools/1/cleanup');
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
    const response = await request.get(`device/connections/pools/1/metrics?time_range=${timeRange}`);
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
    const response = await request.put(`device/connections/pools/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('更新连接池配置失败:', error);
    throw error;
  }
}; 