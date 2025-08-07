import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import ExperienceAnimation from './ExperienceAnimation';

interface ExperienceAnimationManagerProps {
  onAnimationComplete?: () => void;
}

interface AnimationState {
  visible: boolean;
  experienceGained: number;
  userLevel: number;
  userExperience: number;
}

const ExperienceAnimationManager: React.FC<ExperienceAnimationManagerProps> = ({
  onAnimationComplete
}) => {
  const [animationState, setAnimationState] = useState<AnimationState>({
    visible: false,
    experienceGained: 0,
    userLevel: 1,
    userExperience: 0
  });

  const opacityAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  // 开始经验动画
  const startExperienceAnimation = (
    experienceGained: number,
    userLevel: number,
    userExperience: number
  ) => {
    setAnimationState({
      visible: true,
      experienceGained,
      userLevel,
      userExperience
    });

    // 重置动画值
    opacityAnimation.setValue(0);
    scaleAnimation.setValue(1);

    // 动画序列
    Animated.sequence([
      // 淡入弹窗
      Animated.timing(opacityAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // 弹窗缩放动画
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      // 等待一段时间
      Animated.delay(800),
      // 等待动画完成
      Animated.delay(500),
      // 淡出弹窗
      Animated.timing(opacityAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 动画完成后的回调
      setAnimationState(prev => ({ ...prev, visible: false }));
      onAnimationComplete?.();
    });
  };

  // 暴露给外部的方法
  React.useImperativeHandle(React.useRef(), () => ({
    startExperienceAnimation
  }));

  return (
    <ExperienceAnimation
      visible={animationState.visible}
      experienceGained={animationState.experienceGained}
      userLevel={animationState.userLevel}
      userExperience={animationState.userExperience}
      opacityAnimation={opacityAnimation}
      scaleAnimation={scaleAnimation}
    />
  );
};

export default ExperienceAnimationManager;
