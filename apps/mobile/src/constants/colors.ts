export const colors = {
  // 主色调 - 偏蓝偏紫，符合学习场景，具备亲和力
  primary: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#7C3AED', // 主按钮色，蓝紫
    600: '#6D28D9',
    700: '#5B21B6',
    800: '#4C1D95',
    900: '#3C1361',
  },
  mint: {
    50: '#E6FCF7',
    100: '#B9F8E7',
    200: '#7CF2D6',
    300: '#3FEBC6',
    400: '#13E2B6',
    500: '#00C6A2', // 记住滑动反馈 薄荷绿
    600: '#00B090',
    700: '#00997D',
    800: '#00836B',
    900: '#006D59',
  },
  coral: {
    50: '#FFECEC',
    100: '#FFD1D1',
    200: '#FFA3A3',
    300: '#FF7676',
    400: '#FF4848',
    500: '#FF6B6B', // 忘记滑动反馈 珊瑚红
    600: '#FF5252',
    700: '#FF3939',
    800: '#FF2020',
    900: '#FF0707',
  },
  highlight: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // 进度条/图表高亮
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
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
    primary: '#1A1A1A', // 文字主色
    secondary: '#888888',
    tertiary: '#B8BFC9',
    inverse: '#FFFFFF',
  },

  // 背景色
  background: {
    primary: '#FAFAFA', // 整体背景色
    secondary: '#FFFFFF', // 卡片背景色
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