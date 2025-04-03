import React, { useState, useEffect } from 'react';
import { 
  Form, InputNumber, Button, Card, Switch, 
  message, Spin, Divider, Alert, Space, Row, Col, Typography 
} from 'antd';
import { 
  SaveOutlined, LockOutlined, 
  SafetyOutlined, ClockCircleOutlined 
} from '@ant-design/icons';
import api from '../../services/auth';

const { Title } = Typography;

// 卡片样式
const cardStyle = {
  height: '100%',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s'
};

// 卡片悬停样式
const cardHoverStyle = {
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
};

interface SecuritySettings {
  password_expiry_days: number;
  max_failed_attempts: number;
  lockout_duration_minutes: number;
  session_timeout_minutes: number;
  require_2fa_for_admins: boolean;
  password_complexity_enabled: boolean;
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_special: boolean;
}

const SecuritySettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // 获取安全设置
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/security/settings');
      form.setFieldsValue(response.data);
    } catch (error) {
      console.error('获取安全设置失败:', error);
      message.error('获取安全设置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // 保存安全设置
  const handleSubmit = async (values: SecuritySettings) => {
    setSaveLoading(true);
    try {
      await api.put('/security/settings', values);
      message.success('安全设置保存成功');
    } catch (error) {
      console.error('保存安全设置失败:', error);
      message.error('保存安全设置失败');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="security-settings">
      <div className="page-header">
        <h2>安全设置</h2>
      </div>
      
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            password_expiry_days: 90,
            max_failed_attempts: 5,
            lockout_duration_minutes: 15,
            session_timeout_minutes: 30,
            require_2fa_for_admins: true,
            password_complexity_enabled: true,
            password_min_length: 8,
            password_require_uppercase: true,
            password_require_lowercase: true,
            password_require_numbers: true,
            password_require_special: false
          }}
        >
          <Row gutter={[16, 16]}>
            {/* 账号安全设置 */}
            <Col xs={24} md={8}>
              <Card 
                title={<><LockOutlined /> 账号安全</>} 
                style={{
                  ...cardStyle,
                  ...(hoveredCard === 'account' ? cardHoverStyle : {})
                }}
                onMouseEnter={() => setHoveredCard('account')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <Form.Item
                  name="max_failed_attempts"
                  label="最大失败尝试次数"
                  rules={[{ required: true, message: '请输入最大失败尝试次数' }]}
                >
                  <InputNumber min={1} max={10} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name="lockout_duration_minutes"
                  label="账号锁定时长（分钟）"
                  rules={[{ required: true, message: '请输入账号锁定时长' }]}
                >
                  <InputNumber min={1} max={1440} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name="password_expiry_days"
                  label="密码过期时间（天）"
                  rules={[{ required: true, message: '请输入密码过期时间' }]}
                >
                  <InputNumber min={0} max={365} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name="require_2fa_for_admins"
                  label="管理员强制启用双因素认证"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Card>
            </Col>
            
            {/* 密码策略设置 */}
            <Col xs={24} md={8}>
              <Card 
                title={<><SafetyOutlined /> 密码策略</>} 
                style={{
                  ...cardStyle,
                  ...(hoveredCard === 'password' ? cardHoverStyle : {})
                }}
                onMouseEnter={() => setHoveredCard('password')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <Form.Item
                  name="password_complexity_enabled"
                  label="启用密码复杂度要求"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name="password_min_length"
                  label="密码最小长度"
                  rules={[{ required: true, message: '请输入密码最小长度' }]}
                >
                  <InputNumber min={6} max={32} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name="password_require_uppercase"
                  label="要求包含大写字母"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name="password_require_lowercase"
                  label="要求包含小写字母"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name="password_require_numbers"
                  label="要求包含数字"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name="password_require_special"
                  label="要求包含特殊字符"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Card>
            </Col>
            
            {/* 会话管理设置 */}
            <Col xs={24} md={8}>
              <Card 
                title={<><ClockCircleOutlined /> 会话管理</>} 
                style={{
                  ...cardStyle,
                  ...(hoveredCard === 'session' ? cardHoverStyle : {})
                }}
                onMouseEnter={() => setHoveredCard('session')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <Form.Item
                  name="session_timeout_minutes"
                  label="会话超时时间（分钟）"
                  rules={[{ required: true, message: '请输入会话超时时间' }]}
                >
                  <InputNumber min={5} max={1440} style={{ width: '100%' }} />
                </Form.Item>
                
                <Alert
                  message="会话管理说明"
                  description="会话超时时间是指用户在无操作状态下，系统自动注销登录的时间。设置合理的超时时间可以提高系统安全性。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
              </Card>
            </Col>
          </Row>
          
          <Divider />
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />}
              loading={saveLoading}
            >
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </div>
  );
};

export default SecuritySettings; 