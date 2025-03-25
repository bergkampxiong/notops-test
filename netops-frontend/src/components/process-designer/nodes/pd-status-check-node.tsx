import React from 'react';
import { Handle, Position } from 'reactflow';
import { PDBaseNode } from './pd-base-node';
import { PDNodeType } from '../../../types/process-designer/pd-types';

export const PDStatusCheckNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="pd-status-check-node">
      <PDBaseNode
        data={{
          ...data,
          type: PDNodeType.STATUS_CHECK,
        }}
        className="pd-status-check-content"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="success"
        className="pd-handle pd-handle-right"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="failure"
        className="pd-handle pd-handle-left"
      />
    </div>
  );
}; 