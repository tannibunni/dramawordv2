// 词库管理器
import { LocalDictionaryProvider, LocalQueryResult, DictionaryInfo } from '../localDictionary/types';
import { CCEDICTProvider } from '../localDictionary/providers/CCEDICTProvider';
import { DictionaryDownloader, DictionarySource } from '../localDictionary/downloader/DictionaryDownloader';
import { DictionaryStorage } from '../localDictionary/storage/DictionaryStorage';

export class DictionaryManager {
  private static instance: DictionaryManager;
  private providers: Map<string, LocalDictionaryProvider> = new Map();
  private downloader: DictionaryDownloader;
  private storage: DictionaryStorage;
  private isInitialized = false;

  constructor() {
    this.downloader = DictionaryDownloader.getInstance();
    this.storage = DictionaryStorage.getInstance();
    this.initializeProviders();
  }

  static getInstance(): DictionaryManager {
    if (!DictionaryManager.instance) {
      DictionaryManager.instance = new DictionaryManager();
    }
    return DictionaryManager.instance;
  }

  /**
   * 初始化词库提供者
   */
  private initializeProviders(): void {
    // 注册CC-CEDICT提供者
    const ccedictProvider = new CCEDICTProvider();
    this.providers.set('ccedict', ccedictProvider);
    
    console.log('✅ 词库提供者初始化完成');
  }

  /**
   * 初始化管理器
   */
  async initialize(): Promise<void> {
    try {
      await this.storage.initialize();
      this.isInitialized = true;
      console.log('✅ 词库管理器初始化完成');
    } catch (error) {
      console.error('❌ 词库管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有可用的词库提供者
   */
  getAvailableProviders(): LocalDictionaryProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * 获取指定语言的词库提供者
   */
  getProvidersByLanguage(language: string): LocalDictionaryProvider[] {
    return Array.from(this.providers.values()).filter(
      provider => provider.language === language
    );
  }

  /**
   * 获取词库提供者
   */
  getProvider(name: string): LocalDictionaryProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * 查询词库
   */
  async query(input: string, language: string): Promise<LocalQueryResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const providers = this.getProvidersByLanguage(language);
      if (providers.length === 0) {
        return {
          success: false,
          candidates: [],
          totalCount: 0,
          queryTime: 0
        };
      }

      // 并行查询所有提供者
      const results = await Promise.all(
        providers.map(provider => provider.lookup(input))
      );

      // 合并结果
      const allCandidates = results
        .filter(result => result.success)
        .flatMap(result => result.candidates);

      // 按置信度排序
      allCandidates.sort((a, b) => b.confidence - a.confidence);

      // 去重
      const uniqueCandidates = this.deduplicateCandidates(allCandidates);

      return {
        success: uniqueCandidates.length > 0,
        candidates: uniqueCandidates,
        totalCount: uniqueCandidates.length,
        queryTime: Math.max(...results.map(r => r.queryTime))
      };
    } catch (error) {
      console.error('❌ 词库查询失败:', error);
      return {
        success: false,
        candidates: [],
        totalCount: 0,
        queryTime: 0
      };
    }
  }

  /**
   * 去重候选词
   */
  private deduplicateCandidates(candidates: any[]): any[] {
    const seen = new Set<string>();
    return candidates.filter(candidate => {
      const key = `${candidate.word}-${candidate.translation}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 下载词库
   */
  async downloadDictionary(sourceName: string): Promise<boolean> {
    try {
      const sources = this.downloader.getSupportedSources();
      const source = sources.find(s => s.name === sourceName);
      
      if (!source) {
        throw new Error(`不支持的词库源: ${sourceName}`);
      }

      const result = await this.downloader.downloadDictionary(source);
      if (result.success) {
        console.log(`✅ 词库下载成功: ${sourceName}`);
        return true;
      } else {
        console.error(`❌ 词库下载失败: ${sourceName}`, result.error);
        return false;
      }
    } catch (error) {
      console.error(`❌ 下载词库失败: ${sourceName}`, error);
      return false;
    }
  }

  /**
   * 解析词库文件
   */
  async parseDictionary(dictionaryName: string): Promise<boolean> {
    try {
      const provider = this.getProvider(dictionaryName);
      if (!provider) {
        throw new Error(`未找到词库提供者: ${dictionaryName}`);
      }

      // 检查是否需要更新
      if (provider instanceof CCEDICTProvider) {
        const needsUpdate = await provider.needsUpdate();
        if (!needsUpdate) {
          console.log(`✅ 词库已是最新版本: ${dictionaryName}`);
          return true;
        }

        // 读取文件内容
        const content = await this.storage.readDictionaryFile('ccedict.txt');
        if (!content) {
          throw new Error('无法读取词库文件');
        }

        // 解析文件
        const success = await provider.parseDictionaryFile(content);
        if (success) {
          console.log(`✅ 词库解析成功: ${dictionaryName}`);
        }
        return success;
      }

      return false;
    } catch (error) {
      console.error(`❌ 解析词库失败: ${dictionaryName}`, error);
      return false;
    }
  }

  /**
   * 获取词库信息
   */
  async getDictionaryInfo(dictionaryName: string): Promise<DictionaryInfo | null> {
    try {
      const provider = this.getProvider(dictionaryName);
      if (!provider) {
        return null;
      }

      return await provider.getInfo();
    } catch (error) {
      console.error(`❌ 获取词库信息失败: ${dictionaryName}`, error);
      return null;
    }
  }

  /**
   * 获取所有词库信息
   */
  async getAllDictionaryInfo(): Promise<DictionaryInfo[]> {
    try {
      const providers = this.getAvailableProviders();
      const results = await Promise.all(
        providers.map(provider => provider.getInfo())
      );
      return results;
    } catch (error) {
      console.error('❌ 获取所有词库信息失败:', error);
      return [];
    }
  }

  /**
   * 检查词库是否可用
   */
  async isDictionaryAvailable(dictionaryName: string): Promise<boolean> {
    try {
      const provider = this.getProvider(dictionaryName);
      if (!provider) {
        return false;
      }

      return await provider.isAvailable();
    } catch (error) {
      console.error(`❌ 检查词库可用性失败: ${dictionaryName}`, error);
      return false;
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    totalSize: number;
    fileCount: number;
    availableSpace: number;
  }> {
    try {
      return await this.storage.getStorageStats();
    } catch (error) {
      console.error('❌ 获取存储统计失败:', error);
      return {
        totalSize: 0,
        fileCount: 0,
        availableSpace: 0
      };
    }
  }

  /**
   * 清理存储空间
   */
  async cleanupStorage(): Promise<number> {
    try {
      return await this.storage.cleanupStorage();
    } catch (error) {
      console.error('❌ 清理存储失败:', error);
      return 0;
    }
  }
}
