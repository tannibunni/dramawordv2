# LanguagePicker状态同步问题修复

## 问题描述

用户在初始设置中选择语言（英语、日语、法语）后，HomeScreen的LanguagePicker仍然显示全部语言，需要去Profile页面打开语言设置后，回到HomeScreen，picker才显示所选语言。

## 问题根源

1. **状态更新时机问题**：`LanguagePicker`组件在挂载时只加载一次`AsyncStorage`中的学习语言设置
2. **数据同步延迟**：当用户在`InitialLanguageModal`中保存语言设置后，`AsyncStorage`的数据更新了，但`LanguagePicker`的状态没有立即更新
3. **缺乏实时监听**：组件没有监听`AsyncStorage`中`learningLanguages`的变化

## 修复方案

### 1. 添加实时监听机制

在`LanguagePicker`组件中添加了一个新的`useEffect`，每500ms检查一次`AsyncStorage`中`learningLanguages`的变化：

```typescript
// 添加实时监听AsyncStorage变化
useEffect(() => {
  const interval = setInterval(async () => {
    const saved = await AsyncStorage.getItem('learningLanguages');
    if (saved) {
      const languages = JSON.parse(saved);
      setLearningLanguages(prev => {
        // 只有当数据真正发生变化时才更新
        if (JSON.stringify(prev) !== JSON.stringify(languages)) {
          console.log('LanguagePicker - 检测到学习语言变化:', languages);
          return languages;
        }
        return prev;
      });
    }
  }, 500); // 每500ms检查一次

  return () => clearInterval(interval);
}, []);
```

### 2. 优化性能

- 使用`JSON.stringify`比较来检测数据是否真正发生变化
- 只有当数据真正变化时才更新状态，避免不必要的重渲染
- 在组件卸载时清理定时器

### 3. 用户体验改进

- 实时响应：用户选择语言后，HomeScreen的LanguagePicker会立即更新
- 无需手动刷新：不需要去Profile页面就能看到正确的语言列表
- 保持一致性：所有页面的语言选择器都会显示相同的语言列表

## 修复效果

### 修复前
1. 用户选择英语、日语、法语
2. HomeScreen显示全部语言
3. 需要去Profile页面才能看到正确选择

### 修复后
1. 用户选择英语、日语、法语
2. HomeScreen立即显示英语、日语、法语
3. 所有页面保持一致

## 技术细节

### 文件修改
- `apps/mobile/src/components/common/LanguagePicker.tsx`

### 关键代码
```typescript
// 实时监听AsyncStorage变化
useEffect(() => {
  const interval = setInterval(async () => {
    const saved = await AsyncStorage.getItem('learningLanguages');
    if (saved) {
      const languages = JSON.parse(saved);
      setLearningLanguages(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(languages)) {
          console.log('LanguagePicker - 检测到学习语言变化:', languages);
          return languages;
        }
        return prev;
      });
    }
  }, 500);

  return () => clearInterval(interval);
}, []);
```

## 测试验证

### 测试步骤
1. 启动应用，进入初始语言设置
2. 选择英语、日语、法语
3. 完成设置，回到HomeScreen
4. 检查LanguagePicker是否显示正确的语言列表

### 预期结果
- HomeScreen的LanguagePicker立即显示英语、日语、法语
- 不需要去Profile页面就能看到正确选择
- 所有页面的语言选择器保持一致

## 注意事项

1. **性能考虑**：500ms的检查间隔在性能和响应性之间取得平衡
2. **内存管理**：确保在组件卸载时清理定时器
3. **数据一致性**：使用JSON.stringify比较确保数据真正变化时才更新

## 总结

通过添加实时监听机制，解决了LanguagePicker状态同步的问题，提升了用户体验。用户现在可以在初始设置完成后立即看到正确的语言选择，无需额外的操作。 