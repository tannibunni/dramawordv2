// 词库管理器
import { LocalDictionaryProvider, LocalQueryResult, DictionaryInfo } from '../localDictionary/types';
import { CCEDICTProvider } from '../localDictionary/providers/CCEDICTProvider';
import { JapaneseDictionaryProvider } from '../localDictionary/providers/JapaneseDictionaryProvider';
import { KoreanDictionaryProvider } from '../localDictionary/providers/KoreanDictionaryProvider';
import { DictionaryDownloader, DictionarySource } from '../localDictionary/downloader/DictionaryDownloader';
import { DictionaryStorage } from '../localDictionary/storage/DictionaryStorage';
import { MultilingualQueryResult } from '../localDictionary/types/multilingual';
import { API_BASE_URL } from '../../constants/config';

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
    
    // 注册日语词典提供者
    const japaneseProvider = new JapaneseDictionaryProvider();
    this.providers.set('jmdict', japaneseProvider);
    
    // 注册韩语词典提供者
    const koreanProvider = new KoreanDictionaryProvider();
    this.providers.set('korean', koreanProvider);
    
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
   * 多语言查询
   */
  async queryMultilingual(input: string, targetLanguage: string, uiLanguage: string = 'en-US'): Promise<MultilingualQueryResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // 根据目标语言选择提供者
      let provider: LocalDictionaryProvider | undefined;
      
      switch (targetLanguage) {
        case 'zh':
          provider = this.getProvider('ccedict');
          break;
        case 'ja':
          provider = this.getProvider('jmdict');
          break;
        case 'ko':
          provider = this.getProvider('korean');
          break;
        default:
          return {
            success: false,
            candidates: [],
            totalCount: 0,
            queryTime: 0
          };
      }

      if (!provider) {
        return {
          success: false,
          candidates: [],
          totalCount: 0,
          queryTime: 0
        };
      }

      // 检查提供者是否支持多语言查询
      if ('lookupMultilingual' in provider) {
        return await (provider as any).lookupMultilingual(input, uiLanguage);
      } else {
        // 回退到普通查询
        const result = await provider.lookup(input);
        return {
          success: result.success,
          candidates: result.candidates.map(c => ({
            word: c.word,
            translation: c.translation,
            phonetic: c.pinyin || c.romaji,
            kana: c.kana,
            romaji: c.romaji,
            pinyin: c.pinyin,
            partOfSpeech: c.partOfSpeech,
            confidence: c.confidence,
            source: c.source
          })),
          totalCount: result.totalCount,
          queryTime: result.queryTime
        };
      }
    } catch (error) {
      console.error('❌ 多语言词库查询失败:', error);
      return {
        success: false,
        candidates: [],
        totalCount: 0,
        queryTime: 0
      };
    }
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
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 映射词库名称到语言ID
        const languageMap: { [key: string]: string } = {
          'CC-CEDICT': 'ccedict',
          'JMdict': 'jmdict',
          'Korean Dictionary': 'korean'
        };
        
        const languageId = languageMap[sourceName];
        if (!languageId) {
          throw new Error(`不支持的词库源: ${sourceName}`);
        }

        console.log(`📥 开始下载词库: ${sourceName} (${languageId}) - 尝试 ${attempt}/${maxRetries}`);
        
        // 调用后端API下载词库
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5分钟超时
        
        try {
          const response = await fetch(`${API_BASE_URL}/dictionary/download/${languageId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          if (result.success) {
            console.log(`✅ 词库下载成功: ${sourceName}`);
            
            // 解析词库
            await this.parseDictionary(languageId);
            
            return true;
          } else {
            throw new Error(`服务器错误: ${result.error}`);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ 下载词库失败 (尝试 ${attempt}/${maxRetries}): ${sourceName}`, lastError);
        
        // 如果不是最后一次尝试，等待一段时间后重试
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 指数退避: 2s, 4s, 8s
          console.log(`⏳ 等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error(`❌ 词库下载最终失败: ${sourceName}`, lastError);
    return false;
  }

  /**
   * 解析词库
   */
  private async parseDictionary(languageId: string): Promise<boolean> {
    try {
      console.log(`🔄 开始解析词库: ${languageId}`);
      
      const response = await fetch(`/api/dictionary/parse/${languageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        console.error(`❌ 词库解析失败: ${response.status}`);
        return false;
      }
      
      const result = await response.json();
      if (result.success) {
        console.log(`✅ 词库解析成功: ${languageId}, 条目数: ${result.data.entriesCount}`);
        return true;
      } else {
        console.error(`❌ 词库解析失败: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ 解析词库异常: ${languageId}`, error);
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

  /**
   * 获取词库状态
   */
  async getDictionaryStatus(): Promise<any> {
    try {
      const response = await fetch('/api/dictionary/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        console.error(`❌ 获取词库状态失败: ${response.status}`);
        return null;
      }
      
      const result = await response.json();
      if (result.success) {
        console.log(`✅ 词库状态获取成功: ${result.data.availableCount}/${result.data.totalCount} 个词库可用`);
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ 获取词库状态失败:', error);
      return null;
    }
  }
}
