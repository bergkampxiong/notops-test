import React from 'react';
import { PDBaseNode } from './pd-base-node';
import { PDNodeType } from '../../../types/process-designer/pd-types';

export const PDTaskNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <PDBaseNode
      data={{
        ...data,
        type: PDNodeType.TASK,
      }}
      className="pd-task-node"
    />
  );
}; 