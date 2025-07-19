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
import { colors } from '../../../../../packages/ui/src/tokens';
import Swiper from 'react-native-deck-swiper';
import WordCard, { WordData } from '../../components/cards/WordCard';
import { audioService } from '../../services/audioService';
import { learningDataService } from '../../services/learningDataService';
import { LearningRecord, updateWordReview } from '../../services/learningAlgorithm';
import { SwipeableWordCard } from '../../components/cards';
import { UserService } from '../../services/userService';
import { useVocabulary } from '../../context/VocabularyContext';
import { useNavigation } from '../../components/navigation/NavigationContext';
import dayjs from 'dayjs';
import { wordService } from '../../services/wordService';

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
            shadowColor: '#000',
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
  const swiperRef = useRef<any>(null);
  const [swiperIndex, setSwiperIndex] = useState(0);
  const rememberedRef = useRef(0);
  const forgottenRef = useRef(0);
  
  // 监控 swiperIndex 变化
  useEffect(() => {
    console.log('ReviewScreen: swiperIndex changed to:', swiperIndex);
  }, [swiperIndex]);
  
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
        const match = String(w.sourceShow?.id) === String(id);
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
        const match = String(w.sourceShow?.id) === String(id);
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
      // 延迟一点时间，确保 Swiper 组件完全初始化
      setTimeout(() => {
        console.log('ReviewScreen: Swiper should be initialized now');
      }, 100);
    } else {
      console.log('ReviewScreen: Words array is empty, resetting swiperIndex to 0');
      setSwiperIndex(0);
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

  // 处理滑动操作
  const handleSwipeLeft = async (word: string) => {
    // 1. 先用 updateWordReview 处理业务逻辑
    const updatedWord = updateWordReview(words[swiperIndex], false);
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
    const updatedWord = updateWordReview(words[swiperIndex], true);
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
    if (swiperIndex < words.length - 1) {
      const newIndex = swiperIndex + 1;
      console.log('ReviewScreen: Moving to next word, new index:', newIndex);
      setSwiperIndex(newIndex);
      setShowAnswer(false);
    } else {
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
    }
  };

  // 处理音频播放
  const handlePlayAudio = async (word: string) => {
    try {
      await audioService.playWordPronunciation(word);
    } catch (error) {
      Alert.alert('播放失败', '音频播放功能开发中...');
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
    // 更新当前卡片索引
    const nextIndex = Math.min(cardIndex + 1, words.length - 1);
    console.log('ReviewScreen: handleSwipedLeft - setting swiperIndex to:', nextIndex);
    setSwiperIndex(nextIndex);
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
    // 更新当前卡片索引
    const nextIndex = Math.min(cardIndex + 1, words.length - 1);
    console.log('ReviewScreen: handleSwipedRight - setting swiperIndex to:', nextIndex);
    setSwiperIndex(nextIndex);
  };



  // Swiper onSwiped 事件 - 作为备用处理
  const handleSwiped = (cardIndex: number) => {
    console.log('ReviewScreen: handleSwiped called with cardIndex:', cardIndex);
    // 这个回调作为备用，主要依赖 handleSwipedLeft/Right/Top 来处理
    // 如果其他回调没有被触发，这里确保索引被更新
    const nextIndex = Math.min(cardIndex + 1, words.length - 1);
    console.log('ReviewScreen: handleSwiped - setting swiperIndex to:', nextIndex);
    setSwiperIndex(nextIndex);
  };

  // 进度条渲染
  const renderProgressBar = () => {
    // swiperIndex 现在表示“已完成的卡片数”
    const progressPercentage = words.length > 0 ? (swiperIndex / words.length) * 100 : 0;
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
            <View style={{
              height: 8,
              backgroundColor: colors.primary[500],
              borderRadius: 4,
              width: `${progressPercentage}%`
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
          <Text style={{ fontSize: 20, fontWeight: '600', color: colors.text.primary, marginBottom: 8, textAlign: 'center' }}>
            暂无复习单词
          </Text>
          <Text style={{ fontSize: 16, color: colors.text.secondary, textAlign: 'center', lineHeight: 24 }}>
            去首页搜索并收藏一些单词，然后就可以在这里复习了！
          </Text>
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
    setIsReviewComplete(true);
  };

  // ReviewCompleteScreen 传入 actions
  if (isReviewComplete) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <ReviewCompleteScreen 
          stats={finalStats || reviewStats}
          actions={reviewActions}
          onBack={() => navigate('main', { tab: 'review' })}
        />
      </SafeAreaView>
    );
  }

  console.log('ReviewScreen: Rendering Swiper with words length:', words.length, 'swiperIndex:', swiperIndex);
  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      {isEbbinghaus && (
        <View style={{padding: 12, backgroundColor: '#E8F5E9', borderRadius: 8, margin: 12}}>
          <Text style={{color: '#388E3C', fontWeight: 'bold'}}>
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
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary[500],
  },
  statLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  sessionInfo: {
    marginBottom: 40,
  },
  sessionText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    marginHorizontal: 8,
    backgroundColor: colors.primary[500],
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // 复习完成页面样式
  completeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  completeSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 8,
  },
  completeHint: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 12,
    opacity: 0.8,
  },
  scoreSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  scoreCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  scoreLabel: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 8,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  scoreMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  statsSection: {
    width: '100%',
    marginBottom: 40,
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
    shadowColor: '#000',
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
    shadowColor: '#000',
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
    shadowColor: '#000',
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
    shadowColor: '#000',
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
    shadowColor: '#000',
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
});

export default ReviewScreen; 