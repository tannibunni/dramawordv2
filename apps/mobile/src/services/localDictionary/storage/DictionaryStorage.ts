// 词库存储管理器
import * as FileSystem from 'expo-file-system';
import { DictionaryStorageInfo, DictionaryInfo } from '../types';

export class DictionaryStorage {
  private static instance: DictionaryStorage;
  private storageDir: string;

  constructor() {
    this.storageDir = `${FileSystem.documentDirectory}dictionaries/`;
  }

  static getInstance(): DictionaryStorage {
    if (!DictionaryStorage.instance) {
      DictionaryStorage.instance = new DictionaryStorage();
    }
    return DictionaryStorage.instance;
  }

  /**
   * 初始化存储目录
   */
  async initialize(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.storageDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.storageDir, { intermediates: true });
        console.log(`✅ 创建词库存储目录: ${this.storageDir}`);
      }
    } catch (error) {
      console.error('❌ 初始化词库存储目录失败:', error);
      throw error;
    }
  }

  /**
   * 检查词库文件是否存在
   */
  async checkDictionaryExists(dictionaryName: string): Promise<boolean> {
    try {
      const filePath = this.getDictionaryPath(dictionaryName);
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.exists;
    } catch (error) {
      console.error(`❌ 检查词库文件失败: ${dictionaryName}`, error);
      return false;
    }
  }

  /**
   * 获取词库文件路径
   */
  getDictionaryPath(dictionaryName: string): string {
    return `${this.storageDir}${dictionaryName}`;
  }

  /**
   * 获取词库文件信息
   */
  async getDictionaryInfo(dictionaryName: string): Promise<DictionaryStorageInfo | null> {
    try {
      const filePath = this.getDictionaryPath(dictionaryName);
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (!fileInfo.exists) {
        return null;
      }

      return {
        name: dictionaryName,
        filePath: filePath,
        size: fileInfo.size || 0,
        lastModified: new Date(fileInfo.modificationTime || 0),
        isDownloaded: true,
        isParsed: false // TODO: 检查是否已解析到数据库
      };
    } catch (error) {
      console.error(`❌ 获取词库信息失败: ${dictionaryName}`, error);
      return null;
    }
  }

  /**
   * 获取所有词库文件信息
   */
  async getAllDictionaryInfo(): Promise<DictionaryStorageInfo[]> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.storageDir);
      if (!dirInfo.exists) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(this.storageDir);
      const dictionaryInfos: DictionaryStorageInfo[] = [];

      for (const file of files) {
        const info = await this.getDictionaryInfo(file);
        if (info) {
          dictionaryInfos.push(info);
        }
      }

      return dictionaryInfos;
    } catch (error) {
      console.error('❌ 获取所有词库信息失败:', error);
      return [];
    }
  }

  /**
   * 保存词库文件
   */
  async saveDictionaryFile(
    dictionaryName: string, 
    content: string, 
    encoding: 'utf8' | 'base64' = 'utf8'
  ): Promise<boolean> {
    try {
      const filePath = this.getDictionaryPath(dictionaryName);
      await FileSystem.writeAsStringAsync(filePath, content, { encoding });
      console.log(`✅ 词库文件保存成功: ${dictionaryName}`);
      return true;
    } catch (error) {
      console.error(`❌ 保存词库文件失败: ${dictionaryName}`, error);
      return false;
    }
  }

  /**
   * 读取词库文件
   */
  async readDictionaryFile(
    dictionaryName: string, 
    encoding: 'utf8' | 'base64' = 'utf8'
  ): Promise<string | null> {
    try {
      const filePath = this.getDictionaryPath(dictionaryName);
      console.log(`🔍 尝试读取文件: ${filePath}`);
      
      // 首先检查文件是否存在和权限
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      console.log(`📁 文件信息:`, { 
        exists: fileInfo.exists, 
        size: fileInfo.size, 
        uri: fileInfo.uri,
        isDirectory: fileInfo.isDirectory 
      });
      
      if (!fileInfo.exists) {
        console.log(`❌ 文件不存在: ${filePath}`);
        return null;
      }
      
      if (fileInfo.isDirectory) {
        console.log(`❌ 路径是目录而不是文件: ${filePath}`);
        return null;
      }
      
      // 尝试读取文件内容 - 使用多种策略处理权限问题
      let content: string | null = null;
      let lastError: any = null;
      
      // 策略1: 直接读取
      try {
        content = await FileSystem.readAsStringAsync(filePath, { encoding });
        console.log(`✅ 直接读取成功，内容长度: ${content.length}`);
        return content;
      } catch (readError) {
        console.log(`❌ 直接读取失败:`, readError);
        lastError = readError;
      }
      
      // 策略2: 使用fileInfo.uri读取 
      try {
        const newFileInfo = await FileSystem.getInfoAsync(filePath);
        console.log(`🔍 重新获取文件信息:`, newFileInfo);
        
        if (newFileInfo.uri) {
          console.log(`🔄 尝试使用fileInfo.uri读取: ${newFileInfo.uri}`);
          try {
            content = await FileSystem.readAsStringAsync(newFileInfo.uri, { encoding });
            console.log(`✅ URI读取成功，内容长度: ${content.length}`);
            return content;
          } catch (uriError) {
            console.log(`❌ 使用fileInfo.uri读取失败:`, uriError);
            lastError = uriError;
          }
        }
        
        // 尝试使用原始路径但添加不同参数
        console.log(`🔄 尝试不同编码参数读取: ${filePath}`);
        try {
          content = await FileSystem.readAsStringAsync(filePath, { 
            encoding: encoding === 'utf8' ? 'utf8' : 'base64'
          });
          console.log(`✅ 参数调整读取成功，内容长度: ${content.length}`);
          return content;
        } catch (paramError) {
          console.log(`❌ 参数调整读取失败:`, paramError);
          lastError = paramError;
        }
      } catch (uriError) {
        console.log(`❌ 策略2完全失败:`, uriError);
        lastError = uriError;
      }
      
      // 策略3: 尝试复制文件到新位置再读取
      try {
        console.log(`🔄 尝试复制文件到新位置解决权限问题...`);
        const newFilePath = `${filePath}.copy`;
        
        // 先删除可能存在的副本
        const copyInfo = await FileSystem.getInfoAsync(newFilePath);
        if (copyInfo.exists) {
          await FileSystem.deleteAsync(newFilePath);
        }
        
        // 复制文件
        await FileSystem.copyAsync({
          from: filePath,
          to: newFilePath
        });
        
        console.log(`📁 文件已复制，尝试读取副本...`);
        content = await FileSystem.readAsStringAsync(newFilePath, { encoding });
        
        // 读取成功后，删除副本
        await FileSystem.deleteAsync(newFilePath);
        
        console.log(`✅ 复制读取成功，内容长度: ${content.length}`);
        return content;
      } catch (copyError) {
        console.log(`❌ 复制读取失败:`, copyError);
        lastError = copyError;
      }
      
      // 所有策略都失败，抛出最后一个错误
      console.log(`❌ 所有读取策略都失败，最后的错误:`, lastError);
      throw lastError || new Error('无法读取文件');
      
    } catch (error) {
      console.error(`❌ 读取词库文件失败: ${dictionaryName}`, {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        filePath: this.getDictionaryPath(dictionaryName)
      });
      return null;
    }
  }

  /**
   * 读取词库文件 - 带备用URI支持
   */
  async readDictionaryFileWithFallback(
    dictionaryName: string, 
    fallbackUri: string | null,
    encoding: 'utf8' | 'base64' = 'utf8'
  ): Promise<string | null> {
    try {
      // 首先尝试正常读取
      const normalContent = await this.readDictionaryFile(dictionaryName, encoding);
      if (normalContent) {
        console.log(`✅ 正常读取成功: ${dictionaryName}`);
        return normalContent;
      }

      // 如果正常读取失败且提供了备用URI，尝试读取备用URI
      if (fallbackUri) {
        console.log(`🔄 正常读取失败，尝试使用备用URI: ${fallbackUri}`);
        try {
          const fallbackContent = await FileSystem.readAsStringAsync(fallbackUri, { encoding });
          console.log(`✅ 备用URI读取成功，内容长度: ${fallbackContent.length}`);
          return fallbackContent;
        } catch (fallbackError) {
          console.log(`❌ 备用URI读取失败:`, fallbackError);
        }
      }

      console.log(`❌ 所有读取方式都失败: ${dictionaryName}`);
      return null;
    } catch (error) {
      console.error(`❌ 读取词库文件失败 (带备用): ${dictionaryName}`, error);
      return null;
    }
  }

  /**
   * 删除词库文件
   */
  async deleteDictionaryFile(dictionaryName: string): Promise<boolean> {
    try {
      const filePath = this.getDictionaryPath(dictionaryName);
      await FileSystem.deleteAsync(filePath);
      console.log(`✅ 词库文件删除成功: ${dictionaryName}`);
      return true;
    } catch (error) {
      console.error(`❌ 删除词库文件失败: ${dictionaryName}`, error);
      return false;
    }
  }

  /**
   * 获取存储目录大小
   */
  async getStorageSize(): Promise<number> {
    try {
      const dictionaryInfos = await this.getAllDictionaryInfo();
      return dictionaryInfos.reduce((total, info) => total + info.size, 0);
    } catch (error) {
      console.error('❌ 获取存储大小失败:', error);
      return 0;
    }
  }

  /**
   * 清理存储空间
   */
  async cleanupStorage(): Promise<number> {
    try {
      const dictionaryInfos = await this.getAllDictionaryInfo();
      let cleanedSize = 0;

      for (const info of dictionaryInfos) {
        // 删除超过30天的临时文件
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (info.lastModified < thirtyDaysAgo && info.name.includes('temp')) {
          await this.deleteDictionaryFile(info.name);
          cleanedSize += info.size;
        }
      }

      console.log(`✅ 存储清理完成，释放空间: ${cleanedSize} bytes`);
      return cleanedSize;
    } catch (error) {
      console.error('❌ 存储清理失败:', error);
      return 0;
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
      const totalSize = await this.getStorageSize();
      const dictionaryInfos = await this.getAllDictionaryInfo();
      const fileCount = dictionaryInfos.length;
      
      // 获取可用空间（简化实现）
      const availableSpace = 1024 * 1024 * 1024; // 假设1GB可用空间

      return {
        totalSize,
        fileCount,
        availableSpace
      };
    } catch (error) {
      console.error('❌ 获取存储统计失败:', error);
      return {
        totalSize: 0,
        fileCount: 0,
        availableSpace: 0
      };
    }
  }
}
