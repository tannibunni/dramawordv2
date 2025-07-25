# 统一缓存架构设计

## 📊 架构概览

### **🎯 设计目标**
- **统一管理**：所有缓存逻辑集中在一个服务中
- **数据一致性**：避免多层缓存导致的数据不一致问题
- **性能优化**：内存缓存 + 持久化缓存的双层架构
- **易于维护**：统一的缓存接口和配置管理

### **🏗️ 架构层次**

```
┌─────────────────────────────────────────────────────────────┐
│                    应用层 (App Layer)                        │
├─────────────────────────────────────────────────────────────┤
│                统一缓存服务 (CacheService)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   内存缓存       │  │   持久化缓存     │  │   配置管理    │ │
│  │  (Memory Cache) │  │ (AsyncStorage)  │  │ (Config Mgmt)│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    存储层 (Storage Layer)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   AsyncStorage  │  │   React Native  │  │   Database   │ │
│  │   (Local Cache) │  │   (Memory)      │  │   (Remote)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 核心组件

### **1. CacheService 类**

**位置**: `apps/mobile/src/services/cacheService.ts`

**功能**:
- 单例模式，全局统一管理
- 内存缓存 + 持久化缓存的双层架构
- 自动过期管理和大小限制
- 版本控制和数据验证

**主要方法**:
```typescript
// 设置缓存
async set<T>(prefix: string, identifier: string, data: T, config?: CacheConfig): Promise<void>

// 获取缓存
async get<T>(prefix: string, identifier: string): Promise<T | null>

// 删除缓存
async delete(prefix: string, identifier: string): Promise<void>

// 清理指定前缀的所有缓存
async clearPrefix(prefix: string): Promise<void>

// 清理所有缓存
async clearAll(): Promise<void>

// 获取缓存统计
async getStats(): Promise<CacheStats>
```

### **2. 缓存键管理**

**统一前缀系统**:
```typescript
export const CACHE_KEYS = {
  WORD_DETAIL: 'word_detail',      // 单词详情缓存
  SEARCH_HISTORY: 'search_history', // 搜索历史缓存
  USER_VOCABULARY: 'user_vocabulary', // 用户词汇缓存
  USER_STATS: 'user_stats',        // 用户统计缓存
  APP_SETTINGS: 'app_settings',    // 应用设置缓存
} as const;
```

**键生成规则**:
```typescript
// 格式: {prefix}_{identifier.toLowerCase()}
// 示例: word_detail_hello, search_history_user123
```

### **3. 缓存配置**

**默认配置**:
```typescript
const DEFAULT_CONFIG: CacheConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24小时过期
  maxSize: 100,                // 最大100个条目
  version: '1.0.0',           // 缓存版本号
};
```

**自定义配置**:
```typescript
// 为特定缓存设置自定义配置
await cacheService.set(
  CACHE_KEYS.WORD_DETAIL, 
  'hello', 
  wordData, 
  { maxAge: 60 * 60 * 1000 } // 1小时过期
);
```

## 📋 使用指南

### **1. 单词详情缓存**

**旧方式** (分散缓存):
```typescript
// AsyncStorage 直接操作
const cacheKey = `word_detail_${word.toLowerCase()}`;
const cached = await AsyncStorage.getItem(cacheKey);
if (cached) {
  const wordData = JSON.parse(cached);
  return wordData;
}
```

**新方式** (统一缓存):
```typescript
// 使用统一缓存服务
const cached = await cacheService.get<WordData>(CACHE_KEYS.WORD_DETAIL, word);
if (cached) {
  return cached;
}
```

### **2. 缓存清理**

**旧方式** (手动清理多个位置):
```typescript
// 需要清理多个位置的缓存
await AsyncStorage.multiRemove(wordCacheKeys);
setWordDataCache({}); // ReviewScreen 内存缓存
// 后端缓存需要重启服务
```

**新方式** (一键清理):
```typescript
// 使用统一缓存服务清理
await cacheService.clearPrefix(CACHE_KEYS.WORD_DETAIL);
```

### **3. 缓存统计**

**获取缓存状态**:
```typescript
const stats = await cacheService.getStats();
console.log('缓存统计:', {
  memorySize: stats.memorySize,    // 内存缓存项数
  storageSize: stats.storageSize,  // 存储缓存项数
  hitRate: stats.hitRate,         // 命中率
});
```

## 🔄 迁移计划

### **第一阶段：核心服务迁移** ✅
- [x] 创建 `CacheService` 类
- [x] 实现基础缓存功能
- [x] 更新 `wordService.ts` 使用统一缓存
- [x] 更新 `ProfileScreen` 清除缓存功能

### **第二阶段：组件迁移**
- [ ] 更新 `ReviewScreen` 使用统一缓存
- [ ] 更新 `VocabularyScreen` 使用统一缓存
- [ ] 更新 `HomeScreen` 使用统一缓存

### **第三阶段：后端优化**
- [ ] 后端缓存策略优化
- [ ] 缓存同步机制
- [ ] 缓存预热策略

### **第四阶段：监控和优化**
- [ ] 缓存命中率监控
- [ ] 性能指标收集
- [ ] 自动缓存优化

## 🎯 优势对比

### **统一缓存 vs 分散缓存**

| 特性 | 统一缓存 | 分散缓存 |
|------|---------|---------|
| **数据一致性** | ✅ 统一管理，避免不一致 | ❌ 多层缓存，容易不一致 |
| **维护成本** | ✅ 集中管理，易于维护 | ❌ 分散管理，维护困难 |
| **性能** | ✅ 内存+持久化双层优化 | ⚠️ 各层独立，可能重复 |
| **调试** | ✅ 统一日志，易于调试 | ❌ 分散日志，调试困难 |
| **扩展性** | ✅ 统一接口，易于扩展 | ❌ 分散接口，扩展困难 |

### **性能提升**

1. **内存缓存优先**: 减少 AsyncStorage 访问
2. **自动过期管理**: 避免过期数据占用空间
3. **大小限制**: 防止缓存无限增长
4. **批量操作**: 提高清理和统计效率

## 🚀 最佳实践

### **1. 缓存键命名**
```typescript
// ✅ 推荐：使用统一前缀
await cacheService.set(CACHE_KEYS.WORD_DETAIL, word, data);

