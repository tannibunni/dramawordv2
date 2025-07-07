// API配置
export const API_BASE_URL = 'https://dramawordv2.onrender.com/api'; // 统一使用生产环境

// 应用配置
export const APP_CONFIG = {
  // 应用信息
  APP_NAME: '剧词记',
  APP_VERSION: '1.0.0',
  
  // API配置
  API_TIMEOUT: 10000, // 10秒超时
  API_RETRY_COUNT: 3, // 重试次数
  
  // 存储配置
  STORAGE_KEYS: {
    USER_TOKEN: 'user_token',
    USER_PROFILE: 'user_profile',
    LEARNING_RECORDS: 'learning_records',
    REVIEW_SESSIONS: 'review_sessions',
    APP_SETTINGS: 'app_settings',
  },
  
  // 学习配置
  LEARNING_CONFIG: {
    DEFAULT_INTERVAL: 1, // 默认复习间隔（天）
    MAX_INTERVAL: 365, // 最大复习间隔（天）
    MASTERY_THRESHOLD: 0.8, // 掌握度阈值
    REVIEW_LIMIT: 50, // 每次复习单词数量限制
  },
  
  // 文件上传配置
  UPLOAD_CONFIG: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    COMPRESSION_QUALITY: 0.8,
  },
  
  // 第三方登录配置
  THIRD_PARTY_CONFIG: {
    WECHAT: {
      APP_ID: 'wxa225945508659eb8',
      SCOPE: 'snsapi_userinfo',
    },
    APPLE: {
      CLIENT_ID: 'your_apple_client_id',
      REDIRECT_URI: 'your_apple_redirect_uri',
    },
  },
  
  // 缓存配置
  CACHE_CONFIG: {
    WORD_CACHE_DURATION: 24 * 60 * 60 * 1000, // 24小时
    USER_PROFILE_CACHE_DURATION: 30 * 60 * 1000, // 30分钟
    SEARCH_HISTORY_LIMIT: 100, // 搜索历史限制
  },
  
  // 错误消息
  ERROR_MESSAGES: {
    NETWORK_ERROR: '网络连接失败，请检查网络设置',
    SERVER_ERROR: '服务器错误，请稍后重试',
    UNAUTHORIZED: '登录已过期，请重新登录',
    FORBIDDEN: '没有权限执行此操作',
    NOT_FOUND: '请求的资源不存在',
    VALIDATION_ERROR: '输入数据格式错误',
    UPLOAD_ERROR: '文件上传失败',
    UNKNOWN_ERROR: '未知错误，请稍后重试',
  },
  
  // 成功消息
  SUCCESS_MESSAGES: {
    LOGIN_SUCCESS: '登录成功',
    LOGOUT_SUCCESS: '退出登录成功',
    PROFILE_UPDATED: '个人资料更新成功',
    AVATAR_UPLOADED: '头像上传成功',
    SETTINGS_UPDATED: '设置更新成功',
    WORD_ADDED: '单词添加成功',
    WORD_REMOVED: '单词移除成功',
    REVIEW_COMPLETED: '复习完成',
  },
};

// 环境配置
export const ENV_CONFIG = {
  IS_DEV: __DEV__,
  IS_PROD: !__DEV__,
  LOG_LEVEL: __DEV__ ? 'debug' : 'error',
  ENABLE_ANALYTICS: !__DEV__,
  ENABLE_CRASH_REPORTING: !__DEV__,
};

// 主题配置
export const THEME_CONFIG = {
  // 颜色
  COLORS: {
    PRIMARY: '#007AFF',
    SECONDARY: '#5856D6',
    SUCCESS: '#34C759',
    WARNING: '#FF9500',
    ERROR: '#FF3B30',
    INFO: '#5AC8FA',
    
    // 背景色
    BACKGROUND: '#FFFFFF',
    BACKGROUND_SECONDARY: '#F2F2F7',
    BACKGROUND_TERTIARY: '#E5E5EA',
    
    // 文本色
    TEXT_PRIMARY: '#000000',
    TEXT_SECONDARY: '#8E8E93',
    TEXT_TERTIARY: '#C7C7CC',
    
    // 边框色
    BORDER: '#C6C6C8',
    BORDER_LIGHT: '#E5E5EA',
  },
  
  // 字体
  FONTS: {
    FAMILY: 'Inter',
    SIZES: {
      XS: 12,
      SM: 14,
      MD: 16,
      LG: 18,
      XL: 20,
      XXL: 24,
      XXXL: 32,
    },
    WEIGHTS: {
      LIGHT: '300',
      REGULAR: '400',
      MEDIUM: '500',
      SEMIBOLD: '600',
      BOLD: '700',
    },
  },
  
  // 间距
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    XXL: 48,
  },
  
  // 圆角
  BORDER_RADIUS: {
    SM: 4,
    MD: 8,
    LG: 12,
    XL: 16,
    ROUND: 50,
  },
  
  // 阴影
  SHADOWS: {
    SM: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    MD: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    LG: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
  },
};

// 导出默认配置
export default {
  API_BASE_URL,
  APP_CONFIG,
  ENV_CONFIG,
  THEME_CONFIG,
}; 