import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Dropdown, Avatar, Button } from 'antd';
import type { MenuProps } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  RobotOutlined,
  BulbOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  KeyOutlined,
  RadarChartOutlined,
  ScanOutlined,
  DesktopOutlined,
  TagsOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/auth';

const { Header, Sider, Content } = AntLayout;

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // 获取用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfo = await getCurrentUser();
        if (userInfo) {
          setUserRole(userInfo.role);
          setUsername(userInfo.username);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    };

    fetchUserInfo();
  }, []);

  // 初始化菜单展开状态
  useEffect(() => {
    setOpenKeys(getOpenKeys());
  }, [location.pathname]);

  const toggle = () => {
    setCollapsed(!collapsed);
  };

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // 获取当前选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return ['dashboard'];
    if (path.startsWith('/cmdb')) return ['cmdb'];
    if (path.startsWith('/device/category')) return ['device-category'];
    if (path.startsWith('/device/credentials')) return ['credential-management'];
    if (path.startsWith('/rpa')) return ['rpa'];
    if (path.startsWith('/aiops')) return ['aiops'];
    if (path.startsWith('/system')) return ['system'];
    return ['dashboard'];
  };

  // 获取当前打开的子菜单
  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/device')) {
      return ['device'];
    }
    if (path.startsWith('/cmdb')) return ['cmdb'];
    return [];
  };

  // 处理菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  // 主菜单项
  const mainMenuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: 'cmdb',
      icon: <DatabaseOutlined />,
      label: 'CMDB',
      children: [
        {
          key: 'cmdb/query',
          label: '数据查询',
          icon: <DatabaseOutlined />,
        },
        {
          key: 'cmdb/discovery',
          label: 'ADS自动发现',
          icon: <RadarChartOutlined />,
        },
        {
          key: 'cmdb/inventory',
          label: '资产盘点',
          icon: <ScanOutlined />,
        },
        {
          key: 'cmdb/model',
          label: '模型管理',
          icon: <SettingOutlined />,
        },
      ],
    },
    {
      key: 'device',
      icon: <DesktopOutlined />,
      label: '设备管理',
      children: [
        {
          key: 'device-category',
          label: '设备分类',
          icon: <TagsOutlined />,
        },
        {
          key: 'credential-management',
          label: '凭证管理',
          icon: <SafetyCertificateOutlined />,
        },
      ],
    },
    {
      key: 'rpa',
      icon: <RobotOutlined />,
      label: '自动化RPA',
    },
    {
      key: 'aiops',
      icon: <BulbOutlined />,
      label: 'AIOPS',
    },
  ];

  // 只有管理员才能看到系统管理菜单
  if (userRole === 'Admin') {
    mainMenuItems.push({
      key: 'system',
      icon: <SettingOutlined />,
      label: '系统管理',
    });
  }

  // 用户菜单项
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'change-password',
      icon: <KeyOutlined />,
      label: '修改密码',
      onClick: () => navigate('/change-password'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout className="site-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} width={220}>
        <div className="logo" style={{
          position: 'relative',
          color: 'white',
          fontWeight: 'bold',
          fontSize: collapsed ? '18px' : '20px',
          textAlign: 'center',
          padding: '8px 0'
        }}>
          {!collapsed ? 'NetOps平台' : 'NO'}
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '16px',
            right: '16px',
            height: '3px',
            background: 'linear-gradient(90deg, #1890ff, #52c41a)',
            borderRadius: '3px',
            boxShadow: '0 1px 3px rgba(24, 144, 255, 0.3)'
          }}></div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKey()}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          onClick={({ key }) => {
            // 处理不同的路由
            if (key === 'dashboard') {
              handleMenuClick('/');
            } else if (key === 'device-category') {
              handleMenuClick('/device/category');
            } else if (key === 'credential-management') {
              handleMenuClick('/device/credentials');
            } else {
              handleMenuClick(`/${key}`);
            }
          }}
          items={mainMenuItems}
        />
      </Sider>
      <AntLayout>
        <Header className="site-layout-background" style={{ padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: toggle,
              style: { fontSize: '18px' }
            })}
            <div className="header-menu">
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Button type="text">
                  <Avatar icon={<UserOutlined />} style={{ marginRight: '8px' }} />
                  {username || '用户'}
                </Button>
              </Dropdown>
            </div>
          </div>
        </Header>
        <Content className="content-container page-container">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout; 