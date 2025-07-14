export const colors = {
  // 主色调 - 偏蓝偏紫，符合学习场景，具备亲和力
  primary: {
    50: '#F0F4FF',
    100: '#E1E9FF',
    200: '#C3D3FF',
    300: '#A5BDFF',
    400: '#87A7FF',
    500: '#4F6DFF', // 主色 - 保留
    600: '#3D5AEF',
    700: '#2B47DF',
    800: '#1934CF',
    900: '#0721BF',
  },

  // 辅助色 - 黄色/橙色，降低明度使其不刺眼，适合提示或标签背景
  accent: {
    50: '#FFFBF0',
    100: '#FFF7E1',
    200: '#FFEFC3',
    300: '#FFE7A5',
    400: '#FFDF87',
    500: '#F4B942', // 辅助色 - 降低明度，从 #FFCB57 调整为 #F4B942
    600: '#E8A62E',
    700: '#DC931A',
    800: '#D08006',
    900: '#C46D00',
  },

  // 成功色 - 更接近草绿色，呼应"记住单词"的动作
  success: {
    50: '#F0FDF4',
    100: '#E1FBE9',
    200: '#C3F7D3',
    300: '#A5F3BD',
    400: '#87EFA7',
    500: '#6BCF7A', // 成功色 - 调整为草绿色，从 #7AD28D 调整为 #6BCF7A
    600: '#5BBF6A',
    700: '#4BAF5A',
    800: '#3B9F4A',
    900: '#2B8F3A',
  },

  // 错误色 - 偏温暖系，用于"遗忘"状态时加上icon/动效辅助提示
  error: {
    50: '#FEF2F2',
    100: '#FEE5E5',
    200: '#FECBCB',
    300: '#FEB1B1',
    400: '#FE9797',
    500: '#F76C6C', // 错误色 - 保留，偏温暖系
    600: '#F55353',
    700: '#F33A3A',
    800: '#F12121',
    900: '#EF0808',
  },

  // 中性色 - 新增柔和背景灰和卡片阴影灰
  neutral: {
    50: '#F9F9FB', // 柔和背景灰
    100: '#F1F3F6',
    200: '#E5E5EC', // 卡片阴影灰
    300: '#D1D6DE',
    400: '#B8BFC9',
    500: '#9AA1AD',
    600: '#7C8391',
    700: '#5E6575',
    800: '#404759',
    900: '#2D2D2D', // 主文字色
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
    primary: '#F9F9FB', // 使用新的柔和背景灰
    secondary: '#FFFFFF',
    tertiary: '#F1F3F6',
  },

  // 边框色
  border: {
    light: '#E5E5EC', // 使用新的卡片阴影灰
    medium: '#D1D6DE',
    dark: '#B8BFC9',
    focus: '#4F6DFF', // 新增焦点状态边框色
  },

  // 语义化色彩 - 学习场景专用
  semantic: {
    // 学习状态
    learning: '#4F6DFF', // 学习中
    mastered: '#6BCF7A', // 已掌握
    forgotten: '#F76C6C', // 已遗忘
    reviewing: '#F4B942', // 复习中
    
    // 成就系统
    achievement: '#FF8A65', // 成就解锁
    streak: '#FFD54F', // 连续学习
    milestone: '#81C784', // 里程碑达成
    
    // 社交元素
    like: '#F76C6C', // 点赞
    share: '#4F6DFF', // 分享
    comment: '#6BCF7A', // 评论
  },
} as const;

export type ColorToken = typeof colors; 