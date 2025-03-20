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

// 模拟数据
const mockPoolConfig: PoolConfig = {
  id: 1,
  max_connections: 100,
  connection_timeout: 30,
  idle_timeout: 300,
  max_lifetime: 3600,
  min_idle: 5,
  max_idle: 20,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockPoolStats: PoolStats = {
  total_connections: 50,
  active_connections: 30,
  idle_connections: 20,
  waiting_connections: 5,
  connection_errors: 2,
  avg_connection_time: 150,
  resource_usage: {
    cpu: 45,
    memory: 60,
    network: 30,
  },
};

// 模拟API调用
export const getPoolConfig = async (): Promise<PoolConfig> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockPoolConfig;
};

export const updatePoolConfig = async (id: number, data: Partial<PoolConfigCreate>): Promise<PoolConfig> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    ...mockPoolConfig,
    ...data,
    updated_at: new Date().toISOString(),
  };
};

export const getPoolStats = async (): Promise<PoolStats> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockPoolStats;
};

export const cleanupConnections = async (): Promise<void> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500));
};

export const getPoolMetrics = async (timeRange: string = '1h'): Promise<PoolMetricsResponse> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 生成模拟的监控数据
  const now = new Date();
  const data: PoolMetricData[] = [];
  const types = ['active_connections', 'idle_connections', 'waiting_connections'];
  
  // 根据时间范围生成数据点
  const points = timeRange === '1h' ? 60 : timeRange === '6h' ? 360 : 1440;
  const interval = timeRange === '1h' ? 60000 : timeRange === '6h' ? 60000 : 60000; // 1分钟间隔
  
  for (let i = 0; i < points; i++) {
    const timestamp = new Date(now.getTime() - (points - i) * interval);
    types.forEach(type => {
      data.push({
        timestamp: timestamp.toISOString(),
        type,
        value: Math.floor(Math.random() * 100),
      });
    });
  }
  
  return {
    connection_history: data,
  };
}; 