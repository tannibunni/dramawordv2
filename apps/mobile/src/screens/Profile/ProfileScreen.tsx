import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  Switch,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import AppLanguageSelector from '../../components/profile/AppLanguageSelector';
import { FeedbackModal } from '../../components/profile/FeedbackModal';
import { DeleteAccountModal } from '../../components/profile/DeleteAccountModal';
import { ShareAppModal } from '../../components/profile/ShareAppModal';

import { UserService } from '../../services/userService';
import { useVocabulary } from '../../context/VocabularyContext';
import { useShowList } from '../../context/ShowListContext';
import { wordService } from '../../services/wordService';
import { colors } from '../../constants/colors';
import { useNavigation } from '../../components/navigation/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LearningStatsSection } from '../../components/learning/LearningStatsSection';
import SubscriptionScreen from './SubscriptionScreen';
import notificationService, { NotificationPreferences } from '../../services/notificationService';
import { learningDataService } from '../../services/learningDataService';
import { LearningStatsService } from '../../services/learningStatsService';
import { unifiedSyncService } from '../../services/unifiedSyncService';
import { cacheService, CACHE_KEYS } from '../../services/cacheService';
import { getAboutUsContent } from '../../utils/aboutUsContent';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import DataSyncIndicator from '../../components/common/DataSyncIndicator';
import { clearDataService } from '../../services/clearDataService';
import { subscriptionService } from '../../services/subscriptionService';
import { guestIdService } from '../../services/guestIdService';
import { BadgeEntrySection, useBadges } from '../../features/badges';
import FeatureAccessService from '../../services/featureAccessService';
import { UpgradeModal } from '../../components/common/UpgradeModal';
import { AppleCrossDeviceSyncService } from '../../services/appleCrossDeviceSyncService';



interface UserStats {
  totalWords: number;
  masteredWords: number;
  learningDays: number;
  currentStreak: number;
  totalReviews: number;
  accuracy: number;
}

