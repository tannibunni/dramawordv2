import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import WordCard, { WordData } from '../../components/cards/WordCard';
import { audioService } from '../../services/audioService';
import { learningDataService } from '../../services/learningDataService';
import { wrongWordsManager } from '../../services/wrongWordsManager';
import { LearningRecord, updateWordReview, Word } from '../../services/learningAlgorithm';
import { SwipeableWordCard } from '../../components/cards';
import { UserService } from '../../services/userService';
import { useVocabulary } from '../../context/VocabularyContext';
import { useNavigation } from '../../components/navigation/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';
import { wordService } from '../../services/wordService';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t, TranslationKey } from '../../constants/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/config';
import Toast from '../../components/common/Toast';
import { reviewLogger, wrongWordLogger, apiLogger } from '../../utils/logger';
import optimizedDataSyncService from '../../services/optimizedDataSyncService';

// 复习完成统计接口
interface ReviewStats {
  totalWords: number;
  rememberedWords: number;
  forgottenWords: number;
  experience: number;
  accuracy: number;
}

// 复习完成页面组件
const ReviewCompleteScreen: React.FC<{
  stats: ReviewStats;
  actions: { word: string; remembered: boolean; translation?: string }[];
  onBack: () => void;
}> = ({ stats, actions, onBack }) => {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'flex-start', backgroundColor: colors.background.primary }}>
      {/* 记住统计 */}
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text.primary, marginBottom: 8 }}>你记住：</Text>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.success[500] }}>{stats.rememberedWords} / {stats.totalWords}</Text>
      </View>
      {/* 成功率 */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Text style={{ fontSize: 18, color: colors.text.primary, marginBottom: 4 }}>成功率</Text>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.primary[500] }}>{stats.accuracy}%</Text>
      </View>
      {/* 单词列表 */}
      <View style={{ flex: 1, marginBottom: 24 }}>
        <ScrollView style={{ maxHeight: 1000 }}>
          {actions.map((item, idx) => (
            <View key={item.word + idx} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, color: colors.text.primary, marginRight: 8 }}>{item.word}</Text>
                {item.translation && (
                  <Text 
                    style={{ fontSize: 16, color: colors.text.secondary, flex: 1 }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    - {item.translation.length > 20 ? item.translation.substring(0, 20) + '...' : item.translation}
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {item.remembered ? (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color={colors.success[500]} />
                    <Text style={{ fontSize: 14, color: colors.success[500], fontWeight: 'bold', marginLeft: 4 }}>+2XP</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="close-circle" size={24} color={colors.error[500]} />
                    <Text style={{ fontSize: 14, color: colors.error[500], fontWeight: 'bold', marginLeft: 4 }}>+1XP</Text>
                  </>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
      {/* 总经验值 */}
      <View style={{ alignItems: 'center', marginBottom: 16, paddingVertical: 12, backgroundColor: colors.background.secondary, borderRadius: 12 }}>
        <Text style={{ fontSize: 16, color: colors.text.secondary, marginBottom: 4 }}>本次复习获得</Text>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.primary[500] }}>+{stats.experience} XP</Text>
      </View>
      {/* 按钮组 */}
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary[500],
            paddingHorizontal: 48,
            paddingVertical: 16,
            borderRadius: 25,
            shadowColor: colors.primary[200],
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
          onPress={onBack}
        >
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>完成</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
// import { useRoute } from '@react-navigation/native';

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
  // 所有 hooks 必须在顶层声明
  const [words, setWords] = useState<ReviewWord[]>([]);
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isReviewComplete, setIsReviewComplete] = useState(false);
  const [cardMode, setCardMode] = useState<'swipe' | 'flip'>('swipe');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [reviewStats, setReviewStats] = useState({
    totalWords: 0,
    rememberedWords: 0,
    forgottenWords: 0,
    experience: 0,
    accuracy: 0,
  });
  const [finalStats, setFinalStats] = useState<ReviewStats | null>(null);
  const [reviewActions, setReviewActions] = useState<{ word: string; remembered: boolean }[]>([]);
  const { vocabulary, updateWord } = useVocabulary();
  const { navigate } = useNavigation();
  const { appLanguage } = useAppLanguage();
  const { user } = useAuth();
  const swiperRef = useRef<any>(null);
  
  // 优化的后端用户词汇表进度更新函数
  const updateBackendWordProgress = async (word: string, isCorrect: boolean) => {
    try {
      const userId = user?.id;
      if (!userId) {
        apiLogger.warn('用户未登录，跳过后端更新');
        return;
      }
      
      // 获取当前单词的学习记录
      const records = await learningDataService.getLearningRecords();
      const record = records.find(r => r.word === word);
      
      // 构建进度数据 - 基于当前操作更新，而不是依赖可能过时的本地记录
      const currentReviewCount = (record?.reviewCount || 0) + 1;
      const currentCorrectCount = (record?.correctCount || 0) + (isCorrect ? 1 : 0);
      const currentIncorrectCount = (record?.incorrectCount || 0) + (isCorrect ? 0 : 1);
      
      // 更新连续计数
      let currentConsecutiveCorrect = 0;
      let currentConsecutiveIncorrect = 0;
      
      if (isCorrect) {
        currentConsecutiveCorrect = (record?.consecutiveCorrect || 0) + 1;
        currentConsecutiveIncorrect = 0; // 重置连续错误计数
      } else {
        currentConsecutiveIncorrect = (record?.consecutiveIncorrect || 0) + 1;
        currentConsecutiveCorrect = 0; // 重置连续正确计数
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
        interval: (record?.intervalDays || 1) * 24, // 转换为小时
        easeFactor: 2.5, // 默认值
        totalStudyTime: record?.timeSpent || 0,
        averageResponseTime: 0, // 暂时设为0
        confidence: record?.confidenceLevel || 1,
      };
      
      apiLogger.debug('发送进度更新请求', { 
        userId, 
        word, 
        isCorrect, 
        progress,
        debug: {
          originalRecord: record,
          currentReviewCount,
          currentCorrectCount,
          currentIncorrectCount,
          currentConsecutiveCorrect,
          currentConsecutiveIncorrect
        }
      });
      
      // 调用经验值API
      try {
        const token = await AsyncStorage.getItem('userData');
        if (token) {
          const userData = JSON.parse(token);
          const response = await fetch(`${API_BASE_URL}/words/user/progress`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userData.token}`,
            },
            body: JSON.stringify({
              userId: userId,
              word: word,
              isSuccessfulReview: isCorrect,
              progress: progress
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.data?.experience) {
              apiLogger.info('经验值更新成功', {
                word,
                isCorrect,
                xpGained: result.data.experience.xpGained,
                newLevel: result.data.experience.newLevel,
                leveledUp: result.data.experience.leveledUp
              });
            }
          } else {
            apiLogger.warn('经验值API调用失败', { status: response.status });
          }
        }
      } catch (xpError) {
        apiLogger.error('调用经验值API失败', xpError);
        // 不中断流程，继续执行
      }
      
      // 使用优化的同步服务 - 批量同步学习记录
      await optimizedDataSyncService.syncBatchData({
        type: 'learning_record',
        userId,
        data: [{
          word,
          progress,
          isSuccessfulReview: isCorrect,
          timestamp: Date.now()
        }]
      });
      
      apiLogger.info('学习记录已加入同步队列');
    } catch (error) {
      apiLogger.error('更新后端用户词汇表失败', error);
    }
  };
  const [swiperIndex, setSwiperIndex] = useState(0);
  const rememberedRef = useRef(0);
  const forgottenRef = useRef(0);
  
  // 进度条动画相关
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const [currentProgress, setCurrentProgress] = useState(0);
  
  // 监控 swiperIndex 变化
  useEffect(() => {
    if (words.length === 0) return;
    
    // 修复进度计算逻辑：
    // 开始状态：进度条为0%（swiperIndex=0时）
    // 滑完第一张卡：进度条为50%（swiperIndex=1时，2张卡的情况下）
    // 滑完第二张卡：进度条为100%（swiperIndex=2时，2张卡的情况下）
    const newProgress = words.length > 0 ? Math.min(100, Math.max(0, (swiperIndex / words.length) * 100)) : 0;
    
    console.log(`📊 进度条更新: swiperIndex=${swiperIndex}, words.length=${words.length}, progress=${newProgress.toFixed(2)}%`);
    console.log(`🎯 进度条状态: currentProgress=${currentProgress.toFixed(2)}%, newProgress=${newProgress.toFixed(2)}%`);
    
    // 防止重复动画：如果新进度与当前进度相同，跳过动画
    if (Math.abs(newProgress - currentProgress) < 0.1) {
      console.log(`⏭️ 进度条无变化，跳过动画: ${newProgress.toFixed(2)}%`);
      return;
    }
    
    // 停止之前的动画
    progressAnimation.stopAnimation();
    
    // 使用更快的动画速度
    Animated.timing(progressAnimation, {
      toValue: newProgress,
      duration: 200, // 减少动画时长，让动画更快
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        console.log(`✅ 进度条动画完成: ${newProgress.toFixed(2)}%`);
      } else {
        console.log(`⚠️ 进度条动画被中断: ${newProgress.toFixed(2)}%`);
      }
    });
    
    setCurrentProgress(newProgress);
  }, [swiperIndex]); // 只依赖swiperIndex，不依赖words.length
  
  // 监控 words 数组变化，初始化统计数据
  useEffect(() => {
    console.log('📚 words 数组变化 - length:', words.length);
    if (words.length > 0) {
      console.log('📚 第一个单词:', words[0]);
      
      // 检查是否是新的复习会话（swiperIndex为0且没有进行中的复习）
      const isNewSession = swiperIndex === 0 && !isReviewComplete;
      
      if (isNewSession) {
        // 初始化统计数据
        const initialStats = {
          totalWords: words.length,
          rememberedWords: 0,
          forgottenWords: 0,
          experience: 0,
          accuracy: 0,
        };
        console.log('📊 初始化统计数据:', initialStats);
        setReviewStats(initialStats);
        // 重置计数器
        rememberedRef.current = 0;
        forgottenRef.current = 0;
        console.log('🔄 计数器已重置 - rememberedRef: 0, forgottenRef: 0');
        
        // 重置进度条动画
        progressAnimation.setValue(0);
        setCurrentProgress(0);
        console.log('🔄 进度条已重置到0%');
      } else {
        console.log('📚 不是新会话，保持当前进度条状态');
      }
    } else {
      console.log('⚠️ words 数组为空');
    }
  }, [words, swiperIndex, isReviewComplete]);
  
  // 监控复习统计变化
  useEffect(() => {
    console.log('📈 reviewStats 变化:', reviewStats);
    console.log('📊 统计详情:', {
      totalWords: reviewStats.totalWords,
      rememberedWords: reviewStats.rememberedWords,
      forgottenWords: reviewStats.forgottenWords,
      experience: reviewStats.experience,
      accuracy: reviewStats.accuracy
    });
  }, [reviewStats]);



  // 获取筛选参数
  // const { type, id } = (route.params || {}) as { type?: string; id?: number };

  const MIN_REVIEW_BATCH = 10;
  const [isEbbinghaus, setIsEbbinghaus] = useState(false);
  const [reviewMode, setReviewMode] = useState<'smart' | 'all'>('smart'); // 智能模式 vs 全部模式
  const [showEbbinghausTip, setShowEbbinghausTip] = useState(true);
  const [showToast, setShowToast] = useState(false);

  // 监控艾宾浩斯记忆法状态变化，显示Toast提示
  useEffect(() => {
    if (isEbbinghaus && reviewMode === 'smart' && (!type || type === 'shuffle' || type === 'random') && showEbbinghausTip) {
      setShowToast(true);
      setShowEbbinghausTip(false); // 显示Toast后不再显示横幅
    }
  }, [isEbbinghaus, reviewMode, type, showEbbinghausTip]);

  const getReviewBatch = async (words: any[], filterFn: (w: any) => boolean) => {
    const all = words.filter(filterFn);
    
    console.log(`🔍 getReviewBatch: 过滤后单词数量: ${all.length}, 类型: ${type}, 模式: ${reviewMode}`);
    
    // 去重：基于单词名称去重，保留第一个出现的
    const uniqueWords = all.reduce((acc: any[], word: any) => {
      const exists = acc.find(w => w.word === word.word);
      if (!exists) {
        acc.push(word);
      }
      return acc;
    }, []);
    
    console.log(`🔍 getReviewBatch: 去重后单词数量: ${uniqueWords.length}`);
    
    // 判断是否为挑战词卡（随机复习或错词挑战）
    const isChallengeMode = !type || (type === 'shuffle' || type === 'random' || type === 'wrong_words');
    
    if (isChallengeMode) {
      // 错词挑战：专门显示用户之前不记得的单词
      if (type === 'wrong_words') {
        console.log('🔍 ReviewScreen: 进入错词挑战模式');
        setIsEbbinghaus(false);
        
        // 使用错词管理器获取错词列表
        const wrongWordsList = wrongWordsManager.getWrongWords();
        console.log('🔍 错词管理器返回错词列表:', wrongWordsList);
        console.log('📊 错词管理器统计信息:', wrongWordsManager.getStatistics());
        console.log('🔍 错词管理器总数:', wrongWordsManager.getWrongWordsCount());
        
        if (wrongWordsList.length > 0) {
          // 从 vocabulary 中获取错词的完整信息
          const wrongWordsWithDetails = wrongWordsList
            .map(wordStr => vocabulary.find(w => w.word === wordStr))
            .filter(Boolean); // 过滤掉未找到的单词
          
          console.log(`🔍 错词卡筛选结果: ${wrongWordsWithDetails.length} 个错词`);
          console.log('🔍 错词详情:', wrongWordsWithDetails.map(w => ({
            word: w.word,
            incorrectCount: w.incorrectCount,
            consecutiveIncorrect: w.consecutiveIncorrect,
            consecutiveCorrect: w.consecutiveCorrect
          })));
          
          wrongWordLogger.info(`从错词管理器获取到 ${wrongWordsWithDetails.length} 个错词`);
          return wrongWordsWithDetails.slice(0, MIN_REVIEW_BATCH);
        } else {
          console.log('🔍 错词管理器中没有错词，返回空数组');
          wrongWordLogger.info('错词管理器中没有错词，返回空数组');
          return [];
        }
      }
      
      // 其他挑战词卡：使用艾宾斯记忆法
      if (reviewMode === 'all') {
        // 全部模式：显示所有单词，不限制时间
        setIsEbbinghaus(false);
        console.log(`🔍 全部模式: 返回 ${uniqueWords.length} 个单词`);
        return uniqueWords; // 不限制数量，返回所有可用单词
      }
      
      // 智能模式：优先显示需要复习的单词（艾宾斯记忆法推荐）
      const dueWords = uniqueWords.filter((w: any) => {
        // 检查是否有 nextReviewAt 字段，如果没有则使用 nextReviewDate
        const nextReview = w.nextReviewAt || w.nextReviewDate;
        return nextReview ? dayjs(nextReview).isBefore(dayjs()) : true;
      });
      
      console.log(`🔍 智能模式: 到期单词 ${dueWords.length} 个, 总单词 ${uniqueWords.length} 个`);
      
      // 如果到期的单词足够多，优先显示这些
      if (dueWords.length >= MIN_REVIEW_BATCH) {
        setIsEbbinghaus(true);
        return dueWords.slice(0, MIN_REVIEW_BATCH);
      }
      
      // 如果到期的单词不够，补充其他单词（排除已经在dueWords中的单词）
      const otherWords = uniqueWords.filter((w: any) => {
        const nextReview = w.nextReviewAt || w.nextReviewDate;
        const isNotDue = nextReview ? dayjs(nextReview).isAfter(dayjs()) : true;
        const isNotInDueWords = !dueWords.some(dueWord => dueWord.word === w.word);
        return isNotDue && isNotInDueWords;
      });
      
      // 混合显示：优先显示到期的单词，然后补充其他单词
      const mixedWords = [...dueWords, ...otherWords];
      setIsEbbinghaus(dueWords.length > 0);
      
      console.log(`🔍 智能模式: 到期单词 ${dueWords.length} 个, 其他单词 ${otherWords.length} 个, 混合单词 ${mixedWords.length} 个`);
      return mixedWords; // 不限制数量，返回所有可用单词
    } else {
      // 剧单/单词本：显示所有单词，不使用艾宾斯记忆法
      setIsEbbinghaus(false);
      console.log(`🔍 剧单/单词本模式: 返回 ${uniqueWords.length} 个单词`);
      return uniqueWords; // 不限制数量，返回所有可用单词
    }
  };

  // 合并 loadReviewWords 实现
  const loadReviewWords = async () => {
    let filterFn: (w: any) => boolean = () => true;
    if (type === 'show' && id !== undefined) {
      filterFn = (w: any) => {
        const match = w.sourceShow?.type === type && String(w.sourceShow?.id) === String(id);
        console.log(
          '[filterFn]',
          'w.word:', w.word,
          'w.sourceShow?.type:', w.sourceShow?.type,
          'w.sourceShow?.id:', w.sourceShow?.id,
          'type:', type,
          'id:', id,
          'match:', match
        );
        return match;
      };
    } else if (type === 'wordbook' && id !== undefined) {
      filterFn = (w: any) => {
        const match = w.sourceShow?.type === type && String(w.sourceShow?.id) === String(id);
        console.log(
          '[filterFn]',
          'w.word:', w.word,
          'w.sourceShow?.type:', w.sourceShow?.type,
          'w.sourceShow?.id:', w.sourceShow?.id,
          'type:', type,
          'id:', id,
          'match:', match
        );
        return match;
      };
    }
    console.log('vocabulary:', vocabulary);
    console.log('vocabulary details:', vocabulary.map(w => ({
      word: w.word,
      sourceShow: w.sourceShow,
      type: type,
      targetId: id
    })));
    
    // 检查vocabulary中是否有重复单词
    const wordCounts = vocabulary.reduce((acc: any, word: any) => {
      acc[word.word] = (acc[word.word] || 0) + 1;
      return acc;
    }, {});
    
    const duplicates = Object.entries(wordCounts).filter(([word, count]) => (count as number) > 1);
    if (duplicates.length > 0) {
      console.log('⚠️ 发现重复单词:', duplicates);
    }
    const batch = await getReviewBatch(vocabulary, filterFn);
    console.log('review batch:', batch);
    setWords(batch);
    setTimeout(() => {
      console.log('words state:', batch);
    }, 100);
  };

  // 初始化错词管理器
  useEffect(() => {
    if (vocabulary && vocabulary.length > 0) {
      console.log('🔧 ReviewScreen: 初始化错词管理器');
      wrongWordsManager.initialize(vocabulary);
    }
  }, [vocabulary]);

  useEffect(() => {
    console.log('ReviewScreen: useEffect triggered - vocabulary length:', vocabulary.length, 'type:', type, 'id:', id);
    loadReviewWords().catch(error => {
      console.error('加载复习单词失败:', error);
    });
  }, [vocabulary, type, id]);

  // 当 words 数组加载完成后，确保 swiperIndex 正确初始化
  useEffect(() => {
    if (words.length > 0) {
      console.log('ReviewScreen: Words loaded, checking if this is a new session');
      
      // 检查是否是新的复习会话（swiperIndex为0且没有进行中的复习）
      const isNewSession = swiperIndex === 0 && !isReviewComplete;
      
      if (isNewSession) {
        console.log('ReviewScreen: 这是新的复习会话，初始化swiperIndex为0');
        setSwiperIndex(0);
        
        // 延迟一点时间，确保 Swiper 组件完全初始化
        setTimeout(() => {
          console.log('ReviewScreen: Swiper should be initialized now');
        }, 100);
      } else {
        console.log('ReviewScreen: 这是进行中的复习会话，保持当前swiperIndex:', swiperIndex);
      }
    } else {
      console.log('ReviewScreen: Words array is empty, resetting swiperIndex to 0');
      setSwiperIndex(0);
    }
  }, [words, swiperIndex, isReviewComplete]);

  const [wordDataCache, setWordDataCache] = useState<{ [key: string]: WordData }>({});
  const [isWordDataLoading, setIsWordDataLoading] = useState(true);

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
      return <View style={{ height: 300, justifyContent: 'center', alignItems: 'center' }}><Text>加载中...</Text></View>;
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return colors.success[500];
      case 'medium': return colors.accent[500];
      case 'hard': return colors.error[500];
      default: return colors.text.secondary;
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '未知';
    }
  };

  // 统一封装添加 action 的逻辑，避免遗漏
  const addReviewAction = (word: string, remembered: boolean, translation?: string) => {
    setReviewActions(prev => ([...prev, { word, remembered, translation }]));
  };

  // 将 ReviewWord 转换为 Word 类型的适配器函数
  const convertReviewWordToWord = (reviewWord: ReviewWord): Word => {
    return {
      id: reviewWord.id,
      word: reviewWord.word,
      definitions: [reviewWord.translation], // 使用 translation 作为定义
      phonetic: reviewWord.phonetic,
      sourceShow: reviewWord.show ? { type: 'show' as const, id: reviewWord.show } : undefined,
      collectedAt: reviewWord.lastReviewed,
      reviewStage: reviewWord.reviewCount,
      nextReviewAt: reviewWord.lastReviewed, // 使用 lastReviewed 作为 nextReviewAt
      reviewHistory: [], // 空的历史记录
    };
  };

  // 处理滑动操作
  const handleSwipeLeft = async (word: string) => {
    console.log(`🔄 handleSwipeLeft 开始处理: ${word}, swiperIndex: ${swiperIndex}`);
    
    // 1. 先用 updateWordReview 处理业务逻辑
    const wordObj = convertReviewWordToWord(words[swiperIndex]);
    const updatedWord = updateWordReview(wordObj, false);
    console.log(`📝 updateWordReview 完成: ${word}, 更新结果:`, updatedWord);
    
    try {
      // 2. 更新本地学习记录
      console.log(`💾 开始更新本地学习记录: ${word}`);
      await learningDataService.updateLearningRecord(
        updatedWord.word,
        word,
        false // 不正确
      );
      console.log(`✅ 本地学习记录更新成功: ${word}`);
      
      // 3. 直接更新 vocabulary context，确保错词卡能立即看到更新
      const currentWord = words[swiperIndex];
      if (currentWord) {
        const updatedWordData = {
          incorrectCount: (currentWord.incorrectCount || 0) + 1,
          consecutiveIncorrect: (currentWord.consecutiveIncorrect || 0) + 1,
          consecutiveCorrect: 0 // 答错时重置连续正确次数
        };
        
        updateWord(word, updatedWordData);
        console.log('✅ 已更新 vocabulary context，错词数据已同步');
        
        // 4. 实时添加到错词集合管理器
        const wordDataForWrongWords = {
          ...currentWord,
          ...updatedWordData
        };
        
        const added = wrongWordsManager.addWrongWord(word, wordDataForWrongWords);
        if (added) {
          console.log('✅ 错词已实时添加到错词集合:', word);
          console.log('📊 当前错词总数:', wrongWordsManager.getWrongWordsCount());
        } else {
          console.log('ℹ️ 错词已存在于错词集合中:', word);
        }
      }
      
      // 5. 立即更新后端用户词汇表
      console.log(`🌐 开始更新后端用户词汇表: ${word}, isCorrect: false`);
      await updateBackendWordProgress(word, false);
      console.log(`✅ 后端用户词汇表更新成功: ${word}`);
    } catch (error) {
      console.error('❌ 更新学习记录失败:', error);
    }
    
    console.log(`📊 更新统计 - 忘记单词: ${word}`);
    forgottenRef.current += 1;
    console.log(`📊 当前统计 - rememberedRef: ${rememberedRef.current}, forgottenRef: ${forgottenRef.current}`);
    
    setReviewStats(prev => {
      const remembered = prev.rememberedWords;
      const forgotten = prev.forgottenWords + 1;
      const total = prev.totalWords;
      const experience = (remembered * 2) + (forgotten * 1);
      const accuracy = total > 0 ? Math.round((remembered / total) * 100) : 0;
      
      const newStats = {
        ...prev,
        forgottenWords: forgotten,
        experience,
        accuracy,
      };
      
      console.log(`📈 统计更新完成:`, {
        remembered,
        forgotten,
        total,
        experience,
        accuracy,
        newStats
      });
      
      return newStats;
    });
    // 获取当前单词的释义
    const currentWord = words[swiperIndex];
    const translation = currentWord?.translation || '';
    addReviewAction(word, false, translation);
    updateSession('incorrect');
    moveToNextWord();
  };

  const handleSwipeRight = async (word: string) => {
    console.log(`🔄 handleSwipeRight 开始处理: ${word}, swiperIndex: ${swiperIndex}`);
    
    // 1. 先用 updateWordReview 处理业务逻辑
    const wordObj = convertReviewWordToWord(words[swiperIndex]);
    const updatedWord = updateWordReview(wordObj, true);
    console.log(`📝 updateWordReview 完成: ${word}, 更新结果:`, updatedWord);
    
    try {
      // 2. 更新本地学习记录
      console.log(`💾 开始更新本地学习记录: ${word}`);
      await learningDataService.updateLearningRecord(
        updatedWord.word,
        word,
        true // 正确
      );
      console.log(`✅ 本地学习记录更新成功: ${word}`);
      
      // 3. 直接更新 vocabulary context，确保错词卡能立即看到更新
      const currentWord = words[swiperIndex];
      if (currentWord) {
        const updatedWordData = {
          incorrectCount: currentWord.incorrectCount || 0,
          consecutiveIncorrect: 0, // 答对时重置连续错误次数
          consecutiveCorrect: (currentWord.consecutiveCorrect || 0) + 1
        };
        
        updateWord(word, updatedWordData);
        console.log('✅ 已更新 vocabulary context，正确答题数据已同步');
        
        // 4. 更新错词集合管理器
        const wordDataForWrongWords = {
          ...currentWord,
          ...updatedWordData
        };
        
        console.log('🔧 ReviewScreen: 更新错词集合中的单词:', word, wordDataForWrongWords);
        wrongWordsManager.updateWrongWord(word, true, wordDataForWrongWords);
        console.log('🔄 已更新错词集合中的单词状态:', word);
        
        // 检查是否需要从错词集合移除（连续答对3次）
        const wordInfo = wrongWordsManager.getWrongWordInfo(word);
        console.log('🔧 ReviewScreen: 错词信息检查:', word, wordInfo);
        if (wordInfo && wordInfo.consecutiveCorrect >= 3) {
          console.log('🎉 单词连续答对3次，从错词集合移除:', word);
        }
      }
      
      // 5. 立即更新后端用户词汇表
      console.log(`🌐 开始更新后端用户词汇表: ${word}, isCorrect: true`);
      await updateBackendWordProgress(word, true);
      console.log(`✅ 后端用户词汇表更新成功: ${word}`);
    } catch (error) {
      console.error('❌ 更新学习记录失败:', error);
    }
    
    console.log(`📊 更新统计 - 记住单词: ${word}`);
    rememberedRef.current += 1;
    console.log(`📊 当前统计 - rememberedRef: ${rememberedRef.current}, forgottenRef: ${forgottenRef.current}`);
    
    setReviewStats(prev => {
      const remembered = prev.rememberedWords + 1;
      const forgotten = prev.forgottenWords;
      const total = prev.totalWords;
      const experience = (remembered * 2) + (forgotten * 1);
      const accuracy = total > 0 ? Math.round((remembered / total) * 100) : 0;
      
      const newStats = {
        ...prev,
        rememberedWords: remembered,
        experience,
        accuracy,
      };
      
      console.log(`📈 统计更新完成:`, {
        remembered,
        forgotten,
        total,
        experience,
        accuracy,
        newStats
      });
      
      return newStats;
    });
    // 获取当前单词的释义
    const currentWord = words[swiperIndex];
    const translation = currentWord?.translation || '';
    addReviewAction(word, true, translation);
    updateSession('correct');
    moveToNextWord();
  };

  const handleSwipeUp = (word: string) => {
    // 展开详情 - 不更新会话统计，因为卡片不会被移除
    // 展开逻辑由 SwipeableWordCard 内部处理
  };

  const handleSwipeDown = async (word: string) => {
    // 跳过 - 标记为不正确
    try {
      // 更新学习记录
      await learningDataService.updateLearningRecord(
        words[swiperIndex].word,
        word,
        false // 跳过视为不正确
      );
      
      // 更新后端用户词汇表
      await updateBackendWordProgress(word, false);
    } catch (error) {
      console.error('更新学习记录失败:', error);
    }
    
    updateSession('skipped');
    moveToNextWord();
  };

  // 更新会话统计
  const updateSession = (action: 'correct' | 'incorrect' | 'skipped' | 'collected') => {
    if (session) {
      setSession(prev => prev ? {
        ...prev,
        correctCount: prev.correctCount + (action === 'correct' ? 1 : 0),
        incorrectCount: prev.incorrectCount + (action === 'incorrect' ? 1 : 0),
        skippedCount: prev.skippedCount + (action === 'skipped' ? 1 : 0),
        collectedCount: prev.collectedCount + (action === 'collected' ? 1 : 0),
      } : null);
    }
  };

  // 移动到下一个单词
  const moveToNextWord = () => {
    console.log('🔄 moveToNextWord 开始 - current swiperIndex:', swiperIndex, 'words.length:', words.length);
    if (swiperIndex < words.length) {
      const newIndex = swiperIndex + 1;
      console.log('📱 移动到下一个单词 - new index:', newIndex);
      setSwiperIndex(newIndex);
      setShowAnswer(false);
      
      // 如果是最后一张卡，延迟显示完成页面
      if (newIndex === words.length) {
        console.log('🎯 最后一张卡完成，准备显示完成页面');
        // 延迟显示完成页面，确保进度条动画完成
        setTimeout(() => {
          console.log('🏁 复习完成，计算最终统计数据');
          // 复习完成 - 计算最终统计数据
          if (!isReviewComplete) {
            const rememberedWords = rememberedRef.current;
            const forgottenWords = forgottenRef.current;
            const currentStats = reviewStats;
            const experience = (rememberedWords * 2) + (forgottenWords * 1);
            const accuracy = currentStats.totalWords > 0 ? Math.round((rememberedWords / currentStats.totalWords) * 100) : 0;
            const finalStats = {
              totalWords: currentStats.totalWords,
              rememberedWords,
              forgottenWords,
              experience,
              accuracy,
            };
            console.log('📊 最终统计数据:', finalStats);
            console.log('📊 统计详情:', {
              rememberedWords,
              forgottenWords,
              totalWords: currentStats.totalWords,
              experience,
              accuracy
            });
            setReviewStats(finalStats);
            setFinalStats(finalStats);
            setIsReviewComplete(true);
            console.log('✅ 复习完成状态已设置');
          } else {
            console.log('⚠️ 复习已完成，跳过重复计算');
          }
        }, 1200); // 增加延迟时间，确保100%动画完全加载完毕
      } else {
        console.log('📱 继续下一张卡');
      }
    } else {
      console.log('⚠️ swiperIndex 超出范围，无法移动到下一个单词');
    }
  };

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
        Alert.alert('播放失败', '音频播放功能暂时不可用，请稍后再试');
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



  // 移除重复的Swiper事件处理函数，统一使用handleSwipeLeft/Right

  // 进度条渲染
  const renderProgressBar = () => {
    // 修复进度文本显示逻辑：
    // 开始显示 0/3，滑完第一张卡显示 1/3，滑完第二张卡显示 2/3，滑完最后一张卡显示 3/3
    // 显示当前正在查看的卡片索引（从0开始）
    const progressText = words.length > 0 ? `${Math.min(swiperIndex, words.length)} / ${words.length}` : '';
    return (
      <View style={{ 
        width: '100%', 
        paddingHorizontal: 16, 
        paddingVertical: 4,
        backgroundColor: colors.background.primary
      }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          width: '100%'
        }}>
          <TouchableOpacity 
            style={{ 
              padding: 8, 
              marginRight: 16,
              borderRadius: 8,
              backgroundColor: colors.background.secondary
            }}
            onPress={() => navigate('main', { tab: 'review' })}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={{ 
            flex: 1, 
            height: 6, 
            backgroundColor: colors.background.tertiary, 
            borderRadius: 3, 
            marginRight: 12 
          }}>
            <Animated.View style={{
              height: 6,
              backgroundColor: colors.primary[500],
              borderRadius: 3,
              width: progressAnimation.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            }} />
          </View>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '600', 
            color: colors.text.primary,
            minWidth: 40,
            textAlign: 'center'
          }}>
            {progressText}
          </Text>
        </View>
      </View>
    );
  };



  // 移除 overlayLabels，因为手势现在由 SwipeableWordCard 处理

  // 移除 panResponder，因为手势现在由 SwipeableWordCard 处理

  if (!words || words.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background.primary }}>
        <View style={{ alignItems: 'center', padding: 20 }}>
          <Ionicons name="book-outline" size={80} color={colors.text.tertiary} style={{ marginBottom: 24 }} />
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text.primary, marginBottom: 12, textAlign: 'center' }}>
            {t('no_review_words' as TranslationKey, appLanguage)}
          </Text>
          <Text style={{ fontSize: 16, color: colors.text.secondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
            {appLanguage === 'zh-CN' 
              ? '快去搜索并收藏一些单词吧！\n积累词汇量，提升学习效果。'
              : 'Go search and collect some words!\nBuild your vocabulary and improve learning.'
            }
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary[500],
              paddingHorizontal: 48,
              paddingVertical: 16,
              borderRadius: 25,
              shadowColor: colors.primary[200],
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={() => navigate('main', { tab: 'home' })}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              {appLanguage === 'zh-CN' ? '去搜索单词' : 'Search Words'}
            </Text>
          </TouchableOpacity>
        </View>
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
    
    const rememberedWords = rememberedRef.current;
    const forgottenWords = forgottenRef.current;
    const totalActions = rememberedWords + forgottenWords;
    console.log('ReviewScreen: Data validation - total actions:', totalActions, 'remembered:', rememberedWords, 'forgotten:', forgottenWords);
    
    // 使用当前的 reviewStats，确保 totalWords 正确
    const currentStats = reviewStats;
    const experience = (rememberedWords * 2) + (forgottenWords * 1);
    const accuracy = currentStats.totalWords > 0 ? Math.round((rememberedWords / currentStats.totalWords) * 100) : 0;
    const finalStats = {
      totalWords: currentStats.totalWords,
      rememberedWords,
      forgottenWords,
      experience,
      accuracy,
    };
    console.log('ReviewScreen: Final stats:', finalStats);
    setReviewStats(finalStats);
    setFinalStats(finalStats);
    
    // 延迟显示完成页面，确保进度条动画完成
    setTimeout(() => {
      setIsReviewComplete(true);
    }, 1200); // 增加延迟时间，确保100%动画完全加载完毕
  };

  // ReviewCompleteScreen 传入 actions
  if (isReviewComplete) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <ReviewCompleteScreen 
          stats={finalStats || reviewStats}
          actions={reviewActions}
          onBack={async () => {
            // 增加复习次数统计
            try {
              // 更新本地存储的复习次数
              const currentStats = await AsyncStorage.getItem('userStats');
              if (currentStats) {
                const stats = JSON.parse(currentStats);
                const updatedStats = {
                  ...stats,
                  totalReviews: (stats.totalReviews || 0) + 1
                };
                await AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));
                console.log('✅ 本地复习次数已更新:', updatedStats.totalReviews);
              }
              
              // 同步到后端
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
            
            // 保存经验值增加参数到AsyncStorage
            const params = {
              showExperienceAnimation: true,
              experienceGained: finalStats?.experience || 0
            };
            await AsyncStorage.setItem('navigationParams', JSON.stringify(params));
            
            // 经验值已在复习过程中通过 updateWordProgress 同步到后端
            // 不需要额外调用经验值API，避免重复计算
            console.log('✅ 复习经验值已在复习过程中同步到后端');
            
            // 标记需要刷新vocabulary数据
            await AsyncStorage.setItem('refreshVocabulary', 'true');
            
            // 导航回review intro页面
            navigate('main', { tab: 'review' });
          }}
        />
      </SafeAreaView>
    );
  }

  console.log('ReviewScreen: Rendering Swiper with words length:', words.length, 'swiperIndex:', swiperIndex);
  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      {/* Toast提示 */}
      {showToast && (
        <Toast
          message="☑️ 已切入艾宾浩斯记忆法"
          type="success"
          duration={3000}
          onHide={() => setShowToast(false)}
        />
      )}
      {/* 复习模式指示器 - 只在智能挑战词卡模式下显示 */}
      {(!type || type === 'shuffle' || type === 'random') && type !== 'wrong_words' && (
        <View style={{
          padding: 16, 
          backgroundColor: colors.primary[50], 
          borderRadius: 12, 
          marginHorizontal: 16, 
          marginTop: 8,
          marginBottom: 8,
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          shadowColor: colors.primary[200],
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2
        }}>
          <View style={{flex: 1}}>
            <Text style={{color: colors.primary[700], fontWeight: '600', fontSize: 15}}>
              {reviewMode === 'smart' ? '🧠 智能复习模式' : '📚 全部复习模式'}
            </Text>
            <Text style={{color: colors.primary[600], fontSize: 13, marginTop: 4, lineHeight: 18}}>
              {reviewMode === 'smart' ? '优先显示需要复习的单词' : '显示所有单词，不受时间限制'}
            </Text>
          </View>
          <TouchableOpacity 
            style={{
              backgroundColor: colors.primary[500],
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              shadowColor: colors.primary[300],
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 2
            }}
            onPress={() => {
              setReviewMode(reviewMode === 'smart' ? 'all' : 'smart');
              // 重新显示艾宾斯记忆法提示
              setShowEbbinghausTip(true);
              setShowToast(false); // 重置Toast状态
              // 重新加载复习单词
              setTimeout(() => loadReviewWords(), 100);
            }}
          >
            <Text style={{color: 'white', fontSize: 13, fontWeight: '600'}}>
              {reviewMode === 'smart' ? '切换全部' : '切换智能'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      

      
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
            ⚠️ 错词挑战 - 专注记忆不熟悉的单词
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
            📚 {type === 'show' ? '剧集复习' : '单词本复习'} - 显示所有单词
          </Text>
        </View>
      )}
      {renderProgressBar()}
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
              await handleSwipeLeft(word);
            }
          }}
          onSwipedRight={async (cardIndex) => {
            const word = words[cardIndex]?.word;
            if (word) {
              await handleSwipeRight(word);
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
    paddingHorizontal: 20, // 统一左右边距
    paddingBottom: 80, // 防止被底部导航遮挡
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
});

export default ReviewScreen; 