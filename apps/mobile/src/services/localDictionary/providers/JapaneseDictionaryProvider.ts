// 日语词典提供者 (JMdict)
import { LocalDictionaryProvider, LocalQueryResult, DictionaryInfo } from '../types';
import { MultilingualEntry, MultilingualTranslation, MultilingualQueryResult } from '../types/multilingual';
import { MultilingualSQLiteManager } from '../storage/MultilingualSQLiteManager';
import { DictionaryStorage } from '../storage/DictionaryStorage';
import { DictionaryDownloader } from '../downloader/DictionaryDownloader';

export class JapaneseDictionaryProvider implements LocalDictionaryProvider {
  readonly name = 'JMdict';
  readonly language = 'ja';
  readonly version = '2024.1';
  
  private sqliteManager: MultilingualSQLiteManager;
  private storage: DictionaryStorage;
  private downloader: DictionaryDownloader;
  private isInitialized = false;
  private isDownloading = false;
  private originalDownloadUri: string | null = null;

  constructor() {
    this.storage = DictionaryStorage.getInstance();
    this.sqliteManager = MultilingualSQLiteManager.getInstance();
    this.downloader = DictionaryDownloader.getInstance();
  }

  /**
   * 检查词库是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      console.log('🔍 检查日语词库可用性...');
      
      if (!this.isInitialized) {
        console.log('🔧 初始化日语词库...');
        await this.initialize();
      }
      
      const count = await this.sqliteManager.getEntryCount('ja');
      console.log(`📊 日语词库条目数量: ${count}`);
      
      const isAvailable = count > 0;
      console.log(`✅ 日语词库可用性: ${isAvailable ? '可用' : '不可用'}`);
      
      return isAvailable;
    } catch (error) {
      console.error('❌ 检查日语词库可用性失败:', error);
      console.error('❌ 错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
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
      console.log('✅ 日语词库初始化成功');
    } catch (error) {
      console.error('❌ 日语词库初始化失败:', error);
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
      const entries = await this.sqliteManager.searchMultilingualEntries(input, 'ja', 'en-US', 20);
      
      const candidates = entries.map(entry => {
        const translation = this.getBestTranslation(entry, input);
        return {
          word: entry.word,
          translation: translation,
          pinyin: undefined,
          romaji: entry.romaji,
          kana: entry.kana,
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
      console.error('❌ 日语词库查询失败:', error);
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

      const entries = await this.sqliteManager.searchMultilingualEntries(input, 'ja', uiLanguage, 20);
      
      const candidates = entries.map(entry => {
        const translation = this.sqliteManager.getTranslationForUILanguage(entry, uiLanguage);
        return {
          word: entry.word,
          translation: translation,
          phonetic: entry.romaji,
          kana: entry.kana,
          romaji: entry.romaji,
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
      console.error('❌ 日语多语言查询失败:', error);
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
    const romajiLower = (entry.romaji || '').toLowerCase();
    const kanaLower = (entry.kana || '').toLowerCase();

    // 精确匹配
    if (wordLower === inputLower || romajiLower === inputLower || kanaLower === inputLower) {
      return 1.0;
    }

    // 开头匹配
    if (wordLower.startsWith(inputLower) || romajiLower.startsWith(inputLower) || kanaLower.startsWith(inputLower)) {
      return 0.9;
    }

    // 包含匹配
    if (wordLower.includes(inputLower) || romajiLower.includes(inputLower) || kanaLower.includes(inputLower)) {
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

      const count = await this.sqliteManager.getEntryCount('ja');
      const storageInfo = await this.storage.getDictionaryInfo('jmdict.xml');
      
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
      console.error('❌ 获取日语词库信息失败:', error);
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
   * 解析JMdict XML文件到数据库
   */
  async parseJMdictFile(content: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔄 开始解析JMdict文件...');
      
      // 清空现有数据
      await this.sqliteManager.clearEntries('ja');
      
      // 简化的JMdict解析（实际实现需要完整的XML解析）
      const entries = this.parseJMdictXML(content);
      
      if (entries.length > 0) {
        await this.sqliteManager.insertMultilingualEntries(entries);
        console.log(`✅ JMdict文件解析完成，共处理 ${entries.length} 条词条`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ 解析JMdict文件失败:', error);
      return false;
    }
  }

  /**
   * 简化的JMdict XML解析
   */
  private parseJMdictXML(content: string): Omit<MultilingualEntry, 'id' | 'created_at' | 'updated_at'>[] {
    const entries: Omit<MultilingualEntry, 'id' | 'created_at' | 'updated_at'>[] = [];
    
    // 这里应该实现完整的JMdict XML解析
    // 为了演示，我们创建一些示例数据
    const sampleEntries = [
      {
        word: 'こんにちは',
        language: 'ja',
        translations: {
          en: 'hello',
          zh: '你好'
        } as MultilingualTranslation,
        romaji: 'konnichiwa',
        kana: 'こんにちは',
        partOfSpeech: 'interjection',
        frequency: 100
      },
      {
        word: 'ありがとう',
        language: 'ja',
        translations: {
          en: 'thank you',
          zh: '谢谢'
        } as MultilingualTranslation,
        romaji: 'arigatou',
        kana: 'ありがとう',
        partOfSpeech: 'interjection',
        frequency: 95
      }
    ];

    return sampleEntries;
  }

  /**
   * 检查是否需要更新词库
   */
  async needsUpdate(): Promise<boolean> {
    try {
      const info = await this.getInfo();
      const storageInfo = await this.storage.getDictionaryInfo('jmdict.xml');
      
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
      console.error('❌ 检查日语词库更新状态失败:', error);
      return true;
    }
  }

  /**
   * 🔧 手动下载和解析JMdict词典
   */
  async downloadAndParse(): Promise<boolean> {
    // 检查是否正在下载
    if (this.isDownloading) {
      console.log('⏳ 已有下载任务进行中，跳过重复下载');
      return false;
    }
    
    console.log('🔄 开始下载和解析JMdict词典...');
    this.isDownloading = true;
    
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // 清空数据库
      await this.sqliteManager.clearEntries('ja');
      
      // 删除旧文件（如果存在）
      try {
        console.log('🗑️ 尝试删除旧的JMdict文件...');
        const deleteResult = await this.storage.deleteDictionaryFile('jmdict.xml');
        if (deleteResult) {
          console.log('✅ 旧JMdict文件删除成功');
        } else {
          console.log('⚠️ 旧JMdict文件删除失败或文件不存在');
        }
      } catch (deleteError) {
        console.log('⚠️ 删除旧文件失败（可能不存在）:', deleteError);
      }
      
      // 下载词典
      console.log('🔍 获取支持的下载源...');
      const sources = this.downloader.getSupportedSources();
      console.log('📋 支持的下载源:', sources.map(s => `${s.name} (${s.language})`).join(', '));
      
      const jmdictSource = sources.find(source => source.name === 'JMdict');
      
      if (!jmdictSource) {
        console.log('❌ 找不到JMdict下载源');
        return false;
      }
      
      console.log('📥 开始下载JMdict词典文件...');
      console.log('🔗 下载URL:', jmdictSource.url);
      console.log('📁 目标文件名:', jmdictSource.filename);
      console.log('📊 预计大小:', jmdictSource.size, 'bytes');
      
      const downloadResult = await this.downloader.downloadDictionary(jmdictSource);
      
      if (!downloadResult.success) {
        console.log('❌ 下载失败:', downloadResult.error);
        return false;
      }
      
      this.originalDownloadUri = downloadResult.originalUri || null;
      console.log('✅ 下载成功，开始解析...');
      console.log('🔗 原始下载URI:', this.originalDownloadUri);
      
      const content = await this.storage.readDictionaryFileWithFallback('jmdict.xml', this.originalDownloadUri);
      
      if (!content || content.length === 0) {
        console.log('❌ 无法读取文件内容');
        return false;
      }
      
      console.log(`📄 文件内容长度: ${content.length} 字符`);
      console.log(`📄 文件内容前100字符: ${content.substring(0, 100)}...`);
      
      const parseSuccess = await this.parseDictionaryFile(content);
      
      if (!parseSuccess) {
        console.log('❌ 解析失败');
        return false;
      }
      
      console.log('✅ JMdict词典下载和解析完成');
      return true;
      
    } catch (error) {
      console.error('❌ JMdict词典下载和解析失败:', error);
      return false;
    } finally {
      this.isDownloading = false;
    }
  }

