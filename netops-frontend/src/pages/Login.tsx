import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';

interface LoginFormValues {
  username: string;
  password: string;
  remember: boolean;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      console.log('Logging in with username:', values.username);
      const result = await login(values.username, values.password);
      console.log('Login result:', result);
      
      if (typeof result === 'boolean' && result) {
        // 登录成功，无需2FA
        console.log('Login successful, no 2FA required');
        message.success('登录成功');
        
        // 检查是否有重定向参数
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        console.log('Redirect parameter:', redirect);
        
        if (redirect === 'setup-2fa') {
          // 如果是从绑定2FA链接过来的，登录成功后跳转到2FA设置页面
          console.log('Redirecting to setup-2fa page');
          navigate('/setup-2fa');
        } else {
          // 否则跳转到首页
          console.log('Redirecting to home page');
          navigate('/');
        }
      } else if (typeof result === 'object') {
        // 需要2FA
        console.log('2FA required, needSetup:', result.needSetup);
        if (result.needSetup) {
          // 首次登录，需要设置2FA
          console.log('Redirecting to 2FA setup page');
          message.info('首次登录需要设置双因素认证');
          navigate(`/2fa-verify?username=${values.username}&mode=setup`);
        } else {
          // 非首次登录，需要验证2FA
          console.log('Redirecting to 2FA verification page');
          navigate(`/2fa-verify?username=${values.username}`);
        }
      } else {
        console.log('Login failed');
        message.error('用户名或密码错误');
      }
    } catch (error) {
      console.error('登录时出错:', error);
      message.error('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1 className="login-form-title">NetOps平台</h1>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>
          
          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
            
            <div style={{ float: 'right' }}>
              <a href="#" style={{ marginRight: 16 }}>
                忘记密码
              </a>
              <a 
                onClick={() => {
                  console.log('Binding 2FA clicked');
                  navigate('/setup-2fa');
                }}
              >
                绑定2FA
              </a>
            </div>
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="login-form-button"
              loading={loading}
              size="large"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login; 