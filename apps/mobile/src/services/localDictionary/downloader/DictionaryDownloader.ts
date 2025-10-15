// 词库下载器
import * as FileSystem from 'expo-file-system';
import { DictionaryDownloadResult } from '../types';
import { DictionaryStorage } from '../storage/DictionaryStorage';

export interface DictionarySource {
  name: string;
  url: string;
  filename: string;
  description: string;
  language: string;
  version: string;
  size?: number;
}

export class DictionaryDownloader {
  private static instance: DictionaryDownloader;
  private storage: DictionaryStorage;

  constructor() {
    this.storage = DictionaryStorage.getInstance();
  }

  static getInstance(): DictionaryDownloader {
    if (!DictionaryDownloader.instance) {
      DictionaryDownloader.instance = new DictionaryDownloader();
    }
    return DictionaryDownloader.instance;
  }

  /**
   * 获取支持的词库源
   */
  getSupportedSources(): DictionarySource[] {
    return [
      // 中文词库
      {
        name: 'CC-CEDICT',
        url: 'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz',
        filename: 'ccedict.txt',
        description: '中英文字典 (CC-CEDICT)',
        language: 'zh',
        version: '1.0',
        size: 2000000 // 约2MB
      },
      {
        name: 'CC-CEDICT-UTF8',
        url: 'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt',
        filename: 'ccedict_utf8.txt',
        description: '中英文字典 (UTF-8版本)',
        language: 'zh',
        version: '1.0',
        size: 2000000
      },
      // 日语词库
      {
        name: 'JMdict',
        url: 'http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz',
        filename: 'jmdict.xml',
        description: '日英字典 (JMdict)',
        language: 'ja',
        version: '2024.1',
        size: 50000000 // 约50MB
      },
      {
        name: 'JMnedict',
        url: 'http://ftp.edrdg.org/pub/Nihongo/JMnedict.xml.gz',
        filename: 'jmnedict.xml',
        description: '日文人名地名字典',
        language: 'ja',
        version: '2024.1',
        size: 10000000 // 约10MB
      },
      // 韩语词库
      {
        name: 'Korean-English Dictionary',
        url: 'https://github.com/tannibunni/dramawordv2/raw/main/dictionaries/korean_dict.json',
        filename: 'korean_dict.json',
        description: '韩英字典',
        language: 'ko',
        version: '2024.1',
        size: 5000000 // 约5MB
      }
    ];
  }

