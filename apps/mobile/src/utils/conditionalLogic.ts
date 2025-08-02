// 条件逻辑工具类 - 用于简化复杂的条件判断

// 经验值相关条件判断
export class ExperienceLogic {
  /**
   * 检查是否应该应用经验值增益
   */
  static shouldApplyExperienceGain(gainData: string | null, gainAppliedKey: string | null): boolean {
    return gainData !== null && gainAppliedKey === null;
  }

  /**
   * 检查经验值增益是否已应用
   */
  static isExperienceGainApplied(gainAppliedKey: string | null): boolean {
    return gainAppliedKey !== null;
  }

  /**
   * 检查经验值增益是否有效
   */
  static isValidExperienceGain(gainData: string | null): boolean {
    if (!gainData) return false;
    
    try {
      const gain = JSON.parse(gainData);
      return typeof gain === 'number' && gain > 0;
    } catch {
      return false;
    }
  }

  /**
   * 计算最终经验值
   */
  static calculateFinalExperience(currentExp: number, gainedExp: number): number {
    return Math.max(0, currentExp + gainedExp);
  }

  /**
   * 检查是否升级
   */
  static checkLevelUp(currentExp: number, newExp: number, levelThresholds: number[]): {
    leveledUp: boolean;
    newLevel: number;
    expToNextLevel: number;
  } {
    const currentLevel = this.getCurrentLevel(currentExp, levelThresholds);
    const newLevel = this.getCurrentLevel(newExp, levelThresholds);
    
    return {
      leveledUp: newLevel > currentLevel,
      newLevel,
      expToNextLevel: this.getExpToNextLevel(newExp, levelThresholds)
    };
  }

  /**
   * 获取当前等级
   */
  static getCurrentLevel(exp: number, levelThresholds: number[]): number {
    for (let i = levelThresholds.length - 1; i >= 0; i--) {
      if (exp >= levelThresholds[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * 获取升级所需经验值
   */
  static getExpToNextLevel(exp: number, levelThresholds: number[]): number {
    const currentLevel = this.getCurrentLevel(exp, levelThresholds);
    if (currentLevel >= levelThresholds.length) {
      return 0; // 已达到最高等级
    }
    
    const nextLevelThreshold = levelThresholds[currentLevel - 1];
    return Math.max(0, nextLevelThreshold - exp);
  }
}

// 用户状态相关条件判断
export class UserStateLogic {
  /**
   * 检查用户是否已登录
   */
  static isUserLoggedIn(userData: any, loginType: string | null): boolean {
    return !!(userData && loginType && loginType !== 'guest');
  }

  /**
   * 检查是否为访客用户
   */
  static isGuestUser(loginType: string | null): boolean {
    return loginType === 'guest' || !loginType;
  }

  /**
   * 检查用户数据是否完整
   */
  static isUserDataComplete(userData: any): boolean {
    return !!(userData && userData.id && userData.token);
  }

  /**
   * 检查用户是否有权限执行操作
   */
  static hasPermission(userData: any, requiredPermission: string): boolean {
    if (!userData || !userData.permissions) return false;
    return userData.permissions.includes(requiredPermission);
  }
}

// 数据同步相关条件判断
export class SyncLogic {
  /**
   * 检查是否需要同步数据
   */
  static shouldSyncData(lastSyncTime: number, syncInterval: number): boolean {
    const now = Date.now();
    return (now - lastSyncTime) >= syncInterval;
  }

  /**
   * 检查数据是否过期
   */
  static isDataExpired(lastUpdateTime: number, expirationTime: number): boolean {
    const now = Date.now();
    return (now - lastUpdateTime) >= expirationTime;
  }

  /**
   * 检查是否有网络连接
   */
  static hasNetworkConnection(netInfo: any): boolean {
    return netInfo && netInfo.isConnected && netInfo.isInternetReachable;
  }

  /**
   * 检查同步优先级
   */
  static getSyncPriority(dataType: string, lastSyncTime: number): 'high' | 'medium' | 'low' {
    const timeSinceLastSync = Date.now() - lastSyncTime;
    
    switch (dataType) {
      case 'userStats':
      case 'experience':
        return timeSinceLastSync > 5 * 60 * 1000 ? 'high' : 'medium';
      case 'vocabulary':
      case 'learningRecords':
        return timeSinceLastSync > 30 * 60 * 1000 ? 'high' : 'medium';
      default:
        return timeSinceLastSync > 60 * 60 * 1000 ? 'medium' : 'low';
    }
  }
}

// 学习进度相关条件判断
export class LearningProgressLogic {
  /**
   * 检查是否应该显示复习提醒
   */
  static shouldShowReviewReminder(lastReviewTime: number, reviewInterval: number): boolean {
    const now = Date.now();
    return (now - lastReviewTime) >= reviewInterval;
  }

  /**
   * 检查单词是否已掌握
   */
  static isWordMastered(reviewCount: number, correctCount: number, masteryThreshold: number): boolean {
    return reviewCount >= 3 && (correctCount / reviewCount) >= masteryThreshold;
  }

  /**
   * 检查是否应该增加难度
   */
  static shouldIncreaseDifficulty(correctRate: number, difficultyThreshold: number): boolean {
    return correctRate >= difficultyThreshold;
  }

  /**
   * 检查是否应该降低难度
   */
  static shouldDecreaseDifficulty(correctRate: number, difficultyThreshold: number): boolean {
    return correctRate < difficultyThreshold;
  }
}

// 应用状态相关条件判断
export class AppStateLogic {
  /**
   * 检查应用是否在前台
   */
  static isAppActive(appState: string): boolean {
    return appState === 'active';
  }

  /**
   * 检查应用是否在后台
   */
  static isAppBackground(appState: string): boolean {
    return appState === 'background';
  }

  /**
   * 检查是否应该执行后台任务
   */
  static shouldExecuteBackgroundTask(appState: string, batteryLevel: number): boolean {
    return this.isAppBackground(appState) && batteryLevel > 0.2;
  }

  /**
   * 检查是否应该显示通知
   */
  static shouldShowNotification(
    appState: string,
    notificationEnabled: boolean,
    quietHours: { start: number; end: number }
  ): boolean {
    if (!notificationEnabled) return false;
    if (this.isAppActive(appState)) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour < quietHours.start || currentHour >= quietHours.end;
  }
}

// 通用条件判断工具
export class ConditionalUtils {
  /**
   * 安全地检查对象属性是否存在
   */
  static hasProperty(obj: any, property: string): boolean {
    return obj && typeof obj === 'object' && property in obj;
  }

  /**
   * 安全地获取嵌套对象属性
   */
  static getNestedProperty(obj: any, path: string[]): any {
    return path.reduce((current, key) => {
      return current && typeof current === 'object' ? current[key] : undefined;
    }, obj);
  }

  /**
   * 检查值是否在有效范围内
   */
  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * 检查数组是否包含有效元素
   */
  static hasValidElements(array: any[]): boolean {
    return Array.isArray(array) && array.length > 0 && array.every(item => item != null);
  }

  /**
   * 检查字符串是否有效
   */
  static isValidString(str: any): boolean {
    return typeof str === 'string' && str.trim().length > 0;
  }

  /**
   * 检查数字是否有效
   */
  static isValidNumber(num: any): boolean {
    return typeof num === 'number' && !isNaN(num) && isFinite(num);
  }

  /**
   * 检查日期是否有效
   */
  static isValidDate(date: any): boolean {
    if (!date) return false;
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  }
} 