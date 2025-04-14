// 设备分组
export interface DeviceGroup {
  id: number;
  name: string;
  description?: string;
  device_count: number;
  created_at: string;
  updated_at: string;
}

// 设备成员
export interface DeviceMember {
  id: string;
  name: string;
  ip: string;
  deviceType: string;
  status: string;
  description?: string;
} 