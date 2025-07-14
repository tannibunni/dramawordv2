# MongoDB Atlas 数据库架构文档

## 📊 数据库概览

**数据库名称**: dramaword  
**总集合数**: 4  
**总文档数**: 6  
**连接串**: `mongodb+srv://lt14gs:WZ7KwUo1F2SK0N6W@dramaword.azbr3wj.mongodb.net/?retryWrites=true&w=majority&appName=dramaword`

---

## 🏗️ 集合详细分析

### 1. `words` 集合 - 单词核心数据

**用途**: 存储所有查询过的单词的完整信息，作为知识库缓存

**数据结构**:
```json
{
  "_id": "686b15578fe292b931db34b5",
  "word": "hello",
  "phonetic": "/həˈloʊ/",
  "definitions": [
    {
      "partOfSpeech": "interjection",
      "definition": "你好，喂",
      "examples": [
        {
          "english": "Hello, how are you?",
          "chinese": "你好，你好吗？",
          "_id": "686b15578fe292b931db34b7"
        },
        {
          "english": "Hello, it's nice to meet you.",
          "chinese": "你好，很高兴见到你。",
          "_id": "686b15578fe292b931db34b8"
        }
      ],
      "_id": "686b15578fe292b931db34b6"
    }
  ],
  "searchCount": 2,
  "lastSearched": "2025-07-07T00:31:21.295Z",
  "createdAt": "2025-07-07T00:31:19.063Z",
  "updatedAt": "2025-07-07T00:31:21.297Z",
  "__v": 0
}
```

**功能**:
- ✅ 缓存单词释义，避免重复调用 AI
- ✅ 统计热门单词
- ✅ 提供单词的完整信息（音标、释义、例句）
- ✅ 支持多词性、多释义、多例句

---

### 2. `users` 集合 - 用户账户管理

**用途**: 存储用户基本信息、认证数据、设置偏好

**数据结构**:
```json
{
  "_id": "686b2ea602fad9c2a3ebd10d",
  "username": "testuser",
  "nickname": "测试用户",
  "avatar": null,
  "auth": {
    "loginType": "guest",
    "guestId": "guest_123456",
    "lastLoginAt": "2025-07-07T02:20:53.171Z",
    "isActive": true
  },
  "learningStats": {
    "totalWordsLearned": 0,
    "totalReviews": 0,
    "currentStreak": 0,
    "longestStreak": 0,
    "averageAccuracy": 0,
    "totalStudyTime": 0,
    "lastStudyDate": null,
    "level": 1,
    "experience": 0
  },
  "settings": {
    "notifications": {
      "dailyReminder": true,
      "reviewReminder": true,
      "achievementNotification": true
    },
    "learning": {
      "dailyGoal": 20,
      "reviewInterval": 24,
      "autoPlayAudio": true,
      "showPhonetic": true
    },
    "privacy": {
      "shareProgress": false,
      "showInLeaderboard": true
    },
    "theme": "auto",
    "language": "zh-CN"
  },
  "createdAt": "2025-07-07T02:19:18.980Z",
  "updatedAt": "2025-07-07T02:20:53.172Z",
  "__v": 0
}
```

**功能**:
- ✅ 用户注册登录（支持微信、Apple、手机号、游客）
- ✅ 个人资料管理
- ✅ 学习统计追踪
- ✅ 个性化设置存储
- ✅ 学习进度可视化

---

### 3. `searchhistories` 集合 - 搜索历史记录

**用途**: 记录用户的所有查词历史，用于"最近查词"功能

**数据结构**:
```json
{
  "_id": "686b15578fe292b931db34ba",
  "word": "hello",
  "definition": "你好，喂",
  "timestamp": "2025-07-07T00:31:19.134Z",
  "createdAt": "2025-07-07T00:31:19.134Z",
  "updatedAt": "2025-07-07T00:31:19.134Z",
  "__v": 0
}
```

**功能**:
- ✅ 显示"最近查词"列表
- ✅ 快速重新查询历史单词
- ✅ 分析用户查词习惯
- ✅ 提供个性化推荐

---

### 4. `userlearningrecords` 集合 - 学习进度追踪

**用途**: 存储每个用户对每个单词的详细学习记录，实现间隔重复算法

**数据结构**:
```json
{
  "_id": "686b2ea702fad9c2a3ebd10f",
  "userId": "686b2ea602fad9c2a3ebd10d",
  "records": [
    {
      "word": "hello",
      "mastery": 80,
      "reviewCount": 5,
      "correctCount": 4,
      "incorrectCount": 1,
      "lastReviewDate": "2024-12-19T10:00:00.000Z",
      "nextReviewDate": "2024-12-20T10:00:00.000Z",
      "interval": 24,
      "easeFactor": 2.5,
      "consecutiveCorrect": 3,
      "consecutiveIncorrect": 0,
      "totalStudyTime": 240,
      "averageResponseTime": 3,
      "confidence": 4,
      "notes": "",
      "tags": [
        "basic",
        "greeting"
      ],
      "_id": "686b2ef12ae378feb5e6a6fb"
    }
  ],
  "totalWords": 1,
  "totalReviews": 0,
  "averageMastery": 80,
  "lastStudyDate": "2025-07-07T02:19:19.052Z",
  "createdAt": "2025-07-07T02:19:19.053Z",
  "updatedAt": "2025-07-07T02:20:53.028Z",
  "__v": 1
}
```

**学习算法字段说明**:
- **`mastery`**: 掌握度 (0-100)，表示对单词的掌握程度
- **`reviewCount`**: 复习次数
- **`correctCount`**: 正确回答次数
- **`incorrectCount`**: 错误回答次数
- **`interval`**: 下次复习间隔（小时）
- **`easeFactor`**: 难度因子 (1.3-2.5)
- **`consecutiveCorrect`**: 连续正确次数
- **`confidence`**: 用户自信度 (1-5)

**功能**:
- ✅ 间隔重复算法（类似 Anki）
- ✅ 个性化复习计划
- ✅ 学习进度可视化
- ✅ 智能推荐系统
- ✅ 掌握度追踪

---

## 🔄 数据流关系

```
用户查询单词
    ↓
1. 检查 words 集合（是否有缓存）
    ↓
2. 记录到 searchhistories（搜索历史）
    ↓
3. 更新 userlearningrecords（学习记录）
    ↓
4. 收藏单词时关联到用户
```

## 🎯 核心价值

| 集合 | 作用 | 类比 |
|------|------|------|
| **`words`** | 知识库 | 词典数据库 |
| **`users`** | 身份管理 | 用户账户系统 |
| **`searchhistories`** | 行为记录 | 浏览历史 |
| **`userlearningrecords`** | 学习引擎 | 智能复习算法 |

## 📈 当前数据状态

- **单词数量**: 1 个 (hello)
- **用户数量**: 1 个 (testuser)
- **搜索记录**: 3 条
- **学习记录**: 1 条

## 🔧 技术特点

1. **Mongoose ODM**: 使用 Mongoose 进行数据建模
2. **索引优化**: 为常用查询字段创建索引
3. **数据验证**: 使用 Mongoose Schema 进行数据验证
4. **时间戳**: 自动记录创建和更新时间
5. **版本控制**: 使用 `__v` 字段进行乐观锁

## 🚀 扩展性

- **水平扩展**: MongoDB Atlas 支持自动分片
- **读写分离**: 支持主从复制
- **备份恢复**: 自动备份和点时间恢复
- **监控告警**: 内置性能监控和告警

---

*最后更新: 2025-07-12* 