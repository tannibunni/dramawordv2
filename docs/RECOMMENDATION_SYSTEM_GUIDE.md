# 🎯 推荐内容管理系统使用指南

## 📋 系统概述

这是一个完整的推荐内容管理系统，支持：
- ✅ 持续添加新的剧集推荐内容
- ✅ 通过数据库管理所有推荐文案
- ✅ 使用智能算法为用户推荐内容
- ✅ 通过管理界面轻松管理内容
- ✅ 批量导入大量推荐内容

## 🚀 具体使用步骤

### 第一步：系统部署

#### 1.1 后端部署
```bash
# 确保代码已推送到Git
git add .
git commit -m "🎯 推荐内容管理系统"
git push

# 等待Render自动部署（约2-3分钟）
```

#### 1.2 验证部署
```bash
# 测试健康检查
curl -X GET "https://dramawordv2.onrender.com/health"

# 测试推荐API
curl -X GET "https://dramawordv2.onrender.com/api/recommendations/stats"
```

### 第二步：批量导入示例数据

#### 2.1 运行批量导入脚本
```bash
node scripts/batch-import-recommendations.js
```

#### 2.2 验证导入结果
```bash
# 检查推荐统计
curl -X GET "https://dramawordv2.onrender.com/api/recommendations/stats"

# 获取推荐列表
curl -X GET "https://dramawordv2.onrender.com/api/recommendations"
```

### 第三步：前端集成

#### 3.1 启动前端应用
```bash
cd apps/mobile
npx expo start --clear
```

#### 3.2 测试推荐功能
1. 打开应用
2. 进入"剧单"页面
3. 点击"推荐"标签
4. 查看推荐内容是否正确显示

### 第四步：管理推荐内容

#### 4.1 添加管理入口
在Profile页面添加推荐管理按钮：

```javascript
// 在ProfileScreen.tsx中添加
const [showRecommendationManager, setShowRecommendationManager] = useState(false);

// 添加按钮
<TouchableOpacity 
  style={styles.manageButton}
  onPress={() => setShowRecommendationManager(true)}
>
  <Text style={styles.manageButtonText}>管理推荐内容</Text>
</TouchableOpacity>

// 添加管理组件
<RecommendationManager 
  visible={showRecommendationManager} 
  onClose={() => setShowRecommendationManager(false)} 
/>
```

#### 4.2 使用管理界面
1. 点击"添加推荐"按钮
2. 输入TMDB剧集ID或搜索剧集
3. 编写推荐文案
4. 设置难度和分类
5. 保存推荐内容

### 第五步：持续添加内容

#### 5.1 手动添加单个推荐
```bash
# 使用API直接添加
curl -X POST "https://dramawordv2.onrender.com/api/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "tmdbShowId": 1396,
    "title": "Breaking Bad",
    "recommendation": {
      "text": "这部剧真的绝了！学英语必备，强烈安利！",
      "difficulty": "hard",
      "language": "zh-CN"
    }
  }'
```

#### 5.2 批量添加推荐
```bash
# 修改scripts/batch-import-recommendations.js中的示例数据
# 添加新的推荐内容到sampleRecommendations数组
# 运行批量导入
node scripts/batch-import-recommendations.js
```

## 📊 API接口说明

### 公开接口（无需认证）

#### 获取推荐列表
```bash
GET /api/recommendations
参数：
- page: 页码（默认1）
- limit: 每页数量（默认20）
- language: 语言（zh-CN/en-US）
- difficulty: 难度（easy/medium/hard）
- category: 分类
- status: 状态（active/inactive/draft）
```

#### 智能推荐
```bash
GET /api/recommendations/smart
参数：
- language: 语言
- limit: 推荐数量
- userPreferences: 用户偏好JSON
```

#### 获取统计
```bash
GET /api/recommendations/stats
```

### 管理接口（需要认证）

#### 创建推荐
```bash
POST /api/recommendations
Content-Type: application/json
Authorization: Bearer <token>

{
  "tmdbShowId": 1396,
  "title": "Breaking Bad",
  "recommendation": {
    "text": "推荐文案",
    "difficulty": "hard",
    "language": "zh-CN"
  }
}
```

