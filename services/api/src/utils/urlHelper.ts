/**
 * URL处理工具
 * 确保头像URL使用正确的生产环境地址
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
 * 获取API基础URL
 */
export const getApiBaseUrl = (): string => {
  let baseUrl = process.env.API_BASE_URL;
  
  // 如果没有设置API_BASE_URL，根据环境判断
  if (!baseUrl) {
    if (process.env.NODE_ENV === 'production') {
      baseUrl = 'https://dramawordv2.onrender.com';
    } else {
      baseUrl = `http://localhost:${process.env.PORT || 3001}`;
    }
  }
  
  return baseUrl;
}; 