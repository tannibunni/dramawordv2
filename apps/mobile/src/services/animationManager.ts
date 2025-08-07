// 统一动画管理器
// 避免重复的动画代码和逻辑

import { Animated } from 'react-native';
import Logger from '../utils/logger';
import { eventManager, EVENT_TYPES } from './eventManager';
import { ExperienceGainAnimation } from '../components/common/ExperienceGainAnimation';
import React from 'react';

// 创建页面专用日志器
const logger = Logger.forPage('AnimationManager');

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  useNativeDriver?: boolean;
}

export interface ExperienceAnimationParams {
  oldExperience: number;
  newExperience: number;
  gainedExp: number;
  oldLevel: number;
  newLevel: number;
  isLevelUp: boolean;
  oldProgress: number;
  newProgress: number;
}

export class AnimationManager {
  private static instance: AnimationManager;
  private isAnimating: boolean = false;
  private animationQueue: Array<() => void> = [];
  
  // 动画值
  public readonly experienceAnimation = new Animated.Value(0);
  public readonly scaleAnimation = new Animated.Value(1);
  public readonly opacityAnimation = new Animated.Value(0);
  public readonly progressAnimation = new Animated.Value(0);
  public readonly numberAnimation = new Animated.Value(0);
  public readonly levelAnimation = new Animated.Value(1);
  public readonly collectedWordsAnimation = new Animated.Value(0);
  public readonly contributedWordsAnimation = new Animated.Value(0);
  public readonly progressBarAnimation = new Animated.Value(0);

  private constructor() {}

  public static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  // 统一的等级计算函数
  public calculateLevel(exp: number): number {
    if (exp <= 0) return 1;
    
    let level = 1;
    while (true) {
      const totalExpForNextLevel = 50 * Math.pow(level + 1, 2);
      if (exp < totalExpForNextLevel) {
        break;
      }
      level++;
    }
    return level;
  }

  // 统一的进度计算函数
  public calculateProgress(experience: number, level: number): number {
    if (experience <= 0) return 0;
    
    const totalExpForNextLevel = 50 * Math.pow(level + 1, 2);
    const totalExpForCurrentLevel = 50 * Math.pow(level, 2);
    const expNeededForCurrentLevel = totalExpForNextLevel - totalExpForCurrentLevel;
    
    // 计算当前等级内的经验值
    const expInCurrentLevel = experience - totalExpForCurrentLevel;
    const progressPercentage = (expInCurrentLevel / expNeededForCurrentLevel) * 100;
    
    return Math.min(100, Math.max(0, progressPercentage));
  }

  // 重置所有动画值
  public resetAnimationValues(): void {
    this.experienceAnimation.setValue(0);
    this.scaleAnimation.setValue(1);
    this.opacityAnimation.setValue(0);
    this.progressAnimation.setValue(0);
    this.numberAnimation.setValue(0);
    this.levelAnimation.setValue(1);
    this.collectedWordsAnimation.setValue(0);
    this.contributedWordsAnimation.setValue(0);
    this.progressBarAnimation.setValue(0);
  }

  // 清理动画监听器
  public cleanupListeners(): void {
    this.numberAnimation.removeAllListeners();
    this.progressBarAnimation.removeAllListeners();
  }

  // 防止重复动画
  public canStartAnimation(): boolean {
    if (this.isAnimating) {
      logger.info('动画正在进行中，跳过重复动画', 'canStartAnimation');
      return false;
    }
    return true;
  }

  // 设置动画状态
  public setAnimatingState(isAnimating: boolean): void {
    this.isAnimating = isAnimating;
  }

  // 统一的经验值动画
  public startExperienceAnimation(params: ExperienceAnimationParams, callbacks: {
    onStart?: () => void;
    onProgress?: (currentExp: number, currentProgress: number) => void;
    onComplete?: (finalExp: number, finalProgress: number) => void;
  } = {}): Promise<void> {
    return new Promise((resolve) => {
      if (!this.canStartAnimation()) {
        resolve();
        return;
      }

      this.setAnimatingState(true);
      this.cleanupListeners();
      
      const {
        oldExperience,
        newExperience,
        gainedExp,
        oldLevel,
        newLevel,
        isLevelUp,
        oldProgress,
        newProgress
      } = params;

      logger.info('开始统一经验值动画', 'startExperienceAnimation');

      // 调用开始回调
      callbacks.onStart?.();

      const handleComplete = () => {
        this.setAnimatingState(false);
        this.cleanupListeners();
        callbacks.onComplete?.(newExperience, newProgress);
        logger.info('统一经验值动画完成', 'startExperienceAnimation');
        eventManager.emit(EVENT_TYPES.HIDE_EXPERIENCE_ANIMATION);
        resolve();
      };

      // 渲染新的动画组件
      const renderExperienceAnimation = () => {
        return (
          <ExperienceGainAnimation
            gainedExp={gainedExp}
            currentExp={oldExperience}
            targetExp={newExperience}
            level={newLevel}
            isLevelUp={isLevelUp}
            onComplete={handleComplete}
            duration={2000}
            canSkip={true}
          />
        );
      };

      // 通过事件发送动画组件
      eventManager.emit(EVENT_TYPES.SHOW_EXPERIENCE_ANIMATION, {
        component: renderExperienceAnimation,
      });
    });
  }

  // 统一的数字滚动动画
  public startNumberAnimation(
    animatedValue: Animated.Value,
    targetValue: number,
    config: AnimationConfig = {}
  ): void {
    const { duration = 1500, useNativeDriver = false } = config;
    
    Animated.timing(animatedValue, {
      toValue: targetValue,
      duration,
      useNativeDriver,
    }).start();
  }

  // 统一的进度条动画
  public startProgressBarAnimation(
    fromProgress: number,
    toProgress: number,
    config: AnimationConfig = {}
  ): void {
    if (this.isAnimating) {
      logger.info('经验值动画进行中，跳过进度条动画', 'startProgressBarAnimation');
      return;
    }

    const { duration = 1500, useNativeDriver = false } = config;
    
    this.cleanupListeners();
    
    // 设置初始值
    this.progressBarAnimation.setValue(fromProgress);
    
    Animated.timing(this.progressBarAnimation, {
      toValue: toProgress,
      duration,
      useNativeDriver,
    }).start(() => {
      logger.info('进度条动画完成', 'startProgressBarAnimation');
    });
  }

  // 统一的统计数字动画
  public startStatisticsAnimation(
    collectedWords: number,
    contributedWords: number,
    config: AnimationConfig = {}
  ): void {
    const { duration = 1500 } = config;
    
    // 收集单词数量动画
    this.startNumberAnimation(this.collectedWordsAnimation, collectedWords, { duration });
    
    // 贡献单词数量动画
    this.startNumberAnimation(this.contributedWordsAnimation, contributedWords, { duration });
  }

  // 获取动画值
  public getAnimationValues() {
    return {
      experienceAnimation: this.experienceAnimation,
      scaleAnimation: this.scaleAnimation,
      opacityAnimation: this.opacityAnimation,
      progressAnimation: this.progressAnimation,
      numberAnimation: this.numberAnimation,
      levelAnimation: this.levelAnimation,
      collectedWordsAnimation: this.collectedWordsAnimation,
      contributedWordsAnimation: this.contributedWordsAnimation,
      progressBarAnimation: this.progressBarAnimation,
    };
  }
}

// 导出单例实例
export const animationManager = AnimationManager.getInstance(); 