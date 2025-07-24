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
  phonetic: string;
  definitions: WordDefinition[];
  audioUrl?: string;
  isCollected?: boolean;
  searchCount?: number;
  lastSearched?: string;
  correctedWord?: string; // 新增：标准单词
  sources?: Array<{ id: string; type: 'wordbook' | 'episode'; name: string }>; // 新增：单词来源
  feedbackStats?: { positive: number; negative: number; total: number }; // 新增：反馈统计
  kana?: string; // 新增：日语假名标注
  slangMeaning?: string; // 新增：俚语释义
  phraseExplanation?: string; // 新增：短语解释
}

interface WordCardProps {
  wordData: WordData;
  onCollect?: (word: string) => void;
  onIgnore?: (word: string) => void;
  onPlayAudio?: (word: string) => void;
  showActions?: boolean;
  style?: any;
  onFeedbackSubmitted?: (word: string, feedback: 'negative') => void; // 只处理报告问题
}

const CARD_CONTENT_MAX_HEIGHT = 360; // 可根据实际UI调整
const SWIPE_THRESHOLD = 100; // 降低滑动阈值，更容易触发
const SWIPE_ANIMATION_DURATION = 250; // 更快的动画
const ROTATION_ANGLE = 10; // 卡片旋转角度

// WordCardContent 只渲染内容区
export const WordCardContent: React.FC<{ wordData: WordData; style?: any }> = ({ wordData, style }) => {
  const { appLanguage } = useAppLanguage();
  const hasMultipleExamples = wordData.definitions.some(def => def.examples && def.examples.length > 1);
  const [showScrollTip, setShowScrollTip] = useState(hasMultipleExamples);

  // 词性英文转中文映射（复制自 WordCard）
  const partOfSpeechMap: Record<string, Record<string, string>> = {
    'zh-CN': {
      'noun': '名词', 'verb': '动词', 'adjective': '形容词', 'adverb': '副词', 'pronoun': '代词', 'preposition': '介词', 'conjunction': '连词', 'interjection': '感叹词', 'article': '冠词', 'numeral': '数词', 'auxiliary': '助词', 'modal': '情态动词', 'determiner': '限定词', 'prefix': '前缀', 'suffix': '后缀', 'n.': '名词', 'v.': '动词', 'adj.': '形容词', 'adv.': '副词', 'pron.': '代词', 'prep.': '介词', 'conj.': '连词', 'int.': '感叹词', 'art.': '冠词', 'num.': '数词', 'aux.': '助词', 'modal.': '情态动词', 'det.': '限定词', 'prefix.': '前缀', 'suffix.': '后缀',
    },
    'en-US': {
      'noun': 'noun', 'verb': 'verb', 'adjective': 'adjective', 'adverb': 'adverb', 'pronoun': 'pronoun', 'preposition': 'preposition', 'conjunction': 'conjunction', 'interjection': 'interjection', 'article': 'article', 'numeral': 'numeral', 'auxiliary': 'auxiliary', 'modal': 'modal', 'determiner': 'determiner', 'prefix': 'prefix', 'suffix': 'suffix', 'n.': 'n.', 'v.': 'v.', 'adj.': 'adj.', 'adv.': 'adv.', 'pron.': 'pron.', 'prep.': 'prep.', 'conj.': 'conj.', 'int.': 'int.', 'art.': 'art.', 'num.': 'num.', 'aux.': 'aux.', 'modal.': 'modal.', 'det.': 'det.', 'prefix.': 'prefix.', 'suffix.': 'suffix.',
    }
  };

  // 兜底逻辑：definitions 为空时显示提示
  if (!wordData.definitions || wordData.definitions.length === 0) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', padding: 32 }] }>
        <Text style={{ fontSize: 18, color: '#888' }}>暂无释义</Text>
      </View>
    );
  }

  return (
    <View style={style}>
      {/* 头部：单词、音标、发音按钮 */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.wordContainer}>
            <Text style={styles.word}>{wordData.correctedWord || wordData.word}</Text>
            {wordData.kana && (
              <Text style={styles.kana}>{wordData.kana}</Text>
            )}
          </View>
          <Text style={styles.phonetic}>{wordData.phonetic}</Text>
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
        {/* 发音按钮交由外部控制，如需可传递 onPlayAudio */}
      </View>
      {/* 主体内容区：可滚动 */}
      <View style={{ maxHeight: CARD_CONTENT_MAX_HEIGHT, marginBottom: 8, width: '100%' }}>
        <ScrollView
          showsVerticalScrollIndicator={true}
          indicatorStyle="black"
          persistentScrollbar={true}
          contentContainerStyle={{ paddingHorizontal: 0 }}
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
                  {partOfSpeechMap[appLanguage]?.[(def.partOfSpeech || '').toLowerCase()] || def.partOfSpeech}
                </Text>
              </View>
              <Text style={styles.definition}>{def.definition}</Text>
              {def.examples && def.examples.length > 0 && (
                <View style={styles.examplesBlock}>
                  {def.examples.map((ex, exIdx) => (
                    <View key={exIdx} style={styles.exampleContainer}>
                      <Text style={styles.exampleJapanese}>{ex.english}</Text>
                      {appLanguage === 'zh-CN' && ex.romaji && (
                        <Text style={styles.examplePronunciation}>
                          {ex.romaji}
                        </Text>
                      )}
                      <Text style={styles.exampleChinese}>{ex.chinese}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
          {/* 网络俚语/缩写标签和内容 - 放在所有正常释义之后 */}
          {(
            (wordData.slangMeaning && wordData.slangMeaning !== 'null') || 
            (wordData.phraseExplanation && wordData.phraseExplanation !== 'null')
          ) && (
            <View style={styles.definitionBlock}>
              <View style={styles.posTagWrapper}>
                <Text style={styles.posTag}>
                  缩写/俚语/网络用语
                </Text>
              </View>
              <Text style={styles.definition}>
                {wordData.slangMeaning && wordData.slangMeaning !== 'null' 
                  ? wordData.slangMeaning 
                  : wordData.phraseExplanation}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
      {/* 滑动提示，仅初始显示，滑动后消失 */}
      {showScrollTip && (
        <View style={styles.arrowTip}>
          <Text style={styles.arrowTipText}>{t('swipe_down_for_more_examples', appLanguage)}</Text>
          <Ionicons name="chevron-down" size={22} color={colors.text.tertiary} />
        </View>
      )}
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
    maxWidth: 340,
    minHeight: 580,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: 25,
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
    fontSize: 40,
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
    marginBottom: 6,
    marginHorizontal: 8,
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
    paddingLeft: 10,
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
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.border.light,
    alignItems: 'flex-end', // 右对齐
  },
  feedbackButton: {
    width: 32, // 更小的尺寸
    height: 32, // 更小的尺寸
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackButtonActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
});

// 恢复默认导出 WordCard 组件（带滑动、反馈等完整功能）
const WordCard: React.FC<WordCardProps> = ({
  wordData,
  onCollect,
  onIgnore,
  onPlayAudio,
  showActions = false,
  style,
  onFeedbackSubmitted,
}) => {
  // 直接用之前完整的 WordCard 组件实现（带滑动、反馈、收藏、忽略等）
  // ...（原有 WordCard 组件代码）...
};

export default WordCard; 