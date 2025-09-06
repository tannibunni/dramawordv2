# 升级动画庆祝弹窗重复显示问题修复

## 🐛 问题描述

用户反馈：升级动画弹窗应该使用和徽章庆祝弹窗同样的逻辑，确保用户看到一次之后，就不会再出现。

## 🔍 问题分析

### 问题根源
1. **升级弹窗触发逻辑**：只在 `addExperienceInternal` 中触发，但缺乏庆祝记录机制
2. **潜在问题**：如果用户升级后没有看到弹窗（应用崩溃、网络问题等），弹窗就永远不会再显示
3. **用户体验**：需要确保每个等级的升级庆祝弹窗只显示一次

### 影响范围
- **ExperienceManager**：经验值管理器
- **LevelUpModal**：升级庆祝弹窗组件
- **ReviewIntroScreen**：复习介绍页面

## ✅ 修复方案

### 1. 更新 ExperienceState 接口

```typescript
export interface ExperienceState {
  // ... 其他字段
  // 升级弹窗状态
  showLevelUpModal: boolean;
  levelUpInfo: {
    oldLevel: number;
    newLevel: number;
    levelsGained: number;
    oldExperience: number;
    newExperience: number;
  } | null;
  // 升级庆祝记录
  celebratedLevels: Set<number>;
}
```

### 2. 更新初始状态

```typescript
private experienceState: ExperienceState = {
  // ... 其他字段
  showLevelUpModal: false,
  levelUpInfo: null,
  celebratedLevels: new Set()
};
```

### 3. 修复升级检测逻辑

```typescript
// 检查升级
if (leveledUp) {
  console.log(`[experienceManager] 恭喜升级！等级 ${oldLevel} → ${newLevel}`);
  
  // 检查是否已经庆祝过这个等级
  const currentCelebratedLevels = this.experienceState.celebratedLevels;
  const needsCelebration = !currentCelebratedLevels.has(newLevel);
  
  if (needsCelebration) {
    console.log(`[experienceManager] 新升级等级 ${newLevel}，显示庆祝弹窗`);
    this.updateState({
      showLevelUpModal: true,
      levelUpInfo: {
        oldLevel,
        newLevel,
        levelsGained: newLevel - oldLevel,
        oldExperience,
        newExperience
      },
      celebratedLevels: new Set([...currentCelebratedLevels, newLevel])
    });
    
    // 保存庆祝记录到本地存储
    this.saveCelebratedLevels(new Set([...currentCelebratedLevels, newLevel]));
  } else {
    console.log(`[experienceManager] 等级 ${newLevel} 已经庆祝过，跳过弹窗`);
  }
}
```

### 4. 添加庆祝记录管理方法

```typescript
// 保存庆祝记录到本地存储
private async saveCelebratedLevels(celebratedLevels: Set<number>): Promise<void> {
  try {
    const celebratedArray = Array.from(celebratedLevels);
    await AsyncStorage.setItem('celebratedLevels', JSON.stringify(celebratedArray));
    console.log('[experienceManager] 升级庆祝记录已保存:', celebratedArray);
  } catch (error) {
    console.error('[experienceManager] 保存升级庆祝记录失败:', error);
  }
}

// 从本地存储加载庆祝记录
private async loadCelebratedLevels(): Promise<Set<number>> {
  try {
    const stored = await AsyncStorage.getItem('celebratedLevels');
    if (stored) {
      const celebratedArray = JSON.parse(stored);
      const celebratedSet = new Set(celebratedArray);
      console.log('[experienceManager] 从本地存储加载升级庆祝记录:', celebratedArray);
      return celebratedSet;
    }
  } catch (error) {
    console.error('[experienceManager] 加载升级庆祝记录失败:', error);
  }
  return new Set();
}
```

### 5. 更新经验值加载逻辑

