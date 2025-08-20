import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import Swiper from 'react-native-deck-swiper';
import WordCard from '../../components/cards/WordCard';
import type { WordData } from '../../types/word';
import { audioService } from '../../services/audioService';
import { learningDataService } from '../../services/learningDataService';
import { wrongWordsManager } from './services/wrongWordsManager';
import { LearningRecord, updateWordReview, Word } from '../../services/learningAlgorithm';
import { SwipeableWordCard } from '../../components/cards';
import { UserService } from '../../services/userService';
import { useVocabulary } from '../../context/VocabularyContext';
import { useNavigation } from '../../components/navigation/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';
import { wordService } from '../../services/wordService';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/config';
import Toast from '../../components/common/Toast';
import Logger from '../../utils/logger';
import { unifiedSyncService } from '../../services/unifiedSyncService';
import ReviewCompleteScreen from './ReviewCompleteScreen';
import { useReviewStats, ReviewStats, ReviewAction } from './hooks/useReviewStats';
// import WrongWordsCompleteScreen, { WrongWordsReviewStats, WrongWordsReviewAction } from './WrongWordsCompleteScreen';

// 导入新的hooks和组件
import { useReviewLogic } from './hooks/useReviewLogic';
import { useReviewProgress } from './hooks/useReviewProgress';
import { useReviewActions } from './hooks/useReviewActions';
import { ReviewProgressBar } from './components/ReviewProgressBar';
import { ReviewModeSelector } from './components/ReviewModeSelector';
import { ReviewEmptyState } from './components/ReviewEmptyState';
import { guestDataAdapter } from '../../services/guestDataAdapter';

const { width, height } = Dimensions.get('window');

interface ReviewWord {
  id: string;
  word: string;
  translation: string;
  phonetic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  show?: string;
  lastReviewed: string;
  reviewCount: number;
  incorrectCount?: number;
  consecutiveIncorrect?: number;
  consecutiveCorrect?: number;
}

interface ReviewSession {
  totalWords: number;
  currentIndex: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  collectedCount: number;
  startTime: Date;
}

