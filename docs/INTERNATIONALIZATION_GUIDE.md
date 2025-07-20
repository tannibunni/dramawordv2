# 🌍 国际化功能使用指南

## 功能概述

剧词记现在支持完整的国际化功能，用户可以在中文和英文之间自由切换，为后续添加更多语言做好准备。

## 🎯 主要特性

### 1. 应用语言切换
- **位置**：Profile页面 → 设置 → 语言设置
- **支持语言**：中文 (zh-CN)、英文 (en-US)
- **实时切换**：切换后立即生效，无需重启应用

### 2. 学习语言选择
- **位置**：Home页面搜索框下方
- **支持语言**：英语、韩语、日语
- **独立进度**：每种学习语言有独立的学习记录

## 🚀 使用方法

### 切换应用语言
1. 打开Profile页面
2. 点击"设置" → "语言设置"
3. 选择想要的语言（中文/English）
4. 应用界面立即切换为所选语言

### 切换学习语言
1. 在Home页面搜索框下方找到语言选择器
2. 点击想要学习的语言（🇺🇸英语、🇰🇷韩语、🇯🇵日语）
3. 搜索框占位符会自动更新

## 📱 界面变化

### 应用语言切换会影响：
- **Profile页面**：所有文本、按钮、设置项
- **Home页面**：搜索占位符、最近查词、清除历史等
- **Review页面**：挑战标题、按钮文本、统计信息
- **底部导航**：标签名称
- **通用组件**：确认框、错误提示、加载状态

### 学习语言切换会影响：
- **搜索功能**：支持不同语言的单词查询
- **学习进度**：独立的学习记录和统计
- **复习算法**：针对不同语言优化的复习策略

## 🔧 技术实现

### 文件结构
```
src/
├── constants/
│   └── translations.ts          # 翻译文件
├── context/
│   └── AppLanguageContext.tsx   # 应用语言上下文
└── components/
    └── profile/
        └── AppLanguageSelector.tsx  # 语言选择器组件
```

### 核心组件

#### 1. 翻译系统
```typescript
// 使用翻译函数
import { t } from '../constants/translations';

const text = t('guest_user', appLanguage); // 获取翻译文本
const textWithParams = t('mastered_cards', appLanguage, { count: 10 }); // 带参数的翻译
```

#### 2. 语言上下文
```typescript
// 在组件中使用
import { useAppLanguage } from '../context/AppLanguageContext';

const { appLanguage, setAppLanguage } = useAppLanguage();
```

#### 3. 语言选择器
```typescript
// 在Profile页面中使用
<AppLanguageSelector
  visible={languageModalVisible}
  onClose={() => setLanguageModalVisible(false)}
/>
```

## 📊 翻译覆盖范围

### 已翻译的页面
- ✅ Profile页面（用户信息、设置项）
- ✅ Home页面（搜索、最近查词）
- ✅ Review页面（挑战、统计）
- ✅ 底部导航栏
- ✅ 通用组件（按钮、提示）

### 翻译键分类
- **用户相关**：guest_user, login, settings 等
- **学习相关**：challenge, review, vocabulary 等
- **导航相关**：home, profile, shows 等
- **通用操作**：confirm, cancel, loading 等
- **错误提示**：network_error, server_error 等

## 🔮 扩展计划

### 短期计划
- [ ] 添加更多应用语言（日语、韩语）
- [ ] 优化翻译质量
- [ ] 添加语言特定的UI适配

### 长期计划
- [ ] 支持RTL语言（阿拉伯语、希伯来语）
- [ ] 动态语言包下载
- [ ] 用户自定义翻译

## 🐛 已知问题

1. **首次启动**：默认使用中文，用户需要手动切换到英文
2. **部分动态内容**：某些动态生成的内容可能未完全国际化
3. **第三方组件**：部分第三方组件可能不支持语言切换

## 📝 开发指南

### 添加新的翻译键
1. 在 `translations.ts` 中的 `TranslationKey` 类型添加新键
2. 在中文和英文翻译对象中添加对应翻译
3. 在组件中使用 `t()` 函数

### 添加新的应用语言
1. 在 `APP_LANGUAGES` 中添加新语言配置
2. 在 `translations` 对象中添加新语言的翻译
3. 更新 `AppLanguage` 类型定义

### 最佳实践
- 使用有意义的翻译键名称
- 支持参数替换（如 `{count}`）
- 保持翻译文本简洁明了
- 考虑不同语言的文本长度差异

## 🎯 总结

国际化功能已经完整实现，用户可以：
1. **自由切换应用界面语言**
2. **选择不同的学习语言**
3. **享受一致的多语言体验**

系统架构为后续扩展做好了准备，可以轻松添加更多语言支持。

---

**注意**：如果遇到任何问题或需要添加新的翻译，请参考技术实现部分或联系开发团队。 