import React from 'react';
import { PDBaseNode } from './pd-base-node';
import { PDNodeType } from '../../../types/process-designer/pd-types';

export const PDConfigBackupNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <PDBaseNode
      data={{
        ...data,
        type: PDNodeType.CONFIG_BACKUP,
      }}
      className="pd-config-backup-node"
    />
  );
}; 