import React from 'react';
import { PDFlowDesigner } from '../../components/process-designer/pd-flow-designer';
import '../../components/process-designer/styles/pd-flow-designer.css';

const VisualDesigner: React.FC = () => {
  return (
    <div className="visual-designer" style={{ height: '100%', width: '100%' }}>
      <div style={{ height: 'calc(100vh - 64px)' }}>
        <PDFlowDesigner />
      </div>
    </div>
  );
};

export default VisualDesigner; 