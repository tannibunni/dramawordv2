import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { UserService } from '../../services/userService';
import { useVocabulary } from '../../context/VocabularyContext';
import { useShowList } from '../../context/ShowListContext';
import { wordService } from '../../services/wordService';
import { colors } from '../../constants/colors';
import { useNavigation } from '../../components/navigation/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LearningStatsSection } from '../../components/learning/LearningStatsSection';
import SubscriptionScreen from './SubscriptionScreen';

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
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const { vocabulary, clearVocabulary } = useVocabulary();
  const { shows, clearShows } = useShowList();
  const { navigate } = useNavigation();
  const { user, loginType, isAuthenticated, logout: authLogout, login } = useAuth();
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
      return '游客用户';
    }

    if (user.nickname) {
      return user.nickname;
    }

    switch (loginType) {
      case 'wechat':
        return '微信用户';
      case 'apple':
        return 'Apple用户';
      case 'phone':
        return '手机用户';
      case 'guest':
      default:
        return '游客用户';
    }
  };

  // 模拟用户数据（当真实数据未加载时使用）
  const defaultUserData = {
    nickname: '学习达人',
    avatar: 'https://via.placeholder.com/80',
    email: 'user@example.com',
    joinDate: '2024年1月',
    level: '中级学习者',
    loginType: 'guest',
  };

  // 获取用户数据
  useEffect(() => {
    setLoading(false);
  }, []);

  // 监听 AuthContext 状态变化
  useEffect(() => {
    console.log('🔍 ProfileScreen AuthContext 状态变化:', {
      user: user,
      loginType: loginType,
      isAuthenticated: isAuthenticated
    });
  }, [user, loginType, isAuthenticated]);

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
            <Text style={styles.userLevel}>中级学习者</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            <Text style={styles.joinDate}>加入时间: 2024年1月</Text>
            {/* 登录按钮或用户名 */}
            {isGuest ? (
              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={handleLoginPress}
              >
                <Text style={styles.loginButtonText}>登录</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.loggedInText}>已登录：{user?.nickname || '用户'}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={20} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // const renderStats = () => (
  //   <LearningStatsSection
  //     onBadgePress={(badge) => {
  //       console.log('奖章被点击:', badge);
  //     }}
  //   />
  // );

  const renderSettings = () => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>设置</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="notifications-outline" size={24} color={colors.primary[500]} />
          <Text style={styles.settingLabel}>推送通知</Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
          thumbColor={notificationsEnabled ? colors.background.secondary : colors.background.secondary}
        />
      </View>

      {/* 深色模式按钮和菜单项已隐藏 */}
      {/* <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="moon-outline" size={24} color={colors.primary[500]} />
          <Text style={styles.settingLabel}>深色模式</Text>
        </View>
        <Switch
          value={darkModeEnabled}
          onValueChange={setDarkModeEnabled}
          trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
          thumbColor={darkModeEnabled ? colors.background.secondary : colors.background.secondary}
        />
      </View> */}

      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="play-outline" size={24} color={colors.primary[500]} />
          <Text style={styles.settingLabel}>自动播放音频</Text>
        </View>
        <Switch
          value={autoPlayEnabled}
          onValueChange={setAutoPlayEnabled}
          trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
          thumbColor={autoPlayEnabled ? colors.background.secondary : colors.background.secondary}
        />
      </View>

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="language-outline" size={24} color={colors.primary[500]} />
          <Text style={styles.settingLabel}>语言设置</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.neutral[500]} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="help-circle-outline" size={24} color={colors.primary[500]} />
          <Text style={styles.settingLabel}>帮助与反馈</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.neutral[500]} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={() => setAboutModalVisible(true)}>
        <View style={styles.settingLeft}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary[500]} />
          <Text style={styles.settingLabel}>关于我们</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.neutral[500]} />
      </TouchableOpacity>

      {/* 数据管理 */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleClearAllData}
          disabled={clearingCache}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="trash-outline" size={20} color={colors.error[500]} />
            <Text style={[styles.settingText, { color: colors.error[500] }]}>清除所有数据</Text>
          </View>
          {clearingCache ? (
            <ActivityIndicator size="small" color={colors.error[500]} />
          ) : (
            <Ionicons name="chevron-forward" size={16} color={colors.error[500]} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const handleProfileUpdate = (updatedUser: any) => {
    // 用户信息现在由 AuthContext 管理，这里不需要设置
    console.log('用户资料已更新:', updatedUser);
  };

  const handleClearCache = async () => {
    Alert.alert(
      '清除缓存',
      '确定要清除所有缓存数据吗？这将删除所有本地存储的剧集、词汇和学习数据。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除所有数据',
          style: 'destructive',
          onPress: async () => {
            setClearingCache(true);
            try {
              // 导入 DataSyncService
              const { DataSyncService } = require('../../services/dataSyncService');
              const dataSyncService = DataSyncService.getInstance();
              
              // 清除所有本地存储数据
              await Promise.all([
                AsyncStorage.clear(),
                // 清除剧集数据
                clearShows(),
                // 清除词汇数据
                clearVocabulary(),
                // 清除学习统计缓存
                dataSyncService.clearAllCache(),
              ]);
              
              Alert.alert(
                '清除成功',
                '所有缓存数据已清除。应用将重新启动以应用更改。',
                [
                  {
                    text: '确定',
                    onPress: () => {
                      // 重启应用
                      if (Platform.OS === 'ios') {
                        // iOS 重启应用
                        Alert.alert('请手动重启应用');
                      } else {
                        // Android 重启应用
                        Alert.alert('请手动重启应用');
                      }
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('清除缓存失败:', error);
              Alert.alert('清除失败', '清除缓存时发生错误，请稍后重试');
            } finally {
              setClearingCache(false);
            }
          }
        }
      ]
    );
  };

  const handleClearAllData = async () => {
    Alert.alert(
      '清除所有数据',
      '确定要清除所有数据吗？这将删除搜索历史、单词本、剧集数据和新建的单词本。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除所有数据',
          style: 'destructive',
          onPress: async () => {
            setClearingCache(true);
            try {
              // 导入 DataSyncService
              const { DataSyncService } = require('../../services/dataSyncService');
              const dataSyncService = DataSyncService.getInstance();
              
              // 清除所有本地存储数据
              await Promise.all([
                AsyncStorage.clear(),
                // 清除搜索历史
                dataSyncService.clearSearchHistory(),
                // 清除单词本数据
                clearVocabulary(),
                // 清除剧集数据
                clearShows(),
                // 清除新建的单词本数据
                dataSyncService.clearNewWordbook(),
                // 清除学习统计缓存
                dataSyncService.clearAllCache(),
              ]);
              
              Alert.alert(
                '清除成功',
                '所有数据已清除。应用将重新启动以应用更改。',
                [
                  {
                    text: '确定',
                    onPress: () => {
                      // 重启应用
                      if (Platform.OS === 'ios') {
                        // iOS 重启应用
                        Alert.alert('请手动重启应用');
                      } else {
                        // Android 重启应用
                        Alert.alert('请手动重启应用');
                      }
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('清除所有数据失败:', error);
              Alert.alert('清除失败', '清除所有数据时发生错误，请稍后重试');
            } finally {
              setClearingCache(false);
            }
          }
        }
      ]
    );
  };

  // 新增：跳转到订阅页
  const handleGoToSubscription = () => {
    navigate('Subscription');
  };

  // 在 renderUserInfo 下方插入会员订阅入口按钮
  const renderSubscriptionEntry = () => (
    <TouchableOpacity style={styles.subscriptionBtn} onPress={handleGoToSubscription} activeOpacity={0.85}>
      <Text style={styles.subscriptionBtnText}>会员订阅/升级</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部标题已移除 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.primary[500] }}>关于剧词记</Text>
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
  userSection: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    backgroundColor: '#3A8DFF',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#3A8DFF',
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
}); 