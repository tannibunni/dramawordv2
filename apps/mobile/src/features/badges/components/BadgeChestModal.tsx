import React, { useRef, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BadgeChestModalProps } from '../types/badge';
import { getBadgeImageSource } from '../utils/badgeImageUtils';
import { useAppLanguage } from '../../../context/AppLanguageContext';
import { t } from '../../../constants/translations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const BadgeChestModal: React.FC<BadgeChestModalProps> = ({
  visible,
  onClose,
  onOpen,
  badge,
  userProgress,
}) => {
  const { appLanguage } = useAppLanguage();
  const [isOpening, setIsOpening] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  
  // 动画值
  const chestScale = useRef(new Animated.Value(1)).current;
  const chestRotation = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 重置动画状态
      setIsOpening(false);
      setShowBadge(false);
      chestScale.setValue(1);
      chestRotation.setValue(0);
      badgeScale.setValue(0);
      badgeOpacity.setValue(0);
      sparkleAnim.setValue(0);
      overlayOpacity.setValue(0);

      // 开始入场动画
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(chestScale, {
          toValue: 1.1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    }
  }, [visible]);

  const handleOpenChest = () => {
    if (isOpening) return;
    
    setIsOpening(true);
    
    // 宝箱打开动画序列
    Animated.sequence([
      // 1. 宝箱震动效果
      Animated.sequence([
        Animated.timing(chestRotation, {
          toValue: -5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(chestRotation, {
          toValue: 5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(chestRotation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      // 2. 宝箱缩放和旋转
      Animated.parallel([
        Animated.timing(chestScale, {
          toValue: 1.3,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(chestRotation, {
          toValue: 360,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // 3. 显示徽章
      Animated.parallel([
        Animated.spring(badgeScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // 星光闪烁效果
        Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleAnim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        ),
      ]),
    ]).start(() => {
      setShowBadge(true);
      // 调用打开回调
      onOpen();
    });
  };

  if (!badge || !userProgress) return null;

  const isReadyToUnlock = userProgress.status === 'ready_to_unlock';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <View style={styles.modalContainer}>
          {/* 关闭按钮 */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          {/* 标题 */}
          <Text style={styles.title}>
            {isReadyToUnlock ? '🎁 宝箱已准备就绪！' : '🔒 宝箱未解锁'}
          </Text>

          {/* 宝箱区域 */}
          <View style={styles.chestContainer}>
            <Animated.View
              style={[
                styles.chest,
                {
                  transform: [
                    { scale: chestScale },
                    { rotate: chestRotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    })},
                  ],
                },
              ]}
            >
              {isReadyToUnlock ? (
                <TouchableOpacity
                  style={styles.chestButton}
                  onPress={handleOpenChest}
                  disabled={isOpening}
                >
                  <Ionicons 
                    name="gift" 
                    size={80} 
                    color={isOpening ? "#FFD700" : "#FF6B35"} 
                  />
                  {!isOpening && (
                    <View style={styles.glowEffect}>
                      <Ionicons name="gift" size={80} color="#FFD700" />
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.lockedChest}>
                  <Ionicons name="lock-closed" size={80} color="#999" />
                </View>
              )}
            </Animated.View>

            {/* 星光装饰 */}
            <Animated.View
              style={[
                styles.sparkleContainer,
                { opacity: sparkleAnim },
              ]}
            >
              {[...Array(8)].map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.sparkle,
                    {
                      top: Math.random() * 200,
                      left: Math.random() * 200,
                    },
                  ]}
                >
                  <Ionicons name="star" size={16} color="#FFD700" />
                </View>
              ))}
            </Animated.View>
          </View>

          {/* 徽章显示区域 */}
          {showBadge && (
            <Animated.View
              style={[
                styles.badgeContainer,
                {
                  opacity: badgeOpacity,
                  transform: [{ scale: badgeScale }],
                },
              ]}
            >
              <View style={styles.badgeImageContainer}>
                <Image
                  source={getBadgeImageSource(badge.id)}
                  style={styles.badgeImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeDescription}>{badge.description}</Text>
            </Animated.View>
          )}

          {/* 说明文字 */}
          <Text style={styles.instructionText}>
            {isReadyToUnlock 
              ? '点击宝箱打开，获得你的徽章！' 
              : `还需要 ${userProgress.target - userProgress.progress} 个进度才能解锁`
            }
          </Text>

          {/* 进度条 */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(userProgress.progress / userProgress.target) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {userProgress.progress} / {userProgress.target}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: screenWidth * 0.9,
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  chestContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  chest: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestButton: {
    position: 'relative',
  },
  lockedChest: {
    opacity: 0.6,
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.3,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle: {
    position: 'absolute',
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeImageContainer: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  badgeImage: {
    width: 100,
    height: 100,
  },
  badgeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
});
