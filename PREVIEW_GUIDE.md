# 🚀 剧词记前端预览指南

## ✅ 所有问题已解决！

### 已修复的问题：
1. **Expo SDK 版本不兼容** - 已更新到 SDK 53
2. **缺少资源文件** - 已移除对不存在文件的引用
3. **启动脚本路径问题** - 已在根目录创建启动脚本
4. **设计系统导入问题** - 已使用内联样式，无需外部依赖
5. **根目录package.json缺失** - 已创建monorepo配置
6. **React Native运行时错误** - 已更新所有依赖版本并简化App组件
7. **Metro配置问题** - 已使用官方模板重新配置项目
8. **App入口文件问题** - 已在根目录创建App.js入口文件

## 🎉 现在可以正常预览了！

### 方法一：使用根目录启动脚本（推荐）
```bash
# 在项目根目录下运行
./start-mobile.sh
```

### 方法二：手动启动
```bash
# 进入移动端目录
cd apps/mobile

# 清理缓存并启动
npx expo start --clear
```

## 📱 预览方式

### 1. 使用 Expo Go 应用（推荐）
1. 在手机上安装 [Expo Go](https://expo.dev/client) 应用
2. 运行启动命令后，扫描终端中显示的二维码
3. 应用将在手机上打开

### 2. 使用 iOS Simulator
- 确保已安装 Xcode
- 在终端中按 `i` 键启动 iOS 模拟器

### 3. 使用 Android Emulator
- 确保已安装 Android Studio 和模拟器
- 在终端中按 `a` 键启动 Android 模拟器

### 4. 使用 Web 浏览器
- 在终端中按 `w` 键在浏览器中打开

## 🎯 当前演示内容

### 简化版应用
当前运行的是一个简化版的应用，展示：
- ✅ 应用标题和基本信息
- ✅ 成功启动状态
- ✅ 技术栈说明
- ✅ 状态栏配置

### 完整应用体验
要体验完整的应用功能，请修改 `apps/mobile/src/App.tsx`：

```tsx
import React from 'react';
import DemoScreen from './screens/DemoScreen';

export default function App() {
  return <DemoScreen />;
}
```

这将启动完整的演示页面，包括：
- 🔍 查词页面（搜索和最近查词）
- 📖 单词卡片页（详细释义和收藏）
- 🔐 登录页面（多方式登录）
- 📱 底部导航栏（5个主要页面）

## 🛠️ 开发工具

### 终端快捷键
- `r` - 重新加载应用
- `m` - 切换菜单
- `d` - 打开开发者工具
- `q` - 退出开发服务器

### 调试技巧
- 摇动设备或按 `Cmd+D` (iOS) / `Cmd+M` (Android) 打开开发者菜单
- 使用 Expo DevTools 进行调试
- 在终端中查看日志输出

## 🔧 常见问题

### Q: 遇到 "Unable to resolve module ../../App" 错误
A: 
1. 已修复：在根目录创建了App.js入口文件
2. 更新了index.js以正确导入App组件
3. 确保文件路径正确

### Q: 遇到 "Cannot find module 'metro/src/ModuleGraph/worker/importLocationsPlugin'" 错误
A: 
1. 已修复：使用官方Expo模板重新配置了项目
2. 更新了所有配置文件（package.json, app.json, tsconfig.json）
3. 清理了所有缓存和依赖

### Q: 遇到 "non-std C++ exception" 错误
A: 
1. 已修复：更新了所有依赖版本以匹配Expo SDK 53
2. 简化了App组件，避免复杂的导航依赖
3. 清理了缓存和node_modules

### Q: 无法启动开发服务器
A: 
1. 确保在正确的目录下运行脚本
2. 检查 Node.js 版本（需要 16+）
3. 删除 `node_modules` 并重新安装依赖

### Q: 二维码无法扫描
A:
1. 确保手机和电脑在同一网络下
2. 使用 `--tunnel` 参数：`npx expo start --tunnel`

### Q: 模拟器无法启动
A:
1. iOS: 确保已安装 Xcode 和 iOS Simulator
2. Android: 确保已安装 Android Studio 和模拟器

### Q: 热重载不工作
A:
1. 重启开发服务器
2. 清除缓存：`npx expo start --clear`

## 📁 项目结构

```
dramawordv2/
├── package.json              # 根目录配置
├── apps/mobile/              # 移动端应用
│   ├── src/
│   │   ├── screens/          # 页面组件
│   │   │   ├── DemoScreen.tsx # 完整演示页面
│   │   │   ├── WordSearch/   # 查词功能
│   │   │   ├── Auth/        # 登录功能
│   │   │   └── ...          # 其他页面
│   │   ├── components/       # 可复用组件
│   │   ├── App.tsx          # 主应用组件（当前为简化版）
│   │   └── ...
│   ├── App.js               # 入口文件（新创建）
│   ├── index.js             # 应用注册文件
│   ├── package.json         # 项目配置（使用官方模板）
│   ├── app.json            # Expo配置（使用官方模板）
│   ├── tsconfig.json       # TypeScript配置（使用官方模板）
│   └── metro.config.js     # Metro配置
├── packages/ui/             # UI设计系统
├── start-mobile.sh         # 根目录启动脚本
└── PREVIEW_GUIDE.md        # 预览指南
```

## 🎨 设计系统

应用使用统一的设计系统：
- **主色**: #4F6DFF（蓝色）
- **辅助色**: #F4B942（黄色）
- **成功色**: #6BCF7A（绿色）
- **错误色**: #F76C6C（红色）

所有组件都遵循设计规范，确保一致的用户体验。

## 📞 技术支持

如有问题，请查看：
- [Expo 文档](https://docs.expo.dev/)
- [React Native 文档](https://reactnative.dev/)
- 项目内的 README 文件
- 或联系开发团队

## 🚀 立即开始预览！

运行 `./start-mobile.sh` 即可启动开发服务器并预览应用！

Expo 开发服务器已经在后台运行，您现在可以：
- 使用 Expo Go 应用扫描二维码
- 或在模拟器中预览应用
- 或在浏览器中查看

应用将显示一个简洁的启动页面，确认应用已成功运行！ 