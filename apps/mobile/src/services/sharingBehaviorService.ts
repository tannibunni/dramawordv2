import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share, Alert } from 'react-native';
import { API_BASE_URL } from '../constants/config';

// 分享行为接口
export interface SharingBehaviorInfo {
  totalShares: number;
  shareTypes: {
    vocabulary: number;
    progress: number;
    achievements: number;
    shows: number;
    wordbook: number;
  };
  shareChannels: {
    wechat: number;
    weibo: number;
    qq: number;
    copyLink: number;
    other: number;
  };
  lastShareDate?: Date;
  shareHistory: ShareRecord[];
}

export interface ShareRecord {
  date: Date;
  type: 'vocabulary' | 'progress' | 'achievements' | 'shows' | 'wordbook';
  channel: 'wechat' | 'weibo' | 'qq' | 'copyLink' | 'other';
  content: string;
  success: boolean;
}

export type ShareType = 'vocabulary' | 'progress' | 'achievements' | 'shows' | 'wordbook';
export type ShareChannel = 'wechat' | 'weibo' | 'qq' | 'copyLink' | 'other';

// 分享行为服务
class SharingBehaviorService {
  private static instance: SharingBehaviorService;
  private sharingBehaviorInfo: SharingBehaviorInfo | null = null;
  private shareQueue: ShareRecord[] = [];

  public static getInstance(): SharingBehaviorService {
    if (!SharingBehaviorService.instance) {
      SharingBehaviorService.instance = new SharingBehaviorService();
    }
    return SharingBehaviorService.instance;
  }

  /**
   * 初始化分享行为服务
   */
  public async initialize(): Promise<void> {
    try {
      console.log('[SharingBehaviorService] 初始化分享行为服务...');
      
      // 加载本地存储的分享行为信息
      await this.loadStoredSharingBehavior();
      
      console.log('[SharingBehaviorService] 分享行为服务初始化完成');
    } catch (error) {
      console.error('[SharingBehaviorService] 初始化失败:', error);
    }
  }

  /**
   * 记录分享行为
   */
  public async recordShare(
    type: ShareType,
    channel: ShareChannel,
    content: string,
    success: boolean
  ): Promise<void> {
    try {
      const shareRecord: ShareRecord = {
        date: new Date(),
        type,
        channel,
        content,
        success
      };

      console.log('[SharingBehaviorService] 记录分享行为:', shareRecord);

      // 添加到队列
      this.shareQueue.push(shareRecord);

      // 更新本地统计
      if (this.sharingBehaviorInfo) {
        this.sharingBehaviorInfo.totalShares++;
        this.sharingBehaviorInfo.shareTypes[type]++;
        this.sharingBehaviorInfo.shareChannels[channel]++;
        this.sharingBehaviorInfo.lastShareDate = new Date();
        this.sharingBehaviorInfo.shareHistory.push(shareRecord);

        // 限制历史记录数量（保留最近100条）
        if (this.sharingBehaviorInfo.shareHistory.length > 100) {
          this.sharingBehaviorInfo.shareHistory = this.sharingBehaviorInfo.shareHistory.slice(-100);
        }
      }

      // 保存到本地存储
      await this.saveSharingBehavior();

      // 尝试上传到后端
      await this.uploadShareRecords();
    } catch (error) {
      console.error('[SharingBehaviorService] 记录分享行为失败:', error);
    }
  }

  /**
   * 分享词汇
   */
  public async shareVocabulary(word: string, definition: string, channel: ShareChannel): Promise<boolean> {
    try {
      const content = `我学会了新单词 "${word}"：${definition}`;
      const success = await this.performShare(content, channel);
      
      await this.recordShare('vocabulary', channel, content, success);
      return success;
    } catch (error) {
      console.error('[SharingBehaviorService] 分享词汇失败:', error);
      await this.recordShare('vocabulary', channel, `词汇: ${word}`, false);
      return false;
    }
  }

