import React, { useEffect, useState } from 'react';
import { Drawer, Form, Select, Button, Space, message } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { getJobTemplates } from '../../../api/config';

const { Option } = Select;

interface ConfigDeployPanelProps {
  visible: boolean;
  onClose: () => void;
  initialData?: any;
  onSave: (data: any) => void;
}

export const PDConfigDeployPanel: React.FC<ConfigDeployPanelProps> = ({
  visible,
  onClose,
  initialData,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [jobTemplates, setJobTemplates] = useState<any[]>([]);

  // 只在面板打开时加载数据
  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible]);

  // 加载初始数据
  const loadInitialData = async () => {
    try {
      setLoading(true);
      // 获取作业模板列表
      const response = await getJobTemplates();
      setJobTemplates(response.data || []);

      // 如果有初始数据，设置表单值
      if (initialData) {
        form.setFieldsValue(initialData);
      }
    } catch (error) {
      message.error('加载作业模板失败');
      console.error('加载作业模板失败:', error);
    } finally {
      setLoading(false);
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
          <CloudUploadOutlined />
          <span>配置下发</span>
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
          name="configTemplateId"
          label="作业模板"
          rules={[{ required: true, message: '请选择作业模板' }]}
        >
          <Select
            placeholder="请选择作业模板"
            options={jobTemplates?.map(template => ({
              label: template.name,
              value: template.id
            })) || []}
            loading={loading}
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}; 