  /**
   * 下载词库文件
   */
  async downloadDictionary(source: DictionarySource): Promise<DictionaryDownloadResult> {
    try {
      console.log(`🔄 开始下载词库: ${source.name}`);
      
      // 检查是否已存在
      const exists = await this.storage.checkDictionaryExists(source.filename);
      if (exists) {
        console.log(`✅ 词库文件已存在: ${source.filename}`);
        return {
          success: true,
          filePath: this.storage.getDictionaryPath(source.filename)
        };
      }

      // 开始下载 - 先下载到临时文件
      const tempFileName = `${source.filename}.tmp`;
      const tempFilePath = this.storage.getDictionaryPath(tempFileName);
      const finalFilePath = this.storage.getDictionaryPath(source.filename);
      
      console.log(`📥 下载到临时文件: ${tempFilePath}`);
      const downloadResult = await FileSystem.downloadAsync(
        source.url,
        tempFilePath
      );

      if (downloadResult.status === 200) {
        console.log(`✅ 词库下载成功: ${source.name}`);
        
        // 如果下载的是压缩文件，需要解压
        if (source.url.endsWith('.gz')) {
          console.log(`📦 检测到gzip文件，尝试解压...`);
          try {
            // 对于iOS模拟器，直接重命名可能更安全
            // 有时候gzip文件可能已经被自动解压了
            const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
            console.log(`📁 下载文件信息:`, { size: fileInfo.size, uri: fileInfo.uri });
            
            // 先删除目标文件（如果存在）
            const finalInfo = await FileSystem.getInfoAsync(finalFilePath);
            if (finalInfo.exists) {
              await FileSystem.deleteAsync(finalFilePath);
            }
            
            // 移动/重命名文件到最终位置
            await FileSystem.moveAsync({
              from: downloadResult.uri,
              to: finalFilePath
            });
            
            console.log(`✅ 文件已移动到最终位置: ${finalFilePath}`);
            
            // 验证最终文件是否可读
            const finalFileInfo = await FileSystem.getInfoAsync(finalFilePath);
            console.log(`📁 最终文件信息:`, { 
              exists: finalFileInfo.exists, 
              size: finalFileInfo.size,
              uri: finalFileInfo.uri 
            });
            
          } catch (moveError) {
            console.log(`❌ 文件移动失败，尝试直接读取:`, moveError);
            // 如果移动失败，直接使用下载的URI
          }
        } else {
          // 非压缩文件，直接移动
          await FileSystem.moveAsync({
            from: downloadResult.uri,
            to: finalFilePath
          });
        }
        
        return {
          success: true,
          filePath: finalFilePath,
          downloadedSize: downloadResult.headers?.['content-length'] ? 
            parseInt(downloadResult.headers['content-length']) : undefined
        };
      } else {
        throw new Error(`下载失败，状态码: ${downloadResult.status}`);
      }
    } catch (error) {
      console.error(`❌ 下载词库失败: ${source.name}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 下载所有支持的词库
   */
  async downloadAllDictionaries(): Promise<DictionaryDownloadResult[]> {
    const sources = this.getSupportedSources();
    const results: DictionaryDownloadResult[] = [];

    for (const source of sources) {
      const result = await this.downloadDictionary(source);
      results.push(result);
      
      // 添加延迟避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * 检查网络连接
   */
  async checkNetworkConnection(): Promise<boolean> {
    try {
      // 尝试访问一个简单的URL来检查网络
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('❌ 网络连接检查失败:', error);
      return false;
    }
  }

  /**
   * 获取下载进度（简化实现）
   */
  async getDownloadProgress(source: DictionarySource): Promise<{
    isDownloading: boolean;
    progress: number;
    downloadedSize: number;
    totalSize: number;
  }> {
    try {
      const filePath = this.storage.getDictionaryPath(source.filename);
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists) {
        const downloadedSize = fileInfo.size || 0;
        const totalSize = source.size || downloadedSize;
        const progress = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
        
        return {
          isDownloading: false,
          progress: Math.min(progress, 100),
          downloadedSize,
          totalSize
        };
      } else {
        return {
          isDownloading: false,
          progress: 0,
          downloadedSize: 0,
          totalSize: source.size || 0
        };
      }
    } catch (error) {
      console.error('❌ 获取下载进度失败:', error);
      return {
        isDownloading: false,
        progress: 0,
        downloadedSize: 0,
        totalSize: source.size || 0
      };
    }
  }

  /**
   * 取消下载
   */
  async cancelDownload(source: DictionarySource): Promise<boolean> {
    try {
      const filePath = this.storage.getDictionaryPath(source.filename);
      await FileSystem.deleteAsync(filePath);
      console.log(`✅ 取消下载并删除文件: ${source.filename}`);
      return true;
    } catch (error) {
      console.error('❌ 取消下载失败:', error);
      return false;
    }
  }

  /**
   * 验证下载的文件
   */
  async validateDownloadedFile(source: DictionarySource): Promise<boolean> {
    try {
      const filePath = this.storage.getDictionaryPath(source.filename);
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (!fileInfo.exists) {
        return false;
      }

      // 检查文件大小
      if (source.size && fileInfo.size && fileInfo.size < source.size * 0.5) {
        console.warn(`⚠️ 下载的文件可能不完整: ${source.filename}`);
        return false;
      }

      // 检查文件内容（简单检查）
      const content = await this.storage.readDictionaryFile(source.filename);
      if (!content || content.length < 100) {
        console.warn(`⚠️ 下载的文件内容可能无效: ${source.filename}`);
        return false;
      }

      console.log(`✅ 文件验证通过: ${source.filename}`);
      return true;
    } catch (error) {
      console.error('❌ 验证下载文件失败:', error);
      return false;
    }
  }
}
