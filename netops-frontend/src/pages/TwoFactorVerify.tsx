import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Space, Steps } from 'antd';
import { SafetyOutlined, KeyOutlined, QrcodeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/auth';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

const TwoFactorVerify: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [totpData, setTotpData] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 从URL参数中获取用户名和模式
    const params = new URLSearchParams(location.search);
    const user = params.get('username');
    const mode = params.get('mode');
    
    console.log('TwoFactorVerify params:', { user, mode });
    
    if (user) {
      setUsername(user);
      if (mode === 'setup') {
        console.log('Setup mode detected, setting up TOTP for user:', user);
        setSetupMode(true);
        setupTOTP(user);
      } else {
        console.log('Verification mode detected for user:', user);
      }
    } else {
      // 如果没有用户名，重定向到登录页
      console.log('No username provided, redirecting to login');
      navigate('/login');
    }
  }, [location, navigate]);

  // 设置TOTP
  const setupTOTP = async (user: string) => {
    setLoading(true);
    try {
      console.log('Setting up TOTP for user:', user);
      const response = await api.post('/auth/totp-setup-for-user', {
        username: user
      });
      console.log('TOTP setup response:', response.data);
      setTotpData(response.data);
      setCurrentStep(1); // 移动到扫描二维码步骤
    } catch (error) {
      console.error('设置TOTP失败:', error);
      message.error('设置TOTP失败，请重试');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  // 验证TOTP
  const verifyTOTP = async (values: { totp_code: string }) => {
    setLoading(true);
    try {
      console.log('Verifying TOTP for user:', username, 'code:', values.totp_code);
      const response = await api.post('/auth/totp-verify', {
        totp_code: values.totp_code,
        username: username
      });
      
      console.log('TOTP verification response:', response.data);
      
      if (response.data.access_token) {
        if (setupMode) {
          // 如果是设置模式，验证成功后显示完成步骤，然后返回登录页面
          setCurrentStep(2); // 移动到完成步骤
          message.success('双因素认证设置成功，请重新登录');
          // 3秒后返回登录页
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          // 如果是验证模式，验证成功后直接登录
          localStorage.setItem('token', response.data.access_token);
          localStorage.setItem('username', username);
          message.success('验证成功');
          navigate('/');
        }
      } else {
        message.error('验证失败，请重试');
      }
    } catch (error) {
      console.error('验证失败:', error);
      message.error('验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        message.success('已复制到剪贴板');
      },
      () => {
        message.error('复制失败');
      }
    );
  };

  // 设置模式下的步骤内容
  const steps = [
    {
      title: '准备',
      icon: <SafetyOutlined />,
      content: (
        <div>
          <Paragraph>
            正在准备双因素认证设置...
          </Paragraph>
        </div>
      ),
    },
    {
      title: '扫描二维码',
      icon: <QrcodeOutlined />,
      content: (
        <div>
          <Paragraph>
            请使用Google Authenticator或其他TOTP应用扫描下方二维码。
          </Paragraph>
          
          {totpData && (
            <>
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img 
                  src={`/api/auth/totp-qrcode?uri=${encodeURIComponent(totpData.uri)}`} 
                  alt="TOTP QR Code" 
                  style={{ maxWidth: '100%', border: '1px solid #f0f0f0', padding: 8 }}
                />
              </div>
              
              <Paragraph>
                或者手动输入以下密钥：
                <Space>
                  <Text code>{totpData.secret}</Text>
                  <Button 
                    type="text" 
                    size="small" 
                    onClick={() => copyToClipboard(totpData.secret)}
                  >
                    复制
                  </Button>
                </Space>
              </Paragraph>
              
              <Paragraph>
                <Text strong>备用验证码：</Text>
                <div style={{ background: '#f5f5f5', padding: 10, borderRadius: 4, marginTop: 8 }}>
                  {totpData.backup_codes.map((code: string, index: number) => (
                    <Text key={index} code style={{ marginRight: 8, marginBottom: 8, display: 'inline-block' }}>
                      {code}
                    </Text>
                  ))}
                </div>
                <Button 
                  type="text" 
                  size="small" 
                  onClick={() => copyToClipboard(totpData.backup_codes.join('\n'))}
                >
                  复制所有
                </Button>
              </Paragraph>
              
              <Form
                onFinish={verifyTOTP}
                layout="vertical"
              >
                <Form.Item
                  name="totp_code"
                  label="请输入验证器应用生成的6位验证码"
                  rules={[
                    { required: true, message: '请输入验证码' },
                    { len: 6, message: '验证码必须是6位数字' }
                  ]}
                >
                  <Input 
                    prefix={<KeyOutlined />}
                    placeholder="6位验证码"
                    maxLength={6}
                    size="large"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<SafetyOutlined />}
                    loading={loading}
                    size="large"
                    style={{ width: '100%' }}
                  >
                    验证并完成设置
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}
        </div>
      ),
    },
    {
      title: '完成',
      icon: <CheckCircleOutlined />,
      content: (
        <div>
          <Paragraph>
            <Text strong>双因素认证设置成功！</Text>
          </Paragraph>
          <Paragraph>
            您现在可以使用双因素认证登录系统。请妥善保管您的备用验证码，以防丢失验证器应用。
          </Paragraph>
          <Paragraph>
            正在返回登录页面...
          </Paragraph>
        </div>
      ),
    },
  ];

  return (
    <div className="two-factor-verify">
      <Card style={{ maxWidth: 600, margin: '100px auto' }}>
        <Title level={3}>双因素认证</Title>
        
        {setupMode ? (
          <>
            <Steps
              current={currentStep}
              items={steps.map(item => ({
                title: item.title,
                icon: item.icon,
              }))}
              style={{ marginBottom: 24 }}
            />
            
            <div className="steps-content">
              {steps[currentStep].content}
            </div>
          </>
        ) : (
          <>
            <Paragraph>
              请输入您的验证器应用生成的6位验证码。
            </Paragraph>
            
            <Form
              onFinish={verifyTOTP}
              layout="vertical"
            >
              <Form.Item
                name="totp_code"
                rules={[
                  { required: true, message: '请输入验证码' },
                  { len: 6, message: '验证码必须是6位数字' }
                ]}
              >
                <Input 
                  prefix={<KeyOutlined />}
                  placeholder="6位验证码"
                  maxLength={6}
                  size="large"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SafetyOutlined />}
                  loading={loading}
                  size="large"
                  style={{ width: '100%' }}
                >
                  验证
                </Button>
              </Form.Item>
              
              <div style={{ textAlign: 'center' }}>
                <Button 
                  type="link" 
                  onClick={() => navigate('/login')}
                >
                  返回登录
                </Button>
              </div>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
};

export default TwoFactorVerify; 