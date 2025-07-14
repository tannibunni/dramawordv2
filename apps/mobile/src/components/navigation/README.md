# 剧词记底部导航栏

## 📱 功能特性

### 支持的页面
1. **🔍 查词页** - 首页，闪卡滑动
2. **📚 单词表页** - 已收藏的单词
3. **🔁 复习页** - 复习计划+滑动记忆
4. **🎬 剧单页** - 剧集管理
5. **🙋‍♀️ 用户页** - 学习数据、成就展示

### UI 设计特点
- 遵循剧词记设计系统
- 白底 + 阴影设计
- 图标清晰可爱，使用 Ionicons
- 选中状态：主色 #4F6DFF
- 未选中状态：浅灰 #A0A0A0
- 图标下方带简短文本

## 🧩 组件结构

```
src/components/navigation/
├── BottomTabBar.tsx    # 底部导航栏组件
├── MainLayout.tsx      # 主应用布局组件
├── index.ts           # 导出文件
└── README.md          # 说明文档

src/screens/
├── WordSearch/        # 查词页面
├── Vocabulary/        # 单词表页面
├── Review/           # 复习页面
├── Shows/            # 剧单页面
└── Profile/          # 用户页面
```

## 🚀 快速开始

### 1. 基本使用

```tsx
import { MainLayout } from './src/components/navigation';

const App = () => {
  return <MainLayout initialTab="search" />;
};
```

### 2. 单独使用底部导航栏

```tsx
import { BottomTabBar, TabType } from './src/components/navigation';

const MyComponent = () => {
  const [activeTab, setActiveTab] = useState<TabType>('search');

  return (
    <BottomTabBar
      activeTab={activeTab}
      onTabPress={setActiveTab}
    />
  );
};
```

### 3. 演示页面

```tsx
import { NavigationDemo } from './src/screens/NavigationDemo';

<NavigationDemo />
```

## 🎨 设计系统

### 颜色规范
- **选中状态**: `#4F6DFF` (主色)
- **未选中状态**: `#A0A0A0` (浅灰)
- **背景色**: `#FFFFFF` (白色)
- **边框色**: `#E5E5EC` (浅灰)

### 图标规范
- **查词页**: `search-outline` / `search`
- **单词表**: `library-outline` / `library`
- **复习页**: `refresh-outline` / `refresh`
- **剧单页**: `film-outline` / `film`
- **用户页**: `person-outline` / `person`

### 样式规范
- **图标大小**: 24px
- **文字大小**: 12px
- **字重**: 500 (Medium)
- **圆角**: 无
- **阴影**: 轻微投影效果

## 🔧 技术实现

### 依赖项
```json
{
  "@expo/vector-icons": "^13.0.0",
  "react-native": "^0.72.0"
}
```

### 类型定义
```tsx
export type TabType = 'search' | 'vocabulary' | 'review' | 'shows' | 'profile';

interface BottomTabBarProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
}
```

### 页面组件
每个页面都需要实现以下接口：
```tsx
interface PageComponent {
  // 页面组件应该是一个 React 函数组件
  // 不需要特定的 props 接口
}
```

## 📋 页面说明

### 1. 查词页 (WordSearchScreen)
- **功能**: 单词搜索和闪卡滑动
- **图标**: 🔍
- **状态**: 开发中

### 2. 单词表页 (VocabularyScreen)
- **功能**: 已收藏的单词管理
- **图标**: 📚
- **状态**: 基础界面完成

### 3. 复习页 (ReviewScreen)
- **功能**: 复习计划和滑动记忆
- **图标**: 🔁
- **状态**: 基础界面完成

### 4. 剧单页 (ShowsScreen)
- **功能**: 剧集管理
- **图标**: 🎬
- **状态**: 基础界面完成

### 5. 用户页 (ProfileScreen)
- **功能**: 学习数据和成就展示
- **图标**: 👤
- **状态**: 基础界面完成

## 🐛 常见问题

### Q: 如何自定义导航栏样式？
A: 修改 `BottomTabBar.tsx` 中的样式：

```tsx
const styles = StyleSheet.create({
  tabBar: {
    // 自定义样式
    backgroundColor: '#custom-color',
    // ...
  },
});
```

### Q: 如何添加新的页面？
A: 需要修改以下文件：

1. 在 `BottomTabBar.tsx` 中添加新的 TabType
2. 在 `TAB_ITEMS` 数组中添加新项目
3. 在 `MainLayout.tsx` 中添加新的 case
4. 创建对应的页面组件

### Q: 如何修改图标？
A: 在 `TAB_ITEMS` 数组中修改 icon 和 iconActive 属性：

```tsx
{
  key: 'search',
  title: '查词',
  icon: 'new-icon-outline',
  iconActive: 'new-icon',
}
```

## 📞 技术支持

如有问题，请查看：
1. 设计系统文档
2. Ionicons 图标库
3. React Native 官方文档
4. 组件 Props 类型定义

## 🎯 下一步计划

1. **完善页面功能** - 实现各个页面的具体功能
2. **添加动画效果** - 页面切换动画
3. **优化用户体验** - 加载状态和错误处理
4. **集成状态管理** - 与 Zustand 集成 