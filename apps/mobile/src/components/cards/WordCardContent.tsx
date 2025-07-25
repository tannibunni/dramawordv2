import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../packages/ui/src/tokens';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { WordData } from './WordCard';
import { Audio } from 'expo-av';

interface WordCardContentProps {
  wordData: WordData;
  onPlayAudio?: (word: string) => void;
  style?: any;
}

// 取消高度限制，让所有definitions都能直接显示

const partOfSpeechMap: Record<string, Record<string, string>> = {
  'zh-CN': {
    'verb': '动词', 'v.': '动词', 'VERB': '动词',
    'noun': '名词', 'n.': '名词', 'NOUN': '名词',
    'adjective': '形容词', 'adj.': '形容词', 'ADJECTIVE': '形容词',
    'adverb': '副词', 'adv.': '副词', 'ADVERB': '副词',
    'pronoun': '代词', 'pron.': '代词', 'PRONOUN': '代词',
    'preposition': '介词', 'prep.': '介词', 'PREPOSITION': '介词',
    'conjunction': '连词', 'conj.': '连词', 'CONJUNCTION': '连词',
    'interjection': '感叹词', 'int.': '感叹词', 'INTERJECTION': '感叹词',
    'article': '冠词', 'art.': '冠词', 'ARTICLE': '冠词',
    'numeral': '数词', 'num.': '数词', 'NUMERAL': '数词',
    'auxiliary': '助词', 'aux.': '助词', 'AUXILIARY': '助词',
    'modal': '情态动词', 'modal.': '情态动词', 'MODAL': '情态动词',
    'determiner': '限定词', 'det.': '限定词', 'DETERMINER': '限定词',
    'prefix': '前缀', 'prefix.': '前缀', 'PREFIX': '前缀',
    'suffix': '后缀', 'suffix.': '后缀', 'SUFFIX': '后缀',
  },
  'en-US': {
    'verb': 'Verb', 'v.': 'Verb', 'VERB': 'Verb',
    'noun': 'Noun', 'n.': 'Noun', 'NOUN': 'Noun',
    'adjective': 'Adjective', 'adj.': 'Adjective', 'ADJECTIVE': 'Adjective',
    'adverb': 'Adverb', 'adv.': 'Adverb', 'ADVERB': 'Adverb',
    'pronoun': 'Pronoun', 'pron.': 'Pronoun', 'PRONOUN': 'Pronoun',
    'preposition': 'Preposition', 'prep.': 'Preposition', 'PREPOSITION': 'Preposition',
    'conjunction': 'Conjunction', 'conj.': 'Conjunction', 'CONJUNCTION': 'Conjunction',
    'interjection': 'Interjection', 'int.': 'Interjection', 'INTERJECTION': 'Interjection',
    'article': 'Article', 'art.': 'Article', 'ARTICLE': 'Article',
    'numeral': 'Numeral', 'num.': 'Numeral', 'NUMERAL': 'Numeral',
    'auxiliary': 'Auxiliary', 'aux.': 'Auxiliary', 'AUXILIARY': 'Auxiliary',
    'modal': 'Modal', 'modal.': 'Modal', 'MODAL': 'Modal',
    'determiner': 'Determiner', 'det.': 'Determiner', 'DETERMINER': 'Determiner',
    'prefix': 'Prefix', 'prefix.': 'Prefix', 'PREFIX': 'Prefix',
    'suffix': 'Suffix', 'suffix.': 'Suffix', 'SUFFIX': 'Suffix',
  }
};

// 特殊标签的多语言映射
const specialLabelMap: Record<string, Record<string, string>> = {
  'zh-CN': {
    'slang': '俚语/缩写',
    'phrase': '短语',
  },
  'en-US': {
    'slang': 'Slang/Abbr',
    'phrase': 'Phrase',
  }
};

const getPartOfSpeechLabel = (pos: string, lang: string) => {
  if (!pos) return '';
  const map = partOfSpeechMap[lang] || partOfSpeechMap['en-US'];
  // 统一小写查找
  return map[pos.trim().toLowerCase()] || map[pos.trim()] || pos;
};

const getSpecialLabel = (type: 'slang' | 'phrase', lang: string) => {
  const map = specialLabelMap[lang] || specialLabelMap['en-US'];
  return map[type] || type;
};

const WordCardContent: React.FC<WordCardContentProps> = ({ wordData, onPlayAudio, style }) => {
  const { appLanguage } = useAppLanguage();
  const handlePlayAudio = async () => {
    try {
      if (wordData.audioUrl) {
        const { sound } = await Audio.Sound.createAsync({ uri: wordData.audioUrl });
        await sound.playAsync();
      }
    } catch (e) {
      console.error('播放音频失败:', e);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* 头部：单词、音标、发音按钮 */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.wordContainer}>
            <Text style={styles.word}>{wordData.correctedWord || wordData.word}</Text>
          </View>
          <Text style={styles.phonetic}>{wordData.phonetic}</Text>
        </View>
        <TouchableOpacity style={styles.audioButton} onPress={handlePlayAudio} activeOpacity={0.7}>
          <Ionicons name="volume-medium" size={22} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>
      {/* 主体内容区：无滚动，全部展示 */}
      <View style={{ marginBottom: 8 }}>
        {wordData.definitions.map((def, idx) => (
          <View key={idx} style={styles.definitionBlock}>
            <View style={styles.posTagWrapper}>
              <Text style={styles.posTag}>{getPartOfSpeechLabel(def.partOfSpeech, appLanguage)}</Text>
            </View>
            <Text style={styles.definition}>{def.definition}</Text>
            {def.examples && def.examples.length > 0 && (
              <View style={styles.examplesBlock}>
                {def.examples.map((ex, exIdx) => (
                  <View key={exIdx} style={styles.exampleContainer}>
                    <Text style={styles.exampleLabelAndText}>{ex.english}</Text>
                    <Text style={styles.exampleLabelAndText}>{ex.chinese}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
        
        {/* 俚语/缩写含义 */}
        {wordData.slangMeaning && (
          <View style={styles.specialBlock}>
            <View style={styles.specialTagWrapper}>
              <Text style={styles.specialTag}>{getSpecialLabel('slang', appLanguage)}</Text>
            </View>
            <Text style={styles.specialContent}>{wordData.slangMeaning}</Text>
          </View>
        )}
        
        {/* 短语解释 */}
        {wordData.phraseExplanation && (
          <View style={styles.specialBlock}>
            <View style={styles.specialTagWrapper}>
              <Text style={styles.specialTag}>{getSpecialLabel('phrase', appLanguage)}</Text>
            </View>
            <Text style={styles.specialContent}>{wordData.phraseExplanation}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingVertical: 0,
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
  exampleLabelAndText: {
    fontSize: 15,
    color: '#888',
    fontStyle: 'italic',
  },
  specialBlock: {
    marginTop: 12,
    marginBottom: 8,
  },
  specialTagWrapper: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  specialTag: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    fontSize: 13,
    fontWeight: 'bold',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
    marginBottom: 2,
  },
  specialContent: {
    fontSize: 16,
    color: '#222',
    marginBottom: 6,
    lineHeight: 22,
  },
});

export default WordCardContent; 