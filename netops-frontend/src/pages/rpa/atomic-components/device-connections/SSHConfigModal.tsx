import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Switch, Row, Col, message, Spin } from 'antd';
import { Typography } from 'antd';
import { getDeviceTypes, createSSHConfig, updateSSHConfig } from '../../../../services/sshConfig';
import request from '../../../../utils/request';
import { getCredentials, Credential } from '../../../../services/credential';

const { Text } = Typography;

/**
 * SSH配置模态框组件的属性接口
 */
interface SSHConfigModalProps {
  visible: boolean;              // 模态框是否可见
  onCancel: () => void;         // 取消按钮回调函数
  onSuccess: () => void;        // 成功提交后的回调函数
  initialValues?: any;          // 初始值，用于编辑模式
}

const { Option } = Select;

/**
 * SSH配置模态框组件
 * 用于创建和编辑SSH连接配置，包含基本连接信息和Netmiko特定参数
 */
const SSHConfigModal: React.FC<SSHConfigModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  initialValues,
}) => {
  const [form] = Form.useForm();                    // 表单实例
  const [deviceTypes, setDeviceTypes] = useState<string[]>([]);  // 设备类型列表
  const [credentials, setCredentials] = useState<Credential[]>([]); // 凭证列表
  const [loading, setLoading] = useState(false);    // 加载状态
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('');  // 用于控制enable密码字段的显示

  /**
   * 获取设备类型列表
   * 在组件挂载时调用
   */
  useEffect(() => {
    const fetchDeviceTypes = async () => {
      try {
        const types = await getDeviceTypes();
        setDeviceTypes(types);
      } catch (error) {
        message.error('获取设备类型列表失败');
      }
    };
    fetchDeviceTypes();
  }, []);

  /**
   * 获取凭证列表
   * 在组件挂载时调用
   */
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const response = await request.get('device/credential/');
        setCredentials(response.data);
      } catch (error) {
        console.error('获取凭证列表失败:', error);
        message.error('获取凭证列表失败');
      }
    };
    fetchCredentials();
  }, []);

  /**
   * 处理表单提交
   * 根据是否有initialValues决定是创建还是更新操作
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (initialValues) {
        await updateSSHConfig(initialValues.id, values);
        message.success('SSH配置更新成功');
      } else {
        await createSSHConfig(values);
        message.success('SSH配置创建成功');
      }

      form.resetFields();
      onSuccess();
    } catch (error: any) {
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error('操作失败');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理设备类型变化
   * 用于控制enable密码字段的显示/隐藏
   */
  const handleDeviceTypeChange = (value: string) => {
    setSelectedDeviceType(value);
  };

  return (
    <Modal
      title={initialValues ? '编辑SSH配置' : '新增SSH配置'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={800}
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            ...initialValues,
            port: initialValues?.port || 22,
            // Netmiko默认参数
            global_delay_factor: initialValues?.global_delay_factor || 1,
            auth_timeout: initialValues?.auth_timeout || 20,
            banner_timeout: initialValues?.banner_timeout || 20,
            fast_cli: initialValues?.fast_cli || false,
            session_timeout: initialValues?.session_timeout || 60,
            conn_timeout: initialValues?.conn_timeout || 10,
            keepalive: initialValues?.keepalive || 10,
            verbose: initialValues?.verbose || false,
          }}
        >
          {/* 基本信息部分 */}
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="SSH连接名称"
                rules={[{ required: true, message: '请输入SSH连接名称' }]}
                tooltip="此名称将用于流程设计器中标识该连接配置"
              >
                <Input placeholder="请输入SSH连接名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="device_type"
                label="设备类型"
                rules={[{ required: true, message: '请选择设备类型' }]}
                tooltip="选择Netmiko支持的设备类型"
              >
                <Select 
                  placeholder="请选择设备类型"
                  onChange={handleDeviceTypeChange}
                >
                  {deviceTypes.map((type) => (
                    <Option key={type} value={type}>
                      {type}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="port"
                label="SSH端口"
                rules={[{ required: true, message: '请输入SSH端口' }]}
                tooltip="SSH连接端口号"
              >
                <InputNumber min={1} max={65535} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="credential_id"
                label="认证信息"
                rules={[{ required: true, message: '请选择认证信息' }]}
                tooltip="选择包含用户名和密码的认证信息"
              >
                <Select placeholder="请选择认证信息">
                  {credentials.map((credential) => (
                    <Option key={credential.id} value={credential.id}>
                      {credential.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 思科设备特有的Enable密码配置 */}
          {selectedDeviceType.startsWith('cisco_') && (
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  name="enable_secret"
                  label="Enable密码"
                  tooltip="思科设备的Enable模式密码"
                >
                  <Input.Password placeholder="请输入Enable密码" />
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* Netmiko连接参数部分 */}
          <div style={{ marginBottom: 16, fontWeight: 'bold' }}>Netmiko连接参数</div>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="global_delay_factor"
                label="全局延迟因子"
                tooltip="用于调整命令执行延迟的全局因子"
              >
                <InputNumber min={0.1} max={10} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="auth_timeout"
                label="认证超时(秒)"
                tooltip="SSH认证超时时间"
              >
                <InputNumber min={1} max={300} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="banner_timeout"
                label="Banner超时(秒)"
                tooltip="等待设备banner的超时时间"
              >
                <InputNumber min={1} max={300} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="session_timeout"
                label="会话超时(秒)"
                tooltip="SSH会话超时时间"
              >
                <InputNumber min={1} max={3600} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="conn_timeout"
                label="连接超时(秒)"
                tooltip="建立SSH连接的超时时间"
              >
                <InputNumber min={1} max={300} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="keepalive"
                label="保活间隔(秒)"
                tooltip="SSH连接保活间隔"
              >
                <InputNumber min={1} max={300} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="fast_cli"
                label="快速CLI模式"
                tooltip="启用快速CLI模式以提高性能"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="verbose"
                label="详细日志"
                tooltip="启用详细日志输出"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
};

export default SSHConfigModal; 