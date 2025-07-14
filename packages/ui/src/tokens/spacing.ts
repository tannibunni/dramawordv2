// 间距系统 - 使用 rem 单位，便于响应式
export const spacing = {
  // 基础间距单位
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  4: '1rem', // 16px - 卡片内边距
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px

  // 语义化间距 - 页面布局专用
  page: {
    padding: '1rem', // 页面内边距 1rem
    paddingLarge: '1.5rem', // 页面内边距 1.5rem
  },
  
  card: {
    padding: '1rem', // 卡片内边距 1rem
    margin: '0.75rem', // 卡片间距 0.75rem
  },
  
  section: {
    margin: '1.5rem', // 区块间距
  },
  
  // 行间距 - 1.25x 字高
  line: {
    tight: '1.25em',
    normal: '1.5em',
    relaxed: '1.6em',
  },
} as const;

// 圆角系统
export const borderRadius = {
  none: '0',
  sm: '0.25rem', // 4px
  base: '0.5rem', // 8px - 标签
  md: '0.625rem', // 10px - 输入框
  lg: '0.75rem', // 12px - 按钮
  xl: '1rem', // 16px - 卡片
  '2xl': '1.5rem', // 24px
  '3xl': '2rem', // 32px
  full: '9999px',
} as const;

// 阴影系统
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // 卡片阴影 - 浅灰阴影
  card: '0 2px 8px rgba(229, 229, 236, 0.3)',
  cardHover: '0 4px 12px rgba(229, 229, 236, 0.4)',
  
  // 按钮阴影
  button: '0 2px 4px rgba(79, 109, 255, 0.2)',
  buttonHover: '0 4px 8px rgba(79, 109, 255, 0.3)',
} as const;

// 动画时长
export const transitions = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // 弹性动画
  },
} as const;

export type SpacingToken = typeof spacing;
export type BorderRadiusToken = typeof borderRadius;
export type ShadowToken = typeof shadows;
export type TransitionToken = typeof transitions; 