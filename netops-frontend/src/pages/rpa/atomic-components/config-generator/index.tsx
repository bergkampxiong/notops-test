import React, { useState, useEffect } from 'react';
import { Card, Typography, message } from 'antd';
import request from '../../../../utils/request';
import ConfigGenerator from '../config-management/components/ConfigGenerator';
import styles from './index.module.less';

const { Title } = Typography;

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
  const [configs, setConfigs] = useState<ConfigFile[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载模板列表
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await request.get('/api/config/files');
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

  // 处理配置保存
  const handleSave = async (values: any) => {
    try {
      const configData = {
        ...values,
        type: 'config',
        device_type: values.device_type || 'cisco_ios',
        status: 'draft'
      };

      const response = await request.post('/api/config/files', configData);
      message.success('配置已保存');
      return response.data;
    } catch (error: any) {
      message.error('保存失败: ' + (error.response?.data?.detail || error.message));
      throw error;
    }
  };

  return (
    <div className={styles.configGenerator}>
      <Card className={styles.mainCard}>
        <div className={styles.header}>
          <Title level={4}>配置生成</Title>
        </div>
        <ConfigGenerator
          templates={configs.filter(c => c.type === 'jinja2' || c.type === 'textfsm')}
          onSave={handleSave}
        />
      </Card>
    </div>
  );
};

export default ConfigGeneratorPage; 