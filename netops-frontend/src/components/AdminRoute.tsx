import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const userInfo = await getCurrentUser();
        if (userInfo && userInfo.role === 'Admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, []);

  // 加载状态
  if (isAdmin === null) {
    return <div>加载中...</div>;
  }

  return isAdmin ? <>{children}</> : <Navigate to="/" />;
};

export default AdminRoute; 