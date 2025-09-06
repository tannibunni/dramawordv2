# Level 1 经验值显示修复

## 🐛 问题描述

用户反馈：Level 1 满级显示为 75 经验值，但实际在 50 经验值时就已经升级到 Level 2 了。

## 🔍 问题分析

### 等级系统配置
根据代码分析，等级系统的经验值配置如下：

```typescript
// 等级计算逻辑
if (experience < 50) return 1;        // Level 1: 0-49 经验值
if (experience < 75) return 2;        // Level 2: 50-74 经验值  
if (experience < 112) return 3;       // Level 3: 75-111 经验值
if (experience < 168) return 4;       // Level 4: 112-167 经验值
if (experience < 252) return 5;       // Level 5: 168-251 经验值
if (experience < 452) return 6;       // Level 6: 252-451 经验值
```

### 问题根源
界面显示逻辑有误：
- **实际配置**：Level 1 满级是 50 经验值
- **界面显示**：显示为 75 经验值（这是 Level 2 需要的总经验值）
- **用户困惑**：看到 75 但实际 50 就升级了

## ✅ 修复方案

### 修复内容
将 `experienceToNextLevel` 的默认值从 75 改为 50：

```typescript
// 修复前
experienceToNextLevel: 75, // 显示下一等级(2级)需要的总经验值

// 修复后  
experienceToNextLevel: 50, // Level 1 满级需要 50 经验值
```

### 修复位置
文件：`apps/mobile/src/screens/Review/services/experienceManager.ts`

修复了所有出现 `experienceToNextLevel: 75` 的地方，确保 Level 1 用户看到正确的经验值上限。

## 📊 等级系统说明

### 经验值配置表
| 等级 | 经验值范围 | 满级所需经验值 | 升级到下一级所需总经验值 |
|------|------------|----------------|-------------------------|
| Level 1 | 0-49 | 50 | 50 |
| Level 2 | 50-74 | 75 | 75 |
| Level 3 | 75-111 | 112 | 112 |
| Level 4 | 112-167 | 168 | 168 |
| Level 5 | 168-251 | 252 | 252 |
| Level 6 | 252-451 | 452 | 452 |
| Level 7+ | 每200经验值升一级 | - | - |

### 界面显示逻辑
- **Level 1 用户**：显示 "当前经验值 / 50 XP"
- **Level 2 用户**：显示 "当前经验值 / 75 XP"  
- **Level 3 用户**：显示 "当前经验值 / 112 XP"
- 以此类推...

## 🎯 修复效果

### 修复前
- Level 1 用户看到：`0 / 75 XP` ❌
- 用户困惑：为什么 50 经验值就升级了？

### 修复后  
- Level 1 用户看到：`0 / 50 XP` ✅
- 用户清楚：50 经验值就是 Level 1 的满级

## 🔧 技术细节

### 相关文件
- `apps/mobile/src/screens/Review/services/experienceManager.ts` - 主要修复文件
- `apps/mobile/src/services/animationManager.ts` - 等级计算逻辑
- `apps/mobile/src/screens/Review/ReviewIntroScreen.tsx` - 界面显示

### 影响范围
- ✅ 修复了 Level 1 用户的经验值显示
- ✅ 不影响其他等级的用户体验
- ✅ 保持了等级计算逻辑的一致性

## 📝 总结

这个修复解决了用户界面显示与实际游戏逻辑不一致的问题：

1. **问题**：Level 1 显示 75 经验值上限，但实际 50 就升级
2. **原因**：界面显示逻辑错误，显示了下一等级的总经验值
3. **修复**：将 Level 1 的显示上限改为正确的 50 经验值
4. **结果**：用户界面与实际游戏逻辑保持一致

现在 Level 1 用户会看到正确的经验值上限（50），不会再产生困惑！
