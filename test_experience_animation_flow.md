# 经验值动画流程测试文档

## 修改概述

根据用户需求，经验值动画现在会在用户从复习完成页面点击"完成"按钮回到 `ReviewIntroScreen` 之后才触发，而不是在复习完成页面加载时立即触发。

## 修改的文件

### 1. ReviewCompleteScreen.tsx
- 移除了自动触发经验值动画的 `useEffect`
- 修改了 `onBack` 回调接口，现在接收 `experienceGained` 参数
- 在 `handleComplete` 函数中处理经验值增益，然后传递给 `onBack` 回调

### 2. ReviewScreen.tsx
- 修改了两个 `onBack` 回调（错词挑战模式和普通复习模式）
- 现在接收 `experienceGained` 参数
- 将经验值增益信息存储到 AsyncStorage 中，供 `ReviewIntroScreen` 检测

### 3. ReviewIntroScreen.tsx
- 添加了新的 `useEffect` 来检测从复习完成页面返回的经验值增益
- 通过 AsyncStorage 中的 `pendingExperienceGain` 标记来检测
- 在检测到经验值增益时触发经验值动画

## 新的流程

1. 用户在复习完成页面点击"完成"按钮
2. `ReviewCompleteScreen.handleComplete()` 被调用
3. 经验值被添加到用户账户
4. `onBack(experienceGained)` 被调用，传递经验值信息
5. `ReviewScreen` 将经验值信息存储到 AsyncStorage
6. 用户被导航回 `ReviewIntroScreen`
7. `ReviewIntroScreen` 检测到 AsyncStorage 中的经验值增益标记
8. 经验值动画被触发

## 测试步骤

### 测试1：普通复习模式
1. 开始一个普通复习
2. 完成所有单词
3. 在复习完成页面点击"完成"按钮
4. 验证经验值动画在 `ReviewIntroScreen` 中触发

### 测试2：错词挑战模式
1. 开始一个错词挑战
2. 完成所有单词
3. 在复习完成页面点击"完成"按钮
4. 验证经验值动画在 `ReviewIntroScreen` 中触发

### 测试3：无经验值增益
1. 开始一个复习（如果可能的话，没有经验值增益的情况）
2. 完成所有单词
3. 在复习完成页面点击"完成"按钮
4. 验证没有经验值动画

## 预期结果

- ✅ 经验值动画不再在复习完成页面加载时触发
- ✅ 经验值动画在用户回到 `ReviewIntroScreen` 后触发
- ✅ 经验值仍然正确添加到用户账户
- ✅ 动画效果保持不变，只是触发时机改变

## 技术细节

### AsyncStorage 标记格式
```json
{
  "experienceGained": 15,
  "timestamp": 1703123456789
}
```

### 时间窗口
- 经验值增益标记在5秒内有效
- 超过5秒的标记会被自动清理

### 延迟触发
- 动画在页面加载完成后延迟500ms触发
- 确保页面完全渲染后再开始动画
