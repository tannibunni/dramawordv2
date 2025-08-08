import AsyncStorage from '@react-native-async-storage/async-storage';
import { unifiedSyncService } from '../../../services/unifiedSyncService';
import { animationManager } from '../../../services/animationManager';
import { 
  IExperienceManager, 
  UserExperienceInfo, 
  ExperienceGainResult, 
  ExperienceEvent,
  ExperienceEventType,
  LevelInfo,
  ExperienceConfig
} from '../../../types/experience';

// ==================== 类型定义 ====================

// 经验值状态接口
export interface ExperienceState {
  userExperienceInfo: UserExperienceInfo | null;
  isLoadingExperience: boolean;
  progressBarValue: number;
  hasCheckedExperience: boolean;
  animatedExperience: number;
  isProgressBarAnimating: boolean;
  hasInitializedProgressBar: boolean;
  isSyncingExperience: boolean;
  animatedCollectedWords: number;
  animatedContributedWords: number;
}

// 经验值状态更新回调
export type ExperienceStateCallback = (state: Partial<ExperienceState>) => void;

// ==================== 配置常量 ====================

// 统一经验值配置 - 所有用户使用相同配置
const EXPERIENCE_CONFIG: ExperienceConfig = {
  baseXP: 50,  // 标准配置
      levelMultiplier: 1.5,
      dailyLimits: {
    review: 50,
    smartChallenge: 10,
    wrongWordChallenge: 20,
    newWord: 30,
    contribution: 5,
    dailyCheckin: 1,
    dailyCards: 1,
    studyTime: 60
      },
      xpRewards: {
    review: { correct: 2, incorrect: 1 },
    smartChallenge: 5,
    wrongWordChallenge: 3,
    newWord: 4,
    contribution: 10,
    dailyCheckin: 5,
    dailyCards: 10,
    studyTime: 1
  }
};

// ==================== 经验值管理器类 ====================

class ExperienceManager implements IExperienceManager {
  private static instance: ExperienceManager;
  private isProcessing: boolean = false;
  private config: ExperienceConfig = EXPERIENCE_CONFIG;
  
  // 防重复触发机制
  private lastProcessedEvents: Map<string, number> = new Map();
  private readonly EVENT_COOLDOWN = 1000; // 1秒冷却时间

  // 经验值状态管理
  private experienceState: ExperienceState = {
    userExperienceInfo: null,
    isLoadingExperience: true,
    progressBarValue: 0,
    hasCheckedExperience: false,
    animatedExperience: 0,
    isProgressBarAnimating: false,
    hasInitializedProgressBar: false,
    isSyncingExperience: false,
    animatedCollectedWords: 0,
    animatedContributedWords: 0
  };

  private stateCallbacks: ExperienceStateCallback[] = [];

  private constructor() {}

  public static getInstance(): ExperienceManager {
    if (!ExperienceManager.instance) {
      ExperienceManager.instance = new ExperienceManager();
    }
    return ExperienceManager.instance;
  }

  // ==================== 经验值计算 ====================

  // 计算等级
  private calculateLevel(experience: number): number {
    return Math.floor(experience / this.config.baseXP) + 1;
  }

  // 计算当前等级所需经验值
  private calculateLevelRequiredExp(level: number): number {
    return this.config.baseXP * Math.pow(this.config.levelMultiplier, level - 1);
  }

  // 计算升级所需经验值
  private calculateExpToNextLevel(experience: number): number {
    const currentLevel = this.calculateLevel(experience);
    const requiredExp = this.calculateLevelRequiredExp(currentLevel);
    const currentLevelExp = experience % requiredExp;
    return requiredExp - currentLevelExp;
  }

  // 计算进度百分比
  public calculateProgressPercentage(experience: number): number {
    const currentLevel = this.calculateLevel(experience);
    const requiredExp = this.calculateLevelRequiredExp(currentLevel);
    const currentLevelExp = experience % requiredExp;
    return currentLevelExp / requiredExp;
  }

  // 检查是否升级
  private checkLevelUp(oldExperience: number, newExperience: number): {
    leveledUp: boolean;
    oldLevel: number;
    newLevel: number;
    levelsGained: number;
  } {
    const oldLevel = this.calculateLevel(oldExperience);
    const newLevel = this.calculateLevel(newExperience);
    const leveledUp = newLevel > oldLevel;
    const levelsGained = newLevel - oldLevel;

    return {
      leveledUp,
      oldLevel,
      newLevel,
      levelsGained
    };
  }

