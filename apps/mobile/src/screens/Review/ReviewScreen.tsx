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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../packages/ui/src/tokens';
import { SwipeableWordCard, FlipWordCard, WordData } from '../../components/cards';
import { audioService } from '../../services/audioService';
import { learningDataService } from '../../services/learningDataService';
import { LearningRecord } from '../../services/learningAlgorithm';

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

const ReviewScreen: React.FC = () => {
  const [words, setWords] = useState<ReviewWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isReviewComplete, setIsReviewComplete] = useState(false);
  const [cardMode, setCardMode] = useState<'swipe' | 'flip'>('swipe');
  
  const cardOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadReviewWords();
  }, []);

  const loadReviewWords = async () => {
    try {
      // 从学习算法获取需要复习的单词
      const learningRecords = await learningDataService.getWordsForReview(20);
      
      if (learningRecords.length === 0) {
        // 如果没有学习记录，使用模拟数据
        const mockWords: ReviewWord[] = [
          {
            id: '1',
            word: 'serendipity',
            translation: '意外发现美好事物的能力',
            phonetic: '/ˌserənˈdɪpəti/',
            difficulty: 'hard',
            show: 'Friends',
            lastReviewed: '2024-01-15',
            reviewCount: 3,
          },
          {
            id: '2',
            word: 'resilient',
            translation: '有韧性的，适应力强的',
            phonetic: '/rɪˈzɪliənt/',
            difficulty: 'medium',
            show: 'Breaking Bad',
            lastReviewed: '2024-01-14',
            reviewCount: 8,
          },
          {
            id: '3',
            word: 'authentic',
            translation: '真实的，可信的',
            phonetic: '/ɔːˈθentɪk/',
            difficulty: 'medium',
            show: 'The Office',
            lastReviewed: '2024-01-13',
            reviewCount: 5,
          },
          {
            id: '4',
            word: 'perseverance',
            translation: '毅力，坚持不懈',
            phonetic: '/ˌpɜːsɪˈvɪərəns/',
            difficulty: 'hard',
            show: 'Game of Thrones',
            lastReviewed: '2024-01-12',
            reviewCount: 2,
          },
          {
            id: '5',
            word: 'eloquent',
            translation: '雄辩的，有说服力的',
            phonetic: '/ˈeləkwənt/',
            difficulty: 'medium',
            show: 'House of Cards',
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
        return;
      }

      // 将学习记录转换为复习单词格式
      const reviewWords: ReviewWord[] = learningRecords.map((record, index) => ({
        id: record.wordId,
        word: record.word,
        translation: `掌握度: ${record.masteryLevel}%`, // 临时翻译，实际应该从API获取
        phonetic: '/ˈwɜːd/', // 临时音标，实际应该从API获取
        difficulty: record.difficulty,
        show: 'Learning',
        lastReviewed: record.lastReviewed.toLocaleDateString(),
        reviewCount: record.reviewCount,
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
    } catch (error) {
      console.error('加载复习单词失败:', error);
      // 使用模拟数据作为后备
      loadReviewWords();
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
    // 忘记/不认识
    try {
      // 更新学习记录
      await learningDataService.updateLearningRecord(
        words[currentWordIndex].id,
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
    // 记住/认识
    try {
      // 更新学习记录
      await learningDataService.updateLearningRecord(
        words[currentWordIndex].id,
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
    // 收藏
    updateSession('collected');
    Alert.alert('收藏成功', `已收藏单词 "${word}"`);
  };

  const handleSwipeDown = async (word: string) => {
    // 跳过 - 标记为不正确
    try {
      // 更新学习记录
      await learningDataService.updateLearningRecord(
        words[currentWordIndex].id,
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
    Animated.timing(cardOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      cardOpacity.setValue(1);
      
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        // 复习完成
        setIsReviewComplete(true);
      }
    });
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
    setCurrentWordIndex(0);
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

  const renderReviewCard = () => {
    if (currentWordIndex >= words.length) return null;

    const currentWord = words[currentWordIndex];
    const wordData = convertToWordData(currentWord);

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: cardOpacity,
          },
        ]}
      >
        {/* 难度标签 */}
        <View style={styles.difficultyContainer}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(currentWord.difficulty) }]}>
            <Text style={styles.difficultyText}>{getDifficultyText(currentWord.difficulty)}</Text>
          </View>
          {currentWord.show && (
            <Text style={styles.showText}>来自: {currentWord.show}</Text>
          )}
        </View>

        {/* 根据模式渲染不同的卡片 */}
        {cardMode === 'swipe' ? (
          <SwipeableWordCard
            wordData={wordData}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onSwipeUp={handleSwipeUp}
            onSwipeDown={handleSwipeDown}
            showAnswer={showAnswer}
            onToggleAnswer={toggleAnswer}
          />
        ) : (
          <FlipWordCard
            wordData={wordData}
            onCollect={(word) => {
              updateSession('collected');
              Alert.alert('收藏成功', `已收藏单词 "${word}"`);
            }}
            onIgnore={(word) => {
              updateSession('incorrect');
              moveToNextWord();
            }}
            onPlayAudio={handlePlayAudio}
          />
        )}

        {/* 复习信息 */}
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewText}>
            复习 {currentWord.reviewCount} 次 • 最后: {currentWord.lastReviewed}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderReviewComplete = () => {
    if (!session) return null;

    const accuracy = Math.round((session.correctCount / session.totalWords) * 100);
    const duration = Math.round((new Date().getTime() - session.startTime.getTime()) / 1000 / 60);

    return (
      <View style={styles.completeContainer}>
        <View style={styles.completeHeader}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success[500]} />
          <Text style={styles.completeTitle}>复习完成！</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{session.totalWords}</Text>
            <Text style={styles.statLabel}>总单词</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{session.correctCount}</Text>
            <Text style={styles.statLabel}>记住</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{session.incorrectCount}</Text>
            <Text style={styles.statLabel}>忘记</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{session.skippedCount}</Text>
            <Text style={styles.statLabel}>跳过</Text>
          </View>
        </View>

        <View style={styles.additionalStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{accuracy}%</Text>
            <Text style={styles.statLabel}>准确率</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{session.collectedCount}</Text>
            <Text style={styles.statLabel}>收藏</Text>
          </View>
        </View>

        <View style={styles.sessionInfo}>
          <Text style={styles.sessionText}>用时: {duration} 分钟</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={startNewSession}>
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.actionButtonText}>重新复习</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.accent[500] }]}>
            <Ionicons name="home" size={20} color="white" />
            <Text style={styles.actionButtonText}>返回首页</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (words.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载复习单词中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {isReviewComplete ? (
        renderReviewComplete()
      ) : (
        <>
          {/* 头部控制栏 */}
          <View style={styles.header}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${((currentWordIndex + 1) / words.length) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {currentWordIndex + 1} / {words.length}
              </Text>
            </View>

            <TouchableOpacity style={styles.modeButton} onPress={toggleCardMode}>
              <Ionicons 
                name={cardMode === 'swipe' ? 'swap-horizontal' : 'swap-vertical'} 
                size={20} 
                color={colors.primary[500]} 
              />
              <Text style={styles.modeText}>
                {cardMode === 'swipe' ? '滑动模式' : '翻转模式'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 复习卡片 */}
          <View style={styles.cardContainer}>
            {renderReviewCard()}
          </View>

          {/* 操作提示 */}
          <View style={styles.hintContainer}>
            <Text style={styles.hintTitle}>操作说明：</Text>
            {cardMode === 'swipe' ? (
              <Text style={styles.hintText}>• 左滑：忘记 • 右滑：记住 • 上滑：收藏 • 下滑：跳过</Text>
            ) : (
              <Text style={styles.hintText}>• 点击眼睛图标翻转卡片 • 点击收藏按钮收藏单词 • 点击忽略按钮跳过</Text>
            )}
          </View>
        </>
      )}
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
    paddingHorizontal: 16,
  },
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
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
});

export default ReviewScreen; 