import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../packages/ui/src/tokens';
import { WordData } from './WordCard';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25;
const CARD_HEIGHT = screenHeight * 0.6;

interface SwipeableWordCardProps {
  wordData: WordData;
  onSwipeLeft?: (word: string) => void; // 忘记
  onSwipeRight?: (word: string) => void; // 记住
  onSwipeUp?: (word: string) => void; // 收藏
  onSwipeDown?: (word: string) => void; // 跳过
  showAnswer?: boolean;
  onToggleAnswer?: () => void;
}

const SwipeableWordCard: React.FC<SwipeableWordCardProps> = ({
  wordData,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  showAnswer = false,
  onToggleAnswer,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const [isAnimating, setIsAnimating] = useState(false);

  // 手势处理
  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY, velocityX, velocityY } = event.nativeEvent;
      
      // 判断滑动方向和距离
      const isSwipeLeft = translationX < -SWIPE_THRESHOLD || velocityX < -500;
      const isSwipeRight = translationX > SWIPE_THRESHOLD || velocityX > 500;
      const isSwipeUp = translationY < -SWIPE_THRESHOLD || velocityY < -500;
      const isSwipeDown = translationY > SWIPE_THRESHOLD || velocityY > 500;

      if (isSwipeLeft) {
        handleSwipe('left');
      } else if (isSwipeRight) {
        handleSwipe('right');
      } else if (isSwipeUp) {
        handleSwipe('up');
      } else if (isSwipeDown) {
        handleSwipe('down');
      } else {
        // 回到原位
        resetPosition();
      }
    }
  };

  // 处理滑动
  const handleSwipe = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (isAnimating) return;
    setIsAnimating(true);

    const animations = [];
    let targetX = 0;
    let targetY = 0;
    let targetRotate = 0;

    switch (direction) {
      case 'left':
        targetX = -screenWidth * 1.5;
        targetRotate = -15;
        onSwipeLeft?.(wordData.word);
        break;
      case 'right':
        targetX = screenWidth * 1.5;
        targetRotate = 15;
        onSwipeRight?.(wordData.word);
        break;
      case 'up':
        targetY = -screenHeight * 1.5;
        onSwipeUp?.(wordData.word);
        break;
      case 'down':
        targetY = screenHeight * 1.5;
        onSwipeDown?.(wordData.word);
        break;
    }

    animations.push(
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: targetX,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(translateY, {
          toValue: targetY,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(rotate, {
          toValue: targetRotate,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ])
    );

    Animated.sequence(animations).start(() => {
      setIsAnimating(false);
    });
  };

  // 重置位置
  const resetPosition = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: false,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: false,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: false,
      }),
      Animated.spring(rotate, {
        toValue: 0,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // 旋转插值
  const rotateInterpolate = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  // 背景色插值
  const backgroundColor = translateX.interpolate({
    inputRange: [-screenWidth, 0, screenWidth],
    outputRange: [colors.error[100], colors.background.secondary, colors.success[100]],
  });

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { translateX },
              { translateY },
              { scale },
              { rotate: rotateInterpolate },
            ],
            backgroundColor,
            opacity,
          },
        ]}
      >
        {/* 卡片内容 */}
        <View style={styles.card}>
          {/* 单词 */}
          <View style={styles.wordSection}>
            <Text style={styles.word}>{wordData.word}</Text>
            <Text style={styles.phonetic}>{wordData.phonetic}</Text>
          </View>

          {/* 答案区域 */}
          {showAnswer ? (
            <View style={styles.answerSection}>
              {wordData.definitions.map((def, index) => (
                <View key={index} style={styles.definitionItem}>
                  <Text style={styles.partOfSpeech}>{def.partOfSpeech}</Text>
                  <Text style={styles.definition}>{def.definition}</Text>
                  {def.examples.length > 0 && (
                    <View style={styles.exampleContainer}>
                      <Text style={styles.exampleEnglish}>
                        {def.examples[0].english}
                      </Text>
                      <Text style={styles.exampleChinese}>
                        {def.examples[0].chinese}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>你知道这个单词的意思吗？</Text>
              <TouchableOpacity
                style={styles.showAnswerButton}
                onPress={onToggleAnswer}
              >
                <Text style={styles.showAnswerText}>显示答案</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 操作提示 */}
          <View style={styles.hintSection}>
            <View style={styles.hintRow}>
              <View style={styles.hintItem}>
                <Ionicons name="close-circle" size={24} color={colors.error[500]} />
                <Text style={styles.hintText}>左滑忘记</Text>
              </View>
              <View style={styles.hintItem}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success[500]} />
                <Text style={styles.hintText}>右滑记住</Text>
              </View>
            </View>
            <View style={styles.hintRow}>
              <View style={styles.hintItem}>
                <Ionicons name="heart" size={24} color={colors.primary[500]} />
                <Text style={styles.hintText}>上滑收藏</Text>
              </View>
              <View style={styles.hintItem}>
                <Ionicons name="arrow-down" size={24} color={colors.text.secondary} />
                <Text style={styles.hintText}>下滑跳过</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: screenWidth - 32,
    height: CARD_HEIGHT,
    alignSelf: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 24,
    shadowColor: colors.neutral[200],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    justifyContent: 'space-between',
  },
  wordSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  word: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  phonetic: {
    fontSize: 18,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  answerSection: {
    flex: 1,
    marginBottom: 24,
  },
  definitionItem: {
    marginBottom: 16,
  },
  partOfSpeech: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  definition: {
    fontSize: 18,
    color: colors.text.primary,
    lineHeight: 26,
    marginBottom: 8,
  },
  exampleContainer: {
    paddingLeft: 16,
  },
  exampleEnglish: {
    fontSize: 16,
    color: colors.text.primary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  exampleChinese: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  questionSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  questionText: {
    fontSize: 20,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  showAnswerButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  showAnswerText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  hintSection: {
    marginTop: 16,
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  hintItem: {
    alignItems: 'center',
  },
  hintText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
});

export default SwipeableWordCard; 