import React, { useState, useEffect } from 'react';
import { Card, Typography, message, Form, Input, Select, Space, Button, Spin } from 'antd';
import request from '../../../../utils/request';
import MonacoEditor from '@monaco-editor/react';
import styles from './index.module.less';

const { Title } = Typography;
const { Option } = Select;

interface ConfigFile {
  id: string;
  name: string;
  type: string;
  content: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  device_type: string;
  status: string;
}

const ConfigGeneratorPage: React.FC = () => {
  const [form] = Form.useForm();
  const [configs, setConfigs] = useState<ConfigFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ConfigFile | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');

  // 加载模板列表
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await request.get('/api/config/files', {
        params: {
          type: 'jinja2'
        }
      });
      setConfigs(response.data);
    } catch (error: any) {
      message.error('加载模板列表失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // 从模板内容中提取参数
  const extractParameters = (content: string) => {
    const paramRegex = /\{\{\s*(\w+)\s*\}\}/g;
    const forLoopRegex = /\{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%\}/g;
    const ifRegex = /\{%\s*if\s+(\w+)\s*%\}/g;
    
    const params = new Set<string>();
    
    let match;
    while ((match = paramRegex.exec(content)) !== null) {
      params.add(match[1]);
    }
    
    while ((match = forLoopRegex.exec(content)) !== null) {
      params.add(match[2]);
    }
    
    while ((match = ifRegex.exec(content)) !== null) {
      params.add(match[1]);
    }
    
    return Array.from(params);
  };

  // 处理模板选择
  const handleTemplateSelect = (templateId: string) => {
    const template = configs.find(c => c.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      form.resetFields();
      setPreviewContent('');
    }
  };

  // 处理参数变化，生成预览
  const handleValuesChange = async (changedValues: any, allValues: any) => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      const response = await request.post('/api/config/render-template', {
        template_name: selectedTemplate.name,
        variables: allValues
      });
      setPreviewContent(response.data.content);
    } catch (error: any) {
      message.error('生成预览失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 处理配置保存
  const handleSave = async () => {
    if (!selectedTemplate || !previewContent) {
      message.warning('请先生成配置');
      return;
    }

    try {
      const values = await form.validateFields();
      const configData = {
        name: `${selectedTemplate.name}_${new Date().getTime()}`,
        content: previewContent,
        type: 'config',
        device_type: selectedTemplate.device_type,
        status: 'draft',
        description: `由模板 ${selectedTemplate.name} 生成的配置`
      };

      await request.post('/api/config/files', configData);
      message.success('配置已保存');
      form.resetFields();
      setPreviewContent('');
    } catch (error: any) {
      message.error('保存失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className={styles.configGenerator}>
      <Card className={styles.mainCard}>
        <div className={styles.header}>
          <Title level={4}>配置生成器</Title>
        </div>
        <Spin spinning={loading}>
          <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 280px)' }}>
            {/* 左侧模板列表 */}
            <Card 
              title="Jinja2模板列表" 
              style={{ width: 320, height: '100%', overflow: 'auto' }}
              extra={
                <Button 
                  type="link" 
                  size="small"
                  onClick={fetchTemplates}
                >
                  刷新
                </Button>
              }
            >
              <Select
                style={{ width: '100%' }}
                placeholder="搜索模板..."
                onChange={handleTemplateSelect}
                value={selectedTemplate?.id}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.children ? (option.children as unknown as string).toLowerCase().includes(input.toLowerCase()) : false
                }
              >
                {configs.map(template => (
                  <Option key={template.id} value={template.id}>
                    {template.name}
                  </Option>
                ))}
              </Select>
              {selectedTemplate && (
                <div style={{ marginTop: 16 }}>
                  <p><strong>设备类型：</strong> {selectedTemplate.device_type}</p>
                  <p><strong>更新时间：</strong> {new Date(selectedTemplate.updated_at).toLocaleString()}</p>
                  <p><strong>创建者：</strong> {selectedTemplate.created_by}</p>
                  <p><strong>状态：</strong> {selectedTemplate.status === 'published' ? '已发布' : '草稿'}</p>
                </div>
              )}
            </Card>

            {/* 中间模板内容和参数配置 */}
            <Card 
              title="模板内容和参数配置" 
              style={{ flex: 1.2, height: '100%', overflow: 'auto' }}
              bodyStyle={{ padding: '16px', height: 'calc(100% - 57px)', display: 'flex', flexDirection: 'column' }}
            >
              {selectedTemplate ? (
                <>
                  <div style={{ flex: 1, marginBottom: 16, minHeight: '300px' }}>
                    <MonacoEditor
                      height="100%"
                      language="jinja"
                      theme="vs-light"
                      value={selectedTemplate.content}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        fontSize: 14,
                        fontFamily: "'Fira Code', Consolas, 'Courier New', monospace"
                      }}
                    />
                  </div>
                  <Card
                    title="参数配置"
                    type="inner"
                    bordered={false}
                    style={{ background: '#fafafa', borderRadius: '8px' }}
                  >
                    <Form
                      form={form}
                      layout="vertical"
                      onValuesChange={handleValuesChange}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                        {extractParameters(selectedTemplate.content).map(param => (
                          <Form.Item
                            key={param}
                            label={param}
                            name={param}
                            rules={[{ required: true, message: `请输入${param}` }]}
                          >
                            <Input placeholder={`请输入${param}`} />
                          </Form.Item>
                        ))}
                      </div>
                      <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
                        <Button
                          type="primary"
                          onClick={handleSave}
                          disabled={!previewContent}
                          icon={<span className="anticon">💾</span>}
                        >
                          保存配置
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>
                </>
              ) : (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  color: '#8c8c8c'
                }}>
                  <span style={{ fontSize: 48, marginBottom: 16 }}>📋</span>
                  <p>请先选择一个模板</p>
                </div>
              )}
            </Card>

            {/* 右侧预览 */}
            <Card 
              title="配置预览" 
              style={{ flex: 1, height: '100%', overflow: 'auto' }}
              bodyStyle={{ padding: '16px', height: 'calc(100% - 57px)' }}
            >
              {previewContent ? (
                <MonacoEditor
                  height="100%"
                  language="plaintext"
                  theme="vs-light"
                  value={previewContent}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    fontSize: 14,
                    fontFamily: "'Fira Code', Consolas, 'Courier New', monospace"
                  }}
                />
              ) : (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  color: '#8c8c8c'
                }}>
                  <span style={{ fontSize: 48, marginBottom: 16 }}>👀</span>
                  <p>配置预览将在这里显示</p>
                </div>
              )}
            </Card>
          </div>
        </Spin>
      </Card>
    </div>
  );
};

export default ConfigGeneratorPage; 