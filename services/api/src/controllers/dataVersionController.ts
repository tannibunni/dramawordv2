import { Request, Response } from 'express';
import { DataVersion, IDataVersion } from '../models/DataVersion';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export interface VersionComparisonRequest {
  localVersion: string;
  localChecksum: string;
  localTimestamp: number;
  dataType: 'vocabulary' | 'shows' | 'learningRecords' | 'experience' | 'badges' | 'userStats';
}

export interface VersionComparisonResponse {
  relationship: 'same' | 'local_newer' | 'cloud_newer' | 'divergent' | 'unrelated';
  confidence: number;
  recommendedAction: 'keep_local' | 'keep_cloud' | 'merge' | 'manual_review';
  mergeComplexity: 'simple' | 'moderate' | 'complex';
  cloudVersion?: {
    version: string;
    timestamp: Date;
    checksum: string;
    size: number;
    itemCount: number;
  };
  conflicts?: Array<{
    type: 'version' | 'content' | 'deletion' | 'addition';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export interface ConflictDetectionRequest {
  localData: any;
  cloudData: any;
  dataType: string;
  localVersion: string;
  cloudVersion: string;
}

export interface ConflictDetectionResponse {
  hasConflicts: boolean;
  conflicts: Array<{
    type: 'version' | 'content' | 'deletion' | 'addition';
    description: string;
    severity: 'low' | 'medium' | 'high';
    localValue?: any;
    cloudValue?: any;
    resolution?: 'auto' | 'smart' | 'manual';
  }>;
  resolutionStrategy: 'auto' | 'smart' | 'manual';
}

export interface IncrementalSyncRequest {
  dataType: string;
  lastSyncTime: number;
  localVersion: string;
  deviceId: string;
}

export interface IncrementalSyncResponse {
  hasChanges: boolean;
  changes: {
    added: any[];
    updated: any[];
    deleted: any[];
  };
  newVersion: string;
  totalSize: number;
  estimatedSyncTime: number;
}

export class DataVersionController {
  // 版本比较
  static async compareVersions(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { deviceId } = req.params;
      const comparisonData: VersionComparisonRequest = req.body;

      logger.info(`🔄 版本比较请求: 用户 ${userId}, 设备 ${deviceId}, 数据类型 ${comparisonData.dataType}`);

      // 验证请求数据
      if (!comparisonData.dataType || !comparisonData.localVersion || !comparisonData.localChecksum) {
        return res.status(400).json({
          success: false,
          message: '数据类型、本地版本和校验和为必填项'
        });
      }

      // 查找云端最新版本
      const cloudVersion = await DataVersion.findLatestVersion(
        userId,
        comparisonData.dataType,
        deviceId
      );

      if (!cloudVersion) {
        logger.info(`ℹ️ 云端无数据版本: ${comparisonData.dataType}`);
        return res.json({
          success: true,
          message: '云端无数据版本',
          data: {
            relationship: 'unrelated',
            confidence: 1.0,
            recommendedAction: 'keep_local',
            mergeComplexity: 'simple'
          } as VersionComparisonResponse
        });
      }

      // 比较版本
      const comparison = await this.performVersionComparison(
        comparisonData,
        cloudVersion
      );

      logger.info(`✅ 版本比较完成: ${comparison.relationship}`);

      res.json({
        success: true,
        message: '版本比较完成',
        data: comparison
      });

    } catch (error) {
      logger.error('❌ 版本比较失败:', error);
      res.status(500).json({
        success: false,
        message: '版本比较失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 执行版本比较
  private static async performVersionComparison(
    localData: VersionComparisonRequest,
    cloudVersion: IDataVersion
  ): Promise<VersionComparisonResponse> {
    try {
      const localTimestamp = new Date(localData.localTimestamp);
      const cloudTimestamp = cloudVersion.timestamp;
      
      // 检查校验和是否相同
      if (localData.localChecksum === cloudVersion.checksum) {
        return {
          relationship: 'same',
          confidence: 1.0,
          recommendedAction: 'keep_local',
          mergeComplexity: 'simple',
          cloudVersion: {
            version: cloudVersion.version,
            timestamp: cloudVersion.timestamp,
            checksum: cloudVersion.checksum,
            size: cloudVersion.metadata.size,
            itemCount: cloudVersion.metadata.itemCount
          }
        };
      }

      // 比较时间戳
      const timeDiff = Math.abs(localTimestamp.getTime() - cloudTimestamp.getTime());
      const isLocalNewer = localTimestamp > cloudTimestamp;
      const isCloudNewer = cloudTimestamp > localTimestamp;

      // 判断版本关系
      let relationship: VersionComparisonResponse['relationship'];
      let confidence: number;
      let recommendedAction: VersionComparisonResponse['recommendedAction'];
      let mergeComplexity: VersionComparisonResponse['mergeComplexity'];

      if (timeDiff < 60000) { // 1分钟内
        // 时间接近，可能是并发修改
        relationship = 'divergent';
        confidence = 0.7;
        recommendedAction = 'merge';
        mergeComplexity = 'moderate';
      } else if (isLocalNewer) {
        relationship = 'local_newer';
        confidence = 0.9;
        recommendedAction = 'keep_local';
        mergeComplexity = 'simple';
      } else if (isCloudNewer) {
        relationship = 'cloud_newer';
        confidence = 0.9;
        recommendedAction = 'keep_cloud';
        mergeComplexity = 'simple';
      } else {
        relationship = 'unrelated';
        confidence = 0.5;
        recommendedAction = 'manual_review';
        mergeComplexity = 'complex';
      }

      return {
        relationship,
        confidence,
        recommendedAction,
        mergeComplexity,
        cloudVersion: {
          version: cloudVersion.version,
          timestamp: cloudVersion.timestamp,
          checksum: cloudVersion.checksum,
          size: cloudVersion.metadata.size,
          itemCount: cloudVersion.metadata.itemCount
        }
      };

    } catch (error) {
      logger.error('❌ 执行版本比较失败:', error);
      throw error;
    }
  }

  // 冲突检测
  static async detectConflicts(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const conflictData: ConflictDetectionRequest = req.body;

      logger.info(`🔍 冲突检测请求: 用户 ${userId}, 数据类型 ${conflictData.dataType}`);

      // 验证请求数据
      if (!conflictData.dataType || !conflictData.localData || !conflictData.cloudData) {
        return res.status(400).json({
          success: false,
          message: '数据类型、本地数据和云端数据为必填项'
        });
      }

      // 执行冲突检测
      const conflicts = await this.performConflictDetection(conflictData);

      logger.info(`✅ 冲突检测完成: 发现 ${conflicts.conflicts.length} 个冲突`);

      res.json({
        success: true,
        message: '冲突检测完成',
        data: conflicts
      });

    } catch (error) {
      logger.error('❌ 冲突检测失败:', error);
      res.status(500).json({
        success: false,
        message: '冲突检测失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 执行冲突检测
  private static async performConflictDetection(
    data: ConflictDetectionRequest
  ): Promise<ConflictDetectionResponse> {
    try {
      const conflicts: ConflictDetectionResponse['conflicts'] = [];
      let hasConflicts = false;

      // 版本冲突检测
      if (data.localVersion !== data.cloudVersion) {
        conflicts.push({
          type: 'version',
          description: '版本号不匹配',
          severity: 'medium',
          localValue: data.localVersion,
          cloudValue: data.cloudVersion,
          resolution: 'auto'
        });
        hasConflicts = true;
      }

      // 内容冲突检测
      const contentConflicts = this.detectContentConflicts(
        data.localData,
        data.cloudData,
        data.dataType
      );
      conflicts.push(...contentConflicts);
      if (contentConflicts.length > 0) {
        hasConflicts = true;
      }

      // 删除冲突检测
      const deletionConflicts = this.detectDeletionConflicts(
        data.localData,
        data.cloudData,
        data.dataType
      );
      conflicts.push(...deletionConflicts);
      if (deletionConflicts.length > 0) {
        hasConflicts = true;
      }

      // 新增冲突检测
      const additionConflicts = this.detectAdditionConflicts(
        data.localData,
        data.cloudData,
        data.dataType
      );
      conflicts.push(...additionConflicts);
      if (additionConflicts.length > 0) {
        hasConflicts = true;
      }

      // 确定解决策略
      const resolutionStrategy = this.determineResolutionStrategy(conflicts);

      return {
        hasConflicts,
        conflicts,
        resolutionStrategy
      };

    } catch (error) {
      logger.error('❌ 执行冲突检测失败:', error);
      throw error;
    }
  }

  // 检测内容冲突
  private static detectContentConflicts(
    localData: any,
    cloudData: any,
    dataType: string
  ): ConflictDetectionResponse['conflicts'] {
    const conflicts: ConflictDetectionResponse['conflicts'] = [];

    try {
      if (Array.isArray(localData) && Array.isArray(cloudData)) {
        // 数组数据冲突检测
        const localMap = new Map(localData.map((item: any) => [item.id || item._id, item]));
        const cloudMap = new Map(cloudData.map((item: any) => [item.id || item._id, item]));

        for (const [id, localItem] of localMap) {
          const cloudItem = cloudMap.get(id);
          if (cloudItem) {
            // 比较项目内容
            const localModified = localItem.lastModified || localItem.updatedAt;
            const cloudModified = cloudItem.lastModified || cloudItem.updatedAt;

            if (localModified && cloudModified && localModified !== cloudModified) {
              conflicts.push({
                type: 'content',
                description: `项目 ${id} 内容冲突`,
                severity: 'high',
                localValue: localItem,
                cloudValue: cloudItem,
                resolution: 'smart'
              });
            }
          }
        }
      } else if (typeof localData === 'object' && typeof cloudData === 'object') {
        // 对象数据冲突检测
        const localKeys = Object.keys(localData);
        const cloudKeys = Object.keys(cloudData);

        for (const key of localKeys) {
          if (cloudKeys.includes(key)) {
            if (localData[key] !== cloudData[key]) {
              conflicts.push({
                type: 'content',
                description: `字段 ${key} 值冲突`,
                severity: 'medium',
                localValue: localData[key],
                cloudValue: cloudData[key],
                resolution: 'auto'
              });
            }
          }
        }
      }
    } catch (error) {
      logger.error('❌ 检测内容冲突失败:', error);
    }

    return conflicts;
  }

  // 检测删除冲突
  private static detectDeletionConflicts(
    localData: any,
    cloudData: any,
    dataType: string
  ): ConflictDetectionResponse['conflicts'] {
    const conflicts: ConflictDetectionResponse['conflicts'] = [];

    try {
      if (Array.isArray(localData) && Array.isArray(cloudData)) {
        const localIds = new Set(localData.map((item: any) => item.id || item._id));
        const cloudIds = new Set(cloudData.map((item: any) => item.id || item._id));

        // 本地删除但云端存在
        for (const id of cloudIds) {
          if (!localIds.has(id)) {
            conflicts.push({
              type: 'deletion',
              description: `项目 ${id} 在本地被删除`,
              severity: 'medium',
              cloudValue: cloudData.find((item: any) => (item.id || item._id) === id),
              resolution: 'smart'
            });
          }
        }
      }
    } catch (error) {
      logger.error('❌ 检测删除冲突失败:', error);
    }

    return conflicts;
  }

  // 检测新增冲突
  private static detectAdditionConflicts(
    localData: any,
    cloudData: any,
    dataType: string
  ): ConflictDetectionResponse['conflicts'] {
    const conflicts: ConflictDetectionResponse['conflicts'] = [];

    try {
      if (Array.isArray(localData) && Array.isArray(cloudData)) {
        const localIds = new Set(localData.map((item: any) => item.id || item._id));
        const cloudIds = new Set(cloudData.map((item: any) => item.id || item._id));

        // 本地新增但云端不存在
        for (const id of localIds) {
          if (!cloudIds.has(id)) {
            conflicts.push({
              type: 'addition',
              description: `项目 ${id} 在本地新增`,
              severity: 'low',
              localValue: localData.find((item: any) => (item.id || item._id) === id),
              resolution: 'auto'
            });
          }
        }
      }
    } catch (error) {
      logger.error('❌ 检测新增冲突失败:', error);
    }

    return conflicts;
  }

  // 确定解决策略
  private static determineResolutionStrategy(
    conflicts: ConflictDetectionResponse['conflicts']
  ): 'auto' | 'smart' | 'manual' {
    const highSeverityCount = conflicts.filter(c => c.severity === 'high').length;
    const mediumSeverityCount = conflicts.filter(c => c.severity === 'medium').length;

    if (highSeverityCount > 0) {
      return 'manual';
    } else if (mediumSeverityCount > 2) {
      return 'smart';
    } else {
      return 'auto';
    }
  }

  // 增量同步
  static async getIncrementalData(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { deviceId } = req.params;
      const syncData: IncrementalSyncRequest = req.body;

      logger.info(`📦 增量同步请求: 用户 ${userId}, 设备 ${deviceId}, 数据类型 ${syncData.dataType}`);

      // 验证请求数据
      if (!syncData.dataType || !syncData.lastSyncTime || !syncData.localVersion) {
        return res.status(400).json({
          success: false,
          message: '数据类型、最后同步时间和本地版本为必填项'
        });
      }

      // 查找云端最新版本
      const cloudVersion = await DataVersion.findLatestVersion(
        userId,
        syncData.dataType,
        deviceId
      );

      if (!cloudVersion) {
        logger.info(`ℹ️ 云端无数据版本: ${syncData.dataType}`);
        return res.json({
          success: true,
          message: '云端无数据版本',
          data: {
            hasChanges: false,
            changes: { added: [], updated: [], deleted: [] },
            newVersion: syncData.localVersion,
            totalSize: 0,
            estimatedSyncTime: 0
          } as IncrementalSyncResponse
        });
      }

      // 检查是否有变化
      const lastSyncDate = new Date(syncData.lastSyncTime);
      if (cloudVersion.timestamp <= lastSyncDate) {
        logger.info(`ℹ️ 无新变化: ${syncData.dataType}`);
        return res.json({
          success: true,
          message: '无新变化',
          data: {
            hasChanges: false,
            changes: { added: [], updated: [], deleted: [] },
            newVersion: syncData.localVersion,
            totalSize: 0,
            estimatedSyncTime: 0
          } as IncrementalSyncResponse
        });
      }

      // 生成增量数据
      const incrementalData = await this.generateIncrementalData(
        syncData,
        cloudVersion
      );

      logger.info(`✅ 增量同步数据生成完成: ${incrementalData.changes.added.length} 新增, ${incrementalData.changes.updated.length} 更新, ${incrementalData.changes.deleted.length} 删除`);

      res.json({
        success: true,
        message: '增量同步数据生成完成',
        data: incrementalData
      });

    } catch (error) {
      logger.error('❌ 增量同步失败:', error);
      res.status(500).json({
        success: false,
        message: '增量同步失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 生成增量数据
  private static async generateIncrementalData(
    syncData: IncrementalSyncRequest,
    cloudVersion: IDataVersion
  ): Promise<IncrementalSyncResponse> {
    try {
      const changes = {
        added: [] as any[],
        updated: [] as any[],
        deleted: [] as any[]
      };

      // 这里应该实现具体的增量数据生成逻辑
      // 目前返回模拟数据
      if (Array.isArray(cloudVersion.data)) {
        // 模拟新增和更新
        changes.added = cloudVersion.data.slice(0, 2);
        changes.updated = cloudVersion.data.slice(2, 4);
      }

      // 计算总大小
      const totalSize = JSON.stringify(changes).length;

      // 估算同步时间（毫秒）
      const estimatedSyncTime = Math.max(1000, totalSize / 1000); // 基于数据大小估算

      // 生成新版本号
      const newVersion = `${cloudVersion.version}_${Date.now()}`;

      return {
        hasChanges: changes.added.length > 0 || changes.updated.length > 0 || changes.deleted.length > 0,
        changes,
        newVersion,
        totalSize,
        estimatedSyncTime
      };

    } catch (error) {
      logger.error('❌ 生成增量数据失败:', error);
      throw error;
    }
  }

  // 保存数据版本
  static async saveVersion(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { deviceId } = req.params;
      const { dataType, version, data, source = 'local' } = req.body;

      logger.info(`💾 保存数据版本: 用户 ${userId}, 设备 ${deviceId}, 数据类型 ${dataType}`);

      // 验证请求数据
      if (!dataType || !version || !data) {
        return res.status(400).json({
          success: false,
          message: '数据类型、版本和数据为必填项'
        });
      }

      // 计算校验和
      const checksum = crypto.createHash('sha256')
        .update(JSON.stringify(data))
        .digest('hex');

      // 创建新版本
      const newVersion = new DataVersion({
        userId,
        deviceId,
        dataType,
        version,
        timestamp: new Date(),
        checksum,
        data,
        metadata: {
          size: 0, // 将在保存时自动计算
          itemCount: 0, // 将在保存时自动计算
          lastModified: new Date(),
          source: source as 'local' | 'cloud' | 'merged'
        }
      });

      await newVersion.save();

      logger.info(`✅ 数据版本保存成功: ${dataType} v${version}`);

      res.status(201).json({
        success: true,
        message: '数据版本保存成功',
        data: {
          version: newVersion.version,
          timestamp: newVersion.timestamp,
          checksum: newVersion.checksum,
          size: newVersion.metadata.size,
          itemCount: newVersion.metadata.itemCount
        }
      });

    } catch (error) {
      logger.error('❌ 保存数据版本失败:', error);
      res.status(500).json({
        success: false,
        message: '保存数据版本失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取版本历史
  static async getVersionHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { dataType } = req.params;
      const { limit = 10 } = req.query;

      logger.info(`📚 获取版本历史: 用户 ${userId}, 数据类型 ${dataType}`);

      // 查找版本历史
      const versions = await DataVersion.findUserVersions(
        userId,
        dataType,
        parseInt(limit as string)
      );

      // 构建响应数据
      const versionHistory = versions.map(version => ({
        version: version.version,
        timestamp: version.timestamp,
        checksum: version.checksum,
        size: version.metadata.size,
        itemCount: version.metadata.itemCount,
        source: version.metadata.source,
        conflictResolved: version.metadata.conflictResolved,
        resolutionStrategy: version.metadata.resolutionStrategy
      }));

      logger.info(`✅ 版本历史获取成功: ${versions.length} 个版本`);

      res.json({
        success: true,
        message: '版本历史获取成功',
        data: {
          dataType,
          totalVersions: versions.length,
          versions: versionHistory
        }
      });

    } catch (error) {
      logger.error('❌ 获取版本历史失败:', error);
      res.status(500).json({
        success: false,
        message: '获取版本历史失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
