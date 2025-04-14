import React, { useEffect, useState } from 'react';
import { Drawer, Form, Select, Button, Space, message, Input, Radio } from 'antd';
import { CloudServerOutlined } from '@ant-design/icons';
import { deviceGroupApi } from '../../../api/device';
import type { DeviceGroup, DeviceMember } from '../../../types/device';
import { getSSHConfigs, SSHConfig } from '../../../services/sshConfig';
import { getCredentials } from '../../../services/credential';

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
  const [credentials, setCredentials] = useState<any[]>([]);
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

      // 获取认证信息列表
      const credentialsList = await getCredentials();
      setCredentials(credentialsList);

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

  // 处理SSH配置选择
  const handleSSHConfigChange = (configId: number) => {
    const selectedConfig = sshConfigs.find(config => config.id === configId);
    if (selectedConfig) {
      // 获取对应的认证信息
      const credential = credentials.find(cred => cred.id === selectedConfig.credential_id);
      if (credential) {
        // 更新表单中的认证信息
        form.setFieldsValue({
          username: credential.username,
          password: credential.password,
          enable_secret: credential.enable_password
        });
      }
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
      // 直接使用response.data，因为API返回的是{group_id, group_name, ip_addresses}
      setGroupIps(response.data.ip_addresses);
      
      // 自动设置所有IP为选中状态
      form.setFieldsValue({
        selectedDevices: response.data.ip_addresses
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
      const selectedConfig = sshConfigs.find(config => config.id === values.sshConfigId);
      const credential = credentials.find(cred => cred.id === selectedConfig?.credential_id);

      const saveData = {
        ...values,
        isConfigured: true,
        // 添加认证信息
        username: credential?.username,
        password: credential?.password,
        enable_secret: credential?.enable_password,
        // 添加SSH配置信息
        device_type: selectedConfig?.device_type,
        port: selectedConfig?.port,
        global_delay_factor: selectedConfig?.global_delay_factor,
        auth_timeout: selectedConfig?.auth_timeout,
        banner_timeout: selectedConfig?.banner_timeout,
        fast_cli: selectedConfig?.fast_cli,
        session_timeout: selectedConfig?.session_timeout,
        conn_timeout: selectedConfig?.conn_timeout,
        keepalive: selectedConfig?.keepalive,
        verbose: selectedConfig?.verbose
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
            onChange={handleSSHConfigChange}
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