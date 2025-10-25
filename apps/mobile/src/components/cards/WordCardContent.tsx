import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { WordData } from './WordCard';
import { Audio } from 'expo-av';
import { SUPPORTED_LANGUAGES } from '../../constants/config';
import audioService from '../../services/audioService';
import { t } from '../../constants/translations';
import { LanguageDisplayStrategyFactory } from './strategies/LanguageDisplayStrategyFactory';

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
    'sentence': '句子', 'sent.': '句子', 'SENTENCE': '句子',
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
    'sentence': 'Sentence', 'sent.': 'Sentence', 'SENTENCE': 'Sentence',
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
    // 中文词性映射（英文界面）
    '名词': 'Noun', '名': 'Noun',
    '动词': 'Verb', '动': 'Verb',
    '形容词': 'Adjective', '形': 'Adjective',
    '副词': 'Adverb', '副': 'Adverb',
    '代词': 'Pronoun', '代': 'Pronoun',
    '介词': 'Preposition', '介': 'Preposition',
    '连词': 'Conjunction', '连': 'Conjunction',
    '感叹词': 'Interjection', '叹': 'Interjection',
    '冠词': 'Article', '冠': 'Article',
    '数词': 'Numeral', '数': 'Numeral',
    '助动词': 'Auxiliary', '助': 'Auxiliary',
    '限定词': 'Determiner', '限': 'Determiner',
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
  if (!pos || pos.trim() === '') {
    console.log('⚠️ partOfSpeech为空，不显示词性标签:', { pos, lang });
    return null; // 返回 null 而不是空字符串
  }
  const map = partOfSpeechMap[lang] || partOfSpeechMap['en-US'];
  // 统一小写查找
  const result = map[pos.trim().toLowerCase()] || map[pos.trim()] || pos;
  console.log('🏷️ 词性映射:', { pos, lang, result, map: map[pos.trim().toLowerCase()] });
  return result;
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
    // 英文界面特殊处理
    if (languageCode === 'zh' || languageCode === 'zh-CN') {
      return {
        flag: languageEntry.flag,
        name: 'Chinese' // 英文界面显示 "Chinese"
      };
    }
    return {
      flag: languageEntry.flag,
      name: languageEntry.nativeName // 其他语言显示原生名称
    };
  }
};

// 获取翻译来源文本
const getTranslationSourceText = (source: string, language: string = 'zh-CN'): string => {
  switch (source) {
    case 'azure_translation':
      return t('translation_from_azure', language as any);
    case 'google_translation':
      return t('translation_from_google', language as any);
    case 'openai_translation':
    case 'openai': // 添加对"openai"的支持
      return t('translation_from_openai', language as any);
    case 'memory_cache':
    case 'database_cache':
      return t('translation_from_cache', language as any);
    default:
      return t('translation_from_cache', language as any);
  }
};

