// CC-CEDICT词库提供者
import { LocalDictionaryProvider, LocalQueryResult, DictionaryInfo } from '../types';
import { SQLiteManager } from '../storage/SQLiteManager';
import { DictionaryStorage } from '../storage/DictionaryStorage';

export class CCEDICTProvider implements LocalDictionaryProvider {
  readonly name = 'CC-CEDICT';
  readonly language = 'zh';
  readonly version = '2024.1';
  
  private sqliteManager: SQLiteManager;
  private storage: DictionaryStorage;
  private isInitialized = false;

  constructor() {
    this.storage = DictionaryStorage.getInstance();
    this.sqliteManager = SQLiteManager.getInstance({
      databaseName: 'ccedict.db',
      version: 1,
      tables: {
        entries: 'ccedict_entries',
        definitions: 'ccedict_definitions',
        examples: 'ccedict_examples'
      }
    });
  }

  /**
   * 检查词库是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      const count = await this.sqliteManager.getEntryCount();
      return count > 0;
    } catch (error) {
      console.error('❌ 检查CC-CEDICT词库可用性失败:', error);
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
      console.log('✅ CC-CEDICT词库初始化成功');
    } catch (error) {
      console.error('❌ CC-CEDICT词库初始化失败:', error);
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
      const entries = await this.sqliteManager.searchEntries(input, 20);
      
      const candidates = entries.map(entry => ({
        word: entry.word,
        translation: entry.translation,
        pinyin: entry.pinyin,
        partOfSpeech: entry.partOfSpeech,
        confidence: this.calculateConfidence(input, entry),
        source: this.name
      }));

      return {
        success: true,
        candidates,
        totalCount: candidates.length,
        queryTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('❌ CC-CEDICT词库查询失败:', error);
      return {
        success: false,
        candidates: [],
        totalCount: 0,
        queryTime: Date.now() - startTime
      };
    }
  }

  /**
   * 计算匹配置信度
   */
  private calculateConfidence(input: string, entry: any): number {
    const inputLower = input.toLowerCase();
    const wordLower = entry.word.toLowerCase();
    const translationLower = entry.translation.toLowerCase();
    const pinyinLower = (entry.pinyin || '').toLowerCase();

    // 精确匹配
    if (wordLower === inputLower || translationLower === inputLower || pinyinLower === inputLower) {
      return 1.0;
    }

    // 开头匹配
    if (wordLower.startsWith(inputLower) || translationLower.startsWith(inputLower) || pinyinLower.startsWith(inputLower)) {
      return 0.9;
    }

    // 包含匹配
    if (wordLower.includes(inputLower) || translationLower.includes(inputLower) || pinyinLower.includes(inputLower)) {
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

      const count = await this.sqliteManager.getEntryCount();
      const storageInfo = await this.storage.getDictionaryInfo('ccedict.txt');
      
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
      console.error('❌ 获取CC-CEDICT词库信息失败:', error);
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
   * 解析CC-CEDICT文件到数据库
   */
  async parseDictionaryFile(content: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔄 开始解析CC-CEDICT文件...');
      
      // 清空现有数据
      await this.sqliteManager.clearEntries();
      
      const lines = content.split('\n');
      const entries = [];
      let processedCount = 0;

      for (const line of lines) {
        // 跳过注释行和空行
        if (line.startsWith('#') || line.trim() === '') {
          continue;
        }

        // 解析CC-CEDICT格式: 中文 拼音 [词性] /英文释义/
        const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/$/);
        if (match) {
          const [, chinese, pinyin, partOfSpeech, translation] = match;
          
          entries.push({
            word: chinese,
            translation: translation,
            pinyin: pinyin,
            partOfSpeech: partOfSpeech,
            frequency: 0
          });

          processedCount++;
          
          // 批量插入，每1000条插入一次
          if (entries.length >= 1000) {
            await this.sqliteManager.insertEntries(entries);
            entries.length = 0;
            console.log(`📊 已处理 ${processedCount} 条词条...`);
          }
        }
      }

      // 插入剩余词条
      if (entries.length > 0) {
        await this.sqliteManager.insertEntries(entries);
      }

      console.log(`✅ CC-CEDICT文件解析完成，共处理 ${processedCount} 条词条`);
      return true;
    } catch (error) {
      console.error('❌ 解析CC-CEDICT文件失败:', error);
      return false;
    }
  }

  /**
   * 检查是否需要更新词库
   */
  async needsUpdate(): Promise<boolean> {
    try {
      const info = await this.getInfo();
      const storageInfo = await this.storage.getDictionaryInfo('ccedict.txt');
      
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
      console.error('❌ 检查词库更新状态失败:', error);
      return true;
    }
  }
}
