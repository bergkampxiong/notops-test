import React, { useState, useRef, useEffect } from 'react';
import { Card, Typography, Tabs, Form, Input, Select, Button, Table, Switch, InputNumber, Space, message, Row, Col, Badge, Tooltip, Statistic, Modal, Popconfirm } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  SyncOutlined,
  ApiOutlined,
  SettingOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { getApiConfigs, deleteApiConfig, ApiConfig } from '../../services/apiConfig';
import { getSSHConfigs, deleteSSHConfig, SSHConfig, getDeviceTypes, createSSHConfig, updateSSHConfig } from '../../services/sshConfig';
import { getPoolConfig, PoolConfig } from '../../services/poolConfig';
import SSHConfigModal from './atomic-components/device-connections/SSHConfigModal';
import ApiConfigModal from './atomic-components/device-connections/ApiConfigModal';
import PoolConfigModal from './atomic-components/device-connections/PoolConfigModal';
import PoolMonitor from './atomic-components/device-connections/PoolMonitor';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

// API类型选项
const apiTypes = [
  { label: 'REST API', value: 'REST' },
  { label: 'NETCONF', value: 'NETCONF' },
  { label: 'YANG', value: 'YANG' },
  { label: 'gRPC', value: 'gRPC' },
];

// 认证类型选项
const authTypes = [
  { label: 'Basic Auth', value: 'Basic' },
  { label: 'Token', value: 'Token' },
  { label: 'OAuth', value: 'OAuth' },
];

