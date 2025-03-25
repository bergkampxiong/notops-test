import React from 'react';
import { PDBaseNode } from './pd-base-node';
import { PDNodeType } from '../../../types/process-designer/pd-types';

export const PDDeviceConnectNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <PDBaseNode
      data={{
        ...data,
        type: PDNodeType.DEVICE_CONNECT,
      }}
      className="pd-device-connect-node"
    />
  );
}; 