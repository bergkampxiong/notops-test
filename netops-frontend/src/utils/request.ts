import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  // 使用相对路径，这样请求会通过react-scripts dev server的代理转发
  baseURL: process.env.NODE_ENV === 'development' ? '' : 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message.error('未授权，请重新登录');
          break;
        case 403:
          message.error('拒绝访问');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误');
          break;
        default:
          // 处理detail字段，确保不会渲染对象
          let errorMessage = '未知错误';
          const data = error.response.data;
          
          if (data && data.detail) {
            if (typeof data.detail === 'string') {
              errorMessage = data.detail;
            } else if (Array.isArray(data.detail)) {
              // 如果detail是数组，提取第一个错误信息
              const firstError = data.detail[0];
              if (firstError && typeof firstError === 'object') {
                // 如果是验证错误对象，尝试提取msg字段
                errorMessage = firstError.msg || JSON.stringify(firstError);
              } else {
                errorMessage = String(firstError);
              }
            } else if (typeof data.detail === 'object') {
              // 如果detail是对象，转换为字符串
              errorMessage = JSON.stringify(data.detail);
            }
          }
          
          message.error(`请求失败: ${errorMessage}`);
      }
    } else {
      message.error('网络错误，请检查网络连接');
    }
    return Promise.reject(error);
  }
);

export default request; 