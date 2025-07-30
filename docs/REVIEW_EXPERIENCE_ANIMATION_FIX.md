# 复习经验值动画问题修复

## 问题描述

用户在复习页面划完复习卡后，复习结束时没有经验增长动画显示。

## 问题根源

1. **缺少经验值API调用**：复习过程中只同步了学习记录，但没有调用经验值API
2. **API路径错误**：使用了错误的API路径 `/words/progress` 而不是 `/words/user/progress`
3. **经验值计算缺失**：复习完成后没有正确计算和显示获得的经验值

## 修复方案

### 1. 添加经验值API调用

在`ReviewScreen.tsx`的`updateBackendWordProgress`函数中添加了经验值API调用：

```typescript
// 调用经验值API
try {
  const token = await AsyncStorage.getItem('userData');
  if (token) {
    const userData = JSON.parse(token);
    const response = await fetch(`${API_BASE_URL}/words/user/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`,
      },
      body: JSON.stringify({
        userId: userId,
        word: word,
        isSuccessfulReview: isCorrect,
        progress: progress
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.data?.experience) {
        apiLogger.info('经验值更新成功', {
          word,
          isCorrect,
          xpGained: result.data.experience.xpGained,
          newLevel: result.data.experience.newLevel,
          leveledUp: result.data.experience.leveledUp
        });
      }
    }
  }
} catch (xpError) {
  apiLogger.error('调用经验值API失败', xpError);
  // 不中断流程，继续执行
}
```

### 2. 修复API路径

将错误的API路径从 `/words/progress` 修正为 `/words/user/progress`：

```typescript
// 修复前
const response = await fetch(`${API_BASE_URL}/words/progress`, {

// 修复后  
const response = await fetch(`${API_BASE_URL}/words/user/progress`, {
```

### 3. 经验值传递机制

复习完成后，经验值通过以下流程传递：

1. **复习过程中**：每次划卡时调用经验值API
2. **复习完成时**：将总经验值保存到`AsyncStorage`
3. **返回ReviewIntroScreen时**：检查并显示经验值动画

```typescript
// 保存经验值增加参数到AsyncStorage
const params = {
  showExperienceAnimation: true,
  experienceGained: finalStats?.experience || 0
};
await AsyncStorage.setItem('navigationParams', JSON.stringify(params));
```

## 修复效果

### 修复前
- 复习过程中不调用经验值API
- 复习完成后没有经验值动画
- 用户看不到获得的经验值

### 修复后
- 每次划卡都调用经验值API
- 复习完成后显示经验值增长动画
- 用户可以看到获得的经验值（记得+2XP，不记得+1XP）

## 技术细节

### 文件修改
- `apps/mobile/src/screens/Review/ReviewScreen.tsx`

### API调用流程
1. 用户划卡（左滑/右滑）
2. 调用`updateBackendWordProgress`
3. 同步学习记录到后端
4. **新增**：调用经验值API `/words/user/progress`
5. 复习完成后保存总经验值
6. 返回ReviewIntroScreen显示动画

### 经验值计算规则
- **记得单词**：+2 XP
- **不记得单词**：+1 XP
- **每日上限**：有每日复习经验值上限

## 测试验证

### API测试结果
```
✅ 复习经验值API调用成功
📊 获得经验值: +2 XP
📈 新等级: 1
🎉 是否升级: 否
💬 消息: 复习单词 +2 XP
```

### 用户统计数据验证
```
📊 当前经验值: 4 XP
📈 当前等级: 1
🎯 总复习次数: 0
```

## 注意事项

1. **错误处理**：经验值API调用失败不会中断复习流程
2. **性能考虑**：每次划卡都会调用API，但不会阻塞UI
3. **数据一致性**：确保本地和后端经验值数据同步
4. **用户体验**：动画显示在ReviewIntroScreen，确保用户能看到

## 总结

通过添加经验值API调用和修复API路径，解决了复习经验值动画缺失的问题。现在用户在复习完成后可以正常看到经验值增长动画，提升了用户体验和成就感。

**修复状态**：✅ 已完成
**测试状态**：✅ 通过
**部署状态**：✅ 已部署到Render 