interface ProfileScreenProps {
  onLogout?: () => void;
  onEditProfile?: () => void;
  openLanguageSettings?: boolean;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onLogout,
  onEditProfile,
  openLanguageSettings = false,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [shareAppModalVisible, setShareAppModalVisible] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);
  const [crossDeviceSyncStatus, setCrossDeviceSyncStatus] = useState<any>(null);


  const { vocabulary, clearVocabulary } = useVocabulary();
  const { shows, clearShows } = useShowList();
  const { navigate } = useNavigation();
  const { user, loginType, isAuthenticated, logout: authLogout, login, updateUser } = useAuth();
  const { appLanguage } = useAppLanguage();
  const userService = UserService.getInstance();
  
  // 徽章系统
  const { badges, userProgress, loading: badgesLoading } = useBadges(user?.id || 'guest');

  // 自动打开语言设置
  useEffect(() => {
    if (openLanguageSettings) {
      setLanguageModalVisible(true);
    }
  }, [openLanguageSettings]);

  // 加载跨设备同步状态
  useEffect(() => {
    if (loginType === 'apple') {
      loadCrossDeviceSyncStatus();
    }
  }, [loginType]);

  // 加载跨设备同步状态
  const loadCrossDeviceSyncStatus = async () => {
    try {
      const crossDeviceService = AppleCrossDeviceSyncService.getInstance();
      const status = crossDeviceService.getSyncStatus();
      setCrossDeviceSyncStatus(status);
    } catch (error) {
      console.error('❌ 加载跨设备同步状态失败:', error);
    }
  };

  // 初始化订阅服务
  useEffect(() => {
    const initializeSubscription = async () => {
      try {
        await subscriptionService.initialize();
        const status = await subscriptionService.checkSubscriptionStatus();
        setSubscriptionStatus(status);
        
        // 注册状态变化回调
        const unsubscribe = subscriptionService.registerStateCallback((newStatus) => {
          setSubscriptionStatus(newStatus);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('[ProfileScreen] 订阅服务初始化失败:', error);
      }
    };

    initializeSubscription();
  }, []);

  // 获取用户头像
  const getUserAvatar = () => {
    console.log('🔍 getUserAvatar 调试信息:', {
      user: user,
      loginType: loginType,
      isAuthenticated: isAuthenticated,
      hasUserAvatar: !!(user?.avatar && user.avatar !== ''),
      userAvatarUrl: user?.avatar
    });

    // 如果用户有自定义头像，优先使用
    if (user?.avatar && user.avatar !== '') {
      const normalizedAvatarUrl = normalizeImageUrl(user.avatar);
      console.log('🔍 使用用户自定义头像:', normalizedAvatarUrl);
      return { uri: normalizedAvatarUrl };
    }

    if (!user || !loginType) {
      // 返回本地默认游客头像
      console.log('🔍 使用默认游客头像 - 原因: 无用户或无登录类型');
      return require('../../../assets/images/guest-avatar.png');
    }

    // 根据登录类型返回不同的默认头像
    switch (loginType) {
      case 'wechat':
        console.log('🔍 使用微信头像');
        return require('../../../assets/images/wechat-avatar.png');
      case 'apple':
        console.log('🔍 使用苹果头像');
        return require('../../../assets/images/apple-avatar.png');
      case 'phone':
        console.log('🔍 使用手机头像');
        return require('../../../assets/images/phone-avatar.png');
      case 'guest':
      default:
        // 返回本地默认游客头像
        console.log('🔍 使用游客头像 - 原因: 登录类型为', loginType);
        return require('../../../assets/images/guest-avatar.png');
    }
  };

  // 获取用户昵称
  const getUserNickname = () => {
    if (!user || !loginType) {
      // 为游客生成简单的ID
      return 'Guest';
    }

    // 游客用户直接显示用户ID
    if (loginType === 'guest' && user.nickname) {
      return user.nickname; // 这里显示的是用户ID
    }

    if (user.nickname) {
      return user.nickname;
    }

    switch (loginType) {
      case 'wechat':
        return t('wechat_user', appLanguage);
      case 'apple':
        return t('apple_user', appLanguage);
      case 'phone':
        return t('phone_user', appLanguage);
      case 'guest':
      default:
        // 游客模式使用统一的服务
        return 'Guest';
    }
  };

  // 获取会员状态信息
  const getMembershipInfo = () => {
    if (!subscriptionStatus) return null;

    if (subscriptionStatus.isActive) {
      // 付费会员
      const planType = subscriptionStatus.productId?.includes('monthly') ? 'Monthly' : 
                      subscriptionStatus.productId?.includes('quarterly') ? 'Quarterly' :
                      subscriptionStatus.productId?.includes('yearly') ? 'Yearly' : 'Premium';
      
      // 计算到期日期 - 假设从当前时间开始计算
      const now = new Date();
      let expiryDate = new Date();
      if (subscriptionStatus.productId?.includes('monthly')) {
        expiryDate.setMonth(now.getMonth() + 1);
      } else if (subscriptionStatus.productId?.includes('quarterly')) {
        expiryDate.setMonth(now.getMonth() + 3);
      } else if (subscriptionStatus.productId?.includes('yearly')) {
        expiryDate.setFullYear(now.getFullYear() + 1);
      }
      
      const formattedDate = expiryDate.toLocaleDateString(appLanguage === 'zh-CN' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: appLanguage === 'zh-CN' ? 'long' : 'short',
        day: 'numeric'
      });

      return {
        type: 'premium',
        duration: planType,
        expiryDate: formattedDate
      };
    } else if (subscriptionStatus.isTrial && subscriptionStatus.trialEndsAt) {
      // 试用会员
      const timeLeft = new Date(subscriptionStatus.trialEndsAt).getTime() - new Date().getTime();
      const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      
      const formattedDate = new Date(subscriptionStatus.trialEndsAt).toLocaleDateString(appLanguage === 'zh-CN' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: appLanguage === 'zh-CN' ? 'long' : 'short',
        day: 'numeric'
      });

      return {
        type: 'trial',
        duration: `${daysLeft} ${appLanguage === 'zh-CN' ? '天' : 'days'}`,
        expiryDate: formattedDate
      };
    }

    return null;
  };



  // 模拟用户数据（当真实数据未加载时使用）
  const defaultUserData = {
    nickname: '学习达人',
    avatar: 'https://via.placeholder.com/80',
    email: 'user@example.com',
    joinDate: '2024年1月',
    level: t('intermediate_learner', appLanguage),
    loginType: 'guest',
  };

  // 获取用户数据
  useEffect(() => {
    setLoading(false);
    loadNotificationPreferences();
    
    // 设置APP关闭时同步
    setupAppCloseSync();
  }, []);

  // 监听 AuthContext 状态变化
  useEffect(() => {
    console.log('🔍 ProfileScreen AuthContext 状态变化:', {
      user: user,
      loginType: loginType,
      isAuthenticated: isAuthenticated
    });
  }, [user, loginType, isAuthenticated]);

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

  // 保存通知偏好设置 - 通过多邻国数据同步方案
  const saveNotificationPreferences = async (preferences: NotificationPreferences) => {
    try {
      // 先保存到本地
      await notificationService.saveNotificationPreferences(preferences);
      console.log('💾 通知偏好设置已保存到本地');
      
      // 通过多邻国数据同步方案同步到云端
      if (user?.id) {
        await unifiedSyncService.addToSyncQueue({
          type: 'userSettings',
          data: {
            notificationPreferences: preferences,
            lastUpdated: Date.now()
          },
          userId: user.id,
          operation: 'update',
          priority: 'medium'
        });
        
        console.log('🔄 通知偏好设置已加入同步队列');
      }
    } catch (error) {
      console.error('❌ 保存通知偏好设置失败:', error);
    }
  };

  // 模拟统计数据
  const stats: UserStats = {
    totalWords: 1250,
    masteredWords: 890,
    learningDays: 45,
    currentStreak: 12,
    totalReviews: 3200,
    accuracy: 87,
  };

  // 恢复登录功能
  const handleLoginPress = () => {
    // 游客模式下，传递升级标记
    const isGuest = !isAuthenticated || !user || loginType === 'guest';
    if (isGuest) {
      navigate('login', { upgradeFromGuest: true });
    } else {
      navigate('login');
    }
  };



  const renderUserInfo = () => {
    // 当前版本使用自动生成的游客ID，无需登录按钮
    const isGuest = !isAuthenticated || !user || loginType === 'guest';

    
    return (
      <View style={styles.userSection}>
        <View style={styles.userHeader}>
          <Image
            key={`avatar-${loginType}-${isAuthenticated}`}
            source={getUserAvatar()}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.userName}>{getUserNickname()}</Text>
              {/* VIP皇冠图标 - 仅对付费会员显示 */}
              {subscriptionStatus?.isActive && (
                <View style={styles.vipCrownContainer}>
                  <Ionicons 
                    name="diamond" 
                    size={18} 
                    color="#FFD700" 
                    style={styles.vipCrownIcon}
                  />
                </View>
              )}
              <View style={{ marginLeft: 8 }}>
                <DataSyncIndicator visible={true} showDetails={false} />
              </View>
              <TouchableOpacity style={styles.editButtonInline} onPress={handleEditProfile}>
                <Ionicons name="pencil" size={16} color={colors.primary[500]} />
              </TouchableOpacity>
            </View>

            {/* 会员时效信息 */}
            {getMembershipInfo() && (
              <View style={styles.membershipInfoContainer}>
                <Text style={styles.membershipInfo}>
                  {getMembershipInfo()?.type === 'premium' 
                    ? `${getMembershipInfo()?.duration} ${appLanguage === 'zh-CN' ? '会员' : 'Member'}`
                    : `${getMembershipInfo()?.duration} ${appLanguage === 'zh-CN' ? '试用剩余' : 'trial remaining'}`
                  } • {appLanguage === 'zh-CN' ? '到期日' : 'Expires'}: {getMembershipInfo()?.expiryDate}
                </Text>
              </View>
            )}

            {/* 游客模式提醒 */}
            {isGuest && (
              <Text style={styles.guestReminder}>
                {appLanguage === 'zh-CN' 
                  ? '注册即可同步进度，解锁更多功能' 
                  : 'Sign up to sync progress & unlock features'
                }
              </Text>
            )}

            {!isGuest && (
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            )}
            
            {/* 原位置的指示器移除，已移动到用户名后 */}
            
            {/* 登录/退出登录按钮 - 已恢复 */}
                          {isGuest ? (
               <TouchableOpacity 
                 style={styles.loginButton} 
                 onPress={handleLoginPress}
                 activeOpacity={0.8}
               >
                 <Ionicons name="log-in-outline" size={16} color={colors.primary[600]} />
                 <Text style={styles.loginButtonText}>{t('login', appLanguage)}</Text>
               </TouchableOpacity>
              ) : (
              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={authLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={16} color={colors.primary[600]} />
                <Text style={styles.loginButtonText}>{t('logout', appLanguage)}</Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </View>
    );
  };

  const renderSettings = () => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>{t('settings', appLanguage)}</Text>
      
      {/* 推送通知设置 */}
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="notifications-outline" size={24} color={colors.primary[500]} />
          <Text style={styles.settingLabel}>{t('push_notifications', appLanguage)}</Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={handleNotificationToggle}
          trackColor={{ false: colors.border.light, true: colors.primary[300] }}
          thumbColor={notificationsEnabled ? colors.primary[500] : colors.text.tertiary}
        />
      </View>

      <TouchableOpacity 
        style={styles.settingItem}
        onPress={() => setLanguageModalVisible(true)}
      >
        <View style={styles.settingLeft}>
          <Ionicons name="language-outline" size={24} color={colors.primary[500]} />
          <Text style={styles.settingLabel}>{t('language_settings', appLanguage)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.neutral[500]} />
      </TouchableOpacity>

      {/* 分享应用 */}
      <TouchableOpacity 
        style={styles.settingItem}
        onPress={() => setShareAppModalVisible(true)}
      >
        <View style={styles.settingLeft}>
          <Ionicons name="share-social-outline" size={24} color={colors.primary[500]} />
          <Text style={styles.settingLabel}>{t('share_app', appLanguage)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.neutral[500]} />
      </TouchableOpacity>

      {/* Apple ID跨设备同步 - 仅对Apple用户显示 */}
      {loginType === 'apple' && (
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => handleCrossDeviceSync()}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="cloudy-outline" size={24} color={colors.primary[500]} />
            <Text style={styles.settingLabel}>
              {appLanguage === 'zh-CN' ? '跨设备同步' : 'Cross-Device Sync'}
            </Text>
          </View>
          <View style={styles.settingLeft}>
            {crossDeviceSyncStatus?.isSyncing ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.neutral[500]} />
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* 订阅管理 - 仅对付费订阅会员显示 */}
      {subscriptionStatus?.isActive && (
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={handleGoToSubscription}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="diamond" size={24} color={colors.primary[500]} />
            <Text style={styles.settingLabel}>{t('manage_subscription', appLanguage)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.neutral[500]} />
        </TouchableOpacity>
      )}



      <TouchableOpacity 
        style={styles.settingItem}
        onPress={() => setFeedbackModalVisible(true)}
      >
        <View style={styles.settingLeft}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primary[500]} />
          <Text style={styles.settingLabel}>
            {appLanguage === 'zh-CN' ? '反馈问题' : 'Feedback'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.neutral[500]} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={() => setAboutModalVisible(true)}>
        <View style={styles.settingLeft}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary[500]} />
          <Text style={styles.settingLabel}>{t('about_us', appLanguage)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.neutral[500]} />
      </TouchableOpacity>

      {/* 清除用户数据 */}
      <TouchableOpacity style={styles.settingItem} onPress={handleClearLocalData}>
        <View style={styles.settingLeft}>
          <Ionicons name="trash-bin-outline" size={24} color={colors.error[500]} />
          <Text style={[styles.settingText, { color: colors.error[500] }]}>
            {appLanguage === 'zh-CN' ? '清除用户数据' : 'Clear User Data'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.neutral[500]} />
      </TouchableOpacity>



      {/* 完全清除所有数据（仅开发模式可见） */}
      {__DEV__ && (
        <TouchableOpacity style={styles.settingItem} onPress={handleClearAllData}>
          <View style={styles.settingLeft}>
            <Ionicons name="trash-outline" size={24} color={colors.error[500]} />
            <Text style={[styles.settingText, { color: colors.error[500] }]}>
              {appLanguage === 'zh-CN' ? '完全清除所有数据' : 'Clear All Data Completely'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.neutral[500]} />
        </TouchableOpacity>
      )}

      {/* 注销账户 - 仅对已登录用户显示 */}
      {isAuthenticated && loginType !== 'guest' && (
        <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
          <View style={styles.settingLeft}>
            <Ionicons name="person-remove-outline" size={24} color={colors.error[500]} />
            <Text style={[styles.settingText, { color: colors.error[500] }]}>
              {appLanguage === 'zh-CN' ? '注销账户' : 'Delete Account'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.neutral[500]} />
        </TouchableOpacity>
      )}

      {/* 开发模式测试按钮 */}
      {__DEV__ && (
        <View style={styles.devTestSection}>
          <Text style={styles.devTestSectionTitle}>🧪 开发测试</Text>
          
          {/* 订阅状态测试按钮 */}
          <TouchableOpacity 
            style={styles.devTestButton} 
            onPress={() => handleTestSubscriptionState('trial_expired')}
          >
            <Ionicons name="time" size={20} color={colors.white} />
            <Text style={styles.devTestButtonText}>模拟试用期到期</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.devTestButton} 
            onPress={() => handleTestSubscriptionState('premium_monthly')}
          >
            <Ionicons name="diamond" size={20} color={colors.white} />
            <Text style={styles.devTestButtonText}>模拟付费会员</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.devTestButton} 
            onPress={() => handleTestSubscriptionState('trial_active')}
          >
            <Ionicons name="refresh" size={20} color={colors.white} />
            <Text style={styles.devTestButtonText}>重置为试用期</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.devTestButton} 
            onPress={handleClearTestState}
          >
            <Ionicons name="trash" size={20} color={colors.white} />
            <Text style={styles.devTestButtonText}>清除测试状态</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const handleProfileUpdate = async (updatedUser: any) => {
    console.log('📝 用户资料更新:', updatedUser);
    
    // 更新AuthContext中的用户数据
    if (updatedUser && user) {
      // 确保updatedUser是扁平化的用户数据，不是嵌套对象
      const userData = updatedUser.user || updatedUser;
      
      // 合并用户数据
      const mergedUser = {
        ...user,
        ...userData
      };
      
      // 更新本地存储
      userService.saveUserLoginInfo(mergedUser, loginType || 'guest');
      
      // 使用AuthContext的updateUser方法更新用户数据
      updateUser(userData);
      
      // 通过多邻国数据同步方案同步用户资料到云端
      if (user?.id) {
        try {
          await unifiedSyncService.addToSyncQueue({
            type: 'userSettings',
            data: {
              profile: {
                nickname: mergedUser.nickname,
                avatar: mergedUser.avatar,
                email: mergedUser.email,
                lastUpdated: Date.now()
              }
            },
            userId: user.id,
            operation: 'update',
            priority: 'medium'
          });
          
          console.log('🔄 用户资料已加入同步队列');
        } catch (error: any) {
          console.error('❌ 用户资料同步失败:', error);
        }
      }
      
      console.log('✅ 用户资料更新完成');
      
      // 强制重新渲染Profile页面
      // 通过设置一个状态来触发重新渲染
      setLoading(true);
      setTimeout(() => setLoading(false), 100);
    }
    
    setEditModalVisible(false);
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
          appLanguage === 'zh-CN' ? '需要通知权限' : 'Notification Permission Required',
          appLanguage === 'zh-CN' ? '权限被拒绝' : 'Permission Denied',
          [{ text: t('ok', appLanguage) }]
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

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      // 清除 AsyncStorage 中的缓存数据
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.includes('cache') || 
        key.includes('temp') || 
        key.includes('search_history')
      );
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        Alert.alert('清除成功', '缓存数据已清除');
      } else {
        Alert.alert('提示', '没有找到需要清除的缓存数据');
      }
    } catch (error) {
      console.error('清除缓存失败:', error);
      Alert.alert('清除失败', '清除缓存时发生错误');
    } finally {
      setClearingCache(false);
    }
  };

  // 清除本地存储的所有数据
  const handleClearLocalData = async () => {
    Alert.alert(
      appLanguage === 'zh-CN' ? '清除用户数据' : 'Clear User Data',
      appLanguage === 'zh-CN' 
        ? '这将删除：\n• 历史搜索数据\n• 剧单\n• 单词本\n• 已储存的单词\n\n但会保留：\n• 经验数据\n• 学习数据\n\n确定要继续吗？'
        : 'This will delete:\n• Search history\n• Shows\n• Vocabulary\n• Saved words\n\nBut will keep:\n• Experience data\n• Learning data\n\nAre you sure you want to continue?',
      [
        { text: t('cancel', appLanguage), style: 'cancel' },
        { 
          text: t('confirm', appLanguage), 
          style: 'destructive', 
          onPress: async () => {
            try {
              console.log('🗑️ 开始清除用户数据（保留经验和学习数据）...');
              
              // 清除词汇数据
              await clearVocabulary();
              
              // 清除剧集数据
              await clearShows();
              
              // 清除搜索历史
              await wordService.clearSearchHistory();
              
              // 清除单词缓存
              await cacheService.clearPrefix(CACHE_KEYS.WORD_DETAIL);
              
              // 只清除部分AsyncStorage数据（保留经验和学习数据）
              await AsyncStorage.multiRemove([
                'search_history',
                'user_shows',
                'vocabulary',
                'bookmarks',
                'wrongWords'
              ]);
              
              console.log('✅ 用户数据清除完成（经验和学习数据已保留）');
              Alert.alert(
                appLanguage === 'zh-CN' ? '清除成功' : 'Clear Successful', 
                appLanguage === 'zh-CN' ? '用户数据已清除（经验和学习数据已保留）' : 'User data cleared (experience and learning data preserved)'
              );
            } catch (error) {
              console.error('清除用户数据失败:', error);
              Alert.alert(
                appLanguage === 'zh-CN' ? '清除失败' : 'Clear Failed', 
                appLanguage === 'zh-CN' ? '清除数据时发生错误' : 'Error occurred while clearing data'
              );
            }
          }
        },
      ]
    );
  };


  // 测试订阅状态处理函数
  const handleTestSubscriptionState = async (state: 'trial_expired' | 'premium_monthly' | 'trial_active') => {
    if (!__DEV__) return;
    
    try {
      // 导入测试服务
      const SubscriptionTestService = (await import('../../services/subscriptionTestService')).default;
      
      await SubscriptionTestService.setTestState(state);
      
      // 刷新订阅状态
      const newStatus = await subscriptionService.checkSubscriptionStatus();
      setSubscriptionStatus(newStatus);
      
      // 显示成功提示
      const stateNames = {
        'trial_expired': '试用期已结束',
        'premium_monthly': '付费会员',
        'trial_active': '试用期激活'
      };
      
      Alert.alert(
        '测试状态已更新',
        `已切换到: ${stateNames[state]}`,
        [{ text: '确定' }]
      );
    } catch (error) {
      console.error('设置测试状态失败:', error);
      Alert.alert('错误', '设置测试状态失败');
    }
  };

  const handleClearTestState = async () => {
    if (!__DEV__) return;
    
    try {
      const SubscriptionTestService = (await import('../../services/subscriptionTestService')).default;
      await SubscriptionTestService.clearTestState();
      
      // 刷新订阅状态
      const newStatus = await subscriptionService.checkSubscriptionStatus();
      setSubscriptionStatus(newStatus);
      
      Alert.alert('成功', '已清除测试状态');
    } catch (error) {
      console.error('清除测试状态失败:', error);
      Alert.alert('错误', '清除测试状态失败');
    }
  };

  const handleClearAllData = async () => {
    // 额外的开发模式保护
    if (!__DEV__) {
      console.warn('⚠️ 尝试在生产模式下调用完全清除数据函数');
      return;
    }
    
    Alert.alert(
      appLanguage === 'zh-CN' ? '⚠️ 完全清除确认' : '⚠️ Complete Clear Confirmation',
      appLanguage === 'zh-CN' 
        ? '这将删除该用户ID下的所有数据：\n• 历史搜索数据\n• 剧单\n• 单词本\n• 已储存的单词\n• 经验数据\n• 学习数据\n• 储存语言\n\n⚠️ 此操作不可逆！确定要继续吗？'
        : 'This will delete all data under this user ID:\n• Search history\n• Shows\n• Vocabulary\n• Saved words\n• Experience data\n• Learning data\n• Stored languages\n\n⚠️ This operation cannot be undone! Are you sure you want to continue?',
      [
        { text: t('cancel', appLanguage), style: 'cancel' },
        { 
          text: appLanguage === 'zh-CN' ? '完全清除' : 'Clear Completely', 
          style: 'destructive', 
          onPress: async () => {
            try {
              // 通过多邻国数据同步方案清除云端数据
              if (user?.id) {
                console.log('🗑️ 开始通过多邻国数据同步方案清除云端数据，用户ID:', user.id);
                
                try {
                  // 清除词汇数据
                  await unifiedSyncService.addToSyncQueue({
                    type: 'vocabulary',
                    data: [],
                    userId: user.id,
                    operation: 'delete',
                    priority: 'high'
                  });
                  
                  // 清除用户统计数据
                  await unifiedSyncService.addToSyncQueue({
                    type: 'userStats',
                    data: {
                      level: 1,
                      totalReviews: 0,
                      currentStreak: 0,
                      lastUpdated: Date.now()
                    },
                    userId: user.id,
                    operation: 'update',
                    priority: 'high'
                  });
                  
                  // 清除搜索历史
                  await unifiedSyncService.addToSyncQueue({
                    type: 'searchHistory',
                    data: [],
                    userId: user.id,
                    operation: 'delete',
                    priority: 'high'
                  });
                  
                  // 清除学习记录
                  await unifiedSyncService.addToSyncQueue({
                    type: 'learningRecords',
                    data: [],
                    userId: user.id,
                    operation: 'delete',
                    priority: 'high'
                  });
                  
                  // 执行同步
                  await unifiedSyncService.syncPendingData();
                  
                  console.log('✅ 通过多邻国数据同步方案清除云端数据成功');
                } catch (error) {
                  console.error('❌ 通过多邻国数据同步方案清除云端数据失败:', error);
                }
              }
              
              // 清除本地数据
              console.log('🗑️ 开始清除本地数据...');
              
              // 清除词汇数据
              await clearVocabulary();
              
              // 清除剧集数据
              await clearShows();
              
              // 清除搜索历史
              console.log('🗑️ 开始清除搜索历史...');
              const searchHistoryCleared = await wordService.clearSearchHistory();
              console.log('🗑️ 搜索历史清除结果:', searchHistoryCleared);
              
              // 清除用户学习数据
              await learningDataService.clearAll();
              await LearningStatsService.clearAll();
              await unifiedSyncService.clearSyncQueue();
              
              // 清除单词缓存（使用统一缓存服务）
              await cacheService.clearPrefix(CACHE_KEYS.WORD_DETAIL);
              
              // 清除用户设置和所有相关数据
              await AsyncStorage.multiRemove([
                // 用户基础数据
                'userData',
                'loginType',
                'userToken',
                'guestId',
                'user_settings',
                'user_profile',
                'userStats',
                'userExperienceInfo',
                'userBadges',
                // 学习数据
                'learning_records',
                'learningRecords',
                'learningLanguages',
                // Review相关数据
                'review_sessions',
                'pendingExperienceGain',
                'lastReviewIntroInit',
                'lastExperienceCheck',
                'lastRecordedExperience',
                'experienceState',
                'progressBarValue',
                'hasInitializedProgressBar',
                'refreshVocabulary',
                // Daily Rewards数据
                'dailyRewards',
                'dailyRewardsResetDate',
                // 词汇和内容数据
                'vocabulary',
                'user_shows',
                'wrong_words_collection',
                'wrongWords',
                'bookmarks',
                'cachedRecommendations',
                // 搜索和历史数据
                'search_history',
                'searchHistory',
                // 设置和配置
                'app_settings',
                'selected_language',
                'language_progress',
                // 订阅数据
                'subscription_status',
                'subscription_record',
                // 同步数据
                'unifiedSyncQueue',
                'deviceId',
                'lastSyncTime',
                'lastAppCloseSync',
                // 其他临时数据
                'initialLanguageSetup'
              ]);
              
              // 清除Daily Rewards的特定日期键
              console.log('🗑️ 开始清除Daily Rewards的特定日期键...');
              try {
                const allKeys = await AsyncStorage.getAllKeys();
                const dailyRewardsKeys = allKeys.filter(key => 
                  key.startsWith('newWords_') || 
                  key.startsWith('dailyReview_') || 
                  key.startsWith('studyTime_') || 
                  key.startsWith('perfectReview_') ||
                  key.includes('currentStreak')
                );
                console.log('🗑️ 找到的Daily Rewards特定键:', dailyRewardsKeys);
                if (dailyRewardsKeys.length > 0) {
                  await AsyncStorage.multiRemove(dailyRewardsKeys);
                  console.log('🗑️ Daily Rewards特定键清除完成');
                }
              } catch (error) {
                console.log('🗑️ 清除Daily Rewards特定键时出错:', error);
              }
              
              // 验证搜索历史是否已清除
              console.log('🔍 验证搜索历史清除状态...');
              try {
                const remainingSearchHistory = await AsyncStorage.getItem('search_history');
                console.log('🔍 清除后的search_history状态:', remainingSearchHistory);
                const recentWords = await wordService.getRecentWords();
                console.log('🔍 清除后getRecentWords结果:', recentWords);
              } catch (error) {
                console.log('🔍 验证搜索历史清除状态时出错:', error);
              }
              
              // 获取缓存统计信息
              const stats = await cacheService.getStats();
              console.log('🗑️ 清除所有数据完成，缓存统计:', stats);
              
              Alert.alert(
                appLanguage === 'zh-CN' ? '清除成功' : 'Clear Successful', 
                appLanguage === 'zh-CN' ? '所有用户数据已完全清除' : 'All user data has been completely cleared'
              );
            } catch (error) {
              console.error('清除所有数据失败:', error);
              Alert.alert(t('clear_failed', appLanguage), t('clear_error', appLanguage));
            }
          }
        },
      ]
    );
  };

  const handleGoToSubscription = () => {
    navigate('Subscription');
  };

  const handleDeleteAccount = () => {
    setDeleteAccountModalVisible(true);
  };

  // 处理跨设备同步
  const handleCrossDeviceSync = async () => {
    try {
      console.log('🍎 用户点击跨设备同步...');
      
      const crossDeviceService = AppleCrossDeviceSyncService.getInstance();
      const success = await crossDeviceService.manualSync();
      
      if (success) {
        // 更新同步状态
        setCrossDeviceSyncStatus(crossDeviceService.getSyncStatus());
        Alert.alert(
          '同步成功',
          '您的数据已成功同步到云端，其他设备可以获取最新数据。',
          [{ text: '好的' }]
        );
      } else {
        Alert.alert(
          '同步失败',
          '跨设备同步失败，请检查网络连接后重试。',
          [{ text: '重试', onPress: handleCrossDeviceSync }, { text: '取消' }]
        );
      }
    } catch (error) {
      console.error('❌ 跨设备同步失败:', error);
      Alert.alert('错误', '同步过程中发生错误，请重试');
    }
  };

  // 新增：设置APP关闭时同步
  const setupAppCloseSync = () => {
    // 监听APP状态变化
    const handleAppStateChange = (nextAppState: string) => {
      console.log('🔄 [ProfileScreen] AppState 变化:', nextAppState);
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('🔄 [ProfileScreen] APP进入后台，开始同步数据...');
        syncOnAppClose();
      }
    };
    
    // 添加AppState监听器
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // 返回清理函数
    return () => {
      subscription?.remove();
    };
  };

  // 新增：APP关闭时同步数据
  const syncOnAppClose = async () => {
    try {
      console.log('🔄 [ProfileScreen] 开始APP关闭时同步...');
      console.log('🔄 [ProfileScreen] 当前用户ID:', user?.id);
      console.log('🔄 [ProfileScreen] 当前登录类型:', loginType);
      
      const userId = user?.id;
      if (!userId) {
        console.log('⚠️ [ProfileScreen] 用户未登录，跳过APP关闭同步');
        return;
      }
      
      // 检查是否真的需要同步（避免频繁触发）
      const lastSync = await AsyncStorage.getItem('lastAppCloseSync');
      const now = Date.now();
      if (lastSync && (now - parseInt(lastSync)) < 30000) { // 30秒内不重复同步
        console.log('⚠️ [ProfileScreen] 30秒内已同步过，跳过重复同步');
        return;
      }
      
      // 获取所有需要同步的本地数据
      const syncTasks = [];
      
      // 1. 同步用户统计数据
      const localStatsData = await AsyncStorage.getItem('userStats');
      if (localStatsData) {
        const localStats = JSON.parse(localStatsData);
        syncTasks.push(
          unifiedSyncService.addToSyncQueue({
            type: 'userStats',
            data: {
              ...localStats,
              lastUpdated: Date.now()
            },
            userId: userId,
            operation: 'update',
            priority: 'high'  // 关闭时使用高优先级
          })
        );
      }
      
      // 2. 同步通知偏好设置
      const notificationPrefs = await notificationService.loadNotificationPreferences();
      syncTasks.push(
        unifiedSyncService.addToSyncQueue({
          type: 'userSettings',
          data: {
            notificationPreferences: notificationPrefs,
            lastUpdated: Date.now()
          },
          userId: userId,
          operation: 'update',
          priority: 'high'
        })
      );
      
      // 3. 同步词汇数据
      if (vocabulary && vocabulary.length > 0) {
        syncTasks.push(
          unifiedSyncService.addToSyncQueue({
            type: 'vocabulary',
            data: vocabulary.map(word => ({
              ...word,
              lastUpdated: Date.now()
            })),
            userId: userId,
            operation: 'update',
            priority: 'high'
          })
        );
      }
      
      // 4. 同步剧集数据
      if (shows && shows.length > 0) {
        syncTasks.push(
          unifiedSyncService.addToSyncQueue({
            type: 'shows',
            data: shows.map(show => ({
              ...show,
              lastUpdated: Date.now()
            })),
            userId: userId,
            operation: 'update',
            priority: 'high'
          })
        );
      }
      
      // 5. 同步搜索历史
      const searchHistory = await wordService.getRecentWords();
      if (searchHistory && searchHistory.length > 0) {
        syncTasks.push(
          unifiedSyncService.addToSyncQueue({
            type: 'searchHistory',
            data: searchHistory.map(item => ({
              ...item,
              lastUpdated: Date.now()
            })),
            userId: userId,
            operation: 'update',
            priority: 'medium'
          })
        );
      }
      
      // 执行所有同步任务
      await Promise.all(syncTasks);
      
      // 执行统一同步
      await unifiedSyncService.syncPendingData();
      
      console.log('✅ APP关闭时同步数据完成');
      
      // 记录同步时间
      await AsyncStorage.setItem('lastAppCloseSync', Date.now().toString());
      
    } catch (error) {
      console.error('❌ APP关闭时同步数据失败:', error);
    }
  };

  const handleAccountDeleted = () => {
    // 清除所有本地数据
    clearVocabulary();
    clearShows();
    
    // 退出登录
    authLogout();
    
    // 显示成功消息
    Alert.alert('账户已注销', '您的账户已成功删除，感谢您使用剧词记！');
  };

  const handleViewAllBadges = async () => {
    console.log('[ProfileScreen] 用户点击VIEW ALL徽章按钮，检查功能权限');
    const canAccess = await FeatureAccessService.checkAndHandleAccess('badges');
    if (!canAccess) {
      console.log('[ProfileScreen] 徽章功能被锁定，显示升级弹窗');
      setLockedFeature('badges');
      setUpgradeModalVisible(true);
      return;
    }
    console.log('[ProfileScreen] 徽章功能权限通过，导航到徽章墙');
    navigate('badgeWall');
  };

  const renderSubscriptionEntry = () => {
    // 付费订阅会员不显示订阅板块
    if (subscriptionStatus?.isActive) {
      return null;
    }

    // 根据订阅状态显示不同内容
    const getSubscriptionIcon = () => {
      if (subscriptionStatus?.isTrial) {
        return 'time';
      } else {
        return 'phone-portrait';
      }
    };

    const getSubscriptionTitle = () => {
      if (subscriptionStatus?.isTrial) {
        return t('trial_user', appLanguage);
      } else {
        return t('free_user', appLanguage);
      }
    };

    const getSubscriptionDesc = () => {
      if (subscriptionStatus?.isTrial && subscriptionStatus?.trialEndsAt) {
        const timeLeft = new Date(subscriptionStatus.trialEndsAt).getTime() - new Date().getTime();
        const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        return t('trial_countdown', appLanguage, { days: daysLeft }) + '，' + t('enjoy_all_features', appLanguage);
      } else {
        return t('trial_ended_limitations', appLanguage);
      }
    };

    const getButtonText = () => {
      if (subscriptionStatus?.isTrial) {
        return t('subscribe_now', appLanguage);
      } else {
        return t('start_trial', appLanguage);
      }
    };

    return (
      <View style={styles.subscriptionSection}>
        <View style={styles.subscriptionHeader}>
          <View style={styles.subscriptionTitleContainer}>
            <Ionicons 
              name={getSubscriptionIcon()} 
              size={20} 
              color={subscriptionStatus?.isTrial ? '#FF9500' : '#666666'} 
              style={styles.subscriptionTitleIcon}
            />
            <Text style={styles.subscriptionTitle}>
              {getSubscriptionTitle()}
            </Text>
          </View>
          <Text style={styles.subscriptionDesc}>
            {getSubscriptionDesc()}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.subscriptionBtn} 
          onPress={handleGoToSubscription}
          activeOpacity={0.8}
        >
          <Text style={styles.subscriptionBtnText}>
            {getButtonText()}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
        
        
        {/* 免费版功能限制提示 */}
        {subscriptionStatus && !subscriptionStatus.isActive && !subscriptionStatus.isTrial && (
          <View style={styles.freeVersionTip}>
            <Ionicons name="lock-closed" size={16} color="#FF6B6B" />
            <Text style={styles.freeVersionTipText}>
              免费版仅支持中英文查词，升级解锁全部功能
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>{t('loading', appLanguage)}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {renderUserInfo()}
        {renderSubscriptionEntry()}
        {/* 徽章入口区块 */}
        {!badgesLoading && badges.length > 0 && (
          <BadgeEntrySection
            badges={badges}
            userProgress={userProgress}
            onViewAll={handleViewAllBadges}
          />
        )}
        {/* {renderStats()} 学习统计板块已删除 */}
        {renderSettings()}
      </ScrollView>
      
      {/* 编辑个人信息模态框 */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onUpdate={handleProfileUpdate}
        user={{
          id: user?.id || 'guest',
          nickname: user?.nickname || getUserNickname(),
          avatar: user?.avatar,
          email: user?.email,
        }}
      />
      
      {/* 应用语言选择器 */}
      <AppLanguageSelector
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
        defaultTab={openLanguageSettings ? 'learning' : 'app'}
      />
      
      {/* 反馈模态框 */}
      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
      />

      {/* 注销账户模态框 */}
      <DeleteAccountModal
        visible={deleteAccountModalVisible}
        onClose={() => setDeleteAccountModalVisible(false)}
        onAccountDeleted={handleAccountDeleted}
      />


      

      
      {/* 升级弹窗 */}
      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        feature={lockedFeature as any}
        onUpgrade={() => {
          setUpgradeModalVisible(false);
          navigate('Subscription');
        }}
      />

      {/* 分享应用弹窗 */}
      <ShareAppModal
        visible={shareAppModalVisible}
        onClose={() => setShareAppModalVisible(false)}
      />

      {/* 关于我们弹窗 */}
      <Modal
        visible={aboutModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '90%', maxHeight: '80%', backgroundColor: colors.background.primary, borderRadius: 18, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.primary[500] }}>{t('about_dramaword', appLanguage)}</Text>
              <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={true}>
              <Text style={{ color: colors.text.primary, fontSize: 15, lineHeight: 24 }}>
                {getAboutUsContent()}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  // header 样式已不再使用，可以保留或删除
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24, // 增加顶部边距
    paddingBottom: 20, // 增加底部边距
  },
  userSection: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  vipCrownContainer: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipCrownIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  membershipInfoContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  membershipInfo: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
    lineHeight: 16,
  },

  userEmail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 12,
    color: colors.neutral[500],
  },
     loginButton: {
     marginTop: 12,
     paddingVertical: 10,
     paddingHorizontal: 20,
     backgroundColor: colors.primary[50], // 非常浅的蓝色背景
     borderRadius: 20, // 更圆润的边角
     alignSelf: 'flex-start',
     borderWidth: 1,
     borderColor: colors.primary[300], // 细边框
     flexDirection: 'row',
     alignItems: 'center',
     shadowColor: colors.primary[200],
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.1,
     shadowRadius: 2,
     elevation: 1,
   },
   loginButtonText: {
     color: colors.primary[600], // 蓝色文字，与图标颜色一致
     fontWeight: '600',
     fontSize: 14,
     marginLeft: 6, // 图标和文字之间的间距
   },
  loggedInText: {
    color: colors.success[500],
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
  },
  editButtonInline: {
    marginLeft: 8,
    padding: 4,
  },
  guestReminder: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  syncIndicatorContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  statsSection: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary[500],
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.neutral[100],
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  accuracySection: {
    alignItems: 'center',
  },
  accuracyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  accuracyDisplay: {
    alignItems: 'center',
  },
  accuracyNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.success[500],
    marginBottom: 4,
  },
  accuracyLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  settingsSection: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 12,
    fontWeight: '500',
  },
  settingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginLeft: 12,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  section: {
    marginBottom: 20,
  },
  subscriptionSection: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  subscriptionHeader: {
    marginBottom: 16,
  },
  subscriptionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionTitleIcon: {
    marginRight: 8,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  subscriptionDesc: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  subscriptionBtn: {
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.primary[200],
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  subscriptionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  guestSubscriptionTip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  guestSubscriptionTipText: {
    fontSize: 12,
    color: colors.primary[600],
    marginLeft: 8,
    lineHeight: 16,
  },
  trialCountdownTip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  trialCountdownTipText: {
    fontSize: 12,
    color: '#F57C00',
    marginLeft: 8,
    lineHeight: 16,
    fontWeight: '600',
  },
  freeVersionTip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  freeVersionTipText: {
    fontSize: 12,
    color: '#D32F2F',
    marginLeft: 8,
    lineHeight: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 10,
    color: colors.text.secondary,
    fontSize: 16,
  },
  userActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    width: '100%',
    marginTop: 12,
  },
  userActionButtonText: {
    color: colors.text.inverse,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: colors.error[500],
  },

  // 开发测试相关样式
  devTestSection: {
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  devTestSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  devTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: colors.primary[200],
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  devTestButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

}); 