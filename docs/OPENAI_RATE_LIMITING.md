# OpenAI API 限流配置指南

## 概述

本文档描述了如何配置和管理OpenAI API的限流策略，以确保在用户增长时系统的稳定性和可靠性。

## 限流策略

### 1. 频率限制 (Rate Limiting)
- **每分钟请求数限制**：防止超过OpenAI的RPM限制
- **并发请求数限制**：控制同时进行的API调用数量
- **自动重试机制**：失败请求的自动重试

### 2. 用户规模配置

#### 小规模用户 (≤10人)
```typescript
{
  maxRequestsPerMinute: 30,
  maxConcurrentRequests: 3,
  retryDelay: 2000, // 2秒
  maxRetries: 3
}
```

#### 中等规模用户 (11-100人)
```typescript
{
  maxRequestsPerMinute: 60,
  maxConcurrentRequests: 5,
  retryDelay: 1000, // 1秒
  maxRetries: 3
}
```

#### 大规模用户 (101-1000人)
```typescript
{
  maxRequestsPerMinute: 120,
  maxConcurrentRequests: 10,
  retryDelay: 500, // 0.5秒
  maxRetries: 3
}
```

#### 超大规模用户 (>1000人)
- 建议升级OpenAI计划
- 实施更复杂的缓存策略
- 考虑使用多个API密钥

## 监控端点

### 限流状态监控
```
GET /api/words/debug/rate-limit-status
```

返回当前限流状态：
```json
{
  "success": true,
  "data": {
    "activeRequests": 2,
    "requestCount": 15,
    "queueLength": 0,
    "lastResetTime": 1640995200000
  }
}
```

## 优化建议

### 1. 缓存策略
- **数据库缓存**：已查询过的单词
- **内存缓存**：热门单词
- **CDN缓存**：静态资源

### 2. 预加载策略
- 预加载常用单词
- 批量处理用户查询
- 智能预测用户需求

### 3. 降级策略
- 优先使用缓存
- 使用备用AI服务
- 提供离线词典

## 成本控制

### 1. Token优化
- 使用更短的prompt
- 限制max_tokens
- 优化模型选择

### 2. 请求优化
- 合并相似请求
- 使用批量API
- 实施智能缓存

## 故障处理

### 1. API限制错误
- 自动重试
- 指数退避
- 降级到缓存

### 2. 网络错误
- 连接超时处理
- 重试机制
- 备用端点

### 3. 配额耗尽
- 切换到备用密钥
- 降级服务
- 用户通知

## 部署配置

### 环境变量
```bash
# OpenAI配置
OPENAI_API_KEY=your_api_key
OPENAI_MAX_REQUESTS_PER_MINUTE=60
OPENAI_MAX_CONCURRENT_REQUESTS=5
OPENAI_RETRY_DELAY=1000
OPENAI_MAX_RETRIES=3

# 用户规模配置
USER_SCALE=medium # small, medium, large, xlarge
```

### 动态调整
```typescript
// 根据用户数量动态调整
updateRateLimitForUserCount(userCount);
```

## 监控指标

### 关键指标
- API调用成功率
- 平均响应时间
- 错误率
- 缓存命中率
- 成本消耗

### 告警设置
- 成功率 < 95%
- 响应时间 > 5秒
- 错误率 > 5%
- 配额使用 > 80% 