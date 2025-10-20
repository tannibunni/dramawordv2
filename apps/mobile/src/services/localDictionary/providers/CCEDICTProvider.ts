// CC-CEDICT词库提供者
import { LocalDictionaryProvider, LocalQueryResult, DictionaryInfo } from '../types';
import { SQLiteManager } from '../storage/SQLiteManager';
import { DictionaryStorage } from '../storage/DictionaryStorage';
import { DictionaryDownloader } from '../downloader/DictionaryDownloader';

export class CCEDICTProvider implements LocalDictionaryProvider {
  readonly name = 'CC-CEDICT';
  readonly language = 'zh';
  readonly version = '2024.1';
  
  private sqliteManager: SQLiteManager;
  private storage: DictionaryStorage;
  private downloader: DictionaryDownloader;
  private isInitialized = false;
  private originalDownloadUri: string | null = null; // 存储原始下载URI
  private isDownloading = false; // 防止重复下载

  constructor() {
    this.storage = DictionaryStorage.getInstance();
    this.downloader = DictionaryDownloader.getInstance();
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
      console.log(`🔍 CCEDICT数据库词条数量: ${count}`);
      
      // 🔧 完整的CC-CEDICT应该有数万词条（约12万条）
      // 如果词条数量 >= 10000，认为词典可用
      if (count >= 10000) {
        console.log(`✅ CCEDICT数据库词条充足 (${count})，词典可用`);
        return true;
      }
      
      // 如果词条数量少于10000，检查是否需要重新下载和解析
      if (count < 10000) {
        console.log(`⚠️ CCEDICT数据库词条数量不足 (${count} < 10000)`);
        
        // 检查是否正在下载或解析中（避免重复触发）
        if (this.isDownloading) {
          console.log('⏳ 已有下载任务进行中，跳过重复下载');
          return false;
        }
        
        console.log('🔄 尝试下载和解析CC-CEDICT词典...');
        this.isDownloading = true;
        
        try {
          // 清空数据库
          await this.sqliteManager.clearEntries();
          
          // 删除旧文件（如果存在）
          try {
            await this.storage.deleteDictionaryFile('ccedict.txt');
          } catch (deleteError) {
            console.log('⚠️ 删除旧文件失败（可能不存在）:', deleteError);
          }
          
          // 下载词典
          const sources = this.downloader.getSupportedSources();
          const ccedictSource = sources.find(source => source.name === 'CC-CEDICT');
          
          if (ccedictSource) {
            console.log('📥 开始下载CC-CEDICT词典文件...');
            const downloadResult = await this.downloader.downloadDictionary(ccedictSource);
            
            if (downloadResult.success) {
              this.originalDownloadUri = downloadResult.originalUri || null;
              
              console.log('✅ 下载成功，开始解析...');
              const content = await this.storage.readDictionaryFileWithFallback('ccedict.txt', this.originalDownloadUri);
              
              if (content && content.length > 0) {
                console.log(`📄 文件内容长度: ${content.length} 字符`);
                const parseSuccess = await this.parseDictionaryFile(content);
                
                if (parseSuccess) {
                  const newCount = await this.sqliteManager.getEntryCount();
                  console.log(`✅ 下载和解析完成，新词条数量: ${newCount}`);
                  this.isDownloading = false;
                  return newCount >= 10000;
                } else {
                  console.log('❌ 解析失败');
                }
              } else {
                console.log('❌ 无法读取文件内容');
              }
            } else {
              console.log('❌ 下载失败:', downloadResult.error);
            }
          } else {
            console.log('❌ 找不到CC-CEDICT下载源');
          }
        } catch (error) {
          console.error('❌ 下载和解析失败:', error);
        } finally {
          this.isDownloading = false;
        }
        
        return false;
      }
      
      if (count === 0) {
        console.log('⚠️ CCEDICT数据库为空，检查是否需要下载和导入词典文件');
        
        // 检查是否有词典文件
        const hasFile = await this.storage.checkDictionaryExists('ccedict.txt');
        console.log(`📁 CCEDICT文件是否存在: ${hasFile}`);
        
        if (hasFile) {
          console.log('📚 发现CCEDICT文件，尝试读取和解析...');
          
          const content = await this.storage.readDictionaryFileWithFallback('ccedict.txt', this.originalDownloadUri);
          if (content && content.length > 0) {
            console.log(`📄 文件内容长度: ${content.length} 字符`);
            const parseSuccess = await this.parseDictionaryFile(content);
            if (parseSuccess) {
              const newCount = await this.sqliteManager.getEntryCount();
              console.log(`✅ 解析完成，新词条数量: ${newCount}`);
              return newCount > 0;
            } else {
              console.log('❌ 解析CCEDICT文件失败');
            }
          } else {
            console.log('❌ 无法读取CCEDICT文件内容或文件为空，可能是权限问题');
            console.log('🔄 尝试删除损坏的文件并重新下载...');
            
            // 尝试删除损坏的文件并重新下载
            try {
              await this.storage.deleteDictionaryFile('ccedict.txt');
              console.log('✅ 已删除损坏的文件');
              
              // 重新下载
              console.log('⚠️ 文件无法读取，尝试重新下载...');
              const sources = this.downloader.getSupportedSources();
              const ccedictSource = sources.find(source => source.name === 'CC-CEDICT');
              
              if (ccedictSource) {
                console.log('📥 开始重新下载CCEDICT词典文件...', { url: ccedictSource.url, filename: ccedictSource.filename });
                const downloadResult = await this.downloader.downloadDictionary(ccedictSource);
                
                console.log('📥 重新下载结果:', { success: downloadResult.success, error: downloadResult.error, originalUri: downloadResult.originalUri });
                
                if (downloadResult.success) {
                  // 存储原始下载URI
                  this.originalDownloadUri = downloadResult.originalUri || null;
                  
                  console.log('✅ 重新下载成功，尝试解析...');
                  const newContent = await this.storage.readDictionaryFileWithFallback('ccedict.txt', this.originalDownloadUri);
                  if (newContent && newContent.length > 0) {
                    console.log(`📄 重新下载文件内容长度: ${newContent.length} 字符`);
                    const parseSuccess = await this.parseDictionaryFile(newContent);
                    if (parseSuccess) {
                      const newCount = await this.sqliteManager.getEntryCount();
                      console.log(`✅ 重新下载和解析完成，新词条数量: ${newCount}`);
                      return newCount > 0;
                    } else {
                      console.log('❌ 重新下载的文件解析失败');
                    }
                  } else {
                    console.log('❌ 重新下载后仍然无法读取文件内容');
                  }
                } else {
                  console.log('❌ 重新下载失败:', downloadResult.error);
                }
              } else {
                console.log('❌ 找不到CCEDICT下载源');
              }
            } catch (deleteError) {
              console.log('❌ 删除和重新下载失败:', deleteError);
            }
          }
        } else {
          console.log('⚠️ CCEDICT文件不存在，尝试自动下载...');
          try {
            console.log('🔍 获取支持的词典源...');
            const sources = this.downloader.getSupportedSources();
            console.log(`📋 找到 ${sources.length} 个支持的词典源`);
            
            const ccedictSource = sources.find(source => source.name === 'CC-CEDICT');
            
            if (ccedictSource) {
              console.log('📥 开始下载CCEDICT词典文件...', { url: ccedictSource.url, filename: ccedictSource.filename });
              const downloadResult = await this.downloader.downloadDictionary(ccedictSource);
              
              console.log('📥 下载结果:', { success: downloadResult.success, error: downloadResult.error, originalUri: downloadResult.originalUri });
              
              if (downloadResult.success) {
                // 存储原始下载URI
                this.originalDownloadUri = downloadResult.originalUri || null;
                
                console.log('✅ CCEDICT文件下载成功，开始解析...');
                const content = await this.storage.readDictionaryFileWithFallback('ccedict.txt', this.originalDownloadUri);
                if (content) {
                  console.log(`📄 文件内容长度: ${content.length} 字符，开始解析...`);
                  const parseSuccess = await this.parseDictionaryFile(content);
                  if (parseSuccess) {
                    const newCount = await this.sqliteManager.getEntryCount();
                    console.log(`✅ 自动下载和解析完成，新词条数量: ${newCount}`);
                    return newCount > 0;
                  } else {
                    console.log('❌ 解析文件失败');
                  }
                } else {
                  console.log('❌ 下载后无法读取文件内容');
                }
              } else {
                console.log('❌ CCEDICT文件下载失败:', downloadResult.error);
              }
            } else {
              console.log('❌ 找不到CCEDICT下载源，可用源:', sources.map(s => s.name));
            }
          } catch (downloadError) {
            console.log('❌ 自动下载CCEDICT失败:', downloadError);
          }
        }
      }
      
      // 🔧 返回词条数量是否大于等于100（完整的CC-CEDICT应该有数万词条）
      return count >= 100;
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
      // 初始化存储目录
      await this.storage.initialize();
      console.log('✅ 词典存储目录初始化完成');
      
      // 初始化SQLite数据库
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

      // 执行查询 - 使用拼音精确查询
      const entries = await this.sqliteManager.searchEntriesByPinyin(input, 20);
      
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
   * 🔧 专门的拼音查询（用于输入法候选词）
   * 只返回拼音完全匹配的词汇，不含近似匹配
   */
  async lookupByPinyin(pinyin: string, limit: number = 10): Promise<LocalQueryResult> {
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

      // 标准化拼音：移除空格并转小写
      const normalizedPinyin = pinyin.toLowerCase().replace(/\s+/g, '');

      // 执行精确拼音查询
      const entries = await this.sqliteManager.searchEntriesByPinyin(normalizedPinyin, limit);
      
      const candidates = entries.map(entry => ({
        word: entry.word,
        translation: entry.translation,
        pinyin: entry.pinyin,
        partOfSpeech: entry.partOfSpeech,
        confidence: 1.0, // 拼音精确匹配，置信度都是1.0
        source: this.name
      }));

      return {
        success: true,
        candidates,
        totalCount: candidates.length,
        queryTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('❌ CC-CEDICT拼音查询失败:', error);
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
      console.log(`📄 文件内容长度: ${content.length} 字符`);
      
      // 清空现有数据
      await this.sqliteManager.clearEntries();
      
      const lines = content.split('\n');
      const entries = [];
      let processedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      console.log(`📋 总行数: ${lines.length}`);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 跳过注释行和空行
        if (line.startsWith('#') || line.trim() === '') {
          skippedCount++;
          continue;
        }

        // 解析CC-CEDICT格式: 繁体 简体 [拼音] /英文释义/
        // 示例: 電池 电池 [dian4 chi2] /battery/
        // ⚠️ CRITICAL FIX: 运行时动态构建正则表达式，绕过Metro缓存
        // 支持所有字符：数字(110)、字母+数字(3C)、特殊符号(%)、中文等
        const regexPattern = '^' + '(.+?)' + '\\s+' + '(.+?)' + '\\s+' + '\\[([^\\]]+)\\]' + '\\s+' + '\\/(.+)\\/$';
        const regex = new RegExp(regexPattern);
        const match = line.match(regex);
        if (match) {
          const [, traditional, simplified, pinyin, translation] = match;
          
          // 优先使用简体字作为词条
          entries.push({
            word: simplified,
            translation: translation,
            pinyin: pinyin,
            partOfSpeech: '',  // CC-CEDICT不包含词性信息
            frequency: 0
          });

          processedCount++;
          
          // 每1000条插入一次
          if (entries.length >= 1000) {
            try {
              await this.sqliteManager.insertEntries(entries);
              entries.length = 0;
              console.log(`📊 已处理 ${processedCount} 条词条...`);
            } catch (insertError) {
              console.error(`❌ 批量插入失败 (第${processedCount}条):`, insertError);
              errorCount++;
              // 继续处理，不中断
            }
          }
        } else {
          // 记录无法解析的行（仅前10行）
          if (errorCount < 10) {
            console.log(`⚠️ 无法解析行 ${i + 1}: ${line.substring(0, 100)}...`);
          }
          errorCount++;
        }
      }

      // 插入剩余词条
      if (entries.length > 0) {
        try {
          await this.sqliteManager.insertEntries(entries);
          console.log(`📊 插入剩余 ${entries.length} 条词条`);
        } catch (insertError) {
          console.error(`❌ 插入剩余词条失败:`, insertError);
          errorCount++;
        }
      }

      console.log(`✅ CC-CEDICT文件解析完成:`);
      console.log(`   - 总行数: ${lines.length}`);
      console.log(`   - 跳过行数: ${skippedCount} (注释和空行)`);
      console.log(`   - 成功解析: ${processedCount} 条词条`);
      console.log(`   - 解析错误: ${errorCount} 行`);
      
      return processedCount > 0;
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
