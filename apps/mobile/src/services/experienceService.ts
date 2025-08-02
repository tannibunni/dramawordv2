import { API_BASE_URL } from '../constants/config';
import { storageService } from './storageService';
import { errorHandler, ErrorType } from '../utils/errorHandler';
import { experienceCalculationService } from './experienceCalculationService';
import type { 
  UserExperienceInfo, 
  ExperienceGainResult, 
  ExperienceWays,
  ExperienceEvent,
  ExperienceAPIResponse 
} from '../types/experience';

// 使用从类型定义文件导入的接口
export type { 
  UserExperienceInfo as ExperienceInfo,
  ExperienceGainResult,
  ExperienceWay,
  ExperienceWays 
} from '../types/experience';

export class ExperienceService {
  private static async getAuthToken(): Promise<string | null> {
    try {
      const result = await storageService.getUserData();
      if (result.success && result.data && result.data.token) {
        return result.data.token;
      }
      return null;
    } catch (error) {
      errorHandler.handleError(error, {}, {
        type: ErrorType.STORAGE,
        userMessage: '获取认证token失败'
      });
      return null;
    }
  }

  /**
   * 获取用户经验值信息
   */
  static async getExperienceInfo(): Promise<UserExperienceInfo | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.log('⚠️ 未找到认证token');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/experience/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`获取经验值信息失败: ${response.status}`);
      }

      const result: ExperienceAPIResponse<UserExperienceInfo> = await response.json();
      if (result.success && result.data) {
        console.log('✅ 获取经验值信息成功:', result.data);
        return result.data;
      } else {
        throw new Error(result.error || '经验值信息格式错误');
      }
    } catch (error) {
      errorHandler.handleError(error, {}, {
        type: ErrorType.NETWORK,
        userMessage: '获取经验值信息失败，请检查网络连接'
      });
      return null;
    }
  }

  /**
   * 获取经验值获取方式说明
   */
  static async getExperienceWays(): Promise<ExperienceWays | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.log('⚠️ 未找到认证token');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/experience/ways`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn('⚠️ 获取经验值获取方式失败:', response.status);
        return null;
      }

      const result = await response.json();
      if (result.success && result.data) {
        console.log('✅ 获取经验值获取方式成功:', result.data);
        return result.data;
      } else {
        console.warn('⚠️ 经验值获取方式格式错误');
        return null;
      }
    } catch (error) {
      console.error('❌ 获取经验值获取方式失败:', error);
      return null;
    }
  }

  /**
   * 复习单词获得经验值
   */
  static async addReviewExperience(isCorrect: boolean = true): Promise<ExperienceGainResult | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.log('⚠️ 未找到认证token');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/experience/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isCorrect }),
      });

      if (!response.ok) {
        console.warn('⚠️ 复习单词经验值添加失败:', response.status);
        return null;
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ 复习单词经验值添加成功:', result.data);
        return result.data;
      } else {
        console.warn('⚠️ 复习单词经验值添加失败:', result.message);
        return null;
      }
    } catch (error) {
      console.error('❌ 复习单词经验值添加失败:', error);
      return null;
    }
  }

  /**
   * 智能挑战获得经验值
   */
  static async addSmartChallengeExperience(): Promise<ExperienceGainResult | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.log('⚠️ 未找到认证token');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/experience/smart-challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn('⚠️ 智能挑战经验值添加失败:', response.status);
        return null;
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ 智能挑战经验值添加成功:', result.data);
        return result.data;
      } else {
        console.warn('⚠️ 智能挑战经验值添加失败:', result.message);
        return null;
      }
    } catch (error) {
      console.error('❌ 智能挑战经验值添加失败:', error);
      return null;
    }
  }

  /**
   * 错词挑战获得经验值
   */
  static async addWrongWordChallengeExperience(): Promise<ExperienceGainResult | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.log('⚠️ 未找到认证token');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/experience/wrong-word-challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn('⚠️ 错词挑战经验值添加失败:', response.status);
        return null;
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ 错词挑战经验值添加成功:', result.data);
        return result.data;
      } else {
        console.warn('⚠️ 错词挑战经验值添加失败:', result.message);
        return null;
      }
    } catch (error) {
      console.error('❌ 错词挑战经验值添加失败:', error);
      return null;
    }
  }

  /**
   * 收集新单词获得经验值
   */
  static async addNewWordExperience(): Promise<ExperienceGainResult | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.log('⚠️ 未找到认证token');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/experience/new-word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn('⚠️ 收集新单词经验值添加失败:', response.status);
        return null;
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ 收集新单词经验值添加成功:', result.data);
        return result.data;
      } else {
        console.warn('⚠️ 收集新单词经验值添加失败:', result.message);
        return null;
      }
    } catch (error) {
      console.error('❌ 收集新单词经验值添加失败:', error);
      return null;
    }
  }

  /**
   * 贡献新词获得经验值
   */
  static async addContributionExperience(): Promise<ExperienceGainResult | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.log('⚠️ 未找到认证token');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/experience/contribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn('⚠️ 贡献新词经验值添加失败:', response.status);
        return null;
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ 贡献新词经验值添加成功:', result.data);
        return result.data;
      } else {
        console.warn('⚠️ 贡献新词经验值添加失败:', result.message);
        return null;
      }
    } catch (error) {
      console.error('❌ 贡献新词经验值添加失败:', error);
      return null;
    }
  }

  /**
   * 连续学习打卡
   */
  static async dailyCheckin(): Promise<ExperienceGainResult | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.log('⚠️ 未找到认证token');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/experience/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn('⚠️ 连续学习打卡失败:', response.status);
        return null;
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ 连续学习打卡成功:', result.data);
        return result.data;
      } else {
        console.warn('⚠️ 连续学习打卡失败:', result.message);
        return null;
      }
    } catch (error) {
      console.error('❌ 连续学习打卡失败:', error);
      return null;
    }
  }

  /**
   * 完成每日词卡任务
   */
  static async completeDailyCards(): Promise<ExperienceGainResult | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.log('⚠️ 未找到认证token');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/experience/daily-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn('⚠️ 完成每日词卡任务失败:', response.status);
        return null;
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ 完成每日词卡任务成功:', result.data);
        return result.data;
      } else {
        console.warn('⚠️ 完成每日词卡任务失败:', result.message);
        return null;
      }
    } catch (error) {
      console.error('❌ 完成每日词卡任务失败:', error);
      return null;
    }
  }

  /**
   * 学习时长奖励
   */
  static async addStudyTime(minutes: number): Promise<ExperienceGainResult | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.log('⚠️ 未找到认证token');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/experience/study-time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ minutes }),
      });

      if (!response.ok) {
        console.warn('⚠️ 学习时长奖励失败:', response.status);
        return null;
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ 学习时长奖励成功:', result.data);
        return result.data;
      } else {
        console.warn('⚠️ 学习时长奖励失败:', result.message);
        return null;
      }
    } catch (error) {
      console.error('❌ 学习时长奖励失败:', error);
      return null;
    }
  }

  /**
   * 计算等级所需经验值（平方增长公式）
   */
  static calculateLevelRequiredExp(level: number): number {
    const totalExpForNextLevel = 50 * Math.pow(level + 1, 2);
    const totalExpForCurrentLevel = 50 * Math.pow(level, 2);
    return totalExpForNextLevel - totalExpForCurrentLevel;
  }

  /**
   * 计算经验值进度百分比
   */
  static calculateProgressPercentage(level: number, experience: number): number {
    const requiredExp = this.calculateLevelRequiredExp(level);
    const progressPercentage = (experience / requiredExp) * 100;
    return Math.min(100, Math.max(0, progressPercentage));
  }

  /**
   * 获取等级名称
   */
  static getLevelName(level: number): string {
    const levels = [
      '初学者', '入门者', '学习者', '进阶者', '熟练者',
      '专家', '大师', '传奇', '神话', '传说'
    ];
    return levels[Math.min(level - 1, levels.length - 1)];
  }

  /**
   * 格式化经验值显示
   */
  static formatExperience(exp: number): string {
    if (exp >= 1000000) {
      return `${(exp / 1000000).toFixed(1)}M`;
    } else if (exp >= 1000) {
      return `${(exp / 1000).toFixed(1)}K`;
    }
    return exp.toString();
  }

  /**
   * 获取经验值颜色
   */
  static getExperienceColor(level: number): string {
    const colors = [
      '#6B7280', // 灰色 - 初学者
      '#3B82F6', // 蓝色 - 入门者
      '#10B981', // 绿色 - 学习者
      '#F59E0B', // 黄色 - 进阶者
      '#EF4444', // 红色 - 熟练者
      '#8B5CF6', // 紫色 - 专家
      '#EC4899', // 粉色 - 大师
      '#F97316', // 橙色 - 传奇
      '#06B6D4', // 青色 - 神话
      '#84CC16'  // 青绿色 - 传说
    ];
    return colors[Math.min(level - 1, colors.length - 1)];
  }
} 