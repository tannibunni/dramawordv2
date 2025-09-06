import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BadgeDetailModalProps } from '../types/badge';
import { getBadgeImageSource } from '../utils/badgeImageUtils';
import { useAppLanguage } from '../../../context/AppLanguageContext';
import { t } from '../../../constants/translations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({
  visible,
  onClose,
  badge,
  userProgress,
}) => {
  if (!badge) return null;

  const isUnlocked = userProgress?.unlocked || false;
  const { appLanguage } = useAppLanguage();
  
  // 调试日志
  console.log('[BadgeDetailModal] 渲染详情弹窗:', {
    badgeId: badge?.id,
    isUnlocked,
    userProgress: userProgress ? {
      unlocked: userProgress.unlocked,
      status: userProgress.status,
      hasBeenOpened: userProgress.hasBeenOpened
    } : null
  });

  // 获取徽章图片
  const getBadgeImage = () => {
    const imageSource = getBadgeImageSource(badge.id);
    return (
      <Image source={imageSource} style={styles.badgeDetailImage} resizeMode="contain" />
    );
  };



  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 关闭按钮 */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          {/* 徽章图片 */}
          <View style={styles.badgeImageContainer}>
            {isUnlocked ? (
              <View style={[styles.badgeImage, styles.unlockedBadgeImage]}>
                {getBadgeImage()}
              </View>
            ) : (
              <View style={[styles.badgeImage, styles.lockedBadgeImage]}>
                <Ionicons name="lock-closed" size={80} color="#999" />
              </View>
            )}
          </View>

          {/* 徽章标题 */}
          <Text style={styles.badgeTitle}>
            {badge.name}
          </Text>

          {/* 徽章说明 */}
          <Text style={styles.badgeDescription}>
            {badge.description}
          </Text>

          {/* 解锁状态 */}
          <View style={styles.statusContainer}>
            {isUnlocked ? (
              <View style={styles.unlockedStatus}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.unlockedText}>{t('badge_unlocked', appLanguage)}</Text>
              </View>
            ) : (
              <View style={styles.lockedStatus}>
                <Ionicons name="lock-closed" size={20} color="#999" />
                <Text style={styles.lockedText}>{t('badge_locked', appLanguage)}</Text>
              </View>
            )}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: screenWidth * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  badgeImageContainer: {
    marginBottom: 110,
    marginTop: 16,
  },
  badgeImage: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockedBadgeImage: {
    // 移除背景颜色和边框
  },
  lockedBadgeImage: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  badgeDetailImage: {
    width: 400,
    height: 400,
  },
  badgeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  badgeDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  statusContainer: {
    alignItems: 'center',
  },
  unlockedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  unlockedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 8,
  },
  lockedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  lockedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginLeft: 8,
  },
});
