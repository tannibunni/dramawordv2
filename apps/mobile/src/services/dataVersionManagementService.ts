import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataVersion } from './dataConflictResolutionService';

export interface VersionedData {
  version: number;
  timestamp: number;
  checksum: string;
  data: any;
  metadata: {
    deviceId: string;
    userId: string;
    dataSize: number;
    changeType: 'create' | 'update' | 'delete';
    parentVersion?: number;
    mergeHistory?: number[];
  };
}

export interface VersionComparisonResult {
  localVersion: DataVersion | null;
  cloudVersion: DataVersion | null;
  relationship: 'same' | 'local_newer' | 'cloud_newer' | 'divergent' | 'unrelated';
  confidence: number;
  recommendedAction: 'keep_local' | 'keep_cloud' | 'merge' | 'manual_review';
  mergeComplexity: 'simple' | 'moderate' | 'complex';
}

export interface IncrementalSyncData {
  dataType: string;
  changes: {
    added: any[];
    updated: any[];
    deleted: string[];
    unchanged: any[];
  };
  syncSize: number;
  estimatedTime: number;
}

export class DataVersionManagementService {
  private static instance: DataVersionManagementService;
  private versionCache: Map<string, VersionedData> = new Map();
  private isProcessing: boolean = false;

  public static getInstance(): DataVersionManagementService {
    if (!DataVersionManagementService.instance) {
      DataVersionManagementService.instance = new DataVersionManagementService();
    }
    return DataVersionManagementService.instance;
  }

  private constructor() {}

  // 创建新版本数据
  public async createVersionedData(
    dataType: string,
    data: any,
    userId: string,
    deviceId: string,
    changeType: 'create' | 'update' | 'delete' = 'update',
    parentVersion?: number
  ): Promise<VersionedData> {
    try {
      console.log(`📝 为${dataType}创建新版本数据...`);
      
      // 获取当前版本
      const currentVersion = await this.getCurrentVersion(dataType);
      const newVersion = (currentVersion?.version || 0) + 1;
      
      // 计算数据校验和
      const checksum = this.calculateChecksum(data);
      
      // 计算数据大小
      const dataSize = this.calculateDataSize(data);
      
      // 创建版本化数据
      const versionedData: VersionedData = {
        version: newVersion,
        timestamp: Date.now(),
        checksum,
        data,
        metadata: {
          deviceId,
          userId,
          dataSize,
          changeType,
          parentVersion: parentVersion || currentVersion?.version,
          mergeHistory: parentVersion ? [parentVersion] : []
        }
      };
      
      // 保存到本地存储
      await this.saveVersionedData(dataType, versionedData);
      
      // 更新缓存
      this.versionCache.set(dataType, versionedData);
      
      console.log(`✅ ${dataType}新版本${newVersion}创建成功`);
      
      return versionedData;
      
    } catch (error) {
      console.error(`❌ 创建版本化数据失败:`, error);
      throw error;
    }
  }

