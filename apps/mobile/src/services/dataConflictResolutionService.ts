import AsyncStorage from '@react-native-async-storage/async-storage';
import { unifiedSyncService } from './unifiedSyncService';

export interface DataConflict {
  dataType: 'vocabulary' | 'shows' | 'learningRecords' | 'experience' | 'badges' | 'userStats';
  conflictType: 'version' | 'content' | 'deletion' | 'addition';
  localData: any;
  cloudData: any;
  localVersion: number;
  cloudVersion: number;
  lastModified: number;
  resolution: 'local' | 'cloud' | 'merge' | 'manual';
  confidence: number;
}

export interface ConflictResolutionResult {
  success: boolean;
  resolvedData: any;
  conflicts: DataConflict[];
  mergedCount: number;
  resolvedCount: number;
  manualCount: number;
  errors: string[];
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
        dataType: dataType as any,
        conflictType: 'version',
        localData,
        cloudData,
        localVersion: localVersion.version,
        cloudVersion: cloudVersion.version,
        lastModified: Math.max(localVersion.timestamp, cloudVersion.timestamp),
        resolution: 'merge',
        confidence: 0.8
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
          dataType: dataType as any,
          conflictType: 'deletion',
          localData: { action: 'delete', item: deletedItem },
          cloudData: { action: 'keep', item: deletedItem },
          localVersion: this.getDataVersion(localData)?.version || 0,
          cloudVersion: this.getDataVersion(cloudData)?.version || 0,
          lastModified: Date.now(),
          resolution: 'manual',
          confidence: 0.6
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
            dataType: dataType as any,
            conflictType: 'addition',
            localData: localItem,
            cloudData: cloudItem,
            localVersion: this.getDataVersion(localData)?.version || 0,
            cloudVersion: this.getDataVersion(cloudData)?.version || 0,
            lastModified: Date.now(),
            resolution: 'manual',
            confidence: 0.7
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
        errors: []
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
            return this.mergeData(localData, cloudData, dataType);
          }
          
        case 'content':
          // 内容冲突：尝试智能合并
          return this.mergeData(localData, cloudData, dataType);
          
        case 'deletion':
          // 删除冲突：保留云端数据（更安全）
          return { success: true, data: cloudData, type: 'resolve' };
          
        case 'addition':
          // 新增冲突：尝试合并，避免ID冲突
          return this.mergeData(localData, cloudData, dataType);
          
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
  private mergeData(localData: any, cloudData: any, dataType: string): { success: boolean; data: any; type: string } {
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
            dataType: 'vocabulary',
            conflictType: 'content',
            localData: localItem,
            cloudData: cloudItem,
            localVersion: this.getDataVersion(localData)?.version || 0,
            cloudVersion: this.getDataVersion(cloudData)?.version || 0,
            lastModified: Math.max((localItem as any).lastModified, (cloudItem as any).lastModified),
            resolution: 'merge',
            confidence: 0.7
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
            dataType: 'shows',
            conflictType: 'content',
            localData: localShow,
            cloudData: cloudShow,
            localVersion: this.getDataVersion(localData)?.version || 0,
            cloudVersion: this.getDataVersion(cloudData)?.version || 0,
            lastModified: Math.max((localShow as any).lastModified, (cloudShow as any).lastModified),
            resolution: 'merge',
            confidence: 0.7
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
            dataType: 'learningRecords',
            conflictType: 'content',
            localData: localRecord,
            cloudData: cloudRecord,
            localVersion: this.getDataVersion(localData)?.version || 0,
            cloudVersion: this.getDataVersion(cloudData)?.version || 0,
            lastModified: Math.max((localRecord as any).lastModified, (cloudRecord as any).lastModified),
            resolution: 'merge',
            confidence: 0.7
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
        dataType: 'experience',
        conflictType: 'content',
        localData: { experience: localExp },
        cloudData: { experience: cloudExp },
        localVersion: this.getDataVersion(localData)?.version || 0,
        cloudVersion: this.getDataVersion(cloudData)?.version || 0,
        lastModified: Date.now(),
        resolution: 'merge',
        confidence: 0.8
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
            dataType: 'badges',
            conflictType: 'content',
            localData: localBadge,
            cloudData: cloudBadge,
            localVersion: this.getDataVersion(localData)?.version || 0,
            cloudVersion: this.getDataVersion(cloudData)?.version || 0,
            lastModified: Math.max((localBadge as any).unlockedAt, (cloudBadge as any).unlockedAt),
            resolution: 'merge',
            confidence: 0.7
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
          dataType: 'userStats',
          conflictType: 'content',
          localData: { [stat]: localValue },
          cloudData: { [stat]: cloudValue },
          localVersion: this.getDataVersion(localData)?.version || 0,
          cloudVersion: this.getDataVersion(cloudData)?.version || 0,
          lastModified: Date.now(),
          resolution: 'merge',
          confidence: 0.8
        });
      }
    }
    
    return conflicts;
  }
}
