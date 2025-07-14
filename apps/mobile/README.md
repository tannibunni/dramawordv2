# 剧词记移动端应用

## 快速开始

### 环境要求
- Node.js 16+ 
- npm 或 yarn
- Expo CLI
- iOS Simulator (可选)
- Android Emulator (可选)
- 或使用 Expo Go 应用

### 安装依赖
```bash
# 进入移动端目录
cd apps/mobile

# 安装依赖
npm install
```

### 启动开发服务器
```bash
# 启动Expo开发服务器
npm start
```

### 预览方式

#### 1. 使用 Expo Go (推荐)
1. 在手机上安装 [Expo Go](https://expo.dev/client) 应用
2. 运行 `npm start` 后扫描终端中显示的二维码
3. 应用将在手机上打开

#### 2. 使用 iOS Simulator
```bash
# 启动iOS模拟器
npm run ios
```

#### 3. 使用 Android Emulator
```bash
# 启动Android模拟器
npm run android
```

#### 4. 使用 Web 浏览器
```bash
# 在浏览器中打开
npm run web
```

## 项目结构

```
apps/mobile/
├── src/
│   ├── screens/              # 页面组件
│   │   ├── Auth/            # 认证相关页面
│   │   ├── WordSearch/      # 查词页面
│   │   ├── Vocabulary/      # 单词表页面
│   │   ├── Review/          # 复习页面
│   │   ├── Shows/           # 剧单页面
│   │   ├── Profile/         # 用户页面
│   │   └── DemoScreen.tsx   # 演示页面
│   ├── components/          # 可复用组件
│   │   ├── auth/           # 认证组件
│   │   └── navigation/     # 导航组件
│   ├── services/           # 服务层
│   ├── types/              # 类型定义
│   └── App.tsx             # 主应用组件
├── assets/                 # 静态资源
├── package.json           # 项目配置
├── app.json              # Expo配置
├── tsconfig.json         # TypeScript配置
└── babel.config.js       # Babel配置
```

## 功能演示

### 当前演示页面
- 设计系统展示
- 已完成功能列表
- 技术栈介绍
- 使用说明

### 完整功能体验
要体验完整的应用功能，请修改 `src/App.tsx`：

```tsx
import React from 'react';
import { MainLayout } from './components/navigation/MainLayout';

export default function App() {
  return <MainLayout />;
}
```

这将启动完整的应用，包括：
- 底部导航栏
- 查词页面
- 单词卡片页
- 登录页面等

## 开发指南

### 添加新页面
1. 在 `src/screens/` 下创建新页面组件
2. 在 `src/components/navigation/MainLayout.tsx` 中添加路由
3. 在 `src/components/navigation/BottomTabBar.tsx` 中添加导航项

### 使用设计系统
```tsx
import { colors, spacing, typography } from '../../../../packages/ui/src/tokens';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    padding: spacing[4],
  },
  title: {
    ...typography.heading.h2,
    color: colors.text.primary,
  },
});
```

### 调试技巧
- 使用 Expo DevTools 进行调试
- 在终端中查看日志输出
- 使用 React Native Debugger (可选)

## 常见问题

### Q: 无法启动开发服务器
A: 确保已安装所有依赖，尝试删除 `node_modules` 并重新安装

### Q: 二维码无法扫描
A: 确保手机和电脑在同一网络下，或使用 `--tunnel` 参数

### Q: 模拟器无法启动
A: 确保已正确安装 Xcode (iOS) 或 Android Studio (Android)

### Q: 热重载不工作
A: 尝试重启开发服务器或清除缓存

## 部署

### 构建生产版本
```bash
# 构建iOS版本
expo build:ios

# 构建Android版本
expo build:android
```

### 发布到应用商店
```bash
# 发布到App Store
expo submit:ios

# 发布到Google Play
expo submit:android
```

## 技术支持

如有问题，请查看：
- [Expo 文档](https://docs.expo.dev/)
- [React Native 文档](https://reactnative.dev/)
- 项目内的 README 文件 