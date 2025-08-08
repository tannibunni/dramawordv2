// 统一动画管理器
// 避免重复的动画代码和逻辑

import { Animated } from 'react-native';
import Logger from '../utils/logger';

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
  } = {}): void {
    if (!this.canStartAnimation()) {
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
    
    // 设置初始值，而不是重置
    this.numberAnimation.setValue(0);
    this.progressBarAnimation.setValue(oldProgress * 100);
    this.opacityAnimation.setValue(0);
    this.scaleAnimation.setValue(1);
    this.levelAnimation.setValue(1);

    logger.info('开始统一经验值动画', 'startExperienceAnimation');

    // 数字动画监听器
    this.numberAnimation.addListener(({ value }) => {
      // 数字动画：从当前经验值增长到新经验值
      const currentExp = Math.round(oldExperience + (value * gainedExp));
      let currentProgress;
      
      if (isLevelUp) {
        currentProgress = value * newProgress;
      } else {
        currentProgress = oldProgress + (value * (newProgress - oldProgress));
      }
      
      // 更新进度条动画值（使用百分比数值）
      const progressPercentage = currentProgress * 100;
      this.progressBarAnimation.setValue(progressPercentage);
      callbacks.onProgress?.(currentExp, currentProgress);
    });

    // 调用开始回调（在监听器设置之后）
    callbacks.onStart?.();

    // 动画序列
    Animated.sequence([
      // 淡入弹窗
      Animated.timing(this.opacityAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // 弹窗缩放动画
      Animated.sequence([
        Animated.timing(this.scaleAnimation, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(this.scaleAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      // 等待一段时间
      Animated.delay(400),
      // 经验值数字动画
      Animated.timing(this.numberAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      // 等级提升动画（如果有）
      ...(isLevelUp ? [
        Animated.sequence([
          Animated.timing(this.levelAnimation, {
            toValue: 1.3,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(this.levelAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ])
      ] : []),
      // 等待动画完成
      Animated.delay(100),
      // 淡出弹窗（现在由粒子动画替代）
      Animated.timing(this.opacityAnimation, {
        toValue: 0,
        duration: 100, // 快速隐藏原始弹窗，让粒子动画接管
        useNativeDriver: true,
      }),
      // 等待粒子动画完成
      Animated.delay(700), // 给粒子动画足够的时间完成
    ]).start(() => {
      this.setAnimatingState(false);
      this.cleanupListeners();
      callbacks.onComplete?.(newExperience, newProgress);
      
      logger.info('统一经验值动画完成', 'startExperienceAnimation');
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