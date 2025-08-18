# 经验值动画流程修改文档

## 修改概述

根据用户需求，经验值动画现在会在用户从复习完成页面点击"确定"按钮回到 `ReviewIntroScreen` 之后才触发，而不是在复习完成页面加载时立即触发，也不是在 `ReviewIntroScreen` 初始化时自动触发。

## 修改的文件

### 1. experienceManager.ts
- **修改了 `managePageExperience` 方法**：移除了自动调用 `checkForExperienceGainWithDelay` 的逻辑
- **修改了 `autoManageExperienceState` 方法**：移除了自动调用 `checkForExperienceGainWithRetry` 的逻辑
- 现在这些方法只负责初始化状态和进度条，不会自动触发经验值增益检查

### 2. ReviewIntroScreen.tsx
- **添加了 `useFocusEffect` 导入**：用于监听页面焦点变化
- **保留了原有的 `useEffect`**：在页面挂载时检查经验值增益
- **新增了 `useFocusEffect`**：当页面获得焦点时检查经验值增益，确保用户从复习完成页面返回时能立即触发动画

## 新的流程

1. **用户完成复习**：在 `ReviewCompleteScreen` 中点击"完成"按钮
2. **经验值添加**：`handleComplete()` 方法添加经验值到用户账户
3. **传递信息**：调用 `onBack(experienceGained)` 传递经验值信息
4. **存储标记**：`ReviewScreen` 将经验值信息存储到 AsyncStorage 的 `pendingExperienceGain` 中
5. **导航返回**：用户被导航回 `ReviewIntroScreen`
6. **检测增益**：`ReviewIntroScreen` 通过以下两种方式检测经验值增益：
   - 页面挂载时的 `useEffect`
   - 页面获得焦点时的 `useFocusEffect`
7. **触发动画**：检测到经验值增益后，清除标记并触发经验值动画

## 关键修改点

### 1. 移除自动检查
```typescript
// 之前：会自动检查经验值增益
await this.checkForExperienceGainWithDelay(500, undefined, (hasGain) => {
  // ... 处理逻辑
});

// 现在：跳过自动检查，等待手动触发
console.log('[experienceManager] 跳过自动经验值增益检查，等待手动触发');
```

### 2. 双重检测机制
```typescript
// 页面挂载时检查
useEffect(() => {
  checkExperienceGainFromNavigation();
}, []);

// 页面获得焦点时检查
useFocusEffect(
  React.useCallback(() => {
    checkExperienceGainOnFocus();
  }, [])
);
```

## 优势

1. **用户体验更好**：经验动画只在用户主动返回时才显示，不会在页面初始化时意外触发
2. **逻辑更清晰**：经验动画的触发时机完全由用户行为控制
3. **避免重复动画**：通过 AsyncStorage 标记和时间戳检查，避免重复触发动画
4. **双重保障**：通过 `useEffect` 和 `useFocusEffect` 双重检测，确保不会遗漏经验值增益

## 测试要点

1. **普通复习模式**：完成复习后点击"确定"，验证动画在 `ReviewIntroScreen` 中触发
2. **错词挑战模式**：完成挑战后点击"确定"，验证动画在 `ReviewIntroScreen` 中触发
3. **无经验值增益**：如果复习没有经验值增益，验证不会触发动画
4. **页面重新聚焦**：从其他页面返回到 `ReviewIntroScreen`，验证不会意外触发动画

## 注意事项

- 经验值增益标记有 5 秒的有效期，超过时间后不会触发动画
- 动画触发后会立即清除 AsyncStorage 中的标记，避免重复触发
- 统计数字的动画（如贡献词数）仍然会在页面初始化时正常显示，不受此修改影响
