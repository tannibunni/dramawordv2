import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';
import { NewDeviceDetectionService, DeviceInfo } from './newDeviceDetectionService';

export interface CloudData {
  vocabulary: any[];
  shows: any[];
  learningRecords: any[];
  experience: any;
  badges: any[];
  userStats: any;
  lastModified: number;
  syncVersion: number;
}

export interface DownloadResult {
  success: boolean;
  data?: CloudData;
  message: string;
  error?: string;
  downloadTime: number;
  dataSize: number;
}

export class CloudDataDownloadService {
  private static instance: CloudDataDownloadService;
  private isDownloading: boolean = false;
  private downloadProgress: number = 0;

  public static getInstance(): CloudDataDownloadService {
    if (!CloudDataDownloadService.instance) {
      CloudDataDownloadService.instance = new CloudDataDownloadService();
    }
    return CloudDataDownloadService.instance;
  }

  private constructor() {}

  // 下载云端数据
  public async downloadCloudData(appleId: string): Promise<DownloadResult> {
    try {
      if (this.isDownloading) {
        return {
          success: false,
          message: '下载正在进行中，请稍候',
          downloadTime: 0,
          dataSize: 0
        };
      }

      console.log('☁️ 开始下载云端数据...');
      this.isDownloading = true;
      this.downloadProgress = 0;

      const startTime = Date.now();

      // 1. 获取云端数据
      const cloudData = await this.fetchCloudData(appleId);
      
      if (!cloudData.success || !cloudData.data) {
        throw new Error(cloudData.message || '获取云端数据失败');
      }

      // 2. 验证数据完整性
      const isValidData = this.validateCloudData(cloudData.data);
      if (!isValidData) {
        throw new Error('云端数据格式无效');
      }

      // 3. 计算数据大小
      const dataSize = this.calculateDataSize(cloudData.data);
      
      // 4. 更新下载进度
      this.downloadProgress = 100;

      const downloadTime = Date.now() - startTime;
      
      console.log(`✅ 云端数据下载完成: ${dataSize} bytes, 耗时: ${downloadTime}ms`);

      return {
        success: true,
        data: cloudData.data,
        message: '云端数据下载成功',
        downloadTime,
        dataSize
      };

    } catch (error) {
      console.error('❌ 云端数据下载失败:', error);
      
      return {
        success: false,
        message: '云端数据下载失败',
        error: error instanceof Error ? error.message : 'Unknown error',
        downloadTime: 0,
        dataSize: 0
      };
    } finally {
      this.isDownloading = false;
    }
  }

  // 获取云端数据
  private async fetchCloudData(appleId: string): Promise<any> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('未找到认证token');
      }

      console.log('📡 正在获取云端数据...');
      this.downloadProgress = 20;

      const response = await fetch(`${API_BASE_URL}/sync/apple/${appleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // 云端没有数据，返回空数据结构
          console.log('ℹ️ 云端暂无数据');
          return {
            success: true,
            data: this.getEmptyCloudData()
          };
        }
        throw new Error(`获取云端数据失败: ${response.status}`);
      }

      this.downloadProgress = 60;
      const cloudData = await response.json();
      
      if (!cloudData.success) {
        throw new Error(cloudData.message || '云端数据获取失败');
      }

      this.downloadProgress = 80;
      return cloudData;

    } catch (error) {
      console.error('❌ 获取云端数据失败:', error);
      throw error;
    }
  }

  // 验证云端数据
  private validateCloudData(data: any): boolean {
    try {
      // 检查必需字段
      const requiredFields = ['vocabulary', 'shows', 'learningRecords', 'experience', 'badges', 'userStats'];
      
      for (const field of requiredFields) {
        if (!(field in data)) {
          console.warn(`⚠️ 云端数据缺少字段: ${field}`);
          return false;
        }
      }

      // 检查数据类型
      if (!Array.isArray(data.vocabulary)) {
        console.warn('⚠️ 云端数据vocabulary字段类型错误');
        return false;
      }

      if (!Array.isArray(data.shows)) {
        console.warn('⚠️ 云端数据shows字段类型错误');
        return false;
      }

      if (!Array.isArray(data.learningRecords)) {
        console.warn('⚠️ 云端数据learningRecords字段类型错误');
        return false;
      }

      if (typeof data.experience !== 'object') {
        console.warn('⚠️ 云端数据experience字段类型错误');
        return false;
      }

      if (!Array.isArray(data.badges)) {
        console.warn('⚠️ 云端数据badges字段类型错误');
        return false;
      }

      if (typeof data.userStats !== 'object') {
        console.warn('⚠️ 云端数据userStats字段类型错误');
        return false;
      }

      console.log('✅ 云端数据验证通过');
      return true;

    } catch (error) {
      console.error('❌ 云端数据验证失败:', error);
      return false;
    }
  }

  // 计算数据大小
  private calculateDataSize(data: CloudData): number {
    try {
      const jsonString = JSON.stringify(data);
      return new Blob([jsonString]).size;
    } catch (error) {
      console.warn('⚠️ 计算数据大小失败:', error);
      return 0;
    }
  }

  // 获取空数据结构
  private getEmptyCloudData(): CloudData {
    return {
      vocabulary: [],
      shows: [],
      learningRecords: [],
      experience: {
        experience: 0,
        level: 1,
        totalExperience: 0,
        lastLevelUp: Date.now()
      },
      badges: [],
      userStats: {
        totalWords: 0,
        masteredWords: 0,
        learningDays: 0,
        currentStreak: 0,
        totalReviews: 0,
        accuracy: 0
      },
      lastModified: Date.now(),
      syncVersion: 0
    };
  }

  // 获取认证token
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('❌ 获取认证token失败:', error);
      return null;
    }
  }

  // 获取下载进度
  public getDownloadProgress(): number {
    return this.downloadProgress;
  }

  // 检查是否正在下载
  public isCurrentlyDownloading(): boolean {
    return this.isDownloading;
  }

  // 重置下载状态
  public resetDownloadState(): void {
    this.isDownloading = false;
    this.downloadProgress = 0;
  }

  // 获取下载统计信息
  public async getDownloadStats(appleId: string): Promise<any> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/sync/apple/${appleId}/overview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const stats = await response.json();
      return stats;

    } catch (error) {
      console.error('❌ 获取下载统计信息失败:', error);
      return null;
    }
  }
}