  // 比较版本
  public async compareVersions(
    dataType: string,
    localData: any,
    cloudData: any
  ): Promise<VersionComparisonResult> {
    try {
      console.log(`🔍 比较${dataType}版本...`);
      
      // 获取本地和云端版本信息
      const localVersion = this.extractVersionInfo(localData);
      const cloudVersion = this.extractVersionInfo(cloudData);
      
      if (!localVersion && !cloudVersion) {
        return {
          localVersion: null,
          cloudVersion: null,
          relationship: 'unrelated',
          confidence: 0,
          recommendedAction: 'manual_review',
          mergeComplexity: 'complex'
        };
      }
      
      if (!localVersion) {
        return {
          localVersion: null,
          cloudVersion: cloudVersion,
          relationship: 'cloud_newer',
          confidence: 0.9,
          recommendedAction: 'keep_cloud',
          mergeComplexity: 'simple'
        };
      }
      
      if (!cloudVersion) {
        return {
          localVersion: localVersion,
          cloudVersion: null,
          relationship: 'local_newer',
          confidence: 0.9,
          recommendedAction: 'keep_local',
          mergeComplexity: 'simple'
        };
      }
      
      // 分析版本关系
      const relationship = this.analyzeVersionRelationship(localVersion, cloudVersion);
      const confidence = this.calculateConfidence(localVersion, cloudVersion, relationship);
      const recommendedAction = this.getRecommendedAction(relationship, confidence);
      const mergeComplexity = this.assessMergeComplexity(localVersion, cloudVersion, relationship);
      
      const result: VersionComparisonResult = {
        localVersion,
        cloudVersion,
        relationship,
        confidence,
        recommendedAction,
        mergeComplexity
      };
      
      console.log(`✅ 版本比较完成: ${relationship}, 置信度: ${confidence}, 建议: ${recommendedAction}`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ 版本比较失败:`, error);
      throw error;
    }
  }

  // 分析版本关系
  private analyzeVersionRelationship(localVersion: DataVersion, cloudVersion: DataVersion): 'same' | 'local_newer' | 'cloud_newer' | 'divergent' | 'unrelated' {
    // 检查是否为相同版本
    if (localVersion.version === cloudVersion.version && localVersion.checksum === cloudVersion.checksum) {
      return 'same';
    }
    
    // 检查是否为父子关系
    if (localVersion.version === cloudVersion.version + 1 || cloudVersion.version === localVersion.version + 1) {
      // 检查时间戳，确定哪个更新
      if (localVersion.timestamp > cloudVersion.timestamp) {
        return 'local_newer';
      } else {
        return 'cloud_newer';
      }
    }
    
    // 检查是否为分支版本
    if (localVersion.version !== cloudVersion.version) {
      // 检查是否有共同祖先
      if (this.hasCommonAncestor(localVersion, cloudVersion)) {
        return 'divergent';
      }
    }
    
    return 'unrelated';
  }

  // 检查是否有共同祖先
  private hasCommonAncestor(localVersion: DataVersion, cloudVersion: DataVersion): boolean {
    // 这里可以实现更复杂的祖先检测逻辑
    // 目前简化处理：检查时间戳差异
    const timeDiff = Math.abs(localVersion.timestamp - cloudVersion.timestamp);
    const maxReasonableDiff = 24 * 60 * 60 * 1000; // 24小时
    
    return timeDiff < maxReasonableDiff;
  }

  // 计算置信度
  private calculateConfidence(localVersion: DataVersion, cloudVersion: DataVersion, relationship: string): number {
    let confidence = 0.5; // 基础置信度
    
    switch (relationship) {
      case 'same':
        confidence = 1.0;
        break;
      case 'local_newer':
      case 'cloud_newer':
        confidence = 0.8;
        break;
      case 'divergent':
        confidence = 0.6;
        break;
      case 'unrelated':
        confidence = 0.3;
        break;
    }
    
    // 根据时间戳调整置信度
    const timeDiff = Math.abs(localVersion.timestamp - cloudVersion.timestamp);
    const timeConfidence = Math.max(0, 1 - (timeDiff / (7 * 24 * 60 * 60 * 1000))); // 7天内
    
    confidence = (confidence + timeConfidence) / 2;
    
    return Math.round(confidence * 100) / 100;
  }

  // 获取建议操作
  private getRecommendedAction(relationship: string, confidence: number): 'keep_local' | 'keep_cloud' | 'merge' | 'manual_review' {
    if (confidence < 0.5) {
      return 'manual_review';
    }
    
    switch (relationship) {
      case 'same':
        return 'keep_local'; // 任意选择
      case 'local_newer':
        return 'keep_local';
      case 'cloud_newer':
        return 'keep_cloud';
      case 'divergent':
        return confidence > 0.7 ? 'merge' : 'manual_review';
      case 'unrelated':
        return 'manual_review';
      default:
        return 'manual_review';
    }
  }

  // 评估合并复杂度
  private assessMergeComplexity(localVersion: DataVersion, cloudVersion: DataVersion, relationship: string): 'simple' | 'moderate' | 'complex' {
    switch (relationship) {
      case 'same':
        return 'simple';
      case 'local_newer':
      case 'cloud_newer':
        return 'simple';
      case 'divergent':
        // 检查数据大小差异
        const sizeDiff = Math.abs(localVersion.metadata.dataSize - cloudVersion.metadata.dataSize);
        const sizeRatio = sizeDiff / Math.max(localVersion.metadata.dataSize, cloudVersion.metadata.dataSize);
        
        if (sizeRatio < 0.1) return 'simple';
        if (sizeRatio < 0.3) return 'moderate';
        return 'complex';
      case 'unrelated':
        return 'complex';
      default:
        return 'complex';
    }
  }

  // 生成增量同步数据
  public async generateIncrementalSyncData(
    dataType: string,
    localData: any,
    cloudData: any
  ): Promise<IncrementalSyncData> {
    try {
      console.log(`📊 生成${dataType}增量同步数据...`);
      
      const changes = {
        added: [],
        updated: [],
        deleted: [],
        unchanged: []
      };
      
      // 根据数据类型生成增量数据
      switch (dataType) {
        case 'vocabulary':
          this.generateVocabularyIncremental(localData, cloudData, changes);
          break;
        case 'shows':
          this.generateShowsIncremental(localData, cloudData, changes);
          break;
        case 'learningRecords':
          this.generateLearningRecordsIncremental(localData, cloudData, changes);
          break;
        case 'experience':
          this.generateExperienceIncremental(localData, cloudData, changes);
          break;
        case 'badges':
          this.generateBadgesIncremental(localData, cloudData, changes);
          break;
        case 'userStats':
          this.generateUserStatsIncremental(localData, cloudData, changes);
          break;
        default:
          this.generateGenericIncremental(localData, cloudData, changes);
      }
      
      // 计算同步大小
      const syncSize = this.calculateSyncSize(changes);
      
      // 估算同步时间
      const estimatedTime = this.estimateSyncTime(syncSize);
      
      const result: IncrementalSyncData = {
        dataType,
        changes,
        syncSize,
        estimatedTime
      };
      
      console.log(`✅ 增量同步数据生成完成: 新增${changes.added.length}项，更新${changes.updated.length}项，删除${changes.deleted.length}项`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ 生成增量同步数据失败:`, error);
      throw error;
    }
  }

