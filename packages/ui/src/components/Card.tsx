import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../tokens';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  style,
}) => {
  const cardStyle = [
    styles.base,
    styles[variant],
    styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`],
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
  },

  // 默认卡片 - 轻微阴影
  default: {
    ...shadows.sm,
  },

  // 高亮卡片 - 更明显的阴影
  elevated: {
    ...shadows.md,
  },

  // 轮廓卡片 - 边框样式
  outlined: {
    borderWidth: 1,
    borderColor: colors.border.light,
  },

  // 内边距
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: spacing[3],
  },
  paddingMedium: {
    padding: spacing[4],
  },
  paddingLarge: {
    padding: spacing[6],
  },
}); 