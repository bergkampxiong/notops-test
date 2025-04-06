import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Typography,
  Space,
  Switch,
  Divider,
  Alert,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  SaveOutlined,
  DisconnectOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import request from '../../utils/request';

interface LDAPConfigData {
  id?: number;
  server_url: string;
  base_dn: string;
  admin_dn: string;
  admin_password: string;
  user_search_base: string;
  group_search_base: string;
  is_active: boolean;
  sync_interval: number;
  last_sync_time?: string;
  sync_status?: string;
}

const { Title, Text } = Typography;

const LDAPConfig: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<LDAPConfigData | null>(null);
  const [syncStatus, setSyncStatus] = useState<{
    status: string;
    lastSync: string;
    totalUsers: number;
    totalGroups: number;
  } | null>(null);

  useEffect(() => {
    fetchConfig();
    fetchSyncStatus();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await request.get('/ldap/config');
      setConfig(response.data);
      form.setFieldsValue(response.data);
    } catch (error) {
      message.error('获取LDAP配置失败');
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await request.get('/ldap/sync-status');
      setSyncStatus(response.data);
    } catch (error) {
      message.error('获取同步状态失败');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const values = await form.validateFields();
      const response = await request.post('/ldap/test-connection', values);
      if (response.data.success) {
        message.success('LDAP连接测试成功');
      } else {
        message.error('LDAP连接测试失败');
      }
    } catch (error) {
      message.error('LDAP连接测试失败');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      await request.post('/ldap/config', values);
      message.success('LDAP配置保存成功');
      fetchConfig();
    } catch (error) {
      message.error('LDAP配置保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      await request.post('/ldap/sync');
      message.success('LDAP同步已启动');
      fetchSyncStatus();
    } catch (error) {
      message.error('LDAP同步启动失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ldap-config">
      <Card>
        <Title level={3}>LDAP配置</Title>

        {syncStatus && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="同步状态"
                  value={syncStatus.status}
                  valueStyle={{
                    color: syncStatus.status === 'success' ? '#3f8600' : '#cf1322'
                  }}
                  prefix={syncStatus.status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="最后同步时间"
                  value={syncStatus.lastSync}
                  prefix={<SyncOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="同步用户数"
                  value={syncStatus.totalUsers}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="同步群组数"
                  value={syncStatus.totalGroups}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Form
          form={form}
          layout="vertical"
          initialValues={config || {}}
        >
          <Form.Item
            name="server_url"
            label="LDAP服务器地址"
            rules={[{ required: true, message: '请输入LDAP服务器地址' }]}
          >
            <Input placeholder="例如: ldap://ldap.example.com:389" />
          </Form.Item>

          <Form.Item
            name="base_dn"
            label="基础DN"
            rules={[{ required: true, message: '请输入基础DN' }]}
          >
            <Input placeholder="例如: dc=example,dc=com" />
          </Form.Item>

          <Form.Item
            name="admin_dn"
            label="管理员DN"
            rules={[{ required: true, message: '请输入管理员DN' }]}
          >
            <Input placeholder="例如: cn=admin,dc=example,dc=com" />
          </Form.Item>

          <Form.Item
            name="admin_password"
            label="管理员密码"
            rules={[{ required: true, message: '请输入管理员密码' }]}
          >
            <Input.Password placeholder="请输入管理员密码" />
          </Form.Item>

          <Form.Item
            name="user_search_base"
            label="用户搜索基础DN"
            rules={[{ required: true, message: '请输入用户搜索基础DN' }]}
          >
            <Input placeholder="例如: ou=users,dc=example,dc=com" />
          </Form.Item>

          <Form.Item
            name="group_search_base"
            label="群组搜索基础DN"
            rules={[{ required: true, message: '请输入群组搜索基础DN' }]}
          >
            <Input placeholder="例如: ou=groups,dc=example,dc=com" />
          </Form.Item>

          <Form.Item
            name="sync_interval"
            label="同步间隔（分钟）"
            rules={[{ required: true, message: '请输入同步间隔' }]}
          >
            <Input type="number" min={1} placeholder="请输入同步间隔（分钟）" />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="启用LDAP"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={loading}
              >
                保存配置
              </Button>
              <Button
                icon={<DisconnectOutlined />}
                onClick={handleTestConnection}
                loading={testing}
              >
                测试连接
              </Button>
              <Button
                icon={<SyncOutlined />}
                onClick={handleSync}
              >
                立即同步
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LDAPConfig; 