  // 生成词汇增量数据
  private generateVocabularyIncremental(localData: any, cloudData: any, changes: any): void {
    if (!localData?.vocabulary || !cloudData?.vocabulary) return;
    
    const localVocab = new Map(localData.vocabulary.map((item: any) => [item.word, item]));
    const cloudVocab = new Map(cloudData.vocabulary.map((item: any) => [item.word, item]));
    
    for (const [word, localItem] of localVocab) {
      if (!cloudVocab.has(word)) {
        changes.added.push(localItem);
      } else {
        const cloudItem = cloudVocab.get(word);
        if ((localItem as any).lastModified > (cloudItem as any).lastModified) {
          changes.updated.push(localItem);
        } else {
          changes.unchanged.push(cloudItem);
        }
      }
    }
    
    // 检查云端删除的项
    for (const [word, cloudItem] of cloudVocab) {
      if (!localVocab.has(word)) {
        changes.deleted.push(word);
      }
    }
  }

  // 生成剧单增量数据
  private generateShowsIncremental(localData: any, cloudData: any, changes: any): void {
    if (!localData?.shows || !cloudData?.shows) return;
    
    const localShows = new Map(localData.shows.map((item: any) => [item.id, item]));
    const cloudShows = new Map(cloudData.shows.map((item: any) => [item.id, item]));
    
    for (const [id, localShow] of localShows) {
      if (!cloudShows.has(id)) {
        changes.added.push(localShow);
      } else {
        const cloudShow = cloudShows.get(id);
        if ((localShow as any).lastModified > (cloudShow as any).lastModified) {
          changes.updated.push(localShow);
        } else {
          changes.unchanged.push(cloudShow);
        }
      }
    }
    
    for (const [id, cloudShow] of cloudShows) {
      if (!localShows.has(id)) {
        changes.deleted.push(id);
      }
    }
  }

  // 生成学习记录增量数据
  private generateLearningRecordsIncremental(localData: any, cloudData: any, changes: any): void {
    if (!localData?.records || !cloudData?.records) return;
    
    const localRecords = new Map(localData.records.map((item: any) => [item.id, item]));
    const cloudRecords = new Map(cloudData.records.map((item: any) => [item.id, item]));
    
    for (const [id, localRecord] of localRecords) {
      if (!cloudRecords.has(id)) {
        changes.added.push(localRecord);
      } else {
        const cloudRecord = cloudRecords.get(id);
        if ((localRecord as any).lastModified > (cloudRecord as any).lastModified) {
          changes.updated.push(localRecord);
        } else {
          changes.unchanged.push(cloudRecord);
        }
      }
    }
    
    for (const [id, cloudRecord] of cloudRecords) {
      if (!localRecords.has(id)) {
        changes.deleted.push(id);
      }
    }
  }

