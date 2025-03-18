import React from 'react';
import { Card, Typography, Tabs, Empty } from 'antd';
import { Outlet } from 'react-router-dom';

const { Title } = Typography;
const { TabPane } = Tabs;

const AtomicComponents: React.FC = () => {
  return (
    <div className="atomic-components">
      <Card>
        <Title level={3}>原子功能组件库</Title>
        <div className="component-content">
          <Outlet />
        </div>
      </Card>
    </div>
  );
};

export default AtomicComponents; 