# 错词卡逻辑整理文档

## 概述
本文档整理了错词卡功能的完整逻辑，包括数据同步流程、问题分析和解决方案。

## 错词卡核心逻辑

### 1. 错词定义
错词需要满足以下条件之一：
- `incorrectCount > 0` (有答错记录)
- `consecutiveIncorrect > 0` (连续答错)

**移除条件：**
- `consecutiveCorrect >= 3` (连续答对3次后从错词卡移除)

### 2. 数据流程

#### 2.1 答题时的数据更新流程

**左滑（答错）流程：**
```typescript
handleSwipeLeft(word) {
  // 1. 更新本地学习记录
  await learningDataService.updateLearningRecord(word, false);
  
  // 2. 立即更新 vocabulary context
  updateWord(word, {
    incorrectCount: (currentWord.incorrectCount || 0) + 1,
    consecutiveIncorrect: (currentWord.consecutiveIncorrect || 0) + 1,
    consecutiveCorrect: 0 // 重置连续正确次数
  });
  
  // 3. 延迟更新后端（避免冲突）
  setTimeout(() => updateBackendWordProgress(word, false), 1000);
}
```

**右滑（答对）流程：**
```typescript
handleSwipeRight(word) {
  // 1. 更新本地学习记录
  await learningDataService.updateLearningRecord(word, true);
  
  // 2. 立即更新 vocabulary context
  updateWord(word, {
    incorrectCount: currentWord.incorrectCount || 0,
    consecutiveIncorrect: 0, // 重置连续错误次数
    consecutiveCorrect: (currentWord.consecutiveCorrect || 0) + 1
  });
  
  // 3. 延迟更新后端（避免冲突）
  setTimeout(() => updateBackendWordProgress(word, true), 1000);
}
```

#### 2.2 错词筛选逻辑

**ReviewScreen.tsx (getReviewBatch 方法)：**
```typescript
const localWrongWords = vocabulary.filter((word: any) => {
  // 如果连续答对次数 >= 3，则从错词卡移除
  if (word.consecutiveCorrect && word.consecutiveCorrect >= 3) {
    return false;
  }
  // 否则保持在错词卡中（有答错记录）
  const isWrongWord = (word.incorrectCount && word.incorrectCount > 0) || 
                     (word.consecutiveIncorrect && word.consecutiveIncorrect > 0);
  return isWrongWord;
});
```

**ReviewIntroScreen.tsx (错词数量计算)：**
```typescript
const localWrongWords = vocabulary.filter((word: any) => {
  // 如果连续答对次数 >= 3，则从错词卡移除
  if (word.consecutiveCorrect && word.consecutiveCorrect >= 3) {
    return false;
  }
  // 否则保持在错词卡中（有答错记录）
  const isWrongWord = (word.incorrectCount && word.incorrectCount > 0) || 
                     (word.consecutiveIncorrect && word.consecutiveIncorrect > 0);
  return isWrongWord;
});
```

### 3. 数据同步机制

#### 3.1 VocabularyContext 更新
```typescript
const updateWord = (word: string, data: Partial<WordWithSource>) => {
  setVocabulary(prev => prev.map(w => w.word === word ? { ...w, ...data } : w));
};
```

#### 3.2 本地存储同步
- 当 `vocabulary` 状态变化时，自动保存到 AsyncStorage
- 应用启动时从 AsyncStorage 加载数据

#### 3.3 后端同步
- 通过 `updateBackendWordProgress` 方法同步到后端
- 使用延迟机制避免立即冲突

### 4. 问题分析

#### 4.1 当前问题
从日志分析发现：
1. **错词数量为0**：即使有答错记录，错词卡显示为0
2. **数据不同步**：vocabulary context 更新后，错词筛选逻辑未正确执行

#### 4.2 根本原因
1. **数据字段缺失**：vocabulary 中的单词可能缺少 `incorrectCount`、`consecutiveIncorrect`、`consecutiveCorrect` 字段
2. **筛选逻辑问题**：筛选条件过于严格，导致符合条件的单词被过滤掉
3. **数据初始化问题**：新添加的单词没有正确的学习进度字段

