/**
 * URL处理工具
 * 强制使用生产环境URL，确保开发和生产环境一致
 */

/**
 * 将localhost URL转换为生产环境URL
 */
export const normalizeAvatarUrl = (url: string | undefined): string | undefined => {
  if (!url) return url;
  
  // 如果是localhost URL，转换为生产环境URL
  if (url.includes('localhost:3001')) {
    return url.replace('http://localhost:3001', 'https://dramawordv2.onrender.com');
  }
  
  return url;
};

/**
 * 获取API基础URL - 强制使用生产环境URL
 */
export const getApiBaseUrl = (): string => {
  // 优先使用环境变量
  let baseUrl = process.env.API_BASE_URL;
  
  // 如果没有设置API_BASE_URL，强制使用生产环境URL
  if (!baseUrl) {
    baseUrl = 'https://dramawordv2.onrender.com';
  }
  
  return baseUrl;
}; 