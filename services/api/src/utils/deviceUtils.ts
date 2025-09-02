import crypto from 'crypto';

/**
 * 生成设备指纹
 * 基于设备信息的哈希值，用于唯一标识设备
 */
export function generateDeviceFingerprint(deviceInfo: {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  osVersion: string;
  appVersion: string;
  manufacturer?: string;
  model?: string;
  screenResolution?: string;
}): string {
  try {
    // 构建设备信息字符串
    const deviceString = [
      deviceInfo.deviceId,
      deviceInfo.deviceName,
      deviceInfo.deviceType,
      deviceInfo.osVersion,
      deviceInfo.appVersion,
      deviceInfo.manufacturer || '',
      deviceInfo.model || '',
      deviceInfo.screenResolution || ''
    ].join('|');

    // 使用SHA-256生成哈希
    const hash = crypto.createHash('sha256');
    hash.update(deviceString);
    
    return hash.digest('hex');
  } catch (error) {
    console.error('生成设备指纹失败:', error);
    // 如果生成失败，返回基于设备ID的简单哈希
    return crypto.createHash('md5').update(deviceInfo.deviceId).digest('hex');
  }
}

/**
 * 验证设备指纹
 * 比较两个设备指纹是否匹配
 */
export function validateDeviceFingerprint(
  storedFingerprint: string,
  currentFingerprint: string
): boolean {
  try {
    return storedFingerprint === currentFingerprint;
  } catch (error) {
    console.error('验证设备指纹失败:', error);
    return false;
  }
}

/**
 * 计算设备指纹相似度
 * 返回0-1之间的相似度值
 */
export function calculateFingerprintSimilarity(
  fingerprint1: string,
  fingerprint2: string
): number {
  try {
    if (fingerprint1 === fingerprint2) {
      return 1.0; // 完全匹配
    }

    if (fingerprint1.length !== fingerprint2.length) {
      return 0.0; // 长度不同，无法比较
    }

    // 计算汉明距离（不同位的数量）
    let differences = 0;
    for (let i = 0; i < fingerprint1.length; i++) {
      if (fingerprint1[i] !== fingerprint2[i]) {
        differences++;
      }
    }

    // 计算相似度
    const similarity = 1 - (differences / fingerprint1.length);
    return Math.max(0, similarity);
  } catch (error) {
    console.error('计算设备指纹相似度失败:', error);
    return 0.0;
  }
}

/**
 * 检测设备信息变化
 * 返回变化的字段列表
 */
export function detectDeviceInfoChanges(
  oldInfo: any,
  newInfo: any
): string[] {
  try {
    const changes: string[] = [];
    const fieldsToCheck = [
      'deviceName',
      'osVersion',
      'appVersion',
      'manufacturer',
      'model',
      'screenResolution'
    ];

    for (const field of fieldsToCheck) {
      if (oldInfo[field] !== newInfo[field]) {
        changes.push(field);
      }
    }

    return changes;
  } catch (error) {
    console.error('检测设备信息变化失败:', error);
    return [];
  }
}

/**
 * 生成设备ID
 * 基于时间戳和随机数生成唯一设备ID
 */
