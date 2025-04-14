import React from 'react';
import { Card, Button, Typography, Space, Divider } from 'antd';
import { CloseOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { Node, Edge } from 'reactflow';
import { PDCustomNode } from '../../../types/process-designer/pd-types';

const { Text, Paragraph, Title } = Typography;

// 定义 Netmiko 设备参数接口
interface NetmikoDeviceParams {
  device_type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  secret?: string;
  global_delay_factor?: number;
  auth_timeout?: number;
  banner_timeout?: number;
  fast_cli?: boolean;
  session_timeout?: number;
  conn_timeout?: number;
  keepalive?: number;
  verbose?: boolean;
  [key: string]: any; // 允许添加其他参数
}

interface PDNetmikoPreviewPanelProps {
  nodes: Node[];
  edges: Edge[];
  onClose: () => void;
}

export const PDNetmikoPreviewPanel: React.FC<PDNetmikoPreviewPanelProps> = ({
  nodes,
  edges,
  onClose,
}) => {
  // 生成 Netmiko 代码
  const generateNetmikoCode = () => {
    // 获取设备连接节点
    const deviceConnectNodes = nodes.filter(node => node.type === 'deviceConnect') as PDCustomNode[];
    
    // 获取配置下发节点
    const configDeployNodes = nodes.filter(node => node.type === 'configDeploy') as PDCustomNode[];
    
    // 生成导入语句
    let code = `from netmiko import ConnectHandler
import time
import sys
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 定义设备连接函数
def connect_to_device(device_params):
    try:
        connection = ConnectHandler(**device_params)
        return connection
    except Exception as e:
        logger.error(f"连接设备失败: {e}")
        return None

# 定义配置下发函数
def deploy_config(connection, config_commands):
    try:
        if not connection:
            logger.error("设备未连接，无法下发配置")
            return False
        
        # 进入特权模式
        if connection.check_config_mode():
            connection.exit_config_mode()
        
        # 进入配置模式
        connection.config_mode()
        
        # 下发配置命令
        output = connection.send_config_set(config_commands)
        logger.info(f"配置下发成功: {output}")
        
        # 退出配置模式
        connection.exit_config_mode()
        return True
    except Exception as e:
        logger.error(f"配置下发失败: {e}")
        return False

# 主函数
def main():
    # 设备连接参数
    device_params = {
        'device_type': 'cisco_ios',  # 默认设备类型，将根据SSH配置动态设置
        'host': '',  # 设备IP地址
        'port': 22,  # 默认端口，将根据SSH配置动态设置
        'username': '',  # 用户名，将根据SSH配置动态设置
        'password': '',  # 密码，将根据SSH配置动态设置
        'secret': '',  # 特权模式密码，将根据SSH配置动态设置
        'global_delay_factor': 1,  # 默认延迟因子，将根据SSH配置动态设置
        'timeout': 20,  # 默认超时时间，将根据SSH配置动态设置
        'auth_timeout': 20,  # 默认认证超时时间，将根据SSH配置动态设置
        'banner_timeout': 20,  # 默认banner超时时间，将根据SSH配置动态设置
        'fast_cli': False,  # 默认不使用快速CLI，将根据SSH配置动态设置
        'session_timeout': 60,  # 默认会话超时时间，将根据SSH配置动态设置
        'conn_timeout': 20,  # 默认连接超时时间，将根据SSH配置动态设置
        'keepalive': 10,  # 默认保活时间，将根据SSH配置动态设置
        'verbose': False,  # 默认不显示详细信息，将根据SSH配置动态设置
    }

    # 配置命令
    config_commands = [
        # 配置命令将根据作业模板动态设置
    ]

    # 连接设备
    connection = connect_to_device(device_params)
    if connection:
        # 下发配置
        deploy_config(connection, config_commands)
        # 断开连接
        connection.disconnect()
    else:
        logger.error("无法连接到设备，程序退出")
        sys.exit(1)

if __name__ == "__main__":
    main()
`;

    // 处理设备连接节点
    deviceConnectNodes.forEach((node, index) => {
      const nodeData = node.data as PDCustomNode['data'];
      if (nodeData.config && nodeData.config.parameters) {
        const { sshConfig, targetType, targetIp, targetGroup } = nodeData.config.parameters;
        
        if (sshConfig) {
          // 这里应该从SSH配置中获取详细信息
          // 由于我们没有实际的SSH配置数据，这里使用占位符
          code = code.replace("'device_type': 'cisco_ios'", `'device_type': '${sshConfig.device_type || 'cisco_ios'}'`);
          code = code.replace("'port': 22", `'port': ${sshConfig.port || 22}`);
          code = code.replace("'username': ''", `'username': '${sshConfig.username || ''}'`);
          code = code.replace("'password': ''", `'password': '${sshConfig.password || ''}'`);
          code = code.replace("'secret': ''", `'secret': '${sshConfig.enable_secret || ''}'`);
          
          // 设置其他Netmiko参数
          if (sshConfig.global_delay_factor) {
            code = code.replace("'global_delay_factor': 1", `'global_delay_factor': ${sshConfig.global_delay_factor}`);
          }
          if (sshConfig.auth_timeout) {
            code = code.replace("'auth_timeout': 20", `'auth_timeout': ${sshConfig.auth_timeout}`);
          }
          if (sshConfig.banner_timeout) {
            code = code.replace("'banner_timeout': 20", `'banner_timeout': ${sshConfig.banner_timeout}`);
          }
          if (sshConfig.fast_cli !== undefined) {
            code = code.replace("'fast_cli': False", `'fast_cli': ${sshConfig.fast_cli}`);
          }
          if (sshConfig.session_timeout) {
            code = code.replace("'session_timeout': 60", `'session_timeout': ${sshConfig.session_timeout}`);
          }
          if (sshConfig.conn_timeout) {
            code = code.replace("'conn_timeout': 20", `'conn_timeout': ${sshConfig.conn_timeout}`);
          }
          if (sshConfig.keepalive) {
            code = code.replace("'keepalive': 10", `'keepalive': ${sshConfig.keepalive}`);
          }
          if (sshConfig.verbose !== undefined) {
            code = code.replace("'verbose': False", `'verbose': ${sshConfig.verbose}`);
          }
        }
        
        // 设置目标IP
        if (targetType === 'single' && targetIp) {
          code = code.replace("'host': ''", `'host': '${targetIp}'`);
        } else if (targetType === 'group' && targetGroup) {
          // 如果是设备组，需要修改代码以支持多设备
          code = code.replace("def main():", `def main():
    # 设备组IP列表
    device_ips = ['${targetGroup}']  # 这里应该是从设备组获取的IP列表
    
    # 遍历设备组中的每个设备
    for ip in device_ips:
        logger.info(f"正在处理设备: {ip}")
        device_params['host'] = ip
        
        # 连接设备
        connection = connect_to_device(device_params)
        if connection:
            # 下发配置
            deploy_config(connection, config_commands)
            # 断开连接
            connection.disconnect()
        else:
            logger.error(f"无法连接到设备 {ip}，跳过")
`);
        }
      }
    });
    
    // 处理配置下发节点
    configDeployNodes.forEach((node, index) => {
      const nodeData = node.data as PDCustomNode['data'];
      if (nodeData.config && nodeData.config.parameters) {
        const { template } = nodeData.config.parameters;
        
        if (template) {
          // 这里应该从作业模板中获取配置命令
          // 由于我们没有实际的作业模板数据，这里使用占位符
          code = code.replace("# 配置命令将根据作业模板动态设置", `# 配置命令
config_commands = [
    '${template.content || 'interface GigabitEthernet0/1'}',
    '${template.content || 'description Configured by NetOps'}',
    '${template.content || 'no shutdown'}',
]`);
        }
      }
    });
    
    return code;
  };

  const netmikoCode = generateNetmikoCode();

  // 复制代码到剪贴板
  const copyToClipboard = () => {
    // 检查 navigator.clipboard 是否可用
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(netmikoCode)
        .then(() => {
          alert('代码已复制到剪贴板');
        })
        .catch(err => {
          console.error('复制失败:', err);
          fallbackCopyToClipboard();
        });
    } else {
      // 使用备选方案
      fallbackCopyToClipboard();
    }
  };

  // 备选复制方案
  const fallbackCopyToClipboard = () => {
    try {
      // 创建临时文本区域
      const textArea = document.createElement('textarea');
      textArea.value = netmikoCode;
      
      // 设置样式使其不可见
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      // 选择文本并复制
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      
      // 移除临时元素
      document.body.removeChild(textArea);
      
      if (successful) {
        alert('代码已复制到剪贴板');
      } else {
        alert('复制失败，请手动复制');
      }
    } catch (err) {
      console.error('备选复制方案失败:', err);
      alert('复制失败，请手动复制');
    }
  };

  // 下载代码为文件
  const downloadCode = () => {
    const blob = new Blob([netmikoCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'netmiko_script.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card
      title="Netmiko 代码预览"
      extra={
        <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
      }
      className="pd-netmiko-preview-panel"
    >
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<CopyOutlined />} onClick={copyToClipboard}>
            复制代码
          </Button>
          <Button icon={<DownloadOutlined />} onClick={downloadCode}>
            下载代码
          </Button>
        </Space>
      </div>
      <Divider />
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: 16, 
        borderRadius: 4,
        maxHeight: 'calc(100vh - 250px)',
        overflow: 'auto',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        fontSize: 14
      }}>
        <pre>{netmikoCode}</pre>
      </div>
    </Card>
  );
}; 