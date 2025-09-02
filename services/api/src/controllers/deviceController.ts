import { Request, Response } from 'express';
import { Device, IDevice } from '../models/Device';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { generateDeviceFingerprint } from '../utils/deviceUtils';

export interface DeviceRegistrationRequest {
  deviceId: string;
  deviceName: string;
  deviceType: 'ios' | 'android' | 'web' | 'unknown';
  osVersion: string;
  appVersion: string;
  deviceFingerprint: string;
  metadata?: {
    manufacturer?: string;
    model?: string;
    screenResolution?: string;
    totalStorage?: number;
    availableStorage?: number;
    batteryLevel?: number;
    isCharging?: boolean;
  };
}

export interface DeviceStatusResponse {
  deviceId: string;
  isInitialized: boolean;
  lastSyncTime: Date;
  lastActiveTime: Date;
  syncStatus: 'active' | 'inactive' | 'error';
  networkType: 'wifi' | 'cellular' | 'unknown';
  isOnline: boolean;
  deviceAge: number;
  syncDelayMinutes: number;
}

export class DeviceController {
  // 设备注册
  static async register(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const deviceData: DeviceRegistrationRequest = req.body;

      logger.info(`🔄 设备注册请求: 用户 ${userId}, 设备 ${deviceData.deviceId}`);

      // 验证必填字段
      if (!deviceData.deviceId || !deviceData.deviceName || !deviceData.deviceType) {
        return res.status(400).json({
          success: false,
          message: '设备ID、设备名称和设备类型为必填项'
        });
      }

      // 检查用户是否存在
      const user = await User.findById(userId);
      if (!user) {
        logger.error(`❌ 用户不存在: ${userId}`);
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 检查设备是否已注册
      const existingDevice = await Device.findOne({ deviceId: deviceData.deviceId });
      if (existingDevice) {
        logger.info(`🔄 设备已存在，更新设备信息: ${deviceData.deviceId}`);
        
        // 更新现有设备信息
        existingDevice.deviceName = deviceData.deviceName;
        existingDevice.osVersion = deviceData.osVersion;
        existingDevice.appVersion = deviceData.appVersion;
        existingDevice.deviceFingerprint = deviceData.deviceFingerprint;
        existingDevice.metadata = { ...existingDevice.metadata, ...deviceData.metadata };
        existingDevice.lastActiveTime = new Date();
        
        await existingDevice.save();
        
        logger.info(`✅ 设备信息更新成功: ${deviceData.deviceId}`);
        
        return res.json({
          success: true,
          message: '设备信息更新成功',
          data: {
            deviceId: existingDevice.deviceId,
            isInitialized: existingDevice.isInitialized,
            isNewDevice: false
          }
        });
      }

      // 创建新设备
      const newDevice = new Device({
        userId,
        ...deviceData,
        isInitialized: false,
        lastSyncTime: new Date(),
        lastActiveTime: new Date(),
        syncStatus: 'active',
        networkType: 'unknown'
      });

      await newDevice.save();

      logger.info(`✅ 新设备注册成功: ${deviceData.deviceId} for user: ${userId}`);

      res.status(201).json({
        success: true,
        message: '设备注册成功',
        data: {
          deviceId: newDevice.deviceId,
          isInitialized: newDevice.isInitialized,
          isNewDevice: true
        }
      });

    } catch (error) {
      logger.error('❌ 设备注册失败:', error);
      res.status(500).json({
        success: false,
        message: '设备注册失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取设备状态
  static async getStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { deviceId } = req.params;

      logger.info(`📊 获取设备状态: 用户 ${userId}, 设备 ${deviceId}`);

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: '设备ID为必填项'
        });
      }

      // 查找设备
      const device = await Device.findOne({ userId, deviceId });
      if (!device) {
        logger.warn(`⚠️ 设备未找到: ${deviceId} for user: ${userId}`);
        return res.status(404).json({
          success: false,
          message: '设备未找到'
        });
      }

      // 构建响应数据
      const deviceStatus: DeviceStatusResponse = {
        deviceId: device.deviceId,
        isInitialized: device.isInitialized,
        lastSyncTime: device.lastSyncTime,
        lastActiveTime: device.lastActiveTime,
        syncStatus: device.syncStatus,
        networkType: device.networkType,
        isOnline: (device as any).isOnline,
        deviceAge: (device as any).deviceAge,
        syncDelayMinutes: (device as any).syncDelayMinutes
      };

      logger.info(`✅ 设备状态获取成功: ${deviceId}`);

      res.json({
        success: true,
        message: '设备状态获取成功',
        data: deviceStatus
      });

    } catch (error) {
      logger.error('❌ 获取设备状态失败:', error);
      res.status(500).json({
        success: false,
        message: '获取设备状态失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 设备初始化
  static async initialize(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { deviceId } = req.params;

      logger.info(`🚀 设备初始化请求: 用户 ${userId}, 设备 ${deviceId}`);

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: '设备ID为必填项'
        });
      }

      // 查找设备
      const device = await Device.findOne({ userId, deviceId });
      if (!device) {
        logger.warn(`⚠️ 设备未找到: ${deviceId} for user: ${userId}`);
        return res.status(404).json({
          success: false,
          message: '设备未找到'
        });
      }

      // 检查设备是否已经初始化
      if (device.isInitialized) {
        logger.info(`ℹ️ 设备已经初始化: ${deviceId}`);
        return res.json({
          success: true,
          message: '设备已经初始化',
          data: {
            deviceId: device.deviceId,
            isInitialized: device.isInitialized,
            lastSyncTime: device.lastSyncTime
          }
        });
      }

      // 标记设备为已初始化
      await device.markAsInitialized();

      logger.info(`✅ 设备初始化成功: ${deviceId}`);

      res.json({
        success: true,
        message: '设备初始化成功',
        data: {
          deviceId: device.deviceId,
          isInitialized: device.isInitialized,
          lastSyncTime: device.lastSyncTime
        }
      });

    } catch (error) {
      logger.error('❌ 设备初始化失败:', error);
      res.status(500).json({
        success: false,
        message: '设备初始化失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 设备注销
  static async unregister(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { deviceId } = req.params;

      logger.info(`🗑️ 设备注销请求: 用户 ${userId}, 设备 ${deviceId}`);

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: '设备ID为必填项'
        });
      }

      // 查找并删除设备
      const device = await Device.findOneAndDelete({ userId, deviceId });
      if (!device) {
        logger.warn(`⚠️ 设备未找到: ${deviceId} for user: ${userId}`);
        return res.status(404).json({
          success: false,
          message: '设备未找到'
        });
      }

      logger.info(`✅ 设备注销成功: ${deviceId}`);

      res.json({
        success: true,
        message: '设备注销成功',
        data: {
          deviceId: device.deviceId,
          deviceName: device.deviceName
        }
      });

    } catch (error) {
      logger.error('❌ 设备注销失败:', error);
      res.status(500).json({
        success: false,
        message: '设备注销失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取用户的所有设备
  static async getUserDevices(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      logger.info(`📱 获取用户设备列表: ${userId}`);

      // 查找用户的所有设备
      const devices = await Device.find({ userId }).sort({ lastActiveTime: -1 });

      // 构建设备列表
      const deviceList = devices.map(device => ({
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        isInitialized: device.isInitialized,
        lastSyncTime: device.lastSyncTime,
        lastActiveTime: device.lastActiveTime,
        syncStatus: device.syncStatus,
        networkType: device.networkType,
        isOnline: (device as any).isOnline,
        deviceAge: (device as any).deviceAge,
        syncDelayMinutes: (device as any).syncDelayMinutes
      }));

      logger.info(`✅ 获取用户设备列表成功: ${devices.length} 个设备`);

      res.json({
        success: true,
        message: '获取用户设备列表成功',
        data: {
          totalDevices: devices.length,
          devices: deviceList
        }
      });

    } catch (error) {
      logger.error('❌ 获取用户设备列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户设备列表失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 更新设备网络状态
  static async updateNetworkStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { deviceId } = req.params;
      const { networkType } = req.body;

      logger.info(`🌐 更新设备网络状态: 用户 ${userId}, 设备 ${deviceId}, 网络类型 ${networkType}`);

      if (!deviceId || !networkType) {
        return res.status(400).json({
          success: false,
          message: '设备ID和网络类型为必填项'
        });
      }

      if (!['wifi', 'cellular', 'unknown'].includes(networkType)) {
        return res.status(400).json({
          success: false,
          message: '网络类型必须是 wifi、cellular 或 unknown'
        });
      }

      // 查找设备
      const device = await Device.findOne({ userId, deviceId });
      if (!device) {
        logger.warn(`⚠️ 设备未找到: ${deviceId} for user: ${userId}`);
        return res.status(404).json({
          success: false,
          message: '设备未找到'
        });
      }

      // 更新网络状态
      await device.updateNetworkStatus(networkType);

      logger.info(`✅ 设备网络状态更新成功: ${deviceId} -> ${networkType}`);

      res.json({
        success: true,
        message: '设备网络状态更新成功',
        data: {
          deviceId: device.deviceId,
          networkType: device.networkType,
          lastActiveTime: device.lastActiveTime
        }
      });

    } catch (error) {
      logger.error('❌ 更新设备网络状态失败:', error);
      res.status(500).json({
        success: false,
        message: '更新设备网络状态失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 更新设备同步状态
  static async updateSyncStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { deviceId } = req.params;
      const { syncStatus } = req.body;

      logger.info(`🔄 更新设备同步状态: 用户 ${userId}, 设备 ${deviceId}, 状态 ${syncStatus}`);

      if (!deviceId || !syncStatus) {
        return res.status(400).json({
          success: false,
          message: '设备ID和同步状态为必填项'
        });
      }

      if (!['active', 'inactive', 'error'].includes(syncStatus)) {
        return res.status(400).json({
          success: false,
          message: '同步状态必须是 active、inactive 或 error'
        });
      }

      // 查找设备
      const device = await Device.findOne({ userId, deviceId });
      if (!device) {
        logger.warn(`⚠️ 设备未找到: ${deviceId} for user: ${userId}`);
        return res.status(404).json({
          success: false,
          message: '设备未找到'
        });
      }

      // 更新同步状态
      await device.updateSyncStatus(syncStatus);

      logger.info(`✅ 设备同步状态更新成功: ${deviceId} -> ${syncStatus}`);

      res.json({
        success: true,
        message: '设备同步状态更新成功',
        data: {
          deviceId: device.deviceId,
          syncStatus: device.syncStatus,
          lastSyncTime: device.lastSyncTime
        }
      });

    } catch (error) {
      logger.error('❌ 更新设备同步状态失败:', error);
      res.status(500).json({
        success: false,
        message: '更新设备同步状态失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 清理过期设备（管理员功能）
  static async cleanupExpiredDevices(req: Request, res: Response) {
    try {
      logger.info('🧹 开始清理过期设备...');

      // 清理7天未活跃的设备
      const result = await Device.cleanupExpiredDevices();

      logger.info(`✅ 过期设备清理完成: 删除了 ${result.deletedCount} 个设备`);

      res.json({
        success: true,
        message: '过期设备清理完成',
        data: {
          deletedCount: result.deletedCount
        }
      });

    } catch (error) {
      logger.error('❌ 清理过期设备失败:', error);
      res.status(500).json({
        success: false,
        message: '清理过期设备失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
