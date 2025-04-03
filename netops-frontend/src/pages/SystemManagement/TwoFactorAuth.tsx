import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Steps, Row, Col, 
  Typography, Input, message, Alert, Space, Modal 
} from 'antd';
import { 
  QrcodeOutlined, SafetyOutlined, 
  CheckCircleOutlined, CopyOutlined, 
  ReloadOutlined, KeyOutlined 
} from '@ant-design/icons';
import api from '../../services/auth';

const { Step } = Steps;
const { Title, Paragraph, Text } = Typography;

interface TOTPData {
  secret: string;
  uri: string;
  backup_codes: string[];
}

const TwoFactorAuth: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [totpData, setTotpData] = useState<TOTPData | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [backupCodesVisible, setBackupCodesVisible] = useState(false);

  // 获取用户2FA状态
  const fetchUserStatus = async () => {
    try {
      const response = await api.get('/users/me');
      if (response.data.totp_enabled) {
        setSetupComplete(true);
      }
    } catch (error) {
      console.error('获取用户状态失败:', error);
    }
  };

  useEffect(() => {
    fetchUserStatus();
  }, []);

  // 设置TOTP
  const setupTOTP = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/totp-setup');
      setTotpData(response.data);
      setCurrent(1);
    } catch (error) {
      console.error('设置TOTP失败:', error);
      message.error('设置TOTP失败');
    } finally {
      setLoading(false);
    }
  };

  // 验证TOTP
  const verifyTOTP = async () => {
    if (!totpCode || totpCode.length !== 6) {
      message.error('请输入6位验证码');
      return;
    }

    setVerifying(true);
    try {
      await api.post('/auth/totp-verify', {
        totp_code: totpCode,
        username: localStorage.getItem('username')
      });
      
      message.success('验证成功，双因素认证已启用');
      setCurrent(2);
      setSetupComplete(true);
    } catch (error) {
      console.error('验证TOTP失败:', error);
      message.error('验证码无效，请重试');
    } finally {
      setVerifying(false);
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

  // 重置2FA
  const resetTOTP = async () => {
    Modal.confirm({
      title: '确定要重置双因素认证吗？',
      content: '重置后，您需要重新设置双因素认证。在重新设置之前，您将无法使用双因素认证登录。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.post('/auth/totp-reset');
          message.success('双因素认证已重置');
          setSetupComplete(false);
          setCurrent(0);
          setTotpData(null);
        } catch (error) {
          console.error('重置TOTP失败:', error);
          message.error('重置失败，请重试');
        }
      }
    });
  };

  // 步骤内容
  const steps = [
    {
      title: '开始设置',
      content: (
        <Card>
          <Title level={4}>设置双因素认证</Title>
          <Paragraph>
            双因素认证（2FA）是一种额外的安全层，可以保护您的账户免受未经授权的访问。
            启用后，您需要提供密码和一个临时验证码才能登录。
          </Paragraph>
          <Paragraph>
            <Text strong>设置步骤：</Text>
            <ol>
              <li>安装Google Authenticator或其他TOTP应用</li>
              <li>扫描二维码或手动输入密钥</li>
              <li>输入应用生成的验证码进行验证</li>
            </ol>
          </Paragraph>
          <Button 
            type="primary" 
            icon={<SafetyOutlined />} 
            onClick={setupTOTP}
            loading={loading}
          >
            开始设置
          </Button>
        </Card>
      ),
    },
    {
      title: '扫描二维码',
      content: (
        <Card>
          <Title level={4}>扫描二维码</Title>
          <Row gutter={24}>
            <Col span={12}>
              <Paragraph>
                请使用Google Authenticator或其他TOTP应用扫描右侧的二维码，或手动输入以下密钥：
              </Paragraph>
              <div style={{ marginBottom: 16 }}>
                <Text code copyable>{totpData?.secret}</Text>
                <Button 
                  type="text" 
                  icon={<CopyOutlined />} 
                  onClick={() => copyToClipboard(totpData?.secret || '')}
                >
                  复制
                </Button>
              </div>
              <Paragraph>
                <Text strong>完成后，请输入应用生成的6位验证码：</Text>
              </Paragraph>
              <Space>
                <Input 
                  placeholder="输入6位验证码" 
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{ width: 200 }}
                />
                <Button 
                  type="primary" 
                  onClick={verifyTOTP}
                  loading={verifying}
                >
                  验证
                </Button>
              </Space>
            </Col>
            <Col span={12} style={{ textAlign: 'center' }}>
              {totpData && (
                <img 
                  src={`/api/auth/totp-qrcode?uri=${encodeURIComponent(totpData.uri)}`} 
                  alt="TOTP QR Code" 
                  style={{ maxWidth: '100%', border: '1px solid #f0f0f0', padding: 8 }}
                />
              )}
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      title: '设置完成',
      content: (
        <Card>
          <Title level={4}>设置完成</Title>
          <Alert
            message="双因素认证已成功启用"
            description="您的账户现在受到双因素认证的保护。每次登录时，您都需要输入密码和验证码。"
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            style={{ marginBottom: 24 }}
          />
          <Paragraph>
            <Text strong>备用验证码：</Text>
            <br />
            如果您无法访问您的验证器应用，可以使用备用验证码登录。请将这些代码保存在安全的地方。
          </Paragraph>
          <Space>
            <Button 
              type="primary" 
              icon={<KeyOutlined />} 
              onClick={() => setBackupCodesVisible(true)}
            >
              查看备用验证码
            </Button>
          </Space>
        </Card>
      ),
    },
  ];

  return (
    <div className="two-factor-auth">
      <div className="page-header">
        <h2>双因素认证</h2>
      </div>
      
      {setupComplete && current !== 2 ? (
        <Card>
          <Alert
            message="双因素认证已启用"
            description="您的账户已启用双因素认证保护。"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Space>
            <Button 
              type="primary" 
              icon={<KeyOutlined />} 
              onClick={() => setBackupCodesVisible(true)}
            >
              查看备用验证码
            </Button>
            <Button 
              danger 
              icon={<ReloadOutlined />} 
              onClick={resetTOTP}
            >
              重置双因素认证
            </Button>
          </Space>
        </Card>
      ) : (
        <>
          <Steps current={current} style={{ marginBottom: 24 }}>
            <Step title="开始设置" icon={<SafetyOutlined />} />
            <Step title="扫描二维码" icon={<QrcodeOutlined />} />
            <Step title="设置完成" icon={<CheckCircleOutlined />} />
          </Steps>
          <div className="steps-content">{steps[current].content}</div>
        </>
      )}
      
      {/* 备用验证码模态框 */}
      <Modal
        title="备用验证码"
        open={backupCodesVisible}
        onCancel={() => setBackupCodesVisible(false)}
        footer={[
          <Button 
            key="copy" 
            icon={<CopyOutlined />} 
            onClick={() => copyToClipboard(totpData?.backup_codes.join('\n') || '')}
          >
            复制所有
          </Button>,
          <Button 
            key="close" 
            type="primary" 
            onClick={() => setBackupCodesVisible(false)}
          >
            关闭
          </Button>,
        ]}
      >
        <Alert
          message="重要提示"
          description="这些是您的备用验证码，每个代码只能使用一次。请将它们保存在安全的地方。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
          {totpData?.backup_codes.map((code, index) => (
            <div key={index} style={{ fontFamily: 'monospace', marginBottom: 8 }}>
              {code}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default TwoFactorAuth; 