import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BadgeDefinition, UserBadgeProgress } from '../types/badge';

const { width: screenWidth } = Dimensions.get('window');
const cardSize = (screenWidth - 48) / 3; // 3列布局，左右各24px边距

interface BadgeCardProps {
  badge: BadgeDefinition;
  userProgress: UserBadgeProgress;
  onPress: (badge: BadgeDefinition) => void;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  userProgress,
  onPress,
}) => {
  const isUnlocked = userProgress.unlocked;

  const getBadgeIcon = () => {
    if (isUnlocked) {
      // 已解锁：显示彩色图标（这里使用占位符，实际应该显示真实徽章图片）
      return (
        <View style={[styles.badgeIcon, styles.unlockedIcon]}>
          <Ionicons name="trophy" size={32} color="#FFD700" />
        </View>
      );
    } else {
      // 未解锁：显示灰色锁图标
      return (
        <View style={[styles.badgeIcon, styles.lockedIcon]}>
          <Ionicons name="lock-closed" size={32} color="#999" />
        </View>
      );
    }
  };

  return (
    <TouchableOpacity
      style={[styles.badgeCard, !isUnlocked && styles.lockedBadge]}
      onPress={() => onPress(badge)}
      activeOpacity={0.7}
    >
      {getBadgeIcon()}
      
      <Text style={[styles.badgeName, !isUnlocked && styles.lockedText]}>
        {badge.name}
      </Text>
      
      {!isUnlocked && (
        <View style={styles.lockOverlay}>
          <Ionicons name="lock-closed" size={16} color="#999" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badgeCard: {
    width: cardSize,
    height: cardSize + 40, // 图标 + 文字高度
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  lockedBadge: {
    opacity: 0.6,
  },
  badgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  unlockedIcon: {
    backgroundColor: '#F0F8FF',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  lockedIcon: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 16,
  },
  lockedText: {
    color: '#999',
  },
  lockOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 4,
  },
});
