import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',  // 实际部署时应该指向后端API的地址
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding token to request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    if (error.response && error.response.status === 401) {
      // 未授权，清除token并重定向到登录页
      console.log('Unauthorized, redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * 登录
 * @param username 用户名
 * @param password 密码
 * @returns 登录是否成功，或者2FA信息
 */
export const login = async (username: string, password: string): Promise<boolean | { needSetup: boolean }> => {
  try {
    // 创建表单数据
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    // 实际连接到后端API，使用表单数据格式
    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('Login response:', response.data);
    
    if (response.status === 200) {
      const token = response.data.access_token;
      console.log('Token received:', token);
      
      if (token && typeof token === 'string' && token.startsWith('2FA_REQUIRED_')) {
        // 需要2FA
        const needSetup = token.includes('_SETUP_');
        console.log('2FA required, setup mode:', needSetup, 'token:', token);
        return { needSetup };
      } else if (token) {
        // 登录成功，无需2FA
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('登录失败:', error);
    return false;
  }
};

/**
 * 登出
 */
export const logout = async (): Promise<void> => {
  try {
    // 调用后端API登出
    await api.post('/auth/logout');
    
    // 清除本地存储的认证信息
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  } catch (error) {
    console.error('登出失败:', error);
    // 即使API调用失败，也清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  }
};

/**
 * 检查用户是否已认证
 * @returns 是否已认证
 */
export const checkAuth = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    console.log('检查认证状态，token存在:', !!token);
    
    if (!token) {
      console.log('未找到token，用户未认证');
      return false;
    }
    
    // 调用后端API验证token
    console.log('正在验证token...');
    const response = await api.get('/auth/verify');
    console.log('Token验证响应:', response.status, response.data);
    
    if (response.status === 200) {
      // 更新用户信息
      const { username, role } = response.data;
      localStorage.setItem('username', username);
      localStorage.setItem('userRole', role);
      console.log('用户已认证:', username, role);
      return true;
    }
    
    console.log('Token验证失败，状态码:', response.status);
    return false;
  } catch (error) {
    console.error('Token验证失败:', error);
    return false;
  }
};

/**
 * 获取当前用户信息
 * @returns 用户信息
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
};

/**
 * 修改密码
 * @param oldPassword 旧密码
 * @param newPassword 新密码
 * @returns 是否成功
 */
export const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
  try {
    const response = await api.post('/users/change-password', {
      old_password: oldPassword,
      new_password: newPassword
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('修改密码失败:', error);
    throw error;
  }
};

export default api; 