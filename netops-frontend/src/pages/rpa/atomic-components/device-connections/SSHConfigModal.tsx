import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, message } from 'antd';
import { getDeviceTypes, createSSHConfig, updateSSHConfig } from '../../../../services/sshConfig';
import { api } from '../../../../utils/api';

interface SSHConfigModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialValues?: any;
}

interface Credential {
  id: number;
  name: string;
  type: string;
}

const SSHConfigModal: React.FC<SSHConfigModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  initialValues,
}) => {
  const [form] = Form.useForm();
  const [deviceTypes, setDeviceTypes] = useState<string[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取设备类型列表
  useEffect(() => {
    const fetchDeviceTypes = async () => {
      try {
        const data = await getDeviceTypes();
        setDeviceTypes(data);
      } catch (error) {
        message.error('获取设备类型列表失败');
      }
    };
    fetchDeviceTypes();
  }, []);

  // 获取凭证列表
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const response = await api.get('/api/device/credential');
        setCredentials(response.data);
      } catch (error) {
        message.error('获取凭证列表失败');
      }
    };
    fetchCredentials();
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (initialValues) {
        await updateSSHConfig(initialValues.id, values);
        message.success('SSH配置更新成功');
      } else {
        await createSSHConfig(values);
        message.success('SSH配置创建成功');
      }
      
      onSuccess();
      form.resetFields();
    } catch (error: any) {
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error('操作失败');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={initialValues ? '编辑SSH配置' : '新增SSH配置'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          ...initialValues,
          timeout: initialValues?.timeout || 30,
        }}
      >
        <Form.Item
          name="name"
          label="SSH连接名称"
          rules={[{ required: true, message: '请输入SSH连接名称' }]}
        >
          <Input placeholder="请输入SSH连接名称" />
        </Form.Item>

        <Form.Item
          name="device_type"
          label="设备类型"
          rules={[{ required: true, message: '请选择设备类型' }]}
        >
          <Select placeholder="请选择设备类型">
            {deviceTypes.map((type) => (
              <Select.Option key={type} value={type}>
                {type}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="credential_id"
          label="凭证"
          rules={[{ required: true, message: '请选择凭证' }]}
        >
          <Select placeholder="请选择凭证">
            {credentials.map((cred) => (
              <Select.Option key={cred.id} value={cred.id}>
                {cred.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="timeout"
          label="超时时间(秒)"
          rules={[{ required: true, message: '请输入超时时间' }]}
        >
          <InputNumber
            min={1}
            max={300}
            style={{ width: '100%' }}
            placeholder="请输入超时时间"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SSHConfigModal; 