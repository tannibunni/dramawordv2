export const colors = {
  // 主色调 - 偏蓝偏紫，符合学习场景，具备亲和力
  primary: {
    50: '#F0F4FF',
    100: '#E1E9FF',
    200: '#C3D3FF',
    300: '#A5BDFF',
    400: '#87A7FF',
    500: '#4F6DFF', // 主色
    600: '#3D5AEF',
    700: '#2B47DF',
    800: '#1934CF',
    900: '#0721BF',
  },

  // 辅助色 - 黄色/橙色
  accent: {
    50: '#FFFBF0',
    100: '#FFF7E1',
    200: '#FFEFC3',
    300: '#FFE7A5',
    400: '#FFDF87',
    500: '#F4B942',
    600: '#E8A62E',
    700: '#DC931A',
    800: '#D08006',
    900: '#C46D00',
  },

  // 成功色
  success: {
    50: '#F0FDF4',
    100: '#E1FBE9',
    200: '#C3F7D3',
    300: '#A5F3BD',
    400: '#87EFA7',
    500: '#6BCF7A',
    600: '#5BBF6A',
    700: '#4BAF5A',
    800: '#3B9F4A',
    900: '#2B8F3A',
  },

  // 错误色
  error: {
    50: '#FEF2F2',
    100: '#FEE5E5',
    200: '#FECBCB',
    300: '#FEB1B1',
    400: '#FE9797',
    500: '#F76C6C',
    600: '#F55353',
    700: '#F33A3A',
    800: '#F12121',
    900: '#EF0808',
  },

  // 中性色
  neutral: {
    50: '#F9F9FB',
    100: '#F1F3F6',
    200: '#E5E5EC',
    300: '#D1D6DE',
    400: '#B8BFC9',
    500: '#9AA1AD',
    600: '#7C8391',
    700: '#5E6575',
    800: '#404759',
    900: '#2D2D2D',
  },

  // 文字色
  text: {
    primary: '#2D2D2D',
    secondary: '#888888',
    tertiary: '#B8BFC9',
    inverse: '#FFFFFF',
  },

  // 背景色
  background: {
    primary: '#F9F9FB',
    secondary: '#FFFFFF',
    tertiary: '#F1F3F6',
  },

  // 边框色
  border: {
    light: '#E5E5EC',
    medium: '#D1D6DE',
    dark: '#B8BFC9',
    focus: '#4F6DFF',
  },

  // 语义化色彩
  semantic: {
    learning: '#4F6DFF',
    mastered: '#6BCF7A',
    forgotten: '#F76C6C',
    reviewing: '#F4B942',
    achievement: '#FF8A65',
    streak: '#FFD54F',
    milestone: '#81C784',
    like: '#F76C6C',
    share: '#4F6DFF',
    comment: '#6BCF7A',
  },
} as const;

export type ColorToken = typeof colors; 