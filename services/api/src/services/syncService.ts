import { User } from '../models/User';
import { UserLearningRecord } from '../models/UserLearningRecord';
import { Word } from '../models/Word';
import { Show } from '../models/Show';
import { SearchHistory } from '../models/SearchHistory';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// 同步数据类型
export interface ISyncData {
  userId: string;
  learningRecords: any[];
  searchHistory: any[];
  userSettings: any;
  lastSyncTime: Date;
  deviceId: string;
}

// 同步结果接口
export interface ISyncResult {
  success: boolean;
  message: string;
  data?: {
    learningRecords: any[];
    searchHistory: any[];
    userSettings: any;
    conflicts?: any[];
  };
  errors?: string[];
}

// 冲突解决策略
export type ConflictResolution = 'local' | 'remote' | 'merge' | 'manual';

// 数据同步服务类
export class SyncService {
  private static instance: SyncService;

  private constructor() {}

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  // 上传本地数据到云端
  async uploadData(userId: string, syncData: ISyncData): Promise<ISyncResult> {
    try {
      logger.info(`🔄 开始同步用户 ${userId} 的数据`);
      
      // 检查数据库连接状态
      if (mongoose.connection.readyState !== 1) {
        logger.error(`❌ 数据库连接异常，状态: ${mongoose.connection.readyState}`);
        return {
          success: false,
          message: '数据库连接异常',
          errors: ['Database connection error']
        };
      }

      const user = await User.findById(userId);
      if (!user) {
        logger.error(`❌ 用户不存在: ${userId}`);
        return {
          success: false,
          message: '用户不存在',
          errors: ['User not found']
        };
      }

      logger.info(`✅ 用户验证成功: ${userId}`);

      const result: ISyncResult = {
        success: true,
        message: '数据上传成功',
        data: {
          learningRecords: [],
          searchHistory: [],
          userSettings: {}
        }
      };

      // 同步学习记录
      if (syncData.learningRecords && syncData.learningRecords.length > 0) {
        logger.info(`📚 同步 ${syncData.learningRecords.length} 条学习记录`);
        try {
          const learningResult = await this.syncLearningRecords(userId, syncData.learningRecords);
          result.data!.learningRecords = learningResult;
          logger.info(`✅ 学习记录同步成功: ${learningResult.length} 条`);
        } catch (error) {
          logger.error(`❌ 学习记录同步失败:`, error);
          return {
            success: false,
            message: '学习记录同步失败',
            errors: [error instanceof Error ? error.message : 'Unknown error']
          };
        }
      }

      // 同步搜索历史
      if (syncData.searchHistory && syncData.searchHistory.length > 0) {
        logger.info(`🔍 同步 ${syncData.searchHistory.length} 条搜索历史`);
        try {
          const historyResult = await this.syncSearchHistory(userId, syncData.searchHistory);
          result.data!.searchHistory = historyResult;
          logger.info(`✅ 搜索历史同步成功: ${historyResult.length} 条`);
        } catch (error) {
          logger.error(`❌ 搜索历史同步失败:`, error);
          return {
            success: false,
            message: '搜索历史同步失败',
            errors: [error instanceof Error ? error.message : 'Unknown error']
          };
        }
      }

      // 同步用户设置
      if (syncData.userSettings) {
        logger.info(`⚙️ 同步用户设置`);
        try {
          const settingsResult = await this.syncUserSettings(userId, syncData.userSettings);
          result.data!.userSettings = settingsResult;
          logger.info(`✅ 用户设置同步成功`);
        } catch (error) {
          logger.error(`❌ 用户设置同步失败:`, error);
          return {
            success: false,
            message: '用户设置同步失败',
            errors: [error instanceof Error ? error.message : 'Unknown error']
          };
        }
      }

      // 更新用户最后同步时间
      try {
        await User.findByIdAndUpdate(
          userId,
          { 'auth.lastLoginAt': new Date() }
        );
        logger.info(`✅ 用户同步时间更新成功`);
      } catch (error) {
        logger.error(`❌ 用户同步时间更新失败:`, error);
        // 不返回错误，因为这不是关键操作
      }

      logger.info(`🎉 用户 ${userId} 数据同步完成`);
      return result;
    } catch (error) {
      logger.error(`❌ 数据上传失败:`, error);
      logger.error(`❌ 错误详情:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        syncDataSize: JSON.stringify(syncData).length
      });
      
      return {
        success: false,
        message: '数据上传失败',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // 从云端下载数据
  async downloadData(userId: string): Promise<ISyncResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: '用户不存在',
          errors: ['User not found']
        };
      }

      // 获取学习记录
      const learningRecords = await UserLearningRecord.findOne({ userId });
      
      // 获取搜索历史
      const searchHistory = await SearchHistory.find({ userId }).sort({ timestamp: -1 }).limit(100);
      
      // 获取用户设置
      const userSettings = user.settings;

      return {
        success: true,
        message: '数据下载成功',
        data: {
          learningRecords: learningRecords ? learningRecords.records : [],
          searchHistory: searchHistory,
          userSettings: userSettings
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '数据下载失败',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // 同步学习记录
  private async syncLearningRecords(userId: string, localRecords: any[]): Promise<any[]> {
    try {
      logger.info(`📚 开始同步学习记录，用户: ${userId}, 记录数: ${localRecords.length}`);
      
      let userLearningRecord = await UserLearningRecord.findOne({ userId });
      
      if (!userLearningRecord) {
        logger.info(`📝 为用户 ${userId} 创建新的学习记录文档`);
        userLearningRecord = new UserLearningRecord({
          userId,
          records: [],
          totalWords: 0,
          totalReviews: 0,
          averageMastery: 0,
          lastStudyDate: new Date()
        });
      } else {
        logger.info(`📖 找到现有学习记录，当前记录数: ${userLearningRecord.records.length}`);
      }

      const conflicts: any[] = [];
      const syncedRecords: any[] = [];

      for (let i = 0; i < localRecords.length; i++) {
        const localRecord = localRecords[i];
        logger.debug(`🔄 处理第 ${i + 1}/${localRecords.length} 条记录: ${localRecord.word}`);
        
        try {
          // 验证记录格式
          if (!localRecord.word) {
            logger.warn(`⚠️ 跳过无效记录（缺少word字段）:`, localRecord);
            continue;
          }

          const existingRecord = userLearningRecord.records.find(
            (r: any) => r.word === localRecord.word
          );

          if (existingRecord) {
            logger.debug(`🔄 更新现有记录: ${localRecord.word}`);
            // 检查冲突
            if (this.hasConflict(existingRecord, localRecord)) {
              conflicts.push({
                word: localRecord.word,
                local: localRecord,
                remote: existingRecord
              });
              logger.debug(`⚠️ 检测到冲突: ${localRecord.word}`);
            }
            // 默认使用最新的数据
            const mergedRecord = this.mergeRecords(existingRecord, localRecord);
            Object.assign(existingRecord, mergedRecord);
          } else {
            logger.debug(`➕ 添加新记录: ${localRecord.word}`);
            // 新记录，直接添加
            userLearningRecord.records.push(localRecord);
            userLearningRecord.totalWords += 1;
          }

          syncedRecords.push(localRecord);
        } catch (recordError) {
          logger.error(`❌ 处理记录失败: ${localRecord.word}`, recordError);
          // 继续处理其他记录，不中断整个同步过程
        }
      }

      // 更新统计信息
      if (userLearningRecord.records.length > 0) {
        const totalMastery = userLearningRecord.records.reduce((sum: number, record: any) => sum + (record.mastery || 0), 0);
        userLearningRecord.averageMastery = Math.round(totalMastery / userLearningRecord.records.length);
        logger.debug(`📊 更新统计信息: 平均掌握度 ${userLearningRecord.averageMastery}%`);
      } else {
        userLearningRecord.averageMastery = 0;
      }

      logger.info(`💾 保存学习记录到数据库...`);
      await userLearningRecord.save();
      logger.info(`✅ 学习记录保存成功，总记录数: ${userLearningRecord.records.length}`);

      if (conflicts.length > 0) {
        logger.warn(`⚠️ 检测到 ${conflicts.length} 个数据冲突`);
      }

      return syncedRecords;
    } catch (error) {
      logger.error(`❌ 同步学习记录失败:`, error);
      logger.error(`❌ 错误详情:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        recordCount: localRecords.length
      });
      throw error;
    }
  }

  // 同步搜索历史
  private async syncSearchHistory(userId: string, localHistory: any[]): Promise<any[]> {
    const syncedHistory: any[] = [];

    for (const localItem of localHistory) {
      // 检查是否已存在
      const existingItem = await SearchHistory.findOne({
        userId,
        word: localItem.word,
        timestamp: localItem.timestamp
      });

      if (!existingItem) {
        // 添加新的搜索历史
        const newHistory = new SearchHistory({
          userId,
          word: localItem.word,
          definition: localItem.definition,
          timestamp: localItem.timestamp
        });
        await newHistory.save();
        syncedHistory.push(newHistory);
      }
    }

    return syncedHistory;
  }

  // 同步用户设置
  private async syncUserSettings(userId: string, localSettings: any): Promise<any> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 合并设置，本地设置优先
    const mergedSettings = this.mergeSettings(user.settings, localSettings);
    user.settings = mergedSettings;
    
    // 确保所有必需的设置字段都存在
    if (!user.settings.privacy) {
      user.settings.privacy = {
        shareProgress: false,
        showInLeaderboard: true
      };
    }
    
    await user.save();

    return mergedSettings;
  }

  // 检查是否有冲突
  private hasConflict(remoteRecord: any, localRecord: any): boolean {
    // 简单的冲突检测：如果两个记录都有更新且时间接近
    const remoteTime = new Date(remoteRecord.lastReviewDate).getTime();
    const localTime = new Date(localRecord.lastReviewDate).getTime();
    const timeDiff = Math.abs(remoteTime - localTime);
    
    // 如果时间差小于1小时且都有更新，认为有冲突
    return timeDiff < 3600000 && 
           remoteRecord.reviewCount > 0 && 
           localRecord.reviewCount > 0;
  }

  // 合并记录
  private mergeRecords(remoteRecord: any, localRecord: any): any {
    const merged = { ...remoteRecord };

    // 合并复习次数
    merged.reviewCount = Math.max(remoteRecord.reviewCount, localRecord.reviewCount);
    merged.correctCount = Math.max(remoteRecord.correctCount, localRecord.correctCount);
    merged.incorrectCount = Math.max(remoteRecord.incorrectCount, localRecord.incorrectCount);

    // 使用最新的时间
    const remoteTime = new Date(remoteRecord.lastReviewDate).getTime();
    const localTime = new Date(localRecord.lastReviewDate).getTime();
    merged.lastReviewDate = remoteTime > localTime ? remoteRecord.lastReviewDate : localRecord.lastReviewDate;

    // 合并掌握度（取平均值）
    merged.mastery = Math.round((remoteRecord.mastery + localRecord.mastery) / 2);

    // 合并学习时间
    merged.totalStudyTime = remoteRecord.totalStudyTime + localRecord.totalStudyTime;

    // 合并平均响应时间
    const totalReviews = remoteRecord.reviewCount + localRecord.reviewCount;
    if (totalReviews > 0) {
      merged.averageResponseTime = Math.round(
        (remoteRecord.averageResponseTime * remoteRecord.reviewCount + 
         localRecord.averageResponseTime * localRecord.reviewCount) / totalReviews
      );
    }

    // 合并标签 - 添加安全检查
    const remoteTags = Array.isArray(remoteRecord.tags) ? remoteRecord.tags : [];
    const localTags = Array.isArray(localRecord.tags) ? localRecord.tags : [];
    const allTags = new Set([...remoteTags, ...localTags]);
    merged.tags = Array.from(allTags);

    // 合并笔记（使用较长的笔记）
    if (localRecord.notes && (!remoteRecord.notes || localRecord.notes.length > remoteRecord.notes.length)) {
      merged.notes = localRecord.notes;
    }

    return merged;
  }

  // 合并设置
  private mergeSettings(remoteSettings: any, localSettings: any): any {
    const merged = { ...remoteSettings };

    // 合并通知设置
    if (localSettings.notifications) {
      merged.notifications = {
        ...remoteSettings.notifications,
        ...localSettings.notifications
      };
    }

    // 合并学习设置
    if (localSettings.learning) {
      merged.learning = {
        ...remoteSettings.learning,
        ...localSettings.learning
      };
    }

    // 合并隐私设置
    if (localSettings.privacy) {
      merged.privacy = {
        ...remoteSettings.privacy,
        ...localSettings.privacy
      };
    }

    // 合并主题和语言设置
    if (localSettings.theme) {
      merged.theme = localSettings.theme;
    }
    if (localSettings.language) {
      merged.language = localSettings.language;
    }

    return merged;
  }

  // 解决冲突
  async resolveConflicts(userId: string, conflicts: any[], resolution: ConflictResolution): Promise<ISyncResult> {
    try {
      const userLearningRecord = await UserLearningRecord.findOne({ userId });
      if (!userLearningRecord) {
        return {
          success: false,
          message: '学习记录不存在',
          errors: ['Learning record not found']
        };
      }

      for (const conflict of conflicts) {
        const record = userLearningRecord.records.find((r: any) => r.word === conflict.word);
        if (!record) continue;

        switch (resolution) {
          case 'local':
            Object.assign(record, conflict.local);
            break;
          case 'remote':
            Object.assign(record, conflict.remote);
            break;
          case 'merge':
            const merged = this.mergeRecords(conflict.remote, conflict.local);
            Object.assign(record, merged);
            break;
          case 'manual':
            // 手动解决冲突的逻辑可以在这里实现
            break;
        }
      }

      if (userLearningRecord.records.length > 0) {
        const totalMastery = userLearningRecord.records.reduce((sum: number, record: any) => sum + record.mastery, 0);
        userLearningRecord.averageMastery = Math.round(totalMastery / userLearningRecord.records.length);
      } else {
        userLearningRecord.averageMastery = 0;
      }
      await userLearningRecord.save();

      return {
        success: true,
        message: '冲突解决成功',
        data: {
          learningRecords: userLearningRecord.records,
          searchHistory: [],
          userSettings: {}
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '冲突解决失败',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // 获取同步状态
  async getSyncStatus(userId: string): Promise<{
    lastSyncTime: Date | null;
    hasUnsyncedData: boolean;
    conflicts: any[];
  }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          lastSyncTime: null,
          hasUnsyncedData: false,
          conflicts: []
        };
      }

      const learningRecord = await UserLearningRecord.findOne({ userId });
      const searchHistory = await SearchHistory.find({ userId }).sort({ timestamp: -1 }).limit(10);

      return {
        lastSyncTime: user.auth.lastLoginAt,
        hasUnsyncedData: !!(learningRecord || searchHistory.length > 0),
        conflicts: [] // 这里可以实现冲突检测逻辑
      };
    } catch (error) {
      return {
        lastSyncTime: null,
        hasUnsyncedData: false,
        conflicts: []
      };
    }
  }
}

export default SyncService.getInstance(); 