  // 计算等级信息
  private calculateLevelInfo(experience: number): LevelInfo {
    const level = this.calculateLevel(experience);
    const experienceToNextLevel = this.calculateExpToNextLevel(experience);
    const progressPercentage = this.calculateProgressPercentage(experience);
    const requiredExp = this.calculateLevelRequiredExp(level);

    return {
      level,
      experience,
      experienceToNextLevel,
      progressPercentage,
      totalExperience: experience,
      levelName: `Level ${level}`,
      levelColor: this.getLevelColor(level)
    };
  }

  // 获取等级颜色
  private getLevelColor(level: number): string {
    if (level <= 5) return '#4CAF50'; // 绿色
    if (level <= 10) return '#2196F3'; // 蓝色
    if (level <= 20) return '#9C27B0'; // 紫色
    if (level <= 30) return '#FF9800'; // 橙色
    return '#F44336'; // 红色
  }

  // ==================== 数据获取 ====================

  // 获取当前经验值信息
  public async getCurrentExperienceInfo(): Promise<UserExperienceInfo | null> {
    try {
      // 1. 首先尝试从本地存储获取
      const userStatsData = await AsyncStorage.getItem('userStats');
      let userStats = null;
      let hasLocalData = false;

      if (userStatsData) {
        try {
          userStats = JSON.parse(userStatsData);
          hasLocalData = true;
          console.log('[experienceManager] 从本地存储获取到用户数据:', userStats);
        } catch (parseError) {
          console.error('[experienceManager] 解析本地存储数据失败:', parseError);
        }
      }

      // 2. 如果本地存储为空或经验值为0，尝试从云端同步
      if (!hasLocalData || !userStats || userStats.experience === 0) {
        console.log('[experienceManager] 本地存储为空或经验值为0，尝试从云端同步');
        
        try {
          // 强制同步云端数据
          const syncResult = await unifiedSyncService.forceSync();
          if (syncResult.success) {
            console.log('[experienceManager] 云端同步成功');
            
            // 重新从本地存储获取（同步后可能已更新）
            const updatedUserStatsData = await AsyncStorage.getItem('userStats');
            if (updatedUserStatsData) {
              userStats = JSON.parse(updatedUserStatsData);
              hasLocalData = true;
              console.log('[experienceManager] 同步后获取到用户数据:', userStats);
            }
          } else {
            console.log('[experienceManager] 云端同步失败:', syncResult.message);
          }
        } catch (syncError) {
          console.error('[experienceManager] 云端同步出错:', syncError);
        }
      }

      // 3. 如果仍然没有数据，返回默认经验值信息（新用户）
      if (!hasLocalData || !userStats) {
        console.log('[experienceManager] 没有找到用户经验值数据，返回默认经验值信息');
        return {
          level: 1,
          experience: 0,
          experienceToNextLevel: 100,
          progressPercentage: 0,
          totalExperience: 0,
          dailyReviewXP: 0,
          dailyStudyTimeXP: 0,
          completedDailyCards: false,
          currentStreak: 0,
          contributedWords: 0
        };
      }

      // 4. 构建用户经验值信息
      const experience = userStats.experience || 0;
      const level = this.calculateLevel(experience);
      const experienceToNextLevel = this.calculateExpToNextLevel(experience);
      const progressPercentage = this.calculateProgressPercentage(experience);
      
      const experienceInfo = {
        level,
        experience,
        experienceToNextLevel,
        progressPercentage,
        totalExperience: experience,
        dailyReviewXP: userStats.dailyReviewXP || 0,
        dailyStudyTimeXP: userStats.dailyStudyTimeXP || 0,
        completedDailyCards: userStats.completedDailyCards || false,
        currentStreak: userStats.currentStreak || 0,
        contributedWords: userStats.contributedWords || 0
      };

      console.log('[experienceManager] 构建的用户经验值信息:', experienceInfo);
      return experienceInfo;
    } catch (error) {
      console.error('[experienceManager] 获取经验值信息失败:', error);
      return null;
    }
  }

  // ==================== 经验值增益处理 ====================

