# 剧词记 (DramaWord) 项目概览

## 📱 项目简介

**剧词记** 是一款基于美剧学习英语单词的移动应用，通过AI技术提供智能化的单词学习和复习体验。用户可以通过观看美剧、搜索单词、收藏词汇、制定学习计划等方式，实现个性化的英语学习。

### 🎯 核心价值
- **情境化学习**：通过美剧场景学习单词，提高记忆效果
- **AI智能推荐**：基于艾宾浩斯遗忘曲线的智能学习算法
- **个性化体验**：根据用户学习行为提供定制化学习建议
- **多平台支持**：支持微信、Apple、手机号等多种登录方式

## 🏗️ 项目架构

### 整体架构
```
dramawordv2/
├── apps/mobile/          # React Native 移动应用
├── services/api/         # Express.js 后端API服务
├── packages/ui/          # 共享UI组件库
├── docs/                 # 项目文档
└── scripts/              # 工具脚本
```

### 技术栈

#### 前端技术栈
- **框架**: React Native + Expo SDK 53
- **语言**: TypeScript
- **状态管理**: Context API + 自定义Hooks
- **导航**: React Navigation 6
- **UI组件**: 自研设计系统
- **图表**: react-native-chart-kit
- **存储**: AsyncStorage
- **音频**: expo-av
- **图片处理**: expo-image-picker

#### 后端技术栈
- **框架**: Express.js + TypeScript
- **数据库**: MongoDB Atlas
- **AI服务**: OpenAI API
- **认证**: JWT + 第三方登录
- **文件上传**: Multer
- **部署**: Render.com

## 📁 目录结构详解

### `/apps/mobile/` - 移动应用主目录

#### 核心文件
- `App.tsx` - 应用入口，配置音频模式和全局Context
- `package.json` - 移动应用依赖配置
- `app.json` - Expo应用配置

#### `/src/` - 源代码目录

##### `/components/` - 组件库
- `/auth/` - 认证相关组件
  - `LoginButton.tsx` - 登录按钮组件
  - `PhoneLoginModal.tsx` - 手机号登录模态框
- `/cards/` - 卡片组件
  - `WordCard.tsx` - 单词卡片组件
  - `FlipWordCard.tsx` - 翻转单词卡片
  - `SwipeableWordCard.tsx` - 可滑动单词卡片
- `/common/` - 通用组件
  - `LoadingStates.tsx` - 加载状态组件
- `/learning/` - 学习相关组件
  - `LearningProgressChart.tsx` - 学习进度图表
  - `LearningStatsSection.tsx` - 学习统计区域
  - `BadgeModal.tsx` - 徽章模态框
  - `BadgeSection.tsx` - 徽章展示区域
- `/navigation/` - 导航组件
  - `MainLayout.tsx` - 主布局组件
  - `BottomTabBar.tsx` - 底部标签栏
- `/profile/` - 个人资料组件
  - `EditProfileModal.tsx` - 编辑资料模态框
- `/vocabulary/` - 词汇管理组件
  - `WordList.tsx` - 单词列表组件
- `/wordbook/` - 单词本组件
  - `WordbookEditModal.tsx` - 单词本编辑模态框

##### `/screens/` - 页面组件
- `/Auth/` - 认证页面
  - `LoginScreen.tsx` - 登录页面
- `/Home/` - 首页
  - `HomeScreen.tsx` - 主页面，包含搜索、剧集管理
- `/Learning/` - 学习页面
  - `LearningAnalyticsScreen.tsx` - 学习分析页面
- `/Profile/` - 个人中心
  - `ProfileScreen.tsx` - 个人资料页面
  - `SubscriptionScreen.tsx` - 订阅页面
- `/Review/` - 复习页面
  - `ReviewScreen.tsx` - 复习页面
  - `ReviewIntroScreen.tsx` - 复习介绍页面
- `/Shows/` - 剧集页面
  - `ShowsScreen.tsx` - 剧集管理页面
- `/Vocabulary/` - 词汇页面
  - `VocabularyScreen.tsx` - 词汇管理页面
- `/WordSearch/` - 单词搜索页面
  - `WordSearchScreen.tsx` - 单词搜索页面
  - `WordCardScreen.tsx` - 单词卡片详情页面

##### `/services/` - 服务层
- `apiClient.ts` - API客户端配置
- `wordService.ts` - 单词服务（搜索、历史记录）
- `authService.ts` - 认证服务
- `userService.ts` - 用户服务
- `learningAlgorithm.ts` - 学习算法（艾宾浩斯遗忘曲线）
- `learningDataService.ts` - 学习数据服务
- `learningStatsService.ts` - 学习统计服务
- `tmdbService.ts` - TMDB电影数据库服务
- `wechatService.ts` - 微信服务
- `appleService.ts` - Apple登录服务
- `audioService.ts` - 音频服务

