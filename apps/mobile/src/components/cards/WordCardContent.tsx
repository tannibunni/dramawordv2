import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { WordData } from './WordCard';
import { Audio } from 'expo-av';
import { SUPPORTED_LANGUAGES } from '../../constants/config';

interface WordCardContentProps {
  wordData: WordData;
  onPlayAudio?: (word: string) => void;
  style?: any;
  scrollable?: boolean; // 是否支持滚动
  onScroll?: (event: any) => void; // 滚动事件回调
  showHeader?: boolean; // 是否显示头部（单词、音标、发音按钮）
  onProgressUpdate?: (progressData: {
    mastery?: number;
    reviewCount?: number;
    correctCount?: number;
    incorrectCount?: number;
    consecutiveCorrect?: number;
    consecutiveIncorrect?: number;
    lastReviewDate?: string;
    nextReviewDate?: string;
    interval?: number;
    easeFactor?: number;
    totalStudyTime?: number;
    averageResponseTime?: number;
    confidence?: number;
    notes?: string;
    tags?: string[];
  }) => void; // 学习进度更新回调
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
    // 韩语词性映射
    '명사': '名词', '명': '名词',
    '동사': '动词', '동': '动词',
    '형용사': '形容词', '형': '形容词',
    '부사': '副词', '부': '副词',
    '대명사': '代词', '대': '代词',
    '전치사': '介词', '전': '介词',
    '접속사': '连词', '접': '连词',
    '감탄사': '感叹词', '감': '感叹词',
    '관사': '冠词', '관': '冠词',
    '수사': '数词', '수': '数词',
    '조동사': '助动词', '조': '助动词',
    '한정사': '限定词', '한': '限定词',
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
    // 韩语词性映射（英文界面）
    '명사': 'Noun', '명': 'Noun',
    '동사': 'Verb', '동': 'Verb',
    '형용사': 'Adjective', '형': 'Adjective',
    '부사': 'Adverb', '부': 'Adverb',
    '대명사': 'Pronoun', '대': 'Pronoun',
    '전치사': 'Preposition', '전': 'Preposition',
    '접속사': 'Conjunction', '접': 'Conjunction',
    '감탄사': 'Interjection', '감': 'Interjection',
    '관사': 'Article', '관': 'Article',
    '수사': 'Numeral', '수': 'Numeral',
    '조동사': 'Auxiliary', '조': 'Auxiliary',
    '한정사': 'Determiner', '한': 'Determiner',
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

// 辅助函数：根据语言获取例句显示内容
const getExampleDisplay = (example: any, targetLanguage: string) => {
  const languageMap: { [key: string]: string[] } = {
    'en': ['english', 'chinese'],
    'fr': ['french', 'chinese'],
    'es': ['spanish', 'chinese'],
    'ja': ['japanese', 'chinese'],
    'ko': ['korean', 'chinese'],
    'zh-CN': ['chinese', 'english']
  };
  
  const fields = languageMap[targetLanguage] || ['english', 'chinese'];
  const [primaryField, secondaryField] = fields;
  
  return {
    primary: example[primaryField] || '',
    secondary: example[secondaryField] || ''
  };
};

// 获取语言标签显示
const getLanguageLabel = (languageCode: string, appLanguage: string) => {
  // 根据语言代码找到对应的语言配置
  const languageEntry = Object.values(SUPPORTED_LANGUAGES).find(
    lang => lang.code === languageCode
  );
  
  if (!languageEntry) {
    return { flag: '🌐', name: languageCode.toUpperCase() };
  }
  
  // 根据当前UI语言返回对应的显示文本
  if (appLanguage === 'zh-CN') {
    return {
      flag: languageEntry.flag,
      name: languageEntry.name // 中文界面显示中文名称
    };
  } else {
    return {
      flag: languageEntry.flag,
      name: languageEntry.nativeName // 英文界面显示原生名称
    };
  }
};

const WordCardContent: React.FC<WordCardContentProps> = ({ wordData, onPlayAudio, style, scrollable = false, onScroll, showHeader = true }) => {
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
      {showHeader && (
        <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          {/* 语言标签 */}
          {wordData.language && (
            <View style={styles.languageTagContainer}>
              {(() => {
                console.log('🔍 语言标签调试:', { 
                  wordDataLanguage: wordData.language, 
                  appLanguage: appLanguage 
                });
                const languageLabel = getLanguageLabel(wordData.language, appLanguage);
                console.log('🔍 语言标签结果:', languageLabel);
                return (
                  <View style={styles.languageTag}>
                    <Text style={styles.languageFlag}>{languageLabel.flag}</Text>
                    <Text style={styles.languageName}>{languageLabel.name}</Text>
                  </View>
                );
              })()}
            </View>
          )}
          <View style={styles.wordContainer}>
            <Text style={styles.word} selectable>{wordData.correctedWord || wordData.word}</Text>
            {wordData.kana && (
              <Text style={styles.kana} selectable>{wordData.kana}</Text>
            )}
          </View>
          {/* 中文单词特殊显示：优先显示拼音，然后是音标 */}
          {wordData.language === 'zh' || wordData.language === 'zh-CN' ? (
            <View style={styles.chinesePhoneticContainer}>
              {wordData.pinyin && (
                <Text style={styles.pinyin} selectable>{wordData.pinyin}</Text>
              )}
              {wordData.phonetic && (
                <Text style={styles.phonetic} selectable>{wordData.phonetic}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.phonetic} selectable>
              {wordData.pinyin || wordData.phonetic}
            </Text>
          )}
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
                    {src.type === 'wordbook' ? `来源：${src.name}` : `来源：${src.name}`}
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
      )}
      {/* 主体内容区：根据scrollable属性决定是否滚动 */}
      {scrollable ? (
        <ScrollView
          style={{ marginBottom: 8 }}
          showsVerticalScrollIndicator={true}
          indicatorStyle="black"
          persistentScrollbar={true}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {wordData.definitions.map((def, idx) => (
            <View key={idx} style={styles.definitionBlock}>
              <View style={styles.posTagWrapper}>
                <Text style={styles.posTag}>{getPartOfSpeechLabel(def.partOfSpeech, appLanguage)}</Text>
              </View>
              <Text style={styles.definition} selectable>{def.definition}</Text>
              {def.examples && def.examples.length > 0 && (
                <View style={styles.examplesBlock}>
                  {def.examples.map((ex, exIdx) => {
                    // 根据单词语言确定例句显示内容
                    const getExampleText = () => {
                      const example = ex as any; // 类型断言
                      if (wordData.language === 'ja') {
                        // 日语：显示日语例句
                        return example.english || example.japanese || '';
                      } else if (wordData.language === 'ko') {
                        // 韩语：显示韩语例句
                        return example.english || example.korean || '';
                      } else if (wordData.language === 'fr') {
                        // 法语：显示法语例句
                        return example.english || example.french || '';
                      } else if (wordData.language === 'es') {
                        // 西班牙语：显示西班牙语例句
                        return example.english || example.spanish || '';
                      } else {
                        // 英语或其他语言：显示英语例句
                        return example.english || '';
                      }
                    };

                    return (
                      <View key={exIdx} style={styles.exampleContainer}>
                        <Text style={styles.exampleLabelAndText} selectable>{getExampleText()}</Text>
                        <Text style={styles.exampleLabelAndText} selectable>{ex.chinese}</Text>
                        {/* 中文例句拼音显示 */}
                        {wordData.language === 'zh' || wordData.language === 'zh-CN' ? (
                          ex.pinyin && (
                            <Text style={styles.examplePinyin} selectable>{ex.pinyin}</Text>
                          )
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
          
          {/* 俚语/缩写含义 */}
          {wordData.slangMeaning && (
            <View style={styles.definitionBlock}>
              <View style={styles.posTagWrapper}>
                <Text style={styles.posTag}>{getSpecialLabel('slang', appLanguage)}</Text>
              </View>
              {typeof wordData.slangMeaning === 'string' ? (
                <Text style={styles.definition} selectable>{wordData.slangMeaning}</Text>
              ) : (
                <>
                  <Text style={styles.definition} selectable>{(wordData.slangMeaning as any)?.definition}</Text>
                  {(wordData.slangMeaning as any)?.examples && (wordData.slangMeaning as any).examples.length > 0 && (
                    <View style={styles.examplesBlock}>
                      {(wordData.slangMeaning as any).examples.map((ex: any, exIdx: number) => (
                          <View key={exIdx} style={styles.exampleContainer}>
                          <Text style={styles.exampleLabelAndText} selectable>{ex.english}</Text>
                          <Text style={styles.exampleLabelAndText} selectable>{ex.chinese}</Text>
                        {/* 中文例句拼音显示 */}
                        {wordData.language === 'zh' || wordData.language === 'zh-CN' ? (
                          ex.pinyin && (
                            <Text style={styles.examplePinyin} selectable>{ex.pinyin}</Text>
                          )
                        ) : null}
                          </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          )}
          
          {/* 短语解释 */}
          {wordData.phraseExplanation && (
            <View style={styles.definitionBlock}>
              <View style={styles.posTagWrapper}>
                <Text style={styles.posTag}>{getSpecialLabel('phrase', appLanguage)}</Text>
              </View>
              {typeof wordData.phraseExplanation === 'string' ? (
                <Text style={styles.definition} selectable>{wordData.phraseExplanation}</Text>
              ) : (
                <>
                  <Text style={styles.definition} selectable>{(wordData.phraseExplanation as any)?.definition}</Text>
                  {(wordData.phraseExplanation as any)?.examples && (wordData.phraseExplanation as any).examples.length > 0 && (
                    <View style={styles.examplesBlock}>
                      {(wordData.phraseExplanation as any).examples.map((ex: any, exIdx: number) => (
                          <View key={exIdx} style={styles.exampleContainer}>
                          <Text style={styles.exampleLabelAndText} selectable>{ex.english}</Text>
                          <Text style={styles.exampleLabelAndText} selectable>{ex.chinese}</Text>
                        {/* 中文例句拼音显示 */}
                        {wordData.language === 'zh' || wordData.language === 'zh-CN' ? (
                          ex.pinyin && (
                            <Text style={styles.examplePinyin} selectable>{ex.pinyin}</Text>
                          )
                        ) : null}
                          </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={{ marginBottom: 8 }}>
          {wordData.definitions.map((def, idx) => (
            <View key={idx} style={styles.definitionBlock}>
              <View style={styles.posTagWrapper}>
                <Text style={styles.posTag}>{getPartOfSpeechLabel(def.partOfSpeech, appLanguage)}</Text>
              </View>
              <Text style={styles.definition} selectable>{def.definition}</Text>
              {def.examples && def.examples.length > 0 && (
                <View style={styles.examplesBlock}>
                  {def.examples.map((ex, exIdx) => {
                    // 根据单词语言确定例句显示内容
                    const getExampleText = () => {
                      const example = ex as any; // 类型断言
                      if (wordData.language === 'ja') {
                        // 日语：显示日语例句
                        return example.english || example.japanese || '';
                      } else if (wordData.language === 'ko') {
                        // 韩语：显示韩语例句
                        return example.english || example.korean || '';
                      } else if (wordData.language === 'fr') {
                        // 法语：显示法语例句
                        return example.english || example.french || '';
                      } else if (wordData.language === 'es') {
                        // 西班牙语：显示西班牙语例句
                        return example.english || example.spanish || '';
                      } else {
                        // 英语或其他语言：显示英语例句
                        return example.english || '';
                      }
                    };

                    return (
                      <View key={exIdx} style={styles.exampleContainer}>
                        <Text style={styles.exampleLabelAndText} selectable>{getExampleText()}</Text>
                        <Text style={styles.exampleLabelAndText} selectable>{ex.chinese}</Text>
                        {/* 中文例句拼音显示 */}
                        {wordData.language === 'zh' || wordData.language === 'zh-CN' ? (
                          ex.pinyin && (
                            <Text style={styles.examplePinyin} selectable>{ex.pinyin}</Text>
                          )
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
          
          {/* 俚语/缩写含义 */}
          {wordData.slangMeaning && (
            <View style={styles.definitionBlock}>
              <View style={styles.posTagWrapper}>
                <Text style={styles.posTag}>{getSpecialLabel('slang', appLanguage)}</Text>
              </View>
              {typeof wordData.slangMeaning === 'string' ? (
                <Text style={styles.definition} selectable>{wordData.slangMeaning}</Text>
              ) : (
                <>
                  <Text style={styles.definition} selectable>{(wordData.slangMeaning as any)?.definition}</Text>
                  {(wordData.slangMeaning as any)?.examples && (wordData.slangMeaning as any).examples.length > 0 && (
                    <View style={styles.examplesBlock}>
                      {(wordData.slangMeaning as any).examples.map((ex: any, exIdx: number) => (
                        <View key={exIdx} style={styles.exampleContainer}>
                          <Text style={styles.exampleLabelAndText} selectable>{ex.english}</Text>
                          <Text style={styles.exampleLabelAndText} selectable>{ex.chinese}</Text>
                        {/* 中文例句拼音显示 */}
                        {wordData.language === 'zh' || wordData.language === 'zh-CN' ? (
                          ex.pinyin && (
                            <Text style={styles.examplePinyin} selectable>{ex.pinyin}</Text>
                          )
                        ) : null}
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          )}
          
          {/* 短语解释 */}
          {wordData.phraseExplanation && (
            <View style={styles.definitionBlock}>
              <View style={styles.posTagWrapper}>
                <Text style={styles.posTag}>{getSpecialLabel('phrase', appLanguage)}</Text>
              </View>
              {typeof wordData.phraseExplanation === 'string' ? (
                <Text style={styles.definition} selectable>{wordData.phraseExplanation}</Text>
              ) : (
                <>
                  <Text style={styles.definition} selectable>{(wordData.phraseExplanation as any)?.definition}</Text>
                  {(wordData.phraseExplanation as any)?.examples && (wordData.phraseExplanation as any).examples.length > 0 && (
                    <View style={styles.examplesBlock}>
                      {(wordData.phraseExplanation as any).examples.map((ex: any, exIdx: number) => (
                        <View key={exIdx} style={styles.exampleContainer}>
                          <Text style={styles.exampleLabelAndText} selectable>{ex.english}</Text>
                          <Text style={styles.exampleLabelAndText} selectable>{ex.chinese}</Text>
                        {/* 中文例句拼音显示 */}
                        {wordData.language === 'zh' || wordData.language === 'zh-CN' ? (
                          ex.pinyin && (
                            <Text style={styles.examplePinyin} selectable>{ex.pinyin}</Text>
                          )
                        ) : null}
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'flex-start', // 改为左对齐，避免内容居中
    justifyContent: 'flex-start', // 改为顶部对齐，避免垂直居中
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
  chinesePhoneticContainer: {
    marginTop: 2,
  },
  pinyin: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  examplePinyin: {
    fontSize: 13,
    color: '#999',
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
  kana: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  sourceTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  sourceTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
  },
  wordbookTag: {
    backgroundColor: '#e8f5e8',
  },
  sourceTagText: {
    fontSize: 12,
    color: '#666',
  },
  languageTagContainer: {
    marginBottom: 6,
  },
  languageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  languageFlag: {
    fontSize: 16,
    marginRight: 4,
  },
  languageName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
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
});

export default WordCardContent; 