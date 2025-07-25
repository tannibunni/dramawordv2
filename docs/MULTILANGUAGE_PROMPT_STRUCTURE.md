# 多语言 Prompt 结构说明

## 概述

本项目支持多种语言组合的单词查询，每种语言组合都有对应的 prompt 文件来确保 AI 返回正确的结构化数据。

## 文件结构

```
services/api/prompts/
├── zh-CN/          # 中文用户界面
│   ├── en.json     # 中文用户查询英文单词
│   ├── fr.json     # 中文用户查询法语单词
│   ├── es.json     # 中文用户查询西班牙语单词
│   ├── ja.json     # 中文用户查询日语单词
│   └── ko.json     # 中文用户查询韩语单词
└── en/             # 英文用户界面
    ├── zh-CN.json  # 英文用户查询中文单词
    ├── fr.json     # 英文用户查询法语单词
    ├── es.json     # 英文用户查询西班牙语单词
    ├── ja.json     # 英文用户查询日语单词
    └── ko.json     # 英文用户查询韩语单词
```

## 支持的语言组合

### 中文用户界面 (zh-CN)
- **中文 → 英文**: 查询英文单词，返回中文释义和英文例句
- **中文 → 法语**: 查询法语单词，返回中文释义和法语例句
- **中文 → 西班牙语**: 查询西班牙语单词，返回中文释义和西班牙语例句
- **中文 → 日语**: 查询日语单词，返回中文释义和日语例句
- **中文 → 韩语**: 查询韩语单词，返回中文释义和韩语例句

### 英文用户界面 (en)
- **英文 → 中文**: 查询中文单词，返回英文释义和中文例句
- **英文 → 法语**: 查询法语单词，返回英文释义和法语例句
- **英文 → 西班牙语**: 查询西班牙语单词，返回英文释义和西班牙语例句
- **英文 → 日语**: 查询日语单词，返回英文释义和日语例句
- **英文 → 韩语**: 查询韩语单词，返回英文释义和韩语例句

## 数据结构

### 标准返回格式

```json
{
  "correctedWord": "标准单词（如无需纠正则与原词相同）",
  "phonetic": "音标",
  "definitions": [
    {
      "partOfSpeech": "词性（如名词、副词等）",
      "definition": "释义（根据UI语言）",
      "examples": [
        {
          "primary": "主要语言例句",
          "secondary": "次要语言例句"
        }
      ]
    }
  ],
  "slangMeaning": {
    "definition": "俚语或缩写含义说明",
    "examples": [
      {
        "primary": "主要语言例句",
        "secondary": "次要语言例句"
      }
    ]
  },
  "phraseExplanation": {
    "definition": "短语含义说明",
    "examples": [
      {
        "primary": "主要语言例句",
        "secondary": "次要语言例句"
      }
    ]
  }
}
```

### 语言字段映射

| 目标语言 | 主要字段 | 次要字段 | 说明 |
|---------|---------|---------|------|
| en | english | chinese | 英文例句 + 中文翻译 |
| fr | french | chinese | 法语例句 + 中文翻译 |
| es | spanish | chinese | 西班牙语例句 + 中文翻译 |
| ja | japanese | chinese | 日语例句 + 中文翻译 |
| ko | korean | chinese | 韩语例句 + 中文翻译 |
| zh-CN | chinese | english | 中文例句 + 英文翻译 |

## 前端处理

### 类型定义

```typescript
// 例句结构
export interface Example {
  english?: string;
  chinese?: string;
  pinyin?: string;
  romaji?: string;
  japanese?: string;
  korean?: string;
  french?: string;
  spanish?: string;
  hangul?: string;
}

// 俚语/短语解释结构
export interface SpecialMeaning {
  definition: string;
  examples?: Example[];
}
```

### 显示逻辑

前端使用 `getExampleDisplay` 辅助函数来根据目标语言正确显示例句：

```typescript
const getExampleDisplay = (example: any, targetLanguage: string) => {
  const languageMap: { [key: string]: string[] } = {
    'en': ['english', 'chinese'],
    'fr': ['french', 'chinese'],
    'es': ['spanish', 'chinese'],
    'ja': ['japanese', 'chinese'],
    'ko': ['korean', 'chinese'],
    'zh-CN': ['chinese', 'english']
  };
  
  const fields = languageMap[targetLanguage] || ['english', 'chinese'];
  const [primaryField, secondaryField] = fields;
  
  return {
    primary: example[primaryField] || '',
    secondary: example[secondaryField] || ''
  };
};
```

## 使用示例

### 中文用户查询英文单词 "hello"

**Prompt**: `services/api/prompts/zh-CN/en.json`
**返回**:
```json
{
  "correctedWord": "hello",
  "phonetic": "/həˈloʊ/",
  "definitions": [
    {
      "partOfSpeech": "感叹词",
      "definition": "你好，打招呼用语",
      "examples": [
        {
          "english": "Hello, how are you?",
          "chinese": "你好，你好吗？"
        }
      ]
    }
  ],
  "slangMeaning": {
    "definition": "在俚语中，hello 也可以表示惊讶或困惑",
    "examples": [
      {
        "english": "Hello? Are you listening?",
        "chinese": "喂？你在听吗？"
      }
    ]
  }
}
```

### 英文用户查询中文单词 "你好"

**Prompt**: `services/api/prompts/en/zh-CN.json`
**返回**:
```json
{
  "correctedWord": "你好",
  "phonetic": "nǐ hǎo",
  "definitions": [
    {
      "partOfSpeech": "问候语",
      "definition": "Hello, a greeting",
      "examples": [
        {
          "chinese": "你好，很高兴见到你。",
          "english": "Hello, nice to meet you."
        }
      ]
    }
  ]
}
```

## 扩展新语言

要添加新的语言支持：

1. **创建 prompt 文件**: 在对应的 UI 语言目录下创建新的 prompt 文件
2. **更新类型定义**: 在 `WordDefinition` 和 `SpecialMeaning` 接口中添加新语言字段
3. **更新显示逻辑**: 在 `getExampleDisplay` 函数中添加新语言映射
4. **测试**: 确保新语言组合能正确返回和显示数据

## 注意事项

1. **向后兼容**: 所有新结构都支持旧格式，确保现有数据不会丢失
2. **语言一致性**: 确保 prompt 中的语言说明与实际的例句语言一致
3. **错误处理**: 前端需要处理缺失字段的情况，避免显示空白内容
4. **缓存清理**: 更新 prompt 后需要清理缓存以获取新的数据结构 