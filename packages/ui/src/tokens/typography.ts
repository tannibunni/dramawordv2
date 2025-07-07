export const typography = {
  // 字体大小
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    h1: '2.25rem', // 36px - 页面主标题
    h2: '1.875rem', // 30px - 区块标题
    h3: '1.5rem', // 24px - 卡片标题
    h4: '1.25rem', // 20px - 小节标题
    bodyLarge: '1.125rem', // 18px - 大正文
    body: '1rem', // 16px - 标准正文
    bodySmall: '0.875rem', // 14px - 小正文
    caption: '0.75rem', // 12px - 说明文字
    numericLarge: '1.5rem', // 24px - 大数字（如学习时长）
    numeric: '1.25rem', // 20px - 标准数字（如记忆数）
    numericSmall: '1rem', // 16px - 小数字
    button: '1rem', // 16px
    buttonSmall: '0.875rem', // 14px
  },

  // 行高
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.8,
  },

  // 字重
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // 字体族
  fontFamily: {
    // 主要字体 - 中粗无衬线字体
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    // 数字字体 - 用于数据展示
    numeric: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    // 代码字体
    mono: 'SF Mono, Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  },

  // 字母间距
  letterSpacing: {
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const;

// 预定义的文本样式
export const textStyles = {
  // 标题样式
  h1: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h2: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h3: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h4: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },

  // 正文样式
  bodyLarge: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.bodyLarge,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.normal,
  },
  body: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  bodySmall: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.bodySmall,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },

  // 标签和辅助文字
  caption: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.loose,
    letterSpacing: typography.letterSpacing.wide,
  },
      label: {
      fontFamily: typography.fontFamily.primary,
      fontSize: typography.fontSize.bodySmall,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal,
      letterSpacing: typography.letterSpacing.normal,
    },

  // 按钮文字
  button: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.button,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.normal,
  },
  buttonSmall: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.buttonSmall,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.normal,
  },

  // 数字样式 - 突出成就感
  numericLarge: {
    fontFamily: typography.fontFamily.numeric,
    fontSize: typography.fontSize.numericLarge,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  numeric: {
    fontFamily: typography.fontFamily.numeric,
    fontSize: typography.fontSize.numeric,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  numericSmall: {
    fontFamily: typography.fontFamily.numeric,
    fontSize: typography.fontSize.numericSmall,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
} as const;

export type TypographyToken = typeof typography;
export type TextStyleToken = typeof textStyles; 