import React from 'react';
import { Handle, Position } from 'reactflow';
import { PDBaseNode } from './pd-base-node';
import { PDNodeType } from '../../../types/process-designer/pd-types';

export const PDConditionNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="pd-condition-node">
      <PDBaseNode
        data={{
          ...data,
          type: PDNodeType.CONDITION,
        }}
        className="pd-condition-content"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="pd-handle pd-handle-right"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="false"
        className="pd-handle pd-handle-left"
      />
    </div>
  );
}; 