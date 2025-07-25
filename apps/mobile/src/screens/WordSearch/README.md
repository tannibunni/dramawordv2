# 剧词记 - 查词功能

## 概述

剧词记的查词功能包含两个主要页面：
- **首页（查词页）**：提供搜索功能和最近查词记录
- **单词卡片页**：展示单词详细信息，支持收藏和忽略操作

## 功能特性

### 首页（查词页）

#### 主要功能
- 🔍 **智能搜索框**：支持实时输入，按回车搜索
- 📝 **最近查词记录**：显示最近查询的5个单词
- ⚙️ **设置按钮**：快速访问设置页面
- 🎨 **设计系统**：使用统一的设计语言

#### 交互说明
1. **搜索单词**：
   - 在搜索框输入英文单词
   - 按回车键或点击搜索按钮
   - 自动跳转到单词卡片页

2. **查看最近查词**：
   - 点击任意最近查词记录
   - 直接跳转到对应单词的卡片页

3. **清空搜索**：
   - 点击搜索框右侧的清除按钮
   - 快速清空输入内容

### 单词卡片页

#### 主要功能
- 📖 **单词展示**：大字体显示单词和音标
- 🔊 **发音功能**：点击发音按钮（开发中）
- 📚 **详细释义**：支持展开/收起查看完整释义
- ❤️ **收藏功能**：收藏单词到指定剧集
- ❌ **忽略功能**：忽略不需要的单词
- 🎭 **动画效果**：流畅的展开/收起动画

#### 交互说明
1. **查看详细释义**：
   - 点击"点击展开查看更多"
   - 查看所有词性和例句
   - 点击"点击收起"返回简洁视图

2. **收藏单词**：
   - 点击右上角心形图标
   - 选择要收藏到的剧集
   - 支持新建剧集

3. **忽略单词**：
   - 点击底部"忽略"按钮
   - 确认后返回首页

4. **返回首页**：
   - 点击左上角返回按钮
   - 或忽略单词后自动返回

## 技术实现

### 组件结构
```
WordSearchScreen (首页)
├── 顶部导航栏
├── 搜索框组件
└── 最近查词列表

WordCardScreen (单词卡片页)
├── 顶部导航栏
├── 单词卡片
│   ├── 正面（简洁视图）
│   └── 背面（详细视图）
└── 底部操作按钮
```

### 导航系统
- 使用自定义导航上下文管理页面跳转
- 支持参数传递和返回功能
- 集成底部导航栏

### 设计系统
- 使用统一的设计令牌（颜色、字体、间距）
- 响应式布局适配不同屏幕
- 一致的视觉风格

### 动画效果
- 使用React Native Animated API
- 流畅的展开/收起动画
- 淡入淡出效果

## 使用方法

### 开发环境
```bash
# 进入移动端目录
cd apps/mobile

# 安装依赖
npm install

# 启动开发服务器
npm start
```

### 运行演示
1. 打开 `WordSearchDemo.tsx` 查看功能说明
2. 使用 `MainLayout` 组件体验完整功能
3. 在首页输入单词或点击最近查词记录
4. 在单词卡片页体验各种交互功能

### 自定义配置
- 修改 `colors.ts` 调整颜色主题
- 修改 `spacing.ts` 调整间距系统
- 修改 `typography.ts` 调整字体样式

## 后续开发计划

### 功能增强
- [ ] 集成真实的单词API
- [ ] 实现发音功能
- [ ] 添加单词历史记录持久化
- [ ] 支持离线查词

### 交互优化
- [ ] 添加手势滑动支持
- [ ] 优化动画性能
- [ ] 添加触觉反馈
- [ ] 支持深色模式

### 用户体验
- [ ] 添加加载状态
- [ ] 优化错误处理
- [ ] 添加用户引导
- [ ] 支持多语言

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License 