export function generateDeviceId(): string {
  try {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `device_${timestamp}_${random}`;
  } catch (error) {
    console.error('生成设备ID失败:', error);
    return `device_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}

/**
 * 解析设备类型
 * 从User-Agent字符串解析设备类型
 */
export function parseDeviceType(userAgent: string): 'ios' | 'android' | 'web' | 'unknown' {
  try {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
      return 'ios';
    } else if (ua.includes('android')) {
      return 'android';
    } else if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari')) {
      return 'web';
    } else {
      return 'unknown';
    }
  } catch (error) {
    console.error('解析设备类型失败:', error);
    return 'unknown';
  }
}

/**
 * 解析操作系统版本
 * 从User-Agent字符串解析OS版本
 */
export function parseOSVersion(userAgent: string): string {
  try {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('iphone os') || ua.includes('ipad os')) {
      const match = ua.match(/iphone os (\d+_\d+)/i) || ua.match(/ipad os (\d+_\d+)/i);
      return match ? match[1].replace('_', '.') : 'unknown';
    } else if (ua.includes('android')) {
      const match = ua.match(/android (\d+\.\d+)/i);
      return match ? match[1] : 'unknown';
    } else {
      return 'unknown';
    }
  } catch (error) {
    console.error('解析操作系统版本失败:', error);
    return 'unknown';
  }
}

/**
 * 验证设备信息完整性
 * 检查设备信息是否包含所有必需字段
 */
export function validateDeviceInfo(deviceInfo: any): {
  isValid: boolean;
  missingFields: string[];
  errors: string[];
} {
  try {
    const requiredFields = [
      'deviceId',
      'deviceName',
      'deviceType',
      'osVersion',
      'appVersion',
      'deviceFingerprint'
    ];

    const missingFields: string[] = [];
    const errors: string[] = [];

    // 检查必需字段
    for (const field of requiredFields) {
      if (!deviceInfo[field]) {
        missingFields.push(field);
      }
    }

    // 验证设备类型
    if (deviceInfo.deviceType && !['ios', 'android', 'web', 'unknown'].includes(deviceInfo.deviceType)) {
      errors.push('设备类型必须是 ios、android、web 或 unknown');
    }

    // 验证设备指纹长度
    if (deviceInfo.deviceFingerprint && deviceInfo.deviceFingerprint.length < 32) {
      errors.push('设备指纹长度不足');
    }

    const isValid = missingFields.length === 0 && errors.length === 0;

    return {
      isValid,
      missingFields,
      errors
    };
  } catch (error) {
    console.error('验证设备信息失败:', error);
    return {
      isValid: false,
      missingFields: [],
      errors: ['验证过程发生错误']
    };
  }
}

/**
 * 清理设备信息
 * 移除敏感信息和空值
 */
export function sanitizeDeviceInfo(deviceInfo: any): any {
  try {
    const sanitized = { ...deviceInfo };

    // 移除敏感字段
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;

    // 移除空值和undefined
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === null || sanitized[key] === undefined || sanitized[key] === '') {
        delete sanitized[key];
      }
    });

    return sanitized;
  } catch (error) {
    console.error('清理设备信息失败:', error);
    return deviceInfo;
  }
}

/**
 * 格式化设备信息用于显示
 */
export function formatDeviceInfoForDisplay(deviceInfo: any): any {
  try {
    const formatted = { ...deviceInfo };

    // 格式化时间
    if (formatted.lastSyncTime) {
      formatted.lastSyncTime = new Date(formatted.lastSyncTime).toLocaleString();
    }
    if (formatted.lastActiveTime) {
      formatted.lastActiveTime = new Date(formatted.lastActiveTime).toLocaleString();
    }
    if (formatted.createdAt) {
      formatted.createdAt = new Date(formatted.createdAt).toLocaleString();
    }

    // 格式化设备类型
    const deviceTypeMap: Record<string, string> = {
      'ios': 'iOS',
      'android': 'Android',
      'web': 'Web',
      'unknown': '未知'
    };
    formatted.deviceTypeDisplay = deviceTypeMap[formatted.deviceType] || formatted.deviceType;

    // 格式化网络类型
    const networkTypeMap: Record<string, string> = {
      'wifi': 'WiFi',
      'cellular': '移动网络',
      'unknown': '未知'
    };
    formatted.networkTypeDisplay = networkTypeMap[formatted.networkType] || formatted.networkType;

    // 格式化同步状态
    const syncStatusMap: Record<string, string> = {
      'active': '活跃',
      'inactive': '非活跃',
      'error': '错误'
    };
    formatted.syncStatusDisplay = syncStatusMap[formatted.syncStatus] || formatted.syncStatus;

    return formatted;
  } catch (error) {
    console.error('格式化设备信息失败:', error);
    return deviceInfo;
  }
}
