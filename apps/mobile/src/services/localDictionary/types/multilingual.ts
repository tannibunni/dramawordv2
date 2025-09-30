// 多语言释义相关类型定义

export interface MultilingualTranslation {
  en?: string;  // 英文释义
  zh?: string;  // 中文释义
  ja?: string;  // 日文释义
  ko?: string;  // 韩文释义
  fr?: string;  // 法文释义
  es?: string;  // 西班牙文释义
  de?: string;  // 德文释义
}

export interface MultilingualEntry {
  id: number;
  word: string;
  language: string;  // 词条语言 (ja, ko, zh, en, etc.)
  translations: MultilingualTranslation;
  phonetic?: string;  // 音标/拼音/罗马音
  kana?: string;     // 假名 (日语)
  romaji?: string;   // 罗马音 (日语)
  pinyin?: string;   // 拼音 (中文)
  partOfSpeech?: string;
  frequency?: number;
  created_at: Date;
  updated_at: Date;
}

export interface MultilingualQueryResult {
  success: boolean;
  candidates: Array<{
    word: string;
    translation: string;  // 根据界面语言选择的释义
    phonetic?: string;
    kana?: string;
    romaji?: string;
    pinyin?: string;
    partOfSpeech?: string;
    confidence: number;
    source: string;
    allTranslations?: MultilingualTranslation;  // 所有语言释义
  }>;
  totalCount: number;
  queryTime: number;
}

export interface LanguageSupport {
  language: string;
  name: string;
  phoneticField: 'pinyin' | 'romaji' | 'phonetic' | null;
  hasKana: boolean;
  supportedUILanguages: string[];
}

export const SUPPORTED_LANGUAGES: LanguageSupport[] = [
  {
    language: 'zh',
    name: '中文',
    phoneticField: 'pinyin',
    hasKana: false,
    supportedUILanguages: ['en-US', 'zh-CN']
  },
  {
    language: 'ja',
    name: '日语',
    phoneticField: 'romaji',
    hasKana: true,
    supportedUILanguages: ['en-US', 'zh-CN']
  },
  {
    language: 'ko',
    name: '韩语',
    phoneticField: 'phonetic',
    hasKana: false,
    supportedUILanguages: ['en-US', 'zh-CN']
  },
  {
    language: 'en',
    name: '英语',
    phoneticField: 'phonetic',
    hasKana: false,
    supportedUILanguages: ['en-US', 'zh-CN']
  },
  {
    language: 'fr',
    name: '法语',
    phoneticField: 'phonetic',
    hasKana: false,
    supportedUILanguages: ['en-US', 'zh-CN']
  },
  {
    language: 'es',
    name: '西班牙语',
    phoneticField: 'phonetic',
    hasKana: false,
    supportedUILanguages: ['en-US', 'zh-CN']
  },
  {
    language: 'de',
    name: '德语',
    phoneticField: 'phonetic',
    hasKana: false,
    supportedUILanguages: ['en-US', 'zh-CN']
  }
];

export interface DictionarySourceInfo {
  name: string;
  language: string;
  url: string;
  filename: string;
  description: string;
  version: string;
  size?: number;
  format: 'xml' | 'json' | 'txt' | 'sqlite';
  supportsMultilingual: boolean;
  supportedUILanguages: string[];
}
