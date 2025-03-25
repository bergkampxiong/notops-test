import React from 'react';
import { PDCustomNode } from '../../../types/process-designer/pd-types';

interface PDNodeConfigPanelProps {
  node: PDCustomNode;
  onChange: (node: PDCustomNode) => void;
}

export const PDNodeConfigPanel: React.FC<PDNodeConfigPanelProps> = ({
  node,
  onChange,
}) => {
  const handleChange = (field: string, value: any) => {
    onChange({
      ...node,
      data: {
        ...node.data,
        [field]: value,
      },
    });
  };

  return (
    <div className="pd-node-config-panel">
      <h3>节点配置</h3>
      
      {/* 基本信息 */}
      <div className="pd-config-section">
        <h4>基本信息</h4>
        <div className="pd-form-group">
          <label>名称</label>
          <input
            type="text"
            value={node.data.label}
            onChange={(e) => handleChange('label', e.target.value)}
          />
        </div>
        <div className="pd-form-group">
          <label>描述</label>
          <textarea
            value={node.data.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </div>
      </div>

      {/* 参数配置 */}
      <div className="pd-config-section">
        <h4>参数配置</h4>
        {Object.entries(node.data.config.parameters || {}).map(([key, value]) => (
          <div key={key} className="pd-form-group">
            <label>{key}</label>
            <input
              type="text"
              value={value as string}
              onChange={(e) =>
                handleChange('config', {
                  ...node.data.config,
                  parameters: {
                    ...node.data.config.parameters,
                    [key]: e.target.value,
                  },
                })
              }
            />
          </div>
        ))}
      </div>

      {/* 错误处理 */}
      <div className="pd-config-section">
        <h4>错误处理</h4>
        <div className="pd-form-group">
          <label>重试次数</label>
          <input
            type="number"
            value={node.data.config.errorHandling?.retryCount || 0}
            onChange={(e) =>
              handleChange('config', {
                ...node.data.config,
                errorHandling: {
                  ...node.data.config.errorHandling,
                  retryCount: parseInt(e.target.value),
                },
              })
            }
          />
        </div>
        <div className="pd-form-group">
          <label>重试间隔(秒)</label>
          <input
            type="number"
            value={node.data.config.errorHandling?.retryInterval || 0}
            onChange={(e) =>
              handleChange('config', {
                ...node.data.config,
                errorHandling: {
                  ...node.data.config.errorHandling,
                  retryInterval: parseInt(e.target.value),
                },
              })
            }
          />
        </div>
      </div>

      {/* 超时设置 */}
      <div className="pd-config-section">
        <h4>超时设置</h4>
        <div className="pd-form-group">
          <label>超时时间(秒)</label>
          <input
            type="number"
            value={node.data.config.timeout || 0}
            onChange={(e) =>
              handleChange('config', {
                ...node.data.config,
                timeout: parseInt(e.target.value),
              })
            }
          />
        </div>
      </div>
    </div>
  );
}; 