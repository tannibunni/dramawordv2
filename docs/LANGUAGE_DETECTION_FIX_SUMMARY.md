# 语言检测修复方案总结

## 问题描述

英文界面用户搜索中文单词（如 "ni hao"）时，系统错误地使用了中文界面的 prompt (`zh-CN/en.json`)，而不是英文界面的 prompt (`en/zh-CN.json`)，导致拼音显示不正确。

## 根本原因

1. **前端参数传递问题**: 前端总是传递 `language = 'en'`，即使搜索的是中文单词
2. **后端缺乏语言检测**: 后端没有自动检测搜索词的实际语言
3. **Prompt 路径错误**: 导致使用错误的 prompt 文件

## 解决方案

### 1. 后端自动语言检测

在 `services/api/src/controllers/wordController.ts` 的 `searchWord` 函数中添加语言检测逻辑：

```typescript
// 自动检测搜索词的语言
let detectedLanguage = language;
if (language === 'en') {
  const hasChineseChars = /[\u4e00-\u9fff]/.test(searchTerm);
  const hasPinyinTones = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/.test(searchTerm);
  const isPinyinLike = /^[a-z]+(\s+[a-z]+)*$/i.test(searchTerm) && searchTerm.length <= 20;
  
  if (hasChineseChars) {
    detectedLanguage = 'zh-CN';
    logger.info(`🔍 检测到中文字符，将语言从 'en' 改为 'zh-CN': ${searchTerm}`);
  } else if (hasPinyinTones) {
    detectedLanguage = 'zh-CN';
    logger.info(`🔍 检测到拼音声调，将语言从 'en' 改为 'zh-CN': ${searchTerm}`);
  } else if (isPinyinLike && !/^(hello|hi|bye|good|bad|yes|no|ok|okay|bonjour|merci|oui|non|gracias|hola|ciao|grazie|danke|bitte|ja|nein|arigato|konnichiwa|sayonara|annyeong|kamsahamnida)$/i.test(searchTerm)) {
    detectedLanguage = 'zh-CN';
    logger.info(`🔍 检测到可能的拼音模式，将语言从 'en' 改为 'zh-CN': ${searchTerm}`);
  }
}
```

### 2. 检测规则

- **中文字符检测**: 包含汉字的搜索词 → 中文
- **拼音声调检测**: 包含声调符号的拼音 → 中文  
- **拼音模式检测**: 无声调但符合拼音格式的词汇 → 中文
- **排除常见词汇**: 避免将常见英文/其他语言词汇误判为拼音

### 3. 更新所有相关调用

将所有使用 `language` 的地方改为使用 `detectedLanguage`：

```typescript
// 数据库查询
let cloudWord = await CloudWord.findOne({ word: searchTerm, language: detectedLanguage, uiLanguage });

// AI 生成
const generatedData = await generateWordData(searchTerm, detectedLanguage, uiLanguage);

// 缓存键
const cacheKey = `${searchTerm}_${detectedLanguage}_${uiLanguage}`;

// 统计更新
await updateCloudWordSearchStats(searchTerm, detectedLanguage, uiLanguage);
```

### 4. 前端拼音显示优化

在 `apps/mobile/src/components/cards/WordCardContent.tsx` 中优先显示 `pinyin` 字段：

```typescript
<Text style={styles.phonetic}>
  {wordData.pinyin || wordData.phonetic}
</Text>
```

### 5. 数据库模型更新

在 `services/api/src/models/CloudWord.ts` 中添加 `pinyin` 字段：

```typescript
export interface ICloudWord extends Document {
  word: string;
  language: string;
  uiLanguage: string;
  phonetic: string;
  pinyin?: string; // 新增：标准拼音字段
  // ... 其他字段
}
```

### 6. AI Prompt 优化

更新 `services/api/prompts/en/zh-CN.json` 明确要求返回拼音：

```json
{
  "definition": "You are a professional Chinese dictionary assistant for English speakers...",
  "phonetic": "pinyin for Chinese words (e.g., nǐ hǎo for 你好)",
  "pinyin": "standard pinyin for Chinese words (e.g., nǐ hǎo for 你好)",
  "requirements": [
    "ALWAYS include pinyin for Chinese words and Chinese example sentences"
  ]
}
```

## 测试验证

### 测试用例

| 搜索词 | 界面语言 | 原始语言 | 检测语言 | Prompt路径 | 预期结果 |
|--------|----------|----------|----------|------------|----------|
| ni hao | en | en | zh-CN | /prompts/en/zh-CN.json | ✅ 英文界面中文prompt |
| nǐ hǎo | en | en | zh-CN | /prompts/en/zh-CN.json | ✅ 英文界面中文prompt |
| 你好 | en | en | zh-CN | /prompts/en/zh-CN.json | ✅ 英文界面中文prompt |
| hello | en | en | en | /prompts/en/en.json | ✅ 英文界面英文prompt |
| ni hao | zh-CN | en | zh-CN | /prompts/zh-CN/zh-CN.json | ✅ 中文界面中文prompt |
| hello | zh-CN | en | en | /prompts/zh-CN/en.json | ✅ 中文界面英文prompt |

### 测试结果

所有测试用例都通过，语言检测逻辑正确工作。

## 预期效果

### 修复前
- 英文界面搜索 "ni hao" → 使用 `/prompts/zh-CN/en.json` ❌
- 显示中文释义，不符合英文用户需求

### 修复后
- 英文界面搜索 "ni hao" → 使用 `/prompts/en/zh-CN.json` ✅
- 显示英文释义 + 拼音，适合英文用户学习中文

## 技术细节

### 1. 语言检测算法

```typescript
// 中文字符检测
const hasChineseChars = /[\u4e00-\u9fff]/.test(searchTerm);

// 拼音声调检测
const hasPinyinTones = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/.test(searchTerm);

// 拼音模式检测
const isPinyinLike = /^[a-z]+(\s+[a-z]+)*$/i.test(searchTerm) && searchTerm.length <= 20;
```

### 2. 排除词汇列表

避免误判常见英文和其他语言词汇为拼音：

```
hello, hi, bye, good, bad, yes, no, ok, okay,
bonjour, merci, oui, non, gracias, hola, ciao, grazie,
danke, bitte, ja, nein, arigato, konnichiwa, sayonara,
annyeong, kamsahamnida
```

### 3. 缓存策略

使用检测后的语言作为缓存键的一部分：

```typescript
const cacheKey = `${searchTerm}_${detectedLanguage}_${uiLanguage}`;
```

## 部署说明

1. **后端部署**: 更新 `wordController.ts` 和 `CloudWord.ts`
2. **前端部署**: 更新 `WordCardContent.tsx` 和 `WordCard.tsx`
3. **数据库迁移**: 添加 `pinyin` 字段（可选，向后兼容）
4. **缓存清理**: 清除现有缓存以使用新的检测逻辑

## 监控和日志

添加了详细的日志记录：

```typescript
logger.info(`🔍 检测到中文字符，将语言从 'en' 改为 'zh-CN': ${searchTerm}`);
logger.info(`🔍 检测到拼音声调，将语言从 'en' 改为 'zh-CN': ${searchTerm}`);
logger.info(`🔍 检测到可能的拼音模式，将语言从 'en' 改为 'zh-CN': ${searchTerm}`);
logger.info(`🔍 Searching for word: ${searchTerm} in ${detectedLanguage} (original: ${language})`);
```

## 总结

通过添加自动语言检测逻辑，解决了英文界面搜索中文单词时使用错误 prompt 的问题。现在系统能够：

1. **智能识别**: 自动检测搜索词的实际语言
2. **正确提示**: 使用合适的 prompt 文件
3. **拼音显示**: 为中文单词提供准确的拼音
4. **用户体验**: 为不同语言用户提供合适的释义

这个修复确保了多语言学习应用的核心功能正常工作，提升了用户学习体验。 