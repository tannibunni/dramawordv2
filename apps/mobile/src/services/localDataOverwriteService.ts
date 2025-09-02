import AsyncStorage from '@react-native-async-storage/async-storage';
import { CloudData } from './cloudDataDownloadService';
import { DeviceInfo } from './newDeviceDetectionService';

export interface OverwriteResult {
  success: boolean;
  message: string;
  overwrittenDataTypes: string[];
  totalItems: number;
  error?: string;
}

export interface DataBackup {
  timestamp: number;
  data: any;
  dataType: string;
}

export class LocalDataOverwriteService {
  private static instance: LocalDataOverwriteService;
  private isOverwriting: boolean = false;
  private overwriteProgress: number = 0;

  public static getInstance(): LocalDataOverwriteService {
    if (!LocalDataOverwriteService.instance) {
      LocalDataOverwriteService.instance = new LocalDataOverwriteService();
    }
    return LocalDataOverwriteService.instance;
  }

  private constructor() {}

  // 覆盖本地数据
  public async overwriteLocalData(
    cloudData: CloudData, 
    deviceInfo: DeviceInfo
  ): Promise<OverwriteResult> {
    try {
      if (this.isOverwriting) {
        return {
          success: false,
          message: '数据覆盖正在进行中，请稍候',
          overwrittenDataTypes: [],
          totalItems: 0
        };
      }

      console.log('📱 开始覆盖本地数据...');
      this.isOverwriting = true;
      this.overwriteProgress = 0;

      const overwrittenTypes: string[] = [];
      let totalItems = 0;

      // 1. 备份现有数据（可选）
      await this.backupExistingData();

      // 2. 覆盖词汇数据
      if (cloudData.vocabulary && cloudData.vocabulary.length > 0) {
        await this.overwriteVocabularyData(cloudData.vocabulary);
        overwrittenTypes.push('vocabulary');
        totalItems += cloudData.vocabulary.length;
        this.overwriteProgress = 20;
      }

      // 3. 覆盖剧单数据
      if (cloudData.shows && cloudData.shows.length > 0) {
        await this.overwriteShowsData(cloudData.shows);
        overwrittenTypes.push('shows');
        totalItems += cloudData.shows.length;
        this.overwriteProgress = 40;
      }

      // 4. 覆盖学习记录
      if (cloudData.learningRecords && cloudData.learningRecords.length > 0) {
        await this.overwriteLearningRecordsData(cloudData.learningRecords);
        overwrittenTypes.push('learningRecords');
        totalItems += cloudData.learningRecords.length;
        this.overwriteProgress = 60;
      }

      // 5. 覆盖经验值数据
      if (cloudData.experience) {
        await this.overwriteExperienceData(cloudData.experience);
        overwrittenTypes.push('experience');
        totalItems += 1;
        this.overwriteProgress = 70;
      }

      // 6. 覆盖徽章数据
      if (cloudData.badges && cloudData.badges.length > 0) {
        await this.overwriteBadgesData(cloudData.badges);
        overwrittenTypes.push('badges');
        totalItems += cloudData.badges.length;
        this.overwriteProgress = 80;
      }

      // 7. 覆盖用户统计数据
      if (cloudData.userStats) {
        await this.overwriteUserStatsData(cloudData.userStats);
        overwrittenTypes.push('userStats');
        totalItems += 1;
        this.overwriteProgress = 90;
      }

      // 8. 更新同步元数据
      await this.updateSyncMetadata(cloudData, deviceInfo);
      this.overwriteProgress = 100;

      console.log(`✅ 本地数据覆盖完成: ${overwrittenTypes.length} 种数据类型, ${totalItems} 个数据项`);

      return {
        success: true,
        message: '本地数据覆盖成功',
        overwrittenDataTypes: overwrittenTypes,
        totalItems
      };

    } catch (error) {
      console.error('❌ 本地数据覆盖失败:', error);
      
      return {
        success: false,
        message: '本地数据覆盖失败',
        overwrittenDataTypes: [],
        totalItems: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.isOverwriting = false;
    }
  }

  // 备份现有数据
  private async backupExistingData(): Promise<void> {
    try {
      console.log('💾 备份现有数据...');
      
      const backupData: DataBackup[] = [];
      const timestamp = Date.now();

      // 备份词汇数据
      const vocabulary = await AsyncStorage.getItem('user_vocabulary');
      if (vocabulary) {
        backupData.push({
          timestamp,
          data: JSON.parse(vocabulary),
          dataType: 'vocabulary'
        });
      }

      // 备份剧单数据
      const shows = await AsyncStorage.getItem('user_shows');
      if (shows) {
        backupData.push({
          timestamp,
          data: JSON.parse(shows),
          dataType: 'shows'
        });
      }

      // 备份学习记录
      const learningRecords = await AsyncStorage.getItem('learning_records');
      if (learningRecords) {
        backupData.push({
          timestamp,
          data: JSON.parse(learningRecords),
          dataType: 'learningRecords'
        });
      }

      // 备份经验值数据
      const experience = await AsyncStorage.getItem('user_experience');
      if (experience) {
        backupData.push({
          timestamp,
          data: JSON.parse(experience),
          dataType: 'experience'
        });
      }

      // 备份徽章数据
      const badges = await AsyncStorage.getItem('userBadgeProgress');
      if (badges) {
        backupData.push({
          timestamp,
          data: JSON.parse(badges),
          dataType: 'badges'
        });
      }

      // 保存备份数据
      if (backupData.length > 0) {
        await AsyncStorage.setItem('data_backup', JSON.stringify(backupData));
        console.log(`💾 数据备份完成: ${backupData.length} 种数据类型`);
      }

    } catch (error) {
      console.warn('⚠️ 数据备份失败:', error);
      // 备份失败不影响主要功能
    }
  }

  // 覆盖词汇数据
  private async overwriteVocabularyData(vocabulary: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem('user_vocabulary', JSON.stringify(vocabulary));
      console.log(`✅ 词汇数据覆盖完成: ${vocabulary.length} 个词汇`);
    } catch (error) {
      console.error('❌ 词汇数据覆盖失败:', error);
      throw error;
    }
  }

