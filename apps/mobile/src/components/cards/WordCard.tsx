import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../packages/ui/src/tokens';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';
import { wordFeedbackService } from '../../services/wordFeedbackService';
import WordCardContent from './WordCardContent';

export interface WordDefinition {
  partOfSpeech: string;
  definition: string;
  examples: Array<{
    english: string;
    chinese: string;
    romaji?: string; // 新增：日语例句的罗马音
  }>;
}

export interface WordData {
  word: string;
  phonetic?: string;
  definitions: WordDefinition[];
  audioUrl?: string;
  isCollected?: boolean;
  searchCount?: number;
  lastSearched?: string;
  correctedWord?: string; // 新增：标准单词
  sources?: Array<{ id: string; type: 'wordbook' | 'episode'; name: string }>; // 新增：单词来源
  feedbackStats?: { positive: number; negative: number; total: number }; // 新增：反馈统计
  kana?: string; // 新增：日语假名标注
  language?: string; // 新增：单词语言
  slangMeaning?: string; // 新增：俚语/缩写含义
  phraseExplanation?: string; // 新增：短语解释
}

interface WordCardProps {
  wordData: WordData;
  onCollect?: (word: string) => void;
  onIgnore?: (word: string) => void;
  onPlayAudio?: (word: string) => void;
  showActions?: boolean;
  style?: any;
  onFeedbackSubmitted?: (word: string, feedback: 'positive' | 'negative') => void; // 新增：反馈回调
}

const CARD_CONTENT_MAX_HEIGHT = 400; // 可根据实际UI调整
const SWIPE_THRESHOLD = 100; // 降低滑动阈值，更容易触发
const SWIPE_ANIMATION_DURATION = 250; // 更快的动画
const ROTATION_ANGLE = 10; // 卡片旋转角度

