// 词典文件下载服务
import * as FileSystem from 'expo-file-system';
import { API_BASE_URL } from '../constants/config';

export interface DictionaryFileInfo {
  id: string;
  name: string;
  language: string;
  description: string;
  available: boolean;
  fileSize: number;
  lastModified: string | null;
  downloadUrl: string | null;
}

export interface DictionaryListResponse {
  success: boolean;
  data: {
    dictionaries: DictionaryFileInfo[];
    totalCount: number;
    availableCount: number;
  };
  error?: string;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class DictionaryFileService {
  private static instance: DictionaryFileService;
  private downloadCallbacks: Map<string, (progress: DownloadProgress) => void> = new Map();

  static getInstance(): DictionaryFileService {
    if (!DictionaryFileService.instance) {
      DictionaryFileService.instance = new DictionaryFileService();
    }
    return DictionaryFileService.instance;
  }

  /**
   * 获取词典文件列表
   */
  async getDictionaryList(): Promise<DictionaryListResponse> {
    try {
      console.log('📚 获取词典文件列表...');
      
      const response = await fetch(`${API_BASE_URL}/api/dictionary/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ 获取词典文件列表成功: ${data.data.totalCount} 个词典`);
      
      return data;
    } catch (error) {
      console.error('❌ 获取词典文件列表失败:', error);
      return {
        success: false,
        data: {
          dictionaries: [],
          totalCount: 0,
          availableCount: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取词典文件信息
   */
  async getDictionaryInfo(dictionaryId: string): Promise<{ success: boolean; data?: DictionaryFileInfo; error?: string }> {
    try {
      console.log(`📊 获取词典文件信息: ${dictionaryId}`);
      
      const response = await fetch(`${API_BASE_URL}/api/dictionary/info/${dictionaryId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ 获取词典文件信息成功: ${data.data.name}`);
      
      return data;
    } catch (error) {
      console.error('❌ 获取词典文件信息失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 下载词典文件
   */
  async downloadDictionary(
    dictionaryId: string, 
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      console.log(`📥 开始下载词典文件: ${dictionaryId}`);
      
      // 获取词典信息
      const infoResult = await this.getDictionaryInfo(dictionaryId);
      if (!infoResult.success || !infoResult.data) {
        throw new Error('无法获取词典文件信息');
      }

      const dictionaryInfo = infoResult.data;
      if (!dictionaryInfo.available || !dictionaryInfo.downloadUrl) {
        throw new Error('词典文件不可用');
      }

      // 设置下载路径
      const fileName = `${dictionaryId}.txt`;
      const downloadPath = `${FileSystem.documentDirectory}dictionaries/${fileName}`;
      
      // 确保目录存在
      const dirPath = `${FileSystem.documentDirectory}dictionaries/`;
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
        console.log(`📁 创建词典目录: ${dirPath}`);
      }

      // 检查文件是否已存在
      const fileInfo = await FileSystem.getInfoAsync(downloadPath);
      if (fileInfo.exists) {
        console.log(`⚠️ 文件已存在，跳过下载: ${downloadPath}`);
        return {
          success: true,
          filePath: downloadPath
        };
      }

      // 设置进度回调
      if (onProgress) {
        this.downloadCallbacks.set(dictionaryId, onProgress);
      }

      // 开始下载
      const downloadResult = await FileSystem.createDownloadResumable(
        dictionaryInfo.downloadUrl,
        downloadPath,
        {},
        (downloadProgress) => {
          const progress: DownloadProgress = {
            loaded: downloadProgress.totalBytesWritten,
            total: downloadProgress.totalBytesExpectedToWrite,
            percentage: downloadProgress.totalBytesExpectedToWrite > 0 
              ? (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100 
              : 0
          };
          
          console.log(`📊 下载进度: ${progress.percentage.toFixed(1)}% (${progress.loaded}/${progress.total})`);
          
          // 调用进度回调
          const callback = this.downloadCallbacks.get(dictionaryId);
          if (callback) {
            callback(progress);
          }
        }
      );

      const result = await downloadResult.downloadAsync();
      
      if (result) {
        console.log(`✅ 词典文件下载完成: ${result.uri}`);
        
        // 清理进度回调
        this.downloadCallbacks.delete(dictionaryId);
        
        return {
          success: true,
          filePath: result.uri
        };
      } else {
        throw new Error('下载失败');
      }
      
    } catch (error) {
      console.error('❌ 下载词典文件失败:', error);
      
      // 清理进度回调
      this.downloadCallbacks.delete(dictionaryId);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 检查词典文件是否存在
   */
  async checkDictionaryExists(dictionaryId: string): Promise<boolean> {
    try {
      const fileName = `${dictionaryId}.txt`;
      const filePath = `${FileSystem.documentDirectory}dictionaries/${fileName}`;
      
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.exists;
    } catch (error) {
      console.error('❌ 检查词典文件存在性失败:', error);
      return false;
    }
  }

  /**
   * 获取本地词典文件路径
   */
  getLocalDictionaryPath(dictionaryId: string): string {
    const fileName = `${dictionaryId}.txt`;
    return `${FileSystem.documentDirectory}dictionaries/${fileName}`;
  }

  /**
   * 删除本地词典文件
   */
  async deleteLocalDictionary(dictionaryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const filePath = this.getLocalDictionaryPath(dictionaryId);
      
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
        console.log(`🗑️ 删除本地词典文件: ${filePath}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ 删除本地词典文件失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取本地词典文件信息
   */
  async getLocalDictionaryInfo(dictionaryId: string): Promise<{ 
    success: boolean; 
    data?: { 
      exists: boolean; 
      size: number; 
      uri: string; 
      modificationTime: number; 
    }; 
    error?: string 
  }> {
    try {
      const filePath = this.getLocalDictionaryPath(dictionaryId);
      
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists) {
        return {
          success: true,
          data: {
            exists: true,
            size: fileInfo.size || 0,
            uri: filePath,
            modificationTime: fileInfo.modificationTime || 0
          }
        };
      } else {
        return {
          success: true,
          data: {
            exists: false,
            size: 0,
            uri: filePath,
            modificationTime: 0
          }
        };
      }
    } catch (error) {
      console.error('❌ 获取本地词典文件信息失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 取消下载
   */
  async cancelDownload(dictionaryId: string): Promise<void> {
    try {
      // 清理进度回调
      this.downloadCallbacks.delete(dictionaryId);
      
      // 这里可以添加实际的取消下载逻辑
      // 由于 expo-file-system 的下载是异步的，取消可能需要额外的实现
      
      console.log(`🚫 取消下载: ${dictionaryId}`);
    } catch (error) {
      console.error('❌ 取消下载失败:', error);
    }
  }
}

export default DictionaryFileService;