const WordCardContent: React.FC<WordCardContentProps> = ({ wordData, onPlayAudio, style, scrollable = false, onScroll, showHeader = true }) => {
  const { appLanguage } = useAppLanguage();
  
  // 获取语言显示策略
  const displayStrategy = LanguageDisplayStrategyFactory.getStrategy(wordData.language || 'en');
  
  // 调试信息：显示所有OpenAI返回的字段
  console.log('🔍 WordCardContent渲染数据:', {
    word: wordData.word,
    correctedWord: wordData.correctedWord,
    phonetic: wordData.phonetic,
    pinyin: wordData.pinyin,
    candidates: wordData.candidates,
    definitionsCount: wordData.definitions?.length,
    definitions: wordData.definitions,
    slangMeaning: wordData.slangMeaning,
    phraseExplanation: wordData.phraseExplanation,
    translationSource: wordData.translationSource,
    language: wordData.language
  });
  
  // 详细检查definitions中的partOfSpeech
  if (wordData.definitions && wordData.definitions.length > 0) {
    wordData.definitions.forEach((def, index) => {
      console.log(`📝 Definition ${index}:`, {
        partOfSpeech: def.partOfSpeech,
        definition: def.definition,
        examples: def.examples
      });
    });
  }
  
  // 检查内容是否有效（不是"无内容"的提示）
  const hasValidSlangMeaning = (slang: any) => {
    if (!slang) return false;
    if (typeof slang === 'string') {
      return !slang.includes('No slang or informal meaning available') && 
             !slang.includes('No slang meaning available');
    }
    return true;
  };
  
  const hasValidPhraseExplanation = (phrase: any) => {
    if (!phrase) return false;
    if (typeof phrase === 'string') {
      return !phrase.includes('No specific phrase explanation') && 
             !phrase.includes('No phrase explanation available');
    }
    return true;
  };
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

  // 例句发音处理函数
  const handlePlayExampleAudio = async (exampleText: string, language?: string) => {
    try {
      await audioService.playWordPronunciation(exampleText, language);
    } catch (error) {
      console.error('播放例句发音失败:', error);
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
                const languageLabel = getLanguageLabel(wordData.language, appLanguage);
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
            <Text style={styles.word} selectable>{displayStrategy.getMainWord(wordData)}</Text>
          </View>
          {/* 候选词选择界面 */}
          {wordData.candidates && wordData.candidates.length > 1 && (
            <View style={styles.candidatesContainer}>
              <Text style={styles.candidatesLabel}>选择正确的词：</Text>
              <View style={styles.candidatesList}>
                {wordData.candidates.map((candidate: any, index) => {
                  // 🔧 处理拼音候选词对象格式
                  const candidateText = typeof candidate === 'string' 
                    ? candidate 
                    : (typeof candidate === 'object' && candidate.chinese) 
                      ? String(candidate.chinese)
                      : String(candidate);
                  const candidateKey = typeof candidate === 'string' 
                    ? candidate 
                    : (typeof candidate === 'object' && candidate.chinese)
                      ? String(candidate.chinese)
                      : `candidate-${index}`;
                  
                  return (
                    <TouchableOpacity
                      key={candidateKey}
                      style={[
                        styles.candidateButton,
                        candidateText === (wordData.translation || wordData.correctedWord || wordData.word) && styles.selectedCandidate
                      ]}
                      onPress={() => {
                        // 选择候选词的逻辑
                        console.log(`选择了候选词: ${candidateText}`);
                        // 更新wordData中的翻译结果
                        if (wordData.onCandidateSelect) {
                          wordData.onCandidateSelect(candidateText);
                        }
                      }}
                    >
                      <Text style={[
                        styles.candidateText,
                        candidateText === (wordData.translation || wordData.correctedWord || wordData.word) && styles.selectedCandidateText
                      ]}>
                        {String(candidateText)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
          {/* 显示假名和音标 */}
          {displayStrategy.shouldShowKana() && displayStrategy.getKanaText(wordData) && (
            <Text style={styles.kana} selectable>
              {displayStrategy.getKanaText(wordData)}
            </Text>
          )}
          {displayStrategy.shouldShowPhonetic() && displayStrategy.getPhonetic(wordData) && (
            <Text style={styles.phonetic} selectable>
              {displayStrategy.getPhonetic(wordData)}
            </Text>
          )}
          {/* 翻译来源标注 */}
          {wordData.translationSource && (
            <View style={styles.translationSourceContainer}>
              <Text style={styles.translationSourceText}>
                {getTranslationSourceText(wordData.translationSource)}
              </Text>
            </View>
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
          {wordData.definitions?.map((def, idx) => (
            <View key={idx} style={styles.definitionBlock}>
              {getPartOfSpeechLabel(def.partOfSpeech, appLanguage) && (
                <View style={styles.posTagWrapper}>
                  <Text style={styles.posTag}>{getPartOfSpeechLabel(def.partOfSpeech, appLanguage)}</Text>
                </View>
              )}
              <Text style={styles.definition} selectable>{def.definition}</Text>
              {def.examples && def.examples.length > 0 && (
                <View style={styles.examplesBlock}>
                  {/* 例句section标签 */}
                  <View style={styles.examplesHeader}>
                    {/* 只有中文界面才显示"例句"标签 */}
                    {appLanguage === 'zh-CN' && (
                      <Text style={styles.examplesLabel}>例句</Text>
                    )}
                  </View>
                  {def.examples.map((ex, exIdx) => {
                    // 根据单词语言确定例句显示内容
                    const getExampleText = () => {
                      const example = ex as any; // 类型断言
                      if (wordData.language === 'ja') {
                        // 日语：显示日语例句
                        const result = example.japanese || example.english || '';
                        return result;
                      } else if (wordData.language === 'ko') {
                        // 韩语：显示韩语例句
                        return example.korean || example.english || '';
                      } else if (wordData.language === 'fr') {
                        // 法语：显示法语例句
                        return example.french || example.english || '';
                      } else if (wordData.language === 'es') {
                        // 西班牙语：显示西班牙语例句
                        return example.spanish || example.english || '';
                      } else {
                        // 英语或其他语言：显示英语例句
                        return example.english || '';
                      }
                    };

                    // 获取例句发音文本
                    const getExampleAudioText = () => {
                      const example = ex as any;
                      if (wordData.language === 'zh' || wordData.language === 'zh-CN') {
                        // 中文词汇：播放中文例句
                        return example.chinese || '';
                      } else if (wordData.language === 'ja') {
                        // 日语：播放日语例句
                        return example.japanese || example.english || '';
                      } else if (wordData.language === 'ko') {
                        // 韩语：播放韩语例句
                        return example.korean || example.english || '';
                      } else if (wordData.language === 'fr') {
                        // 法语：播放法语例句
                        return example.french || example.english || '';
                      } else if (wordData.language === 'es') {
                        // 西班牙语：播放西班牙语例句
                        return example.spanish || example.english || '';
                      } else {
                        // 英语或其他语言：播放英语例句
                        return example.english || '';
                      }
                    };

                    return (
                      <View key={exIdx} style={styles.exampleContainer}>
                        {/* 例句文本内容 */}
                        <View style={styles.exampleTextContainer}>
                          <Text style={styles.exampleLabelAndText} selectable>{getExampleText()}</Text>
                          {/* 根据语言显示对应的释义 */}
                          {wordData.language === 'zh' || wordData.language === 'zh-CN' ? (
                            <Text style={styles.exampleChineseText} selectable>{ex.chinese}</Text>
                          ) : wordData.language === 'ja' ? (
                            <Text style={styles.exampleChineseText} selectable>{ex.english}</Text>
                          ) : (
                            <Text style={styles.exampleChineseText} selectable>{ex.english}</Text>
                          )}
                          {/* 中文例句拼音显示 */}
                          {wordData.language === 'zh' || wordData.language === 'zh-CN' ? (
                            ex.pinyin && (
                              <Text style={styles.examplePinyin} selectable>{ex.pinyin}</Text>
                            )
                          ) : null}
                          {/* 日语例句罗马音显示 */}
                          {wordData.language === 'ja' ? (
                            ex.romaji && (
                              <Text style={styles.examplePinyin} selectable>{ex.romaji}</Text>
                            )
                          ) : null}
                        </View>
                        {/* 每个例句的独立发音按钮 - 放在文本下方 */}
                        <View style={styles.exampleAudioContainer}>
                          <TouchableOpacity 
                            style={styles.exampleAudioButton}
                            onPress={() => {
                              const audioText = getExampleAudioText();
                              if (audioText) {
                                handlePlayExampleAudio(audioText, wordData.language);
                              }
                            }}
                          >
                            <Ionicons name="volume-high" size={16} color={colors.primary[500]} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
          
          {/* 俚语/缩写含义 */}
          {hasValidSlangMeaning(wordData.slangMeaning) && (
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
                      {/* 俚语例句section发音按钮 */}
                      <View style={styles.examplesHeader}>
                        <Text style={styles.examplesLabel}>例句</Text>
                        {/* 只有中文词汇才显示例句发音按钮 */}
                        {(wordData.language === 'zh' || wordData.language === 'zh-CN') && (
                          <TouchableOpacity 
                            style={styles.examplesAudioButton}
                            onPress={() => {
                              // 播放第一个中文例句
                              const firstChineseExample = (wordData.slangMeaning as any).examples.find((ex: any) => ex.chinese);
                              if (firstChineseExample) {
                                handlePlayExampleAudio(firstChineseExample.chinese, 'zh');
                              }
                            }}
                          >
                            <Ionicons name="volume-high" size={18} color={colors.primary[500]} />
                          </TouchableOpacity>
                        )}
                      </View>
                      {(wordData.slangMeaning as any).examples.map((ex: any, exIdx: number) => (
                          <View key={exIdx} style={styles.exampleContainer}>
                          <Text style={styles.exampleLabelAndText} selectable>{ex.english}</Text>
                          {/* 根据语言显示对应的释义 */}
                          {wordData.language === 'zh' || wordData.language === 'zh-CN' ? (
                            <Text style={styles.exampleChineseText} selectable>{ex.chinese}</Text>
                          ) : wordData.language === 'ja' ? (
                            <Text style={styles.exampleChineseText} selectable>{ex.english}</Text>
                          ) : (
                            <Text style={styles.exampleChineseText} selectable>{ex.english}</Text>
                          )}
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
          {hasValidPhraseExplanation(wordData.phraseExplanation) && (
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
                      {/* 短语解释例句section发音按钮 */}
                      <View style={styles.examplesHeader}>
                        <Text style={styles.examplesLabel}>例句</Text>
                        {/* 只有中文词汇才显示例句发音按钮 */}
                        {(wordData.language === 'zh' || wordData.language === 'zh-CN') && (
                          <TouchableOpacity 
                            style={styles.examplesAudioButton}
                            onPress={() => {
                              // 播放第一个中文例句
                              const firstChineseExample = (wordData.phraseExplanation as any).examples.find((ex: any) => ex.chinese);
                              if (firstChineseExample) {
                                handlePlayExampleAudio(firstChineseExample.chinese, 'zh');
                              }
                            }}
                          >
                            <Ionicons name="volume-high" size={18} color={colors.primary[500]} />
                          </TouchableOpacity>
                        )}
                      </View>
                      {(wordData.phraseExplanation as any).examples.map((ex: any, exIdx: number) => (
                          <View key={exIdx} style={styles.exampleContainer}>
                          <Text style={styles.exampleLabelAndText} selectable>{ex.english}</Text>
                          {/* 根据语言显示对应的释义 */}
                          {wordData.language === 'zh' || wordData.language === 'zh-CN' ? (
                            <Text style={styles.exampleChineseText} selectable>{ex.chinese}</Text>
                          ) : wordData.language === 'ja' ? (
                            <Text style={styles.exampleChineseText} selectable>{ex.english}</Text>
                          ) : (
                            <Text style={styles.exampleChineseText} selectable>{ex.english}</Text>
                          )}
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
          {wordData.definitions?.map((def, idx) => (
            <View key={idx} style={styles.definitionBlock}>
              {getPartOfSpeechLabel(def.partOfSpeech, appLanguage) && (
                <View style={styles.posTagWrapper}>
                  <Text style={styles.posTag}>{getPartOfSpeechLabel(def.partOfSpeech, appLanguage)}</Text>
                </View>
              )}
              <Text style={styles.definition} selectable>{def.definition}</Text>
              {def.examples && def.examples.length > 0 && (
                <View style={styles.examplesBlock}>
                  {/* 例句section标签 */}
                  <View style={styles.examplesHeader}>
                    {/* 只有中文界面才显示"例句"标签 */}
                    {appLanguage === 'zh-CN' && (
                      <Text style={styles.examplesLabel}>例句</Text>
                    )}
                  </View>
                  {def.examples.map((ex, exIdx) => {
                    // 根据单词语言确定例句显示内容
                    const getExampleText = () => {
                      const example = ex as any; // 类型断言
                      if (wordData.language === 'ja') {
                        // 日语：显示日语例句
                        const result = example.japanese || example.english || '';
                        return result;
                      } else if (wordData.language === 'ko') {
                        // 韩语：显示韩语例句
                        return example.korean || example.english || '';
                      } else if (wordData.language === 'fr') {
                        // 法语：显示法语例句
                        return example.french || example.english || '';
                      } else if (wordData.language === 'es') {
                        // 西班牙语：显示西班牙语例句
                        return example.spanish || example.english || '';
                      } else {
                        // 英语或其他语言：显示英语例句
                        return example.english || '';
                      }
                    };

                    // 获取例句发音文本
                    const getExampleAudioText = () => {
                      const example = ex as any;
                      if (wordData.language === 'zh' || wordData.language === 'zh-CN') {
                        // 中文词汇：播放中文例句
                        return example.chinese || '';
                      } else if (wordData.language === 'ja') {
                        // 日语：播放日语例句
                        return example.japanese || example.english || '';
                      } else if (wordData.language === 'ko') {
                        // 韩语：播放韩语例句
                        return example.korean || example.english || '';
                      } else if (wordData.language === 'fr') {
                        // 法语：播放法语例句
                        return example.french || example.english || '';
                      } else if (wordData.language === 'es') {
                        // 西班牙语：播放西班牙语例句
                        return example.spanish || example.english || '';
                      } else {
                        // 英语或其他语言：播放英语例句
                        return example.english || '';
                      }
                    };

                    return (
                      <View key={exIdx} style={styles.exampleContainer}>
                        {/* 例句文本内容 */}
                        <View style={styles.exampleTextContainer}>
                          <Text style={styles.exampleLabelAndText} selectable>{getExampleText()}</Text>
                          {/* 根据语言显示对应的释义 */}
                          {wordData.language === 'zh' || wordData.language === 'zh-CN' ? (
                            <Text style={styles.exampleChineseText} selectable>{ex.chinese}</Text>
                          ) : wordData.language === 'ja' ? (
                            <Text style={styles.exampleChineseText} selectable>{ex.english}</Text>
                          ) : (
                            <Text style={styles.exampleChineseText} selectable>{ex.english}</Text>
                          )}
                          {/* 中文例句拼音显示 */}
                          {wordData.language === 'zh' || wordData.language === 'zh-CN' ? (
                            ex.pinyin && (
                              <Text style={styles.examplePinyin} selectable>{ex.pinyin}</Text>
                            )
                          ) : null}
                          {/* 日语例句罗马音显示 */}
                          {wordData.language === 'ja' ? (
                            ex.romaji && (
                              <Text style={styles.examplePinyin} selectable>{ex.romaji}</Text>
                            )
                          ) : null}
                        </View>
                        {/* 每个例句的独立发音按钮 - 放在文本下方 */}
                        <View style={styles.exampleAudioContainer}>
                          <TouchableOpacity 
                            style={styles.exampleAudioButton}
                            onPress={() => {
                              const audioText = getExampleAudioText();
                              if (audioText) {
                                handlePlayExampleAudio(audioText, wordData.language);
                              }
                            }}
                          >
                            <Ionicons name="volume-high" size={16} color={colors.primary[500]} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
          
          {/* 俚语/缩写含义 */}
          {hasValidSlangMeaning(wordData.slangMeaning) && (
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
                      {/* 俚语例句section发音按钮 */}
                      <View style={styles.examplesHeader}>
                        <Text style={styles.examplesLabel}>例句</Text>
                        {/* 只有中文词汇才显示例句发音按钮 */}
                        {(wordData.language === 'zh' || wordData.language === 'zh-CN') && (
                          <TouchableOpacity 
                            style={styles.examplesAudioButton}
                            onPress={() => {
                              // 播放第一个中文例句
                              const firstChineseExample = (wordData.slangMeaning as any).examples.find((ex: any) => ex.chinese);
                              if (firstChineseExample) {
                                handlePlayExampleAudio(firstChineseExample.chinese, 'zh');
                              }
                            }}
                          >
                            <Ionicons name="volume-high" size={18} color={colors.primary[500]} />
                          </TouchableOpacity>
                        )}
                      </View>
                      {(wordData.slangMeaning as any).examples.map((ex: any, exIdx: number) => (
                        <View key={exIdx} style={styles.exampleContainer}>
                          <Text style={styles.exampleLabelAndText} selectable>{ex.english}</Text>
                          {/* 根据语言显示对应的释义 */}
                          {wordData.language === 'zh' || wordData.language === 'zh-CN' ? (
                            <Text style={styles.exampleChineseText} selectable>{ex.chinese}</Text>
                          ) : wordData.language === 'ja' ? (
                            <Text style={styles.exampleChineseText} selectable>{ex.english}</Text>
                          ) : (
                            <Text style={styles.exampleChineseText} selectable>{ex.english}</Text>
                          )}
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
          {hasValidPhraseExplanation(wordData.phraseExplanation) && (
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
                      {/* 短语解释例句section发音按钮 */}
                      <View style={styles.examplesHeader}>
                        <Text style={styles.examplesLabel}>例句</Text>
                        {/* 只有中文词汇才显示例句发音按钮 */}
                        {(wordData.language === 'zh' || wordData.language === 'zh-CN') && (
                          <TouchableOpacity 
                            style={styles.examplesAudioButton}
                            onPress={() => {
                              // 播放第一个中文例句
                              const firstChineseExample = (wordData.phraseExplanation as any).examples.find((ex: any) => ex.chinese);
                              if (firstChineseExample) {
                                handlePlayExampleAudio(firstChineseExample.chinese, 'zh');
                              }
                            }}
                          >
                            <Ionicons name="volume-high" size={18} color={colors.primary[500]} />
                          </TouchableOpacity>
                        )}
                      </View>
                      {(wordData.phraseExplanation as any).examples.map((ex: any, exIdx: number) => (
                        <View key={exIdx} style={styles.exampleContainer}>
                          <Text style={styles.exampleLabelAndText} selectable>{ex.english}</Text>
                          {/* 根据语言显示对应的释义 */}
                          {wordData.language === 'zh' || wordData.language === 'zh-CN' ? (
                            <Text style={styles.exampleChineseText} selectable>{ex.chinese}</Text>
                          ) : wordData.language === 'ja' ? (
                            <Text style={styles.exampleChineseText} selectable>{ex.english}</Text>
                          ) : (
                            <Text style={styles.exampleChineseText} selectable>{ex.english}</Text>
                          )}
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
    textAlign: 'left', // 确保拼音左对齐
  },
  candidatesContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  candidatesLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  candidatesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  candidateButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCandidate: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  candidateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedCandidateText: {
    color: '#fff',
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
    fontSize: 20, // 增加释义字体大小到20px
    color: '#222',
    marginBottom: 6,
  },
  examplesBlock: {
    marginTop: 4,
    marginBottom: 2,
    paddingLeft: 8,
  },
  examplesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  examplesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  examplesAudioButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    marginTop: 10,
  },
  examplesAudioContainer: {
    marginTop: 8,
    alignItems: 'flex-start', // 左对齐
  },
  exampleContainer: {
    marginTop: 4,
    paddingLeft: 0, // 移除左缩进，让内容左对齐
  },
  exampleTextContainer: {
    width: '100%',
  },
  exampleAudioContainer: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  exampleTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  exampleLabelAndText: {
    fontSize: 15,
    color: '#888',
    fontStyle: 'italic',
    flex: 1,
    marginLeft: 0, // 移除左缩进，让文本左对齐
  },
  exampleChineseText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    flex: 1,
    marginLeft: 0, // 移除左缩进，让文本左对齐
    marginTop: 6, // 在英文例句和中文例句之间添加间距
  },
  exampleAudioButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    marginRight: 8,
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
  translationSourceContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  translationSourceText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default WordCardContent; 