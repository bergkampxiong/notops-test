import React from 'react';
import { Card, Typography, Tabs } from 'antd';
import { Outlet } from 'react-router-dom';

const { Title } = Typography;
const { TabPane } = Tabs;

const ProcessOrchestration: React.FC = () => {
  return (
    <div className="process-orchestration">
      <Card>
        <Title level={3}>流程编排引擎</Title>
        <div className="orchestration-content">
          <Outlet />
        </div>
      </Card>
    </div>
  );
};

export default ProcessOrchestration; 