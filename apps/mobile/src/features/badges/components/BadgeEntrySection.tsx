import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BadgeDefinition, UserBadgeProgress } from '../types/badge';
import { useAppLanguage } from '../../../context/AppLanguageContext';
import { t } from '../../../constants/translations';

const { width: screenWidth } = Dimensions.get('window');
const badgeSize = (screenWidth - 72) / 3; // 3列布局，左右各24px边距，中间16px间距

interface BadgeEntrySectionProps {
  badges: BadgeDefinition[];
  userProgress: UserBadgeProgress[];
  onViewAll: () => void;
}

export const BadgeEntrySection: React.FC<BadgeEntrySectionProps> = ({
  badges,
  userProgress,
  onViewAll,
}) => {
  const { appLanguage } = useAppLanguage();
  // 获取最近3个已解锁的徽章，如果没有解锁的，显示前3个徽章
  const unlockedBadges = userProgress
    .filter(p => p.unlocked)
    .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0));

  let recentBadges: Array<{ badge: BadgeDefinition; progress: UserBadgeProgress }> = [];
  
  if (unlockedBadges.length > 0) {
    // 如果有解锁的徽章，显示最近解锁的3个
    const recentUnlocked = unlockedBadges.slice(0, 3);
    recentBadges = recentUnlocked.map(progress => {
      const badge = badges.find(b => b.id === progress.badgeId);
      return badge ? { badge, progress } : null;
    }).filter(Boolean) as Array<{ badge: BadgeDefinition; progress: UserBadgeProgress }>;
  } else {
    // 如果没有解锁的徽章，显示前3个徽章（锁定状态）
    recentBadges = badges.slice(0, 3).map(badge => {
      const progress = userProgress.find(p => p.badgeId === badge.id) || {
        userId: 'guest',
        badgeId: badge.id,
        unlocked: false,
        progress: 0,
        target: badge.target,
        unlockedAt: undefined
      };
      return { badge, progress };
    });
  }

  const renderBadgeIcon = (badge: BadgeDefinition, progress: UserBadgeProgress) => {
    if (progress.unlocked) {
      return (
        <View style={styles.badgeIcon}>
          <Ionicons name="trophy" size={24} color="#FFD700" />
        </View>
      );
    } else {
      return (
        <View style={styles.badgePlaceholder}>
          <Ionicons name="lock-closed" size={24} color="#E0E0E0" />
        </View>
      );
    }
  };

  const renderPlaceholder = () => {
    return (
      <View style={styles.badgePlaceholder}>
        <Ionicons name="lock-closed" size={24} color="#E0E0E0" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 标题和VIEW ALL按钮 */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('my_badges', appLanguage)}</Text>
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
          <Text style={styles.viewAllText}>{t('view_all', appLanguage)}</Text>
        </TouchableOpacity>
      </View>

      {/* 徽章展示区 */}
      <View style={styles.badgesContainer}>
        {recentBadges.map(({ badge, progress }, index) => (
          <View key={badge.id || index} style={styles.badgeItem}>
            {renderBadgeIcon(badge, progress)}
            <Text style={styles.badgeName} numberOfLines={1}>
              {badge.name}
            </Text>
          </View>
        ))}
        
        {/* 占位符 - 如果徽章数量不足3个，显示占位符 */}
        {Array.from({ length: Math.max(0, 3 - recentBadges.length) }).map((_, index) => (
          <View key={`placeholder-${index}`} style={styles.badgeItem}>
            {renderPlaceholder()}
            <Text style={styles.badgeNamePlaceholder}>{t('locked', appLanguage)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 8, // 缩小与上面板块的距离
    marginBottom: 12,
    // 去掉阴影，符合iOS风格
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6', // 蓝色字体
    fontWeight: '500',
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgeItem: {
    alignItems: 'center',
    width: badgeSize,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F8FF',
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    lineHeight: 16,
  },
  badgeNamePlaceholder: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
});
