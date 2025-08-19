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
import { guestModeService } from '../../../services/guestModeService';

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
  // 升级弹窗状态
  showLevelUpModal: boolean;
  levelUpInfo: {
    oldLevel: number;
    newLevel: number;
    levelsGained: number;
    oldExperience: number;
    newExperience: number;
  } | null;
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
  private readonly EVENT_COOLDOWN = 500; // 减少冷却时间从1秒到500毫秒

  // 动画状态锁 - 防止多个动画同时运行
  private isAnimationRunning: boolean = false;
  private animationLockTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly ANIMATION_LOCK_TIMEOUT = 10000; // 10秒后自动释放锁

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
    animatedContributedWords: 0,
    showLevelUpModal: false,
    levelUpInfo: null
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
    if (experience < 50) return 1;
    if (experience < 75) return 2;   // 50 × 1.5 = 75
    if (experience < 112) return 3;  // 75 × 1.5 = 112.5 ≈ 112
    if (experience < 168) return 4;  // 112 × 1.5 = 168
    if (experience < 252) return 5;  // 168 × 1.5 = 252
    return Math.floor((experience - 252) / 200) + 6;
  }

  // 计算当前等级所需经验值（累积值）
  private calculateLevelRequiredExp(level: number): number {
    if (level === 1) return 50;
    if (level === 2) return 75;   // 50 × 1.5
    if (level === 3) return 112;  // 75 × 1.5
    if (level === 4) return 168;  // 112 × 1.5
    if (level === 5) return 252;  // 168 × 1.5
    // 后续等级：252 + (level - 6) * 200
    return 252 + (level - 6) * 200;
  }

  // 计算升级所需经验值
  private calculateExpToNextLevel(experience: number): number {
    const currentLevel = this.calculateLevel(experience);
    const currentLevelExp = this.calculateLevelRequiredExp(currentLevel);
    const nextLevelExp = this.calculateLevelRequiredExp(currentLevel + 1);
    return nextLevelExp - experience;
  }

  // 获取当前等级内的经验值
  private getExperienceInCurrentLevel(experience: number): number {
    const currentLevel = this.calculateLevel(experience);
    if (currentLevel === 1) return experience;
    
    const previousLevelExp = this.calculateLevelRequiredExp(currentLevel - 1);
    return experience - previousLevelExp;
  }

  // 计算进度百分比
  public calculateProgressPercentage(experience: number): number {
    const currentLevel = this.calculateLevel(experience);
    const currentLevelExp = this.getExperienceInCurrentLevel(experience);
    const previousLevelExp = currentLevel === 1 ? 0 : this.calculateLevelRequiredExp(currentLevel - 1);
    const expNeededForCurrentLevel = this.calculateLevelRequiredExp(currentLevel) - previousLevelExp;
    
    return currentLevelExp / expNeededForCurrentLevel;
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
    const currentLevelExp = this.getExperienceInCurrentLevel(experience);
    const previousLevelExp = level === 1 ? 0 : this.calculateLevelRequiredExp(level - 1);
    const expNeededForCurrentLevel = this.calculateLevelRequiredExp(level) - previousLevelExp;

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
      // 检查是否为游客模式
      const isGuestMode = await guestModeService.isGuestMode();
      
      if (isGuestMode) {
        // 游客模式：从本地存储读取数据
        console.log('[experienceManager] 游客模式：从本地存储读取经验值数据');
        const userStats = await AsyncStorage.getItem('userExperienceInfo');
        
        if (userStats) {
          const parsedStats = JSON.parse(userStats);
          if (parsedStats.experience > 0) {
            // 检查等级一致性
            const calculatedLevel = this.calculateLevel(parsedStats.experience);
            if (calculatedLevel !== parsedStats.level) {
              // 等级不一致，更新本地存储
              const updatedStats = {
                ...parsedStats,
                level: calculatedLevel
              };
              await AsyncStorage.setItem('userExperienceInfo', JSON.stringify(updatedStats));
              return updatedStats;
            }
            
            return parsedStats;
          }
        }
        
        // 游客模式：本地存储为空或经验值为0，返回默认值
        console.log('[experienceManager] 游客模式：创建默认经验值数据');
        const defaultExperienceInfo: UserExperienceInfo = {
          experience: 0,
          level: 1,
          experienceToNextLevel: 50,
          progressPercentage: 0,
          totalExperience: 0,
          dailyReviewXP: 0,
          dailyStudyTimeXP: 0,
          completedDailyCards: false,
          currentStreak: 0,
          contributedWords: 0
        };
        
        // 保存默认值到本地存储
        await AsyncStorage.setItem('userExperienceInfo', JSON.stringify(defaultExperienceInfo));
        
        return defaultExperienceInfo;
      } else {
        // 注册用户：使用多邻国方案，从云端同步数据
        console.log('[experienceManager] 注册用户：从云端同步经验值数据');
        
        // 优先从本地存储获取，避免云端同步延迟
        const userStats = await AsyncStorage.getItem('userExperienceInfo');
        
        if (userStats) {
          const parsedStats = JSON.parse(userStats);
          if (parsedStats.experience > 0) {
            // 检查等级一致性
            const calculatedLevel = this.calculateLevel(parsedStats.experience);
            if (calculatedLevel !== parsedStats.level) {
              // 等级不一致，更新本地存储
              const updatedStats = {
                ...parsedStats,
                level: calculatedLevel
              };
              await AsyncStorage.setItem('userExperienceInfo', JSON.stringify(updatedStats));
              return updatedStats;
            }
            
            return parsedStats;
          }
        }
        
        // 注册用户：本地存储为空或经验值为0，返回默认值
        // 使用多邻国方案：不依赖云端同步，避免延迟问题
        console.log('[experienceManager] 注册用户：创建默认经验值数据');
        const defaultExperienceInfo: UserExperienceInfo = {
          experience: 0,
          level: 1,
          experienceToNextLevel: 50,
          progressPercentage: 0,
          totalExperience: 0,
          dailyReviewXP: 0,
          dailyStudyTimeXP: 0,
          completedDailyCards: false,
          currentStreak: 0,
          contributedWords: 0
        };
        
        // 保存默认值到本地存储
        await AsyncStorage.setItem('userExperienceInfo', JSON.stringify(defaultExperienceInfo));
        
        return defaultExperienceInfo;
      }
    } catch (error) {
      console.error('[experienceManager] 获取经验值信息失败:', error);
      return null;
    }
  }

  // ==================== 经验值增益处理 ====================

  // 添加经验值（基础方法）
  private async addExperienceInternal(
    xpToGain: number, 
    eventType: ExperienceEventType, 
    metadata?: any
  ): Promise<ExperienceGainResult> {
    try {
      // 检查是否正在处理中
      if (this.isProcessing) {
        console.log('[experienceManager] 正在处理经验值，跳过重复请求');
        return {
          success: false,
          message: '正在处理经验值，请稍后重试',
          xpGained: 0,
          oldExperience: 0,
          newExperience: 0,
          oldLevel: 1,
          newLevel: 1,
          leveledUp: false,
          progressChange: 0
        };
      }

      this.isProcessing = true;
      console.log(`[experienceManager] 开始添加经验值: ${xpToGain} XP, 类型: ${eventType}`);

      // 获取当前经验值信息
      const currentInfo = await this.getCurrentExperienceInfo();
      if (!currentInfo) {
        console.log('[experienceManager] 无法获取当前经验值信息');
        this.isProcessing = false;
        return {
          success: false,
          message: '无法获取当前经验值信息',
          xpGained: 0,
          oldExperience: 0,
          newExperience: 0,
          oldLevel: 1,
          newLevel: 1,
          leveledUp: false,
          progressChange: 0
        };
      }

      const oldExperience = currentInfo.experience;
      const newExperience = oldExperience + xpToGain;
      const oldLevel = currentInfo.level;

      // 计算新等级
      const newLevel = this.calculateLevel(newExperience);
      const leveledUp = newLevel > oldLevel;

      console.log(`[experienceManager] 经验值变化: ${oldExperience} → ${newExperience}, 等级: ${oldLevel} → ${newLevel}`);

      // 更新用户经验值信息
      const updatedInfo: UserExperienceInfo = {
        ...currentInfo,
        experience: newExperience,
        level: newLevel,
        experienceToNextLevel: this.calculateExpToNextLevel(newExperience),
        progressPercentage: this.calculateProgressPercentage(newExperience),
        totalExperience: currentInfo.totalExperience + xpToGain
      };

      // 更新本地状态
      this.updateState({
        userExperienceInfo: updatedInfo,
        animatedExperience: newExperience
      });

      // 保存到本地存储
      this.updateUserExperienceInfo(newExperience, newLevel);

      // 检查升级
      if (leveledUp) {
        console.log(`[experienceManager] 恭喜升级！等级 ${oldLevel} → ${newLevel}`);
        this.updateState({
          showLevelUpModal: true,
          levelUpInfo: {
            oldLevel,
            newLevel,
            levelsGained: newLevel - oldLevel,
            oldExperience,
            newExperience
          }
        });
      }

      this.isProcessing = false;

      const result: ExperienceGainResult = {
        success: true,
        xpGained: xpToGain,
        message: `获得 ${xpToGain} 经验值`,
        oldExperience,
        newExperience,
        oldLevel,
        newLevel,
        leveledUp,
        progressChange: xpToGain
      };

      console.log('[experienceManager] 经验值添加成功:', result);
      return result;

    } catch (error) {
      console.error('[experienceManager] 添加经验值失败:', error);
      this.isProcessing = false;
      return {
        success: false,
        message: '添加经验值失败',
        xpGained: 0,
        oldExperience: 0,
        newExperience: 0,
        oldLevel: 1,
        newLevel: 1,
        leveledUp: false,
        progressChange: 0
      };
    }
  }

  // 添加经验值（公共接口）
  public async addExperience(
    xpToGain: number, 
    eventType: ExperienceEventType, 
    metadata?: any
  ): Promise<ExperienceGainResult> {
    return this.addExperienceInternal(xpToGain, eventType, metadata);
  }

  // ==================== 经验值增益接口实现 ====================

  public async addReviewExperience(isCorrect: boolean = true): Promise<ExperienceGainResult | null> {
    const xpToGain = isCorrect ? this.config.xpRewards.review.correct : this.config.xpRewards.review.incorrect;
    return this.addExperience(xpToGain, 'review', { isCorrect });
  }

  // 添加复习总经验值
  public async addReviewTotalExperience(totalExperience: number): Promise<ExperienceGainResult | null> {
    console.log('[experienceManager] 添加复习总经验值:', totalExperience);
    const result = await this.addExperience(totalExperience, 'review');
    console.log('[experienceManager] 添加复习总经验值结果:', result);
    return result;
  }

  public async addSmartChallengeExperience(): Promise<ExperienceGainResult | null> {
    return this.addExperience(this.config.xpRewards.smartChallenge, 'smartChallenge');
  }

  public async addWrongWordChallengeExperience(): Promise<ExperienceGainResult | null> {
    return this.addExperience(this.config.xpRewards.wrongWordChallenge, 'wrongWordChallenge');
  }

  // 计算复习总经验值
  public calculateReviewTotalExperience(actions: Array<{ remembered: boolean }>): number {
    let totalExperience = 0;
    
    console.log('[experienceManager] 计算复习总经验值，actions数量:', actions.length);
    
    for (const action of actions) {
      if (action.remembered) {
        const xp = this.config.xpRewards.review.correct;
        totalExperience += xp;
        console.log(`[experienceManager] 记住单词: +${xp} XP`);
      } else {
        const xp = this.config.xpRewards.review.incorrect;
        totalExperience += xp;
        console.log(`[experienceManager] 忘记单词: +${xp} XP`);
      }
    }
    
    console.log(`[experienceManager] 复习总经验值: ${totalExperience} XP`);
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
    
    for (const [key, timestamp] of this.lastProcessedEvents.entries()) {
      if (now - timestamp > this.EVENT_COOLDOWN * 10) { // 10倍冷却时间后清理
        expiredEvents.push(key);
      }
    }
    
    expiredEvents.forEach(key => this.lastProcessedEvents.delete(key));
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
    try {
      // 检查当前经验值是否已经包含了gainedExp
      // 如果currentExp已经是最新值，则不需要再添加
      const expectedCurrentExp = currentExp - gainedExp;
      const actualCurrentExp = this.getExperienceState().userExperienceInfo?.experience || 0;
      
      // 如果当前状态中的经验值已经是最新值，直接使用
      const animationStartExp = actualCurrentExp >= currentExp ? actualCurrentExp - gainedExp : expectedCurrentExp;
      const animationEndExp = actualCurrentExp >= currentExp ? actualCurrentExp : currentExp;
      
      const oldLevel = this.calculateLevel(animationStartExp);
      const newLevel = this.calculateLevel(animationEndExp);
      const isLevelUp = newLevel > oldLevel;
      const oldProgress = this.calculateProgressPercentage(animationStartExp);
      const newProgress = this.calculateProgressPercentage(animationEndExp);
      
      const params = {
        oldExperience: animationStartExp,
        newExperience: animationEndExp,
        gainedExp,
        oldLevel,
        newLevel,
        isLevelUp,
        oldProgress,
        newProgress
      };
      
      const callbacks = {
        onProgress: onProgressUpdate,
        onComplete: onComplete ? (finalExp: number, finalProgress: number) => {
          // 更新 userExperienceInfo 中的经验值
          this.updateUserExperienceInfo(finalExp, newLevel);
          onComplete(finalExp, Math.floor(finalProgress));
        } : undefined
      };
      
      // 委托给 animationManager 处理动画
      animationManager.startExperienceAnimation(params, callbacks);
    } catch (error) {
      console.error('[experienceManager] 经验值动画启动失败:', error);
    }
  }

  // 更新用户经验值信息
  private updateUserExperienceInfo(experience: number, level: number): void {
    const currentState = this.getExperienceState();
    if (currentState.userExperienceInfo) {
      const updatedInfo = {
        ...currentState.userExperienceInfo,
        experience,
        level,
        experienceToNextLevel: this.calculateExpToNextLevel(experience),
        progressPercentage: this.calculateProgressPercentage(experience)
      };
      
      this.updateState({
        userExperienceInfo: updatedInfo
      });
      
      // 同时更新本地存储
      this.updateLocalExperience(experience, level);
    }
  }

  // 更新本地经验值数据
  private async updateLocalExperience(experience: number, level: number): Promise<void> {
    try {
      // 读取当前的 userExperienceInfo
      const currentExperienceInfo = await this.getCurrentExperienceInfo();
      
      if (currentExperienceInfo) {
        // 更新经验值信息
        const updatedExperienceInfo = {
          ...currentExperienceInfo,
          experience,
          level,
          experienceToNextLevel: this.calculateExpToNextLevel(experience),
          progressPercentage: this.calculateProgressPercentage(experience)
        };
        
        // 保存到 userExperienceInfo
        await AsyncStorage.setItem('userExperienceInfo', JSON.stringify(updatedExperienceInfo));
        
        console.log('[experienceManager] 本地经验值数据已更新:', experience, level);
      } else {
        // 如果不存在，创建新的经验值信息
        const newExperienceInfo = {
          experience,
          level,
          experienceToNextLevel: this.calculateExpToNextLevel(experience),
          progressPercentage: this.calculateProgressPercentage(experience),
          totalExperience: experience,
          dailyReviewXP: 0,
          dailyStudyTimeXP: 0,
          completedDailyCards: false,
          currentStreak: 0,
          contributedWords: 0
        };
        
        await AsyncStorage.setItem('userExperienceInfo', JSON.stringify(newExperienceInfo));
        
        console.log('[experienceManager] 创建新的本地经验值数据:', experience, level);
      }
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

  // 手动触发经验值动画（由ReviewIntroScreen调用）
  public async triggerExperienceAnimation(experienceGained: number): Promise<void> {
    try {
      console.log('[experienceManager] 手动触发经验值动画:', experienceGained);
      
      // 获取当前经验值信息
      const currentInfo = await this.getCurrentExperienceInfo();
      if (!currentInfo) {
        console.error('[experienceManager] 无法获取当前经验值信息');
        return;
      }
      
      const oldExperience = currentInfo.experience;
      const newExperience = oldExperience + experienceGained;
      const oldProgress = this.calculateProgressPercentage(oldExperience);
      const newProgress = this.calculateProgressPercentage(newExperience);
      
      console.log('[experienceManager] 动画参数:', {
        oldExperience,
        newExperience,
        oldProgress,
        newProgress
      });
      
      // 先更新状态，确保动画从正确的起点开始
      this.updateState({
        progressBarValue: oldProgress
      });
      
      // 使用带回调的动画方法，实时更新进度条和经验值
      await this.startExperienceAnimationWithState(
        experienceGained,
        (currentExp: number, progress: number) => {
          // 实时更新进度条状态和经验值
          this.updateState({
            progressBarValue: progress,
            userExperienceInfo: {
              ...currentInfo,
              experience: currentExp,
              progressPercentage: progress
            }
          });
          console.log('[experienceManager] 进度条和经验值更新:', { currentExp, progress });
        },
        (finalExp: number, finalLevel: number) => {
          console.log('[experienceManager] 经验值动画完成:', { finalExp, finalLevel });
          // 动画完成后，确保状态显示最终值
          this.updateState({
            progressBarValue: this.calculateProgressPercentage(finalExp),
            userExperienceInfo: {
              ...currentInfo,
              experience: finalExp,
              level: finalLevel,
              progressPercentage: this.calculateProgressPercentage(finalExp)
            }
          });
        }
      );
    } catch (error) {
      console.error('[experienceManager] 手动触发经验值动画失败:', error);
    }
  }

  // ==================== 经验值加载和初始化 ====================
  
  // 加载用户经验值信息
  public async loadUserExperienceInfo(vocabularyLength: number = 0): Promise<void> {
    try {
      const experienceInfo = await this.getCurrentExperienceInfo();
      
      if (experienceInfo) {
        this.updateState({
          userExperienceInfo: experienceInfo,
          isLoadingExperience: false,
          hasCheckedExperience: true
        });
        
        // 更新统计信息
        this.updateStatistics(vocabularyLength);
      } else {
        // 用户还没有学习记录，经验值为0
        this.updateState({
          userExperienceInfo: {
            experience: 0,
            level: 1,
            experienceToNextLevel: 50,
            progressPercentage: 0,
            totalExperience: 0,
            dailyReviewXP: 0,
            dailyStudyTimeXP: 0,
            completedDailyCards: false,
            currentStreak: 0,
            contributedWords: 0
          },
          isLoadingExperience: false,
          hasCheckedExperience: true
        });
      }
    } catch (error) {
      console.error('[experienceManager] 加载用户经验值信息失败:', error);
      this.updateState({
        isLoadingExperience: false,
        hasCheckedExperience: true
      });
    }
  }

  // 初始化经验值状态
  public initializeExperienceState(): void {
    this.updateState({
      hasCheckedExperience: false,
      isProgressBarAnimating: false,
      showLevelUpModal: false,
      levelUpInfo: null
    });
  }

  // 关闭升级弹窗
  public closeLevelUpModal(): void {
    this.updateState({
      showLevelUpModal: false,
      levelUpInfo: null
    });
  }

  // ==================== 经验值进度条管理 ====================
  
  // 更新进度条（同步到animationManager）
  public updateProgressBar(progress: number): void {
    // 只更新本地状态，不重复更新动画管理器
    this.updateState({
      progressBarValue: progress
    });
  }

  // ==================== 动画状态锁管理 ====================
  
  // 获取动画锁
  private acquireAnimationLock(): boolean {
    if (this.isAnimationRunning) {
      console.log('[experienceManager] 动画锁已被占用，无法启动新动画');
      return false;
    }
    
    this.isAnimationRunning = true;
    console.log('[experienceManager] 获取动画锁成功');
    
    // 设置自动释放锁的超时
    this.animationLockTimeout = setTimeout(() => {
      console.log('[experienceManager] 动画锁超时，自动释放');
      this.releaseAnimationLock();
    }, this.ANIMATION_LOCK_TIMEOUT);
    
    return true;
  }
  
  // 释放动画锁
  private releaseAnimationLock(): void {
    if (this.animationLockTimeout) {
      clearTimeout(this.animationLockTimeout);
      this.animationLockTimeout = null;
    }
    
    this.isAnimationRunning = false;
    console.log('[experienceManager] 动画锁已释放');
  }
  
  // 强制释放动画锁（用于异常情况）
  public forceReleaseAnimationLock(): void {
    console.log('[experienceManager] 强制释放动画锁');
    this.releaseAnimationLock();
  }
  
  // 检查动画锁状态
  public isAnimationLocked(): boolean {
    return this.isAnimationRunning;
  }
  
  // 开始经验值动画（带状态管理）
  public async startExperienceAnimationWithState(
    gainedExp: number,
    onProgressUpdate?: (currentExp: number, progress: number) => void,
    onComplete?: (finalExp: number, finalLevel: number) => void
  ): Promise<void> {
    // 检查动画锁
    if (!this.acquireAnimationLock()) {
      console.log('[experienceManager] 无法获取动画锁，跳过动画启动');
      return;
    }
    
    try {
      let currentState = this.getExperienceState();
      
      // 如果用户经验值信息不存在，尝试初始化
      if (!currentState.userExperienceInfo) {
        console.log('[experienceManager] 用户经验值信息不存在，尝试初始化...');
        await this.loadUserExperienceInfo();
        currentState = this.getExperienceState();
      }
      
      if (currentState.userExperienceInfo) {
        // 重新从本地存储读取最新经验值，确保数据同步
        const latestExperienceInfo = await this.getCurrentExperienceInfo();
        const currentExp = latestExperienceInfo?.experience || currentState.userExperienceInfo.experience;
        
        console.log('[experienceManager] 启动经验值动画，当前经验值:', currentExp, '获得经验值:', gainedExp);
        
        // 直接启动动画，不重复检查动画管理器状态
        await this.startExperienceAnimation(
          gainedExp,
          currentExp,
          onProgressUpdate,
          (finalExp: number, finalLevel: number) => {
            // 动画完成回调
            if (onComplete) {
              onComplete(finalExp, finalLevel);
            }
            // 释放动画锁
            this.releaseAnimationLock();
          }
        );
      } else {
        console.log('[experienceManager] 用户经验值信息初始化失败，无法启动动画');
        this.releaseAnimationLock();
      }
    } catch (error) {
      console.error('[experienceManager] 经验值动画启动失败:', error);
      this.releaseAnimationLock();
    }
  }

  // ==================== 统计数字管理 ====================
  
  // 更新统计数字（基础版本）
  public updateStatistics(vocabularyLength: number = 0): void {
    const userExperienceInfo = this.getExperienceState().userExperienceInfo;
    
    if (userExperienceInfo) {
      const collectedCount = vocabularyLength;
      const contributedCount = userExperienceInfo.contributedWords || 0;
      
      this.updateState({
        animatedCollectedWords: collectedCount,
        animatedContributedWords: contributedCount
      });
    }
  }

  // 检查经验值增益（带状态管理）
  public async checkForExperienceGainWithState(): Promise<boolean> {
    const currentState = this.getExperienceState();
    
    // 正在同步中，跳过经验值增益检查
    if (currentState.isSyncingExperience) {
      return false;
    }
    
    // 已检查过经验值增益，但动画管理器空闲，允许重新检查
    if (currentState.hasCheckedExperience && !animationManager.isAnimatingNow()) {
      // 重置检查状态，允许重新检查
      this.updateState({ hasCheckedExperience: false });
    }
    
    // 进度条动画进行中，跳过重复检查
    if (currentState.isProgressBarAnimating) {
      return false;
    }
    
    // 检查是否有经验值增益
    const experienceGainResult = await this.checkForExperienceGainFromNavigation();
    
    if (experienceGainResult.hasExperienceGain && experienceGainResult.experienceGained) {
      const experienceGained = experienceGainResult.experienceGained;
      
      // 满足经验值动画条件，开始处理
      await this.startExperienceAnimationWithState(experienceGained);
      
      return true;
    }
    
    return false;
  }

  // ==================== 经验值进度条和增益检查管理 ====================
  
  // 初始化经验值进度条（带回调）
  public initializeProgressBarWithCallback(
    onProgressUpdate?: (progressPercentage: number) => void
  ): void {
    const currentState = this.getExperienceState();
    
    if (currentState.userExperienceInfo) {
      const progressPercentage = this.calculateProgressPercentage(currentState.userExperienceInfo.experience);
      
      this.updateState({
        progressBarValue: progressPercentage,
        hasInitializedProgressBar: true
      });
      
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
    // 已检查过经验值增益或正在同步，跳过重复检查
    if (this.getExperienceState().hasCheckedExperience || this.getExperienceState().isSyncingExperience) {
      if (onCheckComplete) {
        onCheckComplete(false);
      }
      return;
    }
    
    if (onCheckStart) {
      onCheckStart();
    }
    
    // 延迟检查
    setTimeout(async () => {
      try {
        const hasGain = await this.checkForExperienceGainWithState();
        
        if (onCheckComplete) {
          onCheckComplete(hasGain);
        }
      } catch (error) {
        console.error('[experienceManager] 延迟检查经验值增益失败:', error);
        if (onCheckComplete) {
          onCheckComplete(false);
        }
      }
    }, delay);
  }

  // 检查经验值增益（带重试机制）
  public async checkForExperienceGainWithRetry(
    maxRetries: number = 3,
    retryDelay: number = 1000,
    onCheckStart?: () => void,
    onCheckComplete?: (hasGain: boolean) => void
  ): Promise<void> {
    const attemptCheck = async (): Promise<void> => {
      try {
        const hasGain = await this.checkForExperienceGainWithState();
        
        if (hasGain) {
          if (onCheckComplete) {
            onCheckComplete(true);
          }
          return;
        }
        
        // 没有经验值增益，尝试重试
        if (maxRetries > 0) {
          maxRetries--;
          setTimeout(attemptCheck, retryDelay);
        } else {
          if (onCheckComplete) {
            onCheckComplete(false);
          }
        }
      } catch (error) {
        console.error('[experienceManager] 重试检查经验值增益失败:', error);
        
        if (maxRetries > 0) {
          maxRetries--;
          setTimeout(attemptCheck, retryDelay);
        } else {
          if (onCheckComplete) {
            onCheckComplete(false);
          }
        }
      }
    };
    
    if (onCheckStart) {
      onCheckStart();
    }
    
    await attemptCheck();
  }

  // 自动管理经验值状态（整合初始化、加载、检查等功能）
  public async autoManageExperienceState(
    vocabularyLength: number = 0,
    onProgressUpdate?: (progressPercentage: number) => void,
    onCheckComplete?: (hasGain: boolean) => void
  ): Promise<void> {
    // 跳过自动经验值增益检查，等待手动触发
    if (onCheckComplete) {
      onCheckComplete(false);
    }
  }

  // ==================== 统计数字和动画管理 ====================
  
  // 更新统计数字（带动画）
  public updateStatisticsWithAnimation(
    vocabularyLength: number = 0,
    onAnimationStart?: () => void,
    onAnimationComplete?: () => void
  ): void {
    const userExperienceInfo = this.getExperienceState().userExperienceInfo;
    
    if (userExperienceInfo) {
      const collectedCount = vocabularyLength;
      const contributedCount = userExperienceInfo.contributedWords || 0;
      
      // 设置动画贡献词数
      this.updateState({
        animatedCollectedWords: collectedCount,
        animatedContributedWords: contributedCount
      });
      
      if (onAnimationStart) {
        onAnimationStart();
      }
      
      // 模拟动画完成
      setTimeout(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 100);
    }
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

  // 获取当前等级内所需经验值（当前等级的经验值范围）
  public getCurrentLevelRequiredExp(level: number): number {
    if (level === 1) return 50;
    const previousLevelExp = this.calculateLevelRequiredExp(level - 1);
    return this.calculateLevelRequiredExp(level) - previousLevelExp;
  }

  // 获取等级文本
  public getLevelText(level: number): string {
    if (level === 1) return '新手';
    if (level === 2) return '学徒';
    if (level === 3) return '熟练';
    if (level === 4) return '精通';
    if (level === 5) return '大师';
    return `Level ${level}`;
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
    // 开始统一管理页面经验值状态
    this.initializeProgressBarWithCallback(onProgressUpdate);
    
    // 确保经验值信息已加载
    const currentState = this.getExperienceState();
    if (!currentState.userExperienceInfo) {
      console.log('[experienceManager] 页面初始化：加载用户经验值信息');
      await this.loadUserExperienceInfo(vocabularyLength);
    }
    
    // 更新统计信息
    this.updateStatistics(vocabularyLength);
    
    // 设置状态更新回调
    const unsubscribe = this.registerStateCallback((updates) => {
      if (updates.progressBarValue !== undefined && onProgressUpdate) {
        onProgressUpdate(updates.progressBarValue);
      }
    });
    
    // 检查经验值增益
    const hasGain = await this.checkForExperienceGainWithState();
    
    if (onCheckComplete) {
      onCheckComplete(hasGain);
    }
    
    return {
      experienceState: this.getExperienceState(),
      progressBarAnimation,
      unsubscribe
    };
  }

  // 更新页面统计信息（使用动画版本）
  public updatePageStatistics(vocabularyLength: number = 0): void {
    this.updateStatistics(vocabularyLength);
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
      manageExperience: () => this.managePageExperience(
        vocabularyLength,
        progressBarAnimation,
        onProgressUpdate,
        onCheckComplete
      ),
      updateStatistics: () => this.updatePageStatistics(vocabularyLength)
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
    const currentState = this.getExperienceState();
    const userExperienceInfo = currentState.userExperienceInfo;
    
    if (!userExperienceInfo) {
      return {
        level: 1,
        levelText: '新手',
        experienceText: '0 XP',
        progressPercentage: 0,
        levelBadge: {
          hasPremium: false,
          hasStar: false,
          hasEvent: false
        },
        statistics: {
          collectedWords: 0,
          totalExperience: 0,
          currentStreak: 0
        }
      };
    }
    
    const level = userExperienceInfo.level;
    const experience = userExperienceInfo.experience;
    const progressPercentage = this.calculateProgressPercentage(experience);
    
    // 获取等级徽章配置
    const levelBadge = this.getLevelBadgeConfig(level);
    
    // 获取统计信息
    const statistics = this.getStatisticsDisplayData();
    
    return {
      level,
      levelText: this.getLevelText(level),
      experienceText: `${experience} XP`,
      progressPercentage,
      levelBadge,
      statistics
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

  // ==================== 调试和诊断 ====================
  
  // 获取经验值动画状态诊断信息
  public getAnimationDiagnostics(): {
    experienceState: ExperienceState;
    animationManagerState: {
      isAnimating: boolean;
      animationStartTime: number;
      currentProgressBarValue: number;
    };
    lastProcessedEvents: Array<{ key: string; timestamp: number; age: number }>;
    recommendations: string[];
  } {
    const now = Date.now();
    const lastProcessedEvents = Array.from(this.lastProcessedEvents.entries()).map(([key, timestamp]) => ({
      key,
      timestamp,
      age: now - timestamp
    }));
    
    const recommendations: string[] = [];
    
    // 分析状态并提供建议
    if (this.experienceState.isProgressBarAnimating && !animationManager.isAnimatingNow()) {
      recommendations.push('状态不一致：本地状态显示动画进行中，但动画管理器空闲');
    }
    
    if (animationManager.isAnimatingNow() && !this.experienceState.isProgressBarAnimating) {
      recommendations.push('状态不一致：动画管理器显示动画进行中，但本地状态显示空闲');
    }
    
    if (this.experienceState.hasCheckedExperience && this.experienceState.isProgressBarAnimating) {
      recommendations.push('状态冲突：已检查过经验值但进度条仍在动画中');
    }
    
    if (this.isProcessing) {
      recommendations.push('经验值处理中，可能阻塞新的经验值增益');
    }
    
    return {
      experienceState: this.getExperienceState(),
      animationManagerState: {
        isAnimating: animationManager.isAnimatingNow(),
        animationStartTime: (animationManager as any).animationStartTime || 0,
        currentProgressBarValue: (animationManager as any).currentProgressBarValue || 0
      },
      lastProcessedEvents,
      recommendations
    };
  }
  
  // 强制重置所有状态（用于调试）
  public forceResetAllStates(): void {
    // 重置所有状态
    this.experienceState = {
      userExperienceInfo: null,
      isLoadingExperience: true,
      progressBarValue: 0,
      hasCheckedExperience: false,
      animatedExperience: 0,
      isProgressBarAnimating: false,
      hasInitializedProgressBar: false,
      isSyncingExperience: false,
      animatedCollectedWords: 0,
      animatedContributedWords: 0,
      showLevelUpModal: false,
      levelUpInfo: null
    };
    
    // 清理事件记录
    this.lastProcessedEvents.clear();
    
    // 重置动画管理器
    animationManager.resetAnimationValues();
    
    // 通知所有回调
    this.stateCallbacks.forEach(callback => {
      callback(this.experienceState);
    });
  }

  // 强制清理动画状态 - 解决动画卡住的问题
  public forceCleanupAnimationState(): void {
    // 重置所有动画相关状态
    this.updateState({
      isProgressBarAnimating: false,
      hasInitializedProgressBar: false,
      animatedExperience: 0,
      animatedCollectedWords: 0,
      animatedContributedWords: 0
    });
    
    // 强制重置动画管理器
    animationManager.resetAnimationValues();
    
    // 强制释放动画锁
    this.forceReleaseAnimationLock();
  }
}

export const experienceManager = ExperienceManager.getInstance();
