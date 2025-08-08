import { useState, useRef, useCallback } from 'react';
import { learningDataService } from '../../../services/learningDataService';
import { wrongWordsManager } from '../services/wrongWordsManager';
import { unifiedSyncService } from '../../../services/unifiedSyncService';
import { useVocabulary } from '../../../context/VocabularyContext';
import { useAuth } from '../../../context/AuthContext';
import Logger from '../../../utils/logger';

// 创建页面专用日志器
const logger = Logger.forPage('ReviewStats');

export interface ReviewStats {
  totalWords: number;
  rememberedWords: number;
  forgottenWords: number;
  experience: number;
  accuracy: number;
}

export interface ReviewAction {
  word: string;
  remembered: boolean;
  translation?: string;
}

export const useReviewStats = () => {
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    totalWords: 0,
    rememberedWords: 0,
    forgottenWords: 0,
    experience: 0,
    accuracy: 0,
  });
  const [reviewActions, setReviewActions] = useState<ReviewAction[]>([]);
  const [finalStats, setFinalStats] = useState<ReviewStats | null>(null);
  const { updateWord } = useVocabulary();
  const { user } = useAuth();
  
  const rememberedRef = useRef(0);
  const forgottenRef = useRef(0);
  const reviewActionsRef = useRef<ReviewAction[]>([]);

  // 优化的后端用户词汇表进度更新函数
  const updateBackendWordProgress = useCallback(async (word: string, isCorrect: boolean) => {
    try {
      const userId = user?.id;
      if (!userId) {
        logger.warn('用户未登录，跳过后端更新');
        return isCorrect ? 2 : 1;
      }
      
      // 获取当前单词的学习记录
      const records = await learningDataService.getLearningRecords();
      const record = records.find(r => r.word === word);
      
      // 构建进度数据
      const currentReviewCount = (record?.reviewCount || 0) + 1;
      const currentCorrectCount = (record?.correctCount || 0) + (isCorrect ? 1 : 0);
      const currentIncorrectCount = (record?.incorrectCount || 0) + (isCorrect ? 0 : 1);
      
      // 更新连续计数
      let currentConsecutiveCorrect = 0;
      let currentConsecutiveIncorrect = 0;
      
      if (isCorrect) {
        currentConsecutiveCorrect = (record?.consecutiveCorrect || 0) + 1;
        currentConsecutiveIncorrect = 0;
      } else {
        currentConsecutiveIncorrect = (record?.consecutiveIncorrect || 0) + 1;
        currentConsecutiveCorrect = 0;
      }
      
      const progress = {
        reviewCount: currentReviewCount,
        correctCount: currentCorrectCount,
        incorrectCount: currentIncorrectCount,
        consecutiveCorrect: currentConsecutiveCorrect,
        consecutiveIncorrect: currentConsecutiveIncorrect,
        mastery: record?.masteryLevel || 1,
        lastReviewDate: new Date().toISOString(),
        nextReviewDate: record?.nextReviewDate ? new Date(record.nextReviewDate).toISOString() : new Date().toISOString(),
        interval: (record?.intervalDays || 1) * 24,
        easeFactor: 2.5,
        totalStudyTime: record?.timeSpent || 0,
        averageResponseTime: 0,
        confidence: record?.confidenceLevel || 1,
      };
      
      logger.log('发送进度更新请求', 'updateBackendWordProgress');
      
      // 遵循多邻国方案：本地计算经验值
      const experienceGained = isCorrect ? 2 : 1;
      logger.info('本地经验值计算', 'updateBackendWordProgress');
      
      // 使用统一同步服务
      await unifiedSyncService.addToSyncQueue({
        type: 'learningRecords',
        data: [{
          word,
          progress,
          isSuccessfulReview: isCorrect,
          timestamp: Date.now()
        }],
        userId,
        operation: 'create',
        priority: 'medium'
      });
      
      logger.info('学习记录已加入同步队列', 'updateBackendWordProgress');
      
      return experienceGained;
    } catch (error) {
      logger.error('更新学习记录失败', 'updateBackendWordProgress');
      return isCorrect ? 2 : 1;
    }
  }, [user]);

  // 统一封装添加 action 的逻辑
  const addReviewAction = useCallback((word: string, remembered: boolean, translation?: string) => {
    console.log(`📝 添加复习动作: ${word}, remembered: ${remembered}, translation: ${translation}`);
    setReviewActions(prev => {
      const newActions = [...prev, { word, remembered, translation }];
      console.log(`📝 复习动作数组更新: 从 ${prev.length} 个增加到 ${newActions.length} 个`);
      // 同时更新 ref
      reviewActionsRef.current = newActions;
      return newActions;
    });
  }, []);

  // 更新统计
  const updateStats = useCallback((word: string, isCorrect: boolean, translation?: string) => {
    console.log(`📊 更新统计 - ${isCorrect ? '记住' : '忘记'}单词: ${word}`);
    
    if (isCorrect) {
      rememberedRef.current += 1;
    } else {
      forgottenRef.current += 1;
    }
    
    setReviewStats(prev => {
      const remembered = prev.rememberedWords + (isCorrect ? 1 : 0);
      const forgotten = prev.forgottenWords + (isCorrect ? 0 : 1);
      const total = prev.totalWords;
      
      // 不在这里累加经验值，让calculateFinalStats基于reviewActions计算
      const accuracy = total > 0 ? Math.round((remembered / total) * 100) : 0;
      
      const newStats = {
        ...prev,
        rememberedWords: remembered,
        forgottenWords: forgotten,
        experience: 0, // 重置为0，让calculateFinalStats重新计算
        accuracy,
      };
      
      console.log(`📈 统计更新完成:`, {
        remembered,
        forgotten,
        total,
        accuracy,
        newStats
      });
      
      return newStats;
    });
    
    // 添加复习动作
    addReviewAction(word, isCorrect, translation);
  }, [addReviewAction]);

  // 初始化统计数据
  const initializeStats = useCallback((totalWords: number) => {
    // 只在第一次初始化时设置，不重置已有数据
    if (reviewStats.totalWords === 0) {
      const initialStats = {
        totalWords,
        rememberedWords: 0,
        forgottenWords: 0,
        experience: 0,
        accuracy: 0,
      };
      console.log('📊 初始化统计数据:', initialStats);
      setReviewStats(initialStats);
      
      // 重置计数器
      console.log('🔄 重置计数器 - rememberedRef: 0, forgottenRef: 0');
      rememberedRef.current = 0;
      forgottenRef.current = 0;
    } else {
      console.log('📊 已有统计数据，跳过初始化 - totalWords:', reviewStats.totalWords);
    }
  }, [reviewStats.totalWords]);

  // 计算最终统计数据
  const calculateFinalStats = useCallback(() => {
    console.log('📊 开始计算最终统计数据');
    
    // 使用 ref 获取最新的 reviewActions 数据
    const currentReviewActions = reviewActionsRef.current;
    console.log('📊 reviewActions 数组 (从 ref):', currentReviewActions);
    console.log('📊 reviewActions 数组长度 (从 ref):', currentReviewActions.length);
    console.log('📊 reviewActions 数组内容 (从 ref):', JSON.stringify(currentReviewActions, null, 2));
    
    // 如果 reviewActions 为空，尝试延迟计算
    if (currentReviewActions.length === 0) {
      console.log('⚠️ reviewActions 为空，延迟计算统计数据');
      setTimeout(() => {
        const delayedReviewActions = reviewActionsRef.current;
        console.log('📊 延迟后重新计算 - reviewActions 数组 (从 ref):', delayedReviewActions);
        console.log('📊 延迟后 reviewActions 数组长度 (从 ref):', delayedReviewActions.length);
        
        // 直接统计 reviewActions 数组中的数据
        const totalWords = delayedReviewActions.length;
        const rememberedWords = delayedReviewActions.filter(action => action.remembered).length;
        const forgottenWords = delayedReviewActions.filter(action => !action.remembered).length;
        
        // 计算经验值：记得的单词*2 + 不记得的单词*1
        const totalExperience = (rememberedWords * 2) + (forgottenWords * 1);
        
        const accuracy = totalWords > 0 ? Math.round((rememberedWords / totalWords) * 100) : 0;
        
        const finalStats = {
          totalWords,
          rememberedWords,
          forgottenWords,
          experience: totalExperience,
          accuracy,
        };
        
        console.log('📊 延迟后最终统计数据（基于 reviewActions）:', finalStats);
        setFinalStats(finalStats);
      }, 100);
      
      // 返回默认值
      return {
        totalWords: 0,
        rememberedWords: 0,
        forgottenWords: 0,
        experience: 0,
        accuracy: 0,
      };
    }
    
    // 直接统计 reviewActions 数组中的数据
    const totalWords = currentReviewActions.length;
    const rememberedWords = currentReviewActions.filter(action => action.remembered).length;
    const forgottenWords = currentReviewActions.filter(action => !action.remembered).length;
    
    // 计算经验值：记得的单词*2 + 不记得的单词*1
    const totalExperience = (rememberedWords * 2) + (forgottenWords * 1);
    
    const accuracy = totalWords > 0 ? Math.round((rememberedWords / totalWords) * 100) : 0;
    
    const finalStats = {
      totalWords,
      rememberedWords,
      forgottenWords,
      experience: totalExperience,
      accuracy,
    };
    
    console.log('📊 最终统计数据（基于 reviewActions）:', finalStats);
    console.log('📊 统计详情:', {
      totalActions: currentReviewActions.length,
      rememberedActions: currentReviewActions.filter(a => a.remembered).length,
      forgottenActions: currentReviewActions.filter(a => !a.remembered).length,
      experienceCalculation: `(${rememberedWords} * 2) + (${forgottenWords} * 1) = ${totalExperience}`
    });
    
    setFinalStats(finalStats);
    
    return finalStats;
  }, []);

  return {
    reviewStats,
    reviewActions,
    finalStats,
    rememberedRef,
    forgottenRef,
    updateBackendWordProgress,
    updateStats,
    initializeStats,
    calculateFinalStats,
    addReviewAction
  };
}; 