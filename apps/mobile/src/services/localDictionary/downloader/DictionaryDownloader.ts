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
      // 中文词库 - 使用未压缩版本避免gzip解压问题
      {
        name: 'CC-CEDICT',
        url: 'https://cdn.jsdelivr.net/gh/skishore/makemeahanzi@master/cedict_ts.u8',
        filename: 'ccedict.txt',
        description: '中英文字典 (CC-CEDICT)',
        language: 'zh',
        version: '1.0',
        size: 10000000 // 约10MB (未压缩)
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

      // 🔧 解决方案：下载到cacheDirectory（有完整读写权限），然后复制到documentDirectory
      const tempFilePath = `${FileSystem.cacheDirectory}${source.filename}.tmp`;
      const finalFilePath = this.storage.getDictionaryPath(source.filename);
      
      console.log(`📥 下载文件到缓存目录: ${tempFilePath}`);
      const downloadResult = await FileSystem.downloadAsync(
        source.url,
        tempFilePath
      );

      if (downloadResult.status === 200) {
        console.log(`✅ 词库下载成功: ${source.name}`);
        
        // 🔧 验证下载文件可读性（在cacheDirectory中）
        console.log(`🔍 验证缓存文件可读性: ${downloadResult.uri}`);
        try {
          const cacheContent = await FileSystem.readAsStringAsync(downloadResult.uri, { encoding: 'utf8' });
          console.log(`✅ 缓存文件可读，内容长度: ${cacheContent.length} 字符`);
          
          // 先删除目标文件（如果存在）
          const finalInfo = await FileSystem.getInfoAsync(finalFilePath);
          if (finalInfo.exists) {
            console.log(`🔄 删除旧文件: ${finalFilePath}`);
            await FileSystem.deleteAsync(finalFilePath);
          }
          
          // 🔧 直接写入内容到documentDirectory（避免move/copy的权限问题）
          console.log(`📝 写入内容到最终位置: ${finalFilePath}`);
          await FileSystem.writeAsStringAsync(finalFilePath, cacheContent, { encoding: 'utf8' });
          
          // 验证写入成功
          const finalFileInfo = await FileSystem.getInfoAsync(finalFilePath);
          console.log(`📁 最终文件信息:`, { 
            exists: finalFileInfo.exists, 
            size: finalFileInfo.size,
            uri: finalFileInfo.uri 
          });
          
          // 清理缓存文件
          try {
            await FileSystem.deleteAsync(downloadResult.uri);
            console.log(`🗑️ 已清理缓存文件`);
          } catch (cleanupError) {
            console.log(`⚠️ 清理缓存文件失败（可忽略）:`, cleanupError);
          }
          
          return {
            success: true,
            filePath: finalFilePath,
            originalUri: finalFileInfo.uri || finalFilePath,
            downloadedSize: cacheContent.length
          };
          
        } catch (readError) {
          console.error(`❌ 缓存文件不可读:`, readError);
          throw new Error(`下载的文件无法读取: ${readError}`);
        }
        
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
