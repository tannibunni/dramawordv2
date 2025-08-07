# 经验动画组件使用指南

## 概述

经验动画组件已经被提取到独立的文件中，方便后续优化和维护。包含以下文件：

- `ExperienceAnimation.tsx` - 核心动画组件
- `ExperienceAnimationManager.tsx` - 动画管理器
- `ExperienceAnimationExample.tsx` - 使用示例

## 文件结构

```
src/components/common/
├── ExperienceAnimation.tsx          # 核心动画组件
├── ExperienceAnimationManager.tsx   # 动画管理器
├── ExperienceAnimationExample.tsx   # 使用示例
└── README_ExperienceAnimation.md    # 使用指南
```

## 使用方法

### 1. 在 ReviewIntroScreen 中使用

```typescript
import React, { useRef } from 'react';
import ExperienceAnimationManager from '../../components/common/ExperienceAnimationManager';

const ReviewIntroScreen = () => {
  const animationManagerRef = useRef<any>(null);

  // 在 ReviewCompleteScreen 返回后触发动画
  const handleReviewComplete = (experienceGained: number) => {
    animationManagerRef.current?.startExperienceAnimation(
      experienceGained,  // 获得的经验值
      userStats.level,    // 用户等级
      userStats.experience // 用户当前经验值
    );
  };

  return (
    <View style={styles.container}>
      {/* 其他内容 */}
      
      {/* 经验动画组件 */}
      <ExperienceAnimationManager
        ref={animationManagerRef}
        onAnimationComplete={() => {
          console.log('🎉 经验动画完成！');
        }}
      />
    </View>
  );
};
```

### 2. 动画参数说明

- `experienceGained`: 获得的经验值
- `userLevel`: 用户当前等级
- `userExperience`: 用户当前经验值

### 3. 动画效果

- 淡入弹窗 (300ms)
- 缩放动画 (400ms)
- 等待时间 (800ms)
- 淡出弹窗 (300ms)
- 总时长约 1.8 秒

## 优化建议

### 1. 动画效果优化
- 添加粒子效果
- 增加音效
- 优化动画曲线
- 添加震动反馈

### 2. 性能优化
- 使用 `useMemo` 优化重渲染
- 添加动画缓存
- 优化动画帧率

### 3. 用户体验优化
- 添加动画跳过功能
- 支持自定义动画时长
- 添加动画预设

## 迁移步骤

1. 将 `ReviewIntroScreen.tsx` 中的经验动画代码替换为新组件
2. 删除原有的动画相关状态和样式
3. 使用 `ExperienceAnimationManager` 管理动画
4. 测试动画效果和性能

## 注意事项

- 确保动画组件在所有页面层级的最顶层
- 避免在动画期间进行其他状态更新
- 注意内存泄漏，及时清理动画资源
