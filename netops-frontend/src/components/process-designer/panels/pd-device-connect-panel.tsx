import React, { useEffect, useState } from 'react';
import { Drawer, Form, Select, Button, Space, message, Input, Radio } from 'antd';
import { CloudServerOutlined } from '@ant-design/icons';
import { deviceGroupApi } from '../../../api/device';
import type { DeviceGroup, DeviceMember } from '../../../types/device';
import { getSSHConfigs, SSHConfig } from '../../../services/sshConfig';

const { Option } = Select;

interface DeviceConnectPanelProps {
  visible: boolean;
  onClose: () => void;
  initialData?: any;
  onSave: (data: any) => void;
}

export const PDDeviceConnectPanel: React.FC<DeviceConnectPanelProps> = ({
  visible,
  onClose,
  initialData,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sshConfigs, setSshConfigs] = useState<SSHConfig[]>([]);
  const [deviceGroups, setDeviceGroups] = useState<DeviceGroup[]>([]);
  const [targetType, setTargetType] = useState<'group' | 'single'>('single');
  const [groupIps, setGroupIps] = useState<string[]>([]);

  // 只在面板打开时加载数据
  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible]);

  // 加载初始数据
  const loadInitialData = async () => {
    try {
      // 获取设备组列表
      const deviceGroupsResponse = await deviceGroupApi.getList();
      console.log('设备分组响应数据:', deviceGroupsResponse);
      
      // 根据实际响应结构调整数据处理
      // 响应格式: { 0: {...}, status: 200, data: [...] }
      const groups = Array.isArray(deviceGroupsResponse.data) ? deviceGroupsResponse.data : [];
      console.log('处理后的设备分组数据:', groups);
      setDeviceGroups(groups);

      // 获取SSH配置列表
      const sshConfigs = await getSSHConfigs();
      setSshConfigs(sshConfigs);

      // 如果有初始数据，设置表单值
      if (initialData) {
        form.setFieldsValue({
          ...initialData,
          targetType: initialData.deviceGroupId ? 'group' : 'single'
        });
        
        // 如果是分组类型，加载分组IP
        if (initialData.deviceGroupId) {
          loadGroupIps(initialData.deviceGroupId);
        }
      }
    } catch (error) {
      message.error('加载数据失败');
      console.error('加载数据失败:', error);
    }
  };

  // 处理设备组选择
  const handleGroupChange = async (groupId: string) => {
    if (!groupId) {
      setGroupIps([]);
      return;
    }

    setLoading(true);
    try {
      // 加载分组所有成员IP
      await loadGroupIps(groupId);
    } catch (error) {
      message.error('加载设备列表失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 加载分组所有成员IP
  const loadGroupIps = async (groupId: string) => {
    try {
      const response = await deviceGroupApi.getMemberIps(groupId);
      setGroupIps(response.data.data.ip_addresses);
      
      // 自动设置所有IP为选中状态
      form.setFieldsValue({
        selectedDevices: response.data.data.ip_addresses
      });
    } catch (error) {
      console.error('加载分组IP失败:', error);
      message.error('加载分组IP失败');
    }
  };

  // 处理保存
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const saveData = {
        ...values,
        isConfigured: true
      };

      // 根据目标类型清理不需要的字段
      if (values.targetType === 'group') {
        delete saveData.targetIp;
        // 如果是分组模式，确保selectedDevices包含所有IP
        if (groupIps.length > 0) {
          saveData.selectedDevices = groupIps;
        }
      } else {
        delete saveData.deviceGroupId;
        delete saveData.selectedDevices;
      }

      onSave(saveData);
      onClose();
      message.success('配置已保存');
    } catch (error) {
      message.error('请检查配置信息');
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <CloudServerOutlined />
          <span>设备连接配置</span>
        </Space>
      }
      width={400}
      open={visible}
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSave} loading={loading}>
            保存
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        disabled={loading}
      >
        <Form.Item
          name="sshConfigId"
          label="SSH配置"
          rules={[{ required: true, message: '请选择SSH配置' }]}
        >
          <Select
            placeholder="请选择SSH配置"
            options={sshConfigs?.map(config => ({
              label: config.name,
              value: config.id
            })) || []}
            loading={loading}
          />
        </Form.Item>

        <Form.Item
          name="targetType"
          label="目标类型"
          rules={[{ required: true, message: '请选择目标类型' }]}
        >
          <Radio.Group onChange={(e) => setTargetType(e.target.value)}>
            <Radio value="single">单个设备</Radio>
            <Radio value="group">设备分组</Radio>
          </Radio.Group>
        </Form.Item>

        {targetType === 'group' ? (
          <Form.Item
            name="deviceGroupId"
            label="设备分组"
            rules={[{ required: true, message: '请选择设备分组' }]}
          >
            <Select
              placeholder="请选择设备分组"
              options={deviceGroups?.map(group => ({
                label: group.name,
                value: group.id
              })) || []}
              loading={loading}
              onChange={handleGroupChange}
            />
          </Form.Item>
        ) : (
          <Form.Item
            name="targetIp"
            label="目标IP"
            rules={[
              { required: true, message: '请输入目标IP' },
              { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: '请输入有效的IP地址' }
            ]}
          >
            <Input placeholder="请输入目标IP地址" />
          </Form.Item>
        )}
      </Form>
    </Drawer>
  );
}; 