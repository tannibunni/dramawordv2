import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progress: number;
  target: number;
}

interface BadgeSectionProps {
  unlockedCount: number;
  totalCount: number;
  nextBadge?: Badge;
  onPress: () => void;
}

export const BadgeSection: React.FC<BadgeSectionProps> = ({
  unlockedCount,
  totalCount,
  nextBadge,
  onPress,
}) => {
  const getEncouragementText = () => {
    if (!nextBadge) {
      return '恭喜！你已解锁所有奖章！';
    }
    
    const remaining = nextBadge.target - nextBadge.progress;
    return `再记 ${remaining} 个词可获得「${nextBadge.name}」`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏅 奖章成就</Text>
        <TouchableOpacity onPress={onPress} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>查看全部</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      <View style={styles.badgeContainer}>
        <View style={styles.badgeInfo}>
          <Text style={styles.badgeCount}>
            你已解锁 {unlockedCount} 枚奖章
          </Text>
          <Text style={styles.encouragement}>
            {getEncouragementText()}
          </Text>
        </View>

        {/* 奖章图标展示 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgeIcons}
        >
          {/* 已解锁的奖章 */}
          {Array.from({ length: Math.min(unlockedCount, 5) }).map((_, index) => (
            <View key={`unlocked-${index}`} style={styles.badgeIcon}>
              <Text style={styles.badgeEmoji}>
                {['📘', '📗', '📙', '🏆', '🎖️'][index]}
              </Text>
            </View>
          ))}
          
          {/* 未解锁的奖章 */}
          {Array.from({ length: Math.max(0, 5 - unlockedCount) }).map((_, index) => (
            <View key={`locked-${index}`} style={[styles.badgeIcon, styles.lockedBadge]}>
              <Text style={styles.badgeEmoji}>🔒</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary[500],
    marginRight: 4,
  },
  badgeContainer: {
    gap: 16,
  },
  badgeInfo: {
    gap: 8,
  },
  badgeCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  encouragement: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  badgeIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lockedBadge: {
    backgroundColor: colors.background.tertiary,
  },
  badgeEmoji: {
    fontSize: 24,
  },
}); 