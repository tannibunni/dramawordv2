// 本地词库相关类型定义

export interface LocalDictionaryProvider {
  readonly name: string;
  readonly language: string;
  readonly version: string;
  
  /**
   * 检查词库是否可用
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * 查询词库
   */
  lookup(input: string): Promise<LocalQueryResult>;
  
  /**
   * 获取词库信息
   */
  getInfo(): Promise<DictionaryInfo>;
}

export interface LocalQueryResult {
  success: boolean;
  candidates: Array<{
    word: string;
    translation: string;
    pinyin?: string;
    romaji?: string;
    kana?: string;
    partOfSpeech?: string;
    confidence: number;
    source: string;
  }>;
  totalCount: number;
  queryTime: number;
}

export interface DictionaryInfo {
  name: string;
  language: string;
  version: string;
  totalEntries: number;
  lastUpdated: Date;
  fileSize: number;
  isAvailable: boolean;
}

export interface DictionaryDownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
  downloadedSize?: number;
  totalSize?: number;
}

export interface DictionaryStorageInfo {
  name: string;
  filePath: string;
  size: number;
  lastModified: Date;
  isDownloaded: boolean;
  isParsed: boolean;
}

export interface SQLiteConfig {
  databaseName: string;
  version: number;
  tables: {
    entries: string;
    definitions: string;
    examples: string;
  };
}

export interface DictionaryEntry {
  id: number;
  word: string;
  translation: string;
  pinyin?: string;
  romaji?: string;
  kana?: string;
  partOfSpeech?: string;
  frequency?: number;
  created_at: Date;
  updated_at: Date;
}

export interface DictionaryDefinition {
  id: number;
  entry_id: number;
  definition: string;
  partOfSpeech: string;
  example?: string;
  created_at: Date;
}

export interface DictionaryExample {
  id: number;
  entry_id: number;
  example: string;
  translation: string;
  created_at: Date;
}
