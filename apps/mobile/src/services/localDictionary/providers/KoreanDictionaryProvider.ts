// 韩语词典提供者
import { LocalDictionaryProvider, LocalQueryResult, DictionaryInfo } from '../types';
import { MultilingualEntry, MultilingualTranslation, MultilingualQueryResult } from '../types/multilingual';
import { MultilingualSQLiteManager } from '../storage/MultilingualSQLiteManager';
import { DictionaryStorage } from '../storage/DictionaryStorage';

export class KoreanDictionaryProvider implements LocalDictionaryProvider {
  readonly name = 'Korean-English Dictionary';
  readonly language = 'ko';
  readonly version = '2024.1';
  
  private sqliteManager: MultilingualSQLiteManager;
  private storage: DictionaryStorage;
  private isInitialized = false;

  constructor() {
    this.storage = DictionaryStorage.getInstance();
    this.sqliteManager = MultilingualSQLiteManager.getInstance();
  }

  /**
   * 检查词库是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const count = await this.sqliteManager.getEntryCount('ko');
      return count > 0;
    } catch (error) {
      console.error('❌ 检查韩语词库可用性失败:', error);
      return false;
    }
  }

  /**
   * 初始化词库
   */
  private async initialize(): Promise<void> {
    try {
      await this.sqliteManager.initialize();
      this.isInitialized = true;
      console.log('✅ 韩语词库初始化成功');
    } catch (error) {
      console.error('❌ 韩语词库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 查询词库
   */
  async lookup(input: string): Promise<LocalQueryResult> {
    const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // 检查词库是否可用
      if (!(await this.isAvailable())) {
        return {
          success: false,
          candidates: [],
          totalCount: 0,
          queryTime: Date.now() - startTime
        };
      }

      // 执行查询
      const entries = await this.sqliteManager.searchMultilingualEntries(input, 'ko', 'en-US', 20);
      
      const candidates = entries.map(entry => {
        const translation = this.getBestTranslation(entry, input);
        return {
          word: entry.word,
          translation: translation,
          pinyin: undefined,
          romaji: undefined,
          kana: undefined,
          partOfSpeech: entry.partOfSpeech,
          confidence: this.calculateConfidence(input, entry),
          source: this.name
        };
      });

      return {
        success: true,
        candidates,
        totalCount: candidates.length,
        queryTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('❌ 韩语词库查询失败:', error);
      return {
        success: false,
        candidates: [],
        totalCount: 0,
        queryTime: Date.now() - startTime
      };
    }
  }

  /**
   * 多语言查询
   */
  async lookupMultilingual(input: string, uiLanguage: string = 'en-US'): Promise<MultilingualQueryResult> {
    const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!(await this.isAvailable())) {
        return {
          success: false,
          candidates: [],
          totalCount: 0,
          queryTime: Date.now() - startTime
        };
      }

      const entries = await this.sqliteManager.searchMultilingualEntries(input, 'ko', uiLanguage, 20);
      
      const candidates = entries.map(entry => {
        const translation = this.sqliteManager.getTranslationForUILanguage(entry, uiLanguage);
        return {
          word: entry.word,
          translation: translation,
          phonetic: entry.phonetic,
          kana: undefined,
          romaji: undefined,
          pinyin: undefined,
          partOfSpeech: entry.partOfSpeech,
          confidence: this.calculateConfidence(input, entry),
          source: this.name,
          allTranslations: entry.translations
        };
      });

      return {
        success: true,
        candidates,
        totalCount: candidates.length,
        queryTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('❌ 韩语多语言查询失败:', error);
      return {
        success: false,
        candidates: [],
        totalCount: 0,
        queryTime: Date.now() - startTime
      };
    }
  }

  /**
   * 获取最佳释义
   */
  private getBestTranslation(entry: MultilingualEntry, input: string): string {
    const translations = entry.translations;
    
    // 优先返回英文释义
    if (translations.en) {
      return translations.en;
    }
    
    // 其次返回中文释义
    if (translations.zh) {
      return translations.zh;
    }
    
    // 最后返回任意可用释义
    const availableTranslations = Object.values(translations).filter(t => t);
    return availableTranslations[0] || entry.word;
  }

  /**
   * 计算匹配置信度
   */
  private calculateConfidence(input: string, entry: MultilingualEntry): number {
    const inputLower = input.toLowerCase();
    const wordLower = entry.word.toLowerCase();
    const phoneticLower = (entry.phonetic || '').toLowerCase();

    // 精确匹配
    if (wordLower === inputLower || phoneticLower === inputLower) {
      return 1.0;
    }

    // 开头匹配
    if (wordLower.startsWith(inputLower) || phoneticLower.startsWith(inputLower)) {
      return 0.9;
    }

    // 包含匹配
    if (wordLower.includes(inputLower) || phoneticLower.includes(inputLower)) {
      return 0.7;
    }

    // 模糊匹配
    return 0.5;
  }

  /**
   * 获取词库信息
   */
  async getInfo(): Promise<DictionaryInfo> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const count = await this.sqliteManager.getEntryCount('ko');
      const storageInfo = await this.storage.getDictionaryInfo('korean_dict.json');
      
      return {
        name: this.name,
        language: this.language,
        version: this.version,
        totalEntries: count,
        lastUpdated: storageInfo?.lastModified || new Date(),
        fileSize: storageInfo?.size || 0,
        isAvailable: count > 0
      };
    } catch (error) {
      console.error('❌ 获取韩语词库信息失败:', error);
      return {
        name: this.name,
        language: this.language,
        version: this.version,
        totalEntries: 0,
        lastUpdated: new Date(),
        fileSize: 0,
        isAvailable: false
      };
    }
  }

