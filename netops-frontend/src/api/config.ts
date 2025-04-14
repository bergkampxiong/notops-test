import request from '../utils/request';

// 获取所有配置模板
export const getConfigTemplates = () => {
  return request({
    url: 'config-generator/templates',
    method: 'get'
  });
};

// 获取作业类型的配置模板
export const getJobTemplates = () => {
  return request({
    url: 'config-generator/templates-jobs',
    method: 'get'
  });
}; 