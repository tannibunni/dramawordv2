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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import AppLanguageSelector from '../../components/profile/AppLanguageSelector';
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
import { DataSyncService } from '../../services/dataSyncService';
import { cacheService, CACHE_KEYS } from '../../services/cacheService';


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
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onLogout,
  onEditProfile,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const { vocabulary, clearVocabulary } = useVocabulary();
  const { shows, clearShows } = useShowList();
  const { navigate } = useNavigation();
  const { user, loginType, isAuthenticated, logout: authLogout, login } = useAuth();
  const { appLanguage } = useAppLanguage();
  const userService = UserService.getInstance();

  // 获取用户头像
  const getUserAvatar = () => {
    console.log('🔍 getUserAvatar 调试信息:', {
      user: user,
      loginType: loginType,
      isAuthenticated: isAuthenticated
    });

    if (!user || !loginType) {
      // 返回本地默认游客头像
      return require('../../../assets/images/guest-avatar.png');
    }

    // 根据登录类型返回不同的默认头像
    switch (loginType) {
      case 'wechat':
        return 'https://via.placeholder.com/80/1AAD19/FFFFFF?text=WeChat';
      case 'apple':
        return 'https://via.placeholder.com/80/000000/FFFFFF?text=Apple';
      case 'phone':
        return 'https://via.placeholder.com/80/007AFF/FFFFFF?text=Phone';
      case 'guest':
      default:
        // 返回本地默认游客头像
        return require('../../../assets/images/guest-avatar.png');
    }
  };

  // 获取用户昵称
  const getUserNickname = () => {
    if (!user || !loginType) {
      return t('guest_user', appLanguage);
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
        return t('guest_user', appLanguage);
    }
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

  // 保存通知偏好设置
  const saveNotificationPreferences = async (preferences: NotificationPreferences) => {
    try {
      await notificationService.saveNotificationPreferences(preferences);
      console.log('💾 通知偏好设置已保存');
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

  const handleLoginPress = () => {
    // 使用自定义导航跳转到登录页面
    navigate('login');
  };

  const renderUserInfo = () => {
    const isGuest = !isAuthenticated || !user;
    
    return (
      <View style={styles.userSection}>
        <View style={styles.userHeader}>
          <Image
            key={`avatar-${loginType}-${isAuthenticated}`}
            source={getUserAvatar()}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{getUserNickname()}</Text>
            <Text style={styles.userLevel}>{t('intermediate_learner', appLanguage)}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            
            {/* 登录/退出登录按钮 - 放在邮箱下面 */}
            {isGuest ? (
              <TouchableOpacity 
                style={styles.userActionButton} 
                onPress={handleLoginPress}
              >
                <Ionicons name="log-in-outline" size={18} color={colors.text.inverse} />
                <Text style={styles.userActionButtonText}>{t('login', appLanguage)}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.userActionButton, styles.logoutButton]} 
                onPress={authLogout}
              >
                <Ionicons name="log-out-outline" size={18} color={colors.text.inverse} />
                <Text style={styles.userActionButtonText}>{t('logout', appLanguage)}</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={20} color={colors.primary[500]} />
          </TouchableOpacity>
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

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="help-circle-outline" size={24} color={colors.primary[500]} />
          <Text style={styles.settingLabel}>{t('help_feedback', appLanguage)}</Text>
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

      {/* 数据管理 */}
      <TouchableOpacity style={styles.settingItem} onPress={handleClearWordCache}>
        <View style={styles.settingLeft}>
          <Ionicons name="refresh-outline" size={24} color={colors.accent[500]} />
          <Text style={[styles.settingText, { color: colors.accent[500] }]}>清除单词缓存</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.neutral[500]} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={handleClearAllData}>
        <View style={styles.settingLeft}>
          <Ionicons name="trash-outline" size={24} color={colors.error[500]} />
          <Text style={[styles.settingText, { color: colors.error[500] }]}>{t('clear_all_data', appLanguage)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.neutral[500]} />
      </TouchableOpacity>
    </View>
  );

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const handleProfileUpdate = (updatedUser: any) => {
    // 用户信息现在由 AuthContext 管理，这里不需要设置
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

  const handleClearWordCache = async () => {
    setClearingCache(true);
    try {
      // 使用统一缓存服务清除单词详情缓存
      await cacheService.clearPrefix(CACHE_KEYS.WORD_DETAIL);
      
      // 获取缓存统计信息
      const stats = await cacheService.getStats();
      Alert.alert('清除成功', `已清除单词缓存\n内存缓存: ${stats.memorySize} 项\n存储缓存: ${stats.storageSize} 项`);
      console.log('🗑️ 单词缓存清除完成，缓存统计:', stats);
    } catch (error) {
      console.error('清除单词缓存失败:', error);
      Alert.alert('清除失败', '清除单词缓存时发生错误');
    } finally {
      setClearingCache(false);
    }
  };

  const handleClearAllData = async () => {
    Alert.alert(
      t('clear_all_data', appLanguage),
      t('confirm_clear_data', appLanguage),
      [
        { text: t('cancel', appLanguage), style: 'cancel' },
        { 
          text: t('confirm', appLanguage), 
          style: 'destructive', 
          onPress: async () => {
            try {
              // 清除词汇数据
              await clearVocabulary();
              
              // 清除剧集数据
              await clearShows();
              
              // 清除搜索历史
              await wordService.clearSearchHistory();
              
              // 清除用户学习数据
              await learningDataService.clearAll();
              await LearningStatsService.clearAll();
              await DataSyncService.getInstance().clearAll();
              
              // 清除用户设置
              await AsyncStorage.multiRemove([
                'user_settings',
                'learning_records',
                'review_sessions',
                'app_settings',
                'selected_language',
                'language_progress',
                'search_history',
                'user_token',
                'user_profile'
              ]);
              
              Alert.alert(t('clear_success', appLanguage), t('all_data_cleared', appLanguage));
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

  const renderSubscriptionEntry = () => (
    <TouchableOpacity style={styles.subscriptionBtn} onPress={handleGoToSubscription} activeOpacity={0.85}>
      <Text style={styles.subscriptionBtnText}>{t('member_subscription', appLanguage)}</Text>
    </TouchableOpacity>
  );

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
                {`
# 关于剧词记\n\n👋 你好，我是 Tanny，一名独立开发者，也是一位爱看剧、爱学英语、爱记词的人。\n\n在追剧的时候，我经常遇到这些问题：\n\n- 看到一个单词查了意思，下一集就忘了  \n- 想系统复习，但总是拖延、不知道从哪开始  \n- 背的单词没语境，记得慢，忘得快  \n\n于是我想：能不能做一个工具，**让我们在看剧的时候就能主动积累词汇，并用简单、有趣的方式复习巩固？**\n\n这就是 **剧词记** 的由来 🎬📖\n\n---\n\n## 我希望它能帮你做到：\n\n- **随时记录你在剧中遇到的生词**  \n- **一键生成地道例句和释义**  \n- **像打游戏一样复习单词，解锁成就与习惯感**  \n- 不再孤独地学词，而是在你热爱的剧中自然成长 🌱\n\n---\n\n## 👩‍💻 关于我\n\n我一个人完成了这个 App 的全部功能开发、UI 设计和内容文案。  \n这是一个从 0 开始的尝试，也是我很想坚持的长期项目。\n\n如果你喜欢它，或者有任何建议/吐槽，欢迎随时联系我！\n\n---\n\n## 📮 联系方式\n\n- 微信公众号：**剧词记**  \n- 邮箱：tanny@example.com  \n- 小红书 / Instagram：@dramaword（如有）\n\n---\n\n## 🔐 用户承诺\n\n- 我不会收集或贩卖你的学习数据  \n- App 永远不会插入打扰式广告  \n- 我会认真听取每一条反馈，让它变得更好\n\n---\n\n🎁 如果你愿意支持我，可以选择订阅、推荐给朋友，或留下你的评价。  \n这会成为我继续更新剧词记的最大动力 ❤️\n\n---\n\n> 谢谢你使用剧词记，愿你在每一部剧里，不止看到故事，也看到自己的进步。\n                `}
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
  userLevel: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '600',
    marginBottom: 4,
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
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary[500],
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  loginButtonText: {
    color: colors.background.primary,
    fontWeight: '600',
    fontSize: 14,
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
  subscriptionBtn: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.primary[500],
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
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
}); 