import React from 'react';
import { ApiOutlined } from '@ant-design/icons';
import { PDBaseNode } from './pd-base-node';
import { PDNodeData } from '../../../types/process-designer/pd-types';

interface PDDeviceConnectNodeProps {
  data: PDNodeData;
}

export const PDDeviceConnectNode: React.FC<PDDeviceConnectNodeProps> = ({ data }) => {
  return (
    <PDBaseNode
      data={data}
      type="设备连接节点"
      className="pd-device-connect-node"
      icon={<ApiOutlined style={{ fontSize: 16, color: '#13c2c2' }} />}
    />
  );
}; 