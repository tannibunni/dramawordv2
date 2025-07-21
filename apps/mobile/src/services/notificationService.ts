import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLanguage } from '../constants/translations';

// 配置通知行为
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationConfig {
  id: string;
  title: string;
  body: string;
  data?: any;
  trigger?: any;
}

export interface NotificationPreferences {
  notificationsEnabled: boolean;
  dailyReminder: boolean;
  weeklyReminder: boolean;
  motivationReminder: boolean;
  streakReminder: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private appLanguage: AppLanguage = 'zh-CN';
  private readonly PREFERENCES_KEY = 'notification_preferences';

  // 设置应用语言
  setAppLanguage(language: AppLanguage) {
    this.appLanguage = language;
  }

  // 保存通知偏好设置
  async saveNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
      console.log('✅ 通知偏好设置已保存:', preferences);
    } catch (error) {
      console.error('❌ 保存通知偏好设置失败:', error);
      throw error;
    }
  }

  // 加载通知偏好设置
  async loadNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const preferencesJson = await AsyncStorage.getItem(this.PREFERENCES_KEY);
      if (preferencesJson) {
        const preferences = JSON.parse(preferencesJson);
        console.log('✅ 通知偏好设置已加载:', preferences);
        return preferences;
      } else {
        // 默认设置 - 所有通知默认关闭
        const defaultPreferences: NotificationPreferences = {
          notificationsEnabled: false,
          dailyReminder: false,
          weeklyReminder: false,
          motivationReminder: false,
          streakReminder: false,
        };
        console.log('📝 使用默认通知偏好设置（所有通知默认关闭）:', defaultPreferences);
        return defaultPreferences;
      }
    } catch (error) {
      console.error('❌ 加载通知偏好设置失败:', error);
      // 返回默认设置 - 所有通知默认关闭
      return {
        notificationsEnabled: false,
        dailyReminder: false,
        weeklyReminder: false,
        motivationReminder: false,
        streakReminder: false,
      };
    }
  }

  // 检查用户是否启用了通知（结合系统权限和用户偏好）
  async checkUserNotificationStatus(): Promise<boolean> {
    try {
      const preferences = await this.loadNotificationPreferences();
      const hasSystemPermission = await this.requestPermissions();
      
      // 用户偏好和系统权限都必须为 true
      const isEnabled = preferences.notificationsEnabled && hasSystemPermission;
      console.log('🔍 通知状态检查:', {
        userPreference: preferences.notificationsEnabled,
        systemPermission: hasSystemPermission,
        finalStatus: isEnabled
      });
      
      return isEnabled;
    } catch (error) {
      console.error('❌ 检查用户通知状态失败:', error);
      return false;
    }
  }

  // 翻译函数
  private t = (key: string): string => {
    const isChinese = this.appLanguage === 'zh-CN';
    const translations = {
      'review_reminder': isChinese ? '复习提醒' : 'Review Reminder',
      'daily_review': isChinese ? '每日复习时间到了！' : 'Time for daily review!',
      'weekly_review': isChinese ? '本周复习总结' : 'Weekly Review Summary',
      'new_words': isChinese ? '新单词等你学习' : 'New words waiting for you',
      'streak_reminder': isChinese ? '保持学习连续' : 'Keep your learning streak',
      'achievement': isChinese ? '学习成就' : 'Learning Achievement',
      'motivation': isChinese ? '学习激励' : 'Learning Motivation',
      'review_now': isChinese ? '立即复习' : 'Review Now',
      'continue_learning': isChinese ? '继续学习' : 'Continue Learning',
      'check_progress': isChinese ? '查看进度' : 'Check Progress',
      'daily_goal': isChinese ? '每日目标' : 'Daily Goal',
      'weekly_goal': isChinese ? '每周目标' : 'Weekly Goal',
      'monthly_goal': isChinese ? '每月目标' : 'Monthly Goal',
      'time_to_review': isChinese ? '该复习了' : 'Time to Review',
      'keep_streak': isChinese ? '保持连续学习' : 'Keep Your Streak',
      'new_achievement': isChinese ? '新成就解锁' : 'New Achievement Unlocked',
      'learning_reminder': isChinese ? '学习提醒' : 'Learning Reminder',
      'vocabulary_growth': isChinese ? '词汇增长' : 'Vocabulary Growth',
      'practice_makes_perfect': isChinese ? '熟能生巧' : 'Practice Makes Perfect',
      'knowledge_power': isChinese ? '知识就是力量' : 'Knowledge is Power',
    };
    
    return translations[key as keyof typeof translations] || key;
  };

  // 获取单例实例
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 请求通知权限
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('❌ 推送通知需要真机设备');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ 推送通知权限被拒绝');
      return false;
    }

    console.log('✅ 推送通知权限已获取');
    return true;
  }

  // 获取推送令牌
  async getPushToken(): Promise<string | null> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.log('❌ 未找到项目ID');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('✅ 推送令牌:', token.data);
      return token.data;
    } catch (error) {
      console.error('❌ 获取推送令牌失败:', error);
      return null;
    }
  }

  // 发送本地通知
  async scheduleLocalNotification(config: NotificationConfig): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: config.id,
        content: {
          title: config.title,
          body: config.body,
          data: config.data || {},
          sound: 'default',
        },
        trigger: config.trigger || null,
      });

      console.log('✅ 本地通知已安排:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('❌ 安排本地通知失败:', error);
      throw error;
    }
  }

  // 取消通知
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('✅ 通知已取消:', notificationId);
    } catch (error) {
      console.error('❌ 取消通知失败:', error);
    }
  }

  // 取消所有通知
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ 所有通知已取消');
    } catch (error) {
      console.error('❌ 取消所有通知失败:', error);
    }
  }

  // 获取所有已安排的通知
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('📋 已安排的通知数量:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('❌ 获取已安排通知失败:', error);
      return [];
    }
  }

  // 每日复习提醒
  async scheduleDailyReview(hour: number = 9, minute: number = 0): Promise<string> {
    const config: NotificationConfig = {
      id: 'daily_review_reminder',
      title: this.t('review_reminder'),
      body: this.t('daily_review'),
      data: { type: 'daily_review' },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    };

    return this.scheduleLocalNotification(config);
  }

  // 每周复习总结
  async scheduleWeeklyReview(weekday: number = 1, hour: number = 10, minute: number = 0): Promise<string> {
    const config: NotificationConfig = {
      id: 'weekly_review_summary',
      title: this.t('weekly_review'),
      body: this.t('check_progress'),
      data: { type: 'weekly_review' },
      trigger: {
        weekday,
        hour,
        minute,
        repeats: true,
      },
    };

    return this.scheduleLocalNotification(config);
  }

  // 温和的复习提醒（如果用户超过3天没有学习）
  async scheduleGentleReviewReminder(): Promise<string> {
    const config: NotificationConfig = {
      id: 'gentle_review_reminder',
      title: this.t('review_reminder'),
      body: this.t('time_to_review'),
      data: { type: 'gentle_review' },
      trigger: {
        seconds: 3 * 24 * 60 * 60, // 3天后
        repeats: false,
      },
    };

    return this.scheduleLocalNotification(config);
  }

  // 学习连续提醒（如果用户超过7天没有学习）
  async scheduleStreakReminder(): Promise<string> {
    const config: NotificationConfig = {
      id: 'streak_reminder',
      title: this.t('streak_reminder'),
      body: this.t('keep_streak'),
      data: { type: 'streak_reminder' },
      trigger: {
        seconds: 7 * 24 * 60 * 60, // 7天后
        repeats: false,
      },
    };

    return this.scheduleLocalNotification(config);
  }

  // 新单词提醒（如果用户添加了新单词，2天后提醒）
  async scheduleNewWordsReminder(): Promise<string> {
    const config: NotificationConfig = {
      id: 'new_words_reminder',
      title: this.t('new_words'),
      body: this.t('review_now'),
      data: { type: 'new_words' },
      trigger: {
        seconds: 2 * 24 * 60 * 60, // 2天后
        repeats: false,
      },
    };

    return this.scheduleLocalNotification(config);
  }

  // 成就解锁提醒（温和提醒）
  async scheduleAchievementNotification(achievementName: string): Promise<string> {
    const config: NotificationConfig = {
      id: `achievement_${Date.now()}`,
      title: this.t('new_achievement'),
      body: `${achievementName} - ${this.t('achievement')}`,
      data: { type: 'achievement', achievement: achievementName },
      trigger: {
        seconds: 30 * 60, // 30分钟后显示，温和提醒
        repeats: false,
      },
    };

    return this.scheduleLocalNotification(config);
  }

  // 学习激励提醒（每周一次，温和提醒）
  async scheduleMotivationReminder(): Promise<string> {
    const motivationalMessages = [
      this.t('practice_makes_perfect'),
      this.t('knowledge_power'),
      this.t('vocabulary_growth'),
      this.t('learning_reminder'),
    ];

    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    
    const config: NotificationConfig = {
      id: `motivation_${Date.now()}`,
      title: this.t('motivation'),
      body: randomMessage,
      data: { type: 'motivation' },
      trigger: {
        seconds: 7 * 24 * 60 * 60, // 7天后，每周一次
        repeats: false,
      },
    };

    return this.scheduleLocalNotification(config);
  }

  // 目标提醒（温和提醒，只在用户有明确目标时）
  async scheduleGoalReminder(goalType: 'daily' | 'weekly' | 'monthly', progress: number, target: number): Promise<string> {
    const percentage = Math.round((progress / target) * 100);
    const remaining = target - progress;
    
    let title: string;
    let body: string;
    
    switch (goalType) {
      case 'daily':
        title = this.t('daily_goal');
        body = this.appLanguage === 'zh-CN' 
          ? `今日进度: ${percentage}%，还需学习 ${remaining} 个单词`
          : `Today's progress: ${percentage}%, ${remaining} words to go`;
        break;
      case 'weekly':
        title = this.t('weekly_goal');
        body = this.appLanguage === 'zh-CN' 
          ? `本周进度: ${percentage}%，还需学习 ${remaining} 个单词`
          : `This week's progress: ${percentage}%, ${remaining} words to go`;
        break;
      case 'monthly':
        title = this.t('monthly_goal');
        body = this.appLanguage === 'zh-CN' 
          ? `本月进度: ${percentage}%，还需学习 ${remaining} 个单词`
          : `This month's progress: ${percentage}%, ${remaining} words to go`;
        break;
    }

    const config: NotificationConfig = {
      id: `goal_${goalType}_${Date.now()}`,
      title,
      body,
      data: { type: 'goal_reminder', goalType, progress, target },
      trigger: {
        seconds: 24 * 60 * 60, // 24小时后，温和提醒
        repeats: false,
      },
    };

    return this.scheduleLocalNotification(config);
  }

  // 智能复习提醒（基于用户学习模式，更温和）
  async scheduleSmartReviewReminder(lastStudyTime: Date, averageStudyInterval: number): Promise<string> {
    const timeSinceLastStudy = Date.now() - lastStudyTime.getTime();
    const shouldRemind = timeSinceLastStudy > averageStudyInterval * 1.5; // 如果超过平均间隔的150%

    if (!shouldRemind) {
      return '';
    }

    const config: NotificationConfig = {
      id: `smart_review_${Date.now()}`,
      title: this.t('time_to_review'),
      body: this.t('continue_learning'),
      data: { type: 'smart_review' },
      trigger: {
        seconds: 2 * 60 * 60, // 2小时后，温和提醒
        repeats: false,
      },
    };

    return this.scheduleLocalNotification(config);
  }

  // 监听通知事件
  addNotificationListener(callback: (notification: Notifications.Notification) => void): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // 监听通知响应事件
  addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export default NotificationService.getInstance(); 