#### 更新推荐
```bash
PUT /api/recommendations/:id
```

#### 删除推荐
```bash
DELETE /api/recommendations/:id
```

#### 批量导入
```bash
POST /api/recommendations/batch-import
{
  "recommendations": [...]
}
```

## 🎨 推荐内容格式

### 数据结构
```javascript
{
  tmdbShowId: 1396,                    // TMDB剧集ID
  title: "Breaking Bad",               // 剧集标题
  originalTitle: "Breaking Bad",       // 原始标题
  backdropUrl: "https://...",          // 背景图片
  posterUrl: "https://...",            // 海报图片
  recommendation: {
    text: "推荐文案",                   // 推荐描述
    difficulty: "hard",                // 难度：easy/medium/hard
    language: "zh-CN",                 // 语言：zh-CN/en-US
    category: ["crime", "drama"],      // 分类
    tags: ["犯罪", "剧情"]             // 标签
  },
  metadata: {
    genre: [80, 18],                   // TMDB类型ID
    rating: 9.5,                       // 评分
    year: 2008,                        // 年份
    status: "active",                  // 状态：draft/active/inactive
    priority: 10,                      // 优先级：1-10
    views: 0,                          // 浏览量
    likes: 0                           // 点赞数
  }
}
```

## 🔧 智能推荐算法

### 推荐分数计算
```javascript
score = 优先级 × 0.4 + 评分 × 0.3 + 浏览量 × 0.001 + 点赞数 × 0.002
```

### 用户偏好匹配
- 根据用户选择的难度级别筛选
- 根据用户偏好的剧集类型筛选
- 支持多维度个性化推荐

## 📱 前端集成

### 推荐TAB集成
在ShowsScreen.tsx中已经集成：
- 优先从数据库获取推荐内容
- 备用TMDB热门剧集数据
- 小红书风格的瀑布流布局
- 点击卡片查看详情
- 一键添加到剧单

### 管理界面集成
RecommendationManager组件提供：
- 推荐内容列表管理
- 添加/编辑/删除功能
- TMDB剧集搜索
- 批量操作支持

## 🚨 故障排除

### 常见问题

#### 1. API路由未找到
```bash
# 检查后端部署状态
curl -X GET "https://dramawordv2.onrender.com/health"

# 检查推荐路由
curl -X GET "https://dramawordv2.onrender.com/api/recommendations/stats"
```

#### 2. 数据库连接问题
```bash
# 检查数据库连接
curl -X GET "https://dramawordv2.onrender.com/api/debug/sync-test"
```

#### 3. 前端显示问题
```bash
# 清除缓存重新启动
cd apps/mobile
npx expo start --clear
```

### 备用方案

如果后端API暂时不可用，前端会自动使用：
1. TMDB热门剧集数据
2. 硬编码的示例推荐内容
3. 确保用户体验不受影响

## 📈 扩展功能

### 未来可以添加的功能：
- A/B测试推荐文案效果
- 机器学习优化推荐算法
- 内容审核流程
- 详细用户行为分析
- 多语言推荐内容
- 推荐内容模板系统

## 🎯 最佳实践

### 推荐文案编写
1. **简洁明了**：一句话概括剧集特色
2. **情感共鸣**：使用"绝了"、"强烈安利"等表达
3. **学习价值**：强调英语学习效果
4. **分类明确**：根据剧集类型调整文案风格

### 内容管理
1. **定期更新**：保持推荐内容的新鲜度
2. **数据监控**：关注浏览量、点赞数等指标
3. **用户反馈**：根据用户行为调整推荐策略
4. **质量把控**：确保推荐内容的质量和准确性

## 📞 技术支持

如果遇到问题，可以：
1. 检查后端日志
2. 验证API接口
3. 测试数据库连接
4. 查看前端控制台错误

---

**🎉 恭喜！你现在拥有了一个完整的推荐内容管理系统！** 