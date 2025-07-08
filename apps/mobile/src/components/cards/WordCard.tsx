import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
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

const WordCard: React.FC<WordCardProps> = ({
  wordData,
  onCollect,
  onIgnore,
  onPlayAudio,
  showActions = true,
  style,
}) => {
  const hasMultipleExamples = wordData.definitions.some(def => def.examples && def.examples.length > 1);
  const [showScrollTip, setShowScrollTip] = useState(hasMultipleExamples);

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
    <View style={[styles.card, style]}>
      {/* 头部：单词、音标、发音按钮 */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.word}>{wordData.word}</Text>
          <Text style={styles.phonetic}>{wordData.phonetic}</Text>
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
              <Text style={styles.partOfSpeech}>{def.partOfSpeech}</Text>
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
      {/* 底部按钮区：始终固定在卡片底部 */}
      {showActions && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.ignoreButton]} onPress={handleIgnore} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={colors.error[500]} />
            <Text style={styles.ignoreText}>忽略</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.collectButton]} onPress={handleCollect} activeOpacity={0.7}>
            <Ionicons name={wordData.isCollected ? "heart" : "heart-outline"} size={20} color={wordData.isCollected ? colors.error[500] : colors.primary[500]} />
            <Text style={styles.collectText}>{wordData.isCollected ? '已收藏' : '收藏'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginVertical: 12,
    width: '92%',
    maxWidth: 500,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#f5f6fa',
  },
  ignoreButton: {
    backgroundColor: '#ffeaea',
  },
  collectButton: {
    backgroundColor: '#eaf2ff',
  },
  ignoreText: {
    color: '#ff4d4f',
    marginLeft: 4,
    fontSize: 15,
    fontWeight: '500',
  },
  collectText: {
    color: '#3478f6',
    marginLeft: 4,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default WordCard; 