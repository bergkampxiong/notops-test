import React from 'react';
import { PDToolbarConfig } from '../../../types/process-designer/pd-types';

interface PDToolbarProps extends PDToolbarConfig {}

export const PDToolbar: React.FC<PDToolbarProps> = ({
  onUndo,
  onRedo,
  onSave,
  onValidate,
  onExecute,
  canUndo,
  canRedo,
}) => {
  return (
    <div className="pd-toolbar">
      <div className="pd-toolbar-group">
        <button
          className="pd-toolbar-button"
          onClick={onUndo}
          disabled={!canUndo}
        >
          撤销
        </button>
        <button
          className="pd-toolbar-button"
          onClick={onRedo}
          disabled={!canRedo}
        >
          重做
        </button>
      </div>

      <div className="pd-toolbar-group">
        <button className="pd-toolbar-button" onClick={onSave}>
          保存
        </button>
        <button className="pd-toolbar-button" onClick={onValidate}>
          验证
        </button>
        <button className="pd-toolbar-button" onClick={onExecute}>
          执行
        </button>
      </div>
    </div>
  );
}; 