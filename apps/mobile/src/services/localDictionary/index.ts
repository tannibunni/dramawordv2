// 本地词库模块导出
export { SQLiteManager } from './storage/SQLiteManager';
export { DictionaryStorage } from './storage/DictionaryStorage';
export { CCEDICTProvider } from './providers/CCEDICTProvider';
export { DictionaryDownloader } from './downloader/DictionaryDownloader';

// 类型导出
export type {
  LocalDictionaryProvider,
  LocalQueryResult,
  DictionaryInfo,
  DictionaryDownloadResult,
  DictionaryStorageInfo,
  SQLiteConfig,
  DictionaryEntry,
  DictionaryDefinition,
  DictionaryExample
} from './types';
