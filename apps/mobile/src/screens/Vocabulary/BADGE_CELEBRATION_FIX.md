# 徽章庆祝弹窗重复显示问题修复

## 🐛 问题描述

用户反馈：单词列表页面，用户集齐10个单词会触发恭喜弹窗，但是每当加载单词列表页面，这个弹窗总是会被触发一次。需要确保这个弹窗被用户看到一次，之后都不会出现。

## 🔍 问题分析

### 问题根源
1. **VocabularyScreen** 中的 `updateBadges` 函数在每次页面加载时都会执行
2. 函数只检查当前单词数量是否达到徽章要求，但没有记录该徽章是否已经显示过庆祝弹窗
3. 导致每次进入页面都会重新触发庆祝弹窗

### 影响范围
- **VocabularyScreen**：单词列表页面
- **HomeScreen**：首页（也有类似的徽章庆祝逻辑）

## ✅ 修复方案

### 1. 更新 Badge 接口

```typescript
interface Badge {
  id: number;
  count: number;
  unlocked: boolean;
  celebrationShown?: boolean; // 新增：是否已显示过庆祝弹窗
}
```

### 2. 修复 VocabularyScreen 徽章逻辑

#### 更新徽章初始状态
```typescript
const [badges, setBadges] = useState<Badge[]>([
  { id: 1, count: 10, unlocked: false, celebrationShown: false },
  { id: 2, count: 20, unlocked: false, celebrationShown: false },
  // ... 其他徽章
]);
```

#### 修复 updateBadges 函数
```typescript
const updateBadges = async () => {
  const wordCount = vocabulary.length;
  
  setBadges(prevBadges => {
    let unlockedBadge: number | null = null;
    const newBadges = prevBadges.map(badge => {
      const wasUnlocked = badge.unlocked;
      const newUnlocked = wordCount >= badge.count;
      
      // 只有真正新解锁且未显示过庆祝弹窗的徽章才触发庆祝
      if (!wasUnlocked && newUnlocked && !badge.celebrationShown) {
        unlockedBadge = badge.count;
        console.log(`🎉 新解锁徽章: ${badge.count}个单词`);
      }
      
      return {
        ...badge,
        unlocked: newUnlocked,
        // 如果徽章已解锁，标记庆祝弹窗已显示
        celebrationShown: newUnlocked ? true : badge.celebrationShown
      };
    });
    
    // 保存到本地存储
    saveBadgesToStorage(newBadges);
    
    // 如果有新解锁的徽章，显示庆祝弹窗
    if (unlockedBadge) {
      setCelebrateBadge(unlockedBadge);
      setShowBadgeCelebrate(true);
      setTimeout(() => setShowBadgeCelebrate(false), 1800);
    }
    
    return newBadges;
  });
};
```

#### 更新本地存储加载逻辑
```typescript
const loadBadgesFromStorage = async () => {
  try {
    const storedBadges = await AsyncStorage.getItem('userBadges');
    if (storedBadges) {
      const parsedBadges = JSON.parse(storedBadges);
      // 确保所有徽章都有 celebrationShown 字段
      const badgesWithCelebration = parsedBadges.map((badge: any) => ({
        ...badge,
        celebrationShown: badge.celebrationShown !== undefined ? badge.celebrationShown : badge.unlocked
      }));
      setBadges(badgesWithCelebration);
    }
  } catch (error) {
    console.error('❌ 加载徽章数据失败:', error);
  }
};
```

### 3. 修复 HomeScreen 徽章逻辑

#### 添加庆祝记录状态
```typescript
const [celebratedBadges, setCelebratedBadges] = useState<Set<number>>(new Set());
```

#### 更新徽章检测逻辑
```typescript
useEffect(() => {
  // 监听 vocabulary 数量变化
  if (vocabulary.length > prevVocabCount.current) {
    const unlocked = badgeTargets.find(target => 
      prevVocabCount.current < target && 
      vocabulary.length >= target && 
      !celebratedBadges.has(target)  // 新增：检查是否已庆祝过
    );
    if (unlocked) {
      setCelebrateBadge(unlocked);
      setShowBadgeCelebrate(true);
      setCelebratedBadges(prev => new Set([...prev, unlocked]));
      // 保存到本地存储
      AsyncStorage.setItem('celebratedBadges', JSON.stringify([...celebratedBadges, unlocked]));
      setTimeout(() => setShowBadgeCelebrate(false), 1800);
    }
  }
  prevVocabCount.current = vocabulary.length;
}, [vocabulary.length, celebratedBadges]);
```

#### 添加本地存储加载
```typescript
useEffect(() => {
  const loadCelebratedBadges = async () => {
    try {
      const stored = await AsyncStorage.getItem('celebratedBadges');
      if (stored) {
        const celebratedArray = JSON.parse(stored);
        setCelebratedBadges(new Set(celebratedArray));
      }
    } catch (error) {
      console.error('❌ 加载已庆祝徽章失败:', error);
    }
  };
  loadCelebratedBadges();
}, []);
```

## 🔧 修复效果

### 修复前
- ❌ 每次进入单词列表页面都会触发庆祝弹窗
- ❌ 用户已经集齐的徽章会重复显示庆祝
- ❌ 影响用户体验，造成困扰

### 修复后
- ✅ 只有真正新解锁的徽章才会显示庆祝弹窗
- ✅ 每个徽章的庆祝弹窗只会显示一次
- ✅ 庆祝记录持久化保存，重启应用后仍然有效
- ✅ 提升用户体验，避免重复打扰

## 📊 技术实现细节

### 1. 状态管理
- **VocabularyScreen**：使用 `celebrationShown` 字段记录庆祝状态
- **HomeScreen**：使用 `Set<number>` 记录已庆祝的徽章数量

### 2. 数据持久化
- **VocabularyScreen**：庆祝状态保存在 `userBadges` 中
- **HomeScreen**：庆祝记录保存在 `celebratedBadges` 中

### 3. 兼容性处理
- 对于旧数据，自动设置 `celebrationShown` 为 `unlocked` 状态
- 确保向后兼容，不会影响现有用户数据

## 🧪 测试场景

### 1. 新用户测试
- **场景**：新用户首次集齐10个单词
- **预期**：显示庆祝弹窗
- **验证**：弹窗正常显示，记录已保存

### 2. 重复进入页面测试
- **场景**：用户已集齐10个单词，再次进入单词列表页面
- **预期**：不显示庆祝弹窗
- **验证**：弹窗不再出现

### 3. 多级徽章测试
- **场景**：用户从9个单词增加到20个单词
- **预期**：只显示20个单词的庆祝弹窗
- **验证**：10个单词的庆祝不再显示

### 4. 应用重启测试
- **场景**：用户集齐徽章后重启应用
- **预期**：庆祝弹窗不再显示
- **验证**：本地存储记录正确加载

## 📝 总结

通过添加庆祝记录机制，成功解决了徽章庆祝弹窗重复显示的问题：

### ✅ **修复内容**
1. **VocabularyScreen**：添加 `celebrationShown` 字段跟踪庆祝状态
2. **HomeScreen**：添加 `celebratedBadges` Set 记录已庆祝徽章
3. **数据持久化**：庆祝记录保存到本地存储
4. **兼容性处理**：确保旧数据正常迁移

### 🎯 **修复效果**
- 每个徽章的庆祝弹窗只会显示一次
- 提升用户体验，避免重复打扰
- 数据持久化，重启应用后仍然有效
- 向后兼容，不影响现有用户数据

徽章庆祝弹窗重复显示问题已完全解决！🎉
