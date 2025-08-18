import { useState, useEffect, useCallback } from 'react';
import { dailyRewardsManager } from '../services/dailyRewardsManager';
import { DailyRewardsState, DailyReward } from '../../../types/dailyRewards';
import { ExperienceGainResult } from '../../../types/experience';
import { AppLanguage, t } from '../../../constants/translations';

export const useDailyRewards = (language: AppLanguage = 'zh-CN') => {
  const [rewardsState, setRewardsState] = useState<DailyRewardsState>({
    rewards: [],
    totalAvailableXP: 0,
    lastResetDate: new Date().toDateString(),
    isLoading: true
  });

  // 检查奖励条件
  const checkRewards = useCallback(async () => {
    try {
      console.log('[useDailyRewards] 开始检查奖励...');
      setRewardsState(prev => ({ ...prev, isLoading: true }));
      const state = await dailyRewardsManager.getRewardsState(language);
      console.log('[useDailyRewards] 获取到奖励状态:', state);
      
      // 确保始终有奖励数据
      if (!state.rewards || state.rewards.length === 0) {
        console.log('[useDailyRewards] 没有获取到奖励数据，创建默认奖励');
        const defaultRewards = [
          {
            id: 'newWords',
            name: t('collect_new_words', language),
            description: t('collect_words_description', language),
            xpAmount: 10,
            icon: '📚',
            status: 'locked' as const,
            condition: t('collect_words_condition', language),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          },
          {
            id: 'dailyReview',
            name: t('daily_review', language),
            description: t('daily_review_description', language),
            xpAmount: 5,
            icon: '✅',
            status: 'locked' as const,
            condition: t('daily_review_condition', language),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          },
          {
            id: 'studyTime',
            name: t('study_time', language),
            description: t('study_time_description', language),
            xpAmount: 3,
            icon: '⏰',
            status: 'locked' as const,
            condition: t('study_time_condition', language),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          },
          {
            id: 'continuousLearning',
            name: t('continuous_learning', language),
            description: t('continuous_learning_description', language),
            xpAmount: 8,
            icon: '🔥',
            status: 'locked' as const,
            condition: t('continuous_learning_condition', language),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          },
          {
            id: 'perfectReview',
            name: t('perfect_review', language),
            description: t('perfect_review_description', language),
            xpAmount: 15,
            icon: '⭐',
            status: 'locked' as const,
            condition: t('perfect_review_condition', language),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        ];
        
        const defaultState = {
          rewards: defaultRewards,
          totalAvailableXP: 0,
          lastResetDate: new Date().toDateString(),
          isLoading: false
        };
        
        setRewardsState(defaultState);
        console.log('[useDailyRewards] 已设置默认奖励状态');
      } else {
        setRewardsState(state);
      }
    } catch (error) {
      console.error('[useDailyRewards] 检查奖励失败:', error);
      setRewardsState(prev => ({ ...prev, isLoading: false }));
    }
  }, [language]);

  // 注册状态回调，实时更新奖励状态
  useEffect(() => {
    console.log('[useDailyRewards] 注册状态回调...');
    const unsubscribe = dailyRewardsManager.registerStateCallback((rewards) => {
      console.log('[useDailyRewards] 收到状态回调，奖励数量:', rewards.length);
      
      // 确保回调数据有效
      if (rewards && rewards.length > 0) {
        setRewardsState(prev => ({
          ...prev,
          rewards,
          totalAvailableXP: rewards.filter(r => r.status === 'available').reduce((sum, r) => sum + r.xpAmount, 0)
        }));
      } else {
        console.log('[useDailyRewards] 状态回调数据无效，保持当前状态');
      }
    });

    // 注册回调后立即检查奖励
    console.log('[useDailyRewards] 回调注册完成，立即检查奖励...');
    checkRewards();

    return unsubscribe;
  }, [checkRewards]);

  // 当语言变化时，重新获取翻译后的奖励数据
  useEffect(() => {
    console.log('[useDailyRewards] 语言变化，刷新奖励翻译...');
    checkRewards();
  }, [language, checkRewards]);

  // 领取单个奖励
  const claimReward = useCallback(async (rewardId: string): Promise<ExperienceGainResult | null> => {
    try {
      const result = await dailyRewardsManager.claimReward(rewardId, language);
      if (result && result.success) {
        // 状态更新会通过回调自动处理
        console.log('[useDailyRewards] 奖励领取成功:', rewardId);
      }
      return result;
    } catch (error) {
      console.error('[useDailyRewards] 领取奖励失败:', error);
      return null;
    }
  }, [language]);

  // 一键领取全部
  const claimAllRewards = useCallback(async (): Promise<ExperienceGainResult | null> => {
    try {
      const result = await dailyRewardsManager.claimAllRewards(language);
      if (result && result.success) {
        // 状态更新会通过回调自动处理
        console.log('[useDailyRewards] 批量领取成功');
      }
      return result;
    } catch (error) {
      console.error('[useDailyRewards] 批量领取失败:', error);
      return null;
    }
  }, [language]);

  // 刷新奖励状态
  const refreshRewards = useCallback(async () => {
    await checkRewards();
  }, [checkRewards]);

  // 初始化时检查奖励
  // useEffect(() => {
  //   console.log('[useDailyRewards] 组件挂载，立即检查奖励...');
  //   checkRewards();
  // }, [checkRewards]);

  // 检查是否有可领取的奖励
  const hasAvailableRewards = rewardsState.totalAvailableXP > 0;

  // 获取可领取的奖励数量
  const availableRewardsCount = rewardsState.rewards.filter(r => r.status === 'available').length;

  return {
    rewardsState,
    hasAvailableRewards,
    availableRewardsCount,
    checkRewards,
    claimReward,
    claimAllRewards,
    refreshRewards,
    isLoading: rewardsState.isLoading
  };
};