  // 生成经验值增量数据
  private generateExperienceIncremental(localData: any, cloudData: any, changes: any): void {
    if (!localData || !cloudData) return;
    
    // 经验值数据通常是累积的，需要特殊处理
    const localExp = localData.experience || 0;
    const cloudExp = cloudData.experience || 0;
    
    if (localExp > cloudExp) {
      changes.updated.push({
        type: 'experience',
        value: localExp,
        difference: localExp - cloudExp
      });
    } else if (cloudExp > localExp) {
      changes.updated.push({
        type: 'experience',
        value: cloudExp,
        difference: cloudExp - localExp
      });
    } else {
      changes.unchanged.push({ type: 'experience', value: localExp });
    }
  }

  // 生成徽章增量数据
  private generateBadgesIncremental(localData: any, cloudData: any, changes: any): void {
    if (!localData?.badges || !cloudData?.badges) return;
    
    const localBadges = new Map(localData.badges.map((item: any) => [item.id, item]));
    const cloudBadges = new Map(cloudData.badges.map((item: any) => [item.id, item]));
    
    for (const [id, localBadge] of localBadges) {
      if (!cloudBadges.has(id)) {
        changes.added.push(localBadge);
      } else {
        const cloudBadge = cloudBadges.get(id);
        if ((localBadge as any).unlockedAt > (cloudBadge as any).unlockedAt) {
          changes.updated.push(localBadge);
        } else {
          changes.unchanged.push(cloudBadge);
        }
      }
    }
    
    for (const [id, cloudBadge] of cloudBadges) {
      if (!localBadges.has(id)) {
        changes.deleted.push(id);
      }
    }
  }

  // 生成用户统计增量数据
  private generateUserStatsIncremental(localData: any, cloudData: any, changes: any): void {
    if (!localData || !cloudData) return;
    
    const stats = ['totalWords', 'masteredWords', 'learningDays', 'totalReviews'];
    
    for (const stat of stats) {
      const localValue = localData[stat] || 0;
      const cloudValue = cloudData[stat] || 0;
      
      if (localValue > cloudValue) {
        changes.updated.push({
          type: stat,
          value: localValue,
          difference: localValue - cloudValue
        });
      } else if (cloudValue > localValue) {
        changes.updated.push({
          type: stat,
          value: cloudValue,
          difference: cloudValue - localValue
        });
      } else {
        changes.unchanged.push({ type: stat, value: localValue });
      }
    }
  }

  // 生成通用增量数据
  private generateGenericIncremental(localData: any, cloudData: any, changes: any): void {
    if (!localData || !cloudData) return;
    
    // 深度比较对象
    const differences = this.deepCompare(localData, cloudData);
    
    for (const [key, diff] of Object.entries(differences)) {
      if (diff.type === 'added') {
        changes.added.push({ key, value: diff.value });
      } else if (diff.type === 'updated') {
        changes.updated.push({ key, oldValue: diff.oldValue, newValue: diff.newValue });
      } else if (diff.type === 'deleted') {
        changes.deleted.push(key);
      }
    }
  }

  // 深度比较对象
  private deepCompare(obj1: any, obj2: any, path: string = ''): Record<string, any> {
    const differences: Record<string, any> = {};
    
    if (typeof obj1 !== typeof obj2) {
      differences[path] = {
        type: 'updated',
        oldValue: obj1,
        newValue: obj2
      };
      return differences;
    }
    
    if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
      if (obj1 !== obj2) {
        differences[path] = {
          type: 'updated',
          oldValue: obj1,
          newValue: obj2
        };
      }
      return differences;
    }
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    // 检查新增的键
    for (const key of keys2) {
      if (!keys1.includes(key)) {
        const fullPath = path ? `${path}.${key}` : key;
        differences[fullPath] = {
          type: 'added',
          value: obj2[key]
        };
      }
    }
    
    // 检查删除的键
    for (const key of keys1) {
      if (!keys2.includes(key)) {
        const fullPath = path ? `${path}.${key}` : key;
        differences[fullPath] = {
          type: 'deleted',
          value: obj1[key]
        };
      }
    }
    
    // 递归比较共同的键
    for (const key of keys1) {
      if (keys2.includes(key)) {
        const fullPath = path ? `${path}.${key}` : key;
        const nestedDiffs = this.deepCompare(obj1[key], obj2[key], fullPath);
        Object.assign(differences, nestedDiffs);
      }
    }
    