  /**
   * 分享学习进度
   */
  public async shareProgress(level: number, wordsLearned: number, streak: number, channel: ShareChannel): Promise<boolean> {
    try {
      const content = `我的学习进度：等级 ${level}，已学 ${wordsLearned} 个单词，连续学习 ${streak} 天！`;
      const success = await this.performShare(content, channel);
      
      await this.recordShare('progress', channel, content, success);
      return success;
    } catch (error) {
      console.error('[SharingBehaviorService] 分享学习进度失败:', error);
      await this.recordShare('progress', channel, `进度: 等级${level}`, false);
      return false;
    }
  }

  /**
   * 分享成就
   */
  public async shareAchievement(achievementName: string, description: string, channel: ShareChannel): Promise<boolean> {
    try {
      const content = `🎉 我获得了新成就：${achievementName} - ${description}`;
      const success = await this.performShare(content, channel);
      
      await this.recordShare('achievements', channel, content, success);
      return success;
    } catch (error) {
      console.error('[SharingBehaviorService] 分享成就失败:', error);
      await this.recordShare('achievements', channel, `成就: ${achievementName}`, false);
      return false;
    }
  }

  /**
   * 分享剧集
   */
  public async shareShow(showName: string, status: string, channel: ShareChannel): Promise<boolean> {
    try {
      const content = `我正在看《${showName}》，状态：${status}`;
      const success = await this.performShare(content, channel);
      
      await this.recordShare('shows', channel, content, success);
      return success;
    } catch (error) {
      console.error('[SharingBehaviorService] 分享剧集失败:', error);
      await this.recordShare('shows', channel, `剧集: ${showName}`, false);
      return false;
    }
  }

  /**
   * 分享单词本
   */
  public async shareWordbook(wordbookName: string, wordCount: number, channel: ShareChannel): Promise<boolean> {
    try {
      const content = `我的单词本《${wordbookName}》包含 ${wordCount} 个单词`;
      const success = await this.performShare(content, channel);
      
      await this.recordShare('wordbook', channel, content, success);
      return success;
    } catch (error) {
      console.error('[SharingBehaviorService] 分享单词本失败:', error);
      await this.recordShare('wordbook', channel, `单词本: ${wordbookName}`, false);
      return false;
    }
  }

  /**
   * 执行分享操作
   */
  private async performShare(content: string, channel: ShareChannel): Promise<boolean> {
    try {
      switch (channel) {
        case 'copyLink':
          // 复制到剪贴板
          const Clipboard = require('@react-native-clipboard/clipboard').default;
          await Clipboard.setString(content);
          Alert.alert('已复制', '内容已复制到剪贴板');
          return true;

        case 'wechat':
        case 'weibo':
        case 'qq':
        case 'other':
          // 使用系统分享
          const result = await Share.share({
            message: content,
            title: 'DramaWord 学习分享'
          });
          
          return result.action === Share.sharedAction;

        default:
          console.warn('[SharingBehaviorService] 未知的分享渠道:', channel);
          return false;
      }
    } catch (error) {
      console.error('[SharingBehaviorService] 执行分享失败:', error);
      return false;
    }
  }

  /**
   * 获取分享统计信息
   */
  public getSharingStats(): {
    totalShares: number;
    mostUsedChannel: ShareChannel | null;
    mostSharedType: ShareType | null;
    recentShares: ShareRecord[];
  } {
    if (!this.sharingBehaviorInfo) {
      return {
        totalShares: 0,
        mostUsedChannel: null,
        mostSharedType: null,
        recentShares: []
      };
    }

    const { shareTypes, shareChannels, shareHistory } = this.sharingBehaviorInfo;

    // 找出最常用的分享渠道
    const mostUsedChannel = Object.entries(shareChannels).reduce((max, [channel, count]) => 
      count > shareChannels[max as ShareChannel] ? channel : max
    , Object.keys(shareChannels)[0]) as ShareChannel;

    // 找出最常分享的类型
    const mostSharedType = Object.entries(shareTypes).reduce((max, [type, count]) => 
      count > shareTypes[max as ShareType] ? type : max
    , Object.keys(shareTypes)[0]) as ShareType;

    // 获取最近的分享记录（最近10条）
    const recentShares = shareHistory.slice(-10).reverse();

    return {
      totalShares: this.sharingBehaviorInfo.totalShares,
      mostUsedChannel,
      mostSharedType,
      recentShares
    };
  }

