import React from 'react';
import { Handle, Position } from 'reactflow';
import { PDCustomNode } from '../../../types/process-designer/pd-types';

interface PDBaseNodeProps {
  data: PDCustomNode['data'];
  isConnectable?: boolean;
  hasInput?: boolean;
  hasOutput?: boolean;
  className?: string;
}

export const PDBaseNode: React.FC<PDBaseNodeProps> = ({
  data,
  isConnectable = true,
  hasInput = true,
  hasOutput = true,
  className = '',
}) => {
  return (
    <div className={`pd-node ${className}`}>
      {isConnectable && hasInput && (
        <Handle
          type="target"
          position={Position.Top}
          className="pd-handle pd-handle-top"
        />
      )}
      
      <div className="pd-node-content">
        <div className="pd-node-header">
          <span className="pd-node-type">{data.type}</span>
          <span className="pd-node-label">{data.label}</span>
        </div>
        {data.description && (
          <div className="pd-node-description">{data.description}</div>
        )}
      </div>

      {isConnectable && hasOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="pd-handle pd-handle-bottom"
        />
      )}
    </div>
  );
}; 