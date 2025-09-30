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
      const content = await FileSystem.readAsStringAsync(filePath, { encoding });
      return content;
    } catch (error) {
      console.error(`❌ 读取词库文件失败: ${dictionaryName}`, error);
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
