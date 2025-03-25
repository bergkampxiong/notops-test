import React from 'react';
import { PDBaseNode } from './pd-base-node';
import { PDNodeType } from '../../../types/process-designer/pd-types';

export const PDEndNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <PDBaseNode
      data={{
        ...data,
        type: PDNodeType.END,
      }}
      hasOutput={false}
      className="pd-end-node"
    />
  );
}; 