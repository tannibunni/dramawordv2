import { Request, Response } from 'express';
import { User } from '../models/User';
import { AppleSyncData } from '../models/AppleSyncData';
import { AppleDevice } from '../models/AppleDevice';
import { logger } from '../utils/logger';
import { encryptData, decryptData } from '../utils/encryption';
import { validateAppleIdAccess } from '../middleware/appleIdValidation';

export interface CloudDataResponse {
  success: boolean;
  data?: {
    vocabulary: any[];
    shows: any[];
    learningRecords: any[];
    experience: any;
    badges: any[];
    userStats: any;
    lastModified: number;
    syncVersion: number;
  };
  message?: string;
  error?: string;
}

export interface UploadDataResponse {
  success: boolean;
  message: string;
  syncVersion?: number;
  conflicts?: any[];
  error?: string;
}

export interface DeviceListResponse {
  success: boolean;
  devices: Array<{
    deviceId: string;
    deviceName: string;
    lastSyncTime: number;
    dataTypes: string[];
    isActive: boolean;
  }>;
}

export class AppleSyncController {
  
  // 获取云端数据
  static async getCloudData(appleId: string, userId: string): Promise<CloudDataResponse> {
    try {
      logger.info(`🍎 开始获取Apple ID ${appleId} 的云端数据`);
      
      // 验证用户是否有权限访问此Apple ID
      const hasAccess = await validateAppleIdAccess(userId, appleId);
      if (!hasAccess) {
        return {
          success: false,
          message: '无权限访问此Apple ID的数据'
        };
      }

      // 获取最新的云端数据
      const latestSyncData = await AppleSyncData.findOne({ appleId })
        .sort({ syncVersion: -1 })
        .limit(1);

      if (!latestSyncData) {
        logger.info(`🍎 Apple ID ${appleId} 暂无云端数据`);
        return {
          success: true,
          data: {
            vocabulary: [],
            shows: [],
            learningRecords: [],
            experience: {},
            badges: [],
            userStats: {},
            lastModified: Date.now(),
            syncVersion: 0
          }
        };
      }

      // 解密数据
      const decryptedData = await this.decryptSyncData(latestSyncData.encryptedData);
      
      logger.info(`🍎 成功获取Apple ID ${appleId} 的云端数据，版本: ${latestSyncData.syncVersion}`);
      
      return {
        success: true,
        data: {
          ...decryptedData,
          lastModified: latestSyncData.lastModified,
          syncVersion: latestSyncData.syncVersion
        }
      };
      
    } catch (error) {
      logger.error('获取云端数据失败:', error);
      return {
        success: false,
        message: '获取云端数据失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 上传数据到云端
  static async uploadData(
    appleId: string, 
    userId: string, 
    data: any, 
    deviceId: string, 
    timestamp: number, 
    syncVersion: number
  ): Promise<UploadDataResponse> {
    try {
      logger.info(`🍎 开始上传数据到云端: Apple ID ${appleId}, 设备 ${deviceId}, 版本 ${syncVersion}`);
      
      // 验证用户权限
      const hasAccess = await validateAppleIdAccess(userId, appleId);
      if (!hasAccess) {
        return {
          success: false,
          message: '无权限上传到此Apple ID'
        };
      }

      // 获取当前云端数据
      const currentCloudData = await AppleSyncData.findOne({ appleId })
        .sort({ syncVersion: -1 })
        .limit(1);

      let newSyncVersion = syncVersion;
      let conflicts: any[] = [];

      if (currentCloudData) {
        // 检查版本冲突
        if (syncVersion <= currentCloudData.syncVersion) {
          newSyncVersion = currentCloudData.syncVersion + 1;
          logger.info(`🍎 检测到版本冲突，新版本号: ${newSyncVersion}`);
        }

        // 合并数据并检测冲突
        const mergedData = await this.mergeDataWithConflicts(currentCloudData.encryptedData, data);
        conflicts = mergedData.conflicts;
        data = mergedData.mergedData;
      }

      // 加密数据
      const encryptedData = await encryptData(JSON.stringify(data));
      
      // 保存新的同步数据
      const newSyncData = new AppleSyncData({
        appleId,
        userId,
        deviceId,
        encryptedData,
        syncVersion: newSyncVersion,
        lastModified: Date.now(),
        dataTypes: Object.keys(data),
        dataSize: encryptedData.length
      });

      await newSyncData.save();

      // 更新或创建设备记录
      await this.updateDeviceRecord(appleId, deviceId, timestamp, Object.keys(data));

      logger.info(`🍎 数据上传成功: Apple ID ${appleId}, 版本 ${newSyncVersion}`);
      
      return {
        success: true,
        message: '数据上传成功',
        syncVersion: newSyncVersion,
        conflicts: conflicts.length > 0 ? conflicts : undefined
      };
      
    } catch (error) {
      logger.error('上传数据到云端失败:', error);
      return {
        success: false,
        message: '上传数据失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 获取设备列表
  static async getDevices(appleId: string, userId: string): Promise<DeviceListResponse> {
    try {
      logger.info(`🍎 获取Apple ID ${appleId} 的设备列表`);
      
      // 验证用户权限
      const hasAccess = await validateAppleIdAccess(userId, appleId);
      if (!hasAccess) {
        return {
          success: false,
          devices: []
        };
      }

      const devices = await AppleDevice.find({ appleId })
        .sort({ lastSyncTime: -1 })
        .select('deviceId deviceName lastSyncTime dataTypes isActive');

      logger.info(`🍎 找到 ${devices.length} 个设备`);
      
      return {
        success: true,
        devices: devices.map(device => ({
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          lastSyncTime: device.lastSyncTime,
          dataTypes: device.dataTypes,
          isActive: device.isActive
        }))
      };
      
    } catch (error) {
      logger.error('获取设备列表失败:', error);
      return {
        success: false,
        devices: []
      };
    }
  }

  // 检查是否有更新
  static async checkForUpdates(appleId: string, userId: string, lastSyncTime: number): Promise<{ hasUpdates: boolean; lastModified?: number }> {
    try {
      // 验证用户权限
      const hasAccess = await validateAppleIdAccess(userId, appleId);
      if (!hasAccess) {
        return { hasUpdates: false };
      }

      const latestData = await AppleSyncData.findOne({ appleId })
        .sort({ lastModified: -1 })
        .limit(1)
        .select('lastModified');

      if (!latestData) {
        return { hasUpdates: false };
      }

      const hasUpdates = latestData.lastModified > lastSyncTime;
      
      return {
        hasUpdates,
        lastModified: latestData.lastModified
      };
      
    } catch (error) {
      logger.error('检查更新失败:', error);
      return { hasUpdates: false };
    }
  }

  // 获取数据概览
  static async getDataOverview(appleId: string, userId: string): Promise<any> {
    try {
      // 验证用户权限
      const hasAccess = await validateAppleIdAccess(userId, appleId);
      if (!hasAccess) {
        return null;
      }

      const latestData = await AppleSyncData.findOne({ appleId })
        .sort({ syncVersion: -1 })
        .limit(1);

      if (!latestData) {
        return {
          totalDevices: 0,
          lastSyncTime: null,
          dataTypes: [],
          totalDataSize: 0
        };
      }

      const deviceCount = await AppleDevice.countDocuments({ appleId, isActive: true });
      
      return {
        totalDevices: deviceCount,
        lastSyncTime: latestData.lastModified,
        dataTypes: latestData.dataTypes,
        totalDataSize: latestData.dataSize,
        syncVersion: latestData.syncVersion
      };
      
    } catch (error) {
      logger.error('获取数据概览失败:', error);
      return null;
    }
  }

  // 删除设备数据
  static async deleteDeviceData(appleId: string, userId: string, deviceId: string): Promise<{ success: boolean; message: string }> {
    try {
      // 验证用户权限
      const hasAccess = await validateAppleIdAccess(userId, appleId);
      if (!hasAccess) {
        return {
          success: false,
          message: '无权限删除此设备数据'
        };
      }

      // 标记设备为非活跃状态
      await AppleDevice.updateOne(
        { appleId, deviceId },
        { isActive: false, deactivatedAt: new Date() }
      );

      logger.info(`🍎 设备 ${deviceId} 数据已标记为非活跃状态`);
      
      return {
        success: true,
        message: '设备数据已删除'
      };
      
    } catch (error) {
      logger.error('删除设备数据失败:', error);
      return {
        success: false,
        message: '删除设备数据失败'
      };
    }
  }

  // 私有方法：解密同步数据
  private static async decryptSyncData(encryptedData: string): Promise<any> {
    try {
      const decrypted = await decryptData(encryptedData);
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('解密同步数据失败:', error);
      throw new Error('数据解密失败');
    }
  }

  // 私有方法：合并数据并检测冲突
  private static async mergeDataWithConflicts(encryptedCloudData: string, localData: any): Promise<{ mergedData: any; conflicts: any[] }> {
    try {
      const cloudData = await this.decryptSyncData(encryptedCloudData);
      const conflicts: any[] = [];
      const mergedData = { ...cloudData };

      // 合并词汇数据
      if (localData.vocabulary && cloudData.vocabulary) {
        const { merged, conflicts: vocabConflicts } = this.mergeVocabularyWithConflicts(
          cloudData.vocabulary, 
          localData.vocabulary
        );
        mergedData.vocabulary = merged;
        conflicts.push(...vocabConflicts);
      }

      // 合并剧单数据
      if (localData.shows && cloudData.shows) {
        const { merged, conflicts: showConflicts } = this.mergeShowsWithConflicts(
          cloudData.shows, 
          localData.shows
        );
        mergedData.shows = merged;
        conflicts.push(...showConflicts);
      }

      // 合并学习记录
      if (localData.learningRecords && cloudData.learningRecords) {
        const { merged, conflicts: recordConflicts } = this.mergeLearningRecordsWithConflicts(
          cloudData.learningRecords, 
          localData.learningRecords
        );
        mergedData.learningRecords = merged;
        conflicts.push(...recordConflicts);
      }

      // 合并经验值（取最高值）
      if (localData.experience && cloudData.experience) {
        mergedData.experience = {
          experience: Math.max(cloudData.experience.experience || 0, localData.experience.experience || 0),
          level: Math.max(cloudData.experience.level || 1, localData.experience.level || 1),
          totalExperience: Math.max(cloudData.experience.totalExperience || 0, localData.experience.totalExperience || 0)
        };
      }

      return { mergedData, conflicts };
      
    } catch (error) {
      logger.error('合并数据失败:', error);
      throw error;
    }
  }

  // 合并词汇数据并检测冲突
  private static mergeVocabularyWithConflicts(cloud: any[], local: any[]): { merged: any[]; conflicts: any[] } {
    const merged = new Map();
    const conflicts: any[] = [];

    // 添加云端数据
    cloud.forEach(item => {
      const key = item.word || item.id;
      merged.set(key, item);
    });

    // 合并本地数据
    local.forEach(item => {
      const key = item.word || item.id;
      const existing = merged.get(key);

      if (existing) {
        // 检测冲突：如果两个数据都有修改时间且不同
        if (existing.lastModified && item.lastModified && 
            existing.lastModified !== item.lastModified) {
          conflicts.push({
            type: 'vocabulary',
            key,
            cloud: existing,
            local: item,
            conflictType: 'modification_time_mismatch'
          });
        }
        
        // 使用最新的数据
        if (!existing.lastModified || (item.lastModified && item.lastModified > existing.lastModified)) {
          merged.set(key, item);
        }
      } else {
        merged.set(key, item);
      }
    });

    return { merged: Array.from(merged.values()), conflicts };
  }

  // 合并剧单数据并检测冲突
  private static mergeShowsWithConflicts(cloud: any[], local: any[]): { merged: any[]; conflicts: any[] } {
    const merged = new Map();
    const conflicts: any[] = [];

    cloud.forEach(item => {
      merged.set(item.id, item);
    });

    local.forEach(item => {
      const existing = merged.get(item.id);

      if (existing) {
        if (existing.lastModified && item.lastModified && 
            existing.lastModified !== item.lastModified) {
          conflicts.push({
            type: 'shows',
            key: item.id,
            cloud: existing,
            local: item,
            conflictType: 'modification_time_mismatch'
          });
        }
        
        if (!existing.lastModified || (item.lastModified && item.lastModified > existing.lastModified)) {
          merged.set(item.id, item);
        }
      } else {
        merged.set(item.id, item);
      }
    });

    return { merged: Array.from(merged.values()), conflicts };
  }

  // 合并学习记录并检测冲突
  private static mergeLearningRecordsWithConflicts(cloud: any[], local: any[]): { merged: any[]; conflicts: any[] } {
    const merged = new Map();
    const conflicts: any[] = [];

    cloud.forEach(item => {
      const key = `${item.wordId}_${item.sessionId}`;
      merged.set(key, item);
    });

    local.forEach(item => {
      const key = `${item.wordId}_${item.sessionId}`;
      const existing = merged.get(key);

      if (existing) {
        if (existing.timestamp && item.timestamp && 
            existing.timestamp !== item.timestamp) {
          conflicts.push({
            type: 'learningRecords',
            key,
            cloud: existing,
            local: item,
            conflictType: 'timestamp_mismatch'
          });
        }
        
        if (!existing.timestamp || (item.timestamp && item.timestamp > existing.timestamp)) {
          merged.set(key, item);
        }
      } else {
        merged.set(key, item);
      }
    });

    return { merged: Array.from(merged.values()), conflicts };
  }

  // 更新设备记录
  private static async updateDeviceRecord(appleId: string, deviceId: string, timestamp: number, dataTypes: string[]): Promise<void> {
    try {
      await AppleDevice.findOneAndUpdate(
        { appleId, deviceId },
        {
          lastSyncTime: timestamp,
          dataTypes,
          isActive: true,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      logger.error('更新设备记录失败:', error);
    }
  }
}