### 5. 解决方案

#### 5.1 数据字段初始化
确保所有单词都有正确的学习进度字段：
```typescript
const initializeWordProgress = (word: WordWithSource) => {
  return {
    ...word,
    incorrectCount: word.incorrectCount || 0,
    consecutiveIncorrect: word.consecutiveIncorrect || 0,
    consecutiveCorrect: word.consecutiveCorrect || 0,
    reviewCount: word.reviewCount || 0,
    correctCount: word.correctCount || 0
  };
};
```

#### 5.2 优化筛选逻辑
```typescript
const isWrongWord = (word: WordWithSource) => {
  // 连续答对3次后移除
  if ((word.consecutiveCorrect || 0) >= 3) {
    return false;
  }
  
  // 有答错记录或连续答错
  return (word.incorrectCount || 0) > 0 || (word.consecutiveIncorrect || 0) > 0;
};
```

#### 5.3 数据同步优化
```typescript
const updateWordProgress = async (word: string, isCorrect: boolean) => {
  // 1. 立即更新本地状态
  const currentWord = vocabulary.find(w => w.word === word);
  if (currentWord) {
    const updatedData = {
      incorrectCount: isCorrect ? (currentWord.incorrectCount || 0) : (currentWord.incorrectCount || 0) + 1,
      consecutiveIncorrect: isCorrect ? 0 : (currentWord.consecutiveIncorrect || 0) + 1,
      consecutiveCorrect: isCorrect ? (currentWord.consecutiveCorrect || 0) + 1 : 0,
      reviewCount: (currentWord.reviewCount || 0) + 1,
      correctCount: isCorrect ? (currentWord.correctCount || 0) + 1 : (currentWord.correctCount || 0)
    };
    
    updateWord(word, updatedData);
  }
  
  // 2. 更新学习记录
  await learningDataService.updateLearningRecord(word, isCorrect);
  
  // 3. 延迟同步后端
  setTimeout(() => updateBackendWordProgress(word, isCorrect), 1000);
};
```

### 6. 调试建议

#### 6.1 添加详细日志
```typescript
console.log('🔍 错词筛选详情:', {
  word: word.word,
  incorrectCount: word.incorrectCount,
  consecutiveIncorrect: word.consecutiveIncorrect,
  consecutiveCorrect: word.consecutiveCorrect,
  isWrongWord: isWrongWord(word)
});
```

#### 6.2 数据验证
```typescript
const validateVocabularyData = () => {
  vocabulary.forEach(word => {
    if (typeof word.incorrectCount === 'undefined') {
      console.warn(`⚠️ 单词 ${word.word} 缺少 incorrectCount 字段`);
    }
    if (typeof word.consecutiveIncorrect === 'undefined') {
      console.warn(`⚠️ 单词 ${word.word} 缺少 consecutiveIncorrect 字段`);
    }
    if (typeof word.consecutiveCorrect === 'undefined') {
      console.warn(`⚠️ 单词 ${word.word} 缺少 consecutiveCorrect 字段`);
    }
  });
};
```

### 7. 测试用例

#### 7.1 基本功能测试
1. 答错单词应该出现在错词卡中
2. 连续答对3次应该从错词卡移除
3. 错词数量应该正确显示

#### 7.2 数据同步测试
1. 答题后立即检查错词卡数量
2. 重启应用后错词卡数量应该保持一致
3. 多设备同步测试

### 8. 总结

错词卡功能的核心是确保：
1. **数据完整性**：所有单词都有正确的学习进度字段
2. **逻辑一致性**：筛选逻辑在所有地方保持一致
3. **同步及时性**：数据更新后立即反映在UI上
4. **持久化正确**：数据正确保存到本地和后端

通过以上优化，可以确保错词卡功能正常工作，为用户提供准确的复习体验。 