  // 添加经验值
  private async addExperience(
    xpToGain: number, 
    eventType: ExperienceEventType,
    metadata?: Record<string, any>
  ): Promise<ExperienceGainResult | null> {
    // 防重复触发检查
    const eventKey = `${eventType}_${JSON.stringify(metadata)}`;
    const now = Date.now();
    const lastProcessed = this.lastProcessedEvents.get(eventKey);
    
    if (lastProcessed && (now - lastProcessed) < this.EVENT_COOLDOWN) {
      console.log('[experienceManager] 事件冷却中，跳过重复触发:', eventKey);
      return null;
    }

    if (this.isProcessing) {
      console.log('[experienceManager] 经验值处理中，跳过重复请求');
      return null;
    }

    try {
      this.isProcessing = true;
      console.log('[experienceManager] 开始处理经验值增益:', { xpToGain, eventType, metadata });

      // 清理过期事件记录
      this.cleanupExpiredEvents();

      // 记录事件处理时间
      this.lastProcessedEvents.set(eventKey, now);

      // 获取当前经验值信息（确保获取最新数据）
      const currentInfo = await this.getCurrentExperienceInfo();
      const currentExperience = currentInfo?.experience || 0;
      
      console.log('[experienceManager] 当前经验值:', currentExperience, '即将增加:', xpToGain);

      // 处理经验值增益
      const result = await this.processExperienceGain(
        currentExperience, 
        xpToGain, 
        eventType, 
        metadata
      );

      console.log('[experienceManager] 经验值增益处理完成:', result);
      return result;
    } catch (error) {
      console.error('[experienceManager] 添加经验值失败:', error);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  // 处理经验值增益
  private async processExperienceGain(
    currentExperience: number,
    xpToGain: number,
    eventType: ExperienceEventType,
    metadata?: Record<string, any>
  ): Promise<ExperienceGainResult> {
    console.log('[experienceManager] 处理经验值增益:', {
      currentExperience,
      xpToGain,
      eventType,
      metadata
    });

    const newExperience = currentExperience + xpToGain;
    const levelUpInfo = this.checkLevelUp(currentExperience, newExperience);
    const newLevelInfo = this.calculateLevelInfo(newExperience);

    console.log('[experienceManager] 经验值计算结果:', {
      newExperience,
      levelUpInfo,
      newLevelInfo
    });

    // 创建经验值事件
    const event: ExperienceEvent = {
      type: eventType,
      xpGained: xpToGain,
      leveledUp: levelUpInfo.leveledUp,
      message: `获得 ${xpToGain} 经验值`,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        config: this.config
      }
    };

    // 更新本地存储
    const userStatsData = await AsyncStorage.getItem('userStats');
    const userStats = userStatsData ? JSON.parse(userStatsData) : {};
    
    const updatedStats = {
      ...userStats,
      experience: newExperience,
      level: newLevelInfo.level,
      lastUpdated: Date.now()
    };

    console.log('[experienceManager] 更新本地存储:', {
      oldExperience: userStats.experience,
      newExperience,
      oldLevel: userStats.level,
      newLevel: newLevelInfo.level
    });

    await AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));

    // 添加到同步队列
    await unifiedSyncService.addToSyncQueue({
      type: 'experience',
      data: {
        experience: newExperience,
        level: newLevelInfo.level,
      event
      },
      userId: userStats.userId || 'guest',
      operation: 'update',
      priority: 'high',
      xpGained: xpToGain,
      leveledUp: levelUpInfo.leveledUp,
      level: newLevelInfo.level
    });

    const result = {
      success: true,
      xpGained: xpToGain,
      newLevel: newLevelInfo.level,
      leveledUp: levelUpInfo.leveledUp,
      message: levelUpInfo.leveledUp ? '恭喜升级！' : '获得经验值！',
      oldLevel: levelUpInfo.oldLevel,
      oldExperience: currentExperience,
      newExperience,
      progressChange: newLevelInfo.progressPercentage - this.calculateProgressPercentage(currentExperience)
    };

