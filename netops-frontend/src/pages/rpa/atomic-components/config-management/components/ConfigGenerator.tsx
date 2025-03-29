import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Space, message } from 'antd';
import { ConfigFile } from '../types';

interface ConfigGeneratorProps {
  templates: ConfigFile[];
  onSave: (config: any) => void;
}

const ConfigGenerator: React.FC<ConfigGeneratorProps> = ({ templates, onSave }) => {
  const [form] = Form.useForm();
  const [selectedTemplate, setSelectedTemplate] = useState<ConfigFile | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 处理模板选择
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      form.resetFields();
      setPreviewContent('');
    }
  };

  // 处理参数变化
  const handleValuesChange = async (changedValues: any, allValues: any) => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      // 这里需要调用后端API生成配置
      const response = await fetch(`/api/config/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          parameters: allValues,
        }),
      });

      if (!response.ok) {
        throw new Error('生成配置失败');
      }

      const data = await response.json();
      setPreviewContent(data.content);
    } catch (error: any) {
      message.error('生成配置失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 处理保存配置
  const handleSave = async () => {
    if (!selectedTemplate || !previewContent) {
      message.warning('请先生成配置');
      return;
    }

    try {
      const values = await form.validateFields();
      const configName = `${selectedTemplate.name}_${values.hostname || 'config'}_${new Date().getTime()}`;
      
      onSave({
        name: configName,
        content: previewContent,
        device_type: selectedTemplate.device_type,
        description: `由模板 ${selectedTemplate.name} 生成的配置`,
        parameters: values  // 保存生成配置时使用的参数
      });
      
      message.success('配置已保存');
      form.resetFields();
      setPreviewContent('');
    } catch (error: any) {
      message.error('保存失败：' + (error.message || '未知错误'));
    }
  };

  // 根据模板类型生成参数表单
  const renderParameterForm = () => {
    if (!selectedTemplate) return null;

    switch (selectedTemplate.type) {
      case 'jinja2':
        return (
          <>
            <Form.Item
              label="主机名"
              name="hostname"
              rules={[{ required: true, message: '请输入主机名' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="IP地址"
              name="ip_address"
              rules={[{ required: true, message: '请输入IP地址' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="接口"
              name="interface"
              rules={[{ required: true, message: '请输入接口名称' }]}
            >
              <Input />
            </Form.Item>
          </>
        );
      case 'textfsm':
        return (
          <>
            <Form.Item
              label="命令输出"
              name="command_output"
              rules={[{ required: true, message: '请输入命令输出' }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 300px)' }}>
        {/* 左侧模板列表 */}
        <Card title="模板列表" style={{ width: 300, height: '100%', overflow: 'auto' }}>
          <Select
            style={{ width: '100%' }}
            placeholder="选择模板"
            onChange={handleTemplateSelect}
            value={selectedTemplate?.id}
          >
            {templates.map(template => (
              <Select.Option key={template.id} value={template.id}>
                {template.name} ({template.type === 'jinja2' ? 'Jinja2' : 'TextFSM'})
              </Select.Option>
            ))}
          </Select>
          {selectedTemplate && (
            <div style={{ marginTop: 16 }}>
              <p><strong>模板类型：</strong> {selectedTemplate.type}</p>
              <p><strong>设备类型：</strong> {selectedTemplate.device_type}</p>
            </div>
          )}
        </Card>

        {/* 中间参数配置 */}
        <Card title="参数配置" style={{ flex: 1, height: '100%', overflow: 'auto' }}>
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleValuesChange}
          >
            {selectedTemplate && renderParameterForm()}
          </Form>
          {selectedTemplate && (
            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                onClick={handleSave}
                loading={loading}
                disabled={!previewContent}
              >
                保存配置
              </Button>
            </div>
          )}
        </Card>

        {/* 右侧预览 */}
        <Card title="配置预览" style={{ flex: 1, height: '100%', overflow: 'auto' }}>
          <Input.TextArea
            value={previewContent}
            style={{ height: 'calc(100% - 40px)', fontFamily: 'monospace' }}
            readOnly
          />
        </Card>
      </div>
    </div>
  );
};

export default ConfigGenerator; 