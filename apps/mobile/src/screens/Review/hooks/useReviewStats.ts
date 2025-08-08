import { useState, useRef, useCallback } from 'react';
import { learningDataService } from '../../../services/learningDataService';
import { wrongWordsManager } from '../../../services/wrongWordsManager';
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
    setReviewActions(prev => ([...prev, { word, remembered, translation }]));
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
      
      // 直接计算经验值，不依赖 actions 数组
      const currentExperience = prev.experience;
      const newExperience = currentExperience + (isCorrect ? 2 : 1);
      
      const accuracy = total > 0 ? Math.round((remembered / total) * 100) : 0;
      
      const newStats = {
        ...prev,
        rememberedWords: remembered,
        forgottenWords: forgotten,
        experience: newExperience,
        accuracy,
      };
      
      console.log(`📈 统计更新完成:`, {
        remembered,
        forgotten,
        total,
        currentExperience,
        newExperience,
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
    const currentStats = reviewStats;
    
    // 直接使用 reviewStats 中的数据，这是累积的统计数据
    const rememberedWords = currentStats.rememberedWords;
    const forgottenWords = currentStats.forgottenWords;
    const totalExperience = currentStats.experience;
    
    const accuracy = currentStats.totalWords > 0 ? Math.round((rememberedWords / currentStats.totalWords) * 100) : 0;
    
    const finalStats = {
      totalWords: currentStats.totalWords,
      rememberedWords,
      forgottenWords,
      experience: totalExperience,
      accuracy,
    };
    
    console.log('📊 最终统计数据:', finalStats);
    console.log('📊 数据来源 - reviewStats:', currentStats);
    setFinalStats(finalStats);
    
    return finalStats;
  }, [reviewStats]);

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