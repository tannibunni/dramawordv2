import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
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

interface BadgeModalProps {
  visible: boolean;
  badge: Badge | null;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const BadgeModal: React.FC<BadgeModalProps> = ({
  visible,
  badge,
  onClose,
}) => {
  if (!badge) return null;

  const progressPercentage = Math.min((badge.progress / badge.target) * 100, 100);
  const remaining = Math.max(0, badge.target - badge.progress);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 头部 */}
          <View style={styles.header}>
            <Text style={styles.modalTitle}>奖章详情</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* 奖章信息 */}
          <View style={styles.badgeInfo}>
            <View style={styles.badgeIconContainer}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              {badge.isUnlocked && (
                <View style={styles.unlockedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                </View>
              )}
            </View>
            
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={styles.badgeDescription}>{badge.description}</Text>
          </View>

          {/* 进度信息 */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                {badge.isUnlocked ? '已完成' : '进度'}
              </Text>
              <Text style={styles.progressCount}>
                {badge.progress} / {badge.target}
              </Text>
            </View>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%` }
                ]} 
              />
            </View>
            
            {!badge.isUnlocked && (
              <Text style={styles.remainingText}>
                还需 {remaining} 个词才能解锁
              </Text>
            )}
          </View>

          {/* 奖励信息 */}
          <View style={styles.rewardSection}>
            <Text style={styles.rewardTitle}>🎁 解锁奖励</Text>
            <Text style={styles.rewardDescription}>
              解锁此奖章可获得特殊头像框和成就点数
            </Text>
          </View>

          {/* 操作按钮 */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={onClose}
            >
              <Text style={styles.primaryButtonText}>知道了</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  badgeInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  badgeIconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  badgeIcon: {
    fontSize: 60,
  },
  unlockedBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  badgeName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  badgeDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  progressCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary[500],
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  rewardSection: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  rewardDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary[500],
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
}); 