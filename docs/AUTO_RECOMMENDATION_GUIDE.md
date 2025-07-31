# 🎬 自动推荐内容生成系统指南

## 📋 系统概述

自动推荐内容生成系统支持两种方式管理推荐内容：

1. **定期自动生成** - 从TMDB获取热门剧集，智能生成推荐内容
2. **手动批量导入** - 使用ChatGPT生成个性化推荐内容

## 🔄 定期生成方案

### 功能特性
- ✅ 自动从TMDB获取热门剧集
- ✅ 智能生成个性化推荐文案
- ✅ 支持中英文双语内容
- ✅ 自动上传到云端数据库
- ✅ 本地文件备份
- ✅ 定时自动更新（默认7天）

### 使用方法

#### 1. 设置环境变量
```bash
# 设置TMDB API密钥
export TMDB_API_KEY="your_tmdb_api_key_here"
```

#### 2. 执行一次生成
```bash
node scripts/auto-generate-recommendations.js
```

#### 3. 启动定时任务
```bash
node scripts/auto-generate-recommendations.js --schedule
```

#### 4. 查看帮助
```bash
node scripts/auto-generate-recommendations.js --help
```

### 配置选项

在 `scripts/auto-generate-recommendations.js` 中可以调整：

```javascript
class AutoRecommendationGenerator {
  constructor() {
    this.BATCH_SIZE = 20; // 每次生成的推荐数量
    this.UPDATE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7天更新一次
  }
}
```

### 输出文件

脚本会生成以下文件：
- `auto-generated-recommendations-zh-CN-YYYY-MM-DD.json` - 中文推荐内容
- `auto-generated-recommendations-en-US-YYYY-MM-DD.json` - 英文推荐内容
- `auto-generated-recommendations-mixed-YYYY-MM-DD.json` - 混合内容（上传失败时）

## 🎯 手动批量导入方案

### 使用ChatGPT生成

#### 1. 使用ChatGPT生成推荐内容
```bash
# 显示ChatGPT prompt模板
node scripts/generate-recommendations-with-chatgpt.js --show-prompt
```

#### 2. 处理ChatGPT输出
```bash
# 将ChatGPT返回的JSON保存到 output.json
# 然后运行处理脚本
node scripts/generate-recommendations-with-chatgpt.js
```

#### 3. 批量导入到云端
```bash
node scripts/manage-recommendations.js
```

## 📊 推荐内容格式

### 数据结构
```javascript
{
  tmdbShowId: 1396,
  title: "Breaking Bad",
  originalTitle: "Breaking Bad",
  backdropUrl: "https://image.tmdb.org/t/p/w780/...",
  posterUrl: "https://image.tmdb.org/t/p/w92/...",
  recommendation: {
    text: "神级2008年必看！犯罪剧巅峰之作，紧张刺激的剧情！学英语的同时体验精彩故事",
    difficulty: "hard",
    language: "zh-CN",
    category: ["crime", "drama"],
    tags: ["神级", "犯罪", "学英语"]
  },
  metadata: {
    genre: [80, 18],
    rating: 9.5,
    year: 2008,
    status: "active",
    priority: 8,
    views: 0,
    likes: 0
  },
  author: {
    id: "auto-generator",
    name: "Auto Generator"
  }
}
```

## 🚀 部署建议

### 生产环境部署

#### 1. 服务器定时任务
```bash
# 添加到 crontab
0 2 * * 0 cd /path/to/project && node scripts/auto-generate-recommendations.js
```

#### 2. Docker容器
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "scripts/auto-generate-recommendations.js", "--schedule"]
```

#### 3. 云函数部署
- AWS Lambda
- Google Cloud Functions
- Azure Functions

### 监控和日志

#### 1. 日志记录
脚本会自动记录：
- 生成进度
- 上传状态
- 错误信息
- 统计信息

#### 2. 健康检查
```bash
# 检查推荐内容数量
curl "https://dramawordv2.onrender.com/api/recommendations/stats"
```

## 🔧 故障排除

### 常见问题

#### 1. TMDB API限制
- 检查API密钥是否正确
- 确认API调用频率未超限
- 考虑使用备用API密钥

#### 2. 上传失败
- 检查网络连接
- 确认后端服务正常运行
- 查看本地备份文件

#### 3. 内容重复
- 系统会自动去重
- 检查TMDB ID是否重复
- 清理旧数据

### 调试模式

```bash
# 启用详细日志
DEBUG=* node scripts/auto-generate-recommendations.js
```

## 📈 性能优化

### 1. 批量处理
- 默认批量大小：20个推荐
- 可根据服务器性能调整
- 支持并发处理

### 2. 缓存策略
- 本地文件缓存
- 云端数据缓存
- 智能更新检测

### 3. 资源管理
- 内存使用优化
- 网络请求优化
- 错误重试机制

## 🎯 最佳实践

### 1. 内容质量
- 定期检查推荐文案质量
- 根据用户反馈调整算法
- 保持内容多样性

### 2. 更新频率
- 推荐：每周更新一次
- 热门剧集：实时更新
- 经典剧集：定期轮换

### 3. 用户反馈
- 收集用户点击数据
- 分析推荐效果
- 持续优化算法

## 📞 技术支持

如有问题，请检查：
1. 日志文件
2. 网络连接
3. API密钥状态
4. 后端服务状态

---

**总结**：系统支持灵活的推荐内容管理，既可以定期自动生成，也可以手动批量导入，满足不同的运营需求。 