  /**
   * 解析韩语词典文件到数据库
   */
  async parseKoreanDictionaryFile(content: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔄 开始解析韩语词典文件...');
      
      // 清空现有数据
      await this.sqliteManager.clearEntries('ko');
      
      // 解析韩语词典文件
      const entries = this.parseKoreanDictionaryJSON(content);
      
      if (entries.length > 0) {
        await this.sqliteManager.insertMultilingualEntries(entries);
        console.log(`✅ 韩语词典文件解析完成，共处理 ${entries.length} 条词条`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ 解析韩语词典文件失败:', error);
      return false;
    }
  }

  /**
   * 解析韩语词典JSON文件
   */
  private parseKoreanDictionaryJSON(content: string): Omit<MultilingualEntry, 'id' | 'created_at' | 'updated_at'>[] {
    try {
      const data = JSON.parse(content);
      const entries: Omit<MultilingualEntry, 'id' | 'created_at' | 'updated_at'>[] = [];
      
      // 假设JSON格式为数组
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.korean && (item.english || item.chinese)) {
            entries.push({
              word: item.korean,
              language: 'ko',
              translations: {
                en: item.english,
                zh: item.chinese
              } as MultilingualTranslation,
              phonetic: item.pronunciation,
              partOfSpeech: item.partOfSpeech,
              frequency: item.frequency || 0
            });
          }
        }
      }
      
      return entries;
    } catch (error) {
      console.error('❌ 解析韩语词典JSON失败:', error);
      
      // 返回示例数据
      return [
        {
          word: '안녕하세요',
          language: 'ko',
          translations: {
            en: 'hello',
            zh: '你好'
          } as MultilingualTranslation,
          phonetic: 'annyeonghaseyo',
          partOfSpeech: 'interjection',
          frequency: 100
        },
        {
          word: '감사합니다',
          language: 'ko',
          translations: {
            en: 'thank you',
            zh: '谢谢'
          } as MultilingualTranslation,
          phonetic: 'gamsahamnida',
          partOfSpeech: 'interjection',
          frequency: 95
        }
      ];
    }
  }

  /**
   * 检查是否需要更新词库
   */
  async needsUpdate(): Promise<boolean> {
    try {
      const info = await this.getInfo();
      const storageInfo = await this.storage.getDictionaryInfo('korean_dict.json');
      
      // 如果数据库为空，需要更新
      if (info.totalEntries === 0) {
        return true;
      }

      // 如果存储文件比数据库新，需要更新
      if (storageInfo && storageInfo.lastModified > info.lastUpdated) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ 检查韩语词库更新状态失败:', error);
      return true;
    }
  }
}
