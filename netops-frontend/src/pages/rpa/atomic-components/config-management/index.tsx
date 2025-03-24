import React, { useState } from 'react';
import { Card, Typography, Form, Input, Button, Space, message, Table, Modal, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ConfigFile {
  id: number;
  name: string;
  type: string;
  content: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const ConfigManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [configs, setConfigs] = useState<ConfigFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigFile | null>(null);

  // 表格列定义
  const columns: ColumnsType<ConfigFile> = [
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '配置类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 处理函数
  const handleAdd = () => {
    setEditingConfig(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: ConfigFile) => {
    setEditingConfig(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      // TODO: 实现删除API
      message.success('删除成功');
      setConfigs(configs.filter(config => config.id !== id));
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingConfig) {
        // TODO: 实现更新API
        message.success('更新成功');
        setConfigs(configs.map(config => 
          config.id === editingConfig.id ? { ...values, id: editingConfig.id } : config
        ));
      } else {
        // TODO: 实现创建API
        const newConfig = {
          ...values,
          id: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setConfigs([...configs, newConfig]);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('操作失败');
    }
  };

  return (
    <div className="config-management">
      <Card>
        <Title level={4}>配置管理</Title>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增配置
          </Button>
        </Space>
        <Table columns={columns} dataSource={configs} rowKey="id" loading={loading} />
      </Card>

      <Modal
        title={editingConfig ? '编辑配置' : '新增配置'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="配置名称"
            rules={[{ required: true, message: '请输入配置名称' }]}
          >
            <Input placeholder="请输入配置名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="配置类型"
            rules={[{ required: true, message: '请选择配置类型' }]}
          >
            <Select placeholder="请选择配置类型">
              <Option value="yaml">YAML</Option>
              <Option value="json">JSON</Option>
              <Option value="ini">INI</Option>
              <Option value="env">ENV</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label="配置内容"
            rules={[{ required: true, message: '请输入配置内容' }]}
          >
            <TextArea rows={10} placeholder="请输入配置内容" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input placeholder="请输入配置描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConfigManagement; 