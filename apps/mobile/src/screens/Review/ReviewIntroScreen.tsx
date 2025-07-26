
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, Platform } from 'react-native';
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

const ReviewIntroScreen = () => {
  const { vocabulary } = useVocabulary();
  const { shows } = useShowList();
  const { navigate } = useNavigation();
  const { appLanguage } = useAppLanguage();
  const { user } = useAuth();
  
  const todayCount = vocabulary?.length || 0;
  
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
  
  // 统计数字动画状态
  const [animatedCollectedWords, setAnimatedCollectedWords] = useState(0);
  const [animatedContributedWords, setAnimatedContributedWords] = useState(0);
  
  // 动画值
  const experienceAnimation = new Animated.Value(0);
  const scaleAnimation = new Animated.Value(1);
  const opacityAnimation = new Animated.Value(0);
  const progressAnimation = new Animated.Value(0);
  const numberAnimation = new Animated.Value(0);
  const levelAnimation = new Animated.Value(1);
  const collectedWordsAnimation = new Animated.Value(0);
  const contributedWordsAnimation = new Animated.Value(0);
  const progressBarAnimation = new Animated.Value(0); // 新增进度条动画
  
  // 加载用户统计数据
  useEffect(() => {
    loadUserStats();
  }, [vocabulary]);
  
  // 当词汇表变化时，刷新用户统计数据（可能包含新的贡献数据）
  useEffect(() => {
    const refreshUserStats = async () => {
      await loadUserStats();
    };
    
    // 延迟一点时间确保后端数据已更新
    const timer = setTimeout(refreshUserStats, 1000);
    return () => clearTimeout(timer);
  }, [vocabulary]);
  
  // 检查经验值增益
  const checkForExperienceGain = async () => {
    try {
      // 检查是否有经验值增加的参数
      const navigationParams = await AsyncStorage.getItem('navigationParams');
      if (navigationParams) {
        const params = JSON.parse(navigationParams);
        if (params.showExperienceAnimation && params.experienceGained > 0) {
          // 清除参数
          await AsyncStorage.removeItem('navigationParams');
          
          // 设置经验值增益标记，用于后续进度条动画
          await AsyncStorage.setItem('experienceGain', JSON.stringify(params.experienceGained));
          
          // 确保 userStats 已加载后再开始动画
          if (userStats.experience >= 0) {
            console.log('🎯 开始经验值动画，当前状态:', {
              currentExperience: userStats.experience,
              gainedExp: params.experienceGained
            });
            
            // 设置动画状态
            setExperienceGained(params.experienceGained);
            setShowExperienceAnimation(true);
            
            // 延迟一点时间确保 userStats 已正确设置
            setTimeout(() => {
              startExperienceAnimation(params.experienceGained);
            }, 100);
          } else {
            console.log('🎯 等待 userStats 加载完成后再开始动画');
          }
          
          // 延迟刷新用户数据，确保后端数据已更新
          setTimeout(() => {
            loadUserStats();
          }, 2000);
        }
      }
      setHasCheckedExperience(true);
    } catch (error) {
      console.error('检查经验值增加失败:', error);
      setHasCheckedExperience(true);
    }
  };

  // 当 userStats 加载完成且进度条初始化后，检查经验值增益
  useEffect(() => {
    if (userStats.experience >= 0 && hasInitializedProgressBar && !hasCheckedExperience) {
      checkForExperienceGain();
    }
  }, [userStats.experience, hasInitializedProgressBar, hasCheckedExperience]);
  
  // 当经验值变化时触发进度条动画
  useEffect(() => {
    // 只在经验值实际增长时触发动画，而不是页面加载时
    if (userStats.experience > 0 && !showExperienceAnimation && !isProgressBarAnimating && hasInitializedProgressBar) {
      // 检查经验值是否真的增长了（通过比较当前值和之前的值）
      const currentExp = userStats.experience;
      const previousExp = previousExperience || 0;
      
      if (currentExp > previousExp) {
        const progressPercentage = getExperienceProgress() / 100;
        console.log('🎯 经验值增长，触发进度条动画:', {
          previousExp,
          currentExp,
          experience: userStats.experience,
          level: userStats.level,
          progressPercentage: progressPercentage,
          requiredExp: getCurrentLevelRequiredExp()
        });
        
        // 检查是否有待处理的经验值增益
        AsyncStorage.getItem('experienceGain').then((gainData) => {
          if (gainData) {
            // 如果有待处理的经验值增益，说明这是从复习完成后的经验值增长
            console.log('🎯 检测到复习完成后的经验值增长，触发进度条动画');
            Animated.timing(progressBarAnimation, {
              toValue: progressPercentage,
              duration: 1000,
              useNativeDriver: false,
            }).start();
            
            // 清理经验值增益标记
            AsyncStorage.removeItem('experienceGain');
          } else if (currentExp > previousExp) {
            // 只有在没有待处理的经验值增益时才执行初始进度条动画
            console.log('🎯 普通经验值增长，触发进度条动画');
            Animated.timing(progressBarAnimation, {
              toValue: progressPercentage,
              duration: 1000,
              useNativeDriver: false,
            }).start();
          } else {
            console.log('🎯 检测到待处理的经验值增益，跳过初始进度条动画');
          }
        });
      } else {
        console.log('🎯 经验值未增长，跳过进度条动画:', {
          previousExp,
          currentExp
        });
      }
    }
  }, [userStats.experience, userStats.level, showExperienceAnimation, isProgressBarAnimating, hasInitializedProgressBar, previousExperience]);

  // 进度条增长动画
  const animateProgressBar = (fromProgress: number, toProgress: number, duration: number = 1500) => {
    progressBarAnimation.setValue(fromProgress);
    Animated.timing(progressBarAnimation, {
      toValue: toProgress,
      duration: duration,
      useNativeDriver: false,
    }).start();
  };

  // 加载用户统计数据
  const loadUserStats = async () => {
    try {
      console.log('📊 开始加载用户统计数据...');
      
      // 尝试从后端获取用户数据
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data && result.data.user) {
              const userData = result.data.user;
              console.log('👤 用户数据详情:', {
                experience: userData.experience,
                level: userData.level,
                contributedWords: userData.contributedWords,
                vocabularyLength: vocabulary?.length
              });
              const stats = {
                experience: userData.experience || 0,
                level: userData.level || 1,
                collectedWords: vocabulary?.length || 0,
                contributedWords: userData.contributedWords || 0,
                totalReviews: userData.totalReviews || 0,
                currentStreak: userData.currentStreak || 0
              };
              console.log('📈 设置用户统计数据:', stats);
              setUserStats(stats);
              // 初始化动画状态
              setAnimatedExperience(stats.experience); // 初始化动画经验值为当前经验值
              setProgressBarValue(getExperienceProgressFromStats(stats) / 100);
              setHasInitializedProgressBar(true);
              console.log('🎯 初始化进度条:', {
                experience: stats.experience,
                level: stats.level,
                progressPercentage: getExperienceProgressFromStats(stats),
                progressValue: getExperienceProgressFromStats(stats) / 100
              });
              
              // 只有在没有经验值增益时才设置初始经验值
              AsyncStorage.getItem('experienceGain').then((gainData) => {
                if (!gainData) {
                  setPreviousExperience(stats.experience);
                } else {
                  console.log('🎯 检测到经验值增益，保持 previousExperience 不变');
                }
              });
              
              // 静默初始化进度条 - 不触发动画
              const progressPercentage = getExperienceProgressFromStats(stats);
              const progressValue = progressPercentage / 100;
              console.log('🎯 初始化进度条:', {
                experience: stats.experience,
                level: stats.level,
                progressPercentage,
                progressValue
              });
              progressBarAnimation.setValue(progressValue);
              setProgressBarValue(progressValue); // 更新状态
              
              // 标记进度条已初始化
              setHasInitializedProgressBar(true);
              
              // 保存到本地存储作为缓存
              await AsyncStorage.setItem('userStats', JSON.stringify(stats));
              return;
            }
          } else {
            console.log('❌ 后端响应错误:', response.status, response.statusText);
          }
        } catch (apiError) {
          console.error('❌ 从后端获取用户数据失败:', apiError);
          // 如果API调用失败，继续使用本地数据
        }
      } else {
        console.log('⚠️ 未找到认证token，使用本地数据');
      }
      
      // 从本地存储加载用户统计数据（作为后备方案）
      const statsData = await AsyncStorage.getItem('userStats');
      if (statsData) {
        const stats = JSON.parse(statsData);
        console.log('📱 从本地存储加载统计数据:', stats);
        setUserStats(stats);
        // 初始化动画状态
        setAnimatedExperience(stats.experience);
        setAnimatedCollectedWords(vocabulary?.length || 0);
        setAnimatedContributedWords(stats.contributedWords);
        
        // 只有在没有经验值增益时才设置初始经验值
        AsyncStorage.getItem('experienceGain').then((gainData) => {
          if (!gainData) {
            setPreviousExperience(stats.experience);
          } else {
            console.log('🎯 检测到经验值增益，保持 previousExperience 不变');
          }
        });
        
        // 静默初始化进度条 - 不触发动画
        const progressPercentage = getExperienceProgressFromStats(stats);
        const progressValue = progressPercentage / 100;
        console.log('🎯 初始化进度条:', {
          experience: stats.experience,
          level: stats.level,
          progressPercentage,
          progressValue
        });
        progressBarAnimation.setValue(progressValue);
        setProgressBarValue(progressValue); // 更新状态
        
        // 标记进度条已初始化
        setHasInitializedProgressBar(true);
      } else {
        // 初始化默认数据
        const defaultStats = {
          experience: 0,
          level: 1,
          collectedWords: vocabulary?.length || 0,
          contributedWords: 0,
          totalReviews: 0,
          currentStreak: 0
        };
        console.log('🆕 初始化默认统计数据:', defaultStats);
        setUserStats(defaultStats);
        // 初始化动画状态
        setAnimatedExperience(0);
        setAnimatedCollectedWords(vocabulary?.length || 0);
        setAnimatedContributedWords(0);
        
        // 只有在没有经验值增益时才设置初始经验值
        AsyncStorage.getItem('experienceGain').then((gainData) => {
          if (!gainData) {
            setPreviousExperience(0);
          } else {
            console.log('🎯 检测到经验值增益，保持 previousExperience 不变');
          }
        });
        
        // 静默初始化进度条 - 不触发动画
        const progressPercentage = getExperienceProgressFromStats(defaultStats);
        const progressValue = progressPercentage / 100;
        console.log('🎯 初始化进度条(默认):', {
          experience: defaultStats.experience,
          level: defaultStats.level,
          progressPercentage,
          progressValue
        });
        progressBarAnimation.setValue(progressValue);
        setProgressBarValue(progressValue); // 更新状态
        
        // 标记进度条已初始化
        setHasInitializedProgressBar(true);
        
        await AsyncStorage.setItem('userStats', JSON.stringify(defaultStats));
      }
    } catch (error) {
      console.error('❌ 加载用户统计数据失败:', error);
    }
  };
  
  // 处理经验值增长动画
  const animateExperienceGain = (gainedExp: number) => {
    const oldProgress = getExperienceProgress() / 100;
    const newExperience = userStats.experience + gainedExp;
    const newProgress = ((newExperience % getCurrentLevelRequiredExp()) / getCurrentLevelRequiredExp());
    
    // 如果升级了，进度条重置为0然后增长到新等级进度
    if (newExperience >= getCurrentLevelRequiredExp()) {
      Animated.sequence([
        // 先重置到0
        Animated.timing(progressBarAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        // 然后增长到新进度
        Animated.timing(progressBarAnimation, {
          toValue: newProgress,
          duration: 1200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // 直接增长到新进度
      Animated.timing(progressBarAnimation, {
        toValue: newProgress,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    }
  };

  // 开始经验值动画
  const startExperienceAnimation = (gainedExp: number) => {
    // 设置动画标志
    setIsProgressBarAnimating(true);
    
    // 重置动画值
    experienceAnimation.setValue(0);
    scaleAnimation.setValue(1);
    opacityAnimation.setValue(0);
    progressAnimation.setValue(0);
    numberAnimation.setValue(0);
    levelAnimation.setValue(1);
    collectedWordsAnimation.setValue(0);
    contributedWordsAnimation.setValue(0);
    
    // 使用当前实际的经验值，而不是 userStats.experience
    const currentExperience = userStats.experience;
    const oldExperience = currentExperience; // 修复：使用当前经验值作为起始值
    const newExperience = oldExperience + gainedExp;
    const oldLevel = userStats.level;
    const newLevel = Math.floor(newExperience / 100) + 1;
    
    // 设置初始动画经验值
    setAnimatedExperience(oldExperience); // 显示总经验值，而不是当前等级内的经验值
    
    // 计算进度变化
    const oldProgress = getExperienceProgress() / 100;
    const newProgress = ((newExperience % getCurrentLevelRequiredExp()) / getCurrentLevelRequiredExp());
    
    // 设置进度条初始值
    progressBarAnimation.setValue(oldProgress);
    
    console.log('🎯 开始经验值动画:', {
      oldExperience,
      newExperience,
      gainedExp,
      oldProgress,
      newProgress,
      oldLevel,
      newLevel
    });
    
    // 显示经验值增加提示
    Animated.sequence([
      // 淡入弹窗
      Animated.timing(opacityAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // 弹窗缩放动画
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      // 等待一段时间
      Animated.delay(800),
      // 开始进度环动画
      Animated.parallel([
        // 经验值数字动画
        Animated.timing(numberAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]),
      // 等级提升动画（如果有）
      ...(newLevel > oldLevel ? [
        Animated.sequence([
          Animated.timing(levelAnimation, {
            toValue: 1.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(levelAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      ] : []),
      // 等待动画完成
      Animated.delay(500),
      // 淡出弹窗
      Animated.timing(opacityAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowExperienceAnimation(false);
      setIsProgressBarAnimating(false); // 清除动画标志
      // 清理动画监听器
      numberAnimation.removeAllListeners();
      progressBarAnimation.removeAllListeners(); // 清理进度条监听器
      
      // 清理 AsyncStorage 中的经验值增益数据
      AsyncStorage.removeItem('experienceGain');
      
      // 动画完成后再更新用户统计数据
      const updatedStats = {
        ...userStats,
        experience: newExperience,
        level: newLevel,
      };
      setUserStats(updatedStats);
      AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));
      
      // 确保进度条动画最终状态正确 - 使用更新后的统计数据
      const finalProgress = getExperienceProgressFromStats(updatedStats) / 100;
      progressBarAnimation.setValue(finalProgress);
      setProgressBarValue(finalProgress); // 更新状态值
      setAnimatedExperience(newExperience); // 设置最终经验值
      
      console.log('🎯 动画完成，最终状态:', {
        newExperience,
        newLevel,
        finalProgress
      });
    });
    
    // 数字动画监听器
    numberAnimation.addListener(({ value }) => {
      // 计算总经验值（不是当前等级内的经验值）
      const currentExp = Math.round(oldExperience + (value * gainedExp));
      setAnimatedExperience(currentExp);
      
      // 同步进度条动画 - 使用相同的动画进度
      const currentProgress = oldProgress + (value * (newProgress - oldProgress));
      progressBarAnimation.setValue(currentProgress);
      setProgressBarValue(currentProgress); // 更新状态值
      
      // 只在关键节点记录日志
      if (value === 0 || value === 1 || value % 0.25 < 0.01) {
        console.log('🎯 动画同步:', {
          progress: value.toFixed(2),
          currentExp,
          currentProgress: currentProgress.toFixed(3)
        });
      }
    });
    
    // 进度条动画监听器 - 与数字动画同步
    progressBarAnimation.addListener(({ value }) => {
      // 只在关键节点记录日志，避免过多输出
      if (value === 0 || value === 1 || value % 0.25 < 0.01) {
        console.log('🎯 进度条:', { value: value.toFixed(3) });
      }
    });
    
    // 更新用户经验值
    // const updatedStats = {
    //   ...userStats,
    //   experience: newExperience,
    //   level: newLevel,
    // };
    
    // setUserStats(updatedStats);
    // AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));
  };
  
  // 更新统计数字
  const updateStatistics = () => {
    console.log('🔄 更新统计数字...');
    // 更新收集单词数量（等于用户收藏单词的数量）
    const collectedCount = vocabulary?.length || 0;
    setAnimatedCollectedWords(collectedCount);
    
    // 更新贡献单词数量（等于用户调用OpenAI的次数）
    const contributedCount = userStats.contributedWords || 0;
    console.log('📊 当前贡献词数:', contributedCount);
    console.log('📊 当前userStats:', userStats);
    setAnimatedContributedWords(contributedCount);
    console.log('🎯 设置动画贡献词数:', contributedCount);
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
    const totalExpForNextLevel = 50 * Math.pow(currentLevel + 1, 2);
    const totalExpForCurrentLevel = 50 * Math.pow(currentLevel, 2);
    const expNeededForCurrentLevel = totalExpForNextLevel - totalExpForCurrentLevel;
    const progressPercentage = (currentExp / expNeededForCurrentLevel) * 100;
    const result = Math.min(100, Math.max(0, progressPercentage));
    
    console.log('🎯 计算经验值进度(从统计数据):', {
      currentLevel,
      currentExp,
      totalExpForNextLevel,
      totalExpForCurrentLevel,
      expNeededForCurrentLevel,
      progressPercentage,
      result
    });
    
    return result;
  };

  // 计算经验值进度
  const getExperienceProgress = () => {
    const currentLevel = userStats.level;
    const currentExp = userStats.experience;
    const totalExpForNextLevel = 50 * Math.pow(currentLevel + 1, 2);
    const totalExpForCurrentLevel = 50 * Math.pow(currentLevel, 2);
    const expNeededForCurrentLevel = totalExpForNextLevel - totalExpForCurrentLevel;
    const progressPercentage = (currentExp / expNeededForCurrentLevel) * 100;
    const result = Math.min(100, Math.max(0, progressPercentage));
    
    console.log('🎯 计算经验值进度:', {
      currentLevel,
      currentExp,
      totalExpForNextLevel,
      totalExpForCurrentLevel,
      expNeededForCurrentLevel,
      progressPercentage,
      result
    });
    
    return result;
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
      'collected_vocabulary': isChinese ? '已收集词汇' : 'Collectedimage.png',
      'cumulative_review': isChinese ? '累计复习' : 'Review Times',
      'continuous_learning': isChinese ? '连续学习' : 'Streak Days',
      'words_unit': isChinese ? '个词' : ' ',
      'times_unit': isChinese ? '次' : ' ',
      'days_unit': isChinese ? '天' : ' ',
      'hello_greeting': isChinese ? 'HELLO，' : 'HELLO, ',
      'guest_user': isChinese ? '老伙计' : 'Buddy',
      'review_subtitle': isChinese ? '最近都收集了啥单词？我们来回顾一下吧' : 'What words have you collected recently? Let\'s review them',
      'exp_gained': isChinese ? '经验值' : 'EXP',
      'congratulations_exp': isChinese ? '恭喜获得经验值！' : 'Congratulations! You gained experience!'
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
      navigate('ReviewScreen');
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
            <LinearGradient
              colors={[colors.primary[400], colors.primary[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${progressBarValue * 100}%` }]}
            />
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
      
      {/* 挑战横幅 */}
      <View style={styles.challengeBanner}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>
              {t('ready_to_challenge')}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {t('mastered_cards', { count: todayCount })}
            </Text>
          </View>
          <TouchableOpacity style={styles.expButton} onPress={() => handlePressChallenge('shuffle')}>
            <Text style={styles.expButtonText}>{t('exp_gained')}15</Text>
          </TouchableOpacity>
        </View>
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
            <Text style={{ color: colors.text.secondary, fontSize: 16 }}>请添加剧集吧！</Text>
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
            onPress={() => navigate('main', { tab: 'wordbook' })}
          >
            <Ionicons name="book-outline" size={36} color={colors.text.secondary} style={{ marginBottom: 8 }} />
            <Text style={{ color: colors.text.secondary, fontSize: 16 }}>去添加自己的单词本吧！</Text>
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
    paddingTop: Platform.OS === 'ios' ? 80 : 36, // 增加顶部间距，让第一个板块与顶部有足够距离
    // justifyContent: 'space-between', // 移除这行，让内容自然流式排列
  },
  // 统一信息区域样式
  unifiedInfoContainer: {
    flexDirection: 'column',
    marginBottom: 24,
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
    marginBottom: 32, // 增加与剧集复习板块的距离，让挑战横幅更突出
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
  challengeCard: { width: 140, height: 160, backgroundColor: colors.background.secondary, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  challengeIconWrap: { marginBottom: 12 },
  challengeCardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary[500], marginBottom: 2 },
  challengeCardSubtitle: { fontSize: 14, color: colors.text.tertiary },
// 剧集复习样式
  showsSection: { marginBottom: 24 }, // 增加与单词本复习板块的距离，让两个复习板块有明显分隔
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
  wordbookSection: { marginBottom: 24 }, // 增加底部间距，让最后一个板块与屏幕底部有足够距离
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
    marginBottom: 24, // 增加与挑战横幅的距离，让板块之间有更明显的分隔
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
});

export default ReviewIntroScreen; 