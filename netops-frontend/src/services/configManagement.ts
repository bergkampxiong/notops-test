import request from '../utils/request';

export interface ConfigFile {
  id: string;
  name: string;
  device_type: string;
  content: string;
  description: string;
  tags: string[];
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface Version {
  version: number;
  content: string;
  comment: string;
  created_at: string;
  created_by: string;
}

export const configManagementService = {
  getConfigs: () => {
    return request.get<ConfigFile[]>('/api/config/files');
  },

  getConfig: (id: string) => {
    return request.get<ConfigFile>(`/api/config/files/${id}`);
  },

  createConfig: (config: Partial<ConfigFile>) => {
    return request.post<ConfigFile>('/api/config/files', config);
  },

  updateConfig: (id: string, config: Partial<ConfigFile>) => {
    return request.put<ConfigFile>(`/api/config/files/${id}`, config);
  },

  deleteConfig: (id: string) => {
    return request.delete(`/api/config/files/${id}`);
  },

  getVersions: (configId: string) => {
    return request.get<Version[]>(`/api/config/files/${configId}/versions`);
  },

  createVersion: (configId: string, content: string, comment: string) => {
    return request.post<Version>(`/api/config/files/${configId}/versions`, {
      content,
      comment,
    });
  },

  renderTemplate: (templateName: string, variables: Record<string, any>) => {
    return request.post<{ content: string }>('/api/config/render-template', {
      template_name: templateName,
      variables,
    });
  },

  parseConfig: (templateName: string, rawText: string) => {
    return request.post<{ result: any[] }>('/api/config/parse-config', {
      template_name: templateName,
      raw_text: rawText,
    });
  },
}; 