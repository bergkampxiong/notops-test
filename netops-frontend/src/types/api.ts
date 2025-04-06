// API响应类型定义
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
} 