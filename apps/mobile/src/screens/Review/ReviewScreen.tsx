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
import { LearningRecord } from '../../services/learningAlgorithm';
import { SwipeableWordCard } from '../../components/cards';
import { UserService } from '../../services/userService';
import { useVocabulary } from '../../context/VocabularyContext';
import { useNavigation } from '../../components/navigation/NavigationContext';

// 复习完成统计接口
interface ReviewStats {
  totalWords: number;
  rememberedWords: number;
  forgottenWords: number;
  skippedWords: number;
  score: number;
  accuracy: number;
}

// 复习完成页面组件
const ReviewCompleteScreen: React.FC<{
  stats: ReviewStats;
  onBack: () => void;
}> = ({ stats, onBack }) => {
  const [animationValues] = useState({
    scale: new Animated.Value(0),
    opacity: new Animated.Value(0),
    scoreScale: new Animated.Value(0),
    statsOpacity: new Animated.Value(0),
  });

  useEffect(() => {
    // 启动动画序列
    Animated.sequence([
      // 1. 主容器淡入
      Animated.timing(animationValues.opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // 2. 主容器缩放
      Animated.spring(animationValues.scale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // 3. 得分动画
      Animated.spring(animationValues.scoreScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      // 4. 统计信息淡入
      Animated.timing(animationValues.statsOpacity, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success[500];
    if (score >= 60) return colors.accent[500];
    return colors.error[500];
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return '太棒了！';
    if (score >= 60) return '不错哦！';
    return '继续加油！';
  };

  return (
    <View style={styles.completeContainer}>
      <Animated.View 
        style={[
          styles.completeContent,
          {
            opacity: animationValues.opacity,
            transform: [{ scale: animationValues.scale }],
          }
        ]}
      >
        {/* 标题和图标 */}
        <View style={styles.headerSection}>
          <Animated.View style={{ transform: [{ scale: animationValues.scale }] }}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success[500]} />
          </Animated.View>
          <Text style={styles.completeTitle}>复习完成！</Text>
          <Text style={styles.completeSubtitle}>你真是太棒了！</Text>
          <Text style={styles.completeHint}>点击确定按钮继续</Text>
        </View>

        {/* 得分展示 */}
        <Animated.View 
          style={[
            styles.scoreSection,
            {
              opacity: animationValues.statsOpacity,
              transform: [{ scale: animationValues.scoreScale }],
            }
          ]}
        >
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>本次得分</Text>
            <Text style={[styles.scoreValue, { color: getScoreColor(stats.score) }]}>
              {stats.score}
            </Text>
            <Text style={styles.scoreMessage}>{getScoreMessage(stats.score)}</Text>
          </View>
        </Animated.View>

        {/* 统计信息 */}
        <Animated.View 
          style={[
            styles.statsSection,
            { opacity: animationValues.statsOpacity }
          ]}
        >
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalWords}</Text>
              <Text style={styles.statLabel}>复习单词</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.success[500] }]}>
                {stats.rememberedWords}
              </Text>
              <Text style={styles.statLabel}>记住单词</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.error[500] }]}>
                {stats.forgottenWords}
              </Text>
              <Text style={styles.statLabel}>忘记单词</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.accent[500] }]}>
                {stats.skippedWords}
              </Text>
              <Text style={styles.statLabel}>跳过单词</Text>
            </View>
          </View>

          {/* 准确率 */}
          <View style={styles.accuracySection}>
            <Text style={styles.accuracyLabel}>准确率</Text>
            <View style={styles.accuracyBar}>
              <View 
                style={[
                  styles.accuracyFill, 
                  { 
                    width: `${stats.accuracy}%`,
                    backgroundColor: getScoreColor(stats.score)
                  }
                ]} 
              />
            </View>
            <Text style={styles.accuracyText}>{stats.accuracy}%</Text>
          </View>
        </Animated.View>

        {/* 操作按钮 */}
        <Animated.View 
          style={[
            styles.actionSection,
            { opacity: animationValues.statsOpacity }
          ]}
        >
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.confirmButton} onPress={onBack}>
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.confirmButtonText}>确定</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={20} color={colors.primary[500]} />
              <Text style={styles.backButtonText}>返回复习</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
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
    skippedWords: 0,
    score: 0,
    accuracy: 0,
  });
  const { vocabulary } = useVocabulary();
  const { navigate } = useNavigation();
  
  // 1. Swiper ref
  const swiperRef = useRef<any>(null);
  
  // Swiper 当前卡片索引 - 移到这里，确保在 renderProgressBar 之前定义
  const [swiperIndex, setSwiperIndex] = useState(0);
  
  // 监控 swiperIndex 变化
  useEffect(() => {
    console.log('ReviewScreen: swiperIndex changed to:', swiperIndex);
  }, [swiperIndex]);
  
  // 监控 words 数组变化
  useEffect(() => {
    console.log('ReviewScreen: words array changed, length:', words.length);
    if (words.length > 0) {
      console.log('ReviewScreen: First word:', words[0]);
    }
  }, [words]);

  // 获取筛选参数
  // const { type, id } = (route.params || {}) as { type?: string; id?: number };

  // 复习完成后自动跳转
  useEffect(() => {
    if (isReviewComplete) {
      const timer = setTimeout(() => {
        navigate('main', { tab: 'review' });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isReviewComplete, navigate]);

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

  const loadReviewWords = async () => {
    console.log('ReviewScreen: loadReviewWords called with type:', type, 'id:', id);
    console.log('ReviewScreen: vocabulary length:', vocabulary.length);
    
    try {
      // 根据参数筛选单词
      let filtered = vocabulary;
      if (type === 'show' && id !== undefined) {
        filtered = vocabulary.filter(word => word.sourceShow && word.sourceShow.type !== 'wordbook' && Number(word.sourceShow.id) === Number(id));
        console.log('ReviewScreen: Filtered by show, filtered length:', filtered.length);
      } else if (type === 'wordbook' && id !== undefined) {
        filtered = vocabulary.filter(word => word.sourceShow && word.sourceShow.type === 'wordbook' && Number(word.sourceShow.id) === Number(id));
        console.log('ReviewScreen: Filtered by wordbook, filtered length:', filtered.length);
      } else {
        console.log('ReviewScreen: No filtering applied, using all vocabulary');
      }
      
      if (filtered.length === 0) {
        console.log('ReviewScreen: No words found after filtering, using mock data');
        setWords([]);
        setSession(null);
        return;
      }

      // 将用户单词表中的单词转换为复习单词格式
      const reviewWords: ReviewWord[] = filtered.map((word, index) => ({
        id: `${index}`,
        word: word.word,
        translation: word.definitions && word.definitions[0] ? word.definitions[0].definition : '暂无释义',
        phonetic: word.phonetic || '/ˈwɜːd/',
        difficulty: 'medium' as const, // 默认难度，可以根据学习进度调整
        show: word.sourceShow?.name || '我的单词',
        lastReviewed: word.collectedAt ? new Date(word.collectedAt).toLocaleDateString() : '未复习',
        reviewCount: 0, // 可以从学习记录中获取
      }));

      setWords(reviewWords);
      setSession({
        totalWords: reviewWords.length,
        currentIndex: 0,
        correctCount: 0,
        incorrectCount: 0,
        skippedCount: 0,
        collectedCount: 0,
        startTime: new Date(),
      });
      // 初始化复习统计
      setReviewStats({
        totalWords: reviewWords.length,
        rememberedWords: 0,
        forgottenWords: 0,
        skippedWords: 0,
        score: 0,
        accuracy: 0,
      });
    } catch (error) {
      console.error('加载复习单词失败:', error);
      // 使用模拟数据作为后备
        const mockWords: ReviewWord[] = [
          {
            id: '1',
            word: 'serendipity',
            translation: '意外发现美好事物的能力',
            phonetic: '/ˌserənˈdɪpəti/',
            difficulty: 'hard',
            show: '我的单词',
            lastReviewed: '2024-01-15',
            reviewCount: 3,
          },
          {
            id: '2',
            word: 'resilient',
            translation: '有韧性的，适应力强的',
            phonetic: '/rɪˈzɪliənt/',
            difficulty: 'medium',
            show: '我的单词',
            lastReviewed: '2024-01-14',
            reviewCount: 8,
          },
          {
            id: '3',
            word: 'authentic',
            translation: '真实的，可信的',
            phonetic: '/ɔːˈθentɪk/',
            difficulty: 'medium',
            show: '我的单词',
            lastReviewed: '2024-01-13',
            reviewCount: 5,
          },
          {
            id: '4',
            word: 'perseverance',
            translation: '毅力，坚持不懈',
            phonetic: '/ˌpɜːsɪˈvɪərəns/',
            difficulty: 'hard',
            show: '我的单词',
            lastReviewed: '2024-01-12',
            reviewCount: 2,
          },
          {
            id: '5',
            word: 'eloquent',
            translation: '雄辩的，有说服力的',
            phonetic: '/ˈeləkwənt/',
            difficulty: 'medium',
            show: '我的单词',
            lastReviewed: '2024-01-11',
            reviewCount: 10,
          },
        ];
        setWords(mockWords);
        setSession({
          totalWords: mockWords.length,
          currentIndex: 0,
          correctCount: 0,
          incorrectCount: 0,
          skippedCount: 0,
          collectedCount: 0,
          startTime: new Date(),
        });
        // 初始化复习统计
        setReviewStats({
          totalWords: mockWords.length,
          rememberedWords: 0,
          forgottenWords: 0,
          skippedWords: 0,
          score: 0,
          accuracy: 0,
        });
    }
  };

  // 将 ReviewWord 转换为 WordData 格式
  const convertToWordData = (reviewWord: ReviewWord): WordData => {
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

  // 处理滑动操作
  const handleSwipeLeft = async (word: string) => {
    // 跳过
    try {
      // 更新学习记录
      await learningDataService.updateLearningRecord(
        words[swiperIndex].id,
        word,
        false // 不正确
      );
    } catch (error) {
      console.error('更新学习记录失败:', error);
    }
    
    updateSession('incorrect');
    moveToNextWord();
  };

  const handleSwipeRight = async (word: string) => {
    // 保存
    try {
      // 更新学习记录
      await learningDataService.updateLearningRecord(
        words[swiperIndex].id,
        word,
        true // 正确
      );
    } catch (error) {
      console.error('更新学习记录失败:', error);
    }
    
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
        words[swiperIndex].id,
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
      console.log('ReviewScreen: Review complete, setting isReviewComplete to true');
      // 复习完成
      setIsReviewComplete(true);
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
    setReviewStats(prev => ({
      ...prev,
      forgottenWords: prev.forgottenWords + 1,
    }));
    // 更新当前卡片索引
    const nextIndex = Math.min(cardIndex + 1, words.length - 1);
    console.log('ReviewScreen: handleSwipedLeft - setting swiperIndex to:', nextIndex);
    setSwiperIndex(nextIndex);
  };
  const handleSwipedRight = (cardIndex: number) => {
    console.log('ReviewScreen: handleSwipedRight called with cardIndex:', cardIndex);
    // 向右滑动 = 记住了这个词
    setReviewStats(prev => ({
      ...prev,
      rememberedWords: prev.rememberedWords + 1,
    }));
    // 更新当前卡片索引
    const nextIndex = Math.min(cardIndex + 1, words.length - 1);
    console.log('ReviewScreen: handleSwipedRight - setting swiperIndex to:', nextIndex);
    setSwiperIndex(nextIndex);
  };
  const handleSwipedTop = (cardIndex: number) => {
    console.log('ReviewScreen: handleSwipedTop called with cardIndex:', cardIndex);
    // 向上滑动 = 跳过这个词
    setReviewStats(prev => ({
      ...prev,
      skippedWords: prev.skippedWords + 1,
    }));
    // 更新当前卡片索引
    const nextIndex = Math.min(cardIndex + 1, words.length - 1);
    console.log('ReviewScreen: handleSwipedTop - setting swiperIndex to:', nextIndex);
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
    console.log('ReviewScreen: renderProgressBar - swiperIndex:', swiperIndex, 'words.length:', words.length);
    // 确保 swiperIndex 在有效范围内
    const currentIndex = Math.min(Math.max(0, swiperIndex), words.length - 1);
    // 进度条应该显示当前正在查看的卡片位置，而不是已完成的卡片数量
    // 所以当 swiperIndex 是 0 时，显示 "1 / 总数"
    const progressPercentage = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;
    const progressText = words.length > 0 ? `${currentIndex + 1} / ${words.length}` : '';
    
    console.log('ReviewScreen: Progress calculation - currentIndex:', currentIndex, 'percentage:', progressPercentage, 'text:', progressText);
    
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

  // 渲染卡片内容
  const renderCard = (item: ReviewWord, index: number) => {
    console.log('ReviewScreen: renderCard called for index:', index, 'word:', item.word);
    const wordData = convertToWordData(item);
    return (
      <SwipeableWordCard
        wordData={wordData}
        isExpanded={expandedIndex === index}
        onExpandToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
      />
    );
  };

  if (words.length === 0) {
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
        </View>
      </SafeAreaView>
    );
  }

  if (isReviewComplete) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <ReviewCompleteScreen 
          stats={reviewStats}
          onBack={() => navigate('main', { tab: 'review' })}
        />
      </SafeAreaView>
    );
  }

  console.log('ReviewScreen: Rendering Swiper with words length:', words.length, 'swiperIndex:', swiperIndex);
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
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
          onSwipedLeft={handleSwipedLeft}
          onSwipedRight={handleSwipedRight}
          onSwipedTop={handleSwipedTop}
          onSwipedAll={() => {
            console.log('ReviewScreen: All cards swiped, completing review');
            // 计算最终统计信息
            const totalWords = words.length;
            const rememberedWords = reviewStats.rememberedWords;
            const forgottenWords = reviewStats.forgottenWords;
            const skippedWords = reviewStats.skippedWords;
            
            // 计算得分 (记住的词 * 10 + 跳过的词 * 5)
            const score = rememberedWords * 10 + skippedWords * 5;
            
            // 计算准确率 (记住的词 / 总词数 * 100)
            const accuracy = totalWords > 0 ? Math.round((rememberedWords / totalWords) * 100) : 0;
            
            const finalStats = {
              totalWords,
              rememberedWords,
              forgottenWords,
              skippedWords,
              score,
              accuracy,
            };
            
            console.log('ReviewScreen: Final stats:', finalStats);
            setReviewStats(finalStats);
            setIsReviewComplete(true);
          }}
          onSwiped={(cardIndex) => {
            console.log('ReviewScreen: onSwiped callback triggered with cardIndex:', cardIndex);
            handleSwiped(cardIndex);
          }}
          cardVerticalMargin={32}
          cardHorizontalMargin={0}
          containerStyle={{ flex: 1, width: '100%' }}
        />
      </View>
      {/* 3. Swiper 下方添加操作按钮区 */}
      {/* 删除 Swiper 组件下方的按钮区 */}
      {/* <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 }}> */}
      {/*   <TouchableOpacity */}
      {/*     style={{ */}
      {/*       width: 64, height: 64, borderRadius: 32, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', marginHorizontal: 20, */}
      {/*       shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 6, */}
      {/*     }} */}
      {/*     onPress={() => swiperRef.current?.swipeLeft()} */}
      {/*     activeOpacity={0.8} */}
      {/*   > */}
      {/*     <Ionicons name="close" size={32} color="#fff" /> */}
      {/*   </TouchableOpacity> */}
      {/*   <TouchableOpacity */}
      {/*     style={{ */}
      {/*       width: 64, height: 64, borderRadius: 32, backgroundColor: '#F76C6C', justifyContent: 'center', alignItems: 'center', marginHorizontal: 20, */}
      {/*       shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 6, */}
      {/*     }} */}
      {/*     onPress={() => swiperRef.current?.swipeRight()} */}
      {/*     activeOpacity={0.8} */}
      {/*   > */}
      {/*     <Ionicons name="heart" size={32} color="#fff" /> */}
      {/*   </TouchableOpacity> */}
      {/* </View> */}
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
    color: colors.text.tertiary,
    marginTop: 12,
    fontStyle: 'italic',
  },
  scoreSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  scoreCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreMessage: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  statsSection: {
    width: '100%',
    marginBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  accuracySection: {
    alignItems: 'center',
  },
  accuracyLabel: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 12,
    fontWeight: '600',
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