##### `/context/` - 状态管理
- `AuthContext.tsx` - 认证状态管理
- `ShowListContext.tsx` - 剧集列表状态管理
- `VocabularyContext.tsx` - 词汇状态管理

##### `/hooks/` - 自定义Hooks
- `useUserExperience.ts` - 用户体验Hook

##### `/constants/` - 常量配置
- `colors.ts` - 颜色配置
- `config.ts` - 应用配置（API地址、主题等）

##### `/types/` - 类型定义
- `auth.ts` - 认证相关类型

#### `/assets/` - 静态资源
- `/images/` - 图片资源
  - 各种图标和头像图片

#### `/ios/` 和 `/android/` - 原生平台配置
- iOS和Android平台特定的配置文件

### `/services/api/` - 后端API服务

#### 核心文件
- `index.ts` - 服务器入口，配置中间件和路由
- `package.json` - 后端依赖配置

#### `/src/` - 源代码目录

##### `/config/` - 配置文件
- `database.ts` - 数据库连接配置
- `wechat.ts` - 微信配置
- `apple.ts` - Apple登录配置

##### `/controllers/` - 控制器
- `wordController.ts` - 单词相关API控制器
- `userController.ts` - 用户相关API控制器
- `syncController.ts` - 数据同步控制器
- `wechatController.ts` - 微信登录控制器
- `appleController.ts` - Apple登录控制器
- `tmdbController.ts` - TMDB数据控制器

##### `/models/` - 数据模型
- `User.ts` - 用户模型（认证、学习统计、设置）
- `Word.ts` - 单词模型（定义、搜索统计）
- `Show.ts` - 剧集模型（剧集信息、单词关联）
- `UserLearningRecord.ts` - 用户学习记录模型
- `UserVocabulary.ts` - 用户词汇模型
- `UserShowList.ts` - 用户剧集列表模型
- `SearchHistory.ts` - 搜索历史模型
- `CloudWord.ts` - 云端单词模型

##### `/routes/` - 路由定义
- `wordRoutes.ts` - 单词相关路由
- `user.ts` - 用户相关路由
- `sync.ts` - 数据同步路由
- `wechat.ts` - 微信登录路由
- `apple.ts` - Apple登录路由
- `tmdb.ts` - TMDB数据路由
- `debug.ts` - 调试路由

##### `/services/` - 业务服务
- `wechatService.ts` - 微信登录服务
- `appleService.ts` - Apple登录服务
- `syncService.ts` - 数据同步服务
- `tmdbService.ts` - TMDB数据服务

##### `/middleware/` - 中间件
- `auth.ts` - 认证中间件
- `validateRequest.ts` - 请求验证中间件
- `upload.ts` - 文件上传中间件

##### `/utils/` - 工具函数
- `logger.ts` - 日志工具
- `migrateToCloudWords.ts` - 数据迁移工具

#### `/logs/` - 日志文件
- `combined.log` - 综合日志
- `error.log` - 错误日志

### `/packages/ui/` - 共享UI组件库

#### 核心文件
- `package.json` - UI库依赖配置
- `src/App.tsx` - UI库演示应用

#### `/src/` - 源代码目录
- `/components/` - UI组件
  - `Button.tsx` - 按钮组件
  - `Card.tsx` - 卡片组件
  - `Input.tsx` - 输入框组件
  - `DesignSystem.tsx` - 设计系统组件
- `/tokens/` - 设计令牌
  - `colors.ts` - 颜色令牌
  - `spacing.ts` - 间距令牌
  - `typography.ts` - 字体令牌

### `/docs/` - 项目文档
- `DEVELOPMENT_PLAN.md` - 开发计划
- `DEPLOYMENT_GUIDE.md` - 部署指南
- `MONGODB_ATLAS_DATABASE_ARCHITECTURE.md` - 数据库架构
- `USER_LOGIN_INTEGRATION.md` - 用户登录集成
- `DATA_INTEGRATION_SUMMARY.md` - 数据集成总结
- `SEARCH_OPTIMIZATION_SUMMARY.md` - 搜索优化总结
- `WORD_COUNT_DISPLAY_IMPROVEMENT.md` - 单词计数显示改进
- `WORD_LIST_COMPONENT_INTEGRATION.md` - 单词列表组件集成
- `SEARCH_RESULT_DETAIL_FEATURE.md` - 搜索结果详情功能
- `CLEAR_DATA_GUIDE.md` - 数据清理指南

### `/scripts/` - 工具脚本
- `cleanupCloudWords.js` - 清理云端单词脚本
- `testDbConnection.js` - 测试数据库连接脚本

## 🚀 核心功能模块

### 1. 用户认证系统
- **多登录方式**: 支持微信、Apple、手机号、游客登录
- **JWT认证**: 基于Token的用户认证
- **用户资料管理**: 头像上传、昵称编辑
- **权限控制**: 基于角色的访问控制