    console.log('[experienceManager] 经验值增益处理完成:', result);
    return result;
  }

  // ==================== 经验值增益接口实现 ====================

  public async addReviewExperience(isCorrect: boolean = true): Promise<ExperienceGainResult | null> {
    const xpToGain = isCorrect ? this.config.xpRewards.review.correct : this.config.xpRewards.review.incorrect;
    return this.addExperience(xpToGain, 'review', { isCorrect });
  }

  // 添加复习总经验值
  public async addReviewTotalExperience(totalExperience: number): Promise<ExperienceGainResult | null> {
    console.log('[experienceManager] 添加复习总经验值:', totalExperience);
    return this.addExperience(totalExperience, 'review', { totalExperience });
  }

  public async addSmartChallengeExperience(): Promise<ExperienceGainResult | null> {
    return this.addExperience(this.config.xpRewards.smartChallenge, 'smartChallenge');
  }

  public async addWrongWordChallengeExperience(): Promise<ExperienceGainResult | null> {
    console.log('[experienceManager] 添加错词卡经验值');
    return this.addExperience(this.config.xpRewards.wrongWordChallenge, 'wrongWordChallenge');
  }

  // 计算复习总经验值
  public calculateReviewTotalExperience(actions: Array<{ remembered: boolean }>): number {
    let totalExperience = 0;
    
    actions.forEach(action => {
      if (action.remembered) {
        totalExperience += this.config.xpRewards.review.correct;
      } else {
        totalExperience += this.config.xpRewards.review.incorrect;
      }
    });
    
    console.log('[experienceManager] 计算复习总经验值:', {
      totalActions: actions.length,
      totalExperience,
      actions: actions.map(a => ({ remembered: a.remembered }))
    });
    
    return totalExperience;
  }

  // 获取错词挑战经验值
  public getWrongWordChallengeExperience(): number {
    return this.config.xpRewards.wrongWordChallenge;
  }

  // 获取智能挑战经验值
  public getSmartChallengeExperience(): number {
    return this.config.xpRewards.smartChallenge;
  }

  public async addNewWordExperience(): Promise<ExperienceGainResult | null> {
    return this.addExperience(this.config.xpRewards.newWord, 'newWord');
  }

  public async addContributionExperience(): Promise<ExperienceGainResult | null> {
    return this.addExperience(this.config.xpRewards.contribution, 'contribution');
  }

  public async addDailyCheckinExperience(): Promise<ExperienceGainResult | null> {
    return this.addExperience(this.config.xpRewards.dailyCheckin, 'dailyCheckin');
  }

  public async addDailyCardsExperience(): Promise<ExperienceGainResult | null> {
    return this.addExperience(this.config.xpRewards.dailyCards, 'dailyCards');
  }

  public async addStudyTimeExperience(minutes: number): Promise<ExperienceGainResult | null> {
    const xpToGain = Math.floor(minutes * this.config.xpRewards.studyTime);
    return this.addExperience(xpToGain, 'studyTime', { minutes });
  }

  // ==================== 事件管理 ====================

  public async getExperienceEvents(): Promise<ExperienceEvent[]> {
    try {
      const eventsData = await AsyncStorage.getItem('experienceEvents');
      return eventsData ? JSON.parse(eventsData) : [];
    } catch (error) {
      console.error('获取经验值事件失败:', error);
      return [];
    }
  }

  public async clearExperienceEvents(): Promise<void> {
    try {
      await AsyncStorage.removeItem('experienceEvents');
    } catch (error) {
      console.error('清除经验值事件失败:', error);
    }
  }

  public isProcessingExperience(): boolean {
    return this.isProcessing;
  }

  // 清理过期的事件记录
  private cleanupExpiredEvents(): void {
    const now = Date.now();
    const expiredEvents: string[] = [];
    
    this.lastProcessedEvents.forEach((timestamp, eventKey) => {
      if ((now - timestamp) > this.EVENT_COOLDOWN) {
        expiredEvents.push(eventKey);
      }
    });
    
    expiredEvents.forEach(eventKey => {
      this.lastProcessedEvents.delete(eventKey);
    });
    
    if (expiredEvents.length > 0) {
      console.log('[experienceManager] 清理过期事件记录:', expiredEvents.length);
    }
  }

  // ==================== 状态管理 ====================

  // 注册状态更新回调
  public registerStateCallback(callback: ExperienceStateCallback): () => void {
    this.stateCallbacks.push(callback);
    return () => {
      const index = this.stateCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateCallbacks.splice(index, 1);
      }
    };
  }

  // 更新状态并通知回调
  private updateState(updates: Partial<ExperienceState>): void {
    this.experienceState = { ...this.experienceState, ...updates };
    this.stateCallbacks.forEach(callback => callback(updates));
  }

  // 获取当前状态
  public getExperienceState(): ExperienceState {
    return { ...this.experienceState };
  }

  // ==================== 动画管理（使用animationManager） ====================
  
  // 开始经验值动画
  public async startExperienceAnimation(
    gainedExp: number,
    currentExp: number,
    onProgressUpdate?: (currentExp: number, progress: number) => void,
    onComplete?: (finalExp: number, finalLevel: number) => void
  ): Promise<void> {
    const newExp = currentExp + gainedExp;
    const oldLevel = this.calculateLevel(currentExp);
    const newLevel = this.calculateLevel(newExp);
    const isLevelUp = newLevel > oldLevel;
    const oldProgress = this.calculateProgressPercentage(currentExp);
    const newProgress = this.calculateProgressPercentage(newExp);

    // 使用animationManager处理动画
    animationManager.startExperienceAnimation({
      oldExperience: currentExp,
      newExperience: newExp,
      gainedExp,
      oldLevel,
      newLevel,
      isLevelUp,
      oldProgress,
      newProgress
    }, {
      onStart: () => {
        console.log('[experienceManager] 开始经验值动画');
      },
      onProgress: (currentExpValue, currentProgress) => {
        // 更新状态
        this.updateState({
          animatedExperience: currentExpValue,
          progressBarValue: currentProgress
        });
        
        if (onProgressUpdate) {
          onProgressUpdate(currentExpValue, currentProgress);
        }
      },
      onComplete: (finalExp, finalProgress) => {
        // 更新本地存储
        this.updateLocalExperience(finalExp, this.calculateLevel(finalExp));
        
        // 更新状态
        this.updateState({
          isProgressBarAnimating: false,
          hasCheckedExperience: true,
          animatedExperience: finalExp,
          progressBarValue: finalProgress
        });

        if (onComplete) {
          onComplete(finalExp, this.calculateLevel(finalExp));
        }
      }
    });
  }

  // 更新本地经验值数据
  private async updateLocalExperience(experience: number, level: number): Promise<void> {
    try {
      const userStatsData = await AsyncStorage.getItem('userStats');
      const userStats = userStatsData ? JSON.parse(userStatsData) : {};
      
      const updatedStats = {
        ...userStats,
        experience,
        level,
        lastUpdated: Date.now()
      };
      
      await AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));
    } catch (error) {
      console.error('更新本地经验值数据失败:', error);
    }
  }

  // ==================== 导航参数检查 ====================
  
  // 检查是否有经验值增益的导航参数
  public async checkForExperienceGainFromNavigation(): Promise<{
    hasExperienceGain: boolean;
    experienceGained?: number;
  }> {
    try {
      const navigationParams = await AsyncStorage.getItem('navigationParams');
      if (navigationParams) {
        const params = JSON.parse(navigationParams);
        if (params.showExperienceAnimation && params.experienceGained) {
          // 清除参数
          await AsyncStorage.removeItem('navigationParams');
          
          return {
            hasExperienceGain: true,
            experienceGained: params.experienceGained
          };
        }
      }
      
      return { hasExperienceGain: false };
    } catch (error) {
      console.error('检查导航参数失败:', error);
      return { hasExperienceGain: false };
    }
  }

  // ==================== 经验值加载和初始化 ====================
  
  // 加载用户经验值信息
  public async loadUserExperienceInfo(vocabularyLength: number = 0): Promise<void> {
    try {
      console.log('[experienceManager] 开始加载用户经验值信息');
      this.updateState({ isLoadingExperience: true });
      
      // 使用经验值管理器获取信息（包含云端同步逻辑）
      const experienceInfo = await this.getCurrentExperienceInfo();
      
      if (experienceInfo) {
        console.log('[experienceManager] 成功加载用户经验值信息:', JSON.stringify(experienceInfo));
        // 若动画管理器正在动画或内部有更高的进度，保持当前 animated 值，避免瞬跳
        const preserveAnimated = this.experienceState.isProgressBarAnimating || animationManager.isAnimatingNow();
        this.updateState({
          userExperienceInfo: experienceInfo,
          animatedExperience: preserveAnimated ? this.experienceState.animatedExperience : experienceInfo.experience,
          animatedCollectedWords: vocabularyLength,
          animatedContributedWords: experienceInfo.contributedWords || 0
        });
      } else {
        // 如果经验值管理器没有数据，说明用户还没有任何学习记录
        console.log('[experienceManager] 用户还没有学习记录，经验值为0');
        
        // 不创建默认数据，让用户通过实际学习获得经验值
        this.updateState({
          userExperienceInfo: null,
          animatedExperience: 0,
          animatedCollectedWords: vocabularyLength,
          animatedContributedWords: 0
        });
      }
    } catch (error) {
      console.error('[experienceManager] 加载用户经验值信息失败:', error);
      // 发生错误时，设置为空状态
      this.updateState({
        userExperienceInfo: null,
        animatedExperience: 0,
        animatedCollectedWords: vocabularyLength,
        animatedContributedWords: 0
      });
    } finally {
      this.updateState({ isLoadingExperience: false });
    }
  }

  // 初始化经验值状态
  public initializeExperienceState(): void {
    this.updateState({
      hasCheckedExperience: false,
      isProgressBarAnimating: false
    });
  }

  // ==================== 经验值进度条管理 ====================
  
  // 更新进度条
  public updateProgressBar(progress: number): void {
    this.updateState({ progressBarValue: progress });
  }

  // ==================== 经验值动画状态管理 ====================
  
  // 开始经验值动画（带状态管理）
  public async startExperienceAnimationWithState(
    gainedExp: number,
    onProgressUpdate?: (currentExp: number, progress: number) => void,
    onComplete?: (finalExp: number, finalLevel: number) => void
  ): Promise<void> {
    const { userExperienceInfo } = this.experienceState;
    if (!userExperienceInfo) return;

    // 使用当前经验值作为起始值，避免进度条倒退
    const startExperience = userExperienceInfo.experience;
    
    console.log('[experienceManager] 开始经验值动画状态:', {
      currentExperience: userExperienceInfo.experience,
      gainedExp,
      startExperience,
      finalExperience: userExperienceInfo.experience + gainedExp
    });

    this.updateState({
      isProgressBarAnimating: true,
      // 仅当当前 animatedExperience 小于起始经验时才对齐，避免回退
      animatedExperience: Math.max(this.experienceState.animatedExperience, startExperience)
    });

    await this.startExperienceAnimation(
      gainedExp,
      startExperience,  // 使用当前值作为起始值
      onProgressUpdate,
      onComplete
    );
  }

  // ==================== 统计数字管理 ====================
  
  // 更新统计数字（基础版本）
  public updateStatistics(vocabularyLength: number = 0): void {
    console.log('[experienceManager] 更新统计数字...');
    const { userExperienceInfo } = this.experienceState;
    const collectedCount = vocabularyLength;
    const contributedCount = userExperienceInfo?.contributedWords || 0;
    
    console.log('[experienceManager] 当前贡献词数:', contributedCount);
    console.log('[experienceManager] 当前userExperienceInfo:', userExperienceInfo);
    console.log('[experienceManager] 设置动画贡献词数:', contributedCount);
    
    this.updateState({
      animatedCollectedWords: collectedCount,
      animatedContributedWords: contributedCount
    });
  }

  // 检查经验值增益（带状态管理）
  public async checkForExperienceGainWithState(): Promise<boolean> {
    const { hasCheckedExperience, isSyncingExperience, isProgressBarAnimating } = this.experienceState;
    
    if (hasCheckedExperience || isSyncingExperience || isProgressBarAnimating) {
      console.log('[experienceManager] 已检查过经验值增益或正在同步/动画，跳过重复检查');
      return false;
    }
    
    this.updateState({ isSyncingExperience: true });
    
    try {
      // 使用 experienceManager 检查导航参数
      const { hasExperienceGain, experienceGained } = await this.checkForExperienceGainFromNavigation();
      
      if (hasExperienceGain && experienceGained) {
        console.log('[experienceManager] 满足经验值动画条件，开始处理:', { experienceGained });
        
        // 开始经验值动画
        await this.startExperienceAnimationWithState(experienceGained);
      }
      
      this.updateState({ hasCheckedExperience: true });
      return hasExperienceGain;
    } catch (error) {
      console.error('[experienceManager] 检查经验值增益失败:', error);
      this.updateState({ hasCheckedExperience: true });
      return false;
    } finally {
      this.updateState({ isSyncingExperience: false });
    }
  }

  // ==================== 经验值进度条和增益检查管理 ====================
  
  // 初始化经验值进度条（带回调）
  public initializeProgressBarWithCallback(
    onProgressUpdate?: (progressPercentage: number) => void
  ): void {
    const { userExperienceInfo } = this.experienceState;
    if (userExperienceInfo) {
      // 如果正在动画，使用 animatedExperience 计算当前进度，避免初始化时跳到“最终进度”
      const isAnimating = this.experienceState.isProgressBarAnimating || animationManager.isAnimatingNow();
      const progressSourceExp = isAnimating
        ? this.experienceState.animatedExperience
        : userExperienceInfo.experience;
      const currentProgress = this.calculateProgressPercentage(progressSourceExp);
      const progressPercentage = currentProgress * 100;
      
      console.log('[experienceManager] 初始化进度条:', {
        experience: userExperienceInfo.experience,
        level: userExperienceInfo.level,
        progress: currentProgress,
        percentage: progressPercentage
      });
      
      // 如果动画尚在进行，不要回写 state 的 progressBarValue，以免覆盖动画进度
      if (!this.experienceState.isProgressBarAnimating && !animationManager.isAnimatingNow()) {
        this.updateState({
          progressBarValue: currentProgress,
          hasInitializedProgressBar: true
        });
      } else {
        this.updateState({ hasInitializedProgressBar: true });
      }

      // 回调更新进度条
      if (onProgressUpdate) {
        onProgressUpdate(progressPercentage);
      }
    }
  }

  // 检查经验值增益（带延迟和回调）
  public async checkForExperienceGainWithDelay(
    delay: number = 500,
    onCheckStart?: () => void,
    onCheckComplete?: (hasGain: boolean) => void
  ): Promise<void> {
    const { hasCheckedExperience, isSyncingExperience } = this.experienceState;
    
    if (hasCheckedExperience || isSyncingExperience) {
      console.log('[experienceManager] 已检查过经验值增益或正在同步，跳过重复检查');
      return;
    }

    // 延迟检查
    setTimeout(async () => {
      if (!this.experienceState.hasCheckedExperience && !this.experienceState.isSyncingExperience) {
        if (onCheckStart) {
          onCheckStart();
        }
        
        const hasGain = await this.checkForExperienceGainWithState();
        
        if (onCheckComplete) {
          onCheckComplete(hasGain);
        }
      }
    }, delay);
  }

  // 自动管理经验值状态（整合初始化、加载、检查等功能）
  public async autoManageExperienceState(
    vocabularyLength: number = 0,
    onProgressUpdate?: (progressPercentage: number) => void,
    onCheckComplete?: (hasGain: boolean) => void
  ): Promise<void> {
    // 1. 初始化状态
    this.initializeExperienceState();
    
    // 2. 加载用户经验值信息
    await this.loadUserExperienceInfo(vocabularyLength);
    
    // 3. 初始化进度条
    this.initializeProgressBarWithCallback(onProgressUpdate);
    
    // 4. 检查经验值增益
    await this.checkForExperienceGainWithDelay(500, undefined, onCheckComplete);
  }

  // ==================== 统计数字和动画管理 ====================
  
  // 更新统计数字（带动画）
  public updateStatisticsWithAnimation(
    vocabularyLength: number = 0,
    onAnimationStart?: () => void,
    onAnimationComplete?: () => void
  ): void {
    console.log('[experienceManager] 更新统计数字（带动画）...');
    const { userExperienceInfo } = this.experienceState;
    const collectedCount = vocabularyLength;
    const contributedCount = userExperienceInfo?.contributedWords || 0;
    
    console.log('[experienceManager] 当前贡献词数:', contributedCount);
    console.log('[experienceManager] 当前userExperienceInfo:', userExperienceInfo);
    console.log('[experienceManager] 设置动画贡献词数:', contributedCount);
    
    // 更新状态
    this.updateState({
      animatedCollectedWords: collectedCount,
      animatedContributedWords: contributedCount
    });

    // 使用animationManager处理统计数字动画
    animationManager.startStatisticsAnimation(collectedCount, contributedCount, {
      duration: 1500
    });

    // 触发动画开始回调
    if (onAnimationStart) {
      onAnimationStart();
    }

    // 模拟动画完成
    setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 1500);
  }

  // 获取统计数字
  public getStatistics(): {
    collectedWords: number;
    contributedWords: number;
    totalExperience: number;
    currentStreak: number;
  } {
    const { userExperienceInfo, animatedCollectedWords, animatedContributedWords } = this.experienceState;
    
    return {
      collectedWords: animatedCollectedWords,
      contributedWords: animatedContributedWords,
      totalExperience: userExperienceInfo?.totalExperience || 0,
      currentStreak: userExperienceInfo?.currentStreak || 0
    };
  }

  // ==================== 兼容方法 ====================
  
  // 计算经验值进度（兼容旧版本）
  public calculateExperienceProgress(experience: number, level: number): number {
    return this.calculateProgressPercentage(experience);
  }

  // 获取当前等级所需经验值（兼容旧版本）
  public getCurrentLevelRequiredExp(level: number): number {
    return this.calculateLevelRequiredExp(level);
  }

  // ==================== 页面统一管理 ====================
  
  // 统一管理页面经验值状态
  public async managePageExperience(
    vocabularyLength: number = 0,
    progressBarAnimation: any,
    onProgressUpdate?: (progressPercentage: number) => void,
    onCheckComplete?: (hasGain: boolean) => void
  ): Promise<{
    experienceState: ExperienceState;
    progressBarAnimation: any;
    unsubscribe: () => void;
  }> {
    console.log('[experienceManager] 开始统一管理页面经验值状态');
    
    // 1. 初始化状态
    this.initializeExperienceState();
    
    // 2. 加载用户经验值信息
    await this.loadUserExperienceInfo(vocabularyLength);
    
    // 3. 初始化进度条
    this.initializeProgressBarWithCallback((progressPercentage) => {
      // 只在非动画状态下更新进度条，避免干扰正在进行的动画
      if (!this.experienceState.isProgressBarAnimating) {
        // 同步 AnimationManager 内部记录，避免后续动画出现先回退再增长
        animationManager.setProgressBarImmediate(progressPercentage);
        
        // 回调进度更新
        if (onProgressUpdate) {
          onProgressUpdate(progressPercentage);
        }
      }
    });
    
    // 4. 检查经验值增益
    await this.checkForExperienceGainWithDelay(500, undefined, (hasGain) => {
      if (hasGain) {
        console.log('[experienceManager] 检测到经验值增益');
      }
      
      // 回调检查完成
      if (onCheckComplete) {
        onCheckComplete(hasGain);
      }
    });
    
    // 5. 返回当前状态和取消订阅函数
    return {
      experienceState: this.getExperienceState(),
      progressBarAnimation,
      unsubscribe: () => {
        // 清理回调
        this.stateCallbacks = [];
      }
    };
  }

  // 更新页面统计信息（使用动画版本）
  public updatePageStatistics(vocabularyLength: number = 0): void {
    console.log('[experienceManager] 更新页面统计信息');
    this.updateStatisticsWithAnimation(vocabularyLength);
  }

  // 页面组件经验值Hook（简化版）
  public createPageExperienceHook(
    vocabularyLength: number = 0,
    progressBarAnimation: any,
    onProgressUpdate?: (progressPercentage: number) => void,
    onCheckComplete?: (hasGain: boolean) => void
  ) {
    return {
      experienceState: this.getExperienceState(),
      progressBarAnimation,
      initialize: () => this.managePageExperience(
        vocabularyLength,
        progressBarAnimation,
        onProgressUpdate,
        onCheckComplete
      ),
      updateStatistics: () => this.updatePageStatistics(vocabularyLength),
      unsubscribe: () => {
        this.stateCallbacks = [];
      }
    };
  }

  // ==================== 经验值显示数据管理 ====================
  
  // 获取经验值显示数据
  public getExperienceDisplayData(): {
    level: number;
    levelText: string;
    experienceText: string;
    progressPercentage: number;
    levelBadge: {
      hasPremium: boolean;
      hasStar: boolean;
      hasEvent: boolean;
    };
    statistics: {
      collectedWords: number;
      totalExperience: number;
      currentStreak: number;
    };
  } {
    const { userExperienceInfo, animatedExperience, animatedCollectedWords } = this.experienceState;
    
    if (!userExperienceInfo) {
      return {
        level: 0,
        levelText: '开始学习获得经验值',
        experienceText: '0/100 XP',
        progressPercentage: 0,
        levelBadge: {
          hasPremium: false,
          hasStar: false,
          hasEvent: false
        },
        statistics: {
          collectedWords: animatedCollectedWords,
          totalExperience: 0,
          currentStreak: 0
        }
      };
    }
    
    const level = userExperienceInfo.level;
    const levelText = `Level ${level}`;
    const experienceText = `${animatedExperience}/${this.getCurrentLevelRequiredExp(level)} XP`;
    const progressPercentage = this.calculateProgressPercentage(animatedExperience);
    
    return {
      level,
      levelText,
      experienceText,
      progressPercentage,
      levelBadge: {
        hasPremium: level >= 10,
        hasStar: level >= 5 && level < 10,
        hasEvent: level >= 1 && level < 5
      },
      statistics: {
        collectedWords: animatedCollectedWords,
        totalExperience: userExperienceInfo.totalExperience || 0,
        currentStreak: userExperienceInfo.currentStreak || 0
      }
    };
  }

  // 获取等级徽章配置
  public getLevelBadgeConfig(level: number): {
    hasPremium: boolean;
    hasStar: boolean;
    hasEvent: boolean;
  } {
    return {
      hasPremium: level >= 10,
      hasStar: level >= 5 && level < 10,
      hasEvent: level >= 1 && level < 5
    };
  }

  // 获取统计数据显示
  public getStatisticsDisplayData(): {
    collectedWords: number;
    totalExperience: number;
    currentStreak: number;
  } {
    const { userExperienceInfo, animatedCollectedWords } = this.experienceState;
    
    return {
      collectedWords: animatedCollectedWords,
      totalExperience: userExperienceInfo?.totalExperience || 0,
      currentStreak: userExperienceInfo?.currentStreak || 0
    };
  }
}

export const experienceManager = ExperienceManager.getInstance();
