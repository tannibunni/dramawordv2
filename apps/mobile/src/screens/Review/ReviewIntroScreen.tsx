import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVocabulary } from '../../context/VocabularyContext';
import { useShowList, Show } from '../../context/ShowListContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '../../components/navigation/NavigationContext';
import { TMDBService } from '../../services/tmdbService';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/config';
import { colors } from '../../constants/colors';
import Logger from '../../utils/logger';
import { SyncStatusIndicator } from '../../components/common/SyncStatusIndicator';

import { wrongWordsManager } from '../../services/wrongWordsManager';
import { animationManager } from '../../services/animationManager';
import { unifiedSyncService } from '../../services/unifiedSyncService';
import { ExperienceLogic } from '../../utils/conditionalLogic';

const ReviewIntroScreen = () => {
  // 创建页面专用日志器
  const logger = Logger.forPage('ReviewIntroScreen');
  const vocabularyContext = useVocabulary();
  const { shows } = useShowList();
  const { navigate } = useNavigation();
  const { appLanguage } = useAppLanguage();
  const { user } = useAuth();
  
  // 安全检查，确保vocabularyContext存在
  const vocabulary = vocabularyContext?.vocabulary || [];
  const refreshLearningProgress = vocabularyContext?.refreshLearningProgress || (() => Promise.resolve());
  
  const todayCount = vocabulary?.length || 0;
  // 计算真实的错词数量 - 从用户词汇表中获取学习记录数据
  const [wrongWordsCount, setWrongWordsCount] = useState(0);
  
  // 统一的AsyncStorage访问工具类
  const storageUtils = {
    // 经验值相关存储
    experience: {
      async getGain() {
        return await AsyncStorage.getItem('experienceGain');
      },
      async getGainApplied() {
        return await AsyncStorage.getItem('experienceGainApplied');
      },
      async setGain(value: number) {
        return await AsyncStorage.setItem('experienceGain', JSON.stringify(value));
      },
      async setGainApplied(timestamp: string) {
        return await AsyncStorage.setItem('experienceGainApplied', timestamp);
      },
      async removeGain() {
        return await AsyncStorage.removeItem('experienceGain');
      },
      async removeGainApplied() {
        return await AsyncStorage.removeItem('experienceGainApplied');
      },
      async clearAll() {
        await AsyncStorage.removeItem('experienceGain');
        await AsyncStorage.removeItem('experienceGainApplied');
        await AsyncStorage.removeItem('experienceEvents');
      }
    },
    
    // 用户数据相关存储
    user: {
      async getData() {
        return await AsyncStorage.getItem('userData');
      },
      async getStats() {
        return await AsyncStorage.getItem('userStats');
      },
      async setStats(stats: any) {
        return await AsyncStorage.setItem('userStats', JSON.stringify(stats));
      }
    },
    
    // 导航参数相关存储
    navigation: {
      async getParams() {
        return await AsyncStorage.getItem('navigationParams');
      },
      async removeParams() {
        return await AsyncStorage.removeItem('navigationParams');
      },
      async getRefreshFlag() {
        return await AsyncStorage.getItem('refreshVocabulary');
      },
      async removeRefreshFlag() {
        return await AsyncStorage.removeItem('refreshVocabulary');
      }
    }
  };

  // 本地经验值重复计算防止器 - 使用新的条件逻辑工具
  const localExperienceDuplicationPreventer = {
    // 检查并应用经验值增益，防止重复计算
    async checkAndApplyExperienceGain(currentExperience: number): Promise<number> {
      try {
        const gainData = await storageUtils.experience.getGain();
        
        // 使用条件逻辑工具检查是否应该应用经验值增益
        const gainAppliedKey = await storageUtils.experience.getGainApplied();
        if (!ExperienceLogic.shouldApplyExperienceGain(gainData, gainAppliedKey)) {
          if (ExperienceLogic.isExperienceGainApplied(gainAppliedKey)) {
            logger.info(`经验值增益已应用过，跳过重复计算，当前经验值: ${currentExperience}`);
          }
          return currentExperience;
        }
        
        // 验证经验值增益的有效性
        if (!ExperienceLogic.isValidExperienceGain(gainData)) {
          logger.warn("经验值增益数据无效");
          return currentExperience;
        }
        
        // 此时gainData已经验证为有效，确保不为null
        if (!gainData) {
          logger.warn('经验值增益数据为空');
          return currentExperience;
        }
        
        const gainedExp = JSON.parse(gainData) as number;
        const finalExperience = ExperienceLogic.calculateFinalExperience(currentExperience, gainedExp);
        
        // 标记为已应用
        await storageUtils.experience.setGainApplied(Date.now().toString());
        
        logger.info('应用经验值增益', {
          currentExperience,
          gainedExp,
          finalExperience,
          timestamp: new Date().toISOString()
        });
        
        return finalExperience;
      } catch (error) {
        logger.error("检查并应用经验值增益失败");
        return currentExperience;
      }
    },
    
    // 清理经验值增益状态
    async clearExperienceGainStatus(): Promise<void> {
      try {
        await storageUtils.experience.clearAll();
        logger.info('清理经验值增益状态');
      } catch (error) {
        logger.error("检查并应用经验值增益失败");
      }
    },
    
    // 设置新的经验值增益
    async setExperienceGain(gainedExp: number): Promise<void> {
      try {
        await storageUtils.experience.setGain(gainedExp);
        // 清除之前的应用状态
        await storageUtils.experience.removeGainApplied();
        logger.info("设置新的经验值增益");
      } catch (error) {
        logger.error("检查并应用经验值增益失败");
      }
    }
  };
  
  // 获取用户ID的辅助函数
  const getUserId = async (): Promise<string | null> => {
    try {
      const userData = await storageUtils.user.getData();
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.id || null;
      }
      return null;
    } catch (error) {
      console.error('获取用户ID失败:', error);
      return null;
    }
  };

  // 手动刷新错词数量的函数
  const refreshWrongWordsCount = async () => {
    try {
      // 优先使用本地vocabulary数据计算错词数量
      if (vocabulary && vocabulary.length > 0) {
        console.log('🔍 ReviewIntroScreen: 开始计算错词数量');
        console.log('🔍 vocabulary 总数:', vocabulary.length);
        console.log('🔍 vocabulary 数据结构示例:', vocabulary[0]);
        
        // 直接使用本地筛选逻辑计算错词数量
        const localWrongWords = vocabulary.filter((word: any) => {
          const consecutiveCorrect = word.consecutiveCorrect || 0;
          const incorrectCount = word.incorrectCount || 0;
          const consecutiveIncorrect = word.consecutiveIncorrect || 0;
          
          // 连续答对2次后从错词卡移除
          if (consecutiveCorrect >= 2) {
            console.log(`🔍 ReviewIntroScreen 检查单词: ${word.word} - 连续答对${consecutiveCorrect}次，不是错词`);
            return false;
          }
          
          // 有答错记录或连续答错
          const isWrong = incorrectCount > 0 || consecutiveIncorrect > 0;
          console.log(`🔍 ReviewIntroScreen 检查单词: ${word.word}`, {
            incorrectCount,
            consecutiveIncorrect,
            consecutiveCorrect,
            isWrongWord: isWrong
          });
          return isWrong;
        });
        
        console.log(`🔍 ReviewIntroScreen: 错词数量计算结果: ${localWrongWords.length}`);
        console.log('🔍 错词列表:', localWrongWords.map(w => w.word));
        // 使用setTimeout来避免在useInsertionEffect中调用setState
        setTimeout(() => {
          setWrongWordsCount(localWrongWords.length);
        }, 0);
        return;
      }

      // 如果本地vocabulary为空，直接设置为0，不依赖云端数据
      console.log('🔍 ReviewIntroScreen: vocabulary为空，错词数量设为0');
      // 使用setTimeout来避免在useInsertionEffect中调用setState
      setTimeout(() => {
        setWrongWordsCount(0);
      }, 0);
    } catch (error) {
      console.error('🔍 ReviewIntroScreen: 手动刷新错词数量失败', error);
      logger.error("检查并应用经验值增益失败");
      // 使用setTimeout来避免在useInsertionEffect中调用setState
      setTimeout(() => {
        setWrongWordsCount(0);
      }, 0);
    }
  };
  
  // 获取用户词汇表的学习记录数据
  useEffect(() => {
    const fetchWrongWordsCount = async () => {
      try {
        // 优先使用本地vocabulary数据计算错词数量
        if (vocabulary && vocabulary.length > 0) {
          console.log('🔍 ReviewIntroScreen useEffect: 开始计算错词数量');
          console.log('🔍 vocabulary 总数:', vocabulary.length);
          console.log('🔍 vocabulary 数据结构示例:', vocabulary[0]);
          
          // 直接使用本地筛选逻辑计算错词数量
          const localWrongWords = vocabulary.filter((word: any) => {
            const consecutiveCorrect = word.consecutiveCorrect || 0;
            const incorrectCount = word.incorrectCount || 0;
            const consecutiveIncorrect = word.consecutiveIncorrect || 0;
            
            // 连续答对2次后从错词卡移除
            if (consecutiveCorrect >= 2) {
              console.log(`🔍 ReviewIntroScreen 检查单词: ${word.word} - 连续答对${consecutiveCorrect}次，不是错词`);
              return false;
            }
            
            // 有答错记录或连续答错
            const isWrong = incorrectCount > 0 || consecutiveIncorrect > 0;
            console.log(`🔍 ReviewIntroScreen 检查单词: ${word.word}`, {
              incorrectCount,
              consecutiveIncorrect,
              consecutiveCorrect,
              isWrongWord: isWrong
            });
            return isWrong;
          });
          
          console.log(`🔍 ReviewIntroScreen useEffect: 错词数量计算结果: ${localWrongWords.length}`);
          console.log('🔍 错词列表:', localWrongWords.map(w => w.word));
          // 使用setTimeout来避免在useInsertionEffect中调用setState
          setTimeout(() => {
            setWrongWordsCount(localWrongWords.length);
          }, 0);
          return;
        }

        // 如果本地vocabulary为空，直接设置为0，不依赖云端数据
        console.log('🔍 ReviewIntroScreen useEffect: vocabulary为空，错词数量设为0');
        // 使用setTimeout来避免在useInsertionEffect中调用setState
        setTimeout(() => {
          setWrongWordsCount(0);
        }, 0);
      } catch (error) {
        console.error('🔍 ReviewIntroScreen useEffect: 获取错词数量失败', error);
        logger.error("检查并应用经验值增益失败");
        // 使用setTimeout来避免在useInsertionEffect中调用setState
        setTimeout(() => {
          setWrongWordsCount(0);
        }, 0);
      }
    };

    // 使用setTimeout来避免在useInsertionEffect中调用setState
    setTimeout(() => {
      fetchWrongWordsCount();
    }, 0);
  }, [vocabulary]); // 当vocabulary变化时重新获取，确保数据同步
  
  // 状态管理
  const [userStats, setUserStats] = useState({
    experience: 0,
    level: 1,
    collectedWords: 0,
    contributedWords: 0,
    totalReviews: 0,
    currentStreak: 0
  });
  
  // 经验值动画状态
  const [showExperienceAnimation, setShowExperienceAnimation] = useState(false);
  const [experienceGained, setExperienceGained] = useState(0);

  const [progressBarValue, setProgressBarValue] = useState(0); // 添加状态来跟踪进度条值
  const [hasCheckedExperience, setHasCheckedExperience] = useState(false);
  const [animatedExperience, setAnimatedExperience] = useState(0);
  const [isProgressBarAnimating, setIsProgressBarAnimating] = useState(false);
  const [hasInitializedProgressBar, setHasInitializedProgressBar] = useState(false);
  
  // 新增：同步锁状态，防止重复数据读取
  const [isSyncingExperience, setIsSyncingExperience] = useState(false);
  
  // 统计数字动画状态
  const [animatedCollectedWords, setAnimatedCollectedWords] = useState(0);
  const [animatedContributedWords, setAnimatedContributedWords] = useState(0);
  
  // 使用统一动画管理器的动画值
  const {
    experienceAnimation,
    scaleAnimation,
    opacityAnimation,
    progressAnimation,
    numberAnimation,
    levelAnimation,
    collectedWordsAnimation,
    contributedWordsAnimation,
    progressBarAnimation
  } = animationManager.getAnimationValues();
  
  // 组件初始化时重置经验值检查状态
  useEffect(() => {
    setHasCheckedExperience(false);
    setIsProgressBarAnimating(false); // 同时重置动画状态
    logger.info('重置经验值检查状态和动画状态');
    
    // 延迟检查经验值动画，确保所有状态都已加载
    const timer = setTimeout(() => {
      logger.info('延迟检查经验值动画');
      checkForExperienceGain();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // 初始化进度条显示当前经验值进度
  useEffect(() => {
    if (userStats.experience >= 0) {
      const currentProgress = getExperienceProgressFromStats(userStats);
      const progressPercentage = currentProgress * 100;
      
      console.log('🎯 初始化进度条:', {
        experience: userStats.experience,
        level: userStats.level,
        progress: currentProgress,
        percentage: progressPercentage
      });
      
      // 设置进度条动画值
      progressBarAnimation.setValue(progressPercentage);
      setProgressBarValue(currentProgress);
    }
  }, [userStats.experience, userStats.level]);
  
  // 统一的用户数据加载和检查逻辑 - 修复数据冲突问题
  useEffect(() => {
    let isMounted = true;
    let loadTimer: number | null = null;
    let hasLoaded = false; // 防止重复加载
    let loadTimeout: number | null = null; // 防抖机制
    
    const unifiedDataLoad = async () => {
      try {
        // 防止组件卸载后的状态更新
        if (!isMounted || hasLoaded) return;
        
        // 如果正在进行经验值动画或同步，跳过加载
        if (isProgressBarAnimating || isSyncingExperience) {
          logger.info('经验值动画或同步进行中，跳过数据加载');
          return;
        }
        
        hasLoaded = true; // 标记已加载
        
        // 如果已经检查过经验值增益，只加载用户统计
        if (hasCheckedExperience) {
          logger.info('已检查过经验值增益，只加载用户统计');
          await loadUserStats();
          return;
        }
        
        // 检查是否有经验值增益标记
        const gainData = await AsyncStorage.getItem('experienceGain');
        if (gainData) {
          logger.info('检测到经验值增益标记，优先处理经验值动画');
          await checkForExperienceGain();
          return;
        }
        
        // 正常加载用户统计
        await loadUserStats();
        
        // 延迟检查经验值增益，确保用户统计已加载
        if (isMounted) {
          loadTimer = setTimeout(() => {
            if (isMounted && !hasCheckedExperience && !isSyncingExperience) {
              checkForExperienceGain();
            }
          }, 500);
        }
        
      } catch (error) {
        logger.error("检查并应用经验值增益失败");
        hasLoaded = false; // 出错时重置标记
      }
    };
    
    // 防抖执行，避免重复调用
    if (loadTimeout) {
      clearTimeout(loadTimeout);
    }
    
    loadTimeout = setTimeout(() => {
      if (isMounted && !hasLoaded) {
        unifiedDataLoad();
      }
    }, 200);
    
    return () => {
      isMounted = false;
      if (loadTimeout) clearTimeout(loadTimeout);
      if (loadTimer) clearTimeout(loadTimer);
    };
  }, [vocabulary]); // 移除其他依赖项，避免无限循环
  
  // 检查是否需要刷新vocabulary - 独立处理
  useEffect(() => {
    const checkRefreshVocabulary = async () => {
      const refreshFlag = await AsyncStorage.getItem('refreshVocabulary');
      if (refreshFlag === 'true') {
        logger.info('检测到vocabulary刷新标记，重新加载数据');
        await AsyncStorage.removeItem('refreshVocabulary');
        // 触发vocabulary重新加载
        await refreshLearningProgress();
      }
    };
    
    checkRefreshVocabulary();
  }, [refreshLearningProgress]);
  
  // 加载用户统计数据 - 使用多邻国风格的智能同步
  const loadUserStats = async () => {
    try {
      // 改进的同步锁机制 - 防止重复加载
      if (isSyncingExperience || isProgressBarAnimating) {
        logger.info('经验值同步或动画进行中，跳过用户统计加载');
        return;
      }
      
      // 设置加载锁，防止并发访问
      setIsSyncingExperience(true);
      
      // 检查经验值动画是否刚刚完成，如果是则保护经验值不被覆盖
      const animationCompletedTime = await AsyncStorage.getItem('experienceAnimationCompleted');
      if (animationCompletedTime) {
        const completedTime = parseInt(animationCompletedTime);
        const timeDiff = Date.now() - completedTime;
        // 如果动画完成时间在10秒内，保护经验值
        if (timeDiff < 10 * 1000) {
          logger.info('经验值动画刚刚完成，保护经验值不被覆盖', { timeDiff });
          
          // 获取最新的用户统计数据，确保经验值是最新的
          const currentStatsData = await AsyncStorage.getItem('userStats');
          if (currentStatsData) {
            try {
              const currentStats = JSON.parse(currentStatsData);
              logger.info('使用保护的最新经验值', {
                protectedExperience: currentStats.experience
              });
              
              // 直接使用保护的经验值，跳过后续加载
              setUserStats(currentStats);
              setAnimatedExperience(currentStats.experience);
              setAnimatedCollectedWords(vocabulary?.length || 0);
              setAnimatedContributedWords(currentStats.contributedWords);
              
              // 初始化进度条
              if (!isProgressBarAnimating) {
                const progressValue = getExperienceProgressFromStats(currentStats);
                const progressPercentage = progressValue * 100;
                progressBarAnimation.setValue(progressPercentage);
                setProgressBarValue(progressValue);
                setHasInitializedProgressBar(true);
              }
              
              setIsSyncingExperience(false);
              return;
            } catch (error) {
              logger.error("检查并应用经验值增益失败");
            }
          }
          
          // 清除标记，避免永久保护
          await AsyncStorage.removeItem('experienceAnimationCompleted');
        }
      }
      
      logger.info('开始加载用户统计数据');
      
      // 优先使用本地数据
      const localStatsData = await storageUtils.user.getStats();
      if (localStatsData) {
        const localStats = JSON.parse(localStatsData);
        
        // 使用本地经验值重复计算防止器，防止重复计算
        const finalExperience = await localExperienceDuplicationPreventer.checkAndApplyExperienceGain(localStats.experience || 0);
        
        // 确保经验值不被重置为0，并且正确累加
        const safeExperience = Math.max(finalExperience, localStats.experience || 0);
        
        // 检查是否有新的经验值增益需要应用
        const gainData = await AsyncStorage.getItem('experienceGain');
        if (gainData) {
          try {
            const gainedExp = JSON.parse(gainData) as number;
            const totalExperience = safeExperience + gainedExp;
            logger.info('应用新的经验值增益', {
              currentExperience: safeExperience,
              gainedExp,
              totalExperience
            });
            
            const updatedStats = {
              ...localStats,
              experience: totalExperience
            };
            
            // 清除经验值增益标记
            await AsyncStorage.removeItem('experienceGain');
            
            return updatedStats;
          } catch (error) {
            logger.error("检查并应用经验值增益失败");
          }
        }
        
        const updatedStats = {
          ...localStats,
          experience: safeExperience
        };
        
        logger.info('从本地存储加载统计数据', updatedStats);
        setUserStats(updatedStats);
        setAnimatedExperience(updatedStats.experience);
        setAnimatedCollectedWords(vocabulary?.length || 0);
        setAnimatedContributedWords(localStats.contributedWords);
        
        // 初始化进度条 - 只有在没有动画进行时才初始化
        if (!isProgressBarAnimating) {
          const progressValue = getExperienceProgressFromStats(updatedStats);
          const progressPercentage = progressValue * 100;
          progressBarAnimation.setValue(progressPercentage);
          setProgressBarValue(progressValue);
          setHasInitializedProgressBar(true);
        }
        
        // 使用增量同步策略：启动时检查数据一致性
        await performIncrementalSync(localStats);
        return;
      }
      
      // 如果本地没有数据，才从后端获取
      const userId = await getUserId();
      if (!userId) {
        logger.warn('用户未登录，初始化默认数据');
        
        // 初始化默认数据
        const defaultStats = {
          experience: 0,
          level: 1,
          collectedWords: vocabulary?.length || 0,
          contributedWords: 0,
          totalReviews: 0,
          currentStreak: 0
        };
        logger.info('初始化默认统计数据', defaultStats);
        setUserStats(defaultStats);
        setAnimatedExperience(0);
        setAnimatedCollectedWords(vocabulary?.length || 0);
        setAnimatedContributedWords(0);
        
        // 静默初始化进度条 - 不触发动画
        const progressValue = getExperienceProgressFromStats(defaultStats);
        const progressPercentage = progressValue * 100;
        progressBarAnimation.setValue(progressPercentage);
        setProgressBarValue(progressValue);
        setHasInitializedProgressBar(true);
        
        await storageUtils.user.setStats(defaultStats);
        return;
      }
      
      // 遵循多邻国原则：以本地数据为准，不主动拉取服务器数据
      logger.info('本地无数据但用户已登录，遵循多邻国原则以本地数据为准');
      
      // 初始化默认数据（用户已登录但本地无数据的情况）
      const defaultStats = {
        experience: 0,
        level: 1,
        collectedWords: vocabulary?.length || 0,
        contributedWords: 0,
        totalReviews: 0,
        currentStreak: 0
      };
      logger.info('初始化默认统计数据（用户已登录）', defaultStats);
      setUserStats(defaultStats);
      setAnimatedExperience(0);
      setAnimatedCollectedWords(vocabulary?.length || 0);
      setAnimatedContributedWords(0);
      
      // 静默初始化进度条 - 不触发动画
      const progressValue = getExperienceProgressFromStats(defaultStats);
      const progressPercentage = progressValue * 100;
      progressBarAnimation.setValue(progressPercentage);
      setProgressBarValue(progressValue);
      setHasInitializedProgressBar(true);
      
      await storageUtils.user.setStats(defaultStats);
    } catch (error) {
      logger.error("检查并应用经验值增益失败");
    } finally {
      // 释放同步锁
      setIsSyncingExperience(false);
    }
  };

  // 新增：增量同步策略 - 多邻国风格
  const performIncrementalSync = async (localStats: any) => {
    try {
      const userId = await getUserId();
      if (!userId) return;
      
      const userDataStr = await storageUtils.user.getData();
      if (!userDataStr) return;
      
      const userData = JSON.parse(userDataStr);
      const token = userData.token;
      
      if (!token) return;
      
      // 检查是否有待同步的变更
      const syncStatus = unifiedSyncService.getSyncStatus();
      
      if (syncStatus.queueLength > 0) {
        console.log(`🔄 发现 ${syncStatus.queueLength} 个待同步变更，开始统一同步`);
        
        // 执行统一同步 - 只同步本地数据到后端，不拉取服务器数据
        await unifiedSyncService.syncPendingData();
        
        // 同步完成后，重新加载本地数据（可能被同步过程更新）
        const updatedStatsStr = await storageUtils.user.getStats();
        if (updatedStatsStr) {
          const updatedStats = JSON.parse(updatedStatsStr);
          setUserStats(updatedStats);
          setAnimatedExperience(updatedStats.experience);
          logger.info('增量同步完成，数据已更新');
        }
      } else {
        // 无待同步变更，遵循多邻国原则：以本地数据为准，不主动拉取服务器数据
        logger.info('无待同步变更，以本地数据为准');
      }
    } catch (error) {
      logger.warn('增量同步失败，继续使用本地数据', error);
    }
  };

  // 新增：启动时同步本地数据到后端（仅一次）- 遵循多邻国原则
  const syncBackendDataOnStartup = async () => {
    try {
      const userId = await getUserId();
      if (!userId) {
        logger.info('用户未登录，跳过启动时同步');
        return;
      }
      
      const userDataStr = await storageUtils.user.getData();
      if (!userDataStr) {
        logger.info('无用户数据，跳过启动时同步');
        return;
      }
      
      const userData = JSON.parse(userDataStr);
      const token = userData.token;
      
      if (!token) {
        logger.info('无用户token，跳过启动时同步');
        return;
      }
      
      // 严格遵循多邻国原则：只同步本地数据到后端，绝不拉取服务器数据
      logger.info('启动时同步本地数据到后端（仅上传，不下载）');
      
      // 获取本地数据
      const localStatsData = await storageUtils.user.getStats();
      if (localStatsData) {
        const localStats = JSON.parse(localStatsData);
        
        // 只将本地数据同步到后端，不拉取服务器数据
        await unifiedSyncService.addToSyncQueue({
          type: 'userStats',
          data: localStats,
          userId: userId,
          operation: 'update',
          priority: 'high'
        });
        
        // 执行同步 - 只上传本地数据
        await unifiedSyncService.syncPendingData();
        
        logger.info('启动时同步本地数据到后端完成（仅上传）');
      } else {
        logger.info('本地无数据，跳过启动时同步');
      }
    } catch (error) {
      logger.warn('启动时同步本地数据到后端失败', error);
    }
  };

  // 新增：智能定时同步本地数据到后端
  const schedulePeriodicSync = () => {
    // 根据数据类型设置不同的同步间隔
    const SYNC_INTERVALS = {
      userStats: 5 * 60 * 1000,      // 5分钟 - 用户统计数据变化频繁
      vocabulary: 10 * 60 * 1000,    // 10分钟 - 词汇数据相对稳定
      searchHistory: 15 * 60 * 1000, // 15分钟 - 搜索历史变化较慢
      userSettings: 30 * 60 * 1000,  // 30分钟 - 用户设置变化很少
      shows: 30 * 60 * 1000,         // 30分钟 - 剧集数据变化很少
    };
    
    // 使用最短间隔作为主同步间隔
    const mainSyncInterval = Math.min(...Object.values(SYNC_INTERVALS));
    
    setInterval(async () => {
      await syncLocalDataToBackend();
    }, mainSyncInterval);
  };

  // 新增：智能同步本地数据到后端 - 通过多邻国数据同步方案
  const syncLocalDataToBackend = async () => {
    try {
      const userId = await getUserId();
      if (!userId) return;
      
      const now = Date.now();
      
      // 检查上次同步时间，避免频繁同步
      const lastSyncTime = await AsyncStorage.getItem('lastSyncTime');
      const timeSinceLastSync = lastSyncTime ? now - parseInt(lastSyncTime) : Infinity;
      
      // 如果距离上次同步不到5分钟，跳过同步
      if (timeSinceLastSync < 5 * 60 * 1000) {
        logger.info('距离上次同步时间过短，跳过本次同步');
        return;
      }
      
      // 获取本地数据
      const localStatsData = await AsyncStorage.getItem('userStats');
      if (!localStatsData) return;
      
      const localStats = JSON.parse(localStatsData);
      
      // 检查数据是否有变化（通过时间戳比较）
      const lastDataUpdateTime = localStats.lastUpdated || 0;
      const timeSinceDataUpdate = now - lastDataUpdateTime;
      
      // 如果数据更新时间在5分钟内，优先同步
      if (timeSinceDataUpdate < 5 * 60 * 1000) {
        await unifiedSyncService.addToSyncQueue({
          type: 'userStats',
          data: {
            ...localStats,
            lastUpdated: now  // 更新时间戳
          },
          userId: userId,
          operation: 'update',
          priority: 'high'  // 高优先级
        });
      } else {
        // 数据较旧，使用中等优先级
        await unifiedSyncService.addToSyncQueue({
          type: 'userStats',
          data: {
            ...localStats,
            lastUpdated: now  // 更新时间戳
          },
          userId: userId,
          operation: 'update',
          priority: 'medium'
        });
      }
      
      // 同步词汇数据（如果最近有变化）
      if (vocabulary && vocabulary.length > 0) {
        const vocabLastUpdate = await AsyncStorage.getItem('vocabularyLastUpdate');
        const vocabTimeSinceUpdate = vocabLastUpdate ? now - parseInt(vocabLastUpdate) : Infinity;
        
        if (vocabTimeSinceUpdate < 10 * 60 * 1000) { // 10分钟内变化过
          await unifiedSyncService.addToSyncQueue({
            type: 'vocabulary',
            data: vocabulary.map(word => ({
              ...word,
              lastUpdated: now  // 添加时间戳
            })),
            userId: userId,
            operation: 'update',
            priority: 'high'
          });
        }
      }
      
      // 同步剧集数据（如果最近有变化）
      if (shows && shows.length > 0) {
        const showsLastUpdate = await AsyncStorage.getItem('showsLastUpdate');
        const showsTimeSinceUpdate = showsLastUpdate ? now - parseInt(showsLastUpdate) : Infinity;
        
        if (showsTimeSinceUpdate < 30 * 60 * 1000) { // 30分钟内变化过
          await unifiedSyncService.addToSyncQueue({
            type: 'shows',
            data: shows.map(show => ({
              ...show,
              lastUpdated: now  // 添加时间戳
            })),
            userId: userId,
            operation: 'update',
            priority: 'medium'
          });
        }
      }
      
      // 同步错词数据（作为learningRecords的一部分）
      if (vocabulary && vocabulary.length > 0) {
        const wrongWords = vocabulary.filter((word: any) => {
          return wrongWordsManager.checkIsWrongWord(word);
        });
        
        if (wrongWords.length > 0) {
          await unifiedSyncService.addToSyncQueue({
            type: 'learningRecords',
            data: wrongWords.map(word => ({
              word: word.word,
              incorrectCount: word.incorrectCount || 0,
              consecutiveIncorrect: word.consecutiveIncorrect || 0,
              consecutiveCorrect: word.consecutiveCorrect || 0,
              lastReviewed: word.lastReviewDate || Date.now(),
              lastUpdated: now,  // 添加时间戳
              isWrongWord: true
            })),
            userId: userId,
            operation: 'update',
            priority: 'medium'
          });
        }
      }
      
      // 执行统一同步
      await unifiedSyncService.syncPendingData();
      
      // 记录本次同步时间
      await AsyncStorage.setItem('lastSyncTime', now.toString());
      
      logger.info('智能定时同步本地数据到后端成功（通过多邻国数据同步方案）');
    } catch (error) {
      logger.warn('智能定时同步本地数据到后端失败', error);
    }
  };

  // 新增：APP关闭时同步数据
  const syncOnAppClose = async () => {
    try {
      console.log('🔄 ReviewIntroScreen: 开始APP关闭时同步...');
      
      const userId = await getUserId();
      if (!userId) {
        console.log('⚠️ 用户未登录，跳过APP关闭同步');
        return;
      }
      
      // 获取所有需要同步的本地数据
      const syncTasks = [];
      
      // 1. 同步用户统计数据
      const localStatsData = await AsyncStorage.getItem('userStats');
      if (localStatsData) {
        const localStats = JSON.parse(localStatsData);
        syncTasks.push(
          unifiedSyncService.addToSyncQueue({
            type: 'userStats',
            data: {
              ...localStats,
              lastUpdated: Date.now()
            },
            userId: userId,
            operation: 'update',
            priority: 'high'  // 关闭时使用高优先级
          })
        );
      }
      
      // 2. 同步词汇数据
      if (vocabulary && vocabulary.length > 0) {
        syncTasks.push(
          unifiedSyncService.addToSyncQueue({
            type: 'vocabulary',
            data: vocabulary.map(word => ({
              ...word,
              lastUpdated: Date.now()
            })),
            userId: userId,
            operation: 'update',
            priority: 'high'
          })
        );
      }
      
      // 3. 同步剧集数据
      if (shows && shows.length > 0) {
        syncTasks.push(
          unifiedSyncService.addToSyncQueue({
            type: 'shows',
            data: shows.map(show => ({
              ...show,
              lastUpdated: Date.now()
            })),
            userId: userId,
            operation: 'update',
            priority: 'high'
          })
        );
      }
      
      // 4. 同步错词数据
      if (vocabulary && vocabulary.length > 0) {
        const wrongWords = vocabulary.filter((word: any) => {
          return wrongWordsManager.checkIsWrongWord(word);
        });
        
        if (wrongWords.length > 0) {
          syncTasks.push(
            unifiedSyncService.addToSyncQueue({
              type: 'learningRecords',
              data: wrongWords.map(word => ({
                word: word.word,
                incorrectCount: word.incorrectCount || 0,
                consecutiveIncorrect: word.consecutiveIncorrect || 0,
                consecutiveCorrect: word.consecutiveCorrect || 0,
                lastReviewed: word.lastReviewDate || Date.now(),
                lastUpdated: Date.now(),
                isWrongWord: true
              })),
              userId: userId,
              operation: 'update',
              priority: 'high'
            })
          );
        }
      }
      
      // 执行所有同步任务
      await Promise.all(syncTasks);
      
      // 执行统一同步
      await unifiedSyncService.syncPendingData();
      
      console.log('✅ ReviewIntroScreen: APP关闭时同步数据完成');
      
      // 记录同步时间
      await AsyncStorage.setItem('lastAppCloseSync', Date.now().toString());
      
    } catch (error) {
      console.error('❌ ReviewIntroScreen: APP关闭时同步数据失败:', error);
    }
  };

  // 组件挂载时启动定时同步
  useEffect(() => {
    schedulePeriodicSync();
    
    // APP关闭时同步数据
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        syncOnAppClose();
      }
    };
    
    // 监听APP状态变化
    // 注意：这里需要根据实际的APP状态监听库来实现
    // 例如：AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      // 清理定时器
      // 这里需要保存定时器ID并在清理时清除
    };
  }, []);

  // 初始化错词管理器
  useEffect(() => {
    if (vocabulary && vocabulary.length > 0) {
      wrongWordsManager.initialize(vocabulary);
      console.log('🔍 ReviewIntroScreen: 错词管理器初始化完成');
    }
  }, [vocabulary]);
  

  
  // 检查经验值增益 - 改进版本，优先使用本地数据
  const checkForExperienceGain = async () => {
    try {
      // 防止重复检查
      if (hasCheckedExperience || isSyncingExperience || isProgressBarAnimating) {
        logger.info('已检查过经验值增益或正在同步/动画，跳过重复检查');
        return;
      }
      
      // 设置检查锁，防止并发访问
      setIsSyncingExperience(true);
      
      // 检查是否有经验值增加的参数
      const navigationParams = await AsyncStorage.getItem('navigationParams');
      logger.info('检查navigationParams:', navigationParams);
      
      if (navigationParams) {
        const params = JSON.parse(navigationParams);
        logger.info('解析的params:', params);
        
        if (params.showExperienceAnimation) {
          logger.info('满足经验值动画条件，开始处理', {
            experienceGained: params.experienceGained
          });
          
          // 同步锁已在前面设置，这里不需要重复设置
          
          // 清除参数
          await AsyncStorage.removeItem('navigationParams');
          
          // 优先使用本地数据，避免网络延迟
          const localUserData = await getLocalUserData();
          
          // 设置经验值增益（params.experienceGained 是本次复习的增益值）
          await localExperienceDuplicationPreventer.setExperienceGain(params.experienceGained);
          if (localUserData) {
            const { currentExperience, userStats: updatedStats } = localUserData;
            
            logger.info('使用本地数据开始经验值动画', {
              currentExperience: currentExperience,
              gainedExperience: params.experienceGained,
              targetExperience: currentExperience + params.experienceGained
            });
            
            // 直接更新用户状态
            setUserStats(updatedStats);
            setAnimatedExperience(currentExperience);
            
            // 显示经验值动画
            setExperienceGained(params.experienceGained);
            setShowExperienceAnimation(true);
            startExperienceAnimationWithCurrentExp(params.experienceGained, currentExperience);
            
            // 动画完成后清理
            setTimeout(async () => {
              await localExperienceDuplicationPreventer.clearExperienceGainStatus();
              setIsSyncingExperience(false);
            }, 3000);
          } else {
            logger.warn('无法获取本地用户数据，跳过经验值动画');
            setIsSyncingExperience(false);
          }
          
        } else {
          logger.info('不满足经验值动画条件', {
            showExperienceAnimation: params.showExperienceAnimation,
            experienceGained: params.experienceGained
          });
        }
      } else {
        logger.info('没有找到navigationParams');
      }
      
      // 标记已检查过经验值
      setHasCheckedExperience(true);
    } catch (error) {
      logger.error("检查并应用经验值增益失败");
      setHasCheckedExperience(true);
    } finally {
      // 释放同步锁
      setIsSyncingExperience(false);
    }
  };

  // 新增：获取本地用户数据的函数（优先使用本地数据）
  const getLocalUserData = async () => {
    try {
      // 首先尝试从本地存储获取数据
              const statsData = await AsyncStorage.getItem('userStats');
        if (statsData) {
          const stats = JSON.parse(statsData);
          // 对于动画起点计算，我们需要检查是否有未应用的经验值增益
          const gainData = await AsyncStorage.getItem('experienceGain');
          const gainAppliedKey = await AsyncStorage.getItem('experienceGainApplied');
          let finalExperience = stats.experience || 0;
          
          if (gainData && !gainAppliedKey) {
            const gainedExp = JSON.parse(gainData);
            // 动画起点应该是当前经验值（不包括即将获得的经验值）
            finalExperience = Math.max(0, finalExperience - gainedExp);
            logger.info('使用本地数据计算动画起点', {
              localExp: stats.experience,
              gainedExp,
              animationStartExp: finalExperience
            });
          }
        
        return {
          currentExperience: finalExperience,
          userStats: { ...stats, experience: stats.experience || 0 }
        };
      }
      
      // 如果本地没有数据，才从后端获取（作为备选方案）
      logger.info('本地无数据，从后端获取用户数据');
      return await getCurrentUserData();
    } catch (error) {
      logger.error("检查并应用经验值增益失败");
      return null;
    }
  };

  // 新增：统一获取用户数据的函数 - 遵循多邻国原则：只使用本地数据
  const getCurrentUserData = async () => {
    try {
      // 严格遵循多邻国原则：只使用本地数据，不从后端拉取
      const statsData = await AsyncStorage.getItem('userStats');
      if (statsData) {
        const stats = JSON.parse(statsData);
        // 使用本地经验值重复计算防止器，防止重复计算
        const finalExperience = await localExperienceDuplicationPreventer.checkAndApplyExperienceGain(stats.experience || 0);
        
        logger.info('使用本地数据获取用户信息', {
          localExperience: stats.experience,
          finalExperience
        });
        
        return {
          currentExperience: finalExperience,
          userStats: { ...stats, experience: finalExperience }
        };
      }
      
      // 如果本地没有数据，返回默认值而不是从后端获取
      logger.info('本地无数据，返回默认值');
      return null;
    } catch (error) {
      logger.error("检查并应用经验值增益失败");
      return null;
    }
  };


  
  // 进度条增长动画 - 使用统一动画管理器
  const animateProgressBar = (fromProgress: number, toProgress: number, duration: number = 1500) => {
    animationManager.startProgressBarAnimation(fromProgress, toProgress, {
      duration
    });
    
    // 更新状态值
    setProgressBarValue(toProgress);
    logger.info('统一进度条动画完成', { fromProgress, toProgress });
  };



  // 已禁用：从后端加载数据（违反多邻国原则）
  // 遵循多邻国原则：应用以本地数据为准，不主动从后端拉取数据
  const loadBackendData = async () => {
    logger.info('loadBackendData 函数已禁用，遵循多邻国原则使用本地数据');
    // 此函数已被禁用，不再从后端拉取数据
    // 所有数据操作都基于本地存储，确保用户数据的一致性
  };
  
  // 处理经验值增长动画 - 使用统一动画管理器
  const animateExperienceGain = (gainedExp: number) => {
    const oldProgress = getExperienceProgress() / 100;
    const newExperience = userStats.experience + gainedExp;
    const newProgress = ((newExperience % getCurrentLevelRequiredExp()) / getCurrentLevelRequiredExp());
    
    animationManager.startProgressBarAnimation(oldProgress, newProgress, {
      duration: newExperience >= getCurrentLevelRequiredExp() ? 1200 : 1500
    });
  };

  // 开始经验值动画 - 使用统一动画管理器
  const startExperienceAnimation = (gainedExp: number) => {
    const currentExperience = userStats.experience;
    const oldExperience = currentExperience;
    const newExperience = oldExperience + gainedExp;
    const oldLevel = userStats.level;
    const newLevel = animationManager.calculateLevel(newExperience);
    const isLevelUp = newLevel > oldLevel;
    
    const oldProgress = getExperienceProgressFromStats(userStats);
    const newProgress = getExperienceProgressFromStats({
      ...userStats,
      experience: newExperience,
      level: newLevel
    });
    
    logger.info('开始统一经验值动画', {
      oldExperience,
      newExperience,
      gainedExp,
      oldProgress,
      newProgress,
      oldLevel,
      newLevel,
      isLevelUp
    });
    
    animationManager.startExperienceAnimation({
      oldExperience,
      newExperience,
      gainedExp,
      oldLevel,
      newLevel,
      isLevelUp,
      oldProgress,
      newProgress
    }, {
      onStart: () => {
        setShowExperienceAnimation(true);
        setIsProgressBarAnimating(true);
        setAnimatedExperience(oldExperience); // 从当前累计经验值开始动画
      },
      onProgress: (currentExp, currentProgress) => {
        setAnimatedExperience(currentExp);
        setProgressBarValue(currentProgress);
      },
      onComplete: (finalExp, finalProgress) => {
        setShowExperienceAnimation(false);
        setIsProgressBarAnimating(false);
        setAnimatedExperience(newExperience);
        setProgressBarValue(finalProgress);
        setHasCheckedExperience(true);
        
        // 清理 AsyncStorage 中的经验值增益数据
        AsyncStorage.removeItem('experienceGain');
        
        // 更新用户统计数据 - 使用正确的等级和经验值
        const updatedStats = {
          ...userStats,
          experience: newExperience,
          level: newLevel, // 使用计算出的新等级
        };
        setUserStats(updatedStats);
        AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));
        
        // 设置一个标记，防止后续的数据加载覆盖刚刚更新的经验值
        AsyncStorage.setItem('experienceAnimationCompleted', Date.now().toString());
        
        logger.info('统一经验值动画完成', {
          newExperience: newExperience,
          newLevel: newLevel,
          finalProgress
        });
      }
    });
  };

  // 开始经验值动画（使用指定的当前经验值）- 使用统一动画管理器
  const startExperienceAnimationWithCurrentExp = (gainedExp: number, currentExp: number) => {
    const oldExperience = currentExp;
    const newExperience = oldExperience + gainedExp;
    const oldLevel = userStats.level;
    const newLevel = animationManager.calculateLevel(newExperience);
    const isLevelUp = newLevel > oldLevel;
    
    const oldProgress = getExperienceProgressFromStats({
      ...userStats,
      experience: oldExperience
    });
    const newProgress = getExperienceProgressFromStats({
      ...userStats,
      experience: newExperience,
      level: newLevel
    });
    
    logger.info('开始统一经验值动画（指定当前经验值）', {
      oldExperience,
      newExperience,
      gainedExp,
      oldProgress,
      newProgress,
      oldLevel,
      newLevel,
      isLevelUp
    });
    
    animationManager.startExperienceAnimation({
      oldExperience,
      newExperience,
      gainedExp,
      oldLevel,
      newLevel,
      isLevelUp,
      oldProgress,
      newProgress
    }, {
      onStart: () => {
        setShowExperienceAnimation(true);
        setIsProgressBarAnimating(true);
        setAnimatedExperience(oldExperience); // 从当前累计经验值开始动画
      },
      onProgress: (currentExp, currentProgress) => {
        setAnimatedExperience(currentExp);
        setProgressBarValue(currentProgress);
      },
      onComplete: (finalExp, finalProgress) => {
        setShowExperienceAnimation(false);
        setExperienceGained(0);
        setIsProgressBarAnimating(false);
        setHasCheckedExperience(true);
        setAnimatedExperience(newExperience); // 显示真正的累加经验值
        setProgressBarValue(finalProgress);
        
        // 更新userStats中的经验值，确保状态同步
        setUserStats(prevStats => {
          const updatedStats = {
            ...prevStats,
            experience: newExperience
          };
          
          logger.info('更新用户统计状态（动画完成）', {
            oldExperience: prevStats.experience,
            newExperience,
            gainedExp
          });
          
          return updatedStats;
        });
        
        // 保存更新后的统计数据到本地存储
        AsyncStorage.setItem('userStats', JSON.stringify({
          ...userStats,
          experience: newExperience
        }));
        
        // 设置一个标记，防止后续的数据加载覆盖刚刚更新的经验值
        AsyncStorage.setItem('experienceAnimationCompleted', Date.now().toString());
        
        logger.info('统一经验值动画完成（指定当前经验值）', {
          newExperience: newExperience,
          finalProgress
        });
      }
    });
  };

  // 更新统计数字 - 使用统一动画管理器
  const updateStatistics = () => {
    console.log('🔄 更新统计数字...');
    // 更新收集单词数量（等于用户收藏单词的数量）
    const collectedCount = vocabulary?.length || 0;
    const contributedCount = userStats.contributedWords || 0;
    
    console.log('📊 当前贡献词数:', contributedCount);
    console.log('📊 当前userStats:', userStats);
    console.log('🎯 设置动画贡献词数:', contributedCount);
    
    // 使用统一动画管理器更新统计数字
    animationManager.startStatisticsAnimation(collectedCount, contributedCount, {
      duration: 1500
    });
    
    // 更新状态值
    setAnimatedCollectedWords(collectedCount);
    setAnimatedContributedWords(contributedCount);
  };

  // 当词汇表变化时更新统计
  useEffect(() => {
    updateStatistics();
  }, [vocabulary, userStats.contributedWords]);

  // 确保在vocabulary加载完成后正确初始化收集单词数量
  useEffect(() => {
    if (vocabulary) {
      setAnimatedCollectedWords(vocabulary.length);
    }
  }, [vocabulary]);

  // 计算经验值进度（从传入的统计数据）
  const getExperienceProgressFromStats = (stats: any) => {
    const currentLevel = stats.level;
    const currentExp = stats.experience;
    
    if (currentExp <= 0) return 0;
    
    // 修复进度计算逻辑：对于低等级，直接使用经验值作为进度
    if (currentLevel === 1) {
      // 等级1：每50经验值升一级，所以进度 = 经验值 / 50
      const progress = Math.min(1, currentExp / 50);
      console.log('🎯 等级1进度计算:', {
        currentExp,
        progress: progress * 100
      });
      return progress;
    }
    
    const totalExpForNextLevel = 50 * Math.pow(currentLevel + 1, 2);
    const totalExpForCurrentLevel = 50 * Math.pow(currentLevel, 2);
    const expNeededForCurrentLevel = totalExpForNextLevel - totalExpForCurrentLevel;
    
    // 计算当前等级内的经验值
    const expInCurrentLevel = currentExp - totalExpForCurrentLevel;
    const progressPercentage = (expInCurrentLevel / expNeededForCurrentLevel) * 100;
    const result = Math.min(100, Math.max(0, progressPercentage));
    
    console.log('🎯 计算经验值进度(从统计数据):', {
      currentLevel,
      currentExp,
      totalExpForNextLevel,
      totalExpForCurrentLevel,
      expNeededForCurrentLevel,
      expInCurrentLevel,
      progressPercentage,
      result
    });
    
    return result / 100; // 返回0-1之间的值，用于动画
  };

  // 计算经验值进度
  const getExperienceProgress = () => {
    const currentLevel = userStats.level;
    const currentExp = userStats.experience;
    
    if (currentExp <= 0) return 0;
    
    // 修复进度计算逻辑：对于低等级，直接使用经验值作为进度
    if (currentLevel === 1) {
      // 等级1：每50经验值升一级，所以进度 = 经验值 / 50
      const progress = Math.min(1, currentExp / 50);
      console.log('🎯 等级1进度计算:', {
        currentExp,
        progress: progress * 100
      });
      return progress;
    }
    
    const totalExpForNextLevel = 50 * Math.pow(currentLevel + 1, 2);
    const totalExpForCurrentLevel = 50 * Math.pow(currentLevel, 2);
    const expNeededForCurrentLevel = totalExpForNextLevel - totalExpForCurrentLevel;
    
    // 计算当前等级内的经验值
    const expInCurrentLevel = currentExp - totalExpForCurrentLevel;
    const progressPercentage = (expInCurrentLevel / expNeededForCurrentLevel) * 100;
    const result = Math.min(100, Math.max(0, progressPercentage));
    
    console.log('🎯 计算经验值进度:', {
      currentLevel,
      currentExp,
      totalExpForNextLevel,
      totalExpForCurrentLevel,
      expNeededForCurrentLevel,
      expInCurrentLevel,
      progressPercentage,
      result
    });
    
    return result / 100; // 返回0-1之间的值，用于动画
  };

  // 获取当前等级所需经验值
  const getCurrentLevelRequiredExp = () => {
    const currentLevel = userStats.level;
    const totalExpForNextLevel = 50 * Math.pow(currentLevel + 1, 2);
    const totalExpForCurrentLevel = 50 * Math.pow(currentLevel, 2);
    return totalExpForNextLevel - totalExpForCurrentLevel;
  };
  
  // 翻译函数
  const t = (key: string, params?: Record<string, string | number>): string => {
    const isChinese = appLanguage === 'zh-CN';
    const translations = {
      'ready_to_challenge': isChinese ? '准备好挑战今天的词卡了吗？' : 'Ready to challenge today\'s word cards?',
      'mastered_cards': isChinese ? '有 {count} 张词卡待掌握' : 'You have {count} word cards',
      'challenge': isChinese ? '挑战' : 'Challenge',
      'series_review': isChinese ? '剧集复习' : 'Series Review',
      'wordbook_review': isChinese ? '单词本复习' : 'Wordbook Review',
      'random': isChinese ? '随机' : 'Random',
      'shuffle': 'Shuffle',
      'view_all': 'View all',
      'words_count': isChinese ? '{count} 词' : '{count} Words',
      'level': isChinese ? '等级' : 'Level',
      'collected_words': isChinese ? '收集单词' : 'Collected Words',
      'contributed_words': isChinese ? '贡献新词' : 'Contributed Words',
      'out_of': isChinese ? '共 {total}' : 'Out of {total}',
      'level_text': isChinese ? '等级' : 'Level',
      'collected_vocabulary': isChinese ? '已收集词汇' : 'Collected',
      'cumulative_review': isChinese ? '累计复习' : 'Review Times',
      'continuous_learning': isChinese ? '连续学习' : 'Streak Days',
      'words_unit': isChinese ? '个词' : ' ',
      'times_unit': isChinese ? '次' : ' ',
      'days_unit': isChinese ? '天' : ' ',
      'hello_greeting': isChinese ? 'HELLO，' : 'HELLO, ',
      'guest_user': isChinese ? '老伙计' : 'Buddy',
      'review_subtitle': isChinese ? '最近都收集了啥单词？我们来回顾一下吧' : 'What words have you collected recently? Let\'s review them',
      'exp_gained': isChinese ? '经验值' : 'EXP',
      'congratulations_exp': isChinese ? '恭喜获得经验值！' : 'Congratulations! You gained experience!',
      'level_up_congratulations': isChinese ? '恭喜升级！' : 'Congratulations! Level Up!',
      'add_shows': isChinese ? '请添加剧集吧！' : ' Add some shows!',
      'add_wordbook': isChinese ? '去添加自己的单词本吧！' : 'Go add your own wordbook!',
      'challenge_cards': isChinese ? '挑战词卡' : 'Challenge Cards',
      'smart_challenge': isChinese ? '智能挑战' : 'Smart Challenge',
      'wrong_words_challenge': isChinese ? '错词挑战' : 'Wrong Words Challenge',
      'wrong_words_count': isChinese ? '有 {count} 个错词待复习' : '{count} wrong words to review'
    };
    
    let text = translations[key as keyof typeof translations] || key;
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, String(value));
      });
    }
    return text;
  };

  // 分离剧集和单词本数据
  const showItems = shows.filter(show => show.type !== 'wordbook');
  const wordbookItems = shows.filter(show => show.type === 'wordbook');

  // 获取剧集或单词本的单词数量
  const getShowWords = (showId: number) => {
    return vocabulary.filter(word => {
      const sourceShowId = word.sourceShow?.id;
      return word.sourceShow && Number(sourceShowId) === Number(showId);
    });
  };

  // 点击挑战横幅，切换到 review Tab（swiper 页面）
  const handlePressChallenge = (key: string) => {
    if (key === 'shuffle') {
      navigate('ReviewScreen', { type: 'shuffle' });
    } else if (key === 'wrong_words') {
      navigate('ReviewScreen', { type: 'wrong_words' });
    }
    // 其他挑战可在此扩展
  };

  // 点击剧集
  const handlePressShow = (item: Show) => {
    navigate('ReviewScreen', { type: 'show', id: item.id });
  };

  // 点击单词本
  const handlePressWordbook = (item: Show) => {
    navigate('ReviewScreen', { type: 'wordbook', id: item.id });
  };

  // 在组件顶部添加常量
  const EMPTY_SECTION_HEIGHT = 120;

  // 组件初始化时立即计算错词数量
  useEffect(() => {
    console.log('🔍 ReviewIntroScreen: 组件初始化，立即计算错词数量');
    console.log('🔍 vocabulary 状态:', vocabulary ? `有${vocabulary.length}个单词` : '无数据');
    if (vocabulary && vocabulary.length > 0) {
      // 使用setTimeout来避免在useInsertionEffect中调用setState
      setTimeout(() => {
        refreshWrongWordsCount();
      }, 0);
    }
  }, []); // 只在组件初始化时执行一次

  return (
    <View style={styles.container}>
      <SyncStatusIndicator visible={true} />
      
      {/* 经验值增加动画 */}
      {showExperienceAnimation && (
        <Animated.View 
          style={[
            styles.experienceAnimationContainer,
            {
              opacity: opacityAnimation,
              transform: [{ scale: scaleAnimation }]
            }
          ]}
        >
          <LinearGradient
            colors={['#7C3AED', '#8B5CF6']}
            style={styles.experienceAnimationGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.experienceAnimationContent}>
              <Ionicons name="star" size={32} color="#FFF" />
              <Text style={styles.experienceAnimationText}>
                +{experienceGained} {t('exp_gained')}
              </Text>
              <Text style={styles.experienceAnimationSubtext}>
                {t('congratulations_exp')}
              </Text>
              {/* 升级时显示额外的恭喜信息 */}
              {userStats.level < Math.floor((userStats.experience + experienceGained) / 100) + 1 && (
                <View style={styles.levelUpContainer}>
                  <Ionicons name="trophy" size={24} color="#FFD700" />
                  <Text style={styles.levelUpText}>
                    {t('level_up_congratulations')}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      )}
      
      {/* 学习统计板块 - 包含问候语 */}
      <View style={styles.learningStatsContainer}>
        {/* 问候语区域 */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>
            {t('hello_greeting')}{user?.nickname || t('guest_user')}
          </Text>
        </View>
        
        {/* 经验值和等级区域 */}
        <View style={styles.experienceSection}>
          <View style={styles.experienceHeader}>
            <View style={styles.levelContainer}>
              <Text style={styles.experienceLabel}>{t('level_text')} {userStats.level}</Text>
              <View style={styles.levelBadge}>
                {userStats.level >= 10 && <Ionicons name="diamond" size={16} color={colors.accent[500]} />}
                {userStats.level >= 5 && userStats.level < 10 && <Ionicons name="star" size={16} color={colors.accent[500]} />}
                {userStats.level >= 1 && userStats.level < 5 && <Ionicons name="trophy" size={16} color={colors.accent[500]} />}
              </View>
            </View>
            <Text style={styles.experienceProgressText}>
              {animatedExperience}/{getCurrentLevelRequiredExp()} XP
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            {/* 蓝色渐变进度条 */}
            <Animated.View style={[styles.progressBarFill, { width: progressBarAnimation.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%']
            }) }]}>
              <LinearGradient
                colors={[colors.primary[400], colors.primary[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressBarGradient}
              />
            </Animated.View>
            {/* 调试信息 */}
            <Text style={{position: 'absolute', right: 5, top: 2, fontSize: 10, color: 'red'}}>
              {Math.round(progressBarValue * 100)}%
            </Text>
          </View>
        </View>
        
        {/* 统计数据区域 - 添加竖线隔断 */}
        <View style={styles.statsSection}>
          {/* 已收集词汇 */}
          <View style={styles.statItem}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{animatedCollectedWords}</Text>
              <Text style={styles.statUnit}>{t('words_unit')}</Text>
            </View>
            <Text style={styles.statLabel}>{t('collected_vocabulary')}</Text>
          </View>
          
          {/* 竖线隔断 */}
          <View style={styles.statDivider} />
          
          {/* 累计复习 */}
          <View style={styles.statItem}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{userStats.totalReviews || 0}</Text>
              <Text style={styles.statUnit}>{t('times_unit')}</Text>
            </View>
            <Text style={styles.statLabel}>{t('cumulative_review')}</Text>
          </View>
          
          {/* 竖线隔断 */}
          <View style={styles.statDivider} />
          
          {/* 连续学习 */}
          <View style={styles.statItem}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{userStats.currentStreak || 0}</Text>
              <Text style={styles.statUnit}>{t('days_unit')}</Text>
            </View>
            <Text style={styles.statLabel}>{t('continuous_learning')}</Text>
          </View>
        </View>
      </View>
      
      {/* 挑战词卡SLIDER */}
      <View style={styles.challengeSliderContainer}>
        <Text style={styles.challengeSliderTitle}>{t('challenge_cards')}</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.challengeSlider}
          contentContainerStyle={styles.challengeSliderContent}
        >
          {/* 智能挑战词卡 */}
          <TouchableOpacity 
            style={styles.challengeCard} 
            activeOpacity={0.8} 
            onPress={() => handlePressChallenge('shuffle')}
          >
            <View style={styles.challengeCardHeader}>
              <Ionicons name="bulb" size={24} color={colors.primary[500]} />
              <Text style={styles.challengeCardTitle}>{t('smart_challenge')}</Text>
            </View>
            <Text style={styles.challengeCardSubtitle}>
              {t('mastered_cards', { count: todayCount })}
            </Text>
            <View style={styles.challengeCardFooter}>
              <Text style={styles.challengeCardExp}>+15 {t('exp_gained')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary[500]} />
            </View>
          </TouchableOpacity>

          {/* 错词挑战词卡 */}
          <TouchableOpacity 
            style={styles.challengeCard}
            activeOpacity={0.8} 
            onPress={() => handlePressChallenge('wrong_words')}
          >
            <View style={styles.challengeCardHeader}>
              <Ionicons name="alert-circle" size={24} color={colors.primary[500]} />
              <Text style={styles.challengeCardTitle}>{t('wrong_words_challenge')}</Text>
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  refreshWrongWordsCount();
                }}
                style={{ marginLeft: 'auto', padding: 4 }}
              >
                <Ionicons name="refresh" size={16} color={colors.primary[500]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.challengeCardSubtitle}>
              {wrongWordsCount > 0 
                ? `${t('wrong_words_count', { count: wrongWordsCount })}`
                : '暂无错词，继续学习吧！'
              }
              {'\n'}🔍 调试: {vocabulary?.length || 0}个单词
            </Text>
            <View style={styles.challengeCardFooter}>
              <Text style={styles.challengeCardExp}>+20 {t('exp_gained')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary[500]} />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* 第二行：剧集复习 */}
      {/* 剧集复习板块 */}
      <View style={styles.showsSection}>
        <Text style={styles.showsTitle}>{t('series_review')}</Text>
        {showItems.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.showsScroll}>
            {showItems.map(item => {
              const wordCount = getShowWords(item.id).length;
              return (
                <TouchableOpacity key={item.id} style={styles.showCard} activeOpacity={0.85} onPress={() => handlePressShow(item)}>
                  <View style={styles.posterContainer}>
                    <Image
                      source={{
                        uri: item.poster_path
                          ? TMDBService.getImageUrl(item.poster_path, 'w185')
                          : 'https://via.placeholder.com/120x120/CCCCCC/FFFFFF?text=No+Image',
                      }}
                      style={styles.showPoster}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.showInfoBox}>
                    <Text style={styles.showName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.showWordCount}>{t('words_count', { count: wordCount })}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <TouchableOpacity
            style={{ height: EMPTY_SECTION_HEIGHT, justifyContent: 'center', alignItems: 'center' }}
            activeOpacity={0.7}
            onPress={() => navigate('main', { tab: 'shows' })}
          >
            <Ionicons name="film-outline" size={36} color={colors.text.secondary} style={{ marginBottom: 8 }} />
            <Text style={{ color: colors.text.secondary, fontSize: 16 }}>{t('add_shows')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 第三行：单词本复习 */}
      {/* 单词本复习板块 */}
      <View style={styles.wordbookSection}>
        <Text style={styles.wordbookTitle}>{t('wordbook_review')}</Text>
        {wordbookItems.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wordbookScroll}>
            {wordbookItems.map(item => {
              const wordCount = getShowWords(item.id).length;
              return (
                <TouchableOpacity key={item.id} style={styles.wordbookCard} activeOpacity={0.8} onPress={() => handlePressWordbook(item)}>
                  <View style={styles.wordbookIconWrap}>
                    <Ionicons 
                      name={(item.icon || 'book-outline') as any} 
                      size={32} 
                      color={colors.primary[400]} 
                    />
                  </View>
                  <Text style={styles.wordbookName}>{item.name}</Text>
                  <Text style={styles.wordbookWordCount}>{t('words_count', { count: wordCount })}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <TouchableOpacity
            style={{ height: EMPTY_SECTION_HEIGHT, justifyContent: 'center', alignItems: 'center' }}
            activeOpacity={0.7}
            onPress={() => navigate('main', { tab: 'vocabulary' })}
          >
            <Ionicons name="book-outline" size={36} color={colors.text.secondary} style={{ marginBottom: 8 }} />
            <Text style={{ color: colors.text.secondary, fontSize: 16 }}>{t('add_wordbook')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background.primary, 
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 36, // 增加顶部间距，让第一个板块与顶部有足够距离
    // justifyContent: 'space-between', // 移除这行，让内容自然流式排列
  },
  // 统一信息区域样式
  unifiedInfoContainer: {
    flexDirection: 'column',
    marginBottom: 12,
    paddingHorizontal: 10,
    marginTop: 0, // 移除顶部间距，因为挑战横幅在上面
  },
  experienceSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  experienceLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  experienceProgressText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  progressBarContainer: {
    height: 14,
    backgroundColor: colors.neutral[100],
    borderRadius: 18,
    marginBottom: 0,
    width: '100%',
    overflow: 'hidden', // 确保进度条不会超出容器
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarGradient: {
    height: '100%',
    width: '100%',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: 6,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statUnit: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  streakStatus: {
    marginTop: 4,
  },
  streakBadge: {
    fontSize: 10,
    color: colors.primary[500],
    fontWeight: 'bold',
    backgroundColor: colors.primary[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  // 挑战横幅样式
  challengeBanner: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    marginBottom: 12, // 增加与剧集复习板块的距离，让挑战横幅更突出
    marginTop: 2,
    minHeight: 90, // 新增，提升横幅最小高度
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20, // 从20增加到28，让内容整体更高
    minHeight: 120, // 保证内容区和横幅高度一致
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  bannerButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary[400],
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  topRow: { flexDirection: 'row', alignItems: 'center', marginTop: 32, marginBottom: 32 },
  progressCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 8, borderColor: colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  progressText: { fontSize: 28, color: colors.primary[500], fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.text.primary, marginBottom: 6 },
  subtitle: { fontSize: 15, color: colors.text.secondary },

  challengeScroll: { flexGrow: 0 },
  challengeIconWrap: { marginBottom: 12 },
// 剧集复习样式
  showsSection: { marginBottom: 12 }, // 增加与单词本复习板块的距离，让两个复习板块有明显分隔
  showsTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text.primary, marginBottom: 8 }, // 减少底部间距，从12改为8
  showsScroll: { flexGrow: 0 },
  showCard: { 
    width: 120, 
    height: 170, 
    borderRadius: 16, 
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  posterContainer: {
    width: '100%',
    height: 112, // 上半部分 2/3
    backgroundColor: colors.background.tertiary,
  },
  showPoster: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  showInfoBox: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  showName: { fontSize: 14, fontWeight: 'bold', color: colors.text.primary, textAlign: 'center', marginBottom: 2, width: '100%' },
  showWordCount: { fontSize: 12, color: colors.text.secondary, textAlign: 'center' },
  // 单词本复习样式
  wordbookSection: { marginBottom: 12 }, // 增加底部间距，让最后一个板块与屏幕底部有足够距离
  wordbookTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text.primary, marginBottom: 8 },
  wordbookScroll: { flexGrow: 0 },
  wordbookCard: { 
    width: 120, 
    height: 100, 
    backgroundColor: colors.background.secondary, // 使用统一的背景色
    borderRadius: 16, 
    alignItems: 'center',
    justifyContent: 'center', 
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  wordbookIconWrap: { marginBottom: 6 },
  wordbookName: { fontSize: 14, fontWeight: '600', color: colors.text.primary, marginBottom: 2, textAlign: 'center' },
  wordbookWordCount: { fontSize: 12, color: colors.text.secondary },
  // 经验值动画样式
  experienceAnimationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  experienceAnimationGradient: {
    width: 280,
    height: 160,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 16px rgba(124, 58, 237, 0.3)',
      },
      default: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  experienceAnimationContent: {
    alignItems: 'center',
  },
  experienceAnimationText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
    ...Platform.select({
      web: {
        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
      },
      default: {
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
    }),
  },
  experienceAnimationSubtext: {
    fontSize: 16,
    color: '#FFF',
    marginTop: 8,
    opacity: 0.9,
    ...Platform.select({
      web: {
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      },
      default: {
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  levelUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  levelUpText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 6,
    ...Platform.select({
      web: {
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      },
      default: {
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  greetingText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 0,
  },
  // 学习统计板块样式
  learningStatsContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 8, // 增加与挑战横幅的距离，让板块之间有更明显的分隔
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  greetingSection: {
    marginBottom: 12,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.light,
    marginHorizontal: 8,
  },
  expButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  expButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '700',
  },
  // 挑战词卡SLIDER样式
  challengeSliderContainer: {
    marginBottom: 16,
  },
  challengeSliderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
    marginLeft: 4,
  },
  challengeSlider: {
    flexGrow: 0,
  },
  challengeSliderContent: {
    paddingHorizontal: 4,
  },
  challengeCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  challengeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginLeft: 8,
  },
  challengeCardSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  challengeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeCardExp: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[500],
  },

});

export default ReviewIntroScreen; 