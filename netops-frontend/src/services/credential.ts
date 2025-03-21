import { api } from '../utils/api';

/**
 * 凭证接口定义
 */
export interface Credential {
  id: number;
  name: string;
  description: string;
  credential_type: string;
  username: string;
  api_key: string | null;
  private_key: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 完整凭证接口定义（包含密码）
 */
export interface FullCredential extends Credential {
  password: string | null;
  enable_password: string | null;
  api_secret: string | null;
  passphrase: string | null;
}

/**
 * 获取凭证详情
 * @param id 凭证ID
 * @returns Promise<Credential> 凭证信息
 */
export const getCredential = async (id: number): Promise<Credential> => {
  try {
    const response = await api.get(`/api/device/credential/${id}`);
    return response.data;
  } catch (error) {
    console.error('获取凭证信息失败:', error);
    throw error;
  }
};

/**
 * 获取完整凭证信息（包含密码）
 * @param id 凭证ID
 * @returns Promise<FullCredential> 完整凭证信息
 */
export const getFullCredential = async (id: number): Promise<FullCredential> => {
  try {
    const response = await api.get(`/api/device/credential/${id}/full`);
    return response.data;
  } catch (error) {
    console.error('获取完整凭证信息失败:', error);
    throw error;
  }
};

/**
 * 获取凭证列表
 * @returns Promise<Credential[]> 凭证列表
 */
export const getCredentials = async (): Promise<Credential[]> => {
  try {
    const response = await api.get('/api/device/credential');
    return response.data;
  } catch (error) {
    console.error('获取凭证列表失败:', error);
    throw error;
  }
}; 