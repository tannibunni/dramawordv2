import { WordData } from '../../../types/WordData';

/**
 * 语言显示策略接口
 * 定义不同语言的显示逻辑
 */
export interface LanguageDisplayStrategy {
  /**
   * 获取主要显示的单词
   */
  getMainWord(wordData: WordData): string;
  
  /**
   * 获取音标/拼音/罗马音
   */
  getPhonetic(wordData: WordData): string;
  
  /**
   * 获取例句文本
   */
  getExampleText(example: any): string;
  
  /**
   * 获取例句发音文本
   */
  getExampleAudioText(example: any): string;
  
  /**
   * 是否显示音标
   */
  shouldShowPhonetic(): boolean;
  
  /**
   * 是否显示假名/拼音
   */
  shouldShowKana(): boolean;
  
  /**
   * 获取假名/拼音文本
   */
  getKanaText(wordData: WordData): string;
  
  /**
   * 获取例句释义文本
   */
  getExampleTranslation(example: any): string;
  
  /**
   * 获取例句音标文本
   */
  getExamplePhonetic(example: any): string;
}

/**
 * 日语显示策略
 */
export class JapaneseDisplayStrategy implements LanguageDisplayStrategy {
  getMainWord(wordData: WordData): string {
    return wordData.translation || wordData.correctedWord || wordData.word;
  }
  
  getPhonetic(wordData: WordData): string {
    return wordData.phonetic || wordData.romaji || '';
  }
  
  getExampleText(example: any): string {
    return example.japanese || example.english || '';
  }
  
  getExampleAudioText(example: any): string {
    return example.japanese || example.english || '';
  }
  
  shouldShowPhonetic(): boolean {
    return true; // 日语显示罗马音
  }
  
  shouldShowKana(): boolean {
    return true; // 日语显示假名
  }
  
  getKanaText(wordData: WordData): string {
    return wordData.kana || '';
  }
  
  getExampleTranslation(example: any): string {
    return example.english || '';
  }
  
  getExamplePhonetic(example: any): string {
    return example.romaji || '';
  }
}

/**
 * 中文显示策略
 */
export class ChineseDisplayStrategy implements LanguageDisplayStrategy {
  getMainWord(wordData: WordData): string {
    return wordData.correctedWord || wordData.word;
  }
  
  getPhonetic(wordData: WordData): string {
    return wordData.pinyin || wordData.phonetic || '';
  }
  
  getExampleText(example: any): string {
    return example.chinese || example.english || '';
  }
  
  getExampleAudioText(example: any): string {
    return example.chinese || example.english || '';
  }
  
  shouldShowPhonetic(): boolean {
    return true; // 中文显示拼音
  }
  
  shouldShowKana(): boolean {
    return false; // 中文不显示假名
  }
  
  getKanaText(wordData: WordData): string {
    return ''; // 中文不使用假名
  }
  
  getExampleTranslation(example: any): string {
    return example.english || '';
  }
  
  getExamplePhonetic(example: any): string {
    return example.pinyin || '';
  }
}

/**
 * 韩语显示策略
 */
export class KoreanDisplayStrategy implements LanguageDisplayStrategy {
  getMainWord(wordData: WordData): string {
    return wordData.translation || wordData.correctedWord || wordData.word;
  }
  
  getPhonetic(wordData: WordData): string {
    return wordData.phonetic || wordData.romaji || '';
  }
  
  getExampleText(example: any): string {
    return example.korean || example.english || '';
  }
  
  getExampleAudioText(example: any): string {
    return example.korean || example.english || '';
  }
  
  shouldShowPhonetic(): boolean {
    return true; // 韩语显示罗马音
  }
  
  shouldShowKana(): boolean {
    return false; // 韩语不显示假名
  }
  
  getKanaText(wordData: WordData): string {
    return ''; // 韩语不使用假名
  }
  
  getExampleTranslation(example: any): string {
    return example.english || '';
  }
  
  getExamplePhonetic(example: any): string {
    return example.romaji || '';
  }
}

/**
 * 法语显示策略
 */
export class FrenchDisplayStrategy implements LanguageDisplayStrategy {
  getMainWord(wordData: WordData): string {
    return wordData.translation || wordData.correctedWord || wordData.word;
  }
  
  getPhonetic(wordData: WordData): string {
    return wordData.phonetic || '';
  }
  
  getExampleText(example: any): string {
    return example.french || example.english || '';
  }
  
  getExampleAudioText(example: any): string {
    return example.french || example.english || '';
  }
  
  shouldShowPhonetic(): boolean {
    return true; // 法语显示音标
  }
  
  shouldShowKana(): boolean {
    return false; // 法语不显示假名
  }
  
  getKanaText(wordData: WordData): string {
    return ''; // 法语不使用假名
  }
  
  getExampleTranslation(example: any): string {
    return example.english || '';
  }
  
  getExamplePhonetic(example: any): string {
    return example.phonetic || '';
  }
}

/**
 * 西班牙语显示策略
 */
export class SpanishDisplayStrategy implements LanguageDisplayStrategy {
  getMainWord(wordData: WordData): string {
    return wordData.translation || wordData.correctedWord || wordData.word;
  }
  
  getPhonetic(wordData: WordData): string {
    return wordData.phonetic || '';
  }
  
  getExampleText(example: any): string {
    return example.spanish || example.english || '';
  }
  
  getExampleAudioText(example: any): string {
    return example.spanish || example.english || '';
  }
  
  shouldShowPhonetic(): boolean {
    return true; // 西班牙语显示音标
  }
  
  shouldShowKana(): boolean {
    return false; // 西班牙语不显示假名
  }
  
  getKanaText(wordData: WordData): string {
    return ''; // 西班牙语不使用假名
  }
  
  getExampleTranslation(example: any): string {
    return example.english || '';
  }
  
  getExamplePhonetic(example: any): string {
    return example.phonetic || '';
  }
}

/**
 * 英语显示策略（默认）
 */
export class EnglishDisplayStrategy implements LanguageDisplayStrategy {
  getMainWord(wordData: WordData): string {
    return wordData.correctedWord || wordData.word;
  }
  
  getPhonetic(wordData: WordData): string {
    return wordData.phonetic || '';
  }
  
  getExampleText(example: any): string {
    return example.english || '';
  }
  
  getExampleAudioText(example: any): string {
    return example.english || '';
  }
  
  shouldShowPhonetic(): boolean {
    return true; // 英语显示音标
  }
  
  shouldShowKana(): boolean {
    return false; // 英语不显示假名
  }
  
  getKanaText(wordData: WordData): string {
    return ''; // 英语不使用假名
  }
  
  getExampleTranslation(example: any): string {
    return example.english || '';
  }
  
  getExamplePhonetic(example: any): string {
    return example.phonetic || '';
  }
}