interface ReviewScreenProps {
  type?: string;
  id?: number;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ type, id }) => {
  // 使用新的hooks
  const [reviewMode, setReviewMode] = useState<'smart' | 'all'>('smart');
  const [showToast, setShowToast] = useState(false);
  // 进入复习时不显示艾宾浩斯提示，仅在切换复习模式后显示一次
  const [showEbbinghausTip, setShowEbbinghausTip] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [cardMode, setCardMode] = useState<'swipe' | 'flip'>('swipe');
  const [showAnswer, setShowAnswer] = useState(false);
  const [session, setSession] = useState<ReviewSession | null>(null);
  
  const { navigate } = useNavigation();
  const { appLanguage } = useAppLanguage();
  const { user } = useAuth();
  const swiperRef = useRef<any>(null);
  
  // 设置翻译服务语言
  useEffect(() => {
    // 翻译函数会自动使用当前语言，无需手动设置
  }, [appLanguage]);
  
  // 使用新的hooks
  const { 
    words, 
    isEbbinghaus, 
    showEbbinghausTip: ebbinghausTip, 
    setShowEbbinghausTip: setEbbinghausTip,
    loadReviewWords 
  } = useReviewLogic({ type, id, reviewMode });
  
  const {
    reviewStats,
    reviewActions,
    finalStats,
    updateBackendWordProgress,
    updateStats,
    initializeStats,
    calculateFinalStats
  } = useReviewStats();
  
  // 初始化统计数据 - 只在复习开始时初始化一次
  useEffect(() => {
    if (words && words.length > 0) {
      console.log('📊 ReviewScreen: 初始化统计数据，单词数量:', words.length);
      initializeStats(words.length);
    }
  }, [words, initializeStats]);
  
  const {
    swiperIndex,
    setSwiperIndex,
    currentProgress,
    progressAnimation,
    isReviewComplete,
    resetProgress,
    setComplete,
    moveToNextWord,
    // 五连击相关
    fiveStreakCount,
    showStreakAnimation,
    handleCorrectAnswer,
    handleWrongAnswer,
    continueFromStreak
  } = useReviewProgress(words.length);
  
  const {
    handleSwipeLeft,
    handleSwipeRight,
    handleSwipeDown
  } = useReviewActions({
    words,
    swiperIndex,
    updateBackendWordProgress,
    updateStats,
    moveToNextWord,
    updateSession: (action) => {
      if (session) {
        setSession(prev => prev ? {
          ...prev,
          correctCount: prev.correctCount + (action === 'correct' ? 1 : 0),
          incorrectCount: prev.incorrectCount + (action === 'incorrect' ? 1 : 0),
          skippedCount: prev.skippedCount + (action === 'skipped' ? 1 : 0),
          collectedCount: prev.collectedCount + (action === 'collected' ? 1 : 0),
        } : null);
      }
    },
    onReviewComplete: () => {
      console.log('🎯 从 handleSwipeRight 调用完成处理函数');
      if (!isReviewComplete) {
        handleSwipedAll();
      }
    }
  });

  // 监控艾宾浩斯记忆法状态变化，显示Toast提示（仅在切换复习模式后）
  useEffect(() => {
    if (
      showEbbinghausTip && // 仅在切换模式后允许显示
      isEbbinghaus &&
      reviewMode === 'smart' &&
      (!type || type === 'shuffle' || type === 'random')
    ) {
      setShowToast(true);
      setShowEbbinghausTip(false); // 显示一次后关闭
    }
  }, [isEbbinghaus, reviewMode, type, showEbbinghausTip]);

  const [wordDataCache, setWordDataCache] = useState<{ [key: string]: WordData }>({});
  const [isWordDataLoading, setIsWordDataLoading] = useState(true);
  const [pendingOperations, setPendingOperations] = useState(0);

  // 词卡数据批量预加载
  useEffect(() => {
    console.log('🔄 词卡数据批量预加载开始，words length:', words?.length, '当前 loading 状态:', isWordDataLoading);
    if (!words || words.length === 0) {
      console.log('📝 没有 words，设置 loading 为 false');
      setIsWordDataLoading(false);
      return;
    }
    console.log('🔄 设置 loading 为 true');
    setIsWordDataLoading(true);
    console.log('🔄 开始批量加载词卡数据...');
    Promise.all(words.map(w => loadWordData(w))).then(() => {
      console.log('✅ 所有词卡数据加载完成，设置 loading 为 false');
      setIsWordDataLoading(false);
    }).catch(error => {
      console.error('❌ 批量加载词卡数据失败:', error);
      setIsWordDataLoading(false);
    });
  }, [words]);

  // 监控 isWordDataLoading 状态变化
  useEffect(() => {
    console.log('🔄 isWordDataLoading 状态变化:', isWordDataLoading);
  }, [isWordDataLoading]);

  // 监控 wordDataCache 变化，强制重新渲染
  useEffect(() => {
    console.log('🔄 wordDataCache 更新:', Object.keys(wordDataCache));
    if (Object.keys(wordDataCache).length > 0 && words.length > 0) {
      // 强制 Swiper 重新渲染
      console.log('🔄 强制 Swiper 重新渲染');
      if (swiperRef.current) {
        swiperRef.current.forceUpdate();
      }
    }
  }, [wordDataCache]);

  // 清理内存缓存的函数
  const clearWordDataCache = () => {
    console.log('🗑️ 清理 ReviewScreen 内存缓存');
    setWordDataCache({});
  };

  // 将 ReviewWord 转换为 WordData 格式
  const convertToWordData = async (reviewWord: ReviewWord): Promise<WordData> => {
    try {
      // 优先从 wordService 获取真实词卡数据
      const wordDetail = await wordService.getWordDetail(reviewWord.word);
      if (wordDetail) {
        console.log(`✅ 获取到真实词卡数据: ${reviewWord.word}`);
        return wordDetail;
      }
    } catch (error) {
      console.warn(`⚠️ 获取词卡数据失败，使用 fallback: ${reviewWord.word}`, error);
    }
    
    // fallback: 使用基本数据
    console.log(`📝 使用 fallback 词卡数据: ${reviewWord.word}`);
    return {
      word: reviewWord.word,
      phonetic: reviewWord.phonetic,
      definitions: [
        {
          partOfSpeech: 'noun',
          definition: reviewWord.translation,
          examples: [
            {
              english: `Example sentence with ${reviewWord.word}`,
              chinese: `包含 ${reviewWord.word} 的例句`,
            },
          ],
        },
      ],
      searchCount: reviewWord.reviewCount,
      lastSearched: reviewWord.lastReviewed,
      isCollected: false,
    };
  };

  // 加载词卡数据
  const loadWordData = async (reviewWord: ReviewWord) => {
    console.log(`🔄 开始加载词卡数据: ${reviewWord.word}`);
    if (wordDataCache[reviewWord.word]) {
      console.log(`✅ 词卡数据已缓存: ${reviewWord.word}`);
      return wordDataCache[reviewWord.word];
    }
    
    try {
      const wordData = await convertToWordData(reviewWord);
      console.log(`✅ 词卡数据加载完成: ${reviewWord.word}`, wordData);
      setWordDataCache(prev => ({ ...prev, [reviewWord.word]: wordData }));
      return wordData;
    } catch (error) {
      console.error(`❌ 词卡数据加载失败: ${reviewWord.word}`, error);
      // 返回 fallback 数据
      const fallbackData = {
        word: reviewWord.word,
        phonetic: reviewWord.phonetic,
        definitions: [
          {
            partOfSpeech: 'noun',
            definition: reviewWord.translation,
            examples: [
              {
                english: `Example sentence with ${reviewWord.word}`,
                chinese: `包含 ${reviewWord.word} 的例句`,
              },
            ],
          },
        ],
        searchCount: reviewWord.reviewCount,
        lastSearched: reviewWord.lastReviewed,
        isCollected: false,
      };
      setWordDataCache(prev => ({ ...prev, [reviewWord.word]: fallbackData }));
      return fallbackData;
    }
  };

  // 渲染卡片内容
  const renderCard = (item: ReviewWord, index: number) => {
    console.log(`🔄 renderCard 被调用 - index: ${index}, word: ${item.word}`);
    console.log(`🔄 wordDataCache 状态:`, Object.keys(wordDataCache));
    console.log(`🔄 查找 ${item.word} 的缓存数据:`, wordDataCache[item.word]);
    
    const wordData = wordDataCache[item.word];
    if (!wordData) {
      console.log(`❌ 没有找到 ${item.word} 的缓存数据，显示加载中...`);
      return <View style={{ height: 300, justifyContent: 'center', alignItems: 'center' }}><Text>{t('loading', appLanguage)}</Text></View>;
    }
    
    console.log(`✅ 找到 ${item.word} 的缓存数据，渲染卡片`);
    return (
      <SwipeableWordCard
        key={`${item.word}-${wordDataCache[item.word] ? 'loaded' : 'loading'}`}
        wordData={wordData}
        isExpanded={expandedIndex === index}
        onExpandToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
        onPlayAudio={handlePlayAudio}
      />
    );
  };

  // Swiper 外层加 loading 判断
  if (isWordDataLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary }}>
        <Text>加载中...</Text>
      </SafeAreaView>
    );
  }

  // 处理音频播放
  const handlePlayAudio = async (word: string) => {
    console.log('🎵 ReviewScreen - 开始播放音频:', word);
    
    try {
      await audioService.playWordPronunciation(word);
      console.log('✅ ReviewScreen - 音频播放成功');
    } catch (error) {
      console.error('❌ ReviewScreen - 音频播放失败:', error);
      
      // 尝试使用 Web Speech API 作为备用方案
      try {
        console.log('🔄 ReviewScreen - 尝试使用 Web Speech API...');
        await audioService.playWithWebSpeech(word);
        console.log('✅ ReviewScreen - Web Speech API 播放成功');
      } catch (webSpeechError) {
        console.error('❌ ReviewScreen - Web Speech API 也失败了:', webSpeechError);
        Alert.alert(
          t('audio_play_failed', appLanguage), 
          t('audio_play_failed_message', appLanguage)
        );
      }
    }
  };

  // 切换答案显示
  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  // 切换卡片模式
  const toggleCardMode = () => {
    setCardMode(prev => prev === 'swipe' ? 'flip' : 'swipe');
  };

  if (!words || words.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary }}>
        <ReviewEmptyState type={type} />
      </SafeAreaView>
    );
  }

  // onSwipedAll 统计时传 actions
  const handleSwipedAll = () => {
    console.log('ReviewScreen: All cards swiped, completing review');
    
    // 防止重复调用
    if (isReviewComplete) {
      console.log('ReviewScreen: Review already completed, skipping duplicate call');
      return;
    }
    
    // 使用 calculateFinalStats 获取正确的统计数据
    const finalStats = calculateFinalStats();
    console.log('ReviewScreen: Final stats from calculateFinalStats:', finalStats);
        console.log(t('review_complete_message', appLanguage, {
      remembered: finalStats.rememberedWords, 
      forgotten: finalStats.forgottenWords 
    }));
    
    // 确保 finalStats 被正确设置
    console.log('ReviewScreen: Setting final stats for completion screen');
    
    // 延迟显示完成页面，确保进度条动画完成
    setTimeout(() => {
      setComplete();
    }, 1200);
  };

  // 根据复习类型选择完成页面
  if (isReviewComplete) {
        // 错词挑战模式暂时使用普通完成页面
    if (type === 'wrong_words') {
      console.log('🔧 ReviewScreen: 进入错词挑战完成页面逻辑（使用普通完成页面）');
      console.log('🔧 ReviewScreen: reviewActions:', reviewActions);
      console.log('🔧 ReviewScreen: finalStats:', finalStats);
      console.log('🔧 ReviewScreen: reviewStats:', reviewStats);
      
      // 暂时使用普通完成页面
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
          <ReviewCompleteScreen 
            stats={finalStats || reviewStats}
            actions={reviewActions}
            type={type}
            onBack={async (experienceGained?: number) => {
              // 同步到后端（仅注册用户）
              if (user && user.loginType !== 'guest') {
                try {
                  const token = await AsyncStorage.getItem('authToken');
                  if (token) {
                    // 更新复习次数和连续学习
                    await fetch(`${API_BASE_URL}/users/stats`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        totalReviews: 1, // 增加1次复习
                        updateContinuousLearning: true // 标记需要更新连续学习
                      }),
                    });
                    console.log('✅ 复习次数和连续学习已同步到后端');
                  }
                } catch (error) {
                  console.error('❌ 更新复习次数失败:', error);
                }
              } else {
                console.log('👤 游客模式，数据仅保存本地，不加入同步队列');
              }
              
              // 更新本地 userStats（包含连续学习天数）- 使用guestDataAdapter
              try {
                const currentStats = await guestDataAdapter.getUserStats();
                const today = new Date().toDateString();
                const lastStudyDate = currentStats?.lastStudyDate;
                
                // 计算连续学习天数
                let newStreak = currentStats?.currentStreak || 0;
                if (lastStudyDate === today) {
                  // 今天已经学习过，不增加连续天数
                  console.log('📅 今天已经学习过，连续天数保持不变:', newStreak);
                } else if (lastStudyDate === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()) {
                  // 昨天学习过，连续天数+1
                  newStreak += 1;
                  console.log('📅 昨天学习过，连续天数+1:', newStreak);
                } else {
                  // 超过1天没学习，重置连续天数
                  newStreak = 1;
                  console.log('📅 超过1天没学习，重置连续天数为1');
                }
                
                const updatedStats = {
                  ...currentStats,
                  totalReviews: (currentStats?.totalReviews || 0) + 1,
                  currentStreak: newStreak,
                  lastStudyDate: today
                };
                await guestDataAdapter.setUserStats(updatedStats);
                console.log('✅ 通过guestDataAdapter更新userStats，连续天数:', newStreak);
              } catch (error) {
                console.error('❌ 更新userStats失败:', error);
                // 降级到直接AsyncStorage操作
                const currentStats = await AsyncStorage.getItem('userStats');
                if (currentStats) {
                  const stats = JSON.parse(currentStats);
                  const updatedStats = {
                    ...stats,
                    totalReviews: (stats.totalReviews || 0) + 1
                  };
                  await AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));
                  console.log('✅ 降级：直接更新AsyncStorage userStats');
                } else {
                  const newStats = {
                    collectedWords: 0,
                    contributedWords: 0,
                    totalReviews: 1,
                    currentStreak: 1,
                    lastStudyDate: new Date().toDateString()
                  };
                  await AsyncStorage.setItem('userStats', JSON.stringify(newStats));
                  console.log('✅ 降级：创建新的AsyncStorage userStats');
                }
              }
              
              // 标记需要刷新vocabulary数据
              await AsyncStorage.setItem('refreshVocabulary', 'true');
              
              // 如果有经验值增益，存储到AsyncStorage中供ReviewIntroScreen检测
              if (experienceGained && experienceGained > 0) {
                console.log('🎯 ReviewScreen: 存储经验值增益到AsyncStorage:', experienceGained);
                const experienceData = {
                  experienceGained,
                  timestamp: Date.now()
                };
                console.log('🎯 ReviewScreen: 存储的经验值数据:', experienceData);
                await AsyncStorage.setItem('pendingExperienceGain', JSON.stringify(experienceData));
                
                // 验证存储是否成功
                const storedData = await AsyncStorage.getItem('pendingExperienceGain');
                console.log('🎯 ReviewScreen: 验证存储结果:', storedData);
              } else {
                console.log('🎯 ReviewScreen: 无经验值增益，不设置标记');
              }
              
              // 导航回review intro页面
              navigate('main', { tab: 'review' });
            }}
          />
        </SafeAreaView>
      );
    } else {
      // 普通复习模式使用原有的完成页面
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
          <ReviewCompleteScreen 
            stats={finalStats || reviewStats}
            actions={reviewActions}
            type={type}
            onBack={async (experienceGained?: number) => {
              // 同步到后端（仅注册用户）
              if (user && user.loginType !== 'guest') {
                try {
                  const token = await AsyncStorage.getItem('authToken');
                  if (token) {
                    // 更新复习次数和连续学习
                    await fetch(`${API_BASE_URL}/users/stats`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        totalReviews: 1, // 增加1次复习
                        updateContinuousLearning: true // 标记需要更新连续学习
                      }),
                    });
                    console.log('✅ 复习次数和连续学习已同步到后端');
                  }
                } catch (error) {
                  console.error('❌ 更新复习次数失败:', error);
                }
              } else {
                console.log('👤 游客模式，数据仅保存本地，不加入同步队列');
              }
              
              // 更新本地 userStats（包含连续学习天数）- 使用guestDataAdapter
              try {
                const currentStats = await guestDataAdapter.getUserStats();
                const today = new Date().toDateString();
                const lastStudyDate = currentStats?.lastStudyDate;
                
                // 计算连续学习天数
                let newStreak = currentStats?.currentStreak || 0;
                if (lastStudyDate === today) {
                  // 今天已经学习过，不增加连续天数
                  console.log('📅 今天已经学习过，连续天数保持不变:', newStreak);
                } else if (lastStudyDate === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()) {
                  // 昨天学习过，连续天数+1
                  newStreak += 1;
                  console.log('📅 昨天学习过，连续天数+1:', newStreak);
                } else {
                  // 超过1天没学习，重置连续天数
                  newStreak = 1;
                  console.log('📅 超过1天没学习，重置连续天数为1');
                }
                
                const updatedStats = {
                  ...currentStats,
                  totalReviews: (currentStats?.totalReviews || 0) + 1,
                  currentStreak: newStreak,
                  lastStudyDate: today
                };
                await guestDataAdapter.setUserStats(updatedStats);
                console.log('✅ 通过guestDataAdapter更新userStats，连续天数:', newStreak);
              } catch (error) {
                console.error('❌ 更新userStats失败:', error);
                // 降级到直接AsyncStorage操作
                const currentStats = await AsyncStorage.getItem('userStats');
                if (currentStats) {
                  const stats = JSON.parse(currentStats);
                  const updatedStats = {
                    ...stats,
                    totalReviews: (stats.totalReviews || 0) + 1
                  };
                  await AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));
                  console.log('✅ 降级：直接更新AsyncStorage userStats');
                } else {
                  const newStats = {
                    collectedWords: 0,
                    contributedWords: 0,
                    totalReviews: 1,
                    currentStreak: 1,
                    lastStudyDate: new Date().toDateString()
                  };
                  await AsyncStorage.setItem('userStats', JSON.stringify(newStats));
                  console.log('✅ 降级：创建新的AsyncStorage userStats');
                }
              }
              
              // 标记需要刷新vocabulary数据
              await AsyncStorage.setItem('refreshVocabulary', 'true');
              
              // 如果有经验值增益，存储到AsyncStorage中供ReviewIntroScreen检测
              if (experienceGained && experienceGained > 0) {
                console.log('🎯 ReviewScreen: 存储经验值增益到AsyncStorage:', experienceGained);
                const experienceData = {
                  experienceGained,
                  timestamp: Date.now()
                };
                console.log('🎯 ReviewScreen: 存储的经验值数据:', experienceData);
                await AsyncStorage.setItem('pendingExperienceGain', JSON.stringify(experienceData));
                
                // 验证存储是否成功
                const storedData = await AsyncStorage.getItem('pendingExperienceGain');
                console.log('🎯 ReviewScreen: 验证存储结果:', storedData);
              } else {
                console.log('🎯 ReviewScreen: 无经验值增益，不设置标记');
              }
              
              // 导航回review intro页面
              navigate('main', { tab: 'review' });
            }}
          />
        </SafeAreaView>
      );
    }
  }

  console.log('ReviewScreen: Rendering Swiper with words length:', words.length, 'swiperIndex:', swiperIndex);
  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      {/* Toast提示 */}
      {showToast && (
        <Toast
          message={t('ebbinghaus_activated', appLanguage)}
          type="success"
          duration={3000}
          onHide={() => setShowToast(false)}
        />
      )}
      
      {/* 五连击鼓励动画 */}
      {showStreakAnimation && (
        <View style={styles.streakAnimationOverlay}>
          <View style={styles.streakAnimationContent}>
            <Text style={styles.streakTitle}>🎉 五连击！</Text>
            <Text style={styles.streakSubtitle}>太棒了！继续加油！</Text>
            <TouchableOpacity
              style={styles.streakContinueButton}
              onPress={continueFromStreak}
              activeOpacity={0.8}
            >
              <Text style={styles.streakContinueButtonText}>继续学习</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* 复习模式指示器 */}
      <ReviewModeSelector 
        mode={reviewMode}
        onModeChange={(mode) => {
          setReviewMode(mode);
          // 切换复习模式后允许显示一次艾宾浩斯提示
          setShowEbbinghausTip(true);
          setShowToast(false);
          setTimeout(() => loadReviewWords(), 100);
        }}
        type={type}
        isEbbinghaus={isEbbinghaus}
      />
      
      {/* 错词挑战提示 */}
      {type === 'wrong_words' && (
        <View style={{
          padding: 16, 
          backgroundColor: colors.error[50], 
          borderRadius: 12, 
          marginHorizontal: 16, 
          marginBottom: 8,
          shadowColor: colors.error[200],
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2
        }}>
          <Text style={{color: colors.error[700], fontWeight: '600', fontSize: 15}}>
            {t('wrong_words_challenge_title', appLanguage)}
          </Text>
        </View>
      )}
      
      {/* 剧单/单词本复习提示 */}
      {(type === 'show' || type === 'wordbook') && (
        <View style={{
          padding: 16, 
          backgroundColor: colors.accent[50], 
          borderRadius: 12, 
          marginHorizontal: 16, 
          marginBottom: 8,
          shadowColor: colors.accent[200],
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2
        }}>
          <Text style={{color: colors.accent[700], fontWeight: '600', fontSize: 15}}>
            {t(type === 'show' ? 'series_review_title' : 'wordbook_review_title', appLanguage)}
          </Text>
        </View>
      )}
      
      <ReviewProgressBar 
        progress={currentProgress}
        total={words.length}
        current={swiperIndex === 0 ? 0 : swiperIndex}  // 修复：第一张显示0，其他显示已完成的卡片数
        progressAnimation={progressAnimation}
      />
      
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 2 }}>
        <Swiper
          ref={swiperRef}
          cards={words}
          renderCard={renderCard}
          cardIndex={swiperIndex}
          backgroundColor="transparent"
          stackSize={3}
          stackSeparation={18}
          stackScale={8}
          showSecondCard
          animateCardOpacity
          verticalSwipe={false}
          disableTopSwipe
          disableBottomSwipe
          onSwipedLeft={async (cardIndex) => {
            const word = words[cardIndex]?.word;
            if (word) {
              setPendingOperations(prev => prev + 1);
              try {
                await handleSwipeLeft(word);
                // 错误答案，重置连击
                handleWrongAnswer();
              } finally {
                setPendingOperations(prev => Math.max(0, prev - 1));
              }
            }
          }}
          onSwipedRight={async (cardIndex) => {
            const word = words[cardIndex]?.word;
            if (word) {
              setPendingOperations(prev => prev + 1);
              try {
                await handleSwipeRight(word);
                // 正确答案，检查五连击
                handleCorrectAnswer();
              } finally {
                setPendingOperations(prev => Math.max(0, prev - 1));
              }
            }
          }}
          onSwipedAll={() => {
            console.log('🎯 Swiper onSwipedAll 触发 - 所有卡片已划完');
            console.log('🔍 检查待处理操作数量 - pendingOperations:', pendingOperations);
            
            // 移除立即设置进度条为100%的代码，让moveToNextWord中的延迟逻辑能够正确执行
            // progressAnimation.setValue(100); // 删除这行
            
            // 由于 Swiper 组件的限制，onSwipedAll 可能在 onSwipedRight 之前触发
            // 我们改为在 handleSwipeRight 中处理完成逻辑，这里只做备用处理
            if (pendingOperations === 0 && !isReviewComplete) {
              console.log('✅ 无待处理操作，立即触发完成页面（备用）');
              handleSwipedAll();
            } else {
              console.log('⏳ 有待处理操作，等待 handleSwipeRight 中的完成逻辑');
            }
          }}
          cardVerticalMargin={8}
          cardHorizontalMargin={0}
          containerStyle={{ flex: 1, width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
  },
  modeText: {
    fontSize: 12,
    color: colors.primary[500],
    marginLeft: 4,
    fontWeight: '500',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  showText: {
    fontSize: 12,
    color: colors.primary[500],
    fontWeight: '500',
  },
  reviewInfo: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  reviewText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  hintContainer: {
    padding: 16,
    backgroundColor: colors.background.secondary,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  hintText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completeHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statsList: {
    width: '100%',
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  accuracySection: {
    alignItems: 'center',
    marginTop: 20,
  },
  accuracyLabel: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 16,
    fontWeight: '600',
  },
  accuracyGauge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  accuracyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  accuracyPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    zIndex: 2,
  },
  accuracyRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: colors.background.tertiary,
  },
  accuracyProgress: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: colors.primary[500],
    borderRightColor: colors.primary[500],
  },
  accuracyBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  accuracyFill: {
    height: '100%',
    borderRadius: 4,
  },
  accuracyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  actionSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  suggestionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  backButtonText: {
    color: colors.primary[500],
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    marginRight: 16,
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.text.tertiary,
  },
  secondaryButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[500],
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    marginRight: 16,
    shadowColor: colors.success[200],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  // 五连击动画样式
  streakAnimationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  streakAnimationContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    maxWidth: 300,
  },
  streakTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary[500],
    marginBottom: 12,
    textAlign: 'center',
  },
  streakSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  streakContinueButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  streakContinueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReviewScreen; 