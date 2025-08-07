# 经验动画组件使用指南

## 概述

经验动画组件已经简化为单一文件，包含完整的UI和动画逻辑。

## 文件结构

```
src/components/common/
├── ExperienceAnimation.tsx          # 完整的经验动画组件
└── README_ExperienceAnimation.md    # 使用指南
```

## 使用方法

### 1. 在 ReviewIntroScreen 中使用

```typescript
import React, { useRef } from 'react';
import ExperienceAnimation from '../../components/common/ExperienceAnimation';

const ReviewIntroScreen = () => {
  const animationRef = useRef<any>(null);

  // 在 ReviewCompleteScreen 返回后触发动画
  const handleReviewComplete = (experienceGained: number) => {
    animationRef.current?.startExperienceAnimation(
      experienceGained,  // 获得的经验值
      userStats.level,    // 用户等级
      userStats.experience // 用户当前经验值
    );
  };

  return (
    <View style={styles.container}>
      {/* 其他内容 */}
      
      {/* 经验动画组件 */}
      <ExperienceAnimation
        ref={animationRef}
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

## 组件特性

### 1. 自包含设计
- 包含完整的UI和动画逻辑
- 无需额外的管理器或示例文件
- 使用 `useImperativeHandle` 暴露方法

### 2. 动画管理
- 自动管理动画状态
- 内置淡入淡出和缩放效果
- 支持动画完成回调

### 3. 升级检测
- 自动检测是否升级
- 升级时显示特殊提示
- 动态计算等级变化

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

1. 在 `ReviewIntroScreen` 中导入 `ExperienceAnimation`
2. 使用 `useRef` 创建引用
3. 在需要触发动画的地方调用 `startExperienceAnimation`
4. 测试动画效果和性能

## 注意事项

- 确保动画组件在所有页面层级的最顶层
- 避免在动画期间进行其他状态更新
- 注意内存泄漏，及时清理动画资源
- 组件会自动管理可见性，无需手动控制
