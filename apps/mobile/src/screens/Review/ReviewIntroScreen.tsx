import React, { useState, useEffect, useRef } from 'react';
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
import { wrongWordLogger, experienceLogger, userDataLogger, vocabularyLogger } from '../../utils/logger';
import { SyncStatusIndicator } from '../../components/common/SyncStatusIndicator';
import { wrongWordsManager } from '../../services/wrongWordsManager';
import { animationManager } from '../../services/animationManager';
import { unifiedSyncService } from '../../services/unifiedSyncService';
import { DataConflictResolver } from '../../services/dataConflictResolver';

const ReviewIntroScreen = () => {
  const { vocabulary, refreshLearningProgress } = useVocabulary();
  const { shows } = useShowList();
  const { navigate } = useNavigation();
  const { appLanguage } = useAppLanguage();
  const { user } = useAuth();
  
  const todayCount = vocabulary?.length || 0;
  // 计算真实的错词数量 - 从用户词汇表中获取学习记录数据
  const [wrongWordsCount, setWrongWordsCount] = useState(0);
  
  // 统一的经验值处理函数 - 防止重复计算
  const experienceManager = {
    // 检查并应用经验值增益，防止重复计算
    async checkAndApplyExperienceGain(currentExperience: number): Promise<number> {
      try {
        const gainData = await AsyncStorage.getItem('experienceGain');
        if (!gainData) {
          return currentExperience;
        }
        
        // 检查是否已经应用过该经验值增益
        const gainAppliedKey = await AsyncStorage.getItem('experienceGainApplied');
        if (gainAppliedKey) {
          experienceLogger.info('经验值增益已应用过，跳过重复计算', {
            currentExperience,
            gainAppliedKey
          });
          return currentExperience;
        }
        
        const gainedExp = JSON.parse(gainData);
        const finalExperience = currentExperience + gainedExp;
        
        // 标记为已应用
        await AsyncStorage.setItem('experienceGainApplied', Date.now().toString());
        
        experienceLogger.info('应用经验值增益', {
          currentExperience,
          gainedExp,
          finalExperience,
          timestamp: new Date().toISOString()
        });
        
        return finalExperience;
      } catch (error) {
        experienceLogger.error('检查并应用经验值增益失败', error);
        return currentExperience;
      }
    },
    
    // 清理经验值增益状态
    async clearExperienceGainStatus(): Promise<void> {
      try {
        await AsyncStorage.removeItem('experienceGain');
        await AsyncStorage.removeItem('experienceGainApplied');
        experienceLogger.info('清理经验值增益状态');
      } catch (error) {
        experienceLogger.error('清理经验值增益状态失败', error);
      }
    },
    
    // 设置新的经验值增益
    async setExperienceGain(gainedExp: number): Promise<void> {
      try {
        await AsyncStorage.setItem('experienceGain', JSON.stringify(gainedExp));
        // 清除之前的应用状态
        await AsyncStorage.removeItem('experienceGainApplied');
        experienceLogger.info('设置新的经验值增益', { gainedExp });
      } catch (error) {
        experienceLogger.error('设置经验值增益失败', error);
      }
    }
  };
  
  // 获取用户ID的辅助函数
  const getUserId = async (): Promise<string | null> => {
    try {
      const userData = await AsyncStorage.getItem('userData');
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
        
        // 使用错词管理器计算错词数量
        const localWrongWords = vocabulary.filter((word: any) => {
            console.log(`🔍 ReviewIntroScreen 检查单词: ${word.word}`, {
              incorrectCount: word.incorrectCount,
              consecutiveIncorrect: word.consecutiveIncorrect,
              consecutiveCorrect: word.consecutiveCorrect,
              isWrongWord: wrongWordsManager.checkIsWrongWord(word)
            });
            return wrongWordsManager.checkIsWrongWord(word);
          });
        
        console.log(`🔍 ReviewIntroScreen: 错词数量计算结果: ${localWrongWords.length}`);
        setWrongWordsCount(localWrongWords.length);
        return;
      }

      // 如果本地vocabulary为空，直接设置为0，不依赖云端数据
      console.log('🔍 ReviewIntroScreen: vocabulary为空，错词数量设为0');
      setWrongWordsCount(0);
    } catch (error) {
      console.error('🔍 ReviewIntroScreen: 手动刷新错词数量失败', error);
      wrongWordLogger.error('手动刷新错词数量失败', error);
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
          
          // 使用错词管理器计算错词数量
          const localWrongWords = vocabulary.filter((word: any) => {
            console.log(`🔍 ReviewIntroScreen 检查单词: ${word.word}`, {
              incorrectCount: word.incorrectCount,
              consecutiveIncorrect: word.consecutiveIncorrect,
              consecutiveCorrect: word.consecutiveCorrect,
              isWrongWord: wrongWordsManager.checkIsWrongWord(word)
            });
            return wrongWordsManager.checkIsWrongWord(word);
          });
          
          console.log(`🔍 ReviewIntroScreen useEffect: 错词数量计算结果: ${localWrongWords.length}`);
          setWrongWordsCount(localWrongWords.length);
          return;
        }

        // 如果本地vocabulary为空，直接设置为0，不依赖云端数据
        console.log('🔍 ReviewIntroScreen useEffect: vocabulary为空，错词数量设为0');
        setWrongWordsCount(0);
      } catch (error) {
        console.error('🔍 ReviewIntroScreen useEffect: 获取错词数量失败', error);
        wrongWordLogger.error('获取错词数量失败', error);
        setWrongWordsCount(0);
      }
    };

    fetchWrongWordsCount();
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
  const [previousExperience, setPreviousExperience] = useState(0);
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
    experienceLogger.info('重置经验值检查状态和动画状态');
    
    // 延迟检查经验值动画，确保所有状态都已加载
    const timer = setTimeout(() => {
      experienceLogger.info('延迟检查经验值动画');
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
  
  // 加载用户统计数据 - 使用多邻国风格的智能同步
  const loadUserStats = async () => {
    try {
      // 如果正在进行经验值同步，跳过加载
      if (isSyncingExperience) {
        userDataLogger.info('经验值同步进行中，跳过用户统计加载');
        return;
      }
      
      userDataLogger.info('开始加载用户统计数据');
      
      // 优先使用本地数据
      const localStatsData = await AsyncStorage.getItem('userStats');
      if (localStatsData) {
        const localStats = JSON.parse(localStatsData);
        
        // 使用统一的经验值处理函数，防止重复计算
        const finalExperience = await experienceManager.checkAndApplyExperienceGain(localStats.experience || 0);
        
        const updatedStats = {
          ...localStats,
          experience: finalExperience
        };
        
        userDataLogger.info('从本地存储加载统计数据', updatedStats);
        setUserStats(updatedStats);
        setAnimatedExperience(updatedStats.experience);
        setAnimatedCollectedWords(vocabulary?.length || 0);
        setAnimatedContributedWords(localStats.contributedWords);
        
        // 初始化进度条 - 只有在没有动画进行时才初始化
        if (!isProgressBarAnimating) {
          const progressPercentage = getExperienceProgressFromStats(updatedStats);
          const progressValue = progressPercentage / 100;
          progressBarAnimation.setValue(progressValue);
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
        userDataLogger.warn('用户未登录，初始化默认数据');
        
        // 初始化默认数据
        const defaultStats = {
          experience: 0,
          level: 1,
          collectedWords: vocabulary?.length || 0,
          contributedWords: 0,
          totalReviews: 0,
          currentStreak: 0
        };
        userDataLogger.info('初始化默认统计数据', defaultStats);
        setUserStats(defaultStats);
        setAnimatedExperience(0);
        setAnimatedCollectedWords(vocabulary?.length || 0);
        setAnimatedContributedWords(0);
        
        // 静默初始化进度条 - 不触发动画
        const progressPercentage = getExperienceProgressFromStats(defaultStats);
        const progressValue = progressPercentage / 100;
        progressBarAnimation.setValue(progressValue);
        setProgressBarValue(progressValue);
        setHasInitializedProgressBar(true);
        
        await AsyncStorage.setItem('userStats', JSON.stringify(defaultStats));
        return;
      }
      
      // 从后端获取数据（仅在启动时或本地无数据时）
      await loadBackendData();
    } catch (error) {
      userDataLogger.error('加载用户统计数据失败', error);
    }
  };

  // 新增：增量同步策略 - 多邻国风格
  const performIncrementalSync = async (localStats: any) => {
    try {
      const userId = await getUserId();
      if (!userId) return;
      
      const userDataStr = await AsyncStorage.getItem('userData');
      if (!userDataStr) return;
      
      const userData = JSON.parse(userDataStr);
      const token = userData.token;
      
      if (!token) return;
      
      // 检查是否有待同步的变更
      const syncStatus = unifiedSyncService.getSyncStatus();
      
      if (syncStatus.queueLength > 0) {
        console.log(`🔄 发现 ${syncStatus.queueLength} 个待同步变更，开始统一同步`);
        
        // 执行统一同步
        await unifiedSyncService.syncPendingData();
        
        // 同步完成后，重新加载本地数据
        const updatedStatsStr = await AsyncStorage.getItem('userStats');
        if (updatedStatsStr) {
          const updatedStats = JSON.parse(updatedStatsStr);
          setUserStats(updatedStats);
          setAnimatedExperience(updatedStats.experience);
          userDataLogger.info('增量同步完成，数据已更新');
        }
      } else {
        // 无待同步变更，检查服务器数据一致性
        const response = await fetch(`${API_BASE_URL}/users/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const serverStats = result.data;
            
            // 检查数据冲突
            const hasConflict = DataConflictResolver.hasConflict(localStats, serverStats, 'userStats');
            
            if (hasConflict) {
              // 解决冲突
              const conflict = {
                localData: localStats,
                serverData: serverStats,
                localTimestamp: localStats.lastUpdated || Date.now(),
                serverTimestamp: serverStats.lastUpdated || Date.now(),
                dataType: 'userStats'
              };
              
              const resolution = DataConflictResolver.resolveConflict(conflict);
              
              userDataLogger.info('检测到数据冲突，已解决', {
                conflict: DataConflictResolver.getConflictSummary(conflict),
                resolution: resolution.reason,
                source: resolution.source,
                confidence: resolution.confidence
              });
              
              // 使用解决后的数据
              const resolvedStats = {
                ...resolution.resolvedData,
                lastUpdated: Date.now()
              };
              
              await AsyncStorage.setItem('userStats', JSON.stringify(resolvedStats));
              
              // 更新UI状态
              setUserStats(resolvedStats);
              setAnimatedExperience(resolvedStats.experience);
              
              // 记录冲突解决为变更
              await unifiedSyncService.addToSyncQueue({
                type: 'userStats',
                data: resolvedStats,
                userId: await getUserId() || '',
                operation: 'update',
                priority: 'high'
              });
              
            } else {
              // 无冲突，静默更新本地数据
              const updatedStats = {
                ...serverStats,
                lastUpdated: Date.now()
              };
              
              await AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));
              userDataLogger.info('数据一致，静默更新本地数据');
            }
          }
        }
      }
    } catch (error) {
      userDataLogger.warn('增量同步失败，继续使用本地数据', error);
    }
  };

  // 新增：启动时同步后端数据（仅一次）
  const syncBackendDataOnStartup = async () => {
    try {
      const userId = await getUserId();
      if (!userId) return;
      
      const userDataStr = await AsyncStorage.getItem('userData');
      if (!userDataStr) return;
      
      const userData = JSON.parse(userDataStr);
      const token = userData.token;
      
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const backendStats = {
            experience: result.data.experience || 0,
            level: result.data.level || 1,
            collectedWords: vocabulary?.length || 0,
            contributedWords: result.data.contributedWords || 0,
            totalReviews: result.data.totalReviews || 0,
            currentStreak: result.data.currentStreak || 0
          };
          
          userDataLogger.info('启动时同步后端数据成功', backendStats);
          await AsyncStorage.setItem('userStats', JSON.stringify(backendStats));
          
          // 更新本地状态（如果数据有变化）
          setUserStats(prevStats => {
            if (prevStats.experience !== backendStats.experience) {
              userDataLogger.info('检测到经验值变化，更新本地状态', {
                oldExp: prevStats.experience,
                newExp: backendStats.experience
              });
              return backendStats;
            }
            return prevStats;
          });
        }
      }
    } catch (error) {
      userDataLogger.warn('启动时同步后端数据失败', error);
    }
  };

  // 新增：定时同步本地数据到后端（可配置间隔）
  const schedulePeriodicSync = () => {
    // 每30分钟同步一次，或者用户主动触发
    const syncInterval = 30 * 60 * 1000; // 30分钟
    
    setInterval(async () => {
      await syncLocalDataToBackend();
    }, syncInterval);
  };

  // 新增：同步本地数据到后端
  const syncLocalDataToBackend = async () => {
    try {
      const userId = await getUserId();
      if (!userId) return;
      
      const localStatsData = await AsyncStorage.getItem('userStats');
      if (!localStatsData) return;
      
      const localStats = JSON.parse(localStatsData);
      const userDataStr = await AsyncStorage.getItem('userData');
      if (!userDataStr) return;
      
      const userData = JSON.parse(userDataStr);
      const token = userData.token;
      
      if (!token) return;
      
      // 发送本地数据到后端进行同步
      const response = await fetch(`${API_BASE_URL}/users/sync-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          experience: localStats.experience,
          level: localStats.level,
          totalReviews: localStats.totalReviews,
          currentStreak: localStats.currentStreak,
          // 其他需要同步的数据
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          userDataLogger.info('定时同步本地数据到后端成功');
        }
      }
    } catch (error) {
      userDataLogger.warn('定时同步本地数据到后端失败', error);
    }
  };

  // 新增：APP关闭时同步数据
  const syncOnAppClose = async () => {
    try {
      await syncLocalDataToBackend();
      userDataLogger.info('APP关闭时同步数据完成');
    } catch (error) {
      userDataLogger.error('APP关闭时同步数据失败', error);
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

  // 加载用户统计数据
  useEffect(() => {
    loadUserStats();
  }, [vocabulary]);

  // 初始化错词管理器
  useEffect(() => {
    if (vocabulary && vocabulary.length > 0) {
      wrongWordsManager.initialize(vocabulary);
      console.log('🔍 ReviewIntroScreen: 错词管理器初始化完成');
    }
  }, [vocabulary]);
  
  // 检查是否需要刷新vocabulary
  useEffect(() => {
    const checkRefreshVocabulary = async () => {
      const refreshFlag = await AsyncStorage.getItem('refreshVocabulary');
      if (refreshFlag === 'true') {
        vocabularyLogger.info('检测到vocabulary刷新标记，重新加载数据');
        await AsyncStorage.removeItem('refreshVocabulary');
        // 触发vocabulary重新加载
        await refreshLearningProgress();
        await loadUserStats();
      }
    };
    
    checkRefreshVocabulary();
  }, [refreshLearningProgress]);
  
  // 当词汇表变化时，刷新用户统计数据（可能包含新的贡献数据）
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10; // 最大重试10次，避免无限循环
    
    const refreshUserStats = async () => {
      // 如果正在进行经验值动画，延迟刷新
      if (isProgressBarAnimating) {
        retryCount++;
        if (retryCount >= maxRetries) {
          experienceLogger.warn('达到最大重试次数，强制刷新用户统计');
          await loadUserStats();
          return;
        }
        experienceLogger.info(`经验值动画进行中，延迟刷新用户统计 (${retryCount}/${maxRetries})`);
        setTimeout(refreshUserStats, 1000);
        return;
      }
      
      // 如果已经检查过经验值增益，跳过刷新
      if (hasCheckedExperience) {
        experienceLogger.info('已检查过经验值增益，跳过用户统计刷新');
        return;
      }
      
      // 检查是否有经验值增益标记，如果有则跳过刷新
      const gainData = await AsyncStorage.getItem('experienceGain');
      if (gainData) {
        experienceLogger.info('检测到经验值增益标记，跳过用户统计刷新');
        return;
      }
      
      await loadUserStats();
    };
    
    // 延迟一点时间确保后端数据已更新
    const timer = setTimeout(refreshUserStats, 1000);
    return () => clearTimeout(timer);
  }, [vocabulary]);
  
  // 检查经验值增益 - 改进版本，优先使用本地数据
  const checkForExperienceGain = async () => {
    try {
      // 防止重复检查
      if (hasCheckedExperience || isSyncingExperience) {
        experienceLogger.info('已检查过经验值增益或正在同步，跳过重复检查');
        return;
      }
      
      // 检查是否有经验值增加的参数
      const navigationParams = await AsyncStorage.getItem('navigationParams');
      experienceLogger.info('检查navigationParams:', navigationParams);
      
      if (navigationParams) {
        const params = JSON.parse(navigationParams);
        experienceLogger.info('解析的params:', params);
        
        if (params.showExperienceAnimation && params.experienceGained > 0) {
          experienceLogger.info('满足经验值动画条件，开始处理');
          
          // 设置同步锁，防止重复处理
          setIsSyncingExperience(true);
          
          // 清除参数
          await AsyncStorage.removeItem('navigationParams');
          
          // 使用统一的经验值管理器设置经验值增益
          await experienceManager.setExperienceGain(params.experienceGained);
          
          // 优先使用本地数据，避免网络延迟
          const localUserData = await getLocalUserData();
          if (localUserData) {
            const { currentExperience, userStats: updatedStats } = localUserData;
            
            experienceLogger.info('使用本地数据开始经验值动画', {
              currentExperience: currentExperience,
              gainedExperience: params.experienceGained,
              targetExperience: currentExperience + params.experienceGained
            });
            
            // 直接更新用户状态
            setUserStats(updatedStats);
            setAnimatedExperience(currentExperience);
            
            // 开始动画，传入当前经验值
            setExperienceGained(params.experienceGained);
            setShowExperienceAnimation(true);
            startExperienceAnimationWithCurrentExp(params.experienceGained, currentExperience);
            
            // 动画完成后清理
            setTimeout(async () => {
              await experienceManager.clearExperienceGainStatus();
              setIsSyncingExperience(false);
            }, 3000);
          } else {
            experienceLogger.warn('无法获取本地用户数据，跳过经验值动画');
            setIsSyncingExperience(false);
          }
          
        } else {
          experienceLogger.info('不满足经验值动画条件', {
            showExperienceAnimation: params.showExperienceAnimation,
            experienceGained: params.experienceGained
          });
        }
      } else {
        experienceLogger.info('没有找到navigationParams');
      }
      
      // 标记已检查过经验值
      setHasCheckedExperience(true);
    } catch (error) {
      experienceLogger.error('检查经验值增益失败', error);
      setHasCheckedExperience(true);
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
            experienceLogger.info('使用本地数据计算动画起点', {
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
      experienceLogger.info('本地无数据，从后端获取用户数据');
      return await getCurrentUserData();
    } catch (error) {
      experienceLogger.error('获取本地用户数据失败', error);
      return null;
    }
  };

  // 新增：统一获取用户数据的函数
  const getCurrentUserData = async () => {
    try {
      const userId = await getUserId();
      if (!userId) {
        // 未登录用户，使用本地数据
        const statsData = await AsyncStorage.getItem('userStats');
        if (statsData) {
          const stats = JSON.parse(statsData);
          // 使用统一的经验值处理函数，防止重复计算
          const finalExperience = await experienceManager.checkAndApplyExperienceGain(stats.experience || 0);
          
          return {
            currentExperience: finalExperience,
            userStats: { ...stats, experience: finalExperience }
          };
        }
        return null;
      }
      
      // 已登录用户，从后端获取数据
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const token = userData.token;
        
        if (token) {
          const response = await fetch(`${API_BASE_URL}/users/stats`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              const currentExperience = result.data.experience || 0;
              
              // 检查是否有待处理的经验值增益（仅用于动画计算，不重复应用）
              const gainData = await AsyncStorage.getItem('experienceGain');
              const gainAppliedKey = await AsyncStorage.getItem('experienceGainApplied');
              let finalExperience = currentExperience;
              
              if (gainData && !gainAppliedKey) {
                const gainedExp = JSON.parse(gainData);
                // 在经验值动画场景下，我们需要计算动画的起始点
                // 如果后端还没有更新经验值，我们使用当前经验值作为动画起点
                // 如果后端已经更新了经验值，我们使用更新后的经验值减去增益值作为动画起点
                if (currentExperience >= gainedExp) {
                  // 后端已经更新了经验值，动画起点应该是 currentExperience - gainedExp
                  finalExperience = currentExperience - gainedExp;
                  experienceLogger.info('后端已更新经验值，计算动画起点', {
                    backendExp: currentExperience,
                    gainedExp,
                    animationStartExp: finalExperience
                  });
                } else {
                  // 后端还没有更新经验值，使用当前经验值作为动画起点
                  finalExperience = currentExperience;
                  experienceLogger.info('后端未更新经验值，使用当前经验值作为动画起点', {
                    currentExp: currentExperience,
                    gainedExp
                  });
                }
              } else if (gainAppliedKey) {
                // 经验值增益已经应用过，使用当前经验值
                experienceLogger.info('经验值增益已应用过，使用当前经验值作为动画起点', {
                  currentExperience
                });
              }
              
              const updatedStats = {
                experience: currentExperience, // 使用后端返回的最新经验值
                level: result.data.level || 1,
                collectedWords: vocabulary?.length || 0,
                contributedWords: result.data.contributedWords || 0,
                totalReviews: result.data.totalReviews || 0,
                currentStreak: result.data.currentStreak || 0
              };
              
              // 更新本地存储
              await AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));
              
              return {
                currentExperience: finalExperience, // 返回动画起点经验值
                userStats: updatedStats
              };
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      experienceLogger.error('获取用户数据失败', error);
      return null;
    }
  };

  // 当 userStats 加载完成后，检查经验值增益
  useEffect(() => {
    if (userStats.experience >= 0 && !hasCheckedExperience && !isSyncingExperience) {
      experienceLogger.info('触发经验值检查', {
        userStatsExperience: userStats.experience,
        hasCheckedExperience,
        isSyncingExperience
      });
      checkForExperienceGain();
    }
  }, [userStats.experience, hasCheckedExperience, isSyncingExperience]);
  
  // 进度条增长动画 - 使用统一动画管理器
  const animateProgressBar = (fromProgress: number, toProgress: number, duration: number = 1500) => {
    animationManager.startProgressBarAnimation(fromProgress, toProgress, {
      duration
    });
    
    // 更新状态值
    setProgressBarValue(toProgress);
    experienceLogger.info('统一进度条动画完成', { fromProgress, toProgress });
  };



  // 新增：从后端加载数据（备选方案）
  const loadBackendData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const token = userData.token;
        
        if (token) {
          const response = await fetch(`${API_BASE_URL}/users/stats`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              // 使用统一的经验值处理函数，防止重复计算
              // 注意：这里使用后端返回的经验值作为基础，但经验值管理器会检查是否已经应用过增益
              const finalExperience = await experienceManager.checkAndApplyExperienceGain(result.data.experience || 0);
              
              const backendStats = {
                experience: finalExperience,
                level: result.data.level || 1,
                collectedWords: vocabulary?.length || 0,
                contributedWords: result.data.contributedWords || 0,
                totalReviews: result.data.totalReviews || 0,
                currentStreak: result.data.currentStreak || 0
              };
              
              userDataLogger.info('从后端加载统计数据', backendStats);
              setUserStats(backendStats);
              setAnimatedExperience(backendStats.experience);
              setAnimatedCollectedWords(vocabulary?.length || 0);
              setAnimatedContributedWords(backendStats.contributedWords);
              
              // 初始化进度条 - 只有在没有动画进行时才初始化
              if (!isProgressBarAnimating) {
                const progressPercentage = getExperienceProgressFromStats(backendStats);
                const progressValue = progressPercentage / 100;
                progressBarAnimation.setValue(progressValue);
                setProgressBarValue(progressValue);
                setHasInitializedProgressBar(true);
              }
              
              await AsyncStorage.setItem('userStats', JSON.stringify(backendStats));
              return;
            }
          }
        }
      }
    } catch (error) {
      userDataLogger.warn('获取后端数据失败，使用本地数据', error);
    }
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
    
    const oldProgress = getExperienceProgressFromStats(userStats) / 100;
    const newProgress = getExperienceProgressFromStats({
      ...userStats,
      experience: newExperience,
      level: newLevel
    }) / 100;
    
    experienceLogger.info('开始统一经验值动画', {
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
        
        // 更新用户统计数据
        const updatedStats = {
          ...userStats,
          experience: newExperience,
          level: userStats.level,
        };
        setUserStats(updatedStats);
        AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));
        
        experienceLogger.info('统一经验值动画完成', {
          newExperience: newExperience,
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
    
    experienceLogger.info('开始统一经验值动画（指定当前经验值）', {
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
        setUserStats(prevStats => ({
          ...prevStats,
          experience: newExperience
        }));
        
        experienceLogger.info('统一经验值动画完成（指定当前经验值）', {
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
              {t('wrong_words_count', { count: wrongWordsCount })}
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

      {/* 开发模式：清除缓存按钮 */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <TouchableOpacity
            style={styles.debugButton}
            onPress={async () => {
              Alert.alert(
                '清除缓存',
                '确定要清除错词缓存吗？这将重置所有错词数据。',
                [
                  { text: '取消', style: 'cancel' },
                  {
                    text: '确定',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await wrongWordsManager.reset();
                        Alert.alert('成功', '错词缓存已清除');
                        // 重新计算错词数量
                        setWrongWordsCount(0);
                      } catch (error) {
                        Alert.alert('错误', '清除缓存失败');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.debugButtonText}>清除错词缓存</Text>
          </TouchableOpacity>
          
          {/* 测试经验值动画按钮 */}
          <TouchableOpacity 
            style={[styles.debugButton, {marginTop: 10}]} 
            onPress={() => {
              console.log('🧪 测试经验值动画');
              console.log('🧪 当前经验值:', userStats.experience);
              console.log('🧪 当前等级:', userStats.level);
              console.log('🧪 当前进度值:', progressBarValue);
              console.log('🧪 当前动画值:', progressBarAnimation);
              startExperienceAnimationWithCurrentExp(10, userStats.experience);
            }}
          >
            <Text style={styles.debugButtonText}>测试经验值动画</Text>
          </TouchableOpacity>
          
          {/* 检查后端数据按钮 */}
          <TouchableOpacity 
            style={[styles.debugButton, {marginTop: 10}]} 
            onPress={async () => {
              console.log('🔍 检查后端数据');
              try {
                const userDataStr = await AsyncStorage.getItem('userData');
                if (userDataStr) {
                  const userData = JSON.parse(userDataStr);
                  const response = await fetch(`${API_BASE_URL}/users/stats`, {
                    headers: {
                      'Authorization': `Bearer ${userData.token}`,
                    },
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    console.log('🔍 后端用户数据:', result.data);
                  } else {
                    console.log('❌ 获取后端数据失败:', response.status);
                  }
                }
              } catch (error) {
                console.log('❌ 检查后端数据失败:', error);
              }
            }}
          >
            <Text style={styles.debugButtonText}>检查后端数据</Text>
          </TouchableOpacity>
        </View>
      )}
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
  debugContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  debugButton: {
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  debugButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReviewIntroScreen; 