import React from 'react';
import { Card, Typography, Empty } from 'antd';

const { Title } = Typography;

const VisualDesigner: React.FC = () => {
  return (
    <div className="visual-designer">
      <Card>
        <Title level={4}>可视化流程设计器</Title>
        <Empty description="可视化流程设计器暂无内容" />
      </Card>
    </div>
  );
};

export default VisualDesigner; 