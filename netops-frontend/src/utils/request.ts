import axios, { AxiosResponse, AxiosInstance } from 'axios';
import { message } from 'antd';

// 标准响应格式
export interface StandardResponse<T> {
  status: number;  // HTTP状态码
  code?: number;   // 业务状态码
  message?: string;
  data: T;
  total?: number;
}

// 扩展AxiosInstance类型，使其返回标准响应格式
interface CustomAxiosInstance extends Omit<AxiosInstance, 'get' | 'delete' | 'post' | 'put' | 'patch'> {
  get<T = any>(url: string, config?: any): Promise<StandardResponse<T>>;
  delete<T = any>(url: string, config?: any): Promise<StandardResponse<T>>;
  post<T = any>(url: string, data?: any, config?: any): Promise<StandardResponse<T>>;
  put<T = any>(url: string, data?: any, config?: any): Promise<StandardResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: any): Promise<StandardResponse<T>>;
}

// 创建axios实例
// baseURL设置为/api，这样：
// 1. 调用 request.get('user/list') 会自动变成 /api/user/list
// 2. httpproxy 会保留/api前缀转发到后端
// 3. 代码中不需要手动添加/api
const request = axios.create({
  baseURL: '/api',  // 自动添加/api前缀
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
}) as CustomAxiosInstance;

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 确保URL不会重复添加/api前缀
    if (config.url?.startsWith('/api/')) {
      config.url = config.url.substring(4); // 移除重复的/api前缀
    }

    // 确保URL不会以斜杠开头，避免与baseURL重复
    if (config.url?.startsWith('/')) {
      config.url = config.url.substring(1);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    // 构造标准响应格式
    const standardResponse = {
      status: response.status,
      data: response.data,
      ...response.data  // 保留原有的其他字段
    } as StandardResponse<any>;
    
    // 返回原始响应，但添加标准响应格式
    (response as any).standardResponse = standardResponse;
    return response;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          // 权限不足
          console.error('权限不足');
          message.error('权限不足');
          break;
        case 404:
          // 请求的资源不存在
          console.error('请求的资源不存在');
          message.error('请求的资源不存在');
          break;
        case 500:
          // 服务器错误
          console.error('服务器错误');
          message.error('服务器错误');
          break;
        default:
          console.error('请求失败:', error.response.status);
          message.error('请求失败，请稍后重试');
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('没有收到响应:', error.request);
      message.error('网络请求超时，请检查网络连接');
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message);
      message.error('请求配置错误');
    }
    return Promise.reject(error);
  }
);

// 重写request的方法，使其返回标准响应格式
const originalGet = request.get;
request.get = async function<T>(url: string, config?: any): Promise<StandardResponse<T>> {
  const response = await originalGet.call(this, url, config);
  return (response as any).standardResponse;
};

const originalPost = request.post;
request.post = async function<T>(url: string, data?: any, config?: any): Promise<StandardResponse<T>> {
  const response = await originalPost.call(this, url, data, config);
  return (response as any).standardResponse;
};

const originalPut = request.put;
request.put = async function<T>(url: string, data?: any, config?: any): Promise<StandardResponse<T>> {
  const response = await originalPut.call(this, url, data, config);
  return (response as any).standardResponse;
};

const originalDelete = request.delete;
request.delete = async function<T>(url: string, config?: any): Promise<StandardResponse<T>> {
  const response = await originalDelete.call(this, url, config);
  return (response as any).standardResponse;
};

const originalPatch = request.patch;
request.patch = async function<T>(url: string, data?: any, config?: any): Promise<StandardResponse<T>> {
  const response = await originalPatch.call(this, url, data, config);
  return (response as any).standardResponse;
};

export default request; 