import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Card, Switch, 
  message, Spin, Divider, Alert, Space 
} from 'antd';
import { 
  SaveOutlined, SyncOutlined, 
  CheckCircleOutlined, CloseCircleOutlined 
} from '@ant-design/icons';
import api from '../../services/auth';

interface LDAPConfigData {
  id?: number;
  server_url: string;
  bind_dn: string;
  bind_password: string;
  search_base: string;
  user_search_filter: string;
  group_search_filter?: string;
  require_2fa: boolean;
  admin_group_dn?: string;
  operator_group_dn?: string;
  auditor_group_dn?: string;
}

const LDAPConfig: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [configId, setConfigId] = useState<number | null>(null);

  // 获取LDAP配置
  const fetchLDAPConfig = async () => {
    setLoading(true);
    try {
      const response = await api.get('/ldap/config');
      console.log('LDAP配置响应:', response);
      if (response.data) {
        form.setFieldsValue(response.data);
        setConfigId(response.data.id);
      }
    } catch (error: any) {
      console.error('获取LDAP配置失败:', error);
      if (error.response?.status === 404) {
        // 如果是404错误，说明还没有配置，清空表单
        form.resetFields();
        setConfigId(null);
        message.info('尚未配置LDAP，请填写以下信息进行配置');
      } else {
        message.error('获取LDAP配置失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLDAPConfig();
  }, []);

  // 保存LDAP配置
  const handleSubmit = async (values: LDAPConfigData) => {
    setLoading(true);
    try {
      if (configId) {
        // 更新配置
        await api.put(`/ldap/config/${configId}`, values);
      } else {
        // 创建配置
        const response = await api.post('/ldap/config', values);
        setConfigId(response.data.id);
      }
      message.success('LDAP配置保存成功');
    } catch (error) {
      console.error('保存LDAP配置失败:', error);
      message.error('保存LDAP配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 测试LDAP连接
  const testConnection = async () => {
    try {
      const values = await form.validateFields();
      setTestLoading(true);
      setTestResult(null);
      
      const response = await api.post('/ldap/test-connection', values);
      
      setTestResult({
        success: response.data.success,
        message: response.data.message
      });
      
      if (response.data.success) {
        message.success('LDAP连接测试成功');
      } else {
        message.error('LDAP连接测试失败');
      }
    } catch (error) {
      console.error('测试LDAP连接失败:', error);
      setTestResult({
        success: false,
        message: '测试连接失败，请检查配置'
      });
      message.error('测试连接失败，请检查配置');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="ldap-config">
      <div className="page-header">
        <h2>LDAP配置</h2>
      </div>
      
      <Spin spinning={loading}>
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              require_2fa: false,
              user_search_filter: '(sAMAccountName={username})'
            }}
          >
            <h3>基本配置</h3>
            <Form.Item
              name="server_url"
              label="LDAP服务器URL"
              rules={[{ required: true, message: '请输入LDAP服务器URL' }]}
            >
              <Input placeholder="例如: ldap://ldap.example.com:389" />
            </Form.Item>
            
            <Form.Item
              name="bind_dn"
              label="绑定DN"
              rules={[{ required: true, message: '请输入绑定DN' }]}
            >
              <Input placeholder="例如: cn=admin,dc=example,dc=com" />
            </Form.Item>
            
            <Form.Item
              name="bind_password"
              label="绑定密码"
              rules={[{ required: true, message: '请输入绑定密码' }]}
            >
              <Input.Password />
            </Form.Item>
            
            <Form.Item
              name="search_base"
              label="搜索基础"
              rules={[{ required: true, message: '请输入搜索基础' }]}
            >
              <Input placeholder="例如: dc=example,dc=com" />
            </Form.Item>
            
            <Form.Item
              name="user_search_filter"
              label="用户搜索过滤器"
              rules={[{ required: true, message: '请输入用户搜索过滤器' }]}
            >
              <Input placeholder="例如: (sAMAccountName={username})" />
            </Form.Item>
            
            <Form.Item
              name="group_search_filter"
              label="组搜索过滤器"
            >
              <Input placeholder="例如: (objectClass=group)" />
            </Form.Item>
            
            <Form.Item
              name="require_2fa"
              label="强制LDAP用户启用2FA"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Divider />
            
            <h3>角色映射</h3>
            <p>将LDAP组映射到系统角色</p>
            
            <Form.Item
              name="admin_group_dn"
              label="管理员组DN"
            >
              <Input placeholder="例如: cn=Administrators,ou=Groups,dc=example,dc=com" />
            </Form.Item>
            
            <Form.Item
              name="operator_group_dn"
              label="操作员组DN"
            >
              <Input placeholder="例如: cn=Operators,ou=Groups,dc=example,dc=com" />
            </Form.Item>
            
            <Form.Item
              name="auditor_group_dn"
              label="审计员组DN"
            >
              <Input placeholder="例如: cn=Auditors,ou=Groups,dc=example,dc=com" />
            </Form.Item>
            
            <Divider />
            
            {testResult && (
              <Alert
                message={testResult.success ? "连接成功" : "连接失败"}
                description={testResult.message}
                type={testResult.success ? "success" : "error"}
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}
            
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={loading}
              >
                保存配置
              </Button>
              
              <Button 
                onClick={testConnection} 
                icon={<SyncOutlined />}
                loading={testLoading}
              >
                测试连接
              </Button>
            </Space>
          </Form>
        </Card>
      </Spin>
    </div>
  );
};

export default LDAPConfig; 