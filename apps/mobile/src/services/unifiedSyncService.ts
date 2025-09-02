import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL } from '../constants/config';
import { experienceManager } from '../screens/Review/services/experienceManager';
import { guestModeService } from './guestModeService';
import { tokenValidationService } from './tokenValidationService';

export interface SyncData {
  type: 'experience' | 'vocabulary' | 'progress' | 'achievements' | 'userStats' | 'learningRecords' | 'searchHistory' | 'userSettings' | 'badges' | 'wordbooks' | 'shows';
  data: any;
  timestamp: number;
  userId: string;
  appleId?: string;        // Apple ID用于跨设备同步
  deviceId?: string;       // 设备ID
  operation: 'create' | 'update' | 'delete';
  priority: 'high' | 'medium' | 'low';
  // 添加经验值相关字段以保持对齐
  xpGained?: number;
  leveledUp?: boolean;
  level?: number;
  syncVersion?: number;    // 同步版本号
}

export interface SyncConfig {
  wifiSyncInterval: number;
  mobileSyncInterval: number;
  offlineSyncInterval: number;
  maxRetryAttempts: number;
  batchSize: number;
  enableIncrementalSync: boolean;
  enableOfflineFirst: boolean;
  enableRealTimeSync: boolean;
  enableCrossDeviceSync: boolean;    // 启用跨设备同步
  crossDeviceSyncInterval: number;   // 跨设备同步间隔
  enableAppleIDSync: boolean;        // 启用Apple ID同步
}

export interface SyncStatus {
  queueLength: number;
  isSyncing: boolean;
  lastSyncTime: number;
  networkType: string;
  isUserActive: boolean;
  retryCount: number;
  syncMode: 'offline' | 'online';
  pendingOperations: number;
  syncProgress: number;
}

export interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
  conflicts?: any[];
  errors?: string[];
}

export class UnifiedSyncService {
  private static instance: UnifiedSyncService;
  private syncQueue: SyncData[] = [];
  private isSyncing: boolean = false;
  private syncTimer: number | null = null;
  private retryCount: number = 0;
  private lastSyncTime: number = 0;
  private isUserActive: boolean = false;
  private networkType: string = 'unknown';

  private pendingOperations: Set<string> = new Set();
  private syncProgress: number = 0;

  // 统一配置
  private config: SyncConfig = {
    wifiSyncInterval: 2 * 60 * 1000, // 2分钟
    mobileSyncInterval: 5 * 60 * 1000, // 5分钟
    offlineSyncInterval: 10 * 60 * 1000, // 10分钟
    maxRetryAttempts: 5,
    batchSize: 20,
    enableIncrementalSync: true,
    enableOfflineFirst: true,
    enableRealTimeSync: true,
    enableCrossDeviceSync: true,        // 启用跨设备同步
    crossDeviceSyncInterval: 30 * 1000, // 30秒
    enableAppleIDSync: true             // 启用Apple ID同步
  };

  private constructor() {
    this.initializeNetworkListener();
    this.initializeActivityListener();
    this.loadSyncQueue();
  }

  public static getInstance(): UnifiedSyncService {
    if (!UnifiedSyncService.instance) {
      UnifiedSyncService.instance = new UnifiedSyncService();
    }
    return UnifiedSyncService.instance;
  }

  // 初始化网络监听
  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = this.networkType === 'none';
      this.networkType = state.type;
      
      if (wasOffline && state.isConnected) {
        console.log('🌐 网络恢复，开始同步待同步数据');
        this.syncPendingData();
      }
      
