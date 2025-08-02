import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { StatsCard } from './StatsCard';
import { BadgeSection } from './BadgeSection';
import { BadgeModal } from './BadgeModal';
import { LearningStatsService, LearningStats, Badge as LearningBadge } from '../../services/learningStatsService';
import { unifiedSyncService } from '../../services/unifiedSyncService';

interface LearningStatsSectionProps {
  onBadgePress?: (badge: LearningBadge) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const LearningStatsSection: React.FC<LearningStatsSectionProps> = ({
  onBadgePress,
}) => {
  const [stats, setStats] = useState<LearningStats>({
    totalWords: 0,
    contributedWords: 0,
    learningDays: 0,
    streakDays: 0,
    level: 1,
    experience: 0,
    badges: [],
  });
  const [badges, setBadges] = useState<LearningBadge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const learningStatsService = LearningStatsService.getInstance();
  // 移除旧的同步服务引用，使用统一同步服务

  // 加载数据
  useEffect(() => {
    loadDataWithSync();
    startFadeInAnimation();
  }, []);

  const loadDataWithSync = async () => {
    try {
      setLoading(true);
      setSyncStatus('检查数据同步状态...');
      console.log('📊 开始加载学习数据...');

      // 检查统一同步服务状态
      const syncStatus = unifiedSyncService.getSyncStatus();
      
      if (syncStatus.queueLength > 0) {
        setSyncStatus('同步数据中...');
        console.log('🔄 发现待同步数据，开始同步...');
        
        // 尝试同步数据
        const syncResult = await unifiedSyncService.syncPendingData();
        
        if (syncResult.success) {
          setSyncStatus('数据同步完成');
          console.log('✅ 数据同步成功');
        } else {
          setSyncStatus('数据同步失败，使用缓存数据');
          console.log('⚠️ 数据同步失败，使用缓存数据');
        }
      } else {
        setSyncStatus('使用缓存数据');
        console.log('📋 使用缓存数据');
      }

      // 获取数据（优先使用缓存，失败时从服务器获取）
      const [statsData, badgesData] = await Promise.all([
        getStatsData(),
        getBadgesData(),
      ]);

      console.log('📊 学习统计数据:', statsData);
      console.log('🏅 奖章数据:', badgesData);

      setStats(statsData || {
        totalWords: 0,
        contributedWords: 0,
        learningDays: 0,
        streakDays: 0,
        level: 1,
        experience: 0,
        badges: [],
      });
      setBadges(badgesData);
      setSyncStatus('');
    } catch (error) {
      console.error('❌ 加载学习数据失败:', error);
      setSyncStatus('加载失败，使用默认数据');
      
      // 使用默认数据
      setStats({
        totalWords: 0,
        contributedWords: 0,
        learningDays: 0,
        streakDays: 0,
        level: 1,
        experience: 0,
        badges: [],
      });
      setBadges([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatsData = async (): Promise<LearningStats | null> => {
    try {
      // 先尝试从本地存储获取
      const cachedStatsStr = await AsyncStorage.getItem('userStats');
      if (cachedStatsStr) {
        const cachedStats = JSON.parse(cachedStatsStr);
        console.log('📋 使用缓存的统计数据');
        return cachedStats;
      }

      // 缓存不存在，从服务器获取
      console.log('🌐 从服务器获取统计数据');
      return await learningStatsService.getLearningStats();
    } catch (error) {
      console.error('❌ 获取统计数据失败:', error);
      return {
        totalWords: 0,
        contributedWords: 0,
        learningDays: 0,
        streakDays: 0,
        level: 1,
        experience: 0,
        badges: [],
      };
    }
  };

  const getBadgesData = async (): Promise<LearningBadge[]> => {
    try {
      // 先尝试从本地存储获取
      const cachedBadgesStr = await AsyncStorage.getItem('badges');
      if (cachedBadgesStr) {
        const cachedBadges = JSON.parse(cachedBadgesStr);
        if (cachedBadges && cachedBadges.length > 0) {
          console.log('📋 使用缓存的奖章数据');
          return cachedBadges;
        }
      }

      // 缓存不存在，从服务器获取
      console.log('🌐 从服务器获取奖章数据');
      return await learningStatsService.getBadges();
    } catch (error) {
      console.error('❌ 获取奖章数据失败:', error);
      return [];
    }
  };

  const startFadeInAnimation = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const handleBadgePress = (badge: LearningBadge) => {
    // 转换徽章数据格式以匹配 BadgeModal 组件的期望
    const convertedBadge = {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      isUnlocked: !!badge.unlockedAt,
      progress: badge.progress || 0,
      target: badge.maxProgress || 1,
    };
    setSelectedBadge(convertedBadge as any);
    setBadgeModalVisible(true);
    onBadgePress?.(badge);
  };

  const handleRefresh = async () => {
    console.log('🔄 手动刷新数据...');
    setLoading(true);
    setSyncStatus('强制同步中...');
    
    try {
      const syncResult = await unifiedSyncService.forceSync();
      if (syncResult.success) {
        await loadDataWithSync();
      } else {
        setSyncStatus('同步失败');
      }
    } catch (error) {
      console.error('❌ 手动刷新失败:', error);
      setSyncStatus('刷新失败');
    } finally {
      setLoading(false);
    }
  };

  // 转换徽章数据格式以匹配 BadgeSection 组件的期望
  const convertedBadges = badges.map(badge => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    isUnlocked: !!badge.unlockedAt,
    progress: badge.progress || 0,
    target: badge.maxProgress || 1,
  }));
  
  const unlockedBadges = convertedBadges.filter(badge => badge.isUnlocked);
  const nextBadge = convertedBadges.find(badge => !badge.isUnlocked);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>加载学习统计中...</Text>
        {syncStatus ? (
          <Text style={styles.syncStatusText}>{syncStatus}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* 同步状态显示 */}
      {syncStatus ? (
        <View style={styles.syncStatusContainer}>
          <Text style={styles.syncStatusText}>{syncStatus}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={16} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* 统计卡片区域 */}
      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>学习统计</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
          snapToInterval={screenWidth * 0.8 + 16}
          decelerationRate="fast"
        >
          <StatsCard
            title="已记录词汇"
            value={stats?.totalWords ?? 0}
            subtitle="总共记录过的单词数"
            icon="📚"
            color="#4CAF50"
          />
          <StatsCard
            title="贡献新词"
            value={stats?.contributedWords ?? 0}
            subtitle="继续造句、补释义"
            icon="🧠"
            color="#2196F3"
          />
          <StatsCard
            title="学习天数"
            value={stats?.learningDays ?? 0}
            subtitle="共学习天数"
            icon="📅"
            color="#FF9800"
          />
          <StatsCard
            title="连续天数"
            value={stats?.streakDays ?? 0}
            subtitle="保持 streak，解锁奖励"
            icon="🔥"
            color="#F44336"
          />
        </ScrollView>
      </View>

      {/* 奖章区域 */}
      <BadgeSection
        unlockedCount={unlockedBadges.length}
        totalCount={convertedBadges.length}
        nextBadge={nextBadge}
        onPress={() => {
          const firstBadge = convertedBadges[0] || unlockedBadges[0];
          if (firstBadge) {
            // 找到对应的原始徽章数据
            const originalBadge = badges.find(b => b.id === firstBadge.id);
            if (originalBadge) {
              handleBadgePress(originalBadge);
            }
          }
        }}
      />

      {/* 奖章详情弹窗 */}
      <BadgeModal
        visible={badgeModalVisible}
        badge={selectedBadge}
        onClose={() => setBadgeModalVisible(false)}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  syncStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  syncStatusText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginRight: 8,
  },
  refreshButton: {
    padding: 4,
  },
  statsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  cardsContainer: {
    paddingHorizontal: 20,
  },
}); 