const DeviceConnections: React.FC = () => {
  // 状态管理
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [poolConfig, setPoolConfig] = useState<PoolConfig | null>(null);
  const [activeTab, setActiveTab] = useState('ssh');
  const [sshConfigs, setSSHConfigs] = useState<SSHConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiModalVisible, setApiModalVisible] = useState(false);
  const [sshModalVisible, setSSHModalVisible] = useState(false);
  const [poolConfigModalVisible, setPoolConfigModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [form] = Form.useForm();
  const [apiForm] = Form.useForm();
  
  // 使用 ref 替代 findDOMNode
  const headersRef = useRef<HTMLTextAreaElement>(null);

  // 获取数据
  const fetchData = async () => {
    setLoading(true);
    try {
      const [sshData, apiData, poolData] = await Promise.all([
        getSSHConfigs(),
        getApiConfigs(),
        getPoolConfig()
      ]);
      setSSHConfigs(sshData);
      setApiConfigs(apiData);
      setPoolConfig(poolData);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 处理函数
  const handleAddSSH = () => {
    setEditingConfig(null);
    setSSHModalVisible(true);
  };

  const handleEditSSH = (record: SSHConfig) => {
    setEditingConfig(record);
    setSSHModalVisible(true);
  };

  const handleDeleteSSH = async (id: number) => {
    try {
      await deleteSSHConfig(id);
      message.success('删除SSH配置成功');
      fetchData();
    } catch (error) {
      message.error('删除SSH配置失败');
    }
  };

  const handleAddApi = () => {
    setEditingConfig(null);
    setApiModalVisible(true);
  };

  const handleEditApi = (record: ApiConfig) => {
    setEditingConfig(record);
    setApiModalVisible(true);
  };

  const handleDeleteApi = async (id: number) => {
    try {
      await deleteApiConfig(id);
      message.success('删除API配置成功');
      fetchData();
    } catch (error) {
      message.error('删除API配置失败');
    }
  };

  const handleEditPoolConfig = () => {
    setPoolConfigModalVisible(true);
  };

  const handleAPIFormSubmit = async (values: any) => {
    try {
      // 处理请求头
      const headers = values.headers
        ? values.headers.split('\n').reduce((acc: Record<string, string>, line: string) => {
            const [key, value] = line.split(':').map(str => str.trim());
            if (key && value) {
              acc[key] = value;
            }
            return acc;
          }, {})
        : {};

      const apiConfig = {
        ...values,
        headers,
      };

      if (editingConfig) {
        // TODO: 调用更新API配置的API
        const updatedConfigs = apiConfigs.map(config =>
          config.id === editingConfig.id ? { ...apiConfig, id: editingConfig.id } : config
        );
        setApiConfigs(updatedConfigs);
        message.success('API配置更新成功');
      } else {
        // TODO: 调用创建API配置的API
        const newConfig = {
          ...apiConfig,
          id: Date.now().toString(), // 临时ID生成方式
        };
        setApiConfigs([...apiConfigs, newConfig]);
        message.success('API配置创建成功');
      }
      setApiModalVisible(false);
      setEditingConfig(null);
      apiForm.resetFields();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 表格列定义
  const sshColumns = [
    {
      title: 'SSH连接名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
    },
    {
      title: '超时时间(秒)',
      dataIndex: 'timeout',
      key: 'timeout',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SSHConfig) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditSSH(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个SSH配置吗？"
            onConfirm={() => handleDeleteSSH(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const apiColumns = [
    {
      title: 'API连接名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'API类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '超时时间(秒)',
      dataIndex: 'timeout',
      key: 'timeout',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ApiConfig) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditApi(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个API配置吗？"
            onConfirm={() => handleDeleteApi(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // API配置模态框
  const APIConfigModal = () => (
    <Modal
      title={editingConfig ? '编辑API配置' : '添加API配置'}
      open={apiModalVisible}
      onOk={() => apiForm.submit()}
      onCancel={() => {
        setApiModalVisible(false);
        setEditingConfig(null);
        apiForm.resetFields();
      }}
      width={700}
    >
      <Form
        form={apiForm}
        layout="vertical"
        initialValues={editingConfig || {
          timeout: 30,
          headers: {},
        }}
        onFinish={handleAPIFormSubmit}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="配置名称"
              rules={[{ required: true, message: '请输入配置名称' }]}
            >
              <Input placeholder="请输入配置名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="type"
              label="API类型"
              rules={[{ required: true, message: '请选择API类型' }]}
            >
              <Select placeholder="请选择API类型">
                {apiTypes.map(type => (
                  <Option key={type.value} value={type.value}>{type.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="endpoint"
          label="API端点"
          rules={[{ required: true, message: '请输入API端点' }]}
        >
          <Input placeholder="请输入API端点地址" />
        </Form.Item>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="authType"
              label="认证方式"
              rules={[{ required: true, message: '请选择认证方式' }]}
            >
              <Select placeholder="请选择认证方式">
                {authTypes.map(type => (
                  <Option key={type.value} value={type.value}>{type.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="timeout"
              label="超时时间(秒)"
              rules={[{ required: true, message: '请输入超时时间' }]}
            >
              <InputNumber min={1} max={300} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="headers"
          label="请求头"
        >
          <Tooltip title="每行一个请求头，格式为 key: value">
            <TextArea
              ref={headersRef}
              placeholder="Content-Type: application/json&#13;Accept: application/json"
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Tooltip>
        </Form.Item>
      </Form>
    </Modal>
  );

  // 标签页配置
  const items: TabsProps['items'] = [
    {
      key: 'ssh',
      label: 'SSH连接配置',
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSSH}>
              新增SSH配置
            </Button>
          </Space>
          <Table columns={sshColumns} dataSource={sshConfigs} rowKey="id" loading={loading} />
          <SSHConfigModal
            visible={sshModalVisible}
            onCancel={() => setSSHModalVisible(false)}
            onSuccess={() => {
              setSSHModalVisible(false);
              fetchData();
            }}
            initialValues={editingConfig}
          />
        </div>
      ),
    },
    {
      key: 'api',
      label: 'API连接配置',
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddApi}>
              新增API配置
            </Button>
          </Space>
          <Table columns={apiColumns} dataSource={apiConfigs} rowKey="id" loading={loading} />
          <APIConfigModal />
        </div>
      ),
    },
    {
      key: 'pool',
      label: '连接池管理',
      children: (
        <div>
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" onClick={handleEditPoolConfig}>
              连接池配置
            </Button>
          </Space>
          <PoolMonitor />
        </div>
      ),
    },
  ];

  return (
    <div className="device-connections">
      <Card>
        <Title level={4}>设备连接组件</Title>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
      </Card>

      {poolConfig && (
        <PoolConfigModal
          visible={poolConfigModalVisible}
          onCancel={() => setPoolConfigModalVisible(false)}
          onSuccess={() => {
            setPoolConfigModalVisible(false);
            fetchData();
          }}
          initialValues={poolConfig}
        />
      )}
    </div>
  );
};

export default DeviceConnections; 