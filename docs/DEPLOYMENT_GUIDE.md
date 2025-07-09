# 云单词表架构部署指南

## 概述

本文档介绍如何部署优化的云单词表架构，该架构通过云单词表避免重复存储相同的单词数据，提高存储效率和查询性能。

## 架构优势

### 1. 存储优化
- **避免重复**：相同单词只存储一份完整数据
- **节省空间**：用户单词本只存储个性化数据
- **提高效率**：减少存储空间和网络传输

### 2. 查询优化
- **快速查找**：云单词表有完整索引
- **缓存友好**：热门单词数据集中存储
- **统计准确**：全局搜索统计更准确

### 3. 维护优化
- **数据一致性**：单词数据统一管理
- **更新简单**：修改单词数据只需更新一处
- **备份高效**：云单词表可以独立备份

## 部署步骤

### 1. 环境准备

确保以下环境已准备就绪：

```bash
# 检查 Node.js 版本
node --version  # 建议 v16+

# 检查 MongoDB 连接
mongosh --version

# 检查 Redis 连接
redis-cli ping
```

### 2. 数据库配置

#### MongoDB 配置

确保 MongoDB 数据库已创建并配置：

```bash
# 连接到 MongoDB
mongosh

# 创建数据库
use dramaword

# 创建用户（可选）
db.createUser({
  user: "dramaword_user",
  pwd: "your_password",
  roles: ["readWrite"]
})
```

#### Redis 配置

确保 Redis 服务正在运行：

```bash
# 启动 Redis
redis-server

# 测试连接
redis-cli ping
```

### 3. 环境变量配置

创建 `.env` 文件：

```bash
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/dramaword
REDIS_URL=redis://localhost:6379

# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key

# 服务器配置
PORT=3001
NODE_ENV=production

# 认证配置（如果需要）
JWT_SECRET=your_jwt_secret
```

### 4. 安装依赖

```bash
# 安装后端依赖
cd services/api
npm install

# 安装前端依赖
cd ../../apps/mobile
npm install
```

### 5. 数据迁移

#### 自动迁移

运行数据迁移脚本：

```bash
cd services/api
npm run migrate
```

或者手动运行：

```bash
cd services/api
node src/utils/migrateToCloudWords.ts
```

#### 验证迁移

```bash
# 运行测试脚本
node test-cloud-words.js
```

### 6. 启动服务

#### 开发环境

```bash
# 启动后端服务
cd services/api
npm run dev

# 启动前端应用
cd ../../apps/mobile
npm start
```

#### 生产环境

```bash
# 构建前端
cd apps/mobile
npm run build

# 启动后端
cd ../../services/api
npm start
```

## 数据架构说明

### 1. 云单词表 (cloud_words)

存储所有用户查询过的单词，作为全局单词库。

```typescript
{
  _id: ObjectId,                    // 单词唯一ID
  word: String,                      // 单词（唯一）
  phonetic: String,                  // 音标
  definitions: Array<{...}>,         // 释义数组
  audioUrl: String,                  // 发音URL
  searchCount: Number,               // 总搜索次数
  lastSearched: Date,                // 最后搜索时间
  createdAt: Date,                   // 创建时间
  updatedAt: Date                    // 更新时间
}
```

### 2. 用户单词本表 (user_vocabulary)

存储用户个人单词本，通过引用关联到云单词表。

```typescript
{
  _id: ObjectId,                    // 记录唯一ID
  userId: String,                    // 用户ID
  wordId: ObjectId,                 // 关联到 cloud_words._id
  word: String,                      // 单词（冗余字段）
  
  // 用户个性化数据
  mastery: Number,                   // 掌握度 0-100
  reviewCount: Number,               // 复习次数
  correctCount: Number,              // 正确次数
  incorrectCount: Number,            // 错误次数
  lastReviewDate: Date,              // 最后复习时间
  nextReviewDate: Date,              // 下次复习时间
  interval: Number,                  // 复习间隔（小时）
  easeFactor: Number,                // 难度因子
  consecutiveCorrect: Number,        // 连续正确次数
  consecutiveIncorrect: Number,      // 连续错误次数
  totalStudyTime: Number,            // 总学习时间（秒）
  averageResponseTime: Number,       // 平均响应时间（秒）
  confidence: Number,                // 用户自信度 1-5
  notes: String,                     // 用户笔记
  tags: [String],                    // 用户标签
  
  // 来源信息
  sourceShow: {                      // 来源剧集信息
    id: Number,
    name: String,
    status: String
  },
  collectedAt: Date,                 // 收藏时间
  
  createdAt: Date,                   // 创建时间
  updatedAt: Date                    // 更新时间
}
```

