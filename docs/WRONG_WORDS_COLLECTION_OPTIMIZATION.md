# 错词集合管理优化方案

## 当前架构分析

### 现有问题
1. **动态筛选开销**：每次需要错词时都要遍历整个词汇表进行筛选
2. **数据一致性**：错词状态分散在多个字段中，容易出现不一致
3. **性能问题**：大量词汇时筛选性能下降
4. **实时性不足**：错词集合更新依赖复杂的筛选逻辑

### 当前实现
```typescript
// 每次都需要筛选
const wrongWords = vocabulary.filter(word => {
  if ((word.consecutiveCorrect || 0) >= 3) return false;
  return (word.incorrectCount || 0) > 0 || (word.consecutiveIncorrect || 0) > 0;
});
```

## 优化方案

### 1. 专门的错词集合管理

#### 数据结构设计
```typescript
interface WrongWordsCollection {
  // 错词集合 - 使用 Set 提高查找性能
  wrongWordsSet: Set<string>;
  
  // 错词详细信息
  wrongWordsMap: Map<string, {
    word: string;
    incorrectCount: number;
    consecutiveIncorrect: number;
    consecutiveCorrect: number;
    addedAt: Date;
    lastReviewed: Date;
  }>;
  
  // 统计信息
  statistics: {
    totalWrongWords: number;
    newlyAdded: number;
    recentlyRemoved: number;
  };
}
```

#### 核心管理类
```typescript
class WrongWordsManager {
  private collection: WrongWordsCollection;
  
  // 添加错词到集合
  addWrongWord(word: string, wordData: any): void {
    if (!this.collection.wrongWordsSet.has(word)) {
      this.collection.wrongWordsSet.add(word);
      this.collection.wrongWordsMap.set(word, {
        word,
        incorrectCount: wordData.incorrectCount || 0,
        consecutiveIncorrect: wordData.consecutiveIncorrect || 0,
        consecutiveCorrect: wordData.consecutiveCorrect || 0,
        addedAt: new Date(),
        lastReviewed: new Date()
      });
      this.collection.statistics.totalWrongWords++;
      this.collection.statistics.newlyAdded++;
    }
  }
  
  // 从错词集合移除
  removeWrongWord(word: string): boolean {
    if (this.collection.wrongWordsSet.has(word)) {
      this.collection.wrongWordsSet.delete(word);
      this.collection.wrongWordsMap.delete(word);
      this.collection.statistics.totalWrongWords--;
      this.collection.statistics.recentlyRemoved++;
      return true;
    }
    return false;
  }
  
  // 更新错词状态
  updateWrongWord(word: string, isCorrect: boolean): void {
    const wordInfo = this.collection.wrongWordsMap.get(word);
    if (wordInfo) {
      if (isCorrect) {
        wordInfo.consecutiveCorrect++;
        wordInfo.consecutiveIncorrect = 0;
        
        // 连续答对3次后移除
        if (wordInfo.consecutiveCorrect >= 3) {
          this.removeWrongWord(word);
        }
      } else {
        wordInfo.incorrectCount++;
        wordInfo.consecutiveIncorrect++;
        wordInfo.consecutiveCorrect = 0;
      }
      wordInfo.lastReviewed = new Date();
    }
  }
  
  // 获取错词列表
  getWrongWords(): string[] {
    return Array.from(this.collection.wrongWordsSet);
  }
  
  // 获取错词详细信息
  getWrongWordInfo(word: string) {
    return this.collection.wrongWordsMap.get(word);
  }
  
  // 获取统计信息
  getStatistics() {
    return this.collection.statistics;
  }
}
```

### 2. 实时更新机制优化

#### 事件驱动更新
```typescript
// 错词事件系统
class WrongWordsEventSystem {
  private listeners: Map<string, Function[]> = new Map();
  
  // 订阅错词变化事件
  subscribe(event: 'wordAdded' | 'wordRemoved' | 'wordUpdated', callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  // 发布事件
  publish(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
}

// 在答题时触发事件
const handleSwipeLeft = async (word: string) => {
  // 更新词汇表
  updateWord(word, { /* ... */ });
  
  // 添加到错词集合
  wrongWordsManager.addWrongWord(word, currentWord);
  
  // 发布事件
  eventSystem.publish('wordAdded', { word, timestamp: Date.now() });
};

const handleSwipeRight = async (word: string) => {
  // 更新词汇表
  updateWord(word, { /* ... */ });
  
  // 更新错词集合
  wrongWordsManager.updateWrongWord(word, true);
  
  // 检查是否需要移除
  if (wrongWordsManager.getWrongWordInfo(word)?.consecutiveCorrect >= 3) {
    eventSystem.publish('wordRemoved', { word, reason: 'consecutiveCorrect', timestamp: Date.now() });
  }
};
```

### 3. 数据同步策略

#### 分层同步机制
```typescript
class WrongWordsSyncManager {
  // 1. 内存优先 - 立即更新
  updateMemory(word: string, action: 'add' | 'remove' | 'update') {
    // 立即更新内存中的错词集合
    // 触发UI更新
  }
  
  // 2. 本地存储 - 批量保存
  async saveToLocal() {
    const wrongWordsData = {
      collection: wrongWordsManager.getCollection(),
      lastSync: Date.now()
    };
    await AsyncStorage.setItem('wrong_words_collection', JSON.stringify(wrongWordsData));
  }
  
  // 3. 云端同步 - 增量同步
  async syncToCloud() {
    const changes = this.getPendingChanges();
    if (changes.length > 0) {
      await this.batchSyncToCloud(changes);
      this.clearPendingChanges();
    }
  }
  
  // 4. 冲突解决
  async resolveConflicts(localData: any, cloudData: any) {
    // 使用时间戳和版本号解决冲突
    // 优先使用最新的数据
  }
}
```

### 4. 性能优化

#### 缓存策略
```typescript
class WrongWordsCache {
  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5分钟
  
  // 获取错词列表（带缓存）
  getWrongWords(): string[] {
    const cacheKey = 'wrong_words_list';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    const data = wrongWordsManager.getWrongWords();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }
  
  // 清除缓存
  invalidateCache() {
    this.cache.clear();
  }
}
```

#### 虚拟化渲染
```typescript
// 错词列表虚拟化
const VirtualizedWrongWordsList = () => {
  const wrongWords = wrongWordsManager.getWrongWords();
  
  return (
    <FlatList
      data={wrongWords}
      keyExtractor={(item) => item}
      getItemLayout={(data, index) => ({
        length: 80,
        offset: 80 * index,
        index,
      })}
      renderItem={({ item }) => (
        <WrongWordCard word={item} />
      )}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
};
```

## 实施计划

### 阶段1：基础架构
1. 实现 `WrongWordsManager` 核心类
2. 集成到现有的 `VocabularyContext`
3. 添加事件系统

### 阶段2：性能优化
1. 实现缓存机制
2. 添加虚拟化渲染
3. 优化数据同步

### 阶段3：高级功能
1. 错词分析统计
2. 智能复习推荐
3. 多设备同步

## 预期效果

### 性能提升
- **查询性能**：从 O(n) 筛选优化到 O(1) 查找
- **内存使用**：减少重复计算，优化内存占用
- **响应速度**：实时更新，无延迟

### 功能增强
- **实时性**：错词集合立即更新
- **一致性**：数据状态统一管理
- **可扩展性**：支持更多错词相关功能

### 用户体验
- **流畅性**：错词卡切换无卡顿
- **准确性**：错词状态实时准确
- **智能性**：基于错词数据的智能推荐 