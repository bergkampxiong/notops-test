import React, { useState } from 'react';
import { Card, Table, Button, Space, Tag, Typography, Modal, Form, Input, Select, Tabs, Timeline, message, Drawer } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// 模拟数据
const initialTasks = [
  {
    key: '1',
    name: '网络设备配置备份',
    type: '定时任务',
    target: '所有路由器和交换机',
    schedule: '每天 00:00',
    status: '已启用',
    lastRun: '2025-03-09 00:00:12',
    result: '成功',
  },
  {
    key: '2',
    name: '带宽使用率监控',
    type: '定时任务',
    target: '核心交换机',
    schedule: '每小时',
    status: '已启用',
    lastRun: '2025-03-09 20:00:05',
    result: '成功',
  },
  {
    key: '3',
    name: '防火墙规则更新',
    type: '手动任务',
    target: 'Firewall-Main',
    schedule: '手动触发',
    status: '已禁用',
    lastRun: '2025-03-08 15:30:22',
    result: '失败',
  },
  {
    key: '4',
    name: '网络设备固件升级',
    type: '手动任务',
    target: '所有交换机',
    schedule: '手动触发',
    status: '已启用',
    lastRun: '2025-03-07 10:15:45',
    result: '成功',
  },
];

// 模拟执行历史
const executionHistory = [
  {
    key: '1',
    taskName: '网络设备配置备份',
    startTime: '2025-03-09 00:00:12',
    endTime: '2025-03-09 00:05:30',
    status: '成功',
    details: [
      { time: '00:00:12', message: '开始执行任务' },
      { time: '00:00:15', message: '连接设备 Core-Router-01' },
      { time: '00:01:20', message: '备份 Core-Router-01 配置完成' },
      { time: '00:01:25', message: '连接设备 Switch-Floor3-01' },
      { time: '00:02:30', message: '备份 Switch-Floor3-01 配置完成' },
      { time: '00:02:35', message: '连接设备 Firewall-Main' },
      { time: '00:03:40', message: '备份 Firewall-Main 配置完成' },
      { time: '00:05:30', message: '任务执行完成，所有设备配置已备份' },
    ]
  },
  {
    key: '2',
    taskName: '带宽使用率监控',
    startTime: '2025-03-09 20:00:05',
    endTime: '2025-03-09 20:01:15',
    status: '成功',
    details: [
      { time: '20:00:05', message: '开始执行任务' },
      { time: '20:00:10', message: '连接核心交换机' },
      { time: '20:00:30', message: '获取端口统计信息' },
      { time: '20:01:00', message: '分析带宽使用情况' },
      { time: '20:01:15', message: '任务执行完成，带宽使用正常' },
    ]
  },
  {
    key: '3',
    taskName: '防火墙规则更新',
    startTime: '2025-03-08 15:30:22',
    endTime: '2025-03-08 15:31:45',
    status: '失败',
    details: [
      { time: '15:30:22', message: '开始执行任务' },
      { time: '15:30:25', message: '连接设备 Firewall-Main' },
      { time: '15:30:40', message: '获取当前规则配置' },
      { time: '15:31:10', message: '应用新规则' },
      { time: '15:31:45', message: '错误: 规则验证失败，回滚更改' },
    ]
  },
];

