import { api } from '../utils/api';

export interface SSHConfig {
  id: number;
  name: string;
  device_type: string;
  credential_id: number;
  timeout: number;
  created_at: string;
  updated_at: string;
}

export interface SSHConfigCreate {
  name: string;
  device_type: string;
  credential_id: number;
  timeout: number;
}

// 静态设备类型列表
const deviceTypes = [
  'huawei_vrpv8',
  'cisco_ios',
  'cisco_nxos',
  'cisco_xr',
  'cisco_xe',
  'hp_comware',
  'ruijie_os',
  'paloalto_panos',
  'fortinet',
  'linux'
];

// 模拟数据
let mockSSHConfigs: SSHConfig[] = [
  {
    id: 1,
    name: '测试SSH配置1',
    device_type: 'huawei_vrpv8',
    credential_id: 1,
    timeout: 30,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: '测试SSH配置2',
    device_type: 'cisco_ios',
    credential_id: 2,
    timeout: 30,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
];

// 模拟 API 调用
export const getSSHConfigs = async () => {
  // 模拟 API 延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockSSHConfigs;
};

export const createSSHConfig = async (data: SSHConfigCreate) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newConfig: SSHConfig = {
    id: mockSSHConfigs.length + 1,
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  mockSSHConfigs.push(newConfig);
  return newConfig;
};

export const updateSSHConfig = async (id: number, data: SSHConfigCreate) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockSSHConfigs.findIndex(config => config.id === id);
  if (index !== -1) {
    mockSSHConfigs[index] = {
      ...mockSSHConfigs[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    return mockSSHConfigs[index];
  }
  throw new Error('SSH配置不存在');
};

export const deleteSSHConfig = async (id: number) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  mockSSHConfigs = mockSSHConfigs.filter(config => config.id !== id);
};

// 获取设备类型列表
export const getDeviceTypes = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return deviceTypes;
}; 