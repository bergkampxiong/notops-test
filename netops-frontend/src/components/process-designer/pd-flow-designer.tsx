import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { PDToolbar } from './toolbar/pd-toolbar';
import { PDNodeConfigPanel } from './panels/pd-node-config-panel';
import { PDCustomNode, PDNodeType } from '../../types/process-designer/pd-types';

// 导入所有节点组件
import { PDStartNode } from './nodes/pd-start-node';
import { PDEndNode } from './nodes/pd-end-node';
import { PDTaskNode } from './nodes/pd-task-node';
import { PDConditionNode } from './nodes/pd-condition-node';
import { PDLoopNode } from './nodes/pd-loop-node';
import { PDDeviceConnectNode } from './nodes/pd-device-connect-node';
import { PDConfigDeployNode } from './nodes/pd-config-deploy-node';
import { PDCommandExecuteNode } from './nodes/pd-command-execute-node';
import { PDConfigBackupNode } from './nodes/pd-config-backup-node';
import { PDStatusCheckNode } from './nodes/pd-status-check-node';

// 节点类型映射
const nodeTypes = {
  pd_start: PDStartNode,
  pd_end: PDEndNode,
  pd_task: PDTaskNode,
  pd_condition: PDConditionNode,
  pd_loop: PDLoopNode,
  pd_device_connect: PDDeviceConnectNode,
  pd_config_deploy: PDConfigDeployNode,
  pd_command_execute: PDCommandExecuteNode,
  pd_config_backup: PDConfigBackupNode,
  pd_status_check: PDStatusCheckNode,
};

// 初始节点
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'pd_start',
    position: { x: 250, y: 50 },
    data: {
      label: '开始',
      type: PDNodeType.START,
      config: {},
    },
  },
  {
    id: '2',
    type: 'pd_device_connect',
    position: { x: 250, y: 150 },
    data: {
      label: '连接设备',
      type: PDNodeType.DEVICE_CONNECT,
      description: '连接网络设备',
      config: {
        parameters: {
          device_ip: '192.168.1.1',
          username: 'admin',
          password: 'password',
        },
        errorHandling: {
          retryCount: 3,
          retryInterval: 5,
        },
        timeout: 30,
      },
    },
  },
  {
    id: '3',
    type: 'pd_command_execute',
    position: { x: 250, y: 250 },
    data: {
      label: '执行命令',
      type: PDNodeType.COMMAND_EXECUTE,
      description: '执行show version命令',
      config: {
        parameters: {
          command: 'show version',
        },
        timeout: 10,
      },
    },
  },
  {
    id: '4',
    type: 'pd_config_backup',
    position: { x: 250, y: 350 },
    data: {
      label: '备份配置',
      type: PDNodeType.CONFIG_BACKUP,
      config: {
        parameters: {
          backup_path: '/backups/',
          filename: 'config_{device}_{date}.txt',
        },
        timeout: 20,
      },
    },
  },
  {
    id: '5',
    type: 'pd_end',
    position: { x: 250, y: 450 },
    data: {
      label: '结束',
      type: PDNodeType.END,
      config: {},
    },
  },
];

// 初始连接
const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
  },
  {
    id: 'e4-5',
    source: '4',
    target: '5',
  },
];

export const PDFlowDesigner: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<PDCustomNode | null>(null);
  const [history, setHistory] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 初始化节点和连接
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setHistory([{ nodes: initialNodes, edges: initialEdges }]);
    setHistoryIndex(0);
  }, [setNodes, setEdges]);

  // 处理节点变化
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      saveToHistory();
    },
    [onNodesChange]
  );

  // 处理边变化
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      saveToHistory();
    },
    [onEdgesChange]
  );

  // 处理连接
  const handleConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
      saveToHistory();
    },
    [setEdges]
  );

  // 处理节点选择
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as PDCustomNode);
  }, []);

  // 保存历史记录
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes, edges });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, nodes, edges]);

  // 撤销
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setNodes(history[newIndex].nodes);
      setEdges(history[newIndex].edges);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // 重做
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setNodes(history[newIndex].nodes);
      setEdges(history[newIndex].edges);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // 保存流程
  const handleSave = useCallback(() => {
    // TODO: 实现保存逻辑
    console.log('Saving flow:', { nodes, edges });
  }, [nodes, edges]);

  // 验证流程
  const handleValidate = useCallback(() => {
    // TODO: 实现验证逻辑
    console.log('Validating flow:', { nodes, edges });
  }, [nodes, edges]);

  // 执行流程
  const handleExecute = useCallback(() => {
    // TODO: 实现执行逻辑
    console.log('Executing flow:', { nodes, edges });
  }, [nodes, edges]);

  return (
    <div className="pd-flow-designer">
      <PDToolbar
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onValidate={handleValidate}
        onExecute={handleExecute}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />
      
      <div className="pd-flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>

        {selectedNode && (
          <div className="pd-sidebar">
            <PDNodeConfigPanel
              node={selectedNode}
              onChange={(updatedNode) => {
                setNodes((nds) =>
                  nds.map((node) =>
                    node.id === updatedNode.id ? updatedNode : node
                  )
                );
                saveToHistory();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}; 