### 3. 搜索历史表 (search_histories)

存储用户查词历史，支持游客模式。

```typescript
{
  _id: ObjectId,                    // 记录唯一ID
  word: String,                      // 搜索的单词
  wordId: ObjectId,                 // 关联到 cloud_words._id
  definition: String,                // 单词释义（冗余字段）
  timestamp: Date,                   // 搜索时间
  userId: String,                    // 用户ID（可选，游客模式为null）
  createdAt: Date,                   // 创建时间
  updatedAt: Date                    // 更新时间
}
```

## API 端点

### 公开路由

- `POST /words/search` - 搜索单词
- `GET /words/popular` - 获取热门单词
- `GET /words/recent-searches` - 获取最近搜索
- `POST /words/history` - 保存搜索历史

### 需要认证的路由

- `GET /words/user/vocabulary` - 获取用户单词本
- `POST /words/user/vocabulary` - 添加单词到用户单词本
- `PUT /words/user/progress` - 更新单词学习进度

### 调试路由

- `DELETE /words/debug/clear-all` - 清空所有数据
- `DELETE /words/debug/clear-user-history` - 清空用户搜索历史

## 性能监控

### 1. 关键指标

- 云单词表大小和增长趋势
- 用户单词本查询性能
- 联表查询响应时间
- 存储空间使用情况

### 2. 监控命令

```bash
# 检查数据库大小
mongosh --eval "db.stats()"

# 检查云单词表统计
mongosh --eval "db.cloudwords.stats()"

# 检查用户单词本统计
mongosh --eval "db.uservocabularies.stats()"

# 检查热门单词
mongosh --eval "db.cloudwords.find().sort({searchCount: -1}).limit(10)"
```

### 3. 优化建议

- 定期清理未使用的云单词
- 监控热门单词的访问模式
- 优化索引策略
- 考虑分片策略（数据量大时）

## 故障排除

### 1. 常见问题

#### 数据库连接失败

```bash
# 检查 MongoDB 服务状态
sudo systemctl status mongod

# 重启 MongoDB
sudo systemctl restart mongod
```

#### Redis 连接失败

```bash
# 检查 Redis 服务状态
sudo systemctl status redis

# 重启 Redis
sudo systemctl restart redis
```

#### 数据迁移失败

```bash
# 检查数据库连接
mongosh --eval "db.runCommand({ping: 1})"

# 手动运行迁移
node src/utils/migrateToCloudWords.ts
```

### 2. 日志查看

```bash
# 查看应用日志
tail -f services/api/logs/combined.log

# 查看错误日志
tail -f services/api/logs/error.log
```

### 3. 性能调优

```bash
# 检查慢查询
mongosh --eval "db.getProfilingStatus()"

# 启用慢查询日志
mongosh --eval "db.setProfilingLevel(1, 100)"
```

## 扩展性考虑

### 1. 多语言支持

- 云单词表可以扩展支持多语言
- 用户单词本可以关联到特定语言版本

### 2. 数据同步

- 云单词表可以作为主数据源
- 支持离线缓存和增量同步

### 3. 机器学习

- 基于云单词表的数据训练推荐算法
- 分析用户学习模式，优化学习路径

## 安全考虑

### 1. 数据保护

- 定期备份云单词表数据
- 加密敏感用户数据
- 实施访问控制

### 2. API 安全

- 使用 HTTPS
- 实施速率限制
- 验证用户输入

### 3. 监控告警

- 设置数据库连接监控
- 监控 API 响应时间
- 设置错误率告警

## 总结

云单词表架构通过避免重复存储相同的单词数据，大大提高了存储效率和查询性能。通过合理的索引设计和数据关系，确保了数据的一致性和完整性。

部署时请确保：

1. 环境配置正确
2. 数据迁移成功
3. 性能监控到位
4. 安全措施完善

如有问题，请参考故障排除部分或联系技术支持。 