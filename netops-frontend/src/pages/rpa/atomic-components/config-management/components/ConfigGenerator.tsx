import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Space, message } from 'antd';
import { ConfigFile } from '../types';
import MonacoEditor from '@monaco-editor/react';

interface ConfigGeneratorProps {
  templates: ConfigFile[];
  onSave: (config: any) => void;
}

const ConfigGenerator: React.FC<ConfigGeneratorProps> = ({ templates, onSave }) => {
  const [form] = Form.useForm();
  const [selectedTemplate, setSelectedTemplate] = useState<ConfigFile | null>(null);
  const [templateContent, setTemplateContent] = useState<string>('');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 处理模板选择
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setTemplateContent(template.content);
      form.resetFields();
      setPreviewContent('');
    }
  };

  // 处理参数变化
  const handleValuesChange = async (changedValues: any, allValues: any) => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      // 调用后端API生成配置
      const response = await fetch('/api/config/render-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_name: selectedTemplate.name,
          variables: allValues,
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
        parameters: values
      });
      
      message.success('配置已保存');
      form.resetFields();
      setPreviewContent('');
    } catch (error: any) {
      message.error('保存失败：' + (error.message || '未知错误'));
    }
  };

  // 从模板内容中提取参数
  const extractParameters = (content: string) => {
    const paramRegex = /\{\{\s*(\w+)\s*\}\}/g;
    const forLoopRegex = /\{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%\}/g;
    const ifRegex = /\{%\s*if\s+(\w+)\s*%\}/g;
    
    const params = new Set<string>();
    
    // 提取简单变量
    let match;
    while ((match = paramRegex.exec(content)) !== null) {
      params.add(match[1]);
    }
    
    // 提取循环变量
    while ((match = forLoopRegex.exec(content)) !== null) {
      params.add(match[2]);
    }
    
    // 提取条件变量
    while ((match = ifRegex.exec(content)) !== null) {
      params.add(match[1]);
    }
    
    return Array.from(params);
  };

  // 根据模板内容生成参数表单
  const renderParameterForm = () => {
    if (!selectedTemplate || !templateContent) return null;

    const parameters = extractParameters(templateContent);
    
    return parameters.map(param => (
      <Form.Item
        key={param}
        label={param}
        name={param}
        rules={[{ required: true, message: `请输入${param}` }]}
      >
        <Input />
      </Form.Item>
    ));
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
                {template.name} ({template.template_type === 'jinja2' ? 'Jinja2' : template.template_type === 'textfsm' ? 'TextFSM' : template.template_type === 'job' ? '作业配置' : '其他'})
              </Select.Option>
            ))}
          </Select>
          {selectedTemplate && (
            <div style={{ marginTop: 16 }}>
              <p><strong>模板类型：</strong> {selectedTemplate.template_type === 'jinja2' ? 'Jinja2' : selectedTemplate.template_type === 'textfsm' ? 'TextFSM' : selectedTemplate.template_type === 'job' ? '作业配置' : '其他'}</p>
              <p><strong>设备类型：</strong> {selectedTemplate.device_type}</p>
            </div>
          )}
        </Card>

        {/* 中间模板内容和参数配置 */}
        <Card title="模板内容和参数配置" style={{ flex: 1, height: '100%', overflow: 'auto' }}>
          {selectedTemplate && (
            <>
              <div style={{ marginBottom: 16 }}>
                <MonacoEditor
                  height="300px"
                  language="jinja"
                  theme="vs-light"
                  value={templateContent}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on'
                  }}
                />
              </div>
              <Form
                form={form}
                layout="vertical"
                onValuesChange={handleValuesChange}
              >
                {renderParameterForm()}
                <Button
                  type="primary"
                  onClick={handleSave}
                  loading={loading}
                  disabled={!previewContent}
                >
                  保存配置
                </Button>
              </Form>
            </>
          )}
        </Card>

        {/* 右侧预览 */}
        <Card title="配置预览" style={{ flex: 1, height: '100%', overflow: 'auto' }}>
          <MonacoEditor
            height="calc(100% - 40px)"
            language="plaintext"
            theme="vs-light"
            value={previewContent}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on'
            }}
          />
        </Card>
      </div>
    </div>
  );
};

export default ConfigGenerator; 