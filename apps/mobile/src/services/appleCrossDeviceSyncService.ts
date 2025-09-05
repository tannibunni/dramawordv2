/**
 * ========================================
 * 🔄 [SYNC SERVICE] 数据同步服务
 * ========================================
 * 
 * 服务类型: 数据同步相关服务
 * 功能描述: Apple跨设备同步服务 - 跨设备同步
 * 维护状态: 活跃维护中
 * 
 * 相关服务:
 * - 统一同步: unifiedSyncService.ts
 * - 数据下载: newDeviceDataDownloadService.ts
 * - 上传策略: smartUploadStrategy.ts
 * - 冲突解决: dataConflictResolutionService.ts
 * - 网络管理: networkStateManagementService.ts
 * 
 * 注意事项:
 * - 此服务属于数据同步核心模块
 * - 修改前请确保了解同步机制
 * - 建议在测试环境充分验证
 * ========================================
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';
import { unifiedSyncService } from './unifiedSyncService';

export interface CrossDeviceSyncStatus {
  isEnabled: boolean;
  lastSyncTime: number;
  syncProgress: number;
  isSyncing: boolean;
  error?: string;
  deviceCount: number;
  dataTypes: string[];
}

export interface CrossDeviceData {
  vocabulary: any[];
  shows: any[];
  learningRecords: any[];
  experience: any;
  badges: any[];
  userStats: any;
  lastModified: number;
  deviceId: string;
  appleId: string;
}

export class AppleCrossDeviceSyncService {
  private static instance: AppleCrossDeviceSyncService;
  private isInitialized = false;
  private syncStatus: CrossDeviceSyncStatus = {
    isEnabled: false,
    lastSyncTime: 0,
    syncProgress: 0,
    isSyncing: false,
    deviceCount: 0,
    dataTypes: []
  };

  public static getInstance(): AppleCrossDeviceSyncService {
    if (!AppleCrossDeviceSyncService.instance) {
      AppleCrossDeviceSyncService.instance = new AppleCrossDeviceSyncService();
    }
    return AppleCrossDeviceSyncService.instance;
  }

  private constructor() {
    this.initialize();
  }

  // 初始化服务
  private async initialize(): Promise<void> {
    try {
      console.log('🍎 初始化Apple ID跨设备同步服务...');
      
      // 加载同步状态
      await this.loadSyncStatus();
      
      // 检查是否启用跨设备同步
      await this.checkCrossDeviceSyncEnabled();
      
      this.isInitialized = true;
      console.log('✅ Apple ID跨设备同步服务初始化完成');
      
    } catch (error) {
      console.error('❌ Apple ID跨设备同步服务初始化失败:', error);
    }
  }

  // 加载同步状态
  private async loadSyncStatus(): Promise<void> {
    try {
      const status = await AsyncStorage.getItem('crossDeviceSyncStatus');
      if (status) {
        this.syncStatus = { ...this.syncStatus, ...JSON.parse(status) };
      }
    } catch (error) {
      console.error('❌ 加载同步状态失败:', error);
    }
  }

  // 保存同步状态
  private async saveSyncStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem('crossDeviceSyncStatus', JSON.stringify(this.syncStatus));
    } catch (error) {
      console.error('❌ 保存同步状态失败:', error);
    }
  }

  // 检查是否启用跨设备同步
  private async checkCrossDeviceSyncEnabled(): Promise<void> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        const hasAppleId = !!parsed.appleId;
        const isPremium = parsed.subscription?.status === 'active';
        
        this.syncStatus.isEnabled = hasAppleId && isPremium;
        await this.saveSyncStatus();
        
        console.log(`🍎 跨设备同步状态: ${this.syncStatus.isEnabled ? '已启用' : '未启用'}`);
      }
    } catch (error) {
      console.error('❌ 检查跨设备同步状态失败:', error);
    }
  }

  // 执行跨设备同步
  public async performCrossDeviceSync(): Promise<boolean> {
    try {
      if (!this.syncStatus.isEnabled) {
        console.log('ℹ️ 跨设备同步未启用');
        return false;
      }

      if (this.syncStatus.isSyncing) {
        console.log('ℹ️ 跨设备同步正在进行中');
        return false;
      }

      console.log('🍎 开始执行跨设备同步...');
      
      this.syncStatus.isSyncing = true;
      this.syncStatus.syncProgress = 0;
      this.syncStatus.error = undefined;
      await this.saveSyncStatus();

      // 1. 获取Apple ID
      const appleId = await this.getAppleId();
      if (!appleId) {
        throw new Error('未找到Apple ID');
      }

      // 2. 执行统一同步服务中的跨设备同步
      const result = await unifiedSyncService.performAppleCrossDeviceSync();
      
      if (result.success) {
        this.syncStatus.lastSyncTime = Date.now();
        this.syncStatus.syncProgress = 100;
        this.syncStatus.error = undefined;
        
        // 更新设备数量
        await this.updateDeviceCount(appleId);
        
        console.log('✅ 跨设备同步完成');
      } else {
        this.syncStatus.error = result.message;
        console.error('❌ 跨设备同步失败:', result.message);
      }

      this.syncStatus.isSyncing = false;
      await this.saveSyncStatus();
      
      return result.success;
      
    } catch (error) {
      console.error('❌ 跨设备同步执行失败:', error);
      
      this.syncStatus.isSyncing = false;
      this.syncStatus.error = error instanceof Error ? error.message : 'Unknown error';
      await this.saveSyncStatus();
      
      return false;
    }
  }

  // 获取Apple ID
  private async getAppleId(): Promise<string | null> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.appleId || null;
      }
      return null;
    } catch (error) {
      console.error('❌ 获取Apple ID失败:', error);
      return null;
    }
  }

  // 更新设备数量
  private async updateDeviceCount(appleId: string): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/sync/apple/${appleId}/devices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const devices = await response.json();
        this.syncStatus.deviceCount = devices.length;
        await this.saveSyncStatus();
      }
    } catch (error) {
      console.error('❌ 更新设备数量失败:', error);
    }
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

  // 获取同步状态
  public getSyncStatus(): CrossDeviceSyncStatus {
    return { ...this.syncStatus };
  }

  // 手动触发同步
  public async manualSync(): Promise<boolean> {
    console.log('🔄 手动触发跨设备同步...');
    return await this.performCrossDeviceSync();
  }

  // 检查是否有新设备数据
  public async checkForNewDeviceData(): Promise<boolean> {
    try {
      const appleId = await this.getAppleId();
      if (!appleId) return false;

      const token = await this.getAuthToken();
      if (!token) return false;

      const response = await fetch(`${API_BASE_URL}/sync/apple/${appleId}/check-updates`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result.hasUpdates || false;
      }

      return false;
    } catch (error) {
      console.error('❌ 检查新设备数据失败:', error);
      return false;
    }
  }

  // 获取跨设备数据概览
  public async getCrossDeviceDataOverview(): Promise<any> {
    try {
      const appleId = await this.getAppleId();
      if (!appleId) return null;

      const token = await this.getAuthToken();
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/sync/apple/${appleId}/overview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      }

      return null;
    } catch (error) {
      console.error('❌ 获取跨设备数据概览失败:', error);
      return null;
    }
  }

  // 启用跨设备同步
  public async enableCrossDeviceSync(): Promise<boolean> {
    try {
      this.syncStatus.isEnabled = true;
      await this.saveSyncStatus();
      
      console.log('✅ 跨设备同步已启用');
      return true;
    } catch (error) {
      console.error('❌ 启用跨设备同步失败:', error);
      return false;
    }
  }

  // 禁用跨设备同步
  public async disableCrossDeviceSync(): Promise<boolean> {
    try {
      this.syncStatus.isEnabled = false;
      await this.saveSyncStatus();
      
      console.log('✅ 跨设备同步已禁用');
      return true;
    } catch (error) {
      console.error('❌ 禁用跨设备同步失败:', error);
      return false;
    }
  }

  // 清理跨设备同步数据
  public async clearCrossDeviceSyncData(): Promise<boolean> {
    try {
      this.syncStatus = {
        isEnabled: false,
        lastSyncTime: 0,
        syncProgress: 0,
        isSyncing: false,
        deviceCount: 0,
        dataTypes: []
      };
      
      await this.saveSyncStatus();
      await AsyncStorage.removeItem('crossDeviceSyncStatus');
      
      console.log('✅ 跨设备同步数据已清理');
      return true;
    } catch (error) {
      console.error('❌ 清理跨设备同步数据失败:', error);
      return false;
    }
  }
}
