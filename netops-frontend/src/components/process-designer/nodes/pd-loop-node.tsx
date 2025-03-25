import React from 'react';
import { Handle, Position } from 'reactflow';
import { PDBaseNode } from './pd-base-node';
import { PDNodeType } from '../../../types/process-designer/pd-types';

export const PDLoopNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="pd-loop-node">
      <PDBaseNode
        data={{
          ...data,
          type: PDNodeType.LOOP,
        }}
        className="pd-loop-content"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="loop"
        className="pd-handle pd-handle-right"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="break"
        className="pd-handle pd-handle-bottom"
      />
    </div>
  );
}; 