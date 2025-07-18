import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../packages/ui/src/tokens';

export interface WordDefinition {
  partOfSpeech: string;
  definition: string;
  examples: Array<{
    english: string;
    chinese: string;
  }>;
}

export interface WordData {
  word: string;
  phonetic: string;
  definitions: WordDefinition[];
  audioUrl?: string;
  isCollected?: boolean;
  searchCount?: number;
  lastSearched?: string;
  correctedWord?: string; // 新增：标准单词
  sources?: Array<{ id: string; type: 'wordbook' | 'episode'; name: string }>; // 新增：单词来源
}

interface WordCardProps {
  wordData: WordData;
  onCollect?: (word: string) => void;
  onIgnore?: (word: string) => void;
  onPlayAudio?: (word: string) => void;
  showActions?: boolean;
  style?: any;
}

const CARD_CONTENT_MAX_HEIGHT = 360; // 可根据实际UI调整
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
}) => {
  // 添加调试信息
  console.log('🔍 WordCard 接收到的数据:', wordData);
  console.log('🔍 wordData.word:', wordData?.word);
  console.log('🔍 wordData.definitions:', wordData?.definitions);
  console.log('🔍 wordData.definitions.length:', wordData?.definitions?.length);
  
  const hasMultipleExamples = wordData.definitions.some(def => def.examples && def.examples.length > 1);
  const [showScrollTip, setShowScrollTip] = useState(hasMultipleExamples);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardRotation = useRef(new Animated.Value(0)).current;

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

  // 词性英文转中文映射
  const partOfSpeechMap: Record<string, string> = {
    'noun': '名词',
    'verb': '动词',
    'adjective': '形容词',
    'adverb': '副词',
    'pronoun': '代词',
    'preposition': '介词',
    'conjunction': '连词',
    'interjection': '感叹词',
    'article': '冠词',
    'numeral': '数词',
    'auxiliary': '助词',
    'modal': '情态动词',
    'determiner': '限定词',
    'prefix': '前缀',
    'suffix': '后缀',
    'n.': '名词',
    'v.': '动词',
    'adj.': '形容词',
    'adv.': '副词',
    'pron.': '代词',
    'prep.': '介词',
    'conj.': '连词',
    'int.': '感叹词',
    'art.': '冠词',
    'num.': '数词',
    'aux.': '助词',
    'modal.': '情态动词',
    'det.': '限定词',
    'prefix.': '前缀',
    'suffix.': '后缀',
  };

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
          <Text style={styles.word}>{wordData.correctedWord || wordData.word}</Text>
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
                    {src.type === 'wordbook' ? `来源于 ${src.name}` : `来源于 ${src.name}`}
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
          
      {/* 主体内容区：可滚动 */}
      <View style={{ maxHeight: CARD_CONTENT_MAX_HEIGHT, marginBottom: 8 }}>
        <ScrollView
          showsVerticalScrollIndicator={true}
          indicatorStyle="black"
          persistentScrollbar={true}
          onScroll={e => {
            if (showScrollTip && e.nativeEvent.contentOffset.y > 10) {
              setShowScrollTip(false);
            }
          }}
          scrollEventThrottle={16}
        >
          {wordData.definitions.map((def, idx) => (
            <View key={idx} style={styles.definitionBlock}>
              {/* 词性标签 */}
              <View style={styles.posTagWrapper}>
                <Text style={styles.posTag}>
                  {partOfSpeechMap[(def.partOfSpeech || '').toLowerCase()] || def.partOfSpeech}
                </Text>
              </View>
              <Text style={styles.definition}>{def.definition}</Text>
              {def.examples && def.examples.length > 0 && (
                <View style={styles.examplesBlock}>
                  {def.examples.map((ex, exIdx) => (
                    <View key={exIdx} style={styles.exampleContainer}>
                      <Text style={styles.exampleEnglish}>{ex.english}</Text>
                      <Text style={styles.exampleChinese}>{ex.chinese}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
          
      {/* 滑动提示，仅初始显示，滑动后消失 */}
      {showScrollTip && (
        <View style={styles.arrowTip}>
          <Text style={styles.arrowTipText}>向下滑动查看更多例句</Text>
          <Ionicons name="chevron-down" size={22} color={colors.text.tertiary} />
        </View>
      )}
          
          {/* 滑动操作提示 */}
          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>左滑忽略 • 右滑收藏</Text>
          </View>
        </Animated.View>
      </PanGestureHandler>

      {/* 左滑指示器 - 忽略 */}
      <Animated.View style={[styles.indicator, styles.leftIndicator, { opacity: leftIndicatorOpacity }]}>
        <View style={styles.indicatorContent}>
          <Ionicons name="close-circle" size={40} color={colors.error[500]} />
          <Text style={styles.indicatorText}>忽略</Text>
        </View>
      </Animated.View>

      {/* 右滑指示器 - 收藏 */}
      <Animated.View style={[styles.indicator, styles.rightIndicator, { opacity: rightIndicatorOpacity }]}>
        <View style={styles.indicatorContent}>
          <Ionicons name="heart" size={40} color={colors.primary[500]} />
          <Text style={styles.indicatorText}>收藏</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // 完全无视觉样式
    backgroundColor: 'transparent',
    borderRadius: 0,
    shadowColor: 'transparent',
    elevation: 0,
    paddingVertical: 0,
  },
  card: {
    width: '100%',
    maxWidth: 350,
    minHeight: 600,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 32,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
  },
  phonetic: {
    fontSize: 18,
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
  exampleEnglish: {
    fontSize: 15,
    color: '#888',
    fontStyle: 'italic',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
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
});

export default WordCard; 