/**
 * 头像URL处理工具
 * 将localhost URL转换为生产环境URL
 */
export const normalizeImageUrl = (url: string): string => {
  if (!url) return url;
  
  // 如果是localhost URL，转换为生产环境URL
  if (url.includes('localhost:3001')) {
    return url.replace('http://localhost:3001', 'https://dramawordv2.onrender.com');
  }
  
  return url;
};

/**
 * 检查图片URL是否有效
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  // 检查是否是有效的URL格式
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}; 