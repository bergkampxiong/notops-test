import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import SSHConfigModal from './SSHConfigModal';
import { getSSHConfigs, deleteSSHConfig, SSHConfig } from '../../../../services/sshConfig';

const DeviceConnections: React.FC = () => {
  const [sshConfigs, setSSHConfigs] = useState<SSHConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SSHConfig | undefined>();

  const fetchSSHConfigs = async () => {
    setLoading(true);
    try {
      const data = await getSSHConfigs();
      setSSHConfigs(data);
    } catch (error) {
      message.error('获取SSH配置列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSSHConfigs();
  }, []);

  const handleAdd = () => {
    setEditingConfig(undefined);
    setModalVisible(true);
  };

  const handleEdit = (record: SSHConfig) => {
    setEditingConfig(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSSHConfig(id);
      message.success('删除SSH配置成功');
      fetchSSHConfigs();
    } catch (error) {
      message.error('删除SSH配置失败');
    }
  };

  const columns = [
    {
      title: 'SSH连接名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
    },
    {
      title: '超时时间(秒)',
      dataIndex: 'timeout',
      key: 'timeout',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SSHConfig) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个SSH配置吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="SSH连接配置"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          新增SSH配置
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={sshConfigs}
        rowKey="id"
        loading={loading}
      />

      <SSHConfigModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false);
          fetchSSHConfigs();
        }}
        initialValues={editingConfig}
      />
    </Card>
  );
};

export default DeviceConnections; 