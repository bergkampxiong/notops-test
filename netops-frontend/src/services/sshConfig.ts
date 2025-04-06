import request from '../utils/request';

/**
 * SSH配置接口定义
 * 用于定义SSH连接的基本信息和Netmiko连接参数
 */
export interface SSHConfig {
  id: number;                    // 配置ID
  name: string;                  // 配置名称（用于流程设计器中的组件标识）
  device_type: string;           // 设备类型（Netmiko支持的设备类型名称）
  credential_id: number;         // 关联的凭证ID
  pool_config_id?: number;       // 关联的连接池配置ID
  // Netmiko特定参数
  port: number;                  // SSH端口号
  enable_secret?: string;        // Enable密码（仅用于思科设备）
  global_delay_factor: number;   // 全局延迟因子，用于调整命令执行延迟
  auth_timeout: number;          // SSH认证超时时间（秒）
  banner_timeout: number;        // 等待设备banner的超时时间（秒）
  fast_cli: boolean;            // 是否启用快速CLI模式
  session_timeout: number;       // SSH会话超时时间（秒）
  conn_timeout: number;          // 建立SSH连接的超时时间（秒）
  keepalive: number;            // SSH连接保活间隔（秒）
  verbose: boolean;             // 是否启用详细日志输出
  created_at: string;           // 创建时间
  updated_at: string;           // 更新时间
}

/**
 * SSH配置创建接口
 * 用于创建新的SSH配置时的参数定义
 */
export interface SSHConfigCreate {
  name: string;
  device_type: string;
  credential_id: number;
  pool_config_id?: number;
  port: number;
  enable_secret?: string;
  // Netmiko特定参数（可选）
  global_delay_factor?: number;
  auth_timeout?: number;
  banner_timeout?: number;
  fast_cli?: boolean;
  session_timeout?: number;
  conn_timeout?: number;
  keepalive?: number;
  verbose?: boolean;
}

/**
 * Netmiko支持的设备类型列表
 * 这些类型与Netmiko库中的设备类型定义保持一致
 */
const deviceTypes = [
  'huawei_vrpv8',    // 华为VRPv8设备
  'cisco_ios',       // Cisco IOS设备
  'cisco_nxos',      // Cisco NX-OS设备
  'cisco_xr',        // Cisco XR设备
  'cisco_xe',        // Cisco XE设备
  'hp_comware',      // 惠普Comware设备
  'ruijie_os',       // 锐捷OS设备
  'paloalto_panos',  // Palo Alto PAN-OS设备
  'fortinet',        // Fortinet设备
  'linux'            // Linux设备
];

/**
 * 获取所有SSH配置
 * @returns Promise<SSHConfig[]> SSH配置列表
 */
export const getSSHConfigs = async (): Promise<SSHConfig[]> => {
  try {
    console.log('正在获取SSH配置列表...');
    const response = await request.get('device/credential/');
    console.log('SSH配置列表获取成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取SSH配置失败:', error);
    // 返回空数组而不是抛出错误
    return [];
  }
};

/**
 * 创建新的SSH配置
 * @param data SSH配置创建参数
 * @returns Promise<SSHConfig> 新创建的SSH配置
 */
export const createSSHConfig = async (data: SSHConfigCreate): Promise<SSHConfig> => {
  try {
    const response = await request.post('device/connections/', data);
    return response.data;
  } catch (error) {
    console.error('创建SSH配置失败:', error);
    throw error;
  }
};

/**
 * 更新现有SSH配置
 * @param id 要更新的配置ID
 * @param data 更新的配置数据
 * @returns Promise<SSHConfig> 更新后的SSH配置
 */
export const updateSSHConfig = async (id: number, data: Partial<SSHConfigCreate>): Promise<SSHConfig> => {
  try {
    const response = await request.put(`device/connections/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error('更新SSH配置失败:', error);
    throw error;
  }
};

/**
 * 删除SSH配置
 * @param id 要删除的配置ID
 */
export const deleteSSHConfig = async (id: number): Promise<void> => {
  try {
    await request.delete(`device/connections/${id}/`);
  } catch (error) {
    console.error('删除SSH配置失败:', error);
    throw error;
  }
};

/**
 * 获取SSH连接池状态
 * @param configId SSH配置ID
 * @returns Promise<{...}> 连接池状态信息
 */
export const getSSHPoolStatus = async (configId: number): Promise<{
  active_connections: number;    // 活动连接数
  idle_connections: number;      // 空闲连接数
  waiting_connections: number;   // 等待连接数
  connection_errors: number;     // 连接错误数
}> => {
  try {
    const response = await request.get(`device/connections/pools/${configId}/status/`);
    return response.data;
  } catch (error) {
    console.error('获取连接池状态失败:', error);
    throw error;
  }
};

/**
 * 清理SSH连接池
 * @param configId SSH配置ID
 * @returns Promise<void>
 */
export const cleanupSSHPool = async (configId: number): Promise<void> => {
  try {
    await request.post(`device/connections/pools/${configId}/cleanup/`);
  } catch (error) {
    console.error('清理连接池失败:', error);
    throw error;
  }
};

/**
 * 获取SSH连接池配置
 * @param configId SSH配置ID
 * @returns Promise<{...}> 连接池配置信息
 */
export const getSSHPoolConfig = async (configId: number): Promise<{
  max_connections: number;       // 最大连接数
  connection_timeout: number;    // 连接超时时间
  idle_timeout: number;         // 空闲超时时间
  max_lifetime: number;         // 最大生命周期
}> => {
  try {
    const response = await request.get(`device/connections/pools/${configId}/`);
    return response.data;
  } catch (error) {
    console.error('获取连接池配置失败:', error);
    throw error;
  }
};

/**
 * 更新SSH连接池配置
 * @param configId SSH配置ID
 * @param data 更新的连接池配置数据
 */
export const updateSSHPoolConfig = async (
  configId: number,
  data: {
    max_connections?: number;
    connection_timeout?: number;
    idle_timeout?: number;
    max_lifetime?: number;
  }
): Promise<void> => {
  try {
    await request.put(`device/connections/pools/${configId}/`, data);
  } catch (error) {
    console.error('更新连接池配置失败:', error);
    throw error;
  }
};

/**
 * 获取设备类型列表
 * @returns Promise<string[]> 设备类型列表
 */
export const getDeviceTypes = async () => {
  return deviceTypes;
}; 