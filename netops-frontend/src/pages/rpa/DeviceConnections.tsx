import React from 'react';
import { Card, Typography, Empty } from 'antd';

const { Title } = Typography;

const DeviceConnections: React.FC = () => {
  return (
    <div className="device-connections">
      <Card>
        <Title level={4}>设备连接组件</Title>
        <Empty description="设备连接组件暂无内容" />
      </Card>
    </div>
  );
};

export default DeviceConnections; 