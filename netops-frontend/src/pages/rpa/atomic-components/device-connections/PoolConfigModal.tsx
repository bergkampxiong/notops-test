import React from 'react';
import { Modal, Form, InputNumber, message } from 'antd';
import { PoolConfig, updatePoolConfig } from '../../../../services/poolConfig';

interface PoolConfigModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialValues: PoolConfig;
}

const PoolConfigModal: React.FC<PoolConfigModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  initialValues,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      await updatePoolConfig(initialValues.id, values);
      message.success('连接池配置更新成功');
      
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
      title="连接池配置"
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
      >
        <Form.Item
          name="max_connections"
          label="最大连接数"
          rules={[{ required: true, message: '请输入最大连接数' }]}
        >
          <InputNumber
            min={1}
            max={1000}
            style={{ width: '100%' }}
            placeholder="请输入最大连接数"
          />
        </Form.Item>

        <Form.Item
          name="connection_timeout"
          label="连接超时时间(秒)"
          rules={[{ required: true, message: '请输入连接超时时间' }]}
        >
          <InputNumber
            min={1}
            max={300}
            style={{ width: '100%' }}
            placeholder="请输入连接超时时间"
          />
        </Form.Item>

        <Form.Item
          name="idle_timeout"
          label="空闲连接超时时间(秒)"
          rules={[{ required: true, message: '请输入空闲连接超时时间' }]}
        >
          <InputNumber
            min={1}
            max={3600}
            style={{ width: '100%' }}
            placeholder="请输入空闲连接超时时间"
          />
        </Form.Item>

        <Form.Item
          name="max_lifetime"
          label="连接最大生命周期(秒)"
          rules={[{ required: true, message: '请输入连接最大生命周期' }]}
        >
          <InputNumber
            min={1}
            max={86400}
            style={{ width: '100%' }}
            placeholder="请输入连接最大生命周期"
          />
        </Form.Item>

        <Form.Item
          name="min_idle"
          label="最小空闲连接数"
          rules={[{ required: true, message: '请输入最小空闲连接数' }]}
        >
          <InputNumber
            min={0}
            max={100}
            style={{ width: '100%' }}
            placeholder="请输入最小空闲连接数"
          />
        </Form.Item>

        <Form.Item
          name="max_idle"
          label="最大空闲连接数"
          rules={[{ required: true, message: '请输入最大空闲连接数' }]}
        >
          <InputNumber
            min={0}
            max={100}
            style={{ width: '100%' }}
            placeholder="请输入最大空闲连接数"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PoolConfigModal; 