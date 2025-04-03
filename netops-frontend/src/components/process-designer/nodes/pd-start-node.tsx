import React from 'react';
import { Handle, Position } from 'reactflow';

interface NodeData {
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const PDStartNode: React.FC<{ data: NodeData }> = ({ data }) => {
  return (
    <>
      <Handle type="source" position={Position.Right} />
      <div className="node-content">
        {data.icon}
        <div className="node-info">
          <div className="node-title">{data.label}</div>
          <div className="node-desc">{data.description}</div>
        </div>
      </div>
    </>
  );
}; 