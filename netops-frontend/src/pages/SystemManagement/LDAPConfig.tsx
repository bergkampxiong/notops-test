import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Typography,
  Space,
  Divider,
  Switch,
  Alert
} from 'antd';
import {
  SaveOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import request from '../../utils/request';

// 与后端API兼容的接口
interface LDAPConfigData {
  id?: number;
  server_url: string;
  bind_dn: string;
  bind_password: string;
  search_base: string;
  user_search_filter: string;
  group_search_filter?: string;
  require_2fa?: boolean;
  admin_group_dn?: string;
  operator_group_dn?: string;
  auditor_group_dn?: string;
  use_ssl?: boolean;
}

const { Title, Text } = Typography;

const LDAPConfig: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<LDAPConfigData | null>(null);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await request.get('/ldap/config');
      if (response.data && response.data.server_url) {
        setConfig(response.data);
        
        // 只在有数据时才设置表单值
        form.setFieldsValue({
          server_url: response.data.server_url,
          search_base: response.data.search_base,
          bind_dn: response.data.bind_dn,
          bind_password: response.data.bind_password,
          use_ssl: response.data.use_ssl || false
        });
      }
    } catch (error: any) {
      // 如果是404错误（未找到配置），不显示错误消息
      if (error.response?.status !== 404) {
        message.error('获取LDAP配置失败');
      }
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestLogs([]);
    setTestResult(null);
    
    try {
      const values = await form.validateFields();
      
      // 只提交必要的连接信息
      const testData = {
        server_url: values.server_url,
        bind_dn: values.bind_dn,
        bind_password: values.bind_password,
        search_base: values.search_base,
        use_ssl: values.use_ssl || false
      };
      
      // 添加详细的连接过程日志
      setTestLogs(prev => [...prev, `开始测试LDAP连接...`]);
      setTestLogs(prev => [...prev, `配置信息:`]);
      setTestLogs(prev => [...prev, `- 服务器地址: ${values.server_url}`]);
      setTestLogs(prev => [...prev, `- 基本DN: ${values.search_base}`]);
      setTestLogs(prev => [...prev, `- 绑定DN: ${values.bind_dn}`]);
      setTestLogs(prev => [...prev, `- 使用SSL/TLS: ${values.use_ssl ? '是' : '否'}`]);
      setTestLogs(prev => [...prev, `- 端口: ${values.use_ssl ? '636' : '389'}`]);
      setTestLogs(prev => [...prev, `正在尝试建立LDAP连接...`]);
      
      // 添加请求数据日志（不包含密码）
      const logData = {...testData, bind_password: '********'};
      setTestLogs(prev => [...prev, `请求数据: ${JSON.stringify(logData, null, 2)}`]);
      
      // 使用fetch直接发送请求
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ldap/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testData)
      });
      
      const responseData = await response.json();
      setTestLogs(prev => [...prev, `收到后端响应: ${JSON.stringify(responseData, null, 2)}`]);
      
      if (responseData.success) {
        setTestResult({ success: true, message: 'LDAP连接测试成功' });
        setTestLogs(prev => [...prev, `连接测试成功:`]);
        setTestLogs(prev => [...prev, `- 状态: 已连接`]);
        setTestLogs(prev => [...prev, `- 消息: ${responseData.message}`]);
        if (responseData.details) {
          setTestLogs(prev => [...prev, `详细信息:`]);
          Object.entries(responseData.details).forEach(([key, value]) => {
            setTestLogs(prev => [...prev, `- ${key}: ${value}`]);
          });
        }
        message.success('LDAP连接测试成功');
      } else {
        setTestResult({ success: false, message: responseData.message || 'LDAP连接测试失败' });
        setTestLogs(prev => [...prev, `连接测试失败:`]);
        setTestLogs(prev => [...prev, `- 错误信息: ${responseData.message}`]);
        if (responseData.error_details) {
          setTestLogs(prev => [...prev, `错误详情:`]);
          setTestLogs(prev => [...prev, `- ${responseData.error_details}`]);
        }
        message.error(responseData.message || 'LDAP连接测试失败');
      }
    } catch (error: any) {
      setTestResult({ success: false, message: 'LDAP连接测试失败' });
      setTestLogs(prev => [...prev, `连接测试出错:`]);
      setTestLogs(prev => [...prev, `- 错误类型: ${error.name || '未知'}`]);
      setTestLogs(prev => [...prev, `- 错误信息: ${error.message || '未知错误'}`]);
      message.error('LDAP连接测试失败');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      
      // 构建与后端API兼容的请求数据
      const saveData = {
        server_url: values.server_url,
        bind_dn: values.bind_dn,
        bind_password: values.bind_password,
        search_base: values.search_base,
        user_search_filter: values.user_search_filter,
        group_search_filter: values.group_search_filter,
        require_2fa: values.require_2fa || false,
        admin_group_dn: values.admin_group_dn,
        operator_group_dn: values.operator_group_dn,
        auditor_group_dn: values.auditor_group_dn,
        use_ssl: values.use_ssl || false
      };
      
      // 如果已有配置，则更新；否则创建新配置
      if (config && config.id) {
        await request.put(`/ldap/config/${config.id}`, saveData);
      } else {
        await request.post('/ldap/config', saveData);
      }
      
      message.success('LDAP配置保存成功');
      fetchConfig();
    } catch (error) {
      message.error('LDAP配置保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ldap-config">
      <Card>
        <Title level={3}>LDAP配置</Title>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            server_url: '',
            search_base: '',
            bind_dn: '',
            bind_password: '',
            use_ssl: false
          }}
        >
          <Form.Item
            label="服务器地址"
            name="server_url"
            rules={[{ required: true, message: '请输入LDAP服务器地址' }]}
            tooltip="请输入LDAP服务器的IP地址或域名（不需要输入端口，端口由下方SSL/TLS开关自动决定）"
          >
            <Input placeholder="例如：172.19.128.164 或 ldap.example.com" />
          </Form.Item>

          <Form.Item
            label="基本DN"
            name="search_base"
            rules={[{ required: true, message: '请输入基本DN' }]}
            tooltip="LDAP基本DN，例如：dc=example,dc=com"
          >
            <Input placeholder="例如：dc=example,dc=com" />
          </Form.Item>

          <Form.Item
            label="绑定DN"
            name="bind_dn"
            rules={[{ required: true, message: '请输入绑定DN' }]}
            tooltip="LDAP绑定DN，支持以下格式：
1. 完整DN：cn=admin,dc=example,dc=com
2. 纯用户名：admin
3. DOMAIN\\username：EXAMPLE\\admin
4. userPrincipalName：admin@example.com"
          >
            <Input placeholder="例如：admin@example.com 或 EXAMPLE\admin" />
          </Form.Item>

          <Form.Item
            label="绑定密码"
            name="bind_password"
            rules={[{ required: true, message: '请输入绑定密码' }]}
          >
            <Input.Password placeholder="请输入LDAP绑定密码" />
          </Form.Item>

          <Form.Item
            label="使用SSL/TLS"
            name="use_ssl"
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
            </Space>
          </Form.Item>
        </Form>

        {testResult && (
          <Alert
            message={testResult.message}
            type={testResult.success ? "success" : "error"}
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        {testLogs.length > 0 && (
          <Card title="测试日志" style={{ marginTop: 16 }}>
            {testLogs.map((log, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                <Text>{log}</Text>
              </div>
            ))}
          </Card>
        )}
      </Card>
    </div>
  );
};

export default LDAPConfig; 