import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import notificationService, { NotificationPreferences } from '../../services/notificationService';
import { useAppLanguage } from '../../context/AppLanguageContext';

interface NotificationManagerProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({
  visible,
  onClose,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { appLanguage } = useAppLanguage();

  // 翻译函数
  const t = (key: string): string => {
    const translations = {
      'enable_notifications': appLanguage === 'zh-CN' ? '启用通知' : 'Enable Notifications',
      'notification_permission_required': appLanguage === 'zh-CN' ? '需要通知权限' : 'Notification Permission Required',
      'permission_denied': appLanguage === 'zh-CN' ? '权限被拒绝' : 'Permission Denied',
      'notifications_enabled': appLanguage === 'zh-CN' ? '通知已启用' : 'Notifications enabled',
      'notifications_disabled': appLanguage === 'zh-CN' ? '通知已禁用' : 'Notifications disabled',
      'ok': appLanguage === 'zh-CN' ? '确定' : 'OK',
    };
    
    return translations[key as keyof typeof translations] || key;
  };

  useEffect(() => {
    if (visible) {
      loadNotificationPreferences();
    }
  }, [visible]);

  // 当应用语言改变时，更新通知服务的语言设置
  useEffect(() => {
    notificationService.setAppLanguage(appLanguage);
  }, [appLanguage]);

  // 加载通知偏好设置
  const loadNotificationPreferences = async () => {
    try {
      const preferences = await notificationService.loadNotificationPreferences();
      setNotificationsEnabled(preferences.notificationsEnabled);
      console.log('📱 通知偏好设置已加载到UI');
    } catch (error) {
      console.error('❌ 加载通知偏好设置失败:', error);
    }
  };

  // 保存通知偏好设置
  const saveNotificationPreferences = async (preferences: NotificationPreferences) => {
    try {
      await notificationService.saveNotificationPreferences(preferences);
      console.log('💾 通知偏好设置已保存');
    } catch (error) {
      console.error('❌ 保存通知偏好设置失败:', error);
    }
  };

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      // 用户想要启用通知
      const hasPermission = await notificationService.requestPermissions();
      if (hasPermission) {
        // 启用通知时，后台服务会自动设置所有子通知
        const newPreferences: NotificationPreferences = {
          notificationsEnabled: true,
          dailyReminder: true,
          weeklyReminder: true,
          motivationReminder: true,
          streakReminder: true,
        };
        setNotificationsEnabled(true);
        await saveNotificationPreferences(newPreferences);
        
        // 只保存用户偏好，不立即设置任何通知
        // 通知会在适当的时候自动触发，避免立即推送
      } else {
        Alert.alert(
          t('notification_permission_required'),
          t('permission_denied'),
          [{ text: t('ok') }]
        );
      }
    } else {
      // 用户想要禁用通知
      const newPreferences: NotificationPreferences = {
        notificationsEnabled: false,
        dailyReminder: false,
        weeklyReminder: false,
        motivationReminder: false,
        streakReminder: false,
      };
      setNotificationsEnabled(false);
      await saveNotificationPreferences(newPreferences);
      await notificationService.cancelAllNotifications();
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Ionicons name="notifications-outline" size={24} color={colors.primary[500]} />
        <Text style={styles.settingLabel}>{t('enable_notifications')}</Text>
      </View>
      <Switch
        value={notificationsEnabled}
        onValueChange={handleNotificationToggle}
        trackColor={{ false: colors.border.light, true: colors.primary[300] }}
        thumbColor={notificationsEnabled ? colors.primary[500] : colors.text.tertiary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

export default NotificationManager; 