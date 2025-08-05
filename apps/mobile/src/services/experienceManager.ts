import { animationManager } from './animationManager';
import { unifiedSyncService } from './unifiedSyncService';
import { storageService } from './storageService';
import { errorHandler, ErrorType } from '../utils/errorHandler';
import { API_BASE_URL } from '../constants/config';
import type { 
  UserExperienceInfo, 
  ExperienceEvent, 
  ExperienceGainResult,
  ExperienceWays
} from '../types/experience';

export interface ExperienceGainEvent {
  type: 'review' | 'smartChallenge' | 'wrongWordChallenge' | 'newWord' | 'contribution' | 'dailyCheckin' | 'dailyCards' | 'studyTime';
  xpGained: number;
  leveledUp: boolean;
  message: string;
  timestamp: number;
}

export interface ExperienceManagerConfig {
  enableAnimations: boolean;
  enableNotifications: boolean;
  enableSound: boolean;
  autoSync: boolean;
}

// 经验值配置
interface ExperienceConfig {
  baseXP: number;
  levelMultiplier: number;
  xpRewards: {
    review: {
      correct: number;
      incorrect: number;
    };
    smartChallenge: number;
    wrongWordChallenge: number;
    newWord: number;
    contribution: number;
    dailyCheckin: number;
    dailyCards: number;
    studyTime: number;
  };
}

/**
 * 经验值管理器 - 统一管理经验值业务逻辑和API通信
 * 
 * 职责：
 * 1. 本地经验值计算
 * 2. 业务逻辑处理（动画、通知、同步）
 * 3. API通信（获取初始数据、同步结果）
 * 4. 事件记录和统计
 */
export class ExperienceManager {
  private static instance: ExperienceManager;
  private config: ExperienceManagerConfig;
  private experienceConfig: ExperienceConfig;
  private currentExperience: number = 0;
  private currentLevel: number = 1;
  private isProcessing: boolean = false;

  private constructor() {
    this.config = {
      enableAnimations: true,
      enableNotifications: true,
      enableSound: true,
      autoSync: true
    };
    
    this.experienceConfig = {
      baseXP: 50,
      levelMultiplier: 2,
      xpRewards: {
        review: {
          correct: 2,
          incorrect: 1,
        },
        smartChallenge: 5,
        wrongWordChallenge: 3,
        newWord: 5,
        contribution: 10,
        dailyCheckin: 20,
        dailyCards: 15,
        studyTime: 1, // 每分钟1经验值
      },
    };
  }

  public static getInstance(): ExperienceManager {
    if (!ExperienceManager.instance) {
      ExperienceManager.instance = new ExperienceManager();
    }
    return ExperienceManager.instance;
  }

