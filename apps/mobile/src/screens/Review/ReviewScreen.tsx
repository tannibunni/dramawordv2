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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import Swiper from 'react-native-deck-swiper';
import WordCard, { WordData } from '../../components/cards/WordCard';
import { audioService } from '../../services/audioService';
import { learningDataService } from '../../services/learningDataService';
import { LearningRecord, updateWordReview, Word } from '../../services/learningAlgorithm';
import { SwipeableWordCard } from '../../components/cards';
import { UserService } from '../../services/userService';
import { useVocabulary } from '../../context/VocabularyContext';
import { useNavigation } from '../../components/navigation/NavigationContext';
import dayjs from 'dayjs';
import { wordService } from '../../services/wordService';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t, TranslationKey } from '../../constants/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../constants/config';

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
  actions: { word: string; remembered: boolean }[];
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
        <ScrollView style={{ maxHeight: 260 }}>
          {actions.map((item, idx) => (
            <View key={item.word + idx} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.background.tertiary }}>
              <Text style={{ fontSize: 18, color: colors.text.primary, flex: 1 }}>{item.word}</Text>
              {item.remembered ? (
                <Ionicons name="checkmark-circle" size={24} color={colors.success[500]} />
              ) : (
                <Ionicons name="close-circle" size={24} color={colors.error[500]} />
              )}
            </View>
          ))}
        </ScrollView>
      </View>
      {/* 确定按钮 */}
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
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>确定</Text>
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
  const { vocabulary } = useVocabulary();
  const { navigate } = useNavigation();
  const { appLanguage } = useAppLanguage();
  const swiperRef = useRef<any>(null);
  const [swiperIndex, setSwiperIndex] = useState(0);
  const rememberedRef = useRef(0);
  const forgottenRef = useRef(0);
  
  // 进度条动画相关
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const [currentProgress, setCurrentProgress] = useState(0);
  
  // 监控 swiperIndex 变化
  useEffect(() => {
    console.log('ReviewScreen: swiperIndex changed to:', swiperIndex);
    
    // 更新进度条动画
    if (words.length > 0) {
      // 修复进度计算逻辑：
      // 开始状态：进度条为0%（swiperIndex=0时）
      // 滑完第一张卡：进度条为33.33%（swiperIndex=1时，3张卡的情况下）
      // 滑完第二张卡：进度条为66.67%（swiperIndex=2时，3张卡的情况下）
      // 滑完最后一张卡：进度条为100%（swiperIndex=3时，3张卡的情况下）
      const newProgress = (swiperIndex / words.length) * 100;
      console.log('🔄 进度条动画 - 当前进度:', currentProgress, '目标进度:', newProgress, 'swiperIndex:', swiperIndex, 'words.length:', words.length);
      
      // 使用更平滑的动画曲线，增加动画时长
      Animated.timing(progressAnimation, {
        toValue: newProgress,
        duration: 1000, // 增加动画时长，确保动画完全完成
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          console.log('✅ 进度条动画完成 - 最终进度:', newProgress);
        }
      });
      
      setCurrentProgress(newProgress);
    }
  }, [swiperIndex, words.length]);
  
  // 监控 words 数组变化，初始化统计数据
  useEffect(() => {
    console.log('ReviewScreen: words array changed, length:', words.length);
    if (words.length > 0) {
      console.log('ReviewScreen: First word:', words[0]);
      // 初始化统计数据
      setReviewStats({
        totalWords: words.length,
        rememberedWords: 0,
        forgottenWords: 0,
        experience: 0,
        accuracy: 0,
      });
      // 重置计数器
      rememberedRef.current = 0;
      forgottenRef.current = 0;
    }
  }, [words]);
  
  // 监控复习统计变化
  useEffect(() => {
    console.log('ReviewScreen: reviewStats changed:', reviewStats);
  }, [reviewStats]);

  // 获取筛选参数
  // const { type, id } = (route.params || {}) as { type?: string; id?: number };

  const MIN_REVIEW_BATCH = 10;
  const [isEbbinghaus, setIsEbbinghaus] = useState(false);

  const getReviewBatch = (words: any[], filterFn: (w: any) => boolean) => {
    const all = words.filter(filterFn);
    if (all.length <= MIN_REVIEW_BATCH) {
      setIsEbbinghaus(false);
      return all;
    }
    let dueWords = all.filter((w: any) => dayjs(w.nextReviewAt).isBefore(dayjs()));
    if (dueWords.length < MIN_REVIEW_BATCH) {
      const extra = all.filter((w: any) => dayjs(w.nextReviewAt).isAfter(dayjs()));
      dueWords = dueWords.concat(extra.slice(0, MIN_REVIEW_BATCH - dueWords.length));
    }
    setIsEbbinghaus(true);
    return dueWords.slice(0, MIN_REVIEW_BATCH);
  };

  // 合并 loadReviewWords 实现
  const loadReviewWords = () => {
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
    const batch = getReviewBatch(vocabulary, filterFn);
    console.log('review batch:', batch);
    setWords(batch);
    setTimeout(() => {
      console.log('words state:', batch);
    }, 100);
  };

  useEffect(() => {
    console.log('ReviewScreen: useEffect triggered - vocabulary length:', vocabulary.length, 'type:', type, 'id:', id);
    loadReviewWords();
  }, [vocabulary, type, id]);

  // 当 words 数组加载完成后，确保 swiperIndex 正确初始化
  useEffect(() => {
    if (words.length > 0) {
      console.log('ReviewScreen: Words loaded, initializing swiperIndex to 0');
      setSwiperIndex(0);
      
      // 初始化进度条动画
      const initialProgress = 0; // 开始总是0%
      progressAnimation.setValue(initialProgress);
      setCurrentProgress(initialProgress);
      console.log('🔄 进度条动画初始化 - 初始进度:', initialProgress);
      
      // 延迟一点时间，确保 Swiper 组件完全初始化
      setTimeout(() => {
        console.log('ReviewScreen: Swiper should be initialized now');
      }, 100);
    } else {
      console.log('ReviewScreen: Words array is empty, resetting swiperIndex to 0');
      setSwiperIndex(0);
      
      // 重置进度条动画
      progressAnimation.setValue(0);
      setCurrentProgress(0);
    }
  }, [words]);

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
  const addReviewAction = (word: string, remembered: boolean) => {
    setReviewActions(prev => ([...prev, { word, remembered }]));
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
    // 1. 先用 updateWordReview 处理业务逻辑
    const wordObj = convertReviewWordToWord(words[swiperIndex]);
    const updatedWord = updateWordReview(wordObj, false);
    try {
      // 2. 只做存储
      await learningDataService.updateLearningRecord(
        updatedWord.word,
        updatedWord.word,
        false // 不正确
      );
    } catch (error) {
      console.error('更新学习记录失败:', error);
    }
    
    forgottenRef.current += 1;
    setReviewStats(prev => {
      const forgotten = prev.forgottenWords + 1;
      const remembered = prev.rememberedWords;
      const total = prev.totalWords;
      const experience = remembered * 15;
      const accuracy = total > 0 ? Math.round((remembered / total) * 100) : 0;
      return {
        ...prev,
        forgottenWords: forgotten,
        experience,
        accuracy,
      };
    });
    addReviewAction(word, false);
    updateSession('incorrect');

    moveToNextWord();
  };

  const handleSwipeRight = async (word: string) => {
    // 1. 先用 updateWordReview 处理业务逻辑
    const wordObj = convertReviewWordToWord(words[swiperIndex]);
    const updatedWord = updateWordReview(wordObj, true);
    try {
      // 2. 只做存储
      await learningDataService.updateLearningRecord(
        updatedWord.word,
        word,
        true // 正确
      );
    } catch (error) {
      console.error('更新学习记录失败:', error);
    }
    
    rememberedRef.current += 1;
    setReviewStats(prev => {
      const remembered = prev.rememberedWords + 1;
      const total = prev.totalWords;
      const experience = remembered * 15;
      const accuracy = total > 0 ? Math.round((remembered / total) * 100) : 0;
      return {
        ...prev,
        rememberedWords: remembered,
        experience,
        accuracy,
      };
    });
    addReviewAction(word, true);
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
    console.log('ReviewScreen: moveToNextWord called - current swiperIndex:', swiperIndex, 'words.length:', words.length);
    if (swiperIndex < words.length) {
      const newIndex = swiperIndex + 1;
      console.log('ReviewScreen: Moving to next word, new index:', newIndex);
      setSwiperIndex(newIndex);
      setShowAnswer(false);
      
      // 如果是最后一张卡，延迟显示完成页面
      if (newIndex === words.length) {
        console.log('ReviewScreen: Last card completed, preparing to show completion screen');
        // 延迟显示完成页面，确保进度条动画完成
        setTimeout(() => {
          console.log('ReviewScreen: Review complete, calculating final stats');
          // 复习完成 - 计算最终统计数据
          if (!isReviewComplete) {
            const rememberedWords = rememberedRef.current;
            const forgottenWords = forgottenRef.current;
            const currentStats = reviewStats;
            const experience = rememberedWords * 15;
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
            setIsReviewComplete(true);
          }
        }, 1200); // 增加延迟时间，确保100%动画完全加载完毕
      }
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

  const startNewSession = () => {
    setSwiperIndex(0);
    setShowAnswer(false);
    setIsReviewComplete(false);
    setSession({
      totalWords: words.length,
      currentIndex: 0,
      correctCount: 0,
      incorrectCount: 0,
      skippedCount: 0,
      collectedCount: 0,
      startTime: new Date(),
    });
  };

  // Swiper 事件处理 - 现在由 SwipeableWordCard 处理手势
  const handleSwipedLeft = (cardIndex: number) => {
    console.log('ReviewScreen: handleSwipedLeft called with cardIndex:', cardIndex);
    // 向左滑动 = 忘记了这个词
    setReviewStats(prev => {
      const newStats = {
        ...prev,
        forgottenWords: prev.forgottenWords + 1,
      };
      console.log('ReviewScreen: Updated stats after left swipe:', newStats);
      return newStats;
    });
    // 不在这里更新swiperIndex，让moveToNextWord()来处理
  };
  const handleSwipedRight = (cardIndex: number) => {
    console.log('ReviewScreen: handleSwipedRight called with cardIndex:', cardIndex);
    // 向右滑动 = 记住了这个词
    setReviewStats(prev => {
      const newStats = {
        ...prev,
        rememberedWords: prev.rememberedWords + 1,
      };
      console.log('ReviewScreen: Updated stats after right swipe:', newStats);
      return newStats;
    });
    // 不在这里更新swiperIndex，让moveToNextWord()来处理
  };



  // Swiper onSwiped 事件 - 作为备用处理
  const handleSwiped = (cardIndex: number) => {
    console.log('ReviewScreen: handleSwiped called with cardIndex:', cardIndex);
    // 这个回调作为备用，主要依赖 handleSwipedLeft/Right/Top 来处理
    // 如果其他回调没有被触发，这里确保索引被更新
    const nextIndex = Math.min(cardIndex + 1, words.length);
    console.log('ReviewScreen: handleSwiped - setting swiperIndex to:', nextIndex);
    setSwiperIndex(nextIndex);
  };

  // 进度条渲染
  const renderProgressBar = () => {
    // 修复进度文本显示逻辑：
    // 开始显示 0/3，滑完第一张卡显示 1/3，滑完第二张卡显示 2/3，滑完最后一张卡显示 3/3
    // 显示当前正在查看的卡片索引（从0开始）
    const progressText = words.length > 0 ? `${swiperIndex} / ${words.length}` : '';
    return (
    <View style={{ width: '100%', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', width: '90%' }}>
        <TouchableOpacity 
          style={{ padding: 8, marginRight: 12 }}
          onPress={() => navigate('main', { tab: 'review' })}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1, height: 8, backgroundColor: colors.background.tertiary, borderRadius: 4, marginRight: 8 }}>
          <Animated.View style={{
            height: 8,
            backgroundColor: colors.primary[500],
            borderRadius: 4,
            width: progressAnimation.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          }} />
        </View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary }}>{progressText}</Text>
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
          <Ionicons name="book-outline" size={64} color={colors.text.tertiary} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>{t('no_review_words' as TranslationKey, appLanguage)}</Text>
          <TouchableOpacity
            style={{
              marginTop: 24,
              backgroundColor: colors.primary[500],
              paddingHorizontal: 48,
              paddingVertical: 16,
              borderRadius: 25,
            }}
            onPress={() => navigate('main', { tab: 'home' })}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>确定</Text>
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
    const experience = rememberedWords * 15;
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
            
            // 确保经验值同步到后端
            if (finalStats?.experience && finalStats.experience > 0) {
              try {
                const token = await AsyncStorage.getItem('authToken');
                if (token) {
                  // 调用后端API更新经验值
                  await fetch(`${API_BASE_URL}/experience/checkin`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                  });
                  console.log('✅ 复习经验值已同步到后端');
                }
              } catch (error) {
                console.error('❌ 同步复习经验值失败:', error);
              }
            }
            
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
      {isEbbinghaus && (
        <View style={{padding: 12, backgroundColor: colors.success[50], borderRadius: 8, margin: 12}}>
          <Text style={{color: colors.success[700], fontWeight: 'bold'}}>
            ☑️已切入艾宾浩斯记忆法
          </Text>
        </View>
      )}
      {renderProgressBar()}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
          onSwiped={(cardIndex) => {
            // 兜底，不做统计
            handleSwiped(cardIndex);
          }}
          cardVerticalMargin={32}
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