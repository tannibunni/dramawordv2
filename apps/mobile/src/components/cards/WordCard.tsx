import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../packages/ui/src/tokens';

const { width: screenWidth } = Dimensions.get('window');

// 类型定义
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
}

interface WordCardProps {
  wordData: WordData;
  onCollect?: (word: string) => void;
  onIgnore?: (word: string) => void;
  onPlayAudio?: (word: string) => void;
  showActions?: boolean;
  style?: any;
  onPress?: () => void;
}

const WordCard: React.FC<WordCardProps> = ({
  wordData,
  onCollect,
  onIgnore,
  onPlayAudio,
  showActions = true,
  style,
  onPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardHeight = useRef(new Animated.Value(200)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  // 展开/收起卡片
  const toggleExpanded = () => {
    if (onPress) {
      onPress();
      return;
    }

    setIsExpanded(!isExpanded);
    Animated.spring(cardHeight, {
      toValue: isExpanded ? 200 : 400,
      useNativeDriver: false,
    }).start();
  };

  // 收藏单词
  const handleCollect = () => {
    if (onCollect) {
      onCollect(wordData.word);
    } else {
      Alert.alert('收藏成功', `已收藏单词 "${wordData.word}"`);
    }
  };

  // 忽略单词
  const handleIgnore = () => {
    if (onIgnore) {
      onIgnore(wordData.word);
    } else {
      Alert.alert('忽略成功', `已忽略单词 "${wordData.word}"`);
    }
  };

  // 播放发音
  const handlePlayAudio = () => {
    if (onPlayAudio) {
      onPlayAudio(wordData.word);
    } else {
      Alert.alert('发音', '发音功能开发中...');
    }
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          height: cardHeight,
          opacity: cardOpacity,
        },
        style,
      ]}
    >
      {/* 卡片头部 */}
      <View style={styles.cardHeader}>
        <View style={styles.wordInfo}>
          <Text style={styles.word}>{wordData.word}</Text>
          <Text style={styles.phonetic}>{wordData.phonetic}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.audioButton}
          onPress={handlePlayAudio}
          activeOpacity={0.7}
        >
          <Ionicons name="volume-medium" size={20} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* 主要释义 */}
      <View style={styles.mainDefinition}>
        {wordData.definitions.length > 0 && (
          <View style={styles.definitionItem}>
            <Text style={styles.partOfSpeech}>
              {wordData.definitions[0].partOfSpeech}
            </Text>
            <Text style={styles.definition}>
              {wordData.definitions[0].definition}
            </Text>
          </View>
        )}
      </View>

      {/* 展开内容 */}
      {isExpanded && (
        <Animated.View style={styles.expandedContent}>
          {/* 所有释义 */}
          {wordData.definitions.slice(1).map((def, index) => (
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

          {/* 统计信息 */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              搜索次数: {wordData.searchCount || 0}
            </Text>
            {wordData.lastSearched && (
              <Text style={styles.statsText}>
                最后搜索: {new Date(wordData.lastSearched).toLocaleDateString()}
              </Text>
            )}
          </View>
        </Animated.View>
      )}

      {/* 操作按钮 */}
      {showActions && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.ignoreButton]}
            onPress={handleIgnore}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={colors.error[500]} />
            <Text style={[styles.actionText, styles.ignoreText]}>忽略</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.expandButton}
            onPress={toggleExpanded}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.text.secondary}
            />
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
            <Text style={[styles.actionText, styles.collectText]}>
              {wordData.isCollected ? '已收藏' : '收藏'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: colors.neutral[200],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 200,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  wordInfo: {
    flex: 1,
  },
  word: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  phonetic: {
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainDefinition: {
    marginBottom: 16,
  },
  definitionItem: {
    marginBottom: 12,
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
  },
  expandedContent: {
    marginTop: 8,
  },
  exampleContainer: {
    marginTop: 8,
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
  statsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  statsText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ignoreButton: {
    backgroundColor: colors.error[50],
  },
  collectButton: {
    backgroundColor: colors.primary[50],
  },
  actionText: {
    fontSize: 14,
    marginLeft: 4,
  },
  ignoreText: {
    color: colors.error[500],
  },
  collectText: {
    color: colors.primary[500],
  },
  expandButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WordCard; 