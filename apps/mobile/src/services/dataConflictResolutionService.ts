/**
 * ========================================
 * 🔄 [SYNC SERVICE] 数据同步服务
 * ========================================
 * 
 * 服务类型: 数据同步相关服务
 * 功能描述: 数据冲突解决服务 - 冲突检测和解决
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
import { Alert } from 'react-native';
import { unifiedSyncService } from './unifiedSyncService';

export interface DataConflict {
  id: string;
  dataType: 'vocabulary' | 'shows' | 'learningRecords' | 'experience' | 'badges' | 'userStats';
  conflictType: 'version' | 'content' | 'deletion' | 'addition';
  localData: any;
  cloudData: any;
  localVersion: number;
  cloudVersion: number;
  lastModified: number;
  resolution: 'local' | 'cloud' | 'merge' | 'manual';
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedFields: string[];
}

export interface ConflictResolutionResult {
  success: boolean;
  resolvedData: any;
  conflicts: DataConflict[];
  mergedCount: number;
  resolvedCount: number;
  manualCount: number;
  errors: string[];
  resolvedConflicts: Array<{
    conflictId: string;
    resolution: 'local' | 'cloud' | 'merged' | 'manual';
    finalData: any;
  }>;
  unresolvedConflicts: string[];
  backupCreated: boolean;
  backupId?: string;
}

export interface ResolutionSuggestion {
  action: 'keep_local' | 'keep_cloud' | 'merge' | 'manual';
  confidence: number; // 0-1
  reason: string;
  preview: any;
}

export interface DataBackup {
  id: string;
  dataType: string;
  data: any;
  timestamp: number;
  version: number;
  size: number;
}

export interface DataVersion {
  version: number;
  timestamp: number;
  checksum: string;
  changeType: 'create' | 'update' | 'delete';
  metadata: {
    deviceId: string;
    userId: string;
    dataSize: number;
  };
}

export class DataConflictResolutionService {
  private static instance: DataConflictResolutionService;
  private isResolving: boolean = false;
  private currentConflicts: DataConflict[] = [];
  private resolutionCallbacks: Map<string, (result: any) => void> = new Map();

  public static getInstance(): DataConflictResolutionService {
    if (!DataConflictResolutionService.instance) {
      DataConflictResolutionService.instance = new DataConflictResolutionService();
    }
    return DataConflictResolutionService.instance;
  }

  private constructor() {}

  // 检测数据冲突
  public async detectConflicts(
    localData: any,
    cloudData: any,
    dataType: string
  ): Promise<DataConflict[]> {
    try {
      console.log(`🔍 开始检测${dataType}数据冲突...`);
      
      const conflicts: DataConflict[] = [];
      
      // 1. 版本冲突检测
      const versionConflicts = this.detectVersionConflicts(localData, cloudData, dataType);
      conflicts.push(...versionConflicts);
      
      // 2. 内容冲突检测
      const contentConflicts = this.detectContentConflicts(localData, cloudData, dataType);
      conflicts.push(...contentConflicts);
      
      // 3. 删除冲突检测
      const deletionConflicts = this.detectDeletionConflicts(localData, cloudData, dataType);
      conflicts.push(...deletionConflicts);
      
      // 4. 新增冲突检测
      const additionConflicts = this.detectAdditionConflicts(localData, cloudData, dataType);
      conflicts.push(...additionConflicts);
      
      console.log(`✅ ${dataType}冲突检测完成，发现${conflicts.length}个冲突`);
      this.currentConflicts = conflicts;
      
      return conflicts;
      
    } catch (error) {
      console.error(`❌ ${dataType}冲突检测失败:`, error);
      throw error;
    }
  }

  // 检测版本冲突
  private detectVersionConflicts(localData: any, cloudData: any, dataType: string): DataConflict[] {
    const conflicts: DataConflict[] = [];
    
    if (!localData || !cloudData) return conflicts;
    
    const localVersion = this.getDataVersion(localData);
    const cloudVersion = this.getDataVersion(cloudData);
    
    if (localVersion && cloudVersion && localVersion.version !== cloudVersion.version) {
      conflicts.push({
        id: `version_${dataType}_${Date.now()}`,
        dataType: dataType as any,
        conflictType: 'version',
        localData,
        cloudData,
        localVersion: localVersion.version,
        cloudVersion: cloudVersion.version,
        lastModified: Math.max(localVersion.timestamp, cloudVersion.timestamp),
        resolution: 'merge',
        confidence: 0.8,
        severity: this.calculateSeverity('version', dataType),
        description: `版本冲突: 本地版本 ${localVersion.version} vs 云端版本 ${cloudVersion.version}`,
        affectedFields: ['version', 'lastModified']
      });
    }
    
    return conflicts;
  }

  // 检测内容冲突
  private detectContentConflicts(localData: any, cloudData: any, dataType: string): DataConflict[] {
    const conflicts: DataConflict[] = [];
    
    if (!localData || !cloudData) return conflicts;
    
    // 根据数据类型进行具体的内容冲突检测
    switch (dataType) {
      case 'vocabulary':
        conflicts.push(...this.detectVocabularyContentConflicts(localData, cloudData));
        break;
      case 'shows':
        conflicts.push(...this.detectShowsContentConflicts(localData, cloudData));
        break;
      case 'learningRecords':
        conflicts.push(...this.detectLearningRecordsContentConflicts(localData, cloudData));
        break;
      case 'experience':
        conflicts.push(...this.detectExperienceContentConflicts(localData, cloudData));
        break;
      case 'badges':
        conflicts.push(...this.detectBadgesContentConflicts(localData, cloudData));
        break;
      case 'userStats':
        conflicts.push(...this.detectUserStatsContentConflicts(localData, cloudData));
        break;
    }
    
    return conflicts;
  }

  // 检测删除冲突
  private detectDeletionConflicts(localData: any, cloudData: any, dataType: string): DataConflict[] {
    const conflicts: DataConflict[] = [];
    
    if (!localData || !cloudData) return conflicts;
    
    // 检查本地删除但云端仍存在的数据
    const localDeletedItems = this.getDeletedItems(localData);
    const cloudExistingItems = this.getExistingItems(cloudData);
    
    for (const deletedItem of localDeletedItems) {
      if (cloudExistingItems.includes(deletedItem)) {
        conflicts.push({
          id: `deletion_${dataType}_${Date.now()}`,
          dataType: dataType as any,
          conflictType: 'deletion',
          localData: { action: 'delete', item: deletedItem },
          cloudData: { action: 'keep', item: deletedItem },
          localVersion: this.getDataVersion(localData)?.version || 0,
          cloudVersion: this.getDataVersion(cloudData)?.version || 0,
          lastModified: Date.now(),
          resolution: 'manual',
          confidence: 0.6,
          severity: this.calculateSeverity('deletion', dataType),
          description: `删除冲突: 本地删除但云端保留 ${deletedItem}`,
          affectedFields: ['deletion']
        });
      }
    }
    
    return conflicts;
  }

  // 检测新增冲突
  private detectAdditionConflicts(localData: any, cloudData: any, dataType: string): DataConflict[] {
    const conflicts: DataConflict[] = [];
    
    if (!localData || !cloudData) return conflicts;
    
    // 检查本地新增但云端也新增的数据（可能ID冲突）
    const localNewItems = this.getNewItems(localData);
    const cloudNewItems = this.getNewItems(cloudData);
    
    for (const localItem of localNewItems) {
      for (const cloudItem of cloudNewItems) {
        if (this.isPotentialConflict(localItem, cloudItem, dataType)) {
          conflicts.push({
            id: `addition_${dataType}_${Date.now()}`,
            dataType: dataType as any,
            conflictType: 'addition',
            localData: localItem,
            cloudData: cloudItem,
            localVersion: this.getDataVersion(localData)?.version || 0,
            cloudVersion: this.getDataVersion(cloudData)?.version || 0,
            lastModified: Date.now(),
            resolution: 'manual',
            confidence: 0.7,
            severity: this.calculateSeverity('addition', dataType),
            description: `新增冲突: 本地和云端都新增了相似数据`,
            affectedFields: ['addition']
          });
        }
      }
    }
    
    return conflicts;
  }

  // 解决数据冲突
  public async resolveConflicts(
    conflicts: DataConflict[],
    resolutionStrategy: 'auto' | 'smart' | 'manual' = 'smart'
  ): Promise<ConflictResolutionResult> {
    try {
      if (this.isResolving) {
        throw new Error('冲突解决正在进行中，请等待完成');
      }
      
      this.isResolving = true;
      console.log(`🔄 开始解决${conflicts.length}个数据冲突，策略: ${resolutionStrategy}`);
      
      const result: ConflictResolutionResult = {
        success: true,
        resolvedData: {},
        conflicts: conflicts,
        mergedCount: 0,
        resolvedCount: 0,
        manualCount: 0,
        errors: [],
        resolvedConflicts: [],
        unresolvedConflicts: [],
        backupCreated: false
      };
      
      // 按数据类型分组处理冲突
      const conflictsByType = this.groupConflictsByType(conflicts);
      
      for (const [dataType, typeConflicts] of Object.entries(conflictsByType)) {
        try {
          const typeResult = await this.resolveTypeConflicts(dataType, typeConflicts, resolutionStrategy);
          
          if (typeResult.success) {
            result.resolvedData[dataType] = typeResult.resolvedData;
            result.mergedCount += typeResult.mergedCount;
            result.resolvedCount += typeResult.resolvedCount;
            result.manualCount += typeResult.manualCount;
          } else {
            result.errors.push(`${dataType}: ${typeResult.error}`);
          }
        } catch (error: any) {
          result.errors.push(`${dataType}: ${error.message}`);
        }
      }
      
      console.log(`✅ 冲突解决完成: 合并${result.mergedCount}个，解决${result.resolvedCount}个，手动处理${result.manualCount}个`);
      
      return result;
      
    } catch (error) {
      console.error('❌ 冲突解决失败:', error);
      throw error;
    } finally {
      this.isResolving = false;
    }
  }

  // 按类型解决冲突
  private async resolveTypeConflicts(
    dataType: string,
    conflicts: DataConflict[],
    strategy: string
  ): Promise<{ success: boolean; resolvedData: any; mergedCount: number; resolvedCount: number; manualCount: number; error?: string }> {
    try {
      let resolvedData: any = {};
      let mergedCount = 0;
      let resolvedCount = 0;
      let manualCount = 0;
      
      // 获取该类型的基准数据
      const baseData = await this.getBaseData(dataType);
      
      for (const conflict of conflicts) {
        try {
          let resolution: any;
          
          switch (strategy) {
            case 'auto':
              resolution = this.autoResolveConflict(conflict, baseData);
              break;
            case 'smart':
              resolution = this.smartResolveConflict(conflict, baseData);
              break;
            case 'manual':
              resolution = this.manualResolveConflict(conflict, baseData);
              manualCount++;
              break;
            default:
              resolution = this.smartResolveConflict(conflict, baseData);
          }
          
          if (resolution.success) {
            resolvedData = { ...resolvedData, ...resolution.data };
            if (resolution.type === 'merge') {
              mergedCount++;
            } else {
              resolvedCount++;
            }
          }
        } catch (error) {
          console.error(`❌ 解决冲突失败:`, error);
          // 继续处理其他冲突
        }
      }
      
      return {
        success: true,
        resolvedData,
        mergedCount,
        resolvedCount,
        manualCount
      };
      
    } catch (error: any) {
      return {
        success: false,
        resolvedData: {},
        mergedCount: 0,
        resolvedCount: 0,
        manualCount: 0,
        error: error.message
      };
    }
  }

  // 智能解决冲突
  private smartResolveConflict(conflict: DataConflict, baseData: any): { success: boolean; data: any; type: string } {
    try {
      const { dataType, conflictType, localData, cloudData, localVersion, cloudVersion } = conflict;
      
      // 基于冲突类型和版本信息智能决策
      switch (conflictType) {
        case 'version':
          // 版本冲突：选择较新版本，或智能合并
          if (cloudVersion > localVersion) {
            return { success: true, data: cloudData, type: 'resolve' };
          } else if (localVersion > cloudVersion) {
            return { success: true, data: localData, type: 'resolve' };
          } else {
            // 版本相同，尝试合并
            return this.mergeDataByType(localData, cloudData, dataType);
          }
          
        case 'content':
          // 内容冲突：尝试智能合并
          return this.mergeDataByType(localData, cloudData, dataType);
          
        case 'deletion':
          // 删除冲突：保留云端数据（更安全）
          return { success: true, data: cloudData, type: 'resolve' };
          
        case 'addition':
          // 新增冲突：尝试合并，避免ID冲突
          return this.mergeDataByType(localData, cloudData, dataType);
          
        default:
          // 默认策略：选择云端数据
          return { success: true, data: cloudData, type: 'resolve' };
      }
      
    } catch (error) {
      console.error('❌ 智能解决冲突失败:', error);
      // 降级到云端数据
      return { success: true, data: conflict.cloudData, type: 'resolve' };
    }
  }

  // 自动解决冲突
  private autoResolveConflict(conflict: DataConflict, baseData: any): { success: boolean; data: any; type: string } {
    // 自动策略：总是选择云端数据
    return { success: true, data: conflict.cloudData, type: 'resolve' };
  }

  // 手动解决冲突
  private manualResolveConflict(conflict: DataConflict, baseData: any): { success: boolean; data: any; type: string } {
    // 手动策略：标记为需要手动处理
    conflict.resolution = 'manual';
    return { success: false, data: null, type: 'manual' };
  }

  // 合并数据
  private mergeDataByType(localData: any, cloudData: any, dataType: string): { success: boolean; data: any; type: string } {
    try {
      let mergedData: any;
      
      switch (dataType) {
        case 'vocabulary':
          mergedData = this.mergeVocabularyData(localData, cloudData);
          break;
        case 'shows':
          mergedData = this.mergeShowsData(localData, cloudData);
          break;
        case 'learningRecords':
          mergedData = this.mergeLearningRecordsData(localData, cloudData);
          break;
        case 'experience':
          mergedData = this.mergeExperienceData(localData, cloudData);
          break;
        case 'badges':
          mergedData = this.mergeBadgesData(localData, cloudData);
          break;
        case 'userStats':
          mergedData = this.mergeUserStatsData(localData, cloudData);
          break;
        default:
          // 默认合并策略：深度合并
          mergedData = this.deepMerge(localData, cloudData);
      }
      
      return { success: true, data: mergedData, type: 'merge' };
      
    } catch (error) {
      console.error('❌ 数据合并失败:', error);
      // 合并失败时选择云端数据
      return { success: true, data: cloudData, type: 'resolve' };
    }
  }

  // 词汇数据合并
  private mergeVocabularyData(localData: any, cloudData: any): any {
    if (!localData || !cloudData) return localData || cloudData;
    
    const merged = { ...cloudData };
    
    // 合并词汇项
    if (localData.vocabulary && cloudData.vocabulary) {
      const localVocab = new Map(localData.vocabulary.map((item: any) => [item.word, item]));
      const cloudVocab = new Map(cloudData.vocabulary.map((item: any) => [item.word, item]));
      
      // 合并本地和云端词汇
      for (const [word, localItem] of localVocab) {
        if (cloudVocab.has(word)) {
          // 冲突时选择较新的数据
          const cloudItem = cloudVocab.get(word);
          if ((localItem as any).lastModified > (cloudItem as any).lastModified) {
            merged.vocabulary = merged.vocabulary.map((item: any) => 
              item.word === word ? localItem : item
            );
          }
        } else {
          // 本地独有的词汇
          merged.vocabulary.push(localItem);
        }
      }
    }
    
    return merged;
  }

  // 剧单数据合并
  private mergeShowsData(localData: any, cloudData: any): any {
    if (!localData || !cloudData) return localData || cloudData;
    
    const merged = { ...cloudData };
    
    // 合并剧单
    if (localData.shows && cloudData.shows) {
      const localShows = new Map(localData.shows.map((item: any) => [item.id, item]));
      const cloudShows = new Map(cloudData.shows.map((item: any) => [item.id, item]));
      
      for (const [id, localShow] of localShows) {
        if (cloudShows.has(id)) {
          // 冲突时选择较新的数据
          const cloudShow = cloudShows.get(id);
          if ((localShow as any).lastModified > (cloudShow as any).lastModified) {
            merged.shows = merged.shows.map((item: any) => 
              item.id === id ? localShow : item
            );
          }
        } else {
          // 本地独有的剧单
          merged.shows.push(localShow);
        }
      }
    }
    
    return merged;
  }

  // 学习记录数据合并
  private mergeLearningRecordsData(localData: any, cloudData: any): any {
    if (!localData || !cloudData) return localData || cloudData;
    
    const merged = { ...cloudData };
    
    // 合并学习记录
    if (localData.records && cloudData.records) {
      const localRecords = new Map(localData.records.map((item: any) => [item.id, item]));
      const cloudRecords = new Map(cloudData.records.map((item: any) => [item.id, item]));
      
      for (const [id, localRecord] of localRecords) {
        if (cloudRecords.has(id)) {
          // 冲突时选择较新的数据
          const cloudRecord = cloudRecords.get(id);
          if ((localRecord as any).lastModified > (cloudRecord as any).lastModified) {
            merged.records = merged.records.map((item: any) => 
              item.id === id ? localRecord : item
            );
          }
        } else {
          // 本地独有的记录
          merged.records.push(localRecord);
        }
      }
    }
    
    return merged;
  }

  // 经验值数据合并
  private mergeExperienceData(localData: any, cloudData: any): any {
    if (!localData || !cloudData) return localData || cloudData;
    
    const merged = { ...cloudData };
    
    // 经验值取最大值
    if (localData.experience && cloudData.experience) {
      merged.experience = Math.max(localData.experience, cloudData.experience);
    }
    
    // 等级取最高
    if (localData.level && cloudData.level) {
      merged.level = Math.max(localData.level, cloudData.level);
    }
    
    // 学习天数取最大值
    if (localData.learningDays && cloudData.learningDays) {
      merged.learningDays = Math.max(localData.learningDays, cloudData.learningDays);
    }
    
    return merged;
  }

  // 徽章数据合并
  private mergeBadgesData(localData: any, cloudData: any): any {
    if (!localData || !cloudData) return localData || cloudData;
    
    const merged = { ...cloudData };
    
    // 合并徽章
    if (localData.badges && cloudData.badges) {
      const localBadges = new Map(localData.badges.map((item: any) => [item.id, item]));
      const cloudBadges = new Map(cloudData.badges.map((item: any) => [item.id, item]));
      
      for (const [id, localBadge] of localBadges) {
        if (cloudBadges.has(id)) {
          // 冲突时选择较新的数据
          const cloudBadge = cloudBadges.get(id);
          if ((localBadge as any).unlockedAt > (cloudBadge as any).unlockedAt) {
            merged.badges = merged.badges.map((item: any) => 
              item.id === id ? localBadge : item
            );
          }
        } else {
          // 本地独有的徽章
          merged.badges.push(localBadge);
        }
      }
    }
    
    return merged;
  }

  // 用户统计数据合并
  private mergeUserStatsData(localData: any, cloudData: any): any {
    if (!localData || !cloudData) return localData || cloudData;
    
    const merged = { ...cloudData };
    
    // 统计数据取最大值
    if (localData.totalWords && cloudData.totalWords) {
      merged.totalWords = Math.max(localData.totalWords, cloudData.totalWords);
    }
    
    if (localData.masteredWords && cloudData.masteredWords) {
      merged.masteredWords = Math.max(localData.masteredWords, cloudData.masteredWords);
    }
    
    if (localData.totalReviews && cloudData.totalReviews) {
      merged.totalReviews = Math.max(localData.totalReviews, cloudData.totalReviews);
    }
    
    // 准确率取平均值
    if (localData.accuracy && cloudData.accuracy) {
      merged.accuracy = (localData.accuracy + cloudData.accuracy) / 2;
    }
    
    return merged;
  }

  // 深度合并
  private deepMerge(localData: any, cloudData: any): any {
    if (!localData) return cloudData;
    if (!cloudData) return localData;
    
    const merged = { ...cloudData };
    
    for (const key in localData) {
      if (localData.hasOwnProperty(key)) {
        if (typeof localData[key] === 'object' && localData[key] !== null) {
          merged[key] = this.deepMerge(localData[key], cloudData[key] || {});
        } else if (!(key in cloudData)) {
          merged[key] = localData[key];
        }
      }
    }
    
    return merged;
  }

  // 获取数据版本
  private getDataVersion(data: any): DataVersion | null {
    if (!data || !data.version) return null;
    
    return {
      version: data.version,
      timestamp: data.timestamp || data.lastModified || Date.now(),
      checksum: data.checksum || '',
      changeType: data.changeType || 'update',
      metadata: data.metadata || {}
    };
  }

  // 获取删除的项目
  private getDeletedItems(data: any): string[] {
    if (!data || !data.deletedItems) return [];
    return data.deletedItems;
  }

  // 获取存在的项目
  private getExistingItems(data: any): string[] {
    if (!data || !data.existingItems) return [];
    return data.existingItems;
  }

  // 获取新增的项目
  private getNewItems(data: any): any[] {
    if (!data || !data.newItems) return [];
    return data.newItems;
  }

  // 判断是否为潜在冲突
  private isPotentialConflict(localItem: any, cloudItem: any, dataType: string): boolean {
    // 根据数据类型判断潜在冲突
    switch (dataType) {
      case 'vocabulary':
        return localItem.word === cloudItem.word;
      case 'shows':
        return localItem.title === cloudItem.title;
      case 'learningRecords':
        return localItem.wordId === cloudItem.wordId;
      default:
        return false;
    }
  }

  // 按类型分组冲突
  private groupConflictsByType(conflicts: DataConflict[]): Record<string, DataConflict[]> {
    const grouped: Record<string, DataConflict[]> = {};
    
    for (const conflict of conflicts) {
      if (!grouped[conflict.dataType]) {
        grouped[conflict.dataType] = [];
      }
      grouped[conflict.dataType].push(conflict);
    }
    
    return grouped;
  }

  // 获取基准数据
  private async getBaseData(dataType: string): Promise<any> {
    try {
      const baseData = await AsyncStorage.getItem(dataType);
      return baseData ? JSON.parse(baseData) : null;
    } catch (error) {
      console.error(`❌ 获取基准数据失败:`, error);
      return null;
    }
  }

  // 检查是否正在解决冲突
  public isCurrentlyResolving(): boolean {
    return this.isResolving;
  }

  // 获取当前冲突
  public getCurrentConflicts(): DataConflict[] {
    return [...this.currentConflicts];
  }

  // 清除当前冲突
  public clearCurrentConflicts(): void {
    this.currentConflicts = [];
  }

  // 获取冲突统计
  public getConflictStats(): { total: number; byType: Record<string, number>; byResolution: Record<string, number> } {
    const byType: Record<string, number> = {};
    const byResolution: Record<string, number> = {};
    
    for (const conflict of this.currentConflicts) {
      // 按类型统计
      byType[conflict.dataType] = (byType[conflict.dataType] || 0) + 1;
      
      // 按解决方式统计
      byResolution[conflict.resolution] = (byResolution[conflict.resolution] || 0) + 1;
    }
    
    return {
      total: this.currentConflicts.length,
      byType,
      byResolution
    };
  }

  // 检测词汇内容冲突
  private detectVocabularyContentConflicts(localData: any, cloudData: any): DataConflict[] {
    const conflicts: DataConflict[] = [];
    
    if (!localData?.vocabulary || !cloudData?.vocabulary) return conflicts;
    
    const localVocab = new Map(localData.vocabulary.map((item: any) => [item.word, item]));
    const cloudVocab = new Map(cloudData.vocabulary.map((item: any) => [item.word, item]));
    
    for (const [word, localItem] of localVocab) {
      if (cloudVocab.has(word)) {
        const cloudItem = cloudVocab.get(word);
        if ((localItem as any).lastModified !== (cloudItem as any).lastModified) {
          conflicts.push({
            id: `vocabulary_content_${Date.now()}`,
            dataType: 'vocabulary',
            conflictType: 'content',
            localData: localItem,
            cloudData: cloudItem,
            localVersion: this.getDataVersion(localData)?.version || 0,
            cloudVersion: this.getDataVersion(cloudData)?.version || 0,
            lastModified: Math.max((localItem as any).lastModified, (cloudItem as any).lastModified),
            resolution: 'merge',
            confidence: 0.7,
            severity: this.calculateSeverity('content', 'vocabulary'),
            description: `词汇内容冲突: ${(localItem as any).word || 'unknown'}`,
            affectedFields: ['content']
          });
        }
      }
    }
    
    return conflicts;
  }

  // 检测剧单内容冲突
  private detectShowsContentConflicts(localData: any, cloudData: any): DataConflict[] {
    const conflicts: DataConflict[] = [];
    
    if (!localData?.shows || !cloudData?.shows) return conflicts;
    
    const localShows = new Map(localData.shows.map((item: any) => [item.id, item]));
    const cloudShows = new Map(cloudData.shows.map((item: any) => [item.id, item]));
    
    for (const [id, localShow] of localShows) {
      if (cloudShows.has(id)) {
        const cloudShow = cloudShows.get(id);
        if ((localShow as any).lastModified !== (cloudShow as any).lastModified) {
          conflicts.push({
            id: `shows_content_${Date.now()}`,
            dataType: 'shows',
            conflictType: 'content',
            localData: localShow,
            cloudData: cloudShow,
            localVersion: this.getDataVersion(localData)?.version || 0,
            cloudVersion: this.getDataVersion(cloudData)?.version || 0,
            lastModified: Math.max((localShow as any).lastModified, (cloudShow as any).lastModified),
            resolution: 'merge',
            confidence: 0.7,
            severity: this.calculateSeverity('content', 'shows'),
            description: `剧集内容冲突: ${(localShow as any).title || 'unknown'}`,
            affectedFields: ['content']
          });
        }
      }
    }
    
    return conflicts;
  }

  // 检测学习记录内容冲突
  private detectLearningRecordsContentConflicts(localData: any, cloudData: any): DataConflict[] {
    const conflicts: DataConflict[] = [];
    
    if (!localData?.records || !cloudData?.records) return conflicts;
    
    const localRecords = new Map(localData.records.map((item: any) => [item.id, item]));
    const cloudRecords = new Map(cloudData.records.map((item: any) => [item.id, item]));
    
    for (const [id, localRecord] of localRecords) {
      if (cloudRecords.has(id)) {
        const cloudRecord = cloudRecords.get(id);
        if ((localRecord as any).lastModified !== (cloudRecord as any).lastModified) {
          conflicts.push({
            id: `learningRecords_content_${Date.now()}`,
            dataType: 'learningRecords',
            conflictType: 'content',
            localData: localRecord,
            cloudData: cloudRecord,
            localVersion: this.getDataVersion(localData)?.version || 0,
            cloudVersion: this.getDataVersion(cloudData)?.version || 0,
            lastModified: Math.max((localRecord as any).lastModified, (cloudRecord as any).lastModified),
            resolution: 'merge',
            confidence: 0.7,
            severity: this.calculateSeverity('content', 'learningRecords'),
            description: `学习记录内容冲突: ${(localRecord as any).word || 'unknown'}`,
            affectedFields: ['content']
          });
        }
      }
    }
    
    return conflicts;
  }

  // 检测经验值内容冲突
  private detectExperienceContentConflicts(localData: any, cloudData: any): DataConflict[] {
    const conflicts: DataConflict[] = [];
    
    if (!localData || !cloudData) return conflicts;
    
    const localExp = localData.experience || 0;
    const cloudExp = cloudData.experience || 0;
    
    if (localExp !== cloudExp) {
      conflicts.push({
        id: `experience_content_${Date.now()}`,
        dataType: 'experience',
        conflictType: 'content',
        localData: { experience: localExp },
        cloudData: { experience: cloudExp },
        localVersion: this.getDataVersion(localData)?.version || 0,
        cloudVersion: this.getDataVersion(cloudData)?.version || 0,
        lastModified: Date.now(),
        resolution: 'merge',
        confidence: 0.8,
        severity: this.calculateSeverity('content', 'experience'),
        description: `经验值冲突: 本地 ${localExp} vs 云端 ${cloudExp}`,
        affectedFields: ['experience']
      });
    }
    
    return conflicts;
  }

  // 检测徽章内容冲突
  private detectBadgesContentConflicts(localData: any, cloudData: any): DataConflict[] {
    const conflicts: DataConflict[] = [];
    
    if (!localData?.badges || !cloudData?.badges) return conflicts;
    
    const localBadges = new Map(localData.badges.map((item: any) => [item.id, item]));
    const cloudBadges = new Map(cloudData.badges.map((item: any) => [item.id, item]));
    
    for (const [id, localBadge] of localBadges) {
      if (cloudBadges.has(id)) {
        const cloudBadge = cloudBadges.get(id);
        if ((localBadge as any).unlockedAt !== (cloudBadge as any).unlockedAt) {
          conflicts.push({
            id: `badges_content_${Date.now()}`,
            dataType: 'badges',
            conflictType: 'content',
            localData: localBadge,
            cloudData: cloudBadge,
            localVersion: this.getDataVersion(localData)?.version || 0,
            cloudVersion: this.getDataVersion(cloudData)?.version || 0,
            lastModified: Math.max((localBadge as any).unlockedAt, (cloudBadge as any).unlockedAt),
            resolution: 'merge',
            confidence: 0.7,
            severity: this.calculateSeverity('content', 'badges'),
            description: `徽章内容冲突: ${(localBadge as any).name || 'unknown'}`,
            affectedFields: ['unlockedAt']
          });
        }
      }
    }
    
    return conflicts;
  }

  // 检测用户统计内容冲突
  private detectUserStatsContentConflicts(localData: any, cloudData: any): DataConflict[] {
    const conflicts: DataConflict[] = [];
    
    if (!localData || !cloudData) return conflicts;
    
    const stats = ['totalWords', 'masteredWords', 'learningDays', 'totalReviews', 'accuracy'];
    
    for (const stat of stats) {
      const localValue = localData[stat] || 0;
      const cloudValue = cloudData[stat] || 0;
      
      if (localValue !== cloudValue) {
        conflicts.push({
          id: `userStats_content_${stat}_${Date.now()}`,
          dataType: 'userStats',
          conflictType: 'content',
          localData: { [stat]: localValue },
          cloudData: { [stat]: cloudValue },
          localVersion: this.getDataVersion(localData)?.version || 0,
          cloudVersion: this.getDataVersion(cloudData)?.version || 0,
          lastModified: Date.now(),
          resolution: 'merge',
          confidence: 0.8,
          severity: this.calculateSeverity('content', 'userStats'),
          description: `用户统计冲突: ${stat} 本地 ${localValue} vs 云端 ${cloudValue}`,
          affectedFields: [stat]
        });
      }
    }
    
    return conflicts;
  }

  // ==================== 用户界面相关方法 ====================

  // 显示冲突解决界面
  public async showConflictResolutionModal(
    conflicts: DataConflict[]
  ): Promise<ConflictResolutionResult> {
    return new Promise((resolve) => {
      if (conflicts.length === 0) {
        resolve({
          success: true,
          resolvedData: null,
          conflicts: [],
          mergedCount: 0,
          resolvedCount: 0,
          manualCount: 0,
          errors: [],
          resolvedConflicts: [],
          unresolvedConflicts: [],
          backupCreated: false
        });
        return;
      }
      
      // 创建备份
      this.createBackup(conflicts).then(backupId => {
        // 显示冲突解决界面
        this.showConflictResolutionUI(conflicts, backupId, resolve);
      });
    });
  }

  // 显示冲突解决UI
  private showConflictResolutionUI(
    conflicts: DataConflict[],
    backupId: string,
    resolve: (result: ConflictResolutionResult) => void
  ): void {
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
    const highConflicts = conflicts.filter(c => c.severity === 'high');
    const otherConflicts = conflicts.filter(c => c.severity === 'medium' || c.severity === 'low');
    
    let message = `检测到 ${conflicts.length} 个数据冲突：\n\n`;
    
    if (criticalConflicts.length > 0) {
      message += `🔴 关键冲突: ${criticalConflicts.length} 个\n`;
    }
    if (highConflicts.length > 0) {
      message += `🟡 重要冲突: ${highConflicts.length} 个\n`;
    }
    if (otherConflicts.length > 0) {
      message += `🟢 一般冲突: ${otherConflicts.length} 个\n`;
    }
    
    message += `\n已创建备份 (ID: ${backupId})\n\n`;
    message += '请选择处理方式：';
    
    Alert.alert(
      '数据冲突检测',
      message,
      [
        {
          text: '自动解决',
          onPress: () => this.autoResolveConflicts(conflicts, resolve)
        },
        {
          text: '手动处理',
          onPress: () => this.manualResolveConflicts(conflicts, resolve)
        },
        {
          text: '稍后处理',
          onPress: () => resolve({
            success: false,
            resolvedData: null,
            conflicts,
            mergedCount: 0,
            resolvedCount: 0,
            manualCount: 0,
            errors: [],
            resolvedConflicts: [],
            unresolvedConflicts: conflicts.map(c => c.id),
            backupCreated: true,
            backupId
          })
        }
      ],
      { cancelable: false }
    );
  }

  // 自动解决冲突
  private async autoResolveConflicts(
    conflicts: DataConflict[],
    resolve: (result: ConflictResolutionResult) => void
  ): Promise<void> {
    const resolvedConflicts: ConflictResolutionResult['resolvedConflicts'] = [];
    const unresolvedConflicts: string[] = [];
    
    for (const conflict of conflicts) {
      try {
        const suggestions = this.generateResolutionSuggestions(conflict);
        const bestSuggestion = suggestions[0]; // 选择最佳建议
        
        let finalData: any;
        let resolution: 'local' | 'cloud' | 'merged' | 'manual';
        
        switch (bestSuggestion.action) {
          case 'keep_local':
            finalData = conflict.localData;
            resolution = 'local';
            break;
          case 'keep_cloud':
            finalData = conflict.cloudData;
            resolution = 'cloud';
            break;
          case 'merge':
            finalData = bestSuggestion.preview;
            resolution = 'merged';
            break;
          default:
            unresolvedConflicts.push(conflict.id);
            continue;
        }
        
        resolvedConflicts.push({
          conflictId: conflict.id,
          resolution,
          finalData
        });
        
      } catch (error) {
        console.error(`自动解决冲突失败: ${conflict.id}`, error);
        unresolvedConflicts.push(conflict.id);
      }
    }
    
    resolve({
      success: unresolvedConflicts.length === 0,
      resolvedData: null,
      conflicts,
      mergedCount: resolvedConflicts.filter(r => r.resolution === 'merged').length,
      resolvedCount: resolvedConflicts.length,
      manualCount: unresolvedConflicts.length,
      errors: [],
      resolvedConflicts,
      unresolvedConflicts,
      backupCreated: true
    });
  }

  // 手动解决冲突
  private async manualResolveConflicts(
    conflicts: DataConflict[],
    resolve: (result: ConflictResolutionResult) => void
  ): Promise<void> {
    // 这里应该显示详细的手动解决界面
    // 暂时返回未解决状态
    resolve({
      success: false,
      resolvedData: null,
      conflicts,
      mergedCount: 0,
      resolvedCount: 0,
      manualCount: conflicts.length,
      errors: [],
      resolvedConflicts: [],
      unresolvedConflicts: conflicts.map(c => c.id),
      backupCreated: true
    });
  }

  // 生成解决建议
  public generateResolutionSuggestions(conflict: DataConflict): ResolutionSuggestion[] {
    const suggestions: ResolutionSuggestion[] = [];
    
    // 基于时间戳的建议
    if (conflict.localData?.lastModified && conflict.cloudData?.lastModified) {
      if (conflict.localData.lastModified > conflict.cloudData.lastModified) {
        suggestions.push({
          action: 'keep_local',
          confidence: 0.8,
          reason: '本地数据更新',
          preview: conflict.localData
        });
      } else {
        suggestions.push({
          action: 'keep_cloud',
          confidence: 0.8,
          reason: '云端数据更新',
          preview: conflict.cloudData
        });
      }
    }
    
    // 基于数据完整性的建议
    if (conflict.conflictType === 'deletion') {
      suggestions.push({
        action: 'keep_local',
        confidence: 0.9,
        reason: '保留本地数据，避免数据丢失',
        preview: conflict.localData
      });
    } else if (conflict.conflictType === 'addition') {
      suggestions.push({
        action: 'keep_cloud',
        confidence: 0.9,
        reason: '添加云端新数据',
        preview: conflict.cloudData
      });
    }
    
    // 基于数据重要性的建议
    if (conflict.severity === 'critical') {
      suggestions.push({
        action: 'manual',
        confidence: 0.7,
        reason: '关键数据冲突，建议手动处理',
        preview: { local: conflict.localData, cloud: conflict.cloudData }
      });
    }
    
    // 智能合并建议
    if (conflict.conflictType === 'content' && this.canMerge(conflict.localData, conflict.cloudData)) {
      suggestions.push({
        action: 'merge',
        confidence: 0.6,
        reason: '可以智能合并数据',
        preview: this.mergeData(conflict.localData, conflict.cloudData)
      });
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // 检查是否可以合并
  private canMerge(data1: any, data2: any): boolean {
    if (!data1 || !data2) return false;
    
    // 简单合并规则：如果数据类型相同且结构相似
    if (typeof data1 === typeof data2) {
      if (Array.isArray(data1) && Array.isArray(data2)) {
        return true; // 数组可以合并
      } else if (typeof data1 === 'object') {
        return true; // 对象可以合并
      }
    }
    
    return false;
  }

  // 合并数据
  private mergeData(data1: any, data2: any): any {
    if (Array.isArray(data1) && Array.isArray(data2)) {
      // 数组合并：去重并保留最新版本
      const merged = [...data1];
      const existingIds = new Set(data1.map((item: any) => item.id || item.word));
      
      for (const item of data2) {
        const id = item.id || item.word;
        if (!existingIds.has(id)) {
          merged.push(item);
        } else {
          // 替换为更新版本
          const index = merged.findIndex((existing: any) => (existing.id || existing.word) === id);
          if (index >= 0 && (item.lastModified || 0) > (merged[index].lastModified || 0)) {
            merged[index] = item;
          }
        }
      }
      
      return merged;
    } else if (typeof data1 === 'object' && typeof data2 === 'object') {
      // 对象合并：保留最新值
      return {
        ...data1,
        ...data2,
        lastModified: Math.max(data1.lastModified || 0, data2.lastModified || 0),
        version: Math.max(data1.version || 1, data2.version || 1) + 1
      };
    }
    
    return data2; // 默认返回云端数据
  }

  // 创建备份
  private async createBackup(conflicts: DataConflict[]): Promise<string> {
    const backupId = `conflict_backup_${Date.now()}`;
    
    try {
      const backupData: DataBackup = {
        id: backupId,
        dataType: 'conflict_resolution',
        data: {
          conflicts: conflicts.map(c => ({
            id: c.id,
            dataType: c.dataType,
            localData: c.localData,
            cloudData: c.cloudData,
            conflictType: c.conflictType,
            severity: c.severity
          })),
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        version: 1,
        size: JSON.stringify(conflicts).length
      };
      
      await AsyncStorage.setItem(`backup_${backupId}`, JSON.stringify(backupData));
      
      // 保存备份索引
      const backupIndex = await this.getBackupIndex();
      backupIndex.push(backupId);
      await AsyncStorage.setItem('backup_index', JSON.stringify(backupIndex));
      
      console.log(`📦 冲突备份已创建: ${backupId}`);
      
      return backupId;
      
    } catch (error) {
      console.error('创建备份失败:', error);
      return backupId;
    }
  }

  // 获取备份索引
  private async getBackupIndex(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem('backup_index');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  // 恢复备份
  public async restoreFromBackup(backupId: string): Promise<{
    success: boolean;
    data?: any;
    message: string;
  }> {
    try {
      const backupData = await AsyncStorage.getItem(`backup_${backupId}`);
      if (!backupData) {
        return {
          success: false,
          message: '备份不存在'
        };
      }
      
      const backup: DataBackup = JSON.parse(backupData);
      
      return {
        success: true,
        data: backup.data,
        message: '备份恢复成功'
      };
      
    } catch (error) {
      return {
        success: false,
        message: '备份恢复失败'
      };
    }
  }

  // 清理旧备份
  public async cleanupOldBackups(): Promise<void> {
    try {
      const backupIndex = await this.getBackupIndex();
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      
      const backupsToKeep: string[] = [];
      
      for (const backupId of backupIndex) {
        try {
          const backupData = await AsyncStorage.getItem(`backup_${backupId}`);
          if (backupData) {
            const backup: DataBackup = JSON.parse(backupData);
            if (backup.timestamp > oneWeekAgo) {
              backupsToKeep.push(backupId);
            } else {
              await AsyncStorage.removeItem(`backup_${backupId}`);
            }
          }
        } catch (error) {
          console.error(`清理备份失败: ${backupId}`, error);
        }
      }
      
      await AsyncStorage.setItem('backup_index', JSON.stringify(backupsToKeep));
      console.log(`🧹 备份清理完成，保留 ${backupsToKeep.length} 个备份`);
      
    } catch (error) {
      console.error('清理旧备份失败:', error);
    }
  }

  // 计算冲突严重程度
  private calculateSeverity(conflictType: string, dataType: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, Record<string, string>> = {
      'vocabulary': {
        'version': 'medium',
        'content': 'high',
        'deletion': 'high',
        'addition': 'medium'
      },
      'learningRecords': {
        'version': 'high',
        'content': 'critical',
        'deletion': 'critical',
        'addition': 'high'
      },
      'userStats': {
        'version': 'medium',
        'content': 'high',
        'deletion': 'high',
        'addition': 'medium'
      },
      'shows': {
        'version': 'low',
        'content': 'medium',
        'deletion': 'medium',
        'addition': 'low'
      },
      'experience': {
        'version': 'high',
        'content': 'critical',
        'deletion': 'critical',
        'addition': 'high'
      }
    };
    
    return (severityMap[dataType]?.[conflictType] as any) || 'medium';
  }
}