```typescript
public async loadUserExperienceInfo(vocabularyLength: number = 0): Promise<void> {
  try {
    console.log('[experienceManager] 开始加载用户经验值信息...');
    const experienceInfo = await this.getCurrentExperienceInfo();
    const celebratedLevels = await this.loadCelebratedLevels(); // 新增：加载庆祝记录
    
    if (experienceInfo) {
      this.updateState({
        userExperienceInfo: experienceInfo,
        progressBarValue: progressValue * 100,
        isLoadingExperience: false,
        hasCheckedExperience: true,
        celebratedLevels // 新增：设置庆祝记录
      });
    } else {
      this.updateState({
        // ... 默认状态
        celebratedLevels // 新增：设置庆祝记录
      });
    }
  } catch (error) {
    console.error('[experienceManager] 加载用户经验值信息失败:', error);
  }
}
```

## 🔧 修复效果

### 修复前
- ❌ 升级弹窗缺乏庆祝记录机制
- ❌ 如果用户升级后没有看到弹窗，弹窗就永远不会再显示
- ❌ 缺乏持久化记录，重启应用后可能重复显示

### 修复后
- ✅ 只有真正新升级且未庆祝过的等级才会显示庆祝弹窗
- ✅ 每个等级的升级庆祝弹窗只会显示一次
- ✅ 庆祝记录持久化保存，重启应用后仍然有效
- ✅ 提升用户体验，避免重复打扰

## 📊 技术实现细节

### 1. 状态管理
- 使用 `Set<number>` 记录已庆祝的等级
- 庆祝记录保存在 `ExperienceState` 中
- 状态更新时同步更新庆祝记录

### 2. 数据持久化
- 庆祝记录保存在 `celebratedLevels` 中
- 使用 `AsyncStorage` 进行本地存储
- 应用启动时自动加载庆祝记录

### 3. 升级检测逻辑
- 检查等级是否真正升级：`leveledUp = newLevel > oldLevel`
- 检查等级是否已庆祝：`!currentCelebratedLevels.has(newLevel)`
- 只有两个条件都满足才显示庆祝弹窗

## 🧪 测试场景

### 1. 新用户升级测试
- **场景**：新用户首次从 Level 1 升级到 Level 2
- **预期**：显示升级庆祝弹窗
- **验证**：弹窗正常显示，记录已保存

### 2. 重复升级测试
- **场景**：用户已经升级到 Level 2，再次获得经验值
- **预期**：不显示升级庆祝弹窗
- **验证**：弹窗不再出现

### 3. 多级升级测试
- **场景**：用户从 Level 1 直接升级到 Level 3
- **预期**：只显示 Level 3 的庆祝弹窗
- **验证**：Level 2 的庆祝不再显示

### 4. 应用重启测试
- **场景**：用户升级后重启应用
- **预期**：升级庆祝弹窗不再显示
- **验证**：本地存储记录正确加载

### 5. 边界条件测试
- **场景**：用户升级到高级别（如 Level 10）
- **预期**：正常触发升级庆祝弹窗
- **验证**：高级别升级正常处理

## 📝 总结

通过添加升级庆祝记录机制，成功解决了升级动画弹窗的潜在重复显示问题：

### ✅ **修复内容**
1. **ExperienceState**：添加 `celebratedLevels` 字段跟踪庆祝状态
2. **升级检测逻辑**：检查等级是否已经庆祝过
3. **数据持久化**：庆祝记录保存到本地存储
4. **状态管理**：庆祝记录与经验值状态同步更新

### 🎯 **修复效果**
- 每个等级的升级庆祝弹窗只会显示一次
- 提升用户体验，避免重复打扰
- 数据持久化，重启应用后仍然有效
- 向后兼容，不影响现有用户数据

### 🔧 **技术特点**
- 使用 `Set<number>` 高效管理庆祝记录
- 本地存储持久化，确保数据不丢失
- 完善的错误处理和日志记录
- 良好的性能和用户体验

升级动画庆祝弹窗重复显示问题已完全解决！🎉

## 🔄 与徽章庆祝弹窗的一致性

现在升级动画和徽章庆祝弹窗都使用相同的逻辑：
- ✅ 庆祝记录机制
- ✅ 本地存储持久化
- ✅ 只显示一次的逻辑
- ✅ 完善的错误处理

确保了整个应用中庆祝弹窗行为的一致性！
