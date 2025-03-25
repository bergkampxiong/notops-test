import React from 'react';
import { PDBaseNode } from './pd-base-node';
import { PDNodeType } from '../../../types/process-designer/pd-types';

export const PDCommandExecuteNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <PDBaseNode
      data={{
        ...data,
        type: PDNodeType.COMMAND_EXECUTE,
      }}
      className="pd-command-execute-node"
    />
  );
}; 