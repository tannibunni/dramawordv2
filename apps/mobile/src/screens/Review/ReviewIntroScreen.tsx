import React, { useState, useEffect } from 'react';
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

// 导入服务和常量
import { TMDBService } from '../../services/tmdbService';
import { colors } from '../../constants/colors';

// 导入类型
import { UserExperienceInfo } from '../../types/experience';

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
  // 使用 wrongWordsManager 的错词数量管理
  const [wrongWordsCount, setWrongWordsCount] = useState(wrongWordsManager.getWrongWordsCountState().wrongWordsCount);
  
  // ==================== 经验值相关状态 ====================
  // 使用 experienceManager 的状态管理
  const [experienceState, setExperienceState] = useState(experienceManager.getExperienceState());
  
  // 使用统一动画管理器的动画值
  const { progressBarAnimation } = animationManager.getAnimationValues();
  
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
        progressBarAnimation,
        (progressPercentage) => {
          // 进度条更新回调 - 只在非动画状态下更新
          if (!experienceState.isProgressBarAnimating) {
            // 使用统一方法，避免后续动画回退
            animationManager.setProgressBarImmediate(progressPercentage);
          }
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

  // 获取页面数据
  const pageData = dataManagerService.preparePageData(shows, vocabulary);
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


    
    <View style={styles.container}>
      <DataSyncIndicator visible={true} />
      

      
      {/* 学习统计板块 - 包含问候语 */}
      <View style={styles.learningStatsContainer}>
        {/* 问候语区域 */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>
            {t('hello_greeting', appLanguage)}{user?.nickname || t('guest_user', appLanguage)}
          </Text>
        </View>
        
        {/* 经验值和等级区域 */}
        <View style={styles.experienceSection}>
          <View style={styles.experienceHeader}>
            <View style={styles.levelContainer}>
              <Text style={styles.experienceLabel}>
                {experienceState.userExperienceInfo ? `${t('level_text', appLanguage)} ${experienceState.userExperienceInfo.level}` : '开始学习获得经验值'}
              </Text>
              <View style={styles.levelBadge}>
                {experienceState.userExperienceInfo?.level && experienceState.userExperienceInfo.level >= 10 && <MaterialIcons name="workspace-premium" size={16} color={colors.accent[500]} />}
                {experienceState.userExperienceInfo?.level && experienceState.userExperienceInfo.level >= 5 && experienceState.userExperienceInfo.level < 10 && <MaterialIcons name="star" size={16} color={colors.accent[500]} />}
                {experienceState.userExperienceInfo?.level && experienceState.userExperienceInfo.level >= 1 && experienceState.userExperienceInfo.level < 5 && <MaterialIcons name="emoji-events" size={16} color={colors.accent[500]} />}
              </View>
            </View>
            <Text style={styles.experienceProgressText}>
                            {experienceState.userExperienceInfo
                ? `${experienceState.animatedExperience}/${experienceManager.getCurrentLevelRequiredExp(experienceState.userExperienceInfo.level)} XP`
                : '0/100 XP'
              }
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
              {Math.round(experienceState.progressBarValue * 100)}%
            </Text>
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
          <TouchableOpacity 
            style={styles.challengeCard} 
            activeOpacity={0.8} 
            onPress={() => handlePressChallenge('shuffle')}
          >
            <View style={styles.challengeCardHeader}>
              <MaterialIcons name="lightbulb" size={24} color={colors.primary[500]} />
              <Text style={styles.challengeCardTitle}>{t('smart_challenge', appLanguage)}</Text>
            </View>
            <Text style={styles.challengeCardSubtitle}>
              {t('mastered_cards', appLanguage, { count: todayCount })}
            </Text>
            <View style={styles.challengeCardFooter}>
              <Text style={styles.challengeCardExp}>+15 {t('exp_gained', appLanguage)}</Text>
              <MaterialIcons name="arrow-forward" size={16} color={colors.primary[500]} />
            </View>
          </TouchableOpacity>

          {/* 错词挑战词卡 */}
          <TouchableOpacity 
            style={styles.challengeCard}
            activeOpacity={0.8} 
            onPress={() => handlePressChallenge('wrong_words')}
          >
            <View style={styles.challengeCardHeader}>
              <MaterialIcons name="error" size={24} color={colors.primary[500]} />
              <Text style={styles.challengeCardTitle}>{t('wrong_words_challenge', appLanguage)}</Text>
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  wrongWordsManager.refreshWrongWordsCount(vocabulary);
                }}
                style={{ marginLeft: 'auto', padding: 4 }}
              >
                <MaterialIcons name="refresh" size={16} color={colors.primary[500]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.challengeCardSubtitle}>
              {wrongWordsCount > 0 
                ? `${t('wrong_words_count', appLanguage, { count: wrongWordsCount })}`
                : '暂无错词，继续学习吧！'
              }
            </Text>
            <View style={styles.challengeCardFooter}>
              <Text style={styles.challengeCardExp}>+20 {t('exp_gained', appLanguage)}</Text>
              <MaterialIcons name="arrow-forward" size={16} color={colors.primary[500]} />
            </View>
          </TouchableOpacity>
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
            <MaterialIcons name="movie" size={36} color={colors.text.secondary} style={{ marginBottom: 8 }} />
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