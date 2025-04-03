import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Form, Input, Button, 
  DatePicker, Select, Space, Tag, Row, Col 
} from 'antd';
import { 
  SearchOutlined, ReloadOutlined, 
  CheckCircleOutlined, CloseCircleOutlined 
} from '@ant-design/icons';
import moment from 'moment';
import api from '../../services/auth';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface AuditLog {
  id: number;
  timestamp: string;
  user_id: number | null;
  username: string | null;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  details: string | null;
  success: boolean;
}

interface SearchParams {
  username?: string;
  event_type?: string;
  start_date?: string;
  end_date?: string;
  success?: boolean;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [form] = Form.useForm();

  // 获取审计日志
  const fetchLogs = async (params: SearchParams = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/audit/logs', { params });
      setLogs(response.data);
    } catch (error) {
      console.error('获取审计日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取事件类型列表
  const fetchEventTypes = async () => {
    try {
      const response = await api.get('/audit/event-types');
      setEventTypes(response.data);
    } catch (error) {
      console.error('获取事件类型列表失败:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchEventTypes();
  }, []);

  // 处理搜索
  const handleSearch = (values: any) => {
    const params: SearchParams = {};
    
    if (values.username) {
      params.username = values.username;
    }
    
    if (values.event_type) {
      params.event_type = values.event_type;
    }
    
    if (values.success !== undefined) {
      params.success = values.success;
    }
    
    if (values.date_range && values.date_range.length === 2) {
      params.start_date = values.date_range[0].format('YYYY-MM-DDTHH:mm:ss');
      params.end_date = values.date_range[1].format('YYYY-MM-DDTHH:mm:ss');
    }
    
    setSearchParams(params);
    fetchLogs(params);
  };

  // 重置搜索
  const handleReset = () => {
    form.resetFields();
    setSearchParams({});
    fetchLogs();
  };

  // 表格列定义
  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text: string) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => text || '-',
    },
    {
      title: '事件类型',
      dataIndex: 'event_type',
      key: 'event_type',
      render: (text: string) => {
        let color = 'blue';
        if (text.includes('login')) color = 'green';
        if (text.includes('logout')) color = 'orange';
        if (text.includes('failed')) color = 'red';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'success',
      key: 'success',
      render: (success: boolean) => (
        <Tag color={success ? 'green' : 'red'} icon={success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {success ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      render: (text: string) => {
        if (!text) return '-';
        try {
          const details = JSON.parse(text);
          return (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {Object.entries(details).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {String(value)}
                </li>
              ))}
            </ul>
          );
        } catch (e) {
          return text;
        }
      },
    },
  ];

  return (
    <div className="audit-logs">
      <div className="page-header">
        <h2>审计日志</h2>
      </div>
      
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSearch}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="username" label="用户名">
                <Input placeholder="输入用户名" />
              </Form.Item>
            </Col>
            
            <Col span={6}>
              <Form.Item name="event_type" label="事件类型">
                <Select placeholder="选择事件类型" allowClear>
                  {eventTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={6}>
              <Form.Item name="success" label="状态">
                <Select placeholder="选择状态" allowClear>
                  <Option value={true}>成功</Option>
                  <Option value={false}>失败</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={6}>
              <Form.Item name="date_range" label="时间范围">
                <RangePicker showTime />
              </Form.Item>
            </Col>
          </Row>
          
          <Row>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  搜索
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
      
      <Table 
        columns={columns} 
        dataSource={logs} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default AuditLogs; 