import React from 'react';
import { Tabs } from 'antd';
import { 
  UserOutlined, SafetyOutlined, 
  AuditOutlined, LockOutlined, 
  ApiOutlined 
} from '@ant-design/icons';

import UserManagement from './UserManagement';
import LDAPConfig from './LDAPConfig';
import AuditLogs from './AuditLogs';
import SecuritySettings from './SecuritySettings';
import TwoFactorAuth from './TwoFactorAuth';

const { TabPane } = Tabs;

const SystemManagement: React.FC = () => {
  return (
    <div className="system-management">
      <div className="page-header">
        <h2>系统管理</h2>
      </div>
      
      <Tabs defaultActiveKey="users" tabPosition="left" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <TabPane 
          tab={<span><UserOutlined />用户管理</span>} 
          key="users"
        >
          <UserManagement />
        </TabPane>
        
        <TabPane 
          tab={<span><ApiOutlined />LDAP配置</span>} 
          key="ldap"
        >
          <LDAPConfig />
        </TabPane>
        
        <TabPane 
          tab={<span><SafetyOutlined />双因素认证</span>} 
          key="2fa"
        >
          <TwoFactorAuth />
        </TabPane>
        
        <TabPane 
          tab={<span><LockOutlined />安全设置</span>} 
          key="security"
        >
          <SecuritySettings />
        </TabPane>
        
        <TabPane 
          tab={<span><AuditOutlined />审计日志</span>} 
          key="audit"
        >
          <AuditLogs />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default SystemManagement; 