const WordCard: React.FC<WordCardProps> = ({
  wordData,
  onCollect,
  onIgnore,
  onPlayAudio,
  showActions = false, // 默认不显示按钮，使用滑动操作
  style,
  onFeedbackSubmitted,
}) => {
  const { appLanguage } = useAppLanguage();
  // 添加调试信息
  console.log('WordCard 渲染 wordData:', wordData, 'definitions:', wordData.definitions);
  console.log('🔍 wordData.word:', wordData?.word);
  console.log('🔍 wordData.definitions:', wordData?.definitions);
  console.log('🔍 wordData.definitions.length:', wordData?.definitions?.length);
  
  const hasMultipleExamples = wordData.definitions.some(def => def.examples && def.examples.length > 1);
  const [showScrollTip, setShowScrollTip] = useState(hasMultipleExamples);
  const [userFeedback, setUserFeedback] = useState<'positive' | 'negative' | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackStats, setFeedbackStats] = useState(wordData.feedbackStats);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardRotation = useRef(new Animated.Value(0)).current;

  // 加载用户反馈状态
  useEffect(() => {
    loadUserFeedback();
    loadFeedbackStats();
  }, [wordData.word]);

  const loadUserFeedback = async () => {
    try {
      const response = await wordFeedbackService.getUserFeedback(wordData.correctedWord || wordData.word);
      if (response.success && response.data) {
        setUserFeedback(response.data.feedback);
      }
    } catch (error) {
      console.error('加载用户反馈失败:', error);
    }
  };

  const loadFeedbackStats = async () => {
    try {
      const response = await wordFeedbackService.getFeedbackStats(wordData.correctedWord || wordData.word);
      if (response.success && response.data) {
        setFeedbackStats(response.data);
      }
    } catch (error) {
      console.error('加载反馈统计失败:', error);
    }
  };

  // 提交反馈
  const handleFeedback = async (feedback: 'positive' | 'negative') => {
    if (isSubmittingFeedback) return;
    
    setIsSubmittingFeedback(true);
    try {
      const response = await wordFeedbackService.submitFeedback(
        wordData.correctedWord || wordData.word,
        feedback
      );
      
      if (response.success) {
        setUserFeedback(feedback);
        // 更新本地统计
        if (feedbackStats) {
          const newStats = { ...feedbackStats };
          if (userFeedback === 'positive' && feedback === 'negative') {
            newStats.positive--;
            newStats.negative++;
          } else if (userFeedback === 'negative' && feedback === 'positive') {
            newStats.positive++;
            newStats.negative--;
          } else if (!userFeedback) {
            if (feedback === 'positive') {
              newStats.positive++;
            } else {
              newStats.negative++;
            }
            newStats.total++;
          }
          setFeedbackStats(newStats);
        }
        
        // 调用回调函数
        onFeedbackSubmitted?.(wordData.correctedWord || wordData.word, feedback);
        
        // 移除弹窗提示
      } else {
        console.error('反馈提交失败:', response.error);
      }
    } catch (error) {
      console.error('提交反馈失败:', error);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // 收藏单词
  const handleCollect = () => {
    if (onCollect) {
      onCollect(wordData.correctedWord || wordData.word);
    }
  };

  // 忽略单词
  const handleIgnore = () => {
    if (onIgnore) {
      onIgnore(wordData.correctedWord || wordData.word);
    }
    // 删除弹窗，不再提示
  };

  // 播放发音
  const handlePlayAudio = () => {
    if (onPlayAudio) {
      onPlayAudio(wordData.correctedWord || wordData.word);
    }
  };

  // 处理滑动手势
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY } = event.nativeEvent;
      const screenWidth = Dimensions.get('window').width;
      
      if (translationX > SWIPE_THRESHOLD) {
        // 右滑 - 收藏
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: screenWidth * 1.5,
            duration: SWIPE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: translationY * 2,
            duration: SWIPE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 0,
            duration: SWIPE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 0.8,
            duration: SWIPE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ]).start(() => {
          handleCollect();
          // 重置动画
          translateX.setValue(0);
          translateY.setValue(0);
          cardOpacity.setValue(1);
          cardScale.setValue(1);
          cardRotation.setValue(0);
        });
      } else if (translationX < -SWIPE_THRESHOLD) {
        // 左滑 - 忽略
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: -screenWidth * 1.5,
            duration: SWIPE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: translationY * 2,
            duration: SWIPE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 0,
            duration: SWIPE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(cardScale, {
            toValue: 0.8,
            duration: SWIPE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ]).start(() => {
          handleIgnore();
          // 重置动画
          translateX.setValue(0);
          translateY.setValue(0);
          cardOpacity.setValue(1);
          cardScale.setValue(1);
          cardRotation.setValue(0);
        });
      } else {
        // 回到原位
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(cardScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(cardRotation, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
        ]).start();
      }
    }
  };

  // 计算滑动指示器的透明度
  const leftIndicatorOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const rightIndicatorOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // 计算卡片旋转角度
  const cardRotationInterpolate = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    outputRange: [-ROTATION_ANGLE, 0, ROTATION_ANGLE],
    extrapolate: 'clamp',
  });

  // 计算卡片缩放
  const cardScaleInterpolate = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    outputRange: [0.95, 1, 0.95],
    extrapolate: 'clamp',
  });



  return (
    <View style={[styles.container, style]}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateX },
                { translateY },
                { scale: cardScaleInterpolate },
                { rotate: `${cardRotationInterpolate}deg` },
              ],
              opacity: cardOpacity,
            },
          ]}
        >
      {/* 头部：单词、音标、发音按钮 */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          {/* 主词顶部语言标签，靠左+国旗 */}
          {/* <View style={styles.wordLangTagWrapper}>
            <Text style={styles.wordLangTag}>
              {getWordLangFlag(wordData, appLanguage)} {getWordLangShort(wordData, appLanguage)}
            </Text>
          </View> */}
          <View style={styles.wordContainer}>
            {/* 日语：显示汉字和假名 */}
            <Text style={styles.word}>
              {wordData.correctedWord || wordData.word}
              {/* 语言标签 */}
              {/* <Text style={styles.wordLangLabel}> {getWordLangLabel(wordData)}</Text> */}
            </Text>
            {wordData.kana && (
              <Text style={styles.kana}>{wordData.kana}</Text>
            )}
          </View>
          {/* 罗马音发音 */}
          <Text style={styles.phonetic}>{wordData.phonetic}</Text>
          {/* 来源 TAG 区域 */}
          {Array.isArray(wordData.sources) && wordData.sources.length > 0 && (
            <View style={styles.sourceTagsContainer}>
              {wordData.sources.map((src, idx) => (
                <View
                  key={src.id || idx}
                  style={[
                    styles.sourceTag,
                    src.type === 'wordbook' && styles.wordbookTag
                  ]}
                >
                  <Text style={styles.sourceTagText} numberOfLines={1} ellipsizeMode="tail">
                    {src.type === 'wordbook' ? `${t('source_from', appLanguage)} ${src.name}` : `${t('source_from', appLanguage)} ${src.name}`}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.audioButton} onPress={handlePlayAudio} activeOpacity={0.7}>
          <Ionicons name="volume-medium" size={22} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>
          
      {/* 主体内容区：使用统一的WordCardContent组件 */}
      <View style={{ maxHeight: CARD_CONTENT_MAX_HEIGHT, marginBottom: 8 }}>
        <WordCardContent 
          wordData={wordData} 
          onPlayAudio={onPlayAudio} 
          scrollable={true}
          onScroll={e => {
            if (showScrollTip && e.nativeEvent.contentOffset.y > 10) {
              setShowScrollTip(false);
            }
          }}
        />
      </View>
          
      {/* 滑动提示，仅初始显示，滑动后消失 */}
      {showScrollTip && (
        <View style={styles.arrowTip}>
          <Text style={styles.arrowTipText}>{t('swipe_down_for_more_examples', appLanguage)}</Text>
          <Ionicons name="chevron-down" size={22} color={colors.text.tertiary} />
        </View>
      )}
          
      {/* 滑动操作提示 + 汇报问题ICON */}
      <View style={styles.swipeHintsContainer}>
        <Text style={styles.swipeHintLeft}>←左滑忽略</Text>
        <FlagFeedbackButton onFeedback={() => handleFeedback('negative')} disabled={isSubmittingFeedback} />
        <Text style={styles.swipeHintRight}>右滑收藏→</Text>
      </View>
        </Animated.View>
      </PanGestureHandler>

      {/* 左滑指示器 - 忽略 */}
      <Animated.View style={[styles.indicator, styles.leftIndicator, { opacity: leftIndicatorOpacity }]}>
        <View style={styles.indicatorContent}>
          <Ionicons name="close-circle" size={40} color={colors.error[500]} />
          <Text style={styles.indicatorText}>{t('ignore', appLanguage)}</Text>
        </View>
      </Animated.View>

      {/* 右滑指示器 - 收藏 */}
      <Animated.View style={[styles.indicator, styles.rightIndicator, { opacity: rightIndicatorOpacity }]}>
        <View style={styles.indicatorContent}>
          <Ionicons name="heart" size={40} color={colors.primary[500]} />
          <Text style={styles.indicatorText}>{t('collect', appLanguage)}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

function getWordLangLabel(wordData: WordData) {
  // 优先用language字段
  const lang = wordData.language;
  if (lang === 'zh' || lang === 'zh-CN') return '【中文】';
  if (lang === 'ja' || lang === 'ja-JP') return '【日语】';
  if (lang === 'en' || lang === 'en-US') return '【英语】';
  // 自动推断
  const w = wordData.correctedWord || wordData.word || '';
  if (/[0-9]+$/.test(w) && /^[a-zA-Z\s\-']+$/.test(w)) return '【英语】';
  if (/[0-9]*[\u4e00-\u9fa5]+/.test(w)) return '【中文】';
  if (/([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF])/.test(w)) return '【日语】';
  return '';
}

function getWordLangShort(wordData: WordData, appLanguage: string) {
  // 如果界面为中文，只显示EN或JA
  if (appLanguage === 'zh-CN') {
    if ((wordData.language === 'ja' || wordData.language === 'ja-JP') || wordData.kana || /[\u3040-\u309F\u30A0-\u30FF]/.test(wordData.correctedWord || wordData.word || '')) return 'JA';
    return 'EN';
  }
  const lang = wordData.language;
  if (lang === 'zh' || lang === 'zh-CN') return 'ZH';
  if (lang === 'ja' || lang === 'ja-JP') return 'JA';
  if (lang === 'en' || lang === 'en-US') return 'EN';
  const w = wordData.correctedWord || wordData.word || '';
  if (wordData.kana) return 'JA';
  if (/^[a-zA-Z\s\-']+$/.test(w)) return 'EN';
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(w)) return 'JA';
  if (/[\u4e00-\u9fa5]+/.test(w)) return 'ZH';
  return '';
}



function getWordLangFlag(wordData: WordData, appLanguage: string) {
  // 如果界面为中文，只显示EN或JA
  if (appLanguage === 'zh-CN') {
    if ((wordData.language === 'ja' || wordData.language === 'ja-JP') || wordData.kana || /[\u3040-\u309F\u30A0-\u30FF]/.test(wordData.correctedWord || wordData.word || '')) return '🇯🇵';
    return '🇺🇸';
  }
  const lang = wordData.language;
  if (lang === 'zh' || lang === 'zh-CN') return '🇨🇳';
  if (lang === 'ja' || lang === 'ja-JP') return '🇯🇵';
  if (lang === 'en' || lang === 'en-US') return '🇺🇸';
  const w = wordData.correctedWord || wordData.word || '';
  if (wordData.kana) return '🇯🇵';
  if (/^[a-zA-Z\s\-']+$/.test(w)) return '🇺🇸';
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(w)) return '🇯🇵';
  if (/[\u4e00-\u9fa5]+/.test(w)) return '🇨🇳';
  return '';
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // 完全无视觉样式
    backgroundColor: 'transparent',
    borderRadius: 0,
    ...Platform.select({
      web: {
        boxShadow: 'none',
      },
      default: {
        shadowColor: 'transparent',
        elevation: 0,
      },
    }),
    paddingVertical: 0,
  },
  card: {
    width: '100%',
    maxWidth: 350,
    height: 570,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 32,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: colors.neutral[900],
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
    justifyContent: 'space-between',
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
  },
  kana: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    marginLeft: 8,
    marginBottom: 4,
  },
  phonetic: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 2,
  },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f6fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  definitionBlock: {
    marginTop: 12,
    marginBottom: 8,
  },
  partOfSpeech: {
    fontSize: 15,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  definition: {
    fontSize: 18,
    color: '#222',
    marginBottom: 6,
  },
  examplesBlock: {
    marginTop: 4,
    marginBottom: 2,
    paddingLeft: 8,
  },
  exampleContainer: {
    marginTop: 4,
    paddingLeft: 8,
  },
  exampleJapanese: {
    fontSize: 15,
    color: '#888',
    fontStyle: 'italic',
  },
  examplePronunciation: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 2,
  },
  exampleChinese: {
    fontSize: 15,
    color: '#444',
    marginBottom: 8,
  },
  arrowTip: {
    alignItems: 'center',
    marginVertical: 8,
  },
  arrowTipText: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  swipeHint: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  swipeHintText: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    // 不要flex: 1，避免挤出icon
  },
  indicator: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -40 }],
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
      },
    }),
    zIndex: 1000,
  },
  leftIndicator: {
    left: 30,
  },
  rightIndicator: {
    right: 30,
  },
  indicatorContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  posTagWrapper: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  posTag: {
    backgroundColor: '#e6f0fa',
    color: '#318ce7',
    fontSize: 13,
    fontWeight: 'bold',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
    marginBottom: 2,
  },
  sourceTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    maxWidth: '100%',
  },
  sourceTag: {
    backgroundColor: colors.primary[500],
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
    maxWidth: 140,
    alignSelf: 'flex-start',
  },
  wordbookTag: {
    backgroundColor: colors.success[400],
  },
  sourceTagText: {
    color: colors.text.inverse,
    fontSize: 15,
    fontWeight: '500',
  },
  feedbackContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  feedbackButtonActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  feedbackButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  feedbackButtonTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  feedbackStats: {
    alignItems: 'center',
    marginTop: 4,
  },
  feedbackStatsText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  feedbackCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginLeft: 4,
    backgroundColor: colors.background.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 16,
    textAlign: 'center',
  },
  exampleLabelAndText: {
    fontSize: 15,
    color: '#888',
    fontStyle: 'italic',
  },
  exampleLangLabel: {
    fontWeight: 'bold',
    color: '#318ce7',
    fontSize: 13,
  },
  wordLangLabel: {
    fontSize: 14,
    color: '#318ce7',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  wordLangTagWrapper: {
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  wordLangTag: {
    backgroundColor: '#318ce7',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginBottom: 2,
    flexDirection: 'row',
    textAlign: 'left',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error[50],
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    alignSelf: 'center',
  },
  reportButtonText: {
    color: colors.error[700],
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
  },
  swipeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  swipeHintsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 12,
    gap: 8,
  },
  swipeHintLeft: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  swipeHintRight: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  reportIconOnly: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#E5E7EB', // 浅灰色圆圈
    alignItems: 'center',
    justifyContent: 'center',
  },
  // reportIconRow 已不再需要
});

export default WordCard; 

const FlagFeedbackButton = ({ onFeedback, disabled }: { onFeedback: () => void; disabled?: boolean }) => {
  const [flagged, setFlagged] = useState(false);
  const handlePress = () => {
    if (!flagged && !disabled) {
      setFlagged(true);
      onFeedback();
    }
  };
  return (
    <TouchableOpacity
      style={styles.reportIconOnly}
      onPress={handlePress}
      disabled={disabled || flagged}
      activeOpacity={0.7}
    >
      <Ionicons
        name="flag-outline"
        size={20}
        color={flagged ? colors.primary[500] : colors.text.tertiary}
      />
    </TouchableOpacity>
  );
}; 