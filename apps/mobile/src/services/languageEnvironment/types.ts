// 语言环境相关类型定义
export interface InputAnalysis {
  type: InputType;
  confidence: number;
  suggestions: {
    kana?: string;
    kanji?: string;
    romaji?: string;
    pinyin?: string;
    chinese?: string;
    english?: string;
    japanese?: string;
  };
}

export type InputType = 
  | 'chinese' 
  | 'japanese_kanji' 
  | 'japanese_kana' 
  | 'english' 
  | 'english_sentence' 
  | 'romaji' 
  | 'pinyin' 
  | 'mixed' 
  | 'unknown';

export type QueryStrategy = 'local_only' | 'online_only' | 'hybrid';

export interface LocalQueryCandidate {
  chinese?: string;
  pinyin?: string;
  english?: string;
  japanese?: string;
  kana?: string;
  romaji?: string;
  confidence?: number;
}

export interface LocalQueryResult {
  success: boolean;
  candidates: Array<string | LocalQueryCandidate>;
  source?: string;
  confidence?: number;
}

export interface OnlineQueryResult {
  success: boolean;
  candidates: string[];
  source?: string;
  confidence?: number;
  wordData?: any;
}

export interface HybridQueryResult {
  success: boolean;
  candidates: string[];
  source?: string;
  confidence?: number;
  wordData?: any;
}

// 统一的查询结果类型
export interface UnifiedQueryResult {
  success: boolean;
  candidates: string[];
  source?: string;
  confidence?: number;
  wordData?: any;
}

export interface QueryResult {
  type: 'translation' | 'dictionary' | 'ambiguous';
  data?: any;
  options?: any[];
}

export interface LanguageEnvironmentConfig {
  uiLanguage: 'en-US' | 'zh-CN';
  targetLanguage: string;
  supportedInputTypes: InputType[];
  preferredQueryStrategy: QueryStrategy;
}
