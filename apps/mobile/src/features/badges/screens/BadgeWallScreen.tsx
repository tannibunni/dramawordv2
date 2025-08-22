import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BadgeCard } from '../components/BadgeCard';
import { BadgeDetailModal } from '../components/BadgeDetailModal';
import { BadgeDefinition, UserBadgeProgress } from '../types/badge';
import badgeService from '../services/badgeService';

const { width: screenWidth } = Dimensions.get('window');

export const BadgeWallScreen: React.FC = () => {
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [userProgress, setUserProgress] = useState<UserBadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const [selectedProgress, setSelectedProgress] = useState<UserBadgeProgress | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadBadgeData();
  }, []);

  const loadBadgeData = async () => {
    try {
      setLoading(true);
      const [badgeDefinitions, progressData] = await Promise.all([
        badgeService.getBadgeDefinitions(),
        badgeService.getUserBadgeProgress('user123'), // 模拟用户ID
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

  const renderBadgeItem = ({ item }: { item: BadgeDefinition }) => {
    const progress = userProgress.find(p => p.badgeId === item.id);
    if (!progress) return null;

    return (
      <BadgeCard
        badge={item}
        userProgress={progress}
        onPress={handleBadgePress}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>加载徽章中...</Text>
      </SafeAreaView>
    );
  }

  const unlockedCount = userProgress.filter(p => p.unlocked).length;
  const totalCount = badges.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* 标题区域 */}
      <View style={styles.header}>
        <Text style={styles.title}>我的徽章</Text>
        <Text style={styles.subtitle}>
          已解锁 {unlockedCount} / {totalCount}
        </Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
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
});