### 2. 单词搜索系统
- **智能搜索**: 基于OpenAI API的单词查询
- **搜索历史**: 用户搜索记录管理
- **热门单词**: 基于搜索频率的热门单词推荐
- **单词详情**: 音标、释义、例句展示

### 3. 学习算法系统
- **艾宾浩斯遗忘曲线**: 基于科学记忆理论的学习算法
- **间隔重复**: 自适应间隔计算
- **掌握度评估**: 多维度评分系统
- **学习建议**: 基于学习行为的智能推荐

### 4. 词汇管理系统
- **单词收藏**: 用户词汇收藏功能
- **单词本**: 自定义单词本管理
- **学习进度**: 词汇学习进度跟踪
- **复习计划**: 智能复习计划生成

### 5. 剧集管理系统
- **TMDB集成**: 基于TMDB API的剧集信息
- **剧集收藏**: 用户剧集收藏功能
- **单词关联**: 剧集与单词的关联管理
- **难度评估**: 基于单词的剧集难度评估

### 6. 学习分析系统
- **学习统计**: 学习时间、正确率等统计
- **进度可视化**: 学习进度图表展示
- **成就系统**: 基于学习进度的成就徽章
- **学习建议**: 个性化学习建议

### 7. 数据同步系统
- **本地云端同步**: 本地数据与云端同步
- **冲突解决**: 数据冲突检测和解决
- **增量同步**: 高效的数据增量同步
- **离线支持**: 离线数据访问支持

## 🎨 设计系统

### 颜色系统
- **主色调**: #007AFF (iOS蓝)
- **辅助色**: #5856D6 (紫色)
- **功能色**: 成功(#34C759)、警告(#FF9500)、错误(#FF3B30)

### 字体系统
- **字体族**: Inter
- **字重**: Light(300)、Regular(400)、Medium(500)、Semibold(600)、Bold(700)
- **字号**: 12px-32px 8个等级

### 间距系统
- **基础单位**: 4px
- **间距等级**: 4px、8px、16px、24px、32px、48px

### 圆角系统
- **圆角等级**: 4px、8px、12px、16px、50px(圆形)

## 📊 数据模型

### 用户模型 (User)
```typescript
interface IUser {
  username: string;
  nickname: string;
  avatar?: string;
  email?: string;
  auth: IUserAuth;           // 认证信息
  learningStats: IUserLearningStats;  // 学习统计
  settings: IUserSettings;   // 用户设置
}
```

### 单词模型 (Word)
```typescript
interface IWord {
  word: string;
  phonetic: string;
  definitions: IWordDefinition[];
  searchCount: number;
  lastSearched: Date;
}
```

### 学习记录模型 (UserLearningRecord)
```typescript
interface IUserLearningRecord {
  userId: string;
  wordId: string;
  word: string;
  reviewCount: number;
  correctCount: number;
  masteryLevel: number;
  nextReviewDate: Date;
  learningEfficiency: number;
}
```

## 🔧 开发环境

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- Expo CLI
- MongoDB Atlas 账户
- OpenAI API 密钥

### 启动命令
```bash
# 安装所有依赖
npm run install:all

# 启动移动应用
npm run dev:mobile

# 启动API服务
npm run dev:api
```

## 📱 应用截图

### 主要页面
1. **登录页面** - 支持多种登录方式
2. **首页** - 单词搜索和剧集管理
3. **词汇页面** - 收藏单词和单词本管理
4. **学习页面** - 学习统计和进度分析
5. **复习页面** - 智能复习系统
6. **个人中心** - 用户资料和设置

## 🚀 部署信息

### 生产环境
- **API服务**: Render.com
- **数据库**: MongoDB Atlas
- **移动应用**: Expo EAS Build

### 环境变量
- `MONGODB_URI` - MongoDB连接字符串
- `OPENAI_API_KEY` - OpenAI API密钥
- `WECHAT_APP_ID` - 微信应用ID
- `APPLE_CLIENT_ID` - Apple客户端ID

## 📈 项目状态

### ✅ 已完成功能
- [x] 基础架构搭建
- [x] 用户认证系统
- [x] 单词搜索系统
- [x] 学习算法实现
- [x] 词汇管理系统
- [x] 剧集管理系统
- [x] 学习分析系统
- [x] 数据同步系统
- [x] 第三方登录集成
- [x] 单词表页面开发

### 🔄 进行中功能
- [ ] 高级功能开发
- [ ] 性能优化

### 📋 待开发功能
- [ ] 社交功能
- [ ] 成就系统
- [ ] 学习提醒
- [ ] 离线模式
- [ ] 多语言支持

## 🤝 贡献指南

### 开发流程
1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request

### 代码规范
- 使用 TypeScript
- 遵循 ESLint 规则
- 编写单元测试
- 更新相关文档

## 📄 许可证

MIT License

---

**剧词记团队** © 2024 