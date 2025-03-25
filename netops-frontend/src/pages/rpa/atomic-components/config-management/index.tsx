import React, { useState } from 'react';
import { Card, Typography, Form, Input, Button, Space, message, Table, Modal, Select, Tag, Tooltip, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import styles from './index.module.less';

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
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // 表格列定义
  const columns: ColumnsType<ConfigFile> = [
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Tooltip title={text}>
          <span className={styles.configName}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '配置类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={
          type === 'yaml' ? 'blue' :
          type === 'json' ? 'green' :
          type === 'ini' ? 'orange' :
          'purple'
        }>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="删除">
            <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
          </Tooltip>
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
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个配置吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          // TODO: 实现删除API
          message.success('删除成功');
          setConfigs(configs.filter(config => config.id !== id));
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
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

  const filteredConfigs = configs.filter(config => {
    const matchesSearch = config.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         config.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesType = selectedType === 'all' || config.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className={styles.configManagement}>
      <Card className={styles.mainCard}>
        <div className={styles.header}>
          <Title level={4}>配置管理</Title>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增配置
            </Button>
          </Space>
        </div>

        <div className={styles.searchBar}>
          <Space>
            <Input
              placeholder="搜索配置名称或描述"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: 120 }}
            >
              <Option value="all">全部类型</Option>
              <Option value="yaml">YAML</Option>
              <Option value="json">JSON</Option>
              <Option value="ini">INI</Option>
              <Option value="env">ENV</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => {
              setSearchText('');
              setSelectedType('all');
            }}>
              重置
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredConfigs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
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
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ type: 'yaml' }}
        >
          <Form.Item
            name="name"
            label="配置名称"
            rules={[{ required: true, message: '请输入配置名称' }]}
          >
            <Input placeholder="请输入配置名称" maxLength={50} showCount />
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
            <TextArea
              rows={10}
              placeholder="请输入配置内容"
              showCount
              maxLength={5000}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea
              placeholder="请输入配置描述"
              maxLength={200}
              showCount
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConfigManagement; 