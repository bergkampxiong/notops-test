import React, { useState } from 'react';
import { Card, Typography, Form, Input, Button, Space, message, Table, Modal, Select, Tag, Tooltip, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import styles from './index.module.less';
import request from '../../../../utils/request';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ConfigFile {
  id: string;
  name: string;
  type: string;
  content: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  versions?: Array<{
    version: number;
    content: string;
    comment: string;
    created_at: string;
    created_by: string;
  }>;
}

const ConfigManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [configs, setConfigs] = useState<ConfigFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigFile | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // 加载配置列表
  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await request.get('/api/config/files');
      setConfigs(response.data);
    } catch (error: any) {
      message.error('加载配置列表失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取数据
  React.useEffect(() => {
    fetchConfigs();
  }, []);

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
          type === 'jinja2' ? 'blue' :
          type === 'textfsm' ? 'green' :
          'purple'
        }>
          {type === 'jinja2' ? 'Jinja2 模板' : 'TextFSM 模板'}
        </Tag>
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
    form.setFieldsValue({ type: 'jinja2' });
    setModalVisible(true);
  };

  const handleEdit = (record: ConfigFile) => {
    setEditingConfig(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      content: record.content,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个配置吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await request.delete(`/api/config/files/${id}`);
          message.success('删除成功');
          setConfigs(configs.filter(config => config.id !== id));
        } catch (error: any) {
          message.error('删除失败: ' + (error.response?.data?.detail || error.message));
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      const configData = {
        name: values.name,
        type: values.type,
        content: values.content,
        device_type: values.device_type || 'cisco_ios',  // 设置默认设备类型
        status: values.status || 'draft',  // 设置默认状态
      };

      if (editingConfig) {
        // 更新配置
        await request.put(`/api/config/files/${editingConfig.id}`, configData);
        message.success('更新成功');
        setConfigs(configs.map(config => 
          config.id === editingConfig.id ? { ...config, ...configData } : config
        ));
      } else {
        // 创建新配置
        const response = await request.post('/api/config/files', configData);
        setConfigs([...configs, response.data]);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || '操作失败';
      message.error(`操作失败: ${errorMessage}`);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingConfig(null);
  };

  const filteredConfigs = configs.filter(config => {
    const matchesSearch = config.name.toLowerCase().includes(searchText.toLowerCase());
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
              placeholder="搜索配置名称"
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
              <Option value="jinja2">Jinja2 模板</Option>
              <Option value="textfsm">TextFSM 模板</Option>
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
        title={editingConfig ? "编辑配置" : "新建配置"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleModalCancel}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={editingConfig || {
            type: 'yaml',
            device_type: 'cisco_ios',
            status: 'draft'
          }}
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
            <Select>
              <Option value="yaml">YAML</Option>
              <Option value="json">JSON</Option>
              <Option value="ini">INI</Option>
              <Option value="env">ENV</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="device_type"
            label="设备类型"
            rules={[{ required: true, message: '请选择设备类型' }]}
          >
            <Select>
              <Option value="cisco_ios">Cisco IOS</Option>
              <Option value="huawei_vrp">Huawei VRP</Option>
              <Option value="hpe_comware7">HPE Comware7</Option>
              <Option value="ruijie_os">Ruijie OS</Option>
              <Option value="cisco_nxos">Cisco NXOS</Option>
              <Option value="cisco_xe">Cisco XE</Option>
              <Option value="cisco_xr">Cisco XR</Option>
              <Option value="linux">Linux</Option>
              <Option value="paloalto_panos">PaloAlto PANOS</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value="draft">草稿</Option>
              <Option value="published">已发布</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="配置内容"
            rules={[{ required: true, message: '请输入配置内容' }]}
          >
            <TextArea rows={10} placeholder="请输入配置内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConfigManagement; 