      this.adjustSyncStrategy();
    });
  }

  // 初始化用户活跃度监听
  private initializeActivityListener() {
    const handleUserActivity = () => {
      this.isUserActive = true;
      this.resetActivityTimer();
      
      if (this.syncQueue.length > 0 && this.networkType !== 'none') {
        this.syncPendingData();
      }
    };

    // React Native环境中不监听DOM事件，改为定期检查
    // 在React Native中，用户活跃度通过其他方式检测
    console.log('📱 React Native环境，跳过DOM事件监听');
  }

  // 重置活跃度计时器
  private resetActivityTimer() {
    setTimeout(() => {
      this.isUserActive = false;
    }, 3 * 60 * 1000);
  }

  // 根据网络状态调整同步策略
  private adjustSyncStrategy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    const interval = this.getCurrentSyncInterval();
    this.syncTimer = setInterval(() => {
      this.performPeriodicSync();
    }, interval);
  }

  // 获取当前同步间隔
  private getCurrentSyncInterval(): number {
    if (!this.isUserActive) {
      return this.config.offlineSyncInterval;
    }

    switch (this.networkType) {
      case 'wifi':
        return this.config.wifiSyncInterval;
      case 'cellular':
        return this.config.mobileSyncInterval;
      default:
        return this.config.offlineSyncInterval;
    }
  }

  // 添加数据到同步队列
  public async addToSyncQueue(data: Omit<SyncData, 'timestamp'>): Promise<void> {
    // 检查是否为游客模式
    const isGuestMode = await guestModeService.isGuestMode();
    if (isGuestMode) {
      console.log('👤 游客模式，数据仅保存本地，不加入同步队列');
      return;
    }

    const syncData: SyncData = {
      ...data,
      timestamp: Date.now()
    };

    this.syncQueue.push(syncData);
    this.pendingOperations.add(`${data.type}-${data.operation}-${Date.now()}`);
    this.persistSyncQueue();

    if (this.isImportantOperation(data.type)) {
      this.syncPendingData();
    }

    console.log(`📝 添加同步数据: ${data.type} (${data.operation})`);
  }

  // 判断是否为重要操作
  private isImportantOperation(type: string): boolean {
    // 重要操作类型，需要立即同步
    const importantTypes = ['experience', 'userStats', 'vocabulary', 'wordbooks', 'shows'];
    return importantTypes.includes(type);
  }

  // 同步待同步数据
  public async syncPendingData(): Promise<SyncResult> {
    // 检查是否为游客模式
    const isGuestMode = await guestModeService.isGuestMode();
    if (isGuestMode) {
      console.log('👤 游客模式，跳过云端同步，数据仅保存本地');
      return {
        success: true,
        message: '游客模式，数据仅保存本地'
      };
    }

    if (this.isSyncing || this.syncQueue.length === 0) {
      return {
        success: true,
        message: '无待同步数据或正在同步中'
      };
    }

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      console.log('📱 离线模式，数据已保存到本地队列');
      return {
        success: true,
        message: '离线模式，数据已保存到本地队列'
      };
    }

    this.isSyncing = true;
    this.retryCount = 0;
    this.syncProgress = 0;

    try {
      const result = await this.performUnifiedSync();
      this.lastSyncTime = Date.now();
      this.syncProgress = 100;
      return result;
    } catch (error) {
      console.error('❌ 同步失败:', error);
      this.handleSyncError();
      return {
        success: false,
        message: '同步失败',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // 执行统一同步
  private async performUnifiedSync(): Promise<SyncResult> {
    const batch = this.syncQueue.splice(0, this.config.batchSize);
    
    if (batch.length === 0) {
      return {
        success: true,
        message: '无数据需要同步'
      };
    }

    const token = await this.getAuthToken();
    if (!token) {
      console.log('ℹ️ 跳过同步：用户未登录或token无效');
      return {
        success: true,
        message: '跳过同步：用户未登录'
      };
    }

    const groupedData = this.groupDataByType(batch);
    const conflicts: any[] = [];
    const errors: string[] = [];
    
    let processedCount = 0;
    
    for (const [dataType, dataItems] of Object.entries(groupedData)) {
      try {
        const result = await this.syncDataType(dataType, dataItems, token);
        if (result.conflicts) {
          conflicts.push(...result.conflicts);
        }
        if (result.errors) {
          errors.push(...result.errors);
        }
        
        processedCount += dataItems.length;
        this.syncProgress = (processedCount / batch.length) * 100;
      } catch (error) {
        console.error(`同步数据类型 ${dataType} 失败:`, error);
        errors.push(`同步 ${dataType} 失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // 将失败的数据重新加入队列
        this.syncQueue.unshift(...dataItems);
      }
    }

    this.persistSyncQueue();
    console.log(`✅ 统一同步完成: ${batch.length} 条数据`);

    return {
      success: errors.length === 0,
      message: `同步完成: ${batch.length} 条数据`,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // 按数据类型分组
  private groupDataByType(batch: SyncData[]): Record<string, SyncData[]> {
    const grouped: Record<string, SyncData[]> = {};
    
    batch.forEach(item => {
      if (!grouped[item.type]) {
        grouped[item.type] = [];
      }
      grouped[item.type].push(item);
    });
    
    return grouped;
  }

  // 同步特定数据类型
  private async syncDataType(dataType: string, dataItems: SyncData[], token: string): Promise<{ conflicts?: any[], errors?: string[] }> {
    console.log(`🔄 同步数据类型: ${dataType} (${dataItems.length} 个变更) - 仅上传模式`);
    
    try {
      // 直接上传，无需冲突检测
      await this.syncDataWithoutConflicts(dataItems, token);
      console.log(`✅ 数据类型 ${dataType} 同步完成（仅上传）`);
      return { conflicts: [], errors: [] };
    } catch (error) {
      return { 
        conflicts: [], 
        errors: [`同步 ${dataType} 失败: ${error instanceof Error ? error.message : 'Unknown error'}`] 
      };
    }
  }



  // 无冲突同步 - 遵循多邻国原则：只上传，不更新本地版本号
  private async syncDataWithoutConflicts(dataItems: SyncData[], token: string): Promise<void> {
    try {
      // 添加数据完整性检查
      const validatedData = dataItems.filter(item => this.validateSyncData(item));
      
      if (validatedData.length === 0) {
        console.log('⚠️ 没有有效数据需要同步');
        return;
      }

      console.log(`📤 准备同步 ${validatedData.length} 条数据`);

      const response = await fetch(`${API_BASE_URL}/users/batch-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: validatedData,
          timestamp: Date.now(),
          // 添加同步策略标识
          syncStrategy: 'local-first',
          deviceId: await this.getDeviceId()
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // 处理401未授权错误
        if (response.status === 401) {
          console.warn('⚠️ Token验证失败，清除无效token并触发重新认证');
          await tokenValidationService.clearInvalidToken();
          tokenValidationService.triggerReauth();
          throw new Error('Token验证失败，请重新登录');
        }
        
        throw new Error(`同步失败: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '同步失败');
      }

      // 遵循多邻国原则：不更新本地服务器版本号，避免影响后续冲突检测
      // 本地数据始终是权威的，不需要跟踪服务器版本
      console.log(`✅ 数据类型同步完成（仅上传，不更新版本号）`);
      
      // 记录同步成功的数据
      this.logSyncSuccess(validatedData);
      
    } catch (error) {
      console.error(`❌ 同步失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // 验证同步数据
  private validateSyncData(data: SyncData): boolean {
    try {
      // 基本字段验证
      if (!data.type || !data.data || !data.userId || !data.operation) {
        console.warn(`⚠️ 跳过无效同步数据: 缺少必需字段`, data);
        return false;
      }

      // 时间戳验证
      if (!data.timestamp || typeof data.timestamp !== 'number' || data.timestamp <= 0) {
        console.warn(`⚠️ 跳过无效同步数据: 无效时间戳`, data);
        return false;
      }

      // 数据类型特定验证
      switch (data.type) {
        case 'vocabulary':
          return this.validateVocabularyData(data.data);
        case 'learningRecords':
          return this.validateLearningRecordsData(data.data);
        case 'experience':
          return this.validateExperienceData(data.data);
        case 'userStats':
          return this.validateUserStatsData(data.data);
        case 'badges':
          return this.validateBadgesData(data.data);
        case 'wordbooks':
          return this.validateWordbooksData(data.data);
        case 'shows':
          return this.validateShowsData(data.data);
        case 'searchHistory':
          return this.validateSearchHistoryData(data.data);
        case 'userSettings':
          return this.validateUserSettingsData(data.data);
        default:
          console.warn(`⚠️ 未知数据类型: ${data.type}`);
          return false;
      }
    } catch (error) {
      console.error(`❌ 数据验证异常: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  // 验证词汇数据
  private validateVocabularyData(data: any): boolean {
    return data && typeof data === 'object' && 
           (Array.isArray(data) ? data.length > 0 : true);
  }

  // 验证学习记录数据
  private validateLearningRecordsData(data: any): boolean {
    return data && Array.isArray(data) && data.length > 0 &&
           data.every(record => record && typeof record === 'object');
  }

  // 验证经验值数据
  private validateExperienceData(data: any): boolean {
    return data && typeof data === 'object' && 
           typeof data.experience === 'number' && data.experience >= 0;
  }

  // 验证用户统计数据
  private validateUserStatsData(data: any): boolean {
    return data && typeof data === 'object' && 
           typeof data.experience === 'number';
  }

  // 验证徽章数据
  private validateBadgesData(data: any): boolean {
    return data && Array.isArray(data) && 
           data.every(badge => badge && typeof badge === 'object');
  }

  // 验证单词本数据
  private validateWordbooksData(data: any): boolean {
    return data && Array.isArray(data) && 
           data.every(wordbook => wordbook && typeof wordbook === 'object');
  }

  // 验证剧单数据
  private validateShowsData(data: any): boolean {
    return data && Array.isArray(data) && 
           data.every(show => show && typeof show === 'object');
  }

  // 验证搜索历史数据
  private validateSearchHistoryData(data: any): boolean {
    return data && Array.isArray(data) && 
           data.every(history => history && typeof history === 'object');
  }

  // 验证用户设置数据
  private validateUserSettingsData(data: any): boolean {
    return data && typeof data === 'object';
  }

  // 获取设备ID
  private async getDeviceId(): Promise<string> {
    try {
      const deviceId = await AsyncStorage.getItem('deviceId');
      if (deviceId) return deviceId;
      
      // 生成新的设备ID
      const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('deviceId', newDeviceId);
      return newDeviceId;
    } catch (error) {
      console.warn('⚠️ 获取设备ID失败，使用默认值');
      return 'unknown_device';
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
      console.warn('⚠️ 获取Apple ID失败:', error);
      return null;
    }
  }

  // Apple ID跨设备同步
  public async performAppleCrossDeviceSync(): Promise<SyncResult> {
    try {
      console.log('🍎 开始Apple ID跨设备同步...');
      
      const appleId = await this.getAppleId();
      if (!appleId) {
        console.log('ℹ️ 跳过跨设备同步：用户未使用Apple ID登录');
        return {
          success: true,
          message: '跳过跨设备同步：用户未使用Apple ID登录'
        };
      }

      const deviceId = await this.getDeviceId();
      console.log(`🔗 跨设备同步: Apple ID ${appleId}, 设备 ${deviceId}`);

      // 1. 获取云端数据
      const cloudData = await this.fetchCloudData(appleId);
      
      // 2. 获取本地数据
      const localData = await this.getLocalDataForSync();
      
      // 3. 合并数据
      const mergedData = await this.mergeLocalAndCloudData(localData, cloudData);
      
      // 4. 更新本地数据
      await this.updateLocalDataFromMerged(mergedData);
      
      // 5. 上传合并后的数据到云端
      await this.uploadMergedDataToCloud(mergedData, appleId, deviceId);
      
      console.log('✅ Apple ID跨设备同步完成');
      
      return {
        success: true,
        message: '跨设备同步完成',
        data: mergedData
      };
      
    } catch (error) {
      console.error('❌ Apple ID跨设备同步失败:', error);
      return {
        success: false,
        message: '跨设备同步失败',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // 获取云端数据
  private async fetchCloudData(appleId: string): Promise<any> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('未找到认证token');
      }

      const response = await fetch(`${API_BASE_URL}/sync/apple/${appleId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`获取云端数据失败: ${response.status}`);
      }

      const cloudData = await response.json();
      console.log('☁️ 云端数据获取成功:', Object.keys(cloudData));
      return cloudData;
      
    } catch (error) {
      console.error('❌ 获取云端数据失败:', error);
      // 返回空数据，使用本地数据
      return {
        vocabulary: [],
        shows: [],
        learningRecords: [],
        experience: {},
        badges: [],
        userStats: {}
      };
    }
  }

  // 获取本地数据用于同步
  private async getLocalDataForSync(): Promise<any> {
    try {
      const localData = {
        vocabulary: await this.getLocalVocabulary(),
        shows: await this.getLocalShows(),
        learningRecords: await this.getLocalLearningRecords(),
        experience: await this.getLocalExperience(),
        badges: await this.getLocalBadges(),
        userStats: await this.getLocalUserStats()
      };
      
      console.log('📱 本地数据获取成功:', Object.keys(localData));
      return localData;
      
    } catch (error) {
      console.error('❌ 获取本地数据失败:', error);
      return {};
    }
  }

  // 合并本地和云端数据
  private async mergeLocalAndCloudData(localData: any, cloudData: any): Promise<any> {
    try {
      console.log('🔄 开始合并本地和云端数据...');
      
      const mergedData = {
        vocabulary: this.mergeVocabularyData(localData.vocabulary || [], cloudData.vocabulary || []),
        shows: this.mergeShowsData(localData.shows || [], cloudData.shows || []),
        learningRecords: this.mergeLearningRecordsData(localData.learningRecords || [], cloudData.learningRecords || []),
        experience: this.mergeExperienceData(localData.experience || {}, cloudData.experience || {}),
        badges: this.mergeBadgesData(localData.badges || [], cloudData.badges || []),
        userStats: this.mergeUserStatsData(localData.userStats || {}, cloudData.userStats || {})
      };
      
      console.log('✅ 数据合并完成');
      return mergedData;
      
    } catch (error) {
      console.error('❌ 数据合并失败:', error);
      // 合并失败时，优先使用云端数据
      return cloudData;
    }
  }

  // 合并词汇数据
  private mergeVocabularyData(local: any[], cloud: any[]): any[] {
    const merged = new Map();
    
    // 添加云端数据
    cloud.forEach(item => {
      merged.set(item.word || item.id, item);
    });
    
    // 添加本地数据（如果本地数据更新）
    local.forEach(item => {
      const key = item.word || item.id;
      const existing = merged.get(key);
      
      if (!existing || (item.lastModified > existing.lastModified)) {
        merged.set(key, item);
      }
    });
    
    return Array.from(merged.values());
  }

  // 合并剧单数据
  private mergeShowsData(local: any[], cloud: any[]): any[] {
    const merged = new Map();
    
    // 添加云端数据
    cloud.forEach(item => {
      merged.set(item.id, item);
    });
    
    // 添加本地数据（如果本地数据更新）
    local.forEach(item => {
      const existing = merged.get(item.id);
      
      if (!existing || (item.lastModified > existing.lastModified)) {
        merged.set(item.id, item);
      }
    });
    
    return Array.from(merged.values());
  }

  // 合并学习记录数据
  private mergeLearningRecordsData(local: any[], cloud: any[]): any[] {
    const merged = new Map();
    
    // 添加云端数据
    cloud.forEach(item => {
      const key = `${item.wordId}_${item.sessionId}`;
      merged.set(key, item);
    });
    
    // 添加本地数据（如果本地数据更新）
    local.forEach(item => {
      const key = `${item.wordId}_${item.sessionId}`;
      const existing = merged.get(key);
      
      if (!existing || (item.timestamp > existing.timestamp)) {
        merged.set(key, item);
      }
    });
    
    return Array.from(merged.values());
  }

  // 合并经验值数据
  private mergeExperienceData(local: any, cloud: any): any {
    // 取最高经验值和等级
    return {
      experience: Math.max(local.experience || 0, cloud.experience || 0),
      level: Math.max(local.level || 1, cloud.level || 1),
      totalExperience: Math.max(local.totalExperience || 0, cloud.totalExperience || 0),
      lastLevelUp: local.lastLevelUp > cloud.lastLevelUp ? local.lastLevelUp : cloud.lastLevelUp
    };
  }

  // 合并徽章数据
  private mergeBadgesData(local: any[], cloud: any[]): any[] {
    const merged = new Map();
    
    // 添加云端数据
    cloud.forEach(item => {
      merged.set(item.id, item);
    });
    
    // 添加本地数据（如果本地数据更新）
    local.forEach(item => {
      const existing = merged.get(item.id);
      
      if (!existing || (item.unlockedAt > existing.unlockedAt)) {
        merged.set(item.id, item);
      }
    });
    
    return Array.from(merged.values());
  }

  // 合并用户统计数据
  private mergeUserStatsData(local: any, cloud: any): any {
    return {
      totalWords: Math.max(local.totalWords || 0, cloud.totalWords || 0),
      masteredWords: Math.max(local.masteredWords || 0, cloud.masteredWords || 0),
      learningDays: Math.max(local.learningDays || 0, cloud.learningDays || 0),
      currentStreak: Math.max(local.currentStreak || 0, cloud.currentStreak || 0),
      totalReviews: Math.max(local.totalReviews || 0, cloud.totalReviews || 0),
      accuracy: Math.max(local.accuracy || 0, cloud.accuracy || 0)
    };
  }

  // 获取本地词汇数据
  private async getLocalVocabulary(): Promise<any[]> {
    try {
      const vocabulary = await AsyncStorage.getItem('user_vocabulary');
      return vocabulary ? JSON.parse(vocabulary) : [];
    } catch (error) {
      console.error('❌ 获取本地词汇数据失败:', error);
      return [];
    }
  }

  // 获取本地剧单数据
  private async getLocalShows(): Promise<any[]> {
    try {
      const shows = await AsyncStorage.getItem('user_shows');
      return shows ? JSON.parse(shows) : [];
    } catch (error) {
      console.error('❌ 获取本地剧单数据失败:', error);
      return [];
    }
  }

  // 获取本地学习记录数据
  private async getLocalLearningRecords(): Promise<any[]> {
    try {
      const records = await AsyncStorage.getItem('learning_records');
      return records ? JSON.parse(records) : [];
    } catch (error) {
      console.error('❌ 获取本地学习记录失败:', error);
      return [];
    }
  }

  // 获取本地经验值数据
  private async getLocalExperience(): Promise<any> {
    try {
      const experience = await AsyncStorage.getItem('user_experience');
      return experience ? JSON.parse(experience) : {};
    } catch (error) {
      console.error('❌ 获取本地经验值数据失败:', error);
      return {};
    }
  }

  // 获取本地徽章数据
  private async getLocalBadges(): Promise<any[]> {
    try {
      const badges = await AsyncStorage.getItem('userBadgeProgress');
      return badges ? JSON.parse(badges) : [];
    } catch (error) {
      console.error('❌ 获取本地徽章数据失败:', error);
      return [];
    }
  }

  // 获取本地用户统计数据
  private async getLocalUserStats(): Promise<any> {
    try {
      const stats = await AsyncStorage.getItem('user_stats');
      return stats ? JSON.parse(stats) : {};
    } catch (error) {
      console.error('❌ 获取本地用户统计数据失败:', error);
      return {};
    }
  }

  // 从合并数据更新本地数据
  private async updateLocalDataFromMerged(mergedData: any): Promise<void> {
    try {
      console.log('📱 开始更新本地数据...');
      
      // 更新词汇数据
      if (mergedData.vocabulary) {
        await AsyncStorage.setItem('user_vocabulary', JSON.stringify(mergedData.vocabulary));
      }
      
      // 更新剧单数据
      if (mergedData.shows) {
        await AsyncStorage.setItem('user_shows', JSON.stringify(mergedData.shows));
      }
      
      // 更新学习记录
      if (mergedData.learningRecords) {
        await AsyncStorage.setItem('learning_records', JSON.stringify(mergedData.learningRecords));
      }
      
      // 更新经验值数据
      if (mergedData.experience) {
        await AsyncStorage.setItem('user_experience', JSON.stringify(mergedData.experience));
      }
      
      // 更新徽章数据
      if (mergedData.badges) {
        await AsyncStorage.setItem('userBadgeProgress', JSON.stringify(mergedData.badges));
      }
      
      // 更新用户统计数据
      if (mergedData.userStats) {
        await AsyncStorage.setItem('user_stats', JSON.stringify(mergedData.userStats));
      }
      
      console.log('✅ 本地数据更新完成');
      
    } catch (error) {
      console.error('❌ 更新本地数据失败:', error);
      throw error;
    }
  }

  // 上传合并后的数据到云端
  private async uploadMergedDataToCloud(mergedData: any, appleId: string, deviceId: string): Promise<void> {
    try {
      console.log('☁️ 开始上传合并数据到云端...');
      
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('未找到认证token');
      }

      const response = await fetch(`${API_BASE_URL}/sync/apple/${appleId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: mergedData,
          deviceId,
          timestamp: Date.now(),
          syncVersion: await this.getNextSyncVersion()
        })
      });

      if (!response.ok) {
        throw new Error(`上传云端数据失败: ${response.status}`);
      }

      console.log('✅ 云端数据上传完成');
      
    } catch (error) {
      console.error('❌ 上传云端数据失败:', error);
      // 不抛出错误，避免影响同步流程
    }
  }

  // 获取下一个同步版本号
  private async getNextSyncVersion(): Promise<number> {
    try {
      const currentVersion = await AsyncStorage.getItem('syncVersion');
      const nextVersion = (parseInt(currentVersion || '0') + 1);
      await AsyncStorage.setItem('syncVersion', nextVersion.toString());
      return nextVersion;
    } catch (error) {
      console.error('❌ 获取同步版本号失败:', error);
      return Date.now();
    }
  }

  // 记录同步成功
  private logSyncSuccess(dataItems: SyncData[]): void {
    const dataTypeCounts = dataItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📊 同步成功统计:', dataTypeCounts);
    
    // 更新最后同步时间
    this.lastSyncTime = Date.now();
  }

  // 处理同步错误
  private handleSyncError(): void {
    this.retryCount++;
    
    if (this.retryCount < this.config.maxRetryAttempts) {
      const delay = Math.pow(2, this.retryCount) * 1000;
      console.log(`🔄 ${this.retryCount}/${this.config.maxRetryAttempts} 重试同步，延迟 ${delay}ms`);
      
      setTimeout(() => {
        this.syncPendingData();
      }, delay);
    } else {
      console.warn('⚠️ 达到最大重试次数，数据将稍后重试');
    }
  }

  // 执行定期同步
  private async performPeriodicSync(): Promise<void> {
    if (this.syncQueue.length > 0) {
      await this.syncPendingData();
    }
  }

  // 获取认证token
  private async getAuthToken(): Promise<string | null> {
    try {
      console.log('🔍 开始获取认证token...');
      
      // 首先尝试从authToken获取（统一存储方式）
      const authToken = await AsyncStorage.getItem('authToken');
      console.log('🔍 authToken状态:', authToken ? '存在' : '不存在');
      
      if (authToken) {
        console.log('🔍 找到authToken:', authToken.substring(0, 20) + '...');
        // 验证token有效性
        const validation = await tokenValidationService.validateToken(authToken);
        if (validation.isValid) {
          console.log('✅ authToken验证通过');
          return authToken;
        } else {
          console.warn('⚠️ authToken无效:', validation.error);
          // 清除无效token
          await tokenValidationService.clearInvalidToken();
          // 触发重新认证
          tokenValidationService.triggerReauth();
          return null;
        }
      }
      
      // 兼容性：从userData获取
      const userData = await AsyncStorage.getItem('userData');
      console.log('🔍 userData状态:', userData ? '存在' : '不存在');
      
      if (userData) {
        const parsed = JSON.parse(userData);
        console.log('🔍 userData内容:', {
          hasToken: !!parsed.token,
          loginType: parsed.loginType,
          userId: parsed.id
        });
        
        if (parsed.token) {
          console.log('🔍 找到userData.token:', parsed.token.substring(0, 20) + '...');
          // 验证token有效性
          const validation = await tokenValidationService.validateToken(parsed.token);
          if (validation.isValid) {
            console.log('✅ userData.token验证通过');
            return parsed.token;
          } else {
            console.warn('⚠️ userData.token无效:', validation.error);
            // 清除无效token
            await tokenValidationService.clearInvalidToken();
            // 触发重新认证
            tokenValidationService.triggerReauth();
            return null;
          }
        }
      }
      
      // 临时解决方案：如果没有token，返回null但不抛出错误
      console.log('ℹ️ 未找到认证token，跳过同步（用户需要重新登录）');
      return null;
    } catch (error) {
      console.error('获取认证token失败:', error);
      return null;
    }
  }



  // 持久化同步队列
  private async persistSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('unifiedSyncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('持久化同步队列失败:', error);
    }
  }

  // 加载同步队列
  private async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('unifiedSyncQueue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('加载同步队列失败:', error);
    }
  }

  // 获取同步状态
  public getSyncStatus(): SyncStatus {
    return {
      queueLength: this.syncQueue.length,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      networkType: this.networkType,
      isUserActive: this.isUserActive,
      retryCount: this.retryCount,
      syncMode: this.networkType === 'none' ? 'offline' : 'online',
      pendingOperations: this.pendingOperations.size,
      syncProgress: this.syncProgress
    };
  }

  // 手动触发同步
  public async forceSync(): Promise<SyncResult> {
    console.log('🚀 手动触发同步');
    return await this.syncPendingData();
  }

  // 清理同步队列
  public clearSyncQueue(): void {
    this.syncQueue = [];
    this.pendingOperations.clear();
    this.persistSyncQueue();
    console.log('🧹 同步队列已清理');
  }

  // 更新配置
  public updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.adjustSyncStrategy();
    console.log('⚙️ 同步配置已更新:', newConfig);
  }

  // 获取配置
  public getConfig(): SyncConfig {
    return { ...this.config };
  }

  // 销毁实例
  public destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }

  // 兼容性方法：迁移旧同步数据
  public async migrateOldSyncData(): Promise<void> {
    try {
      console.log('🔄 开始迁移旧同步数据...');
      
      // 迁移旧的同步队列
      const oldQueueData = await AsyncStorage.getItem('syncQueue');
      if (oldQueueData) {
        const oldQueue = JSON.parse(oldQueueData);
        this.syncQueue.push(...oldQueue);
        await AsyncStorage.removeItem('syncQueue');
        console.log(`✅ 迁移了 ${oldQueue.length} 条旧同步数据`);
      }

      // 清理旧的数据版本文件
      await AsyncStorage.removeItem('localDataVersions');
      await AsyncStorage.removeItem('unifiedLocalDataVersions');
      console.log('✅ 清理了旧数据版本文件');

      this.persistSyncQueue();
      
      console.log('✅ 旧同步数据迁移完成');
    } catch (error) {
      console.error('❌ 迁移旧同步数据失败:', error);
    }
  }
}

// 导出单例实例
export const unifiedSyncService = UnifiedSyncService.getInstance(); 