// ❌ 避免：直接使用字符串
await cacheService.set('word_detail', word, data);
```

### **2. 类型安全**
```typescript
// ✅ 推荐：指定类型
const cached = await cacheService.get<WordData>(CACHE_KEYS.WORD_DETAIL, word);

// ❌ 避免：不指定类型
const cached = await cacheService.get(CACHE_KEYS.WORD_DETAIL, word);
```

### **3. 错误处理**
```typescript
// ✅ 推荐：适当的错误处理
try {
  const cached = await cacheService.get<WordData>(CACHE_KEYS.WORD_DETAIL, word);
  if (cached) {
    return cached;
  }
} catch (error) {
  console.error('缓存读取失败:', error);
  // 降级到 API 调用
}
```

### **4. 缓存配置**
```typescript
// ✅ 推荐：根据数据特性设置合适的过期时间
await cacheService.set(
  CACHE_KEYS.WORD_DETAIL, 
  word, 
  data, 
  { maxAge: 24 * 60 * 60 * 1000 } // 单词数据24小时
);

await cacheService.set(
  CACHE_KEYS.USER_STATS, 
  userId, 
  stats, 
  { maxAge: 5 * 60 * 1000 } // 统计数据5分钟
);
```

## 📊 监控指标

### **关键指标**
- **缓存命中率**: 缓存命中次数 / 总请求次数
- **缓存大小**: 内存缓存项数、存储缓存项数
- **缓存效率**: 平均响应时间、缓存清理频率
- **错误率**: 缓存操作失败率

### **监控工具**
```typescript
// 获取缓存统计
const stats = await cacheService.getStats();
console.log('缓存监控:', {
  memorySize: stats.memorySize,
  storageSize: stats.storageSize,
  hitRate: stats.hitRate,
});
```

## 🔮 未来规划

### **短期目标**
1. 完成所有组件的缓存迁移
2. 实现缓存预热机制
3. 添加缓存监控面板

### **中期目标**
1. 实现智能缓存策略
2. 添加缓存压缩功能
3. 实现跨设备缓存同步

### **长期目标**
1. 机器学习驱动的缓存优化
2. 分布式缓存支持
3. 实时缓存同步

---

*本文档描述了剧词记应用的统一缓存架构设计，旨在解决当前分散缓存导致的数据不一致问题，提供更好的性能和用户体验。* 