import { API_BASE_URL } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExperienceInfo {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  progressPercentage: number;
  totalExperience: number;
  dailyReviewXP: number;
  dailyStudyTimeXP: number;
  completedDailyCards: boolean;
  currentStreak: number;
}

export interface ExperienceGainResult {
  success: boolean;
  xpGained: number;
  newLevel: number;
  leveledUp: boolean;
  message: string;
}

export class ExperienceService {
  private static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('获取认证token失败:', error);
      return null;
    }
  }

  /**
   * 获取用户经验值信息
   */
  static async getExperienceInfo(): Promise<ExperienceInfo | null> {
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
        console.warn('⚠️ 获取经验值信息失败:', response.status);
        return null;
      }

      const result = await response.json();
      if (result.success && result.data) {
        console.log('✅ 获取经验值信息成功:', result.data);
        return result.data;
      } else {
        console.warn('⚠️ 经验值信息格式错误');
        return null;
      }
    } catch (error) {
      console.error('❌ 获取经验值信息失败:', error);
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
} 