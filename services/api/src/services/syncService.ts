import { User } from '../models/User';
import { UserLearningRecord } from '../models/UserLearningRecord';
import { Word } from '../models/Word';
import { Show } from '../models/Show';
import { SearchHistory } from '../models/SearchHistory';
import UserShowList from '../models/UserShowList';
import UserVocabulary from '../models/UserVocabulary';
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
  shows?: any[]; // 新增剧单数据
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
    shows?: any[]; // 新增剧单数据
  };
  errors?: string[];
}

// 冲突解决策略


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
          userSettings: {},
          shows: []
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

      // 同步剧单数据
      if (syncData.shows) {
        logger.info(`📺 同步剧单数据`);
        try {
          const showsResult = await this.syncShows(userId, syncData.shows);
          result.data!.shows = showsResult;
          logger.info(`✅ 剧单数据同步成功`);
        } catch (error) {
          logger.error(`❌ 剧单数据同步失败:`, error);
          return {
            success: false,
            message: '剧单数据同步失败',
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

      // 获取剧单数据
      const userShowList = await UserShowList.findOne({ userId });

      return {
        success: true,
        message: '数据下载成功',
        data: {
          learningRecords: learningRecords ? learningRecords.records : [],
          searchHistory: searchHistory,
          userSettings: userSettings,
          shows: userShowList ? userShowList.shows : []
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
      // 使用 findOneAndUpdate 避免并行保存冲突
      await UserLearningRecord.findByIdAndUpdate(
        userLearningRecord._id,
        { $set: { records: userLearningRecord.records } },
        { new: true }
      );
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
        // 使用 findOneAndUpdate 避免并行保存冲突
        await SearchHistory.findByIdAndUpdate(
          newHistory._id,
          { $set: newHistory.toObject() },
          { new: true }
        );
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
    
    // 使用 findOneAndUpdate 避免并行保存冲突
    await User.findByIdAndUpdate(
      user._id,
      { $set: { settings: user.settings } },
      { new: true }
    );

    return mergedSettings;
  }

  // 同步剧单数据
  private async syncShows(userId: string, localShowsData: any): Promise<any> {
    try {
      const { shows: localShows } = localShowsData;
      
      if (!Array.isArray(localShows)) {
        logger.warn('⚠️ 剧单数据格式不正确，跳过同步');
        return { shows: [] };
      }

      let userShowList = await UserShowList.findOne({ userId });
      
      if (!userShowList) {
        logger.info(`📝 为用户 ${userId} 创建新的剧单文档`);
        userShowList = new UserShowList({
          userId,
          shows: [],
          updatedAt: new Date()
        });
      }

      logger.info(`📖 同步剧单数据，本地剧集数: ${localShows.length}, 云端剧集数: ${userShowList.shows.length}`);

      // 使用本地数据覆盖云端数据（多邻国原则：本地优先）
      userShowList.shows = localShows;
      userShowList.updatedAt = new Date();
      
      await userShowList.save();
      
      logger.info(`✅ 剧单同步成功，更新了 ${localShows.length} 个剧集`);
      
      return {
        shows: localShows,
        totalShows: localShows.length,
        lastSyncTime: new Date()
      };
    } catch (error) {
      logger.error('❌ 剧单同步失败:', error);
      throw error;
    }
  }

  // 检查是否有冲突
  private hasConflict(remoteRecord: any, localRecord: any): boolean {
    try {
      // 改进时间戳处理，添加安全检查
      const remoteTime = this.safeParseDate(remoteRecord.lastReviewDate);
      const localTime = this.safeParseDate(localRecord.lastReviewDate);
      
      if (!remoteTime || !localTime) {
        // 如果时间戳无效，基于其他字段判断冲突
        return remoteRecord.reviewCount > 0 && localRecord.reviewCount > 0 &&
               remoteRecord.mastery !== localRecord.mastery;
      }
      
      const timeDiff = Math.abs(remoteTime.getTime() - localTime.getTime());
      
      // 如果时间差小于1小时且都有更新，认为有冲突
      return timeDiff < 3600000 && 
             remoteRecord.reviewCount > 0 && 
             localRecord.reviewCount > 0;
    } catch (error) {
      logger.warn(`⚠️ 冲突检测异常: ${error.message}`);
      // 保守策略：认为有冲突
      return true;
    }
  }

  // 安全解析日期
  private safeParseDate(dateValue: any): Date | null {
    try {
      if (!dateValue) return null;
      
      if (dateValue instanceof Date) {
        return isNaN(dateValue.getTime()) ? null : dateValue;
      }
      
      if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date;
      }
      
      return null;
    } catch (error) {
      logger.warn(`⚠️ 日期解析失败: ${dateValue}`, error);
      return null;
    }
  }

  // 合并记录 - 修复数据覆盖问题，确保本地数据优先
  private mergeRecords(remoteRecord: any, localRecord: any): any {
    // 以本地数据为基础，确保本地数据优先
    const merged = { ...localRecord };

    try {
      // 合并复习次数 - 取最大值
      merged.reviewCount = Math.max(remoteRecord.reviewCount || 0, localRecord.reviewCount || 0);
      merged.correctCount = Math.max(remoteRecord.correctCount || 0, localRecord.correctCount || 0);
      merged.incorrectCount = Math.max(remoteRecord.incorrectCount || 0, localRecord.incorrectCount || 0);

      // 使用最新的时间 - 本地数据优先
      const remoteTime = this.safeParseDate(remoteRecord.lastReviewDate);
      const localTime = this.safeParseDate(localRecord.lastReviewDate);
      
      if (remoteTime && localTime) {
        // 如果本地时间更新，保持本地时间；否则使用远程时间
        merged.lastReviewDate = localTime.getTime() >= remoteTime.getTime() 
          ? localRecord.lastReviewDate 
          : remoteRecord.lastReviewDate;
      } else if (localTime) {
        // 如果只有本地时间有效，使用本地时间
        merged.lastReviewDate = localRecord.lastReviewDate;
      } else if (remoteTime) {
        // 如果只有远程时间有效，使用远程时间
        merged.lastReviewDate = remoteRecord.lastReviewDate;
      }

      // 合并掌握度 - 本地数据优先，如果本地更高则保持本地值
      const localMastery = localRecord.mastery || 0;
      const remoteMastery = remoteRecord.mastery || 0;
      merged.mastery = localMastery >= remoteMastery ? localMastery : remoteMastery;

      // 合并学习时间 - 累加
      merged.totalStudyTime = (remoteRecord.totalStudyTime || 0) + (localRecord.totalStudyTime || 0);

      // 合并平均响应时间 - 加权平均
      const totalReviews = (remoteRecord.reviewCount || 0) + (localRecord.reviewCount || 0);
      if (totalReviews > 0) {
        const remoteAvg = remoteRecord.averageResponseTime || 0;
        const localAvg = localRecord.averageResponseTime || 0;
        const remoteWeight = remoteRecord.reviewCount || 0;
        const localWeight = localRecord.reviewCount || 0;
        
        merged.averageResponseTime = Math.round(
          (remoteAvg * remoteWeight + localAvg * localWeight) / totalReviews
        );
      }

      // 合并标签 - 本地数据优先，合并所有标签
      const remoteTags = Array.isArray(remoteRecord.tags) ? remoteRecord.tags : [];
      const localTags = Array.isArray(localRecord.tags) ? localRecord.tags : [];
      const allTags = new Set([...localTags, ...remoteTags]); // 本地标签在前
      merged.tags = Array.from(allTags);

      // 合并笔记 - 本地数据优先，使用较长的笔记
      if (localRecord.notes && (!remoteRecord.notes || localRecord.notes.length >= remoteRecord.notes.length)) {
        merged.notes = localRecord.notes;
      } else if (remoteRecord.notes) {
        merged.notes = remoteRecord.notes;
      }

      // 合并其他字段 - 本地数据优先
      if (localRecord.confidence !== undefined) {
        merged.confidence = localRecord.confidence;
      } else if (remoteRecord.confidence !== undefined) {
        merged.confidence = remoteRecord.confidence;
      }

      if (localRecord.interval !== undefined) {
        merged.interval = localRecord.interval;
      } else if (remoteRecord.interval !== undefined) {
        merged.interval = remoteRecord.interval;
      }

      if (localRecord.easeFactor !== undefined) {
        merged.easeFactor = localRecord.easeFactor;
      } else if (remoteRecord.easeFactor !== undefined) {
        merged.easeFactor = remoteRecord.easeFactor;
      }

      if (localRecord.consecutiveCorrect !== undefined) {
        merged.consecutiveCorrect = localRecord.consecutiveCorrect;
      } else if (remoteRecord.consecutiveCorrect !== undefined) {
        merged.consecutiveCorrect = remoteRecord.consecutiveCorrect;
      }

      if (localRecord.consecutiveIncorrect !== undefined) {
        merged.consecutiveIncorrect = localRecord.consecutiveIncorrect;
      } else if (remoteRecord.consecutiveIncorrect !== undefined) {
        merged.consecutiveIncorrect = remoteRecord.consecutiveIncorrect;
      }

      if (localRecord.nextReviewDate) {
        merged.nextReviewDate = localRecord.nextReviewDate;
      } else if (remoteRecord.nextReviewDate) {
        merged.nextReviewDate = remoteRecord.nextReviewDate;
      }

    } catch (error) {
      logger.error(`❌ 记录合并异常: ${error.message}`);
      // 发生异常时，完全使用本地数据
      return { ...localRecord };
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