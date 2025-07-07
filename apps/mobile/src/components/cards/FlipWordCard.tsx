import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../packages/ui/src/tokens';
import { WordData } from './WordCard';

const { width: screenWidth } = Dimensions.get('window');
const CARD_HEIGHT = 300;

interface FlipWordCardProps {
  wordData: WordData;
  onCollect?: (word: string) => void;
  onIgnore?: (word: string) => void;
  onPlayAudio?: (word: string) => void;
  style?: any;
}

const FlipWordCard: React.FC<FlipWordCardProps> = ({
  wordData,
  onCollect,
  onIgnore,
  onPlayAudio,
  style,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  // 翻转动画
  const flipCard = () => {
    const toValue = isFlipped ? 0 : 1;
    setIsFlipped(!isFlipped);
    
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  };

  // 前视图（单词）
  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // 后视图（释义）
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  // 前视图透明度
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0.5, 0.5],
    outputRange: [1, 0],
  });

  // 后视图透明度
  const backOpacity = flipAnim.interpolate({
    inputRange: [0.5, 0.5],
    outputRange: [0, 1],
  });

  // 收藏单词
  const handleCollect = () => {
    if (onCollect) {
      onCollect(wordData.word);
    }
  };

  // 忽略单词
  const handleIgnore = () => {
    if (onIgnore) {
      onIgnore(wordData.word);
    }
  };

  // 播放发音
  const handlePlayAudio = () => {
    if (onPlayAudio) {
      onPlayAudio(wordData.word);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* 前视图 - 单词 */}
      <Animated.View
        style={[
          styles.card,
          styles.frontCard,
          {
            transform: [{ rotateY: frontInterpolate }],
            opacity: frontOpacity,
          },
        ]}
      >
        <View style={styles.cardContent}>
          {/* 单词和音标 */}
          <View style={styles.wordSection}>
            <Text style={styles.word}>{wordData.word}</Text>
            <Text style={styles.phonetic}>{wordData.phonetic}</Text>
          </View>

          {/* 提示文本 */}
          <View style={styles.hintSection}>
            <Text style={styles.hintText}>点击卡片查看释义</Text>
            <Ionicons name="hand-left" size={24} color={colors.text.secondary} />
          </View>

          {/* 操作按钮 */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.audioButton]}
              onPress={handlePlayAudio}
              activeOpacity={0.7}
            >
              <Ionicons name="volume-medium" size={20} color={colors.primary[500]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.ignoreButton]}
              onPress={handleIgnore}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={colors.error[500]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.collectButton]}
              onPress={handleCollect}
              activeOpacity={0.7}
            >
              <Ionicons
                name={wordData.isCollected ? "heart" : "heart-outline"}
                size={20}
                color={wordData.isCollected ? colors.error[500] : colors.primary[500]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* 后视图 - 释义 */}
      <Animated.View
        style={[
          styles.card,
          styles.backCard,
          {
            transform: [{ rotateY: backInterpolate }],
            opacity: backOpacity,
          },
        ]}
      >
        <View style={styles.cardContent}>
          {/* 释义内容 */}
          <View style={styles.definitionSection}>
            {wordData.definitions.map((def, index) => (
              <View key={index} style={styles.definitionItem}>
                <Text style={styles.partOfSpeech}>{def.partOfSpeech}</Text>
                <Text style={styles.definition}>{def.definition}</Text>
                
                {/* 例句 */}
                {def.examples.map((example, exampleIndex) => (
                  <View key={exampleIndex} style={styles.exampleContainer}>
                    <Text style={styles.exampleEnglish}>{example.english}</Text>
                    <Text style={styles.exampleChinese}>{example.chinese}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* 操作按钮 */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.audioButton]}
              onPress={handlePlayAudio}
              activeOpacity={0.7}
            >
              <Ionicons name="volume-medium" size={20} color={colors.primary[500]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.ignoreButton]}
              onPress={handleIgnore}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={colors.error[500]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.collectButton]}
              onPress={handleCollect}
              activeOpacity={0.7}
            >
              <Ionicons
                name={wordData.isCollected ? "heart" : "heart-outline"}
                size={20}
                color={wordData.isCollected ? colors.error[500] : colors.primary[500]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* 翻转按钮 */}
      <TouchableOpacity
        style={styles.flipButton}
        onPress={flipCard}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isFlipped ? "eye-off" : "eye"}
          size={24}
          color={colors.primary[500]}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth - 32,
    height: CARD_HEIGHT,
    alignSelf: 'center',
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
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
    backfaceVisibility: 'hidden',
  },
  frontCard: {
    // 前视图样式
  },
  backCard: {
    // 后视图样式
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  wordSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  phonetic: {
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  hintSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  definitionSection: {
    flex: 1,
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
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: 8,
  },
  exampleContainer: {
    paddingLeft: 16,
  },
  exampleEnglish: {
    fontSize: 14,
    color: colors.text.primary,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  exampleChinese: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioButton: {
    backgroundColor: colors.primary[50],
  },
  ignoreButton: {
    backgroundColor: colors.error[50],
  },
  collectButton: {
    backgroundColor: colors.primary[50],
  },
  flipButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.neutral[200],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default FlipWordCard; 