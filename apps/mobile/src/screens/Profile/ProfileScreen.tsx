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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { UserService } from '../../services/userService';
import { useVocabulary } from '../../context/VocabularyContext';
import { useShowList } from '../../context/ShowListContext';
import { wordService } from '../../services/wordService';

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
  navigation?: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onLogout,
  onEditProfile,
  navigation,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const { vocabulary, clearVocabulary } = useVocabulary();
  const { shows, clearShows } = useShowList();

  // 模拟用户数据（当真实数据未加载时使用）
  const defaultUserData = {
    nickname: '学习达人',
    avatar: 'https://via.placeholder.com/80',
    email: 'user@example.com',
    joinDate: '2024年1月',
    level: '中级学习者',
  };

  // 获取用户数据
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // TODO: 从本地存储或全局状态获取token
      const token = 'your-token-here';
      
      // 如果没有有效token，使用默认数据
      if (!token || token === 'your-token-here') {
        console.log('使用默认用户数据');
        setUser(defaultUserData);
        return;
      }
      
      const result = await UserService.getProfile(token);
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        // 如果API调用失败，使用默认数据
        console.log('API调用失败，使用默认用户数据');
        setUser(defaultUserData);
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
      // 网络错误时使用默认数据
      setUser(defaultUserData);
    } finally {
      setLoading(false);
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

  const renderUserInfo = () => {
    const userData = user || defaultUserData;
    
    return (
      <View style={styles.userSection}>
        <View style={styles.userHeader}>
          <Image
            source={{ uri: userData.avatar || 'https://via.placeholder.com/80' }}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userData.nickname || userData.name}</Text>
            <Text style={styles.userLevel}>{userData.level}</Text>
            <Text style={styles.userEmail}>{userData.email}</Text>
            <Text style={styles.joinDate}>加入时间: {userData.joinDate}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={20} color="#4F6DFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStats = () => (
    <View style={styles.statsSection}>
      <Text style={styles.sectionTitle}>学习统计</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="book-outline" size={24} color="#4F6DFF" />
          <Text style={styles.statNumber}>{stats.totalWords}</Text>
          <Text style={styles.statLabel}>总词汇量</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#6BCF7A" />
          <Text style={styles.statNumber}>{stats.masteredWords}</Text>
          <Text style={styles.statLabel}>已掌握</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={24} color="#F4B942" />
          <Text style={styles.statNumber}>{stats.learningDays}</Text>
          <Text style={styles.statLabel}>学习天数</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="flame-outline" size={24} color="#F76C6C" />
          <Text style={styles.statNumber}>{stats.currentStreak}</Text>
          <Text style={styles.statLabel}>连续学习</Text>
        </View>
      </View>
      
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>掌握进度</Text>
          <Text style={styles.progressPercentage}>
            {Math.round((stats.masteredWords / stats.totalWords) * 100)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(stats.masteredWords / stats.totalWords) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {stats.masteredWords} / {stats.totalWords} 个单词
        </Text>
      </View>

      <View style={styles.accuracySection}>
        <Text style={styles.accuracyTitle}>复习准确率</Text>
        <View style={styles.accuracyDisplay}>
          <Text style={styles.accuracyNumber}>{stats.accuracy}%</Text>
          <Text style={styles.accuracyLabel}>基于 {stats.totalReviews} 次复习</Text>
        </View>
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>设置</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="notifications-outline" size={24} color="#4F6DFF" />
          <Text style={styles.settingLabel}>推送通知</Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: '#E0E0E0', true: '#4F6DFF' }}
          thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="moon-outline" size={24} color="#4F6DFF" />
          <Text style={styles.settingLabel}>深色模式</Text>
        </View>
        <Switch
          value={darkModeEnabled}
          onValueChange={setDarkModeEnabled}
          trackColor={{ false: '#E0E0E0', true: '#4F6DFF' }}
          thumbColor={darkModeEnabled ? '#FFFFFF' : '#FFFFFF'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="play-outline" size={24} color="#4F6DFF" />
          <Text style={styles.settingLabel}>自动播放音频</Text>
        </View>
        <Switch
          value={autoPlayEnabled}
          onValueChange={setAutoPlayEnabled}
          trackColor={{ false: '#E0E0E0', true: '#4F6DFF' }}
          thumbColor={autoPlayEnabled ? '#FFFFFF' : '#FFFFFF'}
        />
      </View>

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="language-outline" size={24} color="#4F6DFF" />
          <Text style={styles.settingLabel}>语言设置</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="help-circle-outline" size={24} color="#4F6DFF" />
          <Text style={styles.settingLabel}>帮助与反馈</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="information-circle-outline" size={24} color="#4F6DFF" />
          <Text style={styles.settingLabel}>关于我们</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.settingItem, clearingCache && styles.settingItemDisabled]} 
        onPress={handleClearCache}
        disabled={clearingCache}
      >
        <View style={styles.settingLeft}>
          <Ionicons name="trash-outline" size={24} color="#F76C6C" />
          <Text style={[styles.settingLabel, { color: '#F76C6C' }]}>
            {clearingCache ? '清空中...' : '清空数据'}
          </Text>
        </View>
        {clearingCache ? (
          <Ionicons name="hourglass-outline" size={20} color="#A0A0A0" />
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsSection}>
      <TouchableOpacity style={styles.actionButton} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={20} color="#F76C6C" />
        <Text style={styles.actionButtonText}>退出登录</Text>
      </TouchableOpacity>
    </View>
  );

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const handleProfileUpdate = (updatedUser: any) => {
    setUser(updatedUser);
  };

  const handleClearCache = () => {
    Alert.alert(
      '清空数据',
      '确定要清空以下所有数据吗？\n\n• 用户ID下的搜索历史记录\n• 用户单词表里面存的词\n• 用户的剧单\n\n⚠️ 此操作不可恢复！',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确定删除',
          style: 'destructive',
          onPress: async () => {
            try {
              setClearingCache(true);
              
              // 清空词汇缓存
              clearVocabulary();
              
              // 清空剧单
              clearShows();
              
              // 清空搜索历史缓存
              await wordService.clearUserCache();
              
              // 显示成功消息
              Alert.alert(
                '清空完成',
                '数据已成功清空！\n\n已清空：\n• 用户搜索历史记录\n• 用户单词表\n• 用户剧单\n\n数据库中的词库保持不变。',
                [{ text: '确定' }]
              );
            } catch (error) {
              console.error('清空数据失败:', error);
              Alert.alert(
                '清空失败',
                '清空数据时出现错误，请稍后重试。',
                [{ text: '确定' }]
              );
            } finally {
              setClearingCache(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我</Text>
        <Text style={styles.subtitle}>学习数据、成就展示</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderUserInfo()}
        {renderStats()}
        {renderSettings()}
        {renderActions()}
      </ScrollView>
      
      {/* 编辑个人信息模态框 */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onUpdate={handleProfileUpdate}
        user={user || defaultUserData}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  userSection: {
    backgroundColor: '#FFFFFF',
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
    color: '#2D2D2D',
    marginBottom: 4,
  },
  userLevel: {
    fontSize: 14,
    color: '#4F6DFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  editButton: {
    padding: 8,
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
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
    color: '#2D2D2D',
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
    color: '#2D2D2D',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
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
    color: '#2D2D2D',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F6DFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F6DFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  accuracySection: {
    alignItems: 'center',
  },
  accuracyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  accuracyDisplay: {
    alignItems: 'center',
  },
  accuracyNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6BCF7A',
    marginBottom: 4,
  },
  accuracyLabel: {
    fontSize: 14,
    color: '#888888',
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#2D2D2D',
    marginLeft: 12,
    fontWeight: '500',
  },
  actionsSection: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F76C6C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F76C6C',
    marginLeft: 8,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
}); 