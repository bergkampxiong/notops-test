import React from 'react';
import { Card, Typography, Empty } from 'antd';

const { Title } = Typography;

const ConfigManagement: React.FC = () => {
  return (
    <div className="config-management">
      <Card>
        <Title level={4}>配置管理组件</Title>
        <Empty description="配置管理组件暂无内容" />
      </Card>
    </div>
  );
};

export default ConfigManagement; 