  /**
   * 加载本地存储的分享行为信息
   */
  private async loadStoredSharingBehavior(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('sharingBehaviorInfo');
      if (stored) {
        const parsed = JSON.parse(stored);
        // 转换日期字符串为Date对象
        if (parsed.shareHistory) {
          parsed.shareHistory = parsed.shareHistory.map((record: any) => ({
            ...record,
            date: new Date(record.date)
          }));
        }
        if (parsed.lastShareDate) {
          parsed.lastShareDate = new Date(parsed.lastShareDate);
        }
        this.sharingBehaviorInfo = parsed;
      } else {
        // 初始化默认值
        this.sharingBehaviorInfo = {
          totalShares: 0,
          shareTypes: {
            vocabulary: 0,
            progress: 0,
            achievements: 0,
            shows: 0,
            wordbook: 0
          },
          shareChannels: {
            wechat: 0,
            weibo: 0,
            qq: 0,
            copyLink: 0,
            other: 0
          },
          shareHistory: []
        };
      }
    } catch (error) {
      console.error('[SharingBehaviorService] 加载本地分享行为信息失败:', error);
      this.sharingBehaviorInfo = {
        totalShares: 0,
        shareTypes: {
          vocabulary: 0,
          progress: 0,
          achievements: 0,
          shows: 0,
          wordbook: 0
        },
        shareChannels: {
          wechat: 0,
          weibo: 0,
          qq: 0,
          copyLink: 0,
          other: 0
        },
        shareHistory: []
      };
    }
  }

  /**
   * 保存分享行为信息到本地存储
   */
  private async saveSharingBehavior(): Promise<void> {
    try {
      if (this.sharingBehaviorInfo) {
        await AsyncStorage.setItem('sharingBehaviorInfo', JSON.stringify(this.sharingBehaviorInfo));
      }
    } catch (error) {
      console.error('[SharingBehaviorService] 保存分享行为信息失败:', error);
    }
  }

  /**
   * 上传分享记录到后端
   */
  private async uploadShareRecords(): Promise<void> {
    try {
      if (this.shareQueue.length === 0) return;

      const userData = await AsyncStorage.getItem('userData');
      if (!userData) return;

      const { id: userId, token } = JSON.parse(userData);
      if (!userId || !token) return;

      const response = await fetch(`${API_BASE_URL}/users/${userId}/sharing-behavior`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shareRecords: this.shareQueue
        })
      });

      if (response.ok) {
        console.log('[SharingBehaviorService] 分享记录上传成功');
        this.shareQueue = []; // 清空队列
      } else {
        console.error('[SharingBehaviorService] 分享记录上传失败:', response.status);
      }
    } catch (error) {
      console.error('[SharingBehaviorService] 上传分享记录失败:', error);
    }
  }

  /**
   * 获取分享行为统计信息
   */
  public getSharingBehaviorInfo(): SharingBehaviorInfo | null {
    return this.sharingBehaviorInfo;
  }

  /**
   * 清除分享行为数据
   */
  public async clearSharingBehavior(): Promise<void> {
    try {
      this.sharingBehaviorInfo = {
        totalShares: 0,
        shareTypes: {
          vocabulary: 0,
          progress: 0,
          achievements: 0,
          shows: 0,
          wordbook: 0
        },
        shareChannels: {
          wechat: 0,
          weibo: 0,
          qq: 0,
          copyLink: 0,
          other: 0
        },
        shareHistory: []
      };
      
      this.shareQueue = [];
      
      await AsyncStorage.removeItem('sharingBehaviorInfo');
      console.log('[SharingBehaviorService] 分享行为数据已清除');
    } catch (error) {
      console.error('[SharingBehaviorService] 清除分享行为数据失败:', error);
    }
  }
}

export const sharingBehaviorService = SharingBehaviorService.getInstance();
export default sharingBehaviorService;