  /**
   * 🔧 专门的罗马音查询（用于输入法候选词）
   * 只返回罗马音完全匹配的词汇，不含近似匹配
   */
  async lookupByRomaji(romaji: string, limit: number = 10): Promise<LocalQueryResult> {
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

      // 标准化罗马音：只转小写，保持空格格式
      const normalizedRomaji = romaji.toLowerCase();

      console.log(`🔍 [JapaneseDictionaryProvider] 罗马音查询: 输入="${romaji}", 标准化="${normalizedRomaji}"`);

      // 执行精确罗马音查询
      const entries = await this.sqliteManager.searchEntriesByRomaji(normalizedRomaji, 'ja', limit);
      
      console.log(`🔍 [JapaneseDictionaryProvider] 查询结果: ${entries.length} 条词条`);
      if (entries.length > 0) {
        console.log(`🔍 [JapaneseDictionaryProvider] 前3条结果:`, entries.slice(0, 3).map(e => `${e.word}[${e.romaji}]`).join(', '));
      }
      
      const candidates = entries.map(entry => ({
        word: entry.word,
        translation: entry.translation,
        romaji: entry.romaji,
        kana: entry.kana,
        partOfSpeech: entry.partOfSpeech,
        confidence: 1.0, // 罗马音精确匹配，置信度都是1.0
        source: this.name
      }));

      return {
        success: true,
        candidates,
        totalCount: candidates.length,
        queryTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('❌ JMdict罗马音查询失败:', error);
      return {
        success: false,
        candidates: [],
        totalCount: 0,
        queryTime: Date.now() - startTime
      };
    }
  }

  /**
   * 解析词典文件
   */
  private async parseDictionaryFile(content: string): Promise<boolean> {
    try {
      console.log('📖 开始解析JMdict XML文件...');
      
      // 这里需要实现JMdict XML解析逻辑
      // 由于JMdict是XML格式，需要解析XML并提取词条信息
      // 暂时返回true，实际实现需要XML解析器
      
      console.log('⚠️ JMdict XML解析功能待实现');
      return true;
      
    } catch (error) {
      console.error('❌ 解析JMdict文件失败:', error);
      return false;
    }
  }
}
