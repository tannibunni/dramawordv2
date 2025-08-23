// API配置文件
export const API_CONFIG = {
  // 主要API地址
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://dramawordv2.onrender.com/api',
  
  // 备用API地址（如果主要地址失败）
  FALLBACK_URL: 'https://dramawordv2.onrender.com/api',
  
  // 超时设置
  TIMEOUT: 10000,
  
  // 重试次数
  MAX_RETRIES: 3,
};

// 获取API基础URL的函数
export const getApiBaseUrl = (): string => {
  const baseUrl = API_CONFIG.BASE_URL;
  console.log('[API Config] Using API Base URL:', baseUrl);
  return baseUrl;
};

// 构建完整API URL的函数
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  console.log('[API Config] Full API URL:', url);
  return url;
};

// 检查API地址是否可用的函数
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('[API Config] Health check failed:', error);
    return false;
  }
};
