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
import { getBadgeImageSource } from '../utils/badgeImageUtils';

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
  const isReadyToUnlock = userProgress.status === 'ready_to_unlock';
  
  // 调试日志
  console.log('[BadgeCard] 渲染徽章:', {
    badgeId: badge.id,
    status: userProgress.status,
    unlocked: userProgress.unlocked,
    isReadyToUnlock: isReadyToUnlock,
    progress: userProgress.progress
  });

  const getBadgeIcon = () => {
    if (isUnlocked) {
      // 已解锁：显示真实徽章图片
      const imageSource = getBadgeImageSource(badge.id);
      return (
        <View style={[styles.badgeIcon, styles.unlockedIcon]}>
          <Image source={imageSource} style={styles.badgeImage} resizeMode="contain" />
        </View>
      );
    } else if (isReadyToUnlock) {
      // 准备解锁：显示宝箱图标
      return (
        <View style={[styles.badgeIcon, styles.chestIcon]}>
          <Ionicons name="gift" size={40} color="#FF6B35" />
          <View style={styles.glowEffect}>
            <Ionicons name="gift" size={40} color="#FFD700" />
          </View>
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
      style={[
        styles.badgeCard, 
        !isUnlocked && !isReadyToUnlock && styles.lockedBadge,
        isReadyToUnlock && styles.chestBadge
      ]}
      onPress={() => onPress(badge)}
      activeOpacity={0.7}
    >
      {getBadgeIcon()}
      
      <Text style={[
        styles.badgeName, 
        !isUnlocked && !isReadyToUnlock && styles.lockedText,
        isReadyToUnlock && styles.chestText
      ]}>
        {badge.name}
      </Text>
      
      {!isUnlocked && !isReadyToUnlock && (
        <View style={styles.lockOverlay}>
          <Ionicons name="lock-closed" size={16} color="#999" />
        </View>
      )}
      
      {isReadyToUnlock && (
        <View style={styles.chestOverlay}>
          <Ionicons name="gift" size={16} color="#FF6B35" />
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
  chestBadge: {
    // 宝箱状态的特殊样式
  },
  badgeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  unlockedIcon: {
    // 移除背景颜色和边框
  },
  lockedIcon: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chestIcon: {
    backgroundColor: '#FFF8E1',
    borderWidth: 2,
    borderColor: '#FFD700',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.3,
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
  chestText: {
    color: '#FF6B35',
    fontWeight: '700',
  },
  lockOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 4,
  },
  chestOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 107, 53, 0.9)',
    borderRadius: 10,
    padding: 4,
  },
  badgeImage: {
    width: 140,
    height: 140,
  },
});