  // 覆盖剧单数据
  private async overwriteShowsData(shows: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem('user_shows', JSON.stringify(shows));
      console.log(`✅ 剧单数据覆盖完成: ${shows.length} 个剧单`);
    } catch (error) {
      console.error('❌ 剧单数据覆盖失败:', error);
      throw error;
    }
  }

  // 覆盖学习记录
  private async overwriteLearningRecordsData(learningRecords: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem('learning_records', JSON.stringify(learningRecords));
      console.log(`✅ 学习记录覆盖完成: ${learningRecords.length} 条记录`);
    } catch (error) {
      console.error('❌ 学习记录覆盖失败:', error);
      throw error;
    }
  }

  // 覆盖经验值数据
  private async overwriteExperienceData(experience: any): Promise<void> {
    try {
      await AsyncStorage.setItem('user_experience', JSON.stringify(experience));
      console.log('✅ 经验值数据覆盖完成');
    } catch (error) {
      console.error('❌ 经验值数据覆盖失败:', error);
      throw error;
    }
  }

  // 覆盖徽章数据
  private async overwriteBadgesData(badges: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem('userBadgeProgress', JSON.stringify(badges));
      console.log(`✅ 徽章数据覆盖完成: ${badges.length} 个徽章`);
    } catch (error) {
      console.error('❌ 徽章数据覆盖失败:', error);
      throw error;
    }
  }

  // 覆盖用户统计数据
  private async overwriteUserStatsData(userStats: any): Promise<void> {
    try {
      await AsyncStorage.setItem('user_stats', JSON.stringify(userStats));
      console.log('✅ 用户统计数据覆盖完成');
    } catch (error) {
      console.error('❌ 用户统计数据覆盖失败:', error);
      throw error;
    }
  }

  // 更新同步元数据
  private async updateSyncMetadata(cloudData: CloudData, deviceInfo: DeviceInfo): Promise<void> {
    try {
      const metadata = {
        lastSyncTime: Date.now(),
        lastCloudSyncTime: cloudData.lastModified,
        cloudSyncVersion: cloudData.syncVersion,
        deviceId: deviceInfo.deviceId,
        appleId: deviceInfo.appleId,
        dataTypes: Object.keys(cloudData).filter(key => 
          key !== 'lastModified' && key !== 'syncVersion'
        )
      };

      await AsyncStorage.setItem('sync_metadata', JSON.stringify(metadata));
      console.log('✅ 同步元数据更新完成');

    } catch (error) {
      console.error('❌ 同步元数据更新失败:', error);
      throw error;
    }
  }

  // 获取覆盖进度
  public getOverwriteProgress(): number {
    return this.overwriteProgress;
  }

  // 检查是否正在覆盖
  public isCurrentlyOverwriting(): boolean {
    return this.isOverwriting;
  }

  // 重置覆盖状态
  public resetOverwriteState(): void {
    this.isOverwriting = false;
    this.overwriteProgress = 0;
  }

  // 恢复备份数据
  public async restoreBackupData(): Promise<boolean> {
    try {
      console.log('🔄 开始恢复备份数据...');
      
      const backupData = await AsyncStorage.getItem('data_backup');
      if (!backupData) {
        console.log('ℹ️ 没有找到备份数据');
        return false;
      }

      const backups: DataBackup[] = JSON.parse(backupData);
      
      for (const backup of backups) {
        try {
          const storageKey = this.getStorageKeyForDataType(backup.dataType);
          if (storageKey) {
            await AsyncStorage.setItem(storageKey, JSON.stringify(backup.data));
            console.log(`✅ 恢复 ${backup.dataType} 数据`);
          }
        } catch (error) {
          console.warn(`⚠️ 恢复 ${backup.dataType} 数据失败:`, error);
        }
      }

      console.log('✅ 备份数据恢复完成');
      return true;

    } catch (error) {
      console.error('❌ 备份数据恢复失败:', error);
      return false;
    }
  }

  // 获取数据类型的存储键
  private getStorageKeyForDataType(dataType: string): string | null {
    const keyMap: Record<string, string> = {
      'vocabulary': 'user_vocabulary',
      'shows': 'user_shows',
      'learningRecords': 'learning_records',
      'experience': 'user_experience',
      'badges': 'userBadgeProgress',
      'userStats': 'user_stats'
    };

    return keyMap[dataType] || null;
  }

  // 清理备份数据
  public async clearBackupData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('data_backup');
      console.log('✅ 备份数据清理完成');
    } catch (error) {
      console.error('❌ 备份数据清理失败:', error);
    }
  }
}
