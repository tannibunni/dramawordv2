import { ExperienceService, ExperienceGainResult } from './experienceService';
import { animationManager } from './animationManager';
import { unifiedSyncService } from './unifiedSyncService';
import { storageService } from './storageService';
import { errorHandler, ErrorType } from '../utils/errorHandler';
import { experienceCalculationService } from './experienceCalculationService';
import type { 
  UserExperienceInfo, 
  ExperienceEvent, 
  ExperienceGainResult as CalculationResult 
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

export class ExperienceManager {
  private static instance: ExperienceManager;
  private config: ExperienceManagerConfig;
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
  }

  public static getInstance(): ExperienceManager {
    if (!ExperienceManager.instance) {
      ExperienceManager.instance = new ExperienceManager();
    }
    return ExperienceManager.instance;
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
   * 复习单词获得经验值
   */
  public async addReviewExperience(isCorrect: boolean = true): Promise<ExperienceGainResult | null> {
    try {
      this.isProcessing = true;
      
      // 使用计算服务计算经验值
      const xpGained = experienceCalculationService.calculateReviewExperience(isCorrect);
      const currentExp = this.currentExperience;
      const calculationResult = experienceCalculationService.calculateExperienceGain(
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
      
      const result = await ExperienceService.addSmartChallengeExperience();
      
      if (result && result.success) {
        await this.handleExperienceGain({
          type: 'smartChallenge',
          xpGained: result.xpGained,
          leveledUp: result.leveledUp,
          message: result.message,
          timestamp: Date.now()
        });
      }
      
      return result;
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
      
      const result = await ExperienceService.addWrongWordChallengeExperience();
      
      if (result && result.success) {
        await this.handleExperienceGain({
          type: 'wrongWordChallenge',
          xpGained: result.xpGained,
          leveledUp: result.leveledUp,
          message: result.message,
          timestamp: Date.now()
        });
      }
      
      return result;
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
      
      const result = await ExperienceService.addNewWordExperience();
      
      if (result && result.success) {
        await this.handleExperienceGain({
          type: 'newWord',
          xpGained: result.xpGained,
          leveledUp: result.leveledUp,
          message: result.message,
          timestamp: Date.now()
        });
      }
      
      return result;
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
      
      const result = await ExperienceService.addContributionExperience();
      
      if (result && result.success) {
        await this.handleExperienceGain({
          type: 'contribution',
          xpGained: result.xpGained,
          leveledUp: result.leveledUp,
          message: result.message,
          timestamp: Date.now()
        });
      }
      
      return result;
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
      
      const result = await ExperienceService.dailyCheckin();
      
      if (result && result.success) {
        await this.handleExperienceGain({
          type: 'dailyCheckin',
          xpGained: result.xpGained,
          leveledUp: result.leveledUp,
          message: result.message,
          timestamp: Date.now()
        });
      }
      
      return result;
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
      
      const result = await ExperienceService.completeDailyCards();
      
      if (result && result.success) {
        await this.handleExperienceGain({
          type: 'dailyCards',
          xpGained: result.xpGained,
          leveledUp: result.leveledUp,
          message: result.message,
          timestamp: Date.now()
        });
      }
      
      return result;
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
      
      const result = await ExperienceService.addStudyTime(minutes);
      
      if (result && result.success) {
        await this.handleExperienceGain({
          type: 'studyTime',
          xpGained: result.xpGained,
          leveledUp: result.leveledUp,
          message: result.message,
          timestamp: Date.now()
        });
      }
      
      return result;
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
      
      const oldProgress = this.calculateProgress(oldExperience, oldLevel);
      const newProgress = this.calculateProgress(this.currentExperience, newLevel);
      
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
   * 获取当前经验值信息
   */
  public async getCurrentExperienceInfo(): Promise<UserExperienceInfo | null> {
    try {
      return await ExperienceService.getExperienceInfo();
    } catch (error) {
      console.error('❌ 获取当前经验值信息失败:', error);
      return null;
    }
  }

  /**
   * 获取经验值获取方式说明
   */
  public async getExperienceWays() {
    try {
      return await ExperienceService.getExperienceWays();
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
   * 计算等级
   */
  private calculateLevel(experience: number): number {
    return Math.floor(experience / 100) + 1;
  }

  /**
   * 计算进度
   */
  private calculateProgress(experience: number, level: number): number {
    const levelStartExp = (level - 1) * 100;
    const levelExp = experience - levelStartExp;
    return Math.min(levelExp / 100, 1);
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