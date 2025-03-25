import React from 'react';
import { Card, Typography } from 'antd';
import { PDFlowDesigner } from '../../components/process-designer/pd-flow-designer';
import '../../components/process-designer/styles/pd-flow-designer.css';

const { Title } = Typography;

const VisualDesigner: React.FC = () => {
  return (
    <div className="visual-designer">
      <Card>
        <Title level={4}>可视化流程设计器</Title>
        <div style={{ height: 'calc(100vh - 180px)' }}>
          <PDFlowDesigner />
        </div>
      </Card>
    </div>
  );
};

export default VisualDesigner; 