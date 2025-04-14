import request from '../utils/request';
import type { ApiResponse } from '../types/api';
import type { DeviceGroup, DeviceMember } from '../types/device';

// 设备分组API
export const deviceGroupApi = {
  // 获取设备分组列表
  getList: () => {
    return request.get<ApiResponse<DeviceGroup[]>>('device/category/groups');
  },

  // 获取分组成员
  getMembers: (groupId: string) => {
    return request.get<ApiResponse<DeviceMember[]>>(`device/category/groups/${groupId}/members`);
  },
  
  // 获取分组所有成员IP
  getMemberIps: (groupId: string) => {
    return request.get<{
      group_id: number;
      group_name: string;
      ip_addresses: string[];
    }>(`device/category/group/${groupId}/member-ips`);
  }
}; 