    return differences;
  }

  // 计算同步大小
  private calculateSyncSize(changes: any): number {
    let size = 0;
    
    // 计算新增和更新数据的大小
    for (const item of [...changes.added, ...changes.updated]) {
      size += this.calculateDataSize(item);
    }
    
    return size;
  }

  // 估算同步时间
  private estimateSyncTime(syncSize: number): number {
    // 基于数据大小估算同步时间（毫秒）
    // 假设平均网络速度：1MB/s
    const bytesPerSecond = 1024 * 1024; // 1MB/s
    const estimatedSeconds = syncSize / bytesPerSecond;
    
    return Math.max(1000, estimatedSeconds * 1000); // 最少1秒
  }

  // 计算数据大小
  private calculateDataSize(data: any): number {
    try {
      const jsonString = JSON.stringify(data);
      return new Blob([jsonString]).size;
    } catch (error) {
      // 如果JSON序列化失败，返回估算大小
      return this.estimateDataSize(data);
    }
  }

  // 估算数据大小
  private estimateDataSize(data: any): number {
    if (typeof data === 'string') {
      return data.length * 2; // UTF-16编码
    } else if (typeof data === 'number') {
      return 8; // 64位数字
    } else if (typeof data === 'boolean') {
      return 1;
    } else if (Array.isArray(data)) {
      return data.reduce((size, item) => size + this.estimateDataSize(item), 0);
    } else if (typeof data === 'object' && data !== null) {
      return Object.keys(data).reduce((size, key) => {
        return size + key.length * 2 + this.estimateDataSize(data[key]);
      }, 0);
    }
    return 0;
  }

  // 计算校验和
  private calculateChecksum(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      let hash = 0;
      
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
      }
      
      return hash.toString(16);
    } catch (error) {
      return Date.now().toString(16);
    }
  }

  // 提取版本信息
  private extractVersionInfo(data: any): DataVersion | null {
    if (!data || typeof data !== 'object') return null;
    
    return {
      version: data.version || 0,
      timestamp: data.timestamp || data.lastModified || Date.now(),
      checksum: data.checksum || '',
      changeType: data.changeType || 'update',
      metadata: {
        deviceId: data.deviceId || '',
        userId: data.userId || '',
        dataSize: this.calculateDataSize(data)
      }
    };
  }

  // 获取当前版本
  private async getCurrentVersion(dataType: string): Promise<VersionedData | null> {
    try {
      // 先检查缓存
      if (this.versionCache.has(dataType)) {
        return this.versionCache.get(dataType)!;
      }
      
      // 从本地存储获取
      const versionData = await AsyncStorage.getItem(`version_${dataType}`);
      if (versionData) {
        const parsed = JSON.parse(versionData);
        this.versionCache.set(dataType, parsed);
        return parsed;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ 获取当前版本失败:`, error);
      return null;
    }
  }

  // 保存版本化数据
  private async saveVersionedData(dataType: string, versionedData: VersionedData): Promise<void> {
    try {
      const key = `version_${dataType}`;
      await AsyncStorage.setItem(key, JSON.stringify(versionedData));
    } catch (error) {
      console.error(`❌ 保存版本化数据失败:`, error);
      throw error;
    }
  }

  // 检查是否正在处理
  public isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  // 获取版本历史
  public async getVersionHistory(dataType: string, limit: number = 10): Promise<VersionedData[]> {
    try {
      const history: VersionedData[] = [];
      
      // 这里可以实现更复杂的版本历史查询
      // 目前简化处理：只返回当前版本
      const currentVersion = await this.getCurrentVersion(dataType);
      if (currentVersion) {
        history.push(currentVersion);
      }
      
      return history.slice(0, limit);
    } catch (error) {
      console.error(`❌ 获取版本历史失败:`, error);
      return [];
    }
  }

  // 清理旧版本
  public async cleanupOldVersions(dataType: string, keepCount: number = 5): Promise<void> {
    try {
      console.log(`🧹 清理${dataType}旧版本，保留${keepCount}个...`);
      
      const history = await this.getVersionHistory(dataType, 100);
      
      if (history.length > keepCount) {
        // 按版本号排序，保留最新的
        history.sort((a, b) => b.version - a.version);
        const versionsToKeep = history.slice(0, keepCount);
        
        // 删除旧版本
        for (const version of history.slice(keepCount)) {
          await AsyncStorage.removeItem(`version_${dataType}_${version.version}`);
        }
        
        console.log(`✅ 清理完成，删除了${history.length - keepCount}个旧版本`);
      }
      
    } catch (error) {
      console.error(`❌ 清理旧版本失败:`, error);
    }
  }
}