  /**
   * 获取认证token
   */
  private async getAuthToken(): Promise<string | null> {
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
   * 从API获取用户经验值信息
   */
  private async getExperienceInfoFromAPI(): Promise<UserExperienceInfo | null> {
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

      const result = await response.json();
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
   * 从API获取经验值获取方式说明
   */
  private async getExperienceWaysFromAPI(): Promise<ExperienceWays | null> {
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
   * 更新配置
   */
  public updateConfig(newConfig: Partial<ExperienceManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  public getConfig(): ExperienceManagerConfig {
    return { ...this.config };
  }

  /**
   * 计算等级所需经验值
   */
  private calculateLevelRequiredExp(level: number): number {
    return this.experienceConfig.baseXP * Math.pow(level + 1, this.experienceConfig.levelMultiplier);
  }

  /**
   * 计算当前等级
   */
  private calculateLevel(experience: number): number {
    if (experience <= 0) return 1;

    let level = 1;
    while (this.calculateLevelRequiredExp(level) <= experience) {
      level++;
    }
    return level;
  }

  /**
   * 计算升级所需经验值
   */
  private calculateExpToNextLevel(experience: number): number {
    const currentLevel = this.calculateLevel(experience);
    const requiredExp = this.calculateLevelRequiredExp(currentLevel);
    return Math.max(0, requiredExp - experience);
  }

  /**
   * 计算进度百分比
   */
  private calculateProgressPercentage(experience: number): number {
    if (experience <= 0) return 0;

    const currentLevel = this.calculateLevel(experience);
    const levelStartExp = currentLevel > 1 ? this.calculateLevelRequiredExp(currentLevel - 1) : 0;
    const levelEndExp = this.calculateLevelRequiredExp(currentLevel);
    const expInCurrentLevel = experience - levelStartExp;
    const expNeededForLevel = levelEndExp - levelStartExp;

    const percentage = (expInCurrentLevel / expNeededForLevel) * 100;
    return Math.min(100, Math.max(0, percentage));
  }

  /**
   * 计算经验值增益
   */
  private calculateExperienceGain(
    currentExperience: number,
    xpToGain: number,
    reason: string = '未知'
  ): ExperienceGainResult {
    const oldLevel = this.calculateLevel(currentExperience);
    const newExperience = currentExperience + xpToGain;
    const newLevel = this.calculateLevel(newExperience);
    const leveledUp = newLevel > oldLevel;
    const oldProgress = this.calculateProgressPercentage(currentExperience);
    const newProgress = this.calculateProgressPercentage(newExperience);

    return {
      success: true,
      xpGained: xpToGain,
      newLevel,
      leveledUp,
      message: `${reason} +${xpToGain}经验值`,
      oldLevel,
      oldExperience: currentExperience,
      newExperience,
      progressChange: newProgress - oldProgress,
    };
  }

  /**
   * 计算复习经验值
   */
  private calculateReviewExperience(isCorrect: boolean): number {
    return isCorrect
      ? this.experienceConfig.xpRewards.review.correct
      : this.experienceConfig.xpRewards.review.incorrect;
  }

  /**
   * 复习单词获得经验值
   */
  public async addReviewExperience(isCorrect: boolean = true): Promise<ExperienceGainResult | null> {
    try {
      this.isProcessing = true;
      
      // 本地计算经验值
      const xpGained = this.calculateReviewExperience(isCorrect);
      const currentExp = this.currentExperience;
      const calculationResult = this.calculateExperienceGain(
        currentExp,
        xpGained,
        isCorrect ? '复习正确' : '复习错误'
      );
      
      // 更新当前经验值
      this.currentExperience = calculationResult.newExperience;
      this.currentLevel = calculationResult.newLevel;
      
      // 处理经验值增益事件
      await this.handleExperienceGain({
        type: 'review',
        xpGained: calculationResult.xpGained,
        leveledUp: calculationResult.leveledUp,
        message: calculationResult.message,
        timestamp: Date.now()
      });
      
      return calculationResult;
    } catch (error) {
      errorHandler.handleError(error, { isCorrect }, {
        type: ErrorType.BUSINESS_LOGIC,
        userMessage: '复习经验值计算失败'
      });
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 智能挑战获得经验值
   */
  public async addSmartChallengeExperience(): Promise<ExperienceGainResult | null> {
    try {
      this.isProcessing = true;
      
      const xpGained = this.experienceConfig.xpRewards.smartChallenge;
      const currentExp = this.currentExperience;
      const calculationResult = this.calculateExperienceGain(
        currentExp,
        xpGained,
        '智能挑战'
      );
      
      // 更新当前经验值
      this.currentExperience = calculationResult.newExperience;
      this.currentLevel = calculationResult.newLevel;
      
      // 处理经验值增益事件
      await this.handleExperienceGain({
        type: 'smartChallenge',
        xpGained: calculationResult.xpGained,
        leveledUp: calculationResult.leveledUp,
        message: calculationResult.message,
        timestamp: Date.now()
      });
      
      return calculationResult;
    } catch (error) {
      console.error('❌ 智能挑战经验值添加失败:', error);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 错词挑战获得经验值
   */
  public async addWrongWordChallengeExperience(): Promise<ExperienceGainResult | null> {
    try {
      this.isProcessing = true;
      
      const xpGained = this.experienceConfig.xpRewards.wrongWordChallenge;
      const currentExp = this.currentExperience;
      const calculationResult = this.calculateExperienceGain(
        currentExp,
        xpGained,
        '错词挑战'
      );
      
      // 更新当前经验值
      this.currentExperience = calculationResult.newExperience;
      this.currentLevel = calculationResult.newLevel;
      
      // 处理经验值增益事件
      await this.handleExperienceGain({
        type: 'wrongWordChallenge',
        xpGained: calculationResult.xpGained,
        leveledUp: calculationResult.leveledUp,
        message: calculationResult.message,
        timestamp: Date.now()
      });
      
      return calculationResult;
    } catch (error) {
      console.error('❌ 错词挑战经验值添加失败:', error);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 收集新单词获得经验值
   */
  public async addNewWordExperience(): Promise<ExperienceGainResult | null> {
    try {
      this.isProcessing = true;
      
      const xpGained = this.experienceConfig.xpRewards.newWord;
      const currentExp = this.currentExperience;
      const calculationResult = this.calculateExperienceGain(
        currentExp,
        xpGained,
        '收集新单词'
      );
      
      // 更新当前经验值
      this.currentExperience = calculationResult.newExperience;
      this.currentLevel = calculationResult.newLevel;
      
      // 处理经验值增益事件
      await this.handleExperienceGain({
        type: 'newWord',
        xpGained: calculationResult.xpGained,
        leveledUp: calculationResult.leveledUp,
        message: calculationResult.message,
        timestamp: Date.now()
      });
      
      return calculationResult;
    } catch (error) {
      console.error('❌ 收集新单词经验值添加失败:', error);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 贡献新词获得经验值
   */
  public async addContributionExperience(): Promise<ExperienceGainResult | null> {
    try {
      this.isProcessing = true;
      
      const xpGained = this.experienceConfig.xpRewards.contribution;
      const currentExp = this.currentExperience;
      const calculationResult = this.calculateExperienceGain(
        currentExp,
        xpGained,
        '贡献新词'
      );
      
      // 更新当前经验值
      this.currentExperience = calculationResult.newExperience;
      this.currentLevel = calculationResult.newLevel;
      
      // 处理经验值增益事件
      await this.handleExperienceGain({
        type: 'contribution',
        xpGained: calculationResult.xpGained,
        leveledUp: calculationResult.leveledUp,
        message: calculationResult.message,
        timestamp: Date.now()
      });
      
      return calculationResult;
    } catch (error) {
      console.error('❌ 贡献新词经验值添加失败:', error);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 连续学习打卡
   */
  public async addDailyCheckinExperience(): Promise<ExperienceGainResult | null> {
    try {
      this.isProcessing = true;
      
      const xpGained = this.experienceConfig.xpRewards.dailyCheckin;
      const currentExp = this.currentExperience;
      const calculationResult = this.calculateExperienceGain(
        currentExp,
        xpGained,
        '连续学习打卡'
      );
      
      // 更新当前经验值
      this.currentExperience = calculationResult.newExperience;
      this.currentLevel = calculationResult.newLevel;
      
      // 处理经验值增益事件
      await this.handleExperienceGain({
        type: 'dailyCheckin',
        xpGained: calculationResult.xpGained,
        leveledUp: calculationResult.leveledUp,
        message: calculationResult.message,
        timestamp: Date.now()
      });
      
      return calculationResult;
    } catch (error) {
      console.error('❌ 连续学习打卡失败:', error);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 完成每日词卡任务
   */
  public async addDailyCardsExperience(): Promise<ExperienceGainResult | null> {
    try {
      this.isProcessing = true;
      
      const xpGained = this.experienceConfig.xpRewards.dailyCards;
      const currentExp = this.currentExperience;
      const calculationResult = this.calculateExperienceGain(
        currentExp,
        xpGained,
        '完成每日词卡'
      );
      
      // 更新当前经验值
      this.currentExperience = calculationResult.newExperience;
      this.currentLevel = calculationResult.newLevel;
      
      // 处理经验值增益事件
      await this.handleExperienceGain({
        type: 'dailyCards',
        xpGained: calculationResult.xpGained,
        leveledUp: calculationResult.leveledUp,
        message: calculationResult.message,
        timestamp: Date.now()
      });
      
      return calculationResult;
    } catch (error) {
      console.error('❌ 完成每日词卡任务失败:', error);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 学习时长奖励
   */
  public async addStudyTimeExperience(minutes: number): Promise<ExperienceGainResult | null> {
    try {
      this.isProcessing = true;
      
      const xpGained = Math.floor(minutes * this.experienceConfig.xpRewards.studyTime);
      const currentExp = this.currentExperience;
      const calculationResult = this.calculateExperienceGain(
        currentExp,
        xpGained,
        '学习时长奖励'
      );
      
      // 更新当前经验值
      this.currentExperience = calculationResult.newExperience;
      this.currentLevel = calculationResult.newLevel;
      
      // 处理经验值增益事件
      await this.handleExperienceGain({
        type: 'studyTime',
        xpGained: calculationResult.xpGained,
        leveledUp: calculationResult.leveledUp,
        message: calculationResult.message,
        timestamp: Date.now()
      });
      
      return calculationResult;
    } catch (error) {
      console.error('❌ 学习时长奖励失败:', error);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 处理经验值获取事件
   */
  private async handleExperienceGain(event: ExperienceGainEvent): Promise<void> {
    try {
      // 更新本地经验值
      this.currentExperience += event.xpGained;
      if (event.leveledUp) {
        this.currentLevel += 1;
      }

      // 记录经验值获取事件
      await this.recordExperienceEvent(event);

      // 触发动画效果
      if (this.config.enableAnimations) {
        await this.triggerExperienceAnimation(event);
      }

      // 显示通知
      if (this.config.enableNotifications) {
        this.showExperienceNotification(event);
      }

      // 播放音效
      if (this.config.enableSound) {
        this.playExperienceSound(event);
      }

      // 自动同步
      if (this.config.autoSync) {
        await this.syncExperienceData();
      }

      console.log(`🎉 经验值获取成功: ${event.message}`);
    } catch (error) {
      console.error('❌ 处理经验值获取事件失败:', error);
    }
  }

  /**
   * 记录经验值获取事件
   */
  private async recordExperienceEvent(event: ExperienceGainEvent): Promise<void> {
    try {
      const events = await this.getExperienceEvents();
      events.push(event);
      
      // 只保留最近100个事件
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      const saveResult = await storageService.setExperienceEvents(events);
      if (!saveResult.success) {
        throw new Error('保存经验值事件失败');
      }
    } catch (error) {
      errorHandler.handleError(error, { event }, {
        type: ErrorType.STORAGE,
        userMessage: '记录经验值事件失败'
      });
    }
  }

  /**
   * 获取经验值事件历史
   */
  public async getExperienceEvents(): Promise<ExperienceGainEvent[]> {
    try {
      const result = await storageService.getExperienceEvents();
      return result.success && result.data ? result.data : [];
    } catch (error) {
      errorHandler.handleError(error, {}, {
        type: ErrorType.STORAGE,
        userMessage: '获取经验值事件失败'
      });
      return [];
    }
  }

  /**
   * 触发经验值动画
   */
  private async triggerExperienceAnimation(event: ExperienceGainEvent): Promise<void> {
    try {
      // 使用动画管理器触发经验值增长动画
      // 计算动画参数
      const oldExperience = this.currentExperience - event.xpGained;
      const oldLevel = this.calculateLevel(oldExperience);
      const newLevel = this.currentLevel;
      const isLevelUp = event.leveledUp;
      
      const oldProgress = this.calculateProgressPercentage(oldExperience);
      const newProgress = this.calculateProgressPercentage(this.currentExperience);
      
      await animationManager.startExperienceAnimation({
        oldExperience,
        newExperience: this.currentExperience,
        gainedExp: event.xpGained,
        oldLevel,
        newLevel,
        isLevelUp,
        oldProgress,
        newProgress
      });
    } catch (error) {
      console.error('❌ 触发经验值动画失败:', error);
    }
  }

  /**
   * 显示经验值通知
   */
  private showExperienceNotification(event: ExperienceGainEvent): void {
    try {
      // 这里可以集成通知系统
      console.log(`📢 经验值通知: ${event.message}`);
    } catch (error) {
      console.error('❌ 显示经验值通知失败:', error);
    }
  }

  /**
   * 播放经验值音效
   */
  private playExperienceSound(event: ExperienceGainEvent): void {
    try {
      // 这里可以集成音效系统
      if (event.leveledUp) {
        console.log('🔊 播放升级音效');
      } else {
        console.log('🔊 播放经验值获取音效');
      }
    } catch (error) {
      console.error('❌ 播放经验值音效失败:', error);
    }
  }

  /**
   * 同步经验值数据
   */
  private async syncExperienceData(): Promise<void> {
    try {
      // 使用统一同步服务记录经验值变更
      await unifiedSyncService.addToSyncQueue({
        type: 'userStats',
        data: {
          experience: this.currentExperience,
          level: this.currentLevel,
          lastUpdated: Date.now()
        },
        userId: await this.getUserId() || '',
        operation: 'update',
        priority: 'high'
      });
    } catch (error) {
      console.error('❌ 同步经验值数据失败:', error);
    }
  }

  /**
   * 获取当前经验值信息 - 本地计算
   */
  public async getCurrentExperienceInfo(): Promise<UserExperienceInfo | null> {
    try {
      // 使用本地计算的经验值信息
      const level = this.currentLevel;
      const experience = this.currentExperience;
      const experienceToNextLevel = this.calculateExpToNextLevel(experience);
      const progressPercentage = this.calculateProgressPercentage(experience);
      
      return {
        level,
        experience,
        experienceToNextLevel,
        progressPercentage,
        totalExperience: experience,
        dailyReviewXP: 0, // 这些值需要从API获取或本地存储
        dailyStudyTimeXP: 0,
        completedDailyCards: false,
        currentStreak: 0,
        contributedWords: 0,
      };
    } catch (error) {
      console.error('❌ 获取当前经验值信息失败:', error);
      return null;
    }
  }

  /**
   * 从API同步经验值信息
   */
  public async syncExperienceFromAPI(): Promise<void> {
    try {
      const apiInfo = await this.getExperienceInfoFromAPI();
      if (apiInfo) {
        this.currentExperience = apiInfo.experience;
        this.currentLevel = apiInfo.level;
        console.log('✅ 从API同步经验值信息成功:', apiInfo);
      }
    } catch (error) {
      console.error('❌ 从API同步经验值信息失败:', error);
    }
  }

  /**
   * 获取经验值获取方式说明 - API调用
   */
  public async getExperienceWays() {
    try {
      return await this.getExperienceWaysFromAPI();
    } catch (error) {
      console.error('❌ 获取经验值获取方式失败:', error);
      return null;
    }
  }

  /**
   * 检查是否正在处理
   */
  public isProcessingExperience(): boolean {
    return this.isProcessing;
  }

  /**
   * 获取今日经验值统计
   */
  public async getTodayExperienceStats(): Promise<{
    totalXP: number;
    events: ExperienceGainEvent[];
    byType: Record<string, number>;
  }> {
    try {
      const events = await this.getExperienceEvents();
      const today = new Date();
      const todayEvents = events.filter(event => {
        const eventDate = new Date(event.timestamp);
        return eventDate.getDate() === today.getDate() &&
               eventDate.getMonth() === today.getMonth() &&
               eventDate.getFullYear() === today.getFullYear();
      });

      const totalXP = todayEvents.reduce((sum, event) => sum + event.xpGained, 0);
      const byType: Record<string, number> = {};

      todayEvents.forEach(event => {
        byType[event.type] = (byType[event.type] || 0) + event.xpGained;
      });

      return {
        totalXP,
        events: todayEvents,
        byType
      };
    } catch (error) {
      console.error('❌ 获取今日经验值统计失败:', error);
      return {
        totalXP: 0,
        events: [],
        byType: {}
      };
    }
  }

  /**
   * 清除经验值事件历史
   */
  public async clearExperienceEvents(): Promise<void> {
    try {
      const result = await storageService.removeItem('experienceEvents');
      if (!result.success) {
        throw new Error('清除经验值事件失败');
      }
      console.log('🧹 经验值事件历史已清除');
    } catch (error) {
      errorHandler.handleError(error, {}, {
        type: ErrorType.STORAGE,
        userMessage: '清除经验值事件失败'
      });
    }
  }

  /**
   * 获取用户ID
   */
  private async getUserId(): Promise<string | null> {
    try {
      const result = await storageService.getUserData();
      if (result.success && result.data) {
        return result.data.id || null;
      }
      return null;
    } catch (error) {
      errorHandler.handleError(error, {}, {
        type: ErrorType.STORAGE,
        userMessage: '获取用户ID失败'
      });
      return null;
    }
  }
}

// 导出单例实例
export const experienceManager = ExperienceManager.getInstance(); 