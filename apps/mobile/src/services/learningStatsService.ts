import { API_BASE_URL } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 学习统计数据接口
export interface LearningStats {
  totalWords: number;
  contributedWords: number;
  learningDays: number;
  streakDays: number;
  level: number;
  experience: number;
  badges: Badge[];
}

// 徽章接口
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

// 学习记录接口
export interface LearningRecord {
  date: string;
  wordsLearned: number;
  reviewsCompleted: number;
  accuracy: number;
}

export class LearningStatsService {
  private static instance: LearningStatsService;

  private constructor() {}

  public static getInstance(): LearningStatsService {
    if (!LearningStatsService.instance) {
      LearningStatsService.instance = new LearningStatsService();
    }
    return LearningStatsService.instance;
  }

  // 获取用户ID（从本地存储或AuthContext）
  private async getUserId(): Promise<string | null> {
    try {
      // 尝试从AsyncStorage获取用户信息
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || null;
      }
      
      // 用户未登录，生成临时游客ID
      console.log('🔍 用户未登录，生成临时游客ID');
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 保存临时游客信息到本地存储
      const tempUserData = {
        id: guestId,
        nickname: '游客用户',
        loginType: 'guest',
        isTemporary: true,
      };
      
      await AsyncStorage.setItem('userData', JSON.stringify(tempUserData));
      await AsyncStorage.setItem('loginType', 'guest');
      
      console.log('✅ 临时游客ID已生成:', guestId);
      return guestId;
    } catch (error) {
      console.error('获取用户ID失败:', error);
      return null;
    }
  }

  // 获取学习统计数据
  async getLearningStats(): Promise<LearningStats | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        console.log('⚠️ 未找到用户ID，返回新用户默认数据');
        return this.getNewUserStats();
      }

      console.log('🔍 获取用户学习统计，用户ID:', userId);
      
      const response = await fetch(`${API_BASE_URL}/users/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        console.warn('⚠️ 获取学习统计失败，使用新用户默认数据:', response.status);
        return this.getNewUserStats();
      }

      const result = await response.json();
      if (result.success && result.data) {
        console.log('✅ 获取学习统计成功:', result.data);
        // 映射后端数据格式到前端格式
        const stats = result.data.learningStats || result.data;
        return {
          totalWords: stats.totalWordsLearned || 0,
          contributedWords: 0, // 后端暂无此字段
          learningDays: stats.currentStreak || 0,
          streakDays: stats.currentStreak || 0,
          level: stats.level || 1,
          experience: stats.experience || 0,
          badges: []
        };
      } else {
        console.warn('⚠️ 学习统计数据格式错误，使用新用户默认数据');
        return this.getNewUserStats();
      }
    } catch (error) {
      console.error('❌ 获取学习统计失败:', error);
      return this.getNewUserStats();
    }
  }

  // 获取徽章列表
  async getBadges(): Promise<Badge[]> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        console.log('⚠️ 未找到用户ID，返回空徽章列表');
        return [];
      }

      console.log('🔍 获取用户徽章，用户ID:', userId);
      
      const response = await fetch(`${API_BASE_URL}/users/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        console.warn('⚠️ 获取徽章失败，返回空列表:', response.status);
        return [];
      }

      const result = await response.json();
      if (result.success && result.data) {
        console.log('✅ 获取用户数据成功，但后端暂无徽章功能');
        // 后端暂无徽章功能，返回空列表
        return [];
      } else {
        console.warn('⚠️ 用户数据格式错误，返回空徽章列表');
        return [];
      }
    } catch (error) {
      console.error('❌ 获取徽章失败:', error);
      return [];
    }
  }

  // 获取学习记录
  async getLearningRecords(): Promise<LearningRecord[]> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        console.log('⚠️ 未找到用户ID，返回模拟学习记录');
        return this.getMockLearningRecords();
      }

      console.log('🔍 获取用户学习记录，用户ID:', userId);
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}/learning-records`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('⚠️ 获取学习记录失败，使用模拟数据:', response.status);
        return this.getMockLearningRecords();
      }

      const result = await response.json();
      if (result.success && result.data) {
        console.log('✅ 获取学习记录成功:', result.data);
        return result.data;
      } else {
        console.warn('⚠️ 学习记录数据格式错误，使用模拟数据');
        return this.getMockLearningRecords();
      }
    } catch (error) {
      console.error('❌ 获取学习记录失败:', error);
      return this.getMockLearningRecords();
    }
  }

  // 获取认证token
  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('获取认证token失败:', error);
      return null;
    }
  }

  // 新用户默认统计数据
  private getNewUserStats(): LearningStats {
    return {
      totalWords: 0,
      contributedWords: 0,
      learningDays: 0,
      streakDays: 0,
      level: 1,
      experience: 0,
      badges: []
    };
  }

  // 模拟学习统计数据（仅用于测试）
  private getMockLearningStats(): LearningStats {
    return {
      totalWords: 1250,
      contributedWords: 45,
      learningDays: 45,
      streakDays: 12,
      level: 3,
      experience: 1250,
      badges: []
    };
  }

  // 模拟徽章数据
  private getMockBadges(): Badge[] {
    return [
      {
        id: 'first_word',
        name: '初学乍练',
        description: '学习第一个单词',
        icon: '🎯',
        unlockedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 'streak_7',
        name: '坚持不懈',
        description: '连续学习7天',
        icon: '🔥',
        unlockedAt: '2024-01-22T15:45:00Z'
      },
      {
        id: 'words_100',
        name: '词汇达人',
        description: '学习100个单词',
        icon: '📚',
        unlockedAt: '2024-02-01T09:15:00Z'
      },
      {
        id: 'accuracy_90',
        name: '精准记忆',
        description: '复习准确率达到90%',
        icon: '🎯',
        unlockedAt: '2024-02-10T14:20:00Z'
      },
      {
        id: 'streak_30',
        name: '学习狂人',
        description: '连续学习30天',
        icon: '🏆',
        progress: 25,
        maxProgress: 30
      },
      {
        id: 'words_500',
        name: '词汇专家',
        description: '学习500个单词',
        icon: '👑',
        progress: 250,
        maxProgress: 500
      }
    ];
  }

  // 模拟学习记录数据
  private getMockLearningRecords(): LearningRecord[] {
    const records: LearningRecord[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      records.push({
        date: date.toISOString().split('T')[0],
        wordsLearned: Math.floor(Math.random() * 10) + 1,
        reviewsCompleted: Math.floor(Math.random() * 20) + 5,
        accuracy: Math.floor(Math.random() * 20) + 80
      });
    }
    
    return records;
  }
} 