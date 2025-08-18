import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { useAppLanguage } from '../../../context/AppLanguageContext';
import { t } from '../../../constants/translations';

interface DailyRewardsButtonProps {
  hasAvailableRewards: boolean;
  availableCount: number;
  onPress: () => void;
}

export const DailyRewardsButton: React.FC<DailyRewardsButtonProps> = ({
  hasAvailableRewards,
  availableCount,
  onPress
}) => {
  const { appLanguage } = useAppLanguage();
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  // 闪烁动画效果
  useEffect(() => {
    if (hasAvailableRewards) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      return () => pulseLoop.stop();
    }
  }, [hasAvailableRewards, pulseAnimation]);

  // 点击动画效果
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        hasAvailableRewards ? styles.availableContainer : styles.disabledContainer
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.button,
          hasAvailableRewards ? styles.availableButton : styles.disabledButton,
          {
            transform: [
              { scale: scaleAnimation },
              { scale: hasAvailableRewards ? pulseAnimation : 1 }
            ]
          }
        ]}
      >
        {/* 图标 */}
        <View style={styles.iconContainer}>
          <Ionicons 
            name="gift" 
            size={24} 
            color={hasAvailableRewards ? colors.white : colors.gray[400]} 
          />
          {hasAvailableRewards && availableCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{availableCount}</Text>
            </View>
          )}
        </View>

        {/* 文本 */}
        <View style={styles.textContainer}>
          <Text style={[
            styles.title,
            hasAvailableRewards ? styles.availableTitle : styles.disabledTitle
          ]}>
            {t('daily_rewards', appLanguage)}
          </Text>
          <Text style={[
            styles.subtitle,
            hasAvailableRewards ? styles.availableSubtitle : styles.disabledSubtitle
          ]}>
            {hasAvailableRewards 
              ? t('available_rewards_count', appLanguage, { count: availableCount })
              : t('view_daily_rewards', appLanguage)
            }
          </Text>
        </View>

        {/* 箭头 */}
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={hasAvailableRewards ? colors.white : colors.gray[400]} 
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // 移除marginHorizontal，让按钮宽度与上下板块保持一致
    marginTop: 0, // 增加与上面板块的距离
    marginBottom: 18, // 保持与下面板块的距离
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availableContainer: {
    // 可领取状态
  },
  disabledContainer: {
    // 不可领取状态
  },
  availableButton: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[600],
    borderWidth: 2,
  },
  disabledButton: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.primary[300],
    borderWidth: 2,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.accent[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  availableTitle: {
    color: colors.white,
  },
  disabledTitle: {
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.9,
  },
  availableSubtitle: {
    color: colors.white,
  },
  disabledSubtitle: {
    color: colors.text.secondary,
  },
});
