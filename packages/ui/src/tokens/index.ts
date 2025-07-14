import { colors } from './colors';
import { spacing, borderRadius, shadows } from './spacing';
import { typography, textStyles } from './typography';

export * from './colors';
export * from './spacing';
export * from './typography';

// 主题配置
export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  textStyles,
} as const;

export type Theme = typeof theme; 