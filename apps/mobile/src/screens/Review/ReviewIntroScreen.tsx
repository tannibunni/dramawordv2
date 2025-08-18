import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  RefreshControl,
  Platform,
  Image,
  Animated
} from 'react-native';
import { useNavigation } from '../../components/navigation/NavigationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';


// 导入服务和工具
import { unifiedSyncService } from '../../services/unifiedSyncService';
import { experienceManager } from './services/experienceManager';
import { animationManager } from '../../services/animationManager';
import { wrongWordsManager } from './services/wrongWordsManager';
import { t } from '../../constants/translations';
import { dataManagerService } from './services/dataManagerService';
import Logger from '../../utils/logger';

// 导入上下文和类型
import { useVocabulary } from '../../context/VocabularyContext';
import { useShowList } from '../../context/ShowListContext';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Show } from '../../context/ShowListContext';

// 导入组件
import { ExperienceParticles } from '../../components/common/ExperienceParticles';
import { DataSyncIndicator } from '../../components/common/DataSyncIndicator';
import { GuestModeIndicator } from '../../components/common/GuestModeIndicator';
import { LevelUpModal } from '../../components/common/LevelUpModal';
import { DailyRewardsButton } from './components/DailyRewardsButton';
import { DailyRewardsModal } from './components/DailyRewardsModal';

// 导入服务和常量
import { TMDBService } from '../../services/tmdbService';
import { colors } from '../../constants/colors';

// 导入类型
import { UserExperienceInfo } from '../../types/experience';

// 导入每日奖励Hook
import { useDailyRewards } from './hooks/useDailyRewards';
import { dailyRewardsManager } from './services/dailyRewardsManager';
import { guestIdService } from '../../services/guestIdService';

const ReviewIntroScreen = () => {
  // 创建页面专用日志器
  const logger = Logger.forPage('ReviewIntroScreen');
  const vocabularyContext = useVocabulary();
  const { shows } = useShowList();
  const navigation = useNavigation();
  const navigate = navigation?.navigate;
  const { appLanguage } = useAppLanguage();
  const { user } = useAuth();
  
  // 添加滚动视图引用
  const scrollViewRef = useRef<ScrollView>(null);
  

  
  // 安全检查，确保vocabularyContext存在
  const vocabulary = vocabularyContext?.vocabulary || [];
  const refreshLearningProgress = vocabularyContext?.refreshLearningProgress || (() => Promise.resolve());
  
  const todayCount = vocabulary?.length || 0;
  // 使用 wrongWordsManager 的错词数量管理
  const [wrongWordsCount, setWrongWordsCount] = useState(wrongWordsManager.getWrongWordsCountState().wrongWordsCount);
  
  // ==================== 经验值相关状态 ====================
  // 使用 experienceManager 的状态管理
  const [experienceState, setExperienceState] = useState(experienceManager.getExperienceState());
  
  // 获取动画值
  const animationValues = animationManager.getAnimationValues();
  
  // 跟踪动画值状态
  const [animationState, setAnimationState] = useState({
    numberValue: 0,
    opacityValue: 0,
    scaleValue: 1,
    levelValue: 1
  });

  // 监听动画值变化
  useEffect(() => {
    const numberListener = animationValues.numberAnimation.addListener(({ value }) => {
      setAnimationState(prev => ({ ...prev, numberValue: value }));
    });
    
    const opacityListener = animationValues.opacityAnimation.addListener(({ value }) => {
      setAnimationState(prev => ({ ...prev, opacityValue: value }));
    });
    
    const scaleListener = animationValues.scaleAnimation.addListener(({ value }) => {
      setAnimationState(prev => ({ ...prev, scaleValue: value }));
    });
    
    const levelListener = animationValues.levelAnimation.addListener(({ value }) => {
      setAnimationState(prev => ({ ...prev, levelValue: value }));
    });

    return () => {
      animationValues.numberAnimation.removeListener(numberListener);
      animationValues.opacityAnimation.removeListener(opacityListener);
      animationValues.scaleAnimation.removeListener(scaleListener);
      animationValues.levelAnimation.removeListener(levelListener);
    };
  }, [animationValues]);

  // 注册 experienceManager 状态回调
  useEffect(() => {
    const unsubscribe = experienceManager.registerStateCallback((updates) => {
      setExperienceState(prev => ({ ...prev, ...updates }));
    });
    
    return unsubscribe;
  }, []);

  // 注册 wrongWordsManager 错词数量回调
  useEffect(() => {
    const unsubscribe = wrongWordsManager.registerCountCallback((count) => {
      setWrongWordsCount(count);
    });
    
    return unsubscribe;
  }, []);
  
  // ==================== 经验值状态管理 ====================
  useEffect(() => {
    logger.info('初始化ReviewIntroScreen状态');
    
    // 使用 experienceManager 统一管理页面经验值状态
    const initializeExperience = async () => {
      await experienceManager.managePageExperience(
        vocabulary?.length || 0,
        (progressPercentage: number) => {
          // 经验值进度条更新回调
          console.log('[ReviewIntroScreen] 经验值进度条更新:', progressPercentage);
        },
        (hasGain) => {
          // 检查完成回调
          if (hasGain) {
            logger.info('检测到经验值增益');
          }
        }
      );
    };
    
    initializeExperience();
  }, []);

  // 经验值检测函数 - 使用 useCallback 避免重复创建
  const checkExperienceGain = useCallback(async () => {
    console.log('[ReviewIntroScreen] 检查经验值增益');
    
    // 方法1：检查 pendingExperienceGain 标记
    const experienceGainedFlag = await AsyncStorage.getItem('pendingExperienceGain');
    console.log('[ReviewIntroScreen] 从AsyncStorage读取的pendingExperienceGain:', experienceGainedFlag);
    
    if (experienceGainedFlag) {
      try {
        const { experienceGained, timestamp } = JSON.parse(experienceGainedFlag);
        const now = Date.now();
        
        console.log('[ReviewIntroScreen] 解析后的经验值增益数据:', { experienceGained, timestamp, now, timeDiff: now - timestamp });
        
        // 检查是否是最近的经验值增益（30秒内，增加容错时间）
        if (experienceGained && experienceGained > 0 && (now - timestamp) < 30000) {
          console.log('[ReviewIntroScreen] 检测到经验值增益:', experienceGained);
          
          // 清除标记
          await AsyncStorage.removeItem('pendingExperienceGain');
          console.log('[ReviewIntroScreen] 已清除pendingExperienceGain标记');
          
          // 延迟一下再触发动画，确保页面完全加载
          setTimeout(async () => {
            try {
              console.log('[ReviewIntroScreen] 开始触发经验值动画:', experienceGained);
              
              // 使用 experienceManager 的动画方法
              await experienceManager.startExperienceAnimationWithState(
                experienceGained,
                (currentExp: number, progress: number) => {
                  console.log('[ReviewIntroScreen] 经验值动画进度:', { currentExp, progress });
                },
                (finalExp: number, finalLevel: number) => {
                  console.log('[ReviewIntroScreen] 经验值动画完成:', { finalExp, finalLevel });
                }
              );
            } catch (error) {
              console.error('[ReviewIntroScreen] 触发经验值动画失败:', error);
            }
          }, 500);
          
          return; // 如果通过标记检测到经验值增益，直接返回
        } else {
          console.log('[ReviewIntroScreen] 经验值增益数据无效或已过期:', { experienceGained, timeDiff: now - timestamp });
          if (experienceGainedFlag) {
            await AsyncStorage.removeItem('pendingExperienceGain');
            console.log('[ReviewIntroScreen] 已清除过期的pendingExperienceGain标记');
          }
        }
      } catch (error) {
        console.error('[ReviewIntroScreen] 解析经验值增益标记失败:', error);
        await AsyncStorage.removeItem('pendingExperienceGain');
      }
    }
    
    // 方法2：通过比较经验值变化来检测增益（备用机制）
    try {
      const lastExperienceKey = 'lastRecordedExperience';
      const currentExperience = experienceManager.getExperienceState().userExperienceInfo?.experience || 0;
      const lastExperience = await AsyncStorage.getItem(lastExperienceKey);
      
      if (lastExperience) {
        const lastExp = parseInt(lastExperience);
        // 只有当经验值真正增加时才触发动画
        if (currentExperience > lastExp && lastExp > 0) {
          const experienceGained = currentExperience - lastExp;
          console.log('[ReviewIntroScreen] 通过经验值比较检测到增益:', { lastExp, currentExperience, experienceGained });
          
          // 更新记录的经验值
          await AsyncStorage.setItem(lastExperienceKey, currentExperience.toString());
          
          // 触发经验值动画
          setTimeout(async () => {
            try {
              console.log('[ReviewIntroScreen] 开始触发经验值动画（备用机制）:', experienceGained);
              
              await experienceManager.startExperienceAnimationWithState(
                experienceGained,
                (currentExp: number, progress: number) => {
                  console.log('[ReviewIntroScreen] 经验值动画进度（备用机制）:', { currentExp, progress });
                },
                (finalExp: number, finalLevel: number) => {
                  console.log('[ReviewIntroScreen] 经验值动画完成（备用机制）:', { finalExp, finalLevel });
                }
              );
            } catch (error) {
              console.error('[ReviewIntroScreen] 触发经验值动画失败（备用机制）:', error);
            }
          }, 500);
          
          return;
        }
      }
      
      // 记录当前经验值，供下次比较使用
      await AsyncStorage.setItem(lastExperienceKey, currentExperience.toString());
      console.log('[ReviewIntroScreen] 记录当前经验值:', currentExperience);
      
    } catch (error) {
      console.error('[ReviewIntroScreen] 备用经验值检测机制失败:', error);
    }
    
    console.log('[ReviewIntroScreen] 没有检测到经验值增益');
  }, []);

  // 保留原有的 useEffect 作为备用检测机制
  useEffect(() => {
    const checkExperienceGainOnFocus = async () => {
      console.log('[ReviewIntroScreen] 组件挂载，备用检查经验值增益');
      await checkExperienceGain();
    };
    
    checkExperienceGainOnFocus();
  }, [checkExperienceGain]);
  
  // ==================== 检查vocabulary刷新 ====================
  useEffect(() => {
    const checkRefreshVocabulary = async () => {
      const refreshFlag = await AsyncStorage.getItem('refreshVocabulary');
      if (refreshFlag === 'true') {
        logger.info('检测到vocabulary刷新标记，重新加载数据');
        await AsyncStorage.removeItem('refreshVocabulary');
        await refreshLearningProgress();
      }
    };
    
    checkRefreshVocabulary();
  }, [refreshLearningProgress]);
  


  // 使用 wrongWordsManager 自动管理错词数量
  useEffect(() => {
    if (vocabulary && vocabulary.length > 0) {
      wrongWordsManager.autoManageWrongWordsCount(vocabulary);
    }
  }, [vocabulary]);
  
  // 当词汇表变化时更新统计
  useEffect(() => {
    if (vocabulary) {
      experienceManager.updateStatisticsWithAnimation(vocabulary.length);
    }
  }, [vocabulary, experienceState.userExperienceInfo?.contributedWords]);

  // 设置翻译服务语言
  useEffect(() => {
    // 翻译函数会自动使用当前语言，无需手动设置
  }, [appLanguage]);

  // ==================== 每日奖励系统 ====================
  const {
    rewardsState,
    hasAvailableRewards,
    availableRewardsCount,
    claimReward,
    claimAllRewards,
    refreshRewards
  } = useDailyRewards(appLanguage);

  // 添加调试日志
  useEffect(() => {
    console.log('[ReviewIntroScreen] 每日奖励系统状态:', {
      hasAvailableRewards,
      availableRewardsCount,
      rewardsCount: rewardsState.rewards.length,
      isLoading: rewardsState.isLoading,
      rewards: rewardsState.rewards.map(r => ({ id: r.id, name: r.name, status: r.status }))
    });
  }, [hasAvailableRewards, availableRewardsCount, rewardsState.rewards, rewardsState.isLoading]);

  // 测试 dailyRewardsManager 是否正常工作
  useEffect(() => {
    const testDailyRewardsManager = async () => {
      try {
        console.log('[ReviewIntroScreen] 测试 dailyRewardsManager...');
        const rewards = await dailyRewardsManager.checkRewardConditions();
        console.log('[ReviewIntroScreen] dailyRewardsManager 检查结果:', rewards);
      } catch (error) {
        console.error('[ReviewIntroScreen] dailyRewardsManager 测试失败:', error);
      }
    };
    
    testDailyRewardsManager();
  }, []);

  // 每日奖励弹窗状态
  const [dailyRewardsModalVisible, setDailyRewardsModalVisible] = useState(false);

  // 打开每日奖励弹窗
  const openDailyRewardsModal = () => {
    setDailyRewardsModalVisible(true);
  };

  // 关闭每日奖励弹窗
  const closeDailyRewardsModal = () => {
    setDailyRewardsModalVisible(false);
  };

  // 使用 useMemo 缓存页面数据，避免重复计算
  const pageData = useMemo(() => {
    return dataManagerService.preparePageData(shows, vocabulary);
  }, [shows, vocabulary]);
  
  const { showItems, wordbookItems, showItemsWithCounts, wordbookItemsWithCounts } = pageData;

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
      // 使用 wrongWordsManager 刷新错词数量
      wrongWordsManager.refreshWrongWordsCount(vocabulary);
    }
  }, []); // 只在组件初始化时执行一次

  return (
    <>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refreshLearningProgress}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* 学习统计板块 - 包含问候语 */}
        <View style={styles.learningStatsContainer}>
          {/* 问候语区域 */}
          <View style={styles.greetingSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.greetingText}>
                  {t('hello_greeting', appLanguage)}{user?.nickname || 'Guest'}
                </Text>
                <View style={{ marginLeft: 8 }}>
                  <DataSyncIndicator visible={true} showDetails={false} />
                </View>
              </View>

            </View>
          </View>
          
          {/* 经验值和等级区域 */}
          <View style={styles.experienceSection}>
            <View style={styles.experienceHeader}>
              <View style={styles.levelContainer}>
                <Text style={styles.experienceLabel}>
                  {experienceManager.getExperienceDisplayData().levelText}
                </Text>
                <View style={styles.levelBadge}>
                  {experienceManager.getExperienceDisplayData().levelBadge.hasPremium && <MaterialIcons name="workspace-premium" size={16} color={colors.accent[500]} />}
                  {experienceManager.getExperienceDisplayData().levelBadge.hasStar && <MaterialIcons name="star" size={16} color={colors.accent[500]} />}
                  {experienceManager.getExperienceDisplayData().levelBadge.hasEvent && <MaterialIcons name="emoji-events" size={16} color={colors.accent[500]} />}
                </View>
              </View>
              <Text style={styles.experienceProgressText}>
                {experienceManager.getExperienceDisplayData().experienceText}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              {/* 蓝色渐变进度条 - 使用静态进度条显示经验值进度 */}
              <View style={[styles.progressBarFill, { 
                width: `${experienceManager.getExperienceDisplayData().progressPercentage * 100}%` 
              }]}>
                <LinearGradient
                  colors={[colors.primary[400], colors.primary[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressBarGradient}
                />
              </View>

            </View>
          </View>
          
          {/* 统计数据区域 */}
          <View style={styles.statsSection}>
            {/* 已收集词汇 */}
            <View style={styles.statItem}>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{experienceState.animatedCollectedWords}</Text>
                <Text style={styles.statUnit}>{t('words_unit', appLanguage)}</Text>
              </View>
              <Text style={styles.statLabel}>{t('collected_vocabulary', appLanguage)}</Text>
            </View>
            
            {/* 竖线隔断 */}
            <View style={styles.statDivider} />
            
            {/* 累计复习 */}
            <View style={styles.statItem}>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{experienceState.userExperienceInfo?.totalExperience || 0}</Text>
                <Text style={styles.statUnit}>{t('times_unit', appLanguage)}</Text>
              </View>
              <Text style={styles.statLabel}>{t('cumulative_review', appLanguage)}</Text>
            </View>
            
            {/* 竖线隔断 */}
            <View style={styles.statDivider} />
            
            {/* 连续学习 */}
            <View style={styles.statItem}>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{experienceState.userExperienceInfo?.currentStreak || 0}</Text>
                <Text style={styles.statUnit}>{t('days_unit', appLanguage)}</Text>
              </View>
              <Text style={styles.statLabel}>{t('continuous_learning', appLanguage)}</Text>
            </View>
          </View>
        </View>
        
        {/* 每日奖励区域 */}
        <DailyRewardsButton
          hasAvailableRewards={hasAvailableRewards}
          availableCount={availableRewardsCount}
          onPress={openDailyRewardsModal}
        />
        
        {/* 挑战词卡SLIDER */}
        <View style={styles.challengeSliderContainer}>
          <Text style={styles.challengeSliderTitle}>{t('challenge_cards', appLanguage)}</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.challengeSlider}
            contentContainerStyle={styles.challengeSliderContent}
          >
            {/* 智能挑战词卡 */}
            <View style={styles.challengeCard}>
              <View style={styles.challengeCardContent}>
                {/* 中央大图标 */}
                <View style={styles.challengeCardIconCenter}>
                  <MaterialIcons name="lightbulb" size={48} color={colors.primary[500]} />
                </View>
                
                {/* 标题文本 */}
                <Text style={styles.challengeCardTitleCenter}>
                  {t('smart_challenge', appLanguage)}
                </Text>
                
                {/* 描述文本 */}
                <Text style={styles.challengeCardSubtitleCenter}>
                  {t('mastered_cards', appLanguage, { count: todayCount })}
                </Text>
              </View>
              
              {/* 底部挑战按钮 */}
              <TouchableOpacity 
                style={[
                  styles.challengeButton,
                  todayCount > 0 ? styles.challengeButtonActive : styles.challengeButtonDisabled
                ]}
                activeOpacity={0.95} 
                onPress={() => todayCount > 0 && handlePressChallenge('shuffle')}
                disabled={todayCount === 0}
              >
                {/* 主要内容区域 */}
                <View style={styles.challengeButtonContent}>
                  {/* 上半部分：奖励信息 */}
                  <View style={styles.challengeButtonReward}>
                    <Text style={styles.challengeButtonRewardText}>
                      {t('per_word_xp', appLanguage)}
                    </Text>
                  </View>
                  
                  {/* 下半部分：行动文案 */}
                  <Text 
                    style={styles.challengeButtonActionText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {todayCount > 0 ? t('start_challenge', appLanguage) : t('no_words_to_challenge', appLanguage)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* 错词挑战词卡 */}
            <View style={styles.challengeCard}>
              <View style={styles.challengeCardContent}>
                {/* 中央大图标 */}
                <View style={styles.challengeCardIconCenter}>
                  <MaterialIcons name="error" size={48} color={colors.primary[500]} />
                </View>
                
                {/* 标题文本 */}
                <Text style={styles.challengeCardTitleCenter}>
                  {t('wrong_words_challenge', appLanguage)}
                </Text>
                
                {/* 描述文本 */}
                <Text style={styles.challengeCardSubtitleCenter}>
                  {wrongWordsCount > 0 
                    ? `${t('wrong_words_count', appLanguage, { count: wrongWordsCount })}`
                    : t('no_errors_continue_learning', appLanguage)
                  }
                </Text>
              </View>
              
              {/* 底部挑战按钮 */}
              <TouchableOpacity 
                style={[
                  styles.challengeButton,
                  wrongWordsCount > 0 ? styles.challengeButtonActive : styles.challengeButtonDisabled
                ]}
                activeOpacity={0.95} 
                onPress={() => wrongWordsCount > 0 && handlePressChallenge('wrong_words')}
                disabled={wrongWordsCount === 0}
              >
                {/* 主要内容区域 */}
                <View style={styles.challengeButtonContent}>
                  {/* 上半部分：奖励信息 */}
                  <View style={styles.challengeButtonReward}>
                    <Text style={styles.challengeButtonRewardText}>
                      {t('per_word_xp', appLanguage)}
                    </Text>
                  </View>
                  
                  {/* 下半部分：行动文案 */}
                  <Text 
                    style={styles.challengeButtonActionText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {wrongWordsCount > 0 ? t('start_review_now', appLanguage) : t('no_words_to_challenge', appLanguage)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
        
        {/* 第二行：剧集复习 */}
        {/* 剧集复习板块 */}
        <View style={styles.showsSection}>
          <Text style={styles.showsTitle}>{t('series_review', appLanguage)}</Text>
          {showItems.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.showsScroll}>
              {showItemsWithCounts.map(({ show: item, wordCount }) => (
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
                    <Text style={styles.showWordCount}>{t('words_count', appLanguage, { count: wordCount })}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity
              style={{ height: EMPTY_SECTION_HEIGHT, justifyContent: 'center', alignItems: 'center' }}
              activeOpacity={0.7}
              onPress={() => navigate('main', { tab: 'shows' })}
            >
              <MaterialIcons name="movie" size={36} color={colors.text.secondary} style={{ marginBottom: 18 }} />
              <Text style={{ color: colors.text.secondary, fontSize: 16 }}>{t('add_shows', appLanguage)}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 第三行：单词本复习 */}
        {/* 单词本复习板块 */}
        <View style={styles.wordbookSection}>
          <Text style={styles.wordbookTitle}>{t('wordbook_review', appLanguage)}</Text>
          {wordbookItems.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wordbookScroll}>
              {wordbookItemsWithCounts.map(({ show: item, wordCount }) => (
                <TouchableOpacity key={item.id} style={styles.wordbookCard} activeOpacity={0.8} onPress={() => handlePressWordbook(item)}>
                  <View style={styles.wordbookIconWrap}>
                    <MaterialIcons 
                      name={(item.icon || 'book-outline') as any} 
                      size={32} 
                      color={colors.primary[400]} 
                    />
                  </View>
                  <Text style={styles.wordbookName}>{item.name}</Text>
                  <Text style={styles.wordbookWordCount}>{t('words_count', appLanguage, { count: wordCount })}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity
              style={{ height: EMPTY_SECTION_HEIGHT, justifyContent: 'center', alignItems: 'center' }}
              activeOpacity={0.7}
              onPress={() => navigate('main', { tab: 'vocabulary' })}
            >
              <MaterialIcons name="library-books" size={36} color={colors.text.secondary} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.text.secondary, fontSize: 16 }}>{t('add_wordbook', appLanguage)}</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* 升级弹窗 */}
        <LevelUpModal
          visible={experienceState.showLevelUpModal}
          levelUpInfo={experienceState.levelUpInfo}
          onClose={() => experienceManager.closeLevelUpModal()}
        />
        
        {/* 每日奖励弹窗 */}
        <DailyRewardsModal
          visible={dailyRewardsModalVisible}
          onClose={closeDailyRewardsModal}
          rewards={rewardsState.rewards}
          onClaimReward={claimReward}
          onClaimAll={claimAllRewards}
          onRefresh={refreshRewards}
          isLoading={rewardsState.isLoading}
        />
      </ScrollView>
      
      {/* 经验值动画弹窗 */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: animationState.opacityValue,
          zIndex: 1000,
        }}
        pointerEvents="none"
      >
        <Animated.View
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: 20,
            padding: 30,
            alignItems: 'center',
            transform: [
              { scale: animationState.scaleValue }
            ],
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {/* 经验值数字动画 */}
          <Animated.Text
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: colors.primary[500],
              marginBottom: 10,
            }}
          >
            +{Math.round(animationState.numberValue * 4)} XP
          </Animated.Text>
          
          {/* 等级动画 */}
          <Animated.View
            style={{
              transform: [
                { scale: animationState.levelValue }
              ],
            }}
          >
            <Text style={{
              fontSize: 18,
              color: colors.text.secondary,
              textAlign: 'center',
            }}>
              获得经验值！
            </Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 36,
    paddingBottom: 40, // 增加底部间距，确保内容不被遮挡
  },
  // 统一信息区域样式
  unifiedInfoContainer: {
    flexDirection: 'column',
    marginBottom: 12,
    paddingHorizontal: 10,
    marginTop: 0, // 移除顶部间距，因为挑战横幅在上面
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
  showsSection: { marginBottom: 20 }, // 增加与单词本复习板块的距离
  showsTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text.primary, marginBottom: 12 }, // 增加标题底部间距
  showsScroll: { flexGrow: 0 },
  showCard: { 
    width: 120, 
    height: 200, // 增加高度从170到200，让海报完整展示
    borderRadius: 16, 
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  posterContainer: {
    width: '100%',
    height: 150, // 增加海报高度从112到140，让海报更完整展示
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
  wordbookSection: { marginBottom: 20 }, // 增加底部间距，让最后一个板块与屏幕底部有足够距离
  wordbookTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text.primary, marginBottom: 12 }, // 增加标题底部间距
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
  // 经验值动画样式已移除，使用经验值服务
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
    marginBottom: 16, // 增加与每日奖励按钮的距离
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
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.light,
    marginHorizontal: 8,
  },
  // 经验值相关样式
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
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  experienceLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  levelBadge: {
    flexDirection: 'row',
    marginLeft: 8,
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
  // 挑战词卡SLIDER样式
  challengeSliderContainer: {
    marginBottom: 20, // 增加与剧集复习板块的距离
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
    height: 260,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  challengeCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 中央大图标样式
  challengeCardIconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  // 居中对齐的标题样式
  challengeCardTitleCenter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  // 居中对齐的描述样式
  challengeCardSubtitleCenter: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  // 刷新按钮样式
  challengeCardRefreshButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
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

  // 挑战按钮样式 - 简洁扁平化
  challengeButton: {
    marginTop: 16,
    marginHorizontal: 0,
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeButtonActive: {
    backgroundColor: colors.primary[500],
  },
  challengeButtonDisabled: {
    backgroundColor: colors.gray[300],
    shadowOpacity: 0,
    elevation: 0,
  },
  challengeButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeButtonReward: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  challengeButtonRewardText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  challengeButtonActionText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.85,
    marginTop: 1,
    lineHeight: 14,
  },

});

export default ReviewIntroScreen; 