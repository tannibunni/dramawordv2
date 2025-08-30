import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BadgeCard } from '../components/BadgeCard';
import { BadgeDetailModal } from '../components/BadgeDetailModal';
import { BadgeDefinition, UserBadgeProgress } from '../types/badge';
import badgeService from '../services/badgeService';
import { useNavigation } from '../../../components/navigation/NavigationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppLanguage } from '../../../context/AppLanguageContext';
import { t } from '../../../constants/translations';

const { width: screenWidth } = Dimensions.get('window');

// 获取用户ID的辅助函数
async function getUserId(): Promise<string | null> {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.id || null;
    }
    return null;
  } catch (error) {
    console.error('[BadgeWallScreen] 获取用户ID失败:', error);
    return null;
  }
}

export const BadgeWallScreen: React.FC = () => {
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [userProgress, setUserProgress] = useState<UserBadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const [selectedProgress, setSelectedProgress] = useState<UserBadgeProgress | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { goBack } = useNavigation();
  const { appLanguage } = useAppLanguage();

  useEffect(() => {
    loadBadgeData();
  }, []);

  const loadBadgeData = async () => {
    try {
      setLoading(true);
      
      // 获取真实用户ID
      const userId = await getUserId();
      if (!userId) {
        console.warn('[BadgeWallScreen] 无法获取用户ID，使用游客模式');
        setBadges([]);
        setUserProgress([]);
        return;
      }
      
      const [badgeDefinitions, progressData] = await Promise.all([
        badgeService.getBadgeDefinitions(appLanguage),
        badgeService.getUserBadgeProgress(userId),
      ]);
      
      setBadges(badgeDefinitions);
      setUserProgress(progressData);
    } catch (error) {
      console.error('加载徽章数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBadgePress = (badge: BadgeDefinition) => {
    const progress = userProgress.find(p => p.badgeId === badge.id);
    setSelectedBadge(badge);
    setSelectedProgress(progress || null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedBadge(null);
    setSelectedProgress(null);
  };

  const refreshBadgeData = async () => {
    await loadBadgeData();
  };

  // 开发模式：测试解锁所有徽章
  const testUnlockAllBadges = async () => {
    if (!__DEV__) return;
    
    Alert.alert(
      '🧪 开发模式测试',
      t('badge_dev_confirm_unlock', appLanguage),
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              const userId = await getUserId();
              if (!userId) {
                Alert.alert('错误', '无法获取用户ID');
                return;
              }

              // 模拟用户行为数据来解锁所有徽章
              const mockBehaviorData = {
                userId,
                wordsCollected: 150, // 足够解锁所有收藏家徽章
                reviewSessionsCompleted: 20, // 足够解锁复习达人徽章
                dailyCheckinStreak: 35, // 足够解锁所有连续学习徽章
                showlistCreated: 5, // 足够解锁剧集收藏家徽章（需要3个）
                wordsContributed: 10, // 足够解锁贡献者徽章
                learningTimeHours: 50,
                lastActivityDate: new Date(),
                dailyStats: [],
                streakData: []
              };

              // 保存模拟数据
              const badgeDataService = (await import('../services/badgeDataService')).default;
              await badgeDataService.saveUserBehavior(userId, mockBehaviorData);

              // 重新计算徽章进度
              const badgeRuleEngine = (await import('../services/badgeRuleEngine')).default;
              await badgeRuleEngine.evaluateUserBadges(userId, mockBehaviorData);

              // 刷新显示
              await loadBadgeData();

              Alert.alert('成功', t('badge_dev_success_unlock', appLanguage));
            } catch (error) {
              console.error('[BadgeWallScreen] 测试解锁徽章失败:', error);
              Alert.alert('错误', t('badge_dev_error', appLanguage));
            }
          }
        }
      ]
    );
  };

  // 开发模式：重置所有徽章
  const testResetAllBadges = async () => {
    if (!__DEV__) return;
    
    Alert.alert(
      '🧪 开发模式测试',
      t('badge_dev_confirm_reset', appLanguage),
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = await getUserId();
              if (!userId) {
                Alert.alert('错误', '无法获取用户ID');
                return;
              }

              // 重置用户行为数据
              const mockBehaviorData = {
                userId,
                wordsCollected: 0,
                reviewSessionsCompleted: 0,
                dailyCheckinStreak: 0,
                showlistCreated: 0,
                wordsContributed: 0,
                learningTimeHours: 0,
                lastActivityDate: new Date(),
                dailyStats: [],
                streakData: []
              };

              // 保存重置数据
              const badgeDataService = (await import('../services/badgeDataService')).default;
              await badgeDataService.saveUserBehavior(userId, mockBehaviorData);

              // 重新计算徽章进度
              const badgeRuleEngine = (await import('../services/badgeRuleEngine')).default;
              await badgeRuleEngine.evaluateUserBadges(userId, mockBehaviorData);

              // 刷新显示
              await loadBadgeData();

              Alert.alert('成功', t('badge_dev_success_reset', appLanguage));
            } catch (error) {
              console.error('[BadgeWallScreen] 重置徽章失败:', error);
              Alert.alert('错误', t('badge_dev_error', appLanguage));
            }
          }
        }
      ]
    );
  };

  const renderBadgeItem = ({ item }: { item: BadgeDefinition }) => {
    const progress = userProgress.find(p => p.badgeId === item.id);
    
    // 如果没有进度数据，创建一个默认的锁定状态
    const defaultProgress: UserBadgeProgress = {
      userId: 'guest',
      badgeId: item.id,
      unlocked: false,
      progress: 0,
      target: item.target,
      unlockedAt: undefined
    };

    return (
      <BadgeCard
        badge={item}
        userProgress={progress || defaultProgress}
        onPress={handleBadgePress}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>{t('badge_loading', appLanguage)}</Text>
      </SafeAreaView>
    );
  }

  const unlockedCount = userProgress.filter(p => p.unlocked).length;
  const totalCount = badges.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* 标题区域 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.closeButton} onPress={goBack}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('my_badges', appLanguage)}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshBadgeData}>
            <Ionicons name="refresh" size={24} color="#7C3AED" />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
{t('badge_unlocked_count', appLanguage, { unlocked: unlockedCount, total: totalCount })}
        </Text>
        
        {/* 开发模式测试按钮 */}
        {__DEV__ && (
          <View style={styles.devTestSection}>
            <TouchableOpacity 
              style={[styles.devTestButton, styles.unlockButton]} 
              onPress={testUnlockAllBadges}
            >
              <Ionicons name="trophy" size={16} color="#FFFFFF" />
              <Text style={styles.devTestButtonText}>{t('badge_dev_unlock_all', appLanguage)}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.devTestButton, styles.resetButton]} 
              onPress={testResetAllBadges}
            >
              <Ionicons name="refresh-circle" size={16} color="#FFFFFF" />
              <Text style={styles.devTestButtonText}>{t('badge_dev_reset', appLanguage)}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 徽章网格 */}
      <FlatList
        data={badges}
        renderItem={renderBadgeItem}
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={styles.badgeGrid}
        showsVerticalScrollIndicator={false}
      />

      {/* 徽章详情弹窗 */}
      <BadgeDetailModal
        visible={modalVisible}
        onClose={closeModal}
        badge={selectedBadge}
        userProgress={selectedProgress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  badgeGrid: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  // 开发模式测试按钮样式
  devTestSection: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  devTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
  },
  unlockButton: {
    backgroundColor: '#10B981', // 绿色
  },
  resetButton: {
    backgroundColor: '#EF4444', // 红色
  },
  devTestButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
