# 数据库语言记录说明

## 概述

为了支持多语言查询和数据分析，`cloudwords` 数据库会记录每次查询的界面语言和目标语言信息。

## 数据库模型

### CloudWord 模型

```typescript
export interface ICloudWord extends Document {
  word: string;                    // 查询的单词
  language: string;                // 目标语言代码 (en, ko, ja, zh, fr, es)
  uiLanguage: string;              // 界面语言代码 (zh-CN, en)
  phonetic: string;                // 音标
  definitions: Array<{...}>;       // 释义数组
  audioUrl: string;                // 音频URL
  slangMeaning: string | null;     // 俚语含义
  phraseExplanation: string | null; // 短语解释
  correctedWord: string;           // 标准化单词
  searchCount: number;             // 搜索次数
  lastSearched: Date;              // 最后搜索时间
  createdAt: Date;                 // 创建时间
  updatedAt: Date;                 // 更新时间
}
```

### 语言字段说明

#### `language` (目标语言)
- **类型**: String
- **枚举值**: `['en', 'ko', 'ja', 'zh', 'fr', 'es']`
- **说明**: 用户要查询的目标语言
- **示例**: 
  - 中文用户查询英文单词 "hello" → `language: 'en'`
  - 英文用户查询中文单词 "你好" → `language: 'zh'`
  - 中文用户查询法语单词 "bonjour" → `language: 'fr'`

#### `uiLanguage` (界面语言)
- **类型**: String
- **默认值**: `'zh-CN'`
- **说明**: 用户当前使用的界面语言
- **示例**:
  - 中文界面 → `uiLanguage: 'zh-CN'`
  - 英文界面 → `uiLanguage: 'en'`

### 复合唯一索引

```typescript
// 确保同一单词在同一语言组合下只有一条记录
CloudWordSchema.index({ word: 1, language: 1, uiLanguage: 1 }, { unique: true });
```

## 数据流程

### 1. 前端请求

```typescript
// 前端发送请求时包含语言信息
const response = await fetch(`${API_BASE_URL}/words/search`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    word: 'hello',
    language: 'en',        // 目标语言：英文
    uiLanguage: 'zh-CN'    // 界面语言：中文
  }),
});
```

### 2. 后端处理

```typescript
export const searchWord = async (req: Request, res: Response): Promise<void> => {
  const { word, language = 'en', uiLanguage = 'zh-CN' } = req.body;
  
  // 使用语言信息查询数据库
  let cloudWord = await CloudWord.findOne({ 
    word: searchTerm, 
    language, 
    uiLanguage 
  });
  
  // 保存新记录时包含语言信息
  cloudWord = new CloudWord({
    word: searchTerm,
    language,           // 目标语言
    uiLanguage,         // 界面语言
    phonetic: generatedData.phonetic,
    definitions: generatedData.definitions,
    // ... 其他字段
  });
};
```

### 3. 数据库存储

```javascript
// MongoDB 中的实际记录示例
{
  "_id": ObjectId("..."),
  "word": "hello",
  "language": "en",           // 目标语言：英文
  "uiLanguage": "zh-CN",      // 界面语言：中文
  "phonetic": "/həˈloʊ/",
  "definitions": [
    {
      "partOfSpeech": "感叹词",
      "definition": "你好，打招呼用语",
      "examples": [...]
    }
  ],
  "searchCount": 1,
  "lastSearched": ISODate("2024-01-01T10:00:00Z"),
  "createdAt": ISODate("2024-01-01T10:00:00Z"),
  "updatedAt": ISODate("2024-01-01T10:00:00Z")
}
```

## 查询场景示例

### 场景1：中文用户查询英文单词
- **用户操作**: 中文界面下搜索 "hello"
- **数据库记录**:
  ```javascript
  {
    "word": "hello",
    "language": "en",        // 目标语言：英文
    "uiLanguage": "zh-CN",   // 界面语言：中文
    "definitions": [
      {
        "definition": "你好，打招呼用语",  // 中文释义
        "examples": [
          {
            "english": "Hello, how are you?",  // 英文例句
            "chinese": "你好，你好吗？"         // 中文翻译
          }
        ]
      }
    ]
  }
  ```

### 场景2：英文用户查询中文单词
- **用户操作**: 英文界面下搜索 "你好"
- **数据库记录**:
  ```javascript
  {
    "word": "你好",
    "language": "zh",        // 目标语言：中文
    "uiLanguage": "en",      // 界面语言：英文
    "definitions": [
      {
        "definition": "Hello, a greeting",     // 英文释义
        "examples": [
          {
            "chinese": "你好，很高兴见到你。",  // 中文例句
            "english": "Hello, nice to meet you." // 英文翻译
          }
        ]
      }
    ]
  }
  ```

### 场景3：中文用户查询法语单词
- **用户操作**: 中文界面下搜索 "bonjour"
- **数据库记录**:
  ```javascript
  {
    "word": "bonjour",
    "language": "fr",        // 目标语言：法语
    "uiLanguage": "zh-CN",   // 界面语言：中文
    "definitions": [
      {
        "definition": "你好，早安",            // 中文释义
        "examples": [
          {
            "french": "Bonjour, comment allez-vous?",  // 法语例句
            "chinese": "你好，你好吗？"                 // 中文翻译
          }
        ]
      }
    ]
  }
  ```

## 数据分析价值

### 1. 用户行为分析
- **语言偏好**: 分析用户最常查询的语言组合
- **界面使用**: 了解用户偏好的界面语言
- **学习模式**: 识别用户的学习路径（如：中文→英文→法语）

### 2. 内容优化
- **热门查询**: 识别最受欢迎的语言组合
- **缺失内容**: 发现缺少的语言组合数据
- **质量改进**: 针对特定语言组合优化AI prompt

### 3. 性能优化
- **缓存策略**: 根据语言组合优化缓存
- **负载均衡**: 分析不同语言组合的查询负载
- **资源分配**: 合理分配多语言处理资源

## 查询示例

### 查找特定语言组合的记录
```javascript
// 查找中文界面查询英文单词的记录
db.cloudwords.find({
  uiLanguage: "zh-CN",
  language: "en"
})

// 查找英文界面查询中文单词的记录
db.cloudwords.find({
  uiLanguage: "en",
  language: "zh"
})
```

### 统计语言组合使用情况
```javascript
// 统计各语言组合的查询次数
db.cloudwords.aggregate([
  {
    $group: {
      _id: {
        uiLanguage: "$uiLanguage",
        language: "$language"
      },
      totalSearches: { $sum: "$searchCount" },
      uniqueWords: { $addToSet: "$word" }
    }
  },
  {
    $project: {
      uiLanguage: "$_id.uiLanguage",
      targetLanguage: "$_id.language",
      totalSearches: 1,
      uniqueWordCount: { $size: "$uniqueWords" }
    }
  }
])
```

### 查找最受欢迎的语言组合
```javascript
// 查找搜索次数最多的语言组合
db.cloudwords.aggregate([
  {
    $group: {
      _id: {
        uiLanguage: "$uiLanguage",
        language: "$language"
      },
      totalSearches: { $sum: "$searchCount" }
    }
  },
  {
    $sort: { totalSearches: -1 }
  },
  {
    $limit: 10
  }
])
```

## 注意事项

1. **数据完整性**: 确保每次查询都正确记录语言信息
2. **性能考虑**: 复合索引可能影响写入性能，但查询性能更好
3. **数据清理**: 定期清理过时或错误的语言记录
4. **隐私保护**: 语言数据可能涉及用户隐私，需要妥善处理
5. **扩展性**: 为未来添加新语言预留扩展空间 