import AsyncStorage from '@react-native-async-storage/async-storage';
import { experienceManager } from './experienceManager';
import { 
  DailyReward, 
  DailyRewardsState, 
  DailyRewardCondition,
  DailyRewardConfig 
} from '../../../types/dailyRewards';
import { ExperienceGainResult } from '../../../types/experience';
import { t, AppLanguage } from '../../../constants/translations';

// 每日奖励配置
const DAILY_REWARDS_CONFIG: DailyRewardConfig[] = [
  {
    id: 'newWords',
    name: '收藏新单词',
    description: '今日收集了新单词',
    xpAmount: 10,
    icon: '📚'
  },
  {
    id: 'dailyReview',
    name: '每日复习',
    description: '今日完成复习任务',
    xpAmount: 5,
    icon: '✅'
  },
  {
    id: 'studyTime',
    name: '学习时长',
    description: '今日学习时间达标',
    xpAmount: 3,
    icon: '⏰'
  },
  {
    id: 'continuousLearning',
    name: '连续学习',
    description: '连续学习天数达标',
    xpAmount: 8,
    icon: '🔥'
  },
  {
    id: 'perfectReview',
    name: '完美复习',
    description: '今日复习全对',
    xpAmount: 15,
    icon: '⭐'
  }
];

class DailyRewardsManager {
  private static instance: DailyRewardsManager;
  private readonly STORAGE_KEY = 'dailyRewards';
  private readonly RESET_KEY = 'dailyRewardsResetDate';
  private stateCallbacks: Array<(rewards: DailyReward[]) => void> = [];

  private constructor() {}

  public static getInstance(): DailyRewardsManager {
    if (!DailyRewardsManager.instance) {
      DailyRewardsManager.instance = new DailyRewardsManager();
    }
    return DailyRewardsManager.instance;
  }

  // 注册状态回调
  public registerStateCallback(callback: (rewards: DailyReward[]) => void): () => void {
    this.stateCallbacks.push(callback);
    return () => {
      const index = this.stateCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateCallbacks.splice(index, 1);
      }
    };
  }

  // 通知所有回调
  private notifyStateChange(rewards: DailyReward[]): void {
    this.stateCallbacks.forEach(callback => {
      try {
        callback(rewards);
      } catch (error) {
        console.error('[DailyRewardsManager] 状态回调执行失败:', error);
      }
    });
  }

  // 获取翻译后的奖励配置
  private getTranslatedRewardsConfig(language: AppLanguage = 'zh-CN'): DailyRewardConfig[] {
    return [
      {
        id: 'newWords',
        name: t('collect_new_words', language),
        description: t('collect_words_description', language),
        xpAmount: 10,
        icon: '📚'
      },
      {
        id: 'dailyReview',
        name: t('daily_review', language),
        description: t('daily_review_description', language),
        xpAmount: 5,
        icon: '✅'
      },
      {
        id: 'studyTime',
        name: t('study_time', language),
        description: t('study_time_description', language),
        xpAmount: 3,
        icon: '⏰'
      },
      {
        id: 'continuousLearning',
        name: t('continuous_learning', language),
        description: t('continuous_learning_description', language),
        xpAmount: 8,
        icon: '🔥'
      },
      {
        id: 'perfectReview',
        name: t('perfect_review', language),
        description: t('perfect_review_description', language),
        xpAmount: 15,
        icon: '⭐'
      }
    ];
  }

  // 检查是否需要重置每日奖励
  private async checkAndResetDailyRewards(language: AppLanguage = 'zh-CN'): Promise<void> {
    try {
      const lastResetDate = await AsyncStorage.getItem(this.RESET_KEY);
      const today = new Date().toDateString();
      
      if (lastResetDate !== today) {
        console.log('[DailyRewardsManager] 检测到新的一天，重置每日奖励');
        await this.resetDailyRewards(language);
        await AsyncStorage.setItem(this.RESET_KEY, today);
      }
    } catch (error) {
      console.error('[DailyRewardsManager] 检查重置日期失败:', error);
    }
  }

  // 重置每日奖励
  private async resetDailyRewards(language: AppLanguage = 'zh-CN'): Promise<void> {
    try {
      const translatedConfig = this.getTranslatedRewardsConfig(language);
      const rewards = translatedConfig.map(config => ({
        ...config,
        status: 'locked' as const,
        condition: config.description,
        claimedAt: undefined,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
      }));

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(rewards));
      console.log('[DailyRewardsManager] 每日奖励已重置');
    } catch (error) {
      console.error('[DailyRewardsManager] 重置每日奖励失败:', error);
    }
  }

  // 检查奖励条件
  public async checkRewardConditions(language: AppLanguage = 'zh-CN'): Promise<DailyReward[]> {
    try {
      await this.checkAndResetDailyRewards(language);
      
      const storedRewards = await AsyncStorage.getItem(this.STORAGE_KEY);
      let rewards: DailyReward[] = [];
      
      // 确保始终有奖励数据
      if (storedRewards) {
        try {
          const parsed = JSON.parse(storedRewards);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rewards = parsed;
          } else {
            console.log('[DailyRewardsManager] 存储的奖励数据无效，使用默认配置');
            rewards = this.createDefaultRewards(language);
          }
        } catch (parseError) {
          console.error('[DailyRewardsManager] 解析存储的奖励数据失败:', parseError);
          rewards = this.createDefaultRewards(language);
        }
      } else {
        console.log('[DailyRewardsManager] 没有存储的奖励数据，创建默认配置');
        rewards = this.createDefaultRewards(language);
      }

      // 确保奖励数量正确
      if (rewards.length !== DAILY_REWARDS_CONFIG.length) {
        console.log('[DailyRewardsManager] 奖励数量不匹配，重新创建默认配置');
        rewards = this.createDefaultRewards(language);
      }

      // 检查每个奖励的条件
      for (const reward of rewards) {
        if (reward.status === 'claimed') continue;
        
        const isConditionMet = await this.checkSingleRewardCondition(reward.id);
        if (isConditionMet) {
          reward.status = 'available';
          reward.condition = await this.getRewardProgress(reward.id, language);
        } else {
          reward.status = 'locked';
          reward.condition = await this.getRewardProgress(reward.id, language);
        }
      }

      // 保存更新后的状态
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(rewards));
      this.notifyStateChange(rewards); // 通知回调
      
      console.log('[DailyRewardsManager] 奖励状态检查完成，共', rewards.length, '个奖励');
      return rewards;
    } catch (error) {
      console.error('[DailyRewardsManager] 检查奖励条件失败:', error);
      // 即使出错，也返回默认奖励配置
      const defaultRewards = this.createDefaultRewards(language);
      this.notifyStateChange(defaultRewards);
      return defaultRewards;
    }
  }

  // 创建默认奖励配置
  private createDefaultRewards(language: AppLanguage = 'zh-CN'): DailyReward[] {
    const translatedConfig = this.getTranslatedRewardsConfig(language);
    return translatedConfig.map(config => ({
      ...config,
      status: 'locked' as const,
      condition: config.description,
      claimedAt: undefined,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }));
  }

  // 检查单个奖励条件
  private async checkSingleRewardCondition(rewardId: string): Promise<boolean> {
    try {
      switch (rewardId) {
        case 'newWords':
          return await this.checkNewWordsCondition();
        case 'dailyReview':
          return await this.checkDailyReviewCondition();
        case 'studyTime':
          return await this.checkStudyTimeCondition();
        case 'continuousLearning':
          return await this.checkContinuousLearningCondition();
        case 'perfectReview':
          return await this.checkPerfectReviewCondition();
        default:
          return false;
      }
    } catch (error) {
      console.error(`[DailyRewardsManager] 检查奖励条件失败 ${rewardId}:`, error);
      return false;
    }
  }

  // 检查新单词条件
  private async checkNewWordsCondition(): Promise<boolean> {
    try {
      const today = new Date().toDateString();
      const newWordsKey = `newWords_${today}`;
      const newWordsCount = await AsyncStorage.getItem(newWordsKey);
      return parseInt(newWordsCount || '0') > 0;
    } catch (error) {
      console.error('[DailyRewardsManager] 检查新单词条件失败:', error);
      return false;
    }
  }

  // 检查每日复习条件
  private async checkDailyReviewCondition(): Promise<boolean> {
    try {
      const today = new Date().toDateString();
      const reviewKey = `dailyReview_${today}`;
      const reviewCount = await AsyncStorage.getItem(reviewKey);
      return parseInt(reviewCount || '0') > 0;
    } catch (error) {
      console.error('[DailyRewardsManager] 检查每日复习条件失败:', error);
      return false;
    }
  }

  // 检查学习时长条件
  private async checkStudyTimeCondition(): Promise<boolean> {
    try {
      const today = new Date().toDateString();
      const studyTimeKey = `studyTime_${today}`;
      const studyTime = await AsyncStorage.getItem(studyTimeKey);
      return parseInt(studyTime || '0') >= 30; // 30分钟
    } catch (error) {
      console.error('[DailyRewardsManager] 检查学习时长条件失败:', error);
      return false;
    }
  }

  // 检查连续学习条件
  private async checkContinuousLearningCondition(): Promise<boolean> {
    try {
      const currentStreak = await AsyncStorage.getItem('currentStreak');
      return parseInt(currentStreak || '0') >= 3; // 连续3天
    } catch (error) {
      console.error('[DailyRewardsManager] 检查连续学习条件失败:', error);
      return false;
    }
  }

  // 检查完美复习条件
  private async checkPerfectReviewCondition(): Promise<boolean> {
    try {
      const today = new Date().toDateString();
      const perfectReviewKey = `perfectReview_${today}`;
      const perfectReview = await AsyncStorage.getItem(perfectReviewKey);
      return perfectReview === 'true';
    } catch (error) {
      console.error('[DailyRewardsManager] 检查完美复习条件失败:', error);
      return false;
    }
  }

  // 获取奖励进度描述
  private async getRewardProgress(rewardId: string, language: AppLanguage = 'zh-CN'): Promise<string> {
    try {
      switch (rewardId) {
        case 'newWords': {
          const today = new Date().toDateString();
          const newWordsKey = `newWords_${today}`;
          const count = await AsyncStorage.getItem(newWordsKey) || '0';
          const countNum = parseInt(count);
          if (countNum > 0) {
            return t('today_collected_words', language, { count });
          } else {
            return t('collect_words_condition', language);
          }
        }
        case 'dailyReview': {
          const today = new Date().toDateString();
          const reviewKey = `dailyReview_${today}`;
          const count = await AsyncStorage.getItem(reviewKey) || '0';
          const countNum = parseInt(count);
          if (countNum > 0) {
            return t('today_completed_reviews', language, { count });
          } else {
            return t('daily_review_condition', language);
          }
        }
        case 'studyTime': {
          const today = new Date().toDateString();
          const studyTimeKey = `studyTime_${today}`;
          const minutes = await AsyncStorage.getItem(studyTimeKey) || '0';
          const minutesNum = parseInt(minutes);
          if (minutesNum >= 30) {
            return t('today_study_minutes', language, { minutes });
          } else {
            return t('study_time_progress', language, { current: minutes, needed: 30 - minutesNum });
          }
        }
        case 'continuousLearning': {
          const streak = await AsyncStorage.getItem('currentStreak') || '0';
          const streakNum = parseInt(streak);
          if (streakNum >= 3) {
            return t('continuous_days', language, { days: streak });
          } else {
            return t('continuous_learning_progress', language, { current: streak, needed: 3 - streakNum });
          }
        }
        case 'perfectReview': {
          const today = new Date().toDateString();
          const perfectReviewKey = `perfectReview_${today}`;
          const isPerfect = await AsyncStorage.getItem(perfectReviewKey);
          if (isPerfect === 'true') {
            return t('perfect_review_description', language);
          } else {
            return t('perfect_review_progress', language);
          }
        }
        default:
          return '';
      }
    } catch (error) {
      console.error(`[DailyRewardsManager] 获取奖励进度失败 ${rewardId}:`, error);
      return '';
    }
  }

  // 领取单个奖励
  public async claimReward(rewardId: string, language: AppLanguage = 'zh-CN'): Promise<ExperienceGainResult | null> {
    try {
      const rewards = await this.checkRewardConditions(language);
      const reward = rewards.find(r => r.id === rewardId);
      
      if (!reward || reward.status !== 'available') {
        console.log(`[DailyRewardsManager] 奖励 ${rewardId} 不可领取`);
        return null;
      }

      // 添加经验值
      const result = await experienceManager.addExperience(reward.xpAmount, 'dailyReward', { rewardId });
      
      if (result && result.success) {
        // 更新奖励状态为已领取
        reward.status = 'claimed';
        reward.claimedAt = new Date();
        
        // 保存状态
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(rewards));
        this.notifyStateChange(rewards); // 通知回调
        
        console.log(`[DailyRewardsManager] 奖励 ${rewardId} 领取成功，获得 ${reward.xpAmount} XP`);
        return result;
      }
      
      return null;
    } catch (error) {
      console.error(`[DailyRewardsManager] 领取奖励失败 ${rewardId}:`, error);
      return null;
    }
  }

  // 一键领取全部可用奖励
  public async claimAllRewards(language: AppLanguage = 'zh-CN'): Promise<ExperienceGainResult | null> {
    try {
      const rewards = await this.checkRewardConditions(language);
      const availableRewards = rewards.filter(r => r.status === 'available');
      
      if (availableRewards.length === 0) {
        console.log('[DailyRewardsManager] 没有可领取的奖励');
        return null;
      }

      let totalXp = 0;
      let successCount = 0;
      
      // 逐个领取奖励，确保状态正确更新
      for (const reward of availableRewards) {
        const result = await this.claimReward(reward.id);
        if (result && result.success) {
          totalXp += reward.xpAmount;
          successCount++;
        }
      }

      if (successCount > 0) {
        console.log(`[DailyRewardsManager] 批量领取成功，共获得 ${totalXp} XP`);
        
        // 重新获取最新状态并通知回调
        const updatedRewards = await this.checkRewardConditions();
        this.notifyStateChange(updatedRewards);
        
        return {
          success: true,
          xpGained: totalXp,
          message: `成功领取 ${successCount} 个奖励，共获得 ${totalXp} 经验值`,
          oldExperience: 0,
          newExperience: 0,
          oldLevel: 1,
          newLevel: 1,
          leveledUp: false,
          progressChange: totalXp
        };
      }
      
      return null;
    } catch (error) {
      console.error('[DailyRewardsManager] 批量领取奖励失败:', error);
      return null;
    }
  }

  // 获取奖励状态
  public async getRewardsState(language: AppLanguage = 'zh-CN'): Promise<DailyRewardsState> {
    try {
      const rewards = await this.checkRewardConditions(language);
      const totalAvailableXP = rewards
        .filter(r => r.status === 'available')
        .reduce((sum, r) => sum + r.xpAmount, 0);
      
      const lastResetDate = await AsyncStorage.getItem(this.RESET_KEY) || new Date().toDateString();
      
      return {
        rewards,
        totalAvailableXP,
        lastResetDate,
        isLoading: false
      };
    } catch (error) {
      console.error('[DailyRewardsManager] 获取奖励状态失败:', error);
      return {
        rewards: [],
        totalAvailableXP: 0,
        lastResetDate: new Date().toDateString(),
        isLoading: false
      };
    }
  }

  // 记录新单词收集
  public async recordNewWord(): Promise<void> {
    try {
      const today = new Date().toDateString();
      const key = `newWords_${today}`;
      const currentCount = await AsyncStorage.getItem(key) || '0';
      const newCount = parseInt(currentCount) + 1;
      await AsyncStorage.setItem(key, newCount.toString());
      console.log(`[DailyRewardsManager] 记录新单词，今日累计: ${newCount}`);
    } catch (error) {
      console.error('[DailyRewardsManager] 记录新单词失败:', error);
    }
  }

  // 记录复习完成
  public async recordReview(): Promise<void> {
    try {
      const today = new Date().toDateString();
      const key = `dailyReview_${today}`;
      const currentCount = await AsyncStorage.getItem(key) || '0';
      const newCount = parseInt(currentCount) + 1;
      await AsyncStorage.setItem(key, newCount.toString());
      console.log(`[DailyRewardsManager] 记录复习完成，今日累计: ${newCount}`);
    } catch (error) {
      console.error('[DailyRewardsManager] 记录复习完成失败:', error);
    }
  }

  // 记录学习时长
  public async recordStudyTime(minutes: number): Promise<void> {
    try {
      const today = new Date().toDateString();
      const key = `studyTime_${today}`;
      const currentTime = await AsyncStorage.getItem(key) || '0';
      const newTime = parseInt(currentTime) + minutes;
      await AsyncStorage.setItem(key, newTime.toString());
      console.log(`[DailyRewardsManager] 记录学习时长，今日累计: ${newTime} 分钟`);
    } catch (error) {
      console.error('[DailyRewardsManager] 记录学习时长失败:', error);
    }
  }

  // 记录完美复习
  public async recordPerfectReview(): Promise<void> {
    try {
      const today = new Date().toDateString();
      const key = `perfectReview_${today}`;
      await AsyncStorage.setItem(key, 'true');
      console.log('[DailyRewardsManager] 记录完美复习');
    } catch (error) {
      console.error('[DailyRewardsManager] 记录完美复习失败:', error);
    }
  }

  // 刷新奖励翻译（用于语言切换）
  public async refreshTranslations(language: AppLanguage): Promise<void> {
    try {
      console.log('[DailyRewardsManager] 刷新奖励翻译:', language);
      // 强制重新生成翻译后的奖励配置
      const rewards = await this.checkRewardConditions(language);
      this.notifyStateChange(rewards);
    } catch (error) {
      console.error('[DailyRewardsManager] 刷新翻译失败:', error);
    }
  }
}

export const dailyRewardsManager = DailyRewardsManager.getInstance();