const RPA: React.FC = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      const newKey = (parseInt(tasks[tasks.length - 1]?.key || '0') + 1).toString();
      const newTask = {
        key: newKey,
        ...values,
        lastRun: '-',
        result: '-',
      };
      setTasks([...tasks, newTask]);
      setIsModalVisible(false);
    });
  };

  const toggleTaskStatus = (key: string) => {
    const newTasks = tasks.map(task => {
      if (task.key === key) {
        const newStatus = task.status === '已启用' ? '已禁用' : '已启用';
        return { ...task, status: newStatus };
      }
      return task;
    });
    setTasks(newTasks);
  };

  const runTask = (key: string) => {
    Modal.confirm({
      title: '确认执行',
      content: '确定要立即执行此任务吗？',
      onOk: () => {
        // 实际项目中这里应该调用API执行任务
        message.success('任务已提交执行');
      },
    });
  };

  const viewHistory = (record: any) => {
    // 在实际项目中，这里应该根据任务ID获取执行历史
    const history = executionHistory.find(h => h.taskName === record.name);
    setSelectedHistory(history);
    setHistoryModalVisible(true);
  };

  const handleSearch = () => {
    // Implementation of search functionality
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => {
        const color = text === '定时任务' ? 'blue' : 'green';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '目标设备',
      dataIndex: 'target',
      key: 'target',
    },
    {
      title: '执行计划',
      dataIndex: 'schedule',
      key: 'schedule',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => {
        const color = text === '已启用' ? 'green' : 'red';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '上次执行',
      dataIndex: 'lastRun',
      key: 'lastRun',
    },
    {
      title: '执行结果',
      dataIndex: 'result',
      key: 'result',
      render: (text: string) => {
        if (text === '-') return '-';
        const color = text === '成功' ? 'green' : 'red';
        const icon = text === '成功' ? <CheckCircleOutlined /> : <CloseCircleOutlined />;
        return <Tag icon={icon} color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />} 
            size="small"
            onClick={() => runTask(record.key)}
          >
            执行
          </Button>
          <Button 
            type={record.status === '已启用' ? 'default' : 'primary'} 
            icon={record.status === '已启用' ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
            size="small"
            onClick={() => toggleTaskStatus(record.key)}
          >
            {record.status === '已启用' ? '禁用' : '启用'}
          </Button>
          <Button 
            type="default" 
            icon={<ClockCircleOutlined />} 
            size="small"
            onClick={() => viewHistory(record)}
          >
            历史
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Title level={2}>自动化RPA - 机器人流程自动化</Title>
      
      <div className="section-container">
        <Card className="card-container">
          <Space style={{ marginBottom: 16 }}>
            <Input
              placeholder="搜索任务名称"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              placeholder="任务状态"
              style={{ width: 120 }}
              value={statusFilter}
              onChange={value => setStatusFilter(value)}
              allowClear
            >
              <Option value="已完成">已完成</Option>
              <Option value="运行中">运行中</Option>
              <Option value="等待中">等待中</Option>
              <Option value="失败">失败</Option>
            </Select>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
              创建任务
            </Button>
          </Space>
          
          <Table 
            className="custom-table"
            columns={columns} 
            dataSource={tasks} 
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
      
      <Tabs defaultActiveKey="1">
        <TabPane tab="自动化任务" key="1">
          <Card style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
              创建任务
            </Button>
          </Card>
          
          <Card>
            <Table 
              columns={columns} 
              dataSource={tasks} 
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>
        
        <TabPane tab="执行历史" key="2">
          <Card>
            <Table 
              columns={[
                { title: '任务名称', dataIndex: 'taskName', key: 'taskName' },
                { title: '开始时间', dataIndex: 'startTime', key: 'startTime' },
                { title: '结束时间', dataIndex: 'endTime', key: 'endTime' },
                { 
                  title: '状态', 
                  dataIndex: 'status', 
                  key: 'status',
                  render: (text: string) => {
                    const color = text === '成功' ? 'green' : 'red';
                    const icon = text === '成功' ? <CheckCircleOutlined /> : <CloseCircleOutlined />;
                    return <Tag icon={icon} color={color}>{text}</Tag>;
                  },
                },
                {
                  title: '操作',
                  key: 'action',
                  render: (_: any, record: any) => (
                    <Button 
                      type="link" 
                      onClick={() => {
                        setSelectedHistory(record);
                        setHistoryModalVisible(true);
                      }}
                    >
                      查看详情
                    </Button>
                  ),
                },
              ]} 
              dataSource={executionHistory} 
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Drawer
        title="任务详情"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        visible={drawerVisible}
        width={600}
      >
        {selectedTask && (
          <div>
            <p><strong>任务名称:</strong> {selectedTask.name}</p>
            <p><strong>类型:</strong> {selectedTask.type}</p>
            <p><strong>目标设备:</strong> {selectedTask.target}</p>
            <p><strong>执行计划:</strong> {selectedTask.schedule}</p>
            <p><strong>状态:</strong> {selectedTask.status}</p>
            <p><strong>上次执行:</strong> {selectedTask.lastRun}</p>
            <p><strong>执行结果:</strong> {selectedTask.result}</p>
          </div>
        )}
      </Drawer>

      <Modal
        title="创建自动化任务"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="type"
            label="任务类型"
            rules={[{ required: true, message: '请选择任务类型' }]}
          >
            <Select>
              <Option value="定时任务">定时任务</Option>
              <Option value="手动任务">手动任务</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="target"
            label="目标设备"
            rules={[{ required: true, message: '请输入目标设备' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="schedule"
            label="执行计划"
            rules={[{ required: true, message: '请输入执行计划' }]}
          >
            <Input placeholder="例如：每天 00:00 或 手动触发" />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            initialValue="已启用"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value="已启用">已启用</Option>
              <Option value="已禁用">已禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="执行历史详情"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedHistory && (
          <div>
            <p><strong>任务名称:</strong> {selectedHistory.taskName}</p>
            <p><strong>开始时间:</strong> {selectedHistory.startTime}</p>
            <p><strong>结束时间:</strong> {selectedHistory.endTime}</p>
            <p>
              <strong>状态:</strong> 
              <Tag 
                icon={selectedHistory.status === '成功' ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 
                color={selectedHistory.status === '成功' ? 'green' : 'red'}
              >
                {selectedHistory.status}
              </Tag>
            </p>
            <div style={{ marginTop: 20 }}>
              <h4>执行详情:</h4>
              <Timeline>
                {selectedHistory.details.map((detail: any, index: number) => (
                  <Timeline.Item key={index} color={index === selectedHistory.details.length - 1 ? (selectedHistory.status === '成功' ? 'green' : 'red') : 'blue'}>
                    <p><strong>{detail.time}</strong> - {detail.message}</p>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RPA; 