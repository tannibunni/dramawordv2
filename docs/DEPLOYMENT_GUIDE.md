# 剧词记部署和开发指南

## 📋 目录
- [环境准备](#环境准备)
- [本地开发](#本地开发)
- [生产部署](#生产部署)
- [数据库配置](#数据库配置)
- [常见问题](#常见问题)

## 🛠️ 环境准备

### 系统要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- Expo CLI
- MongoDB Atlas 账户
- OpenAI API 密钥

### 检查环境
```bash
# 检查 Node.js 版本
node --version  # 建议 v16+

# 检查 MongoDB 连接
mongosh --version

# 检查 Expo CLI
npx expo --version
```

## 🚀 本地开发

### 1. 项目启动

#### 方法一：使用根目录启动脚本（推荐）
```bash
# 在项目根目录下运行
./start-mobile.sh
```

#### 方法二：手动启动
```bash
# 安装所有依赖
npm run install:all

# 启动移动应用
npm run dev:mobile

# 启动API服务
npm run dev:api
```

### 2. 移动应用开发

#### 进入移动端目录
```bash
cd apps/mobile
```

#### 清理缓存并启动
```bash
npx expo start --clear
```

### 3. 预览方式

#### 使用 Expo Go 应用（推荐）
1. 在手机上安装 [Expo Go](https://expo.dev/client) 应用
2. 运行启动命令后，扫描终端中显示的二维码
3. 应用将在手机上打开

#### 使用 iOS Simulator
- 确保已安装 Xcode
- 在终端中按 `i` 键启动 iOS 模拟器

#### 使用 Android Emulator
- 确保已安装 Android Studio 和模拟器
- 在终端中按 `a` 键启动 Android 模拟器

#### 使用 Web 浏览器
- 在终端中按 `w` 键在浏览器中打开

### 4. 开发工具

#### 终端快捷键
- `r` - 重新加载应用
- `m` - 切换菜单
- `d` - 打开开发者工具
- `q` - 退出开发服务器

#### 调试技巧
- 摇动设备或按 `Cmd+D` (iOS) / `Cmd+M` (Android) 打开开发者菜单
- 使用 Expo DevTools 进行调试
- 在终端中查看日志输出

## 🏗️ 生产部署

### 1. 环境变量配置

创建 `.env` 文件：

```bash
# 数据库配置
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dramaword
REDIS_URL=redis://localhost:6379

# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key

# 服务器配置
PORT=3001
NODE_ENV=production

# 认证配置
JWT_SECRET=your_jwt_secret

# 第三方登录配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
APPLE_CLIENT_ID=your_apple_client_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
```

### 2. 数据库配置

#### MongoDB Atlas 配置
1. 登录 [MongoDB Atlas](https://cloud.mongodb.com)
2. 创建新项目或选择现有项目
3. 创建数据库集群
4. 获取连接字符串
5. 配置数据库用户和权限

#### 数据库集合
确保以下集合已创建：
- `users` - 用户数据
- `words` - 单词数据
- `searchhistories` - 搜索历史
- `userlearningrecords` - 学习记录
- `shows` - 剧集数据

### 3. 后端部署

#### Render.com 部署
1. 连接 GitHub 仓库到 Render
2. 配置环境变量
3. 设置构建命令：`npm install && npm run build`
4. 设置启动命令：`npm start`
5. 配置自动部署

#### 本地部署
```bash
cd services/api
npm install
npm run build
npm start
```

### 4. 前端部署

#### Expo EAS Build
```bash
# 安装 EAS CLI
npm install -g @expo/eas-cli

# 登录 Expo 账户
eas login

# 配置构建
eas build:configure

# 构建应用
eas build --platform ios
eas build --platform android
```

#### 本地构建
```bash
cd apps/mobile
npx expo build:android
npx expo build:ios
```

## 📊 数据库架构

### 云单词表架构优势

#### 1. 存储优化
- **避免重复**：相同单词只存储一份完整数据
- **节省空间**：用户单词本只存储个性化数据
- **提高效率**：减少存储空间和网络传输

#### 2. 查询优化
- **快速查找**：云单词表有完整索引
- **缓存友好**：热门单词数据集中存储
- **统计准确**：全局搜索统计更准确

#### 3. 维护优化
- **数据一致性**：单词数据统一管理
- **更新简单**：修改单词数据只需更新一处
- **备份高效**：云单词表可以独立备份

### 数据迁移

#### 自动迁移
```bash
cd services/api
npm run migrate
```

#### 手动迁移
```bash
cd services/api
node src/utils/migrateToCloudWords.ts
```

#### 验证迁移
```bash
node test-cloud-words.js
```

## 🔧 常见问题

### Q: 遇到 "Unable to resolve module" 错误
A: 
1. 清理缓存：`npx expo start --clear`
2. 删除 `node_modules` 并重新安装
3. 检查文件路径是否正确

### Q: 遇到 "Cannot find module 'metro'" 错误
A: 
1. 更新 Metro 配置
2. 清理所有缓存和依赖
3. 重新安装依赖

### Q: 遇到 "non-std C++ exception" 错误
A: 
1. 更新所有依赖版本以匹配 Expo SDK 53
2. 简化 App 组件，避免复杂的导航依赖
3. 清理缓存和 node_modules

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

### Q: 后端API连接失败
A:
1. 检查环境变量配置
2. 验证 MongoDB 连接字符串
3. 检查网络防火墙设置
4. 查看服务器日志

### Q: 数据库连接问题
A:
1. 检查 MongoDB Atlas 连接字符串
2. 验证数据库用户权限
3. 检查 IP 白名单设置
4. 测试网络连接

## 📱 应用功能

### 当前演示内容
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

---

**剧词记团队** © 2024 