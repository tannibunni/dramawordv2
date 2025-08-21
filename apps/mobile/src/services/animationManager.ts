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
  private animationStartTime: number = 0; // 添加动画开始时间属性
  
  // 记录当前进度条的数值（0-100），用于避免动画期间回退
  private currentProgressBarValue: number = 0;
  
  // 动画值 - 只保留实际使用的动画
  public readonly scaleAnimation = new Animated.Value(1);
  public readonly opacityAnimation = new Animated.Value(0);
  public readonly numberAnimation = new Animated.Value(0);
  public readonly levelAnimation = new Animated.Value(1);
  public readonly progressBarAnimation = new Animated.Value(0);

  private constructor() {}

  public static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  // 统一的等级计算函数 - 与 ExperienceManager 保持一致
  public calculateLevel(exp: number): number {
    if (exp < 50) return 1;
    if (exp < 75) return 2;   // 50 × 1.5 = 75
    if (exp < 112) return 3;  // 75 × 1.5 = 112.5 ≈ 112
    if (exp < 168) return 4;  // 112 × 1.5 = 168
    if (exp < 252) return 5;  // 168 × 1.5 = 252
    if (exp < 452) return 6;  // 252 + 200 = 452
    // 6级以后：每200经验值升一级
    return Math.floor((exp - 452) / 200) + 7;
  }

  // 统一的进度计算函数 - 与 ExperienceManager 保持一致
  public calculateProgress(experience: number, level: number): number {
    if (experience <= 0) return 0;
    
    // 使用与 ExperienceManager 相同的逻辑
    if (level === 1) {
      return Math.min(100, Math.max(0, (experience / 50) * 100));
    }
    
    // 计算当前等级所需的总经验值
    let totalExpForCurrentLevel: number;
    if (level === 2) totalExpForCurrentLevel = 75;
    else if (level === 3) totalExpForCurrentLevel = 112;
    else if (level === 4) totalExpForCurrentLevel = 168;
    else if (level === 5) totalExpForCurrentLevel = 252;
    else if (level === 6) totalExpForCurrentLevel = 452;
    else totalExpForCurrentLevel = 452 + (level - 6) * 200;
    
    // 计算上一等级所需的总经验值
    let totalExpForPreviousLevel: number;
    if (level === 2) totalExpForPreviousLevel = 50;
    else if (level === 3) totalExpForPreviousLevel = 75;
    else if (level === 4) totalExpForPreviousLevel = 112;
    else if (level === 5) totalExpForPreviousLevel = 168;
    else if (level === 6) totalExpForPreviousLevel = 252;
    else totalExpForPreviousLevel = 452 + (level - 7) * 200;
    
    // 计算当前等级内的经验值
    const expInCurrentLevel = experience - totalExpForPreviousLevel;
    const expNeededForCurrentLevel = totalExpForCurrentLevel - totalExpForPreviousLevel;
    
    if (expNeededForCurrentLevel <= 0) return 0;
    
    const progressPercentage = (expInCurrentLevel / expNeededForCurrentLevel) * 100;
    return Math.min(100, Math.max(0, progressPercentage));
  }

  // 重置所有动画值
  public resetAnimationValues(): void {
    // 只在非动画状态下重置，避免中断正在进行的动画
    if (!this.isAnimating) {
      this.scaleAnimation.setValue(1);
      this.opacityAnimation.setValue(0);
      this.numberAnimation.setValue(0);
      this.levelAnimation.setValue(1);
      this.progressBarAnimation.setValue(0);
      this.currentProgressBarValue = 0;
    }
  }

  // 清理动画监听器
  public cleanupListeners(): void {
    this.numberAnimation.removeAllListeners();
    this.progressBarAnimation.removeAllListeners();
    this.scaleAnimation.removeAllListeners();
    this.opacityAnimation.removeAllListeners();
    this.levelAnimation.removeAllListeners();
  }

  // 防止重复动画
  public canStartAnimation(): boolean {
    // 优化动画状态检查 - 允许在特定情况下重新启动动画
    if (this.isAnimating) {
      // 如果动画正在进行中，检查是否已经运行了足够长的时间
      // 如果动画运行超过2秒，允许重新启动（可能是卡住了）
      const animationStartTime = this.animationStartTime || 0;
      const now = Date.now();
      const animationDuration = now - animationStartTime;
      
      if (animationDuration > 2000) {
        logger.info(`动画运行时间过长(${animationDuration}ms)，允许重新启动`, 'canStartAnimation');
        // 强制重置状态
        this.resetAnimatingState();
        return true;
      }
      
      logger.info('动画正在进行中，跳过重复动画', 'canStartAnimation');
      return false;
    }
    return true;
  }

  // 设置动画状态
  public setAnimatingState(isAnimating: boolean): void {
    this.isAnimating = isAnimating;
    if (isAnimating) {
      this.animationStartTime = Date.now();
    } else {
      this.animationStartTime = 0;
    }
    logger.info(`设置动画状态: ${isAnimating}`, 'setAnimatingState');
  }

  // 查询当前动画状态（对外）
  public isAnimatingNow(): boolean {
    return this.isAnimating;
  }

  // 强制重置动画状态
  public resetAnimatingState(): void {
    this.isAnimating = false;
    this.animationStartTime = 0;
    logger.info('强制重置动画状态', 'resetAnimatingState');
  }

  // 统一的经验值动画
  public startExperienceAnimation(params: ExperienceAnimationParams, callbacks: {
    onStart?: () => void;
    onProgress?: (currentExp: number, currentProgress: number) => void;
    onComplete?: (finalExp: number, finalProgress: number) => void;
  } = {}): void {
    logger.info('尝试启动经验值动画', 'startExperienceAnimation');
    
    if (!this.canStartAnimation()) {
      logger.info('动画被阻止：正在进行中', 'startExperienceAnimation');
      return;
    }

    // 先清理之前的监听器，然后设置动画状态
    this.cleanupListeners();
    this.setAnimatingState(true);
    
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
    
    // 设置初始值，确保进度条从正确位置开始，且不倒退
    this.numberAnimation.setValue(0); // 数字动画从0开始，表示增益的进度
    this.opacityAnimation.setValue(0);
    this.scaleAnimation.setValue(1);
    this.levelAnimation.setValue(1);

    // 初始化进度条值（0-100），在动画期间不允许比当前显示值更低
    const initialProgress = Math.max(0, Math.min(100, oldProgress * 100));
    // 确保 currentProgressBarValue 被正确设置为当前进度值
    this.currentProgressBarValue = Math.max(this.currentProgressBarValue, initialProgress);
    // 初始进度设置为当前记录值与起始进度的最大值，避免被外部初始化覆盖
    this.setProgressBarValue(Math.max(initialProgress, this.currentProgressBarValue));

    logger.info('开始统一经验值动画', 'startExperienceAnimation');
    console.log('[AnimationManager] 动画参数:', {
      oldExperience,
      newExperience,
      gainedExp,
      oldLevel,
      newLevel,
      isLevelUp,
      oldProgress,
      newProgress
    });

    // 数字动画监听器
    this.numberAnimation.addListener(({ value }) => {
      // 数字动画：从当前经验值增长到新经验值
      const currentExp = Math.round(oldExperience + (value * gainedExp));
      let currentProgress;

      if (isLevelUp) {
        // 等级提升视觉优化：
        // 动画过程中进度条从 oldProgress 增长到 100%，表示完成当前等级
        // 动画完成后，进度条会重置为新等级的进度（从0开始）
        currentProgress = Math.min(1, oldProgress + value * (1 - oldProgress));
      } else {
        // 同等级内，进度条从旧进度平滑增长到新进度
        currentProgress = oldProgress + (value * (newProgress - oldProgress));
      }
      
      // 确保进度值在有效范围内
      currentProgress = Math.max(0, Math.min(1, currentProgress));
      
      // 更新进度条动画值（转换为 0-100 范围）
      const progressBarValue = currentProgress * 100;
      // 数字动画推进时，同步推进进度条（保留单调不减）
      this.setProgressBarValue(progressBarValue);
      
      // 添加调试日志
      // 只在进度变化显著时记录日志
      if (Math.abs(oldProgress - currentProgress) >= 0.1) {
        console.log(`[AnimationManager] 进度条更新: ${(oldProgress * 100).toFixed(0)}% → ${(currentProgress * 100).toFixed(0)}%`);
      }
      
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
      // 收缩动画
      Animated.sequence([
        // 缩放动画
        Animated.timing(this.scaleAnimation, {
          toValue: 0.1,
          duration: 300,
          useNativeDriver: true,
        }),
        // 透明度渐变（在缩放完成后）
        Animated.timing(this.opacityAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        })
      ]),
      // 等待粒子动画完成
      Animated.delay(500), // 给粒子动画足够的时间完成
    ]).start(() => {
      logger.info('动画序列完成，重置状态', 'startExperienceAnimation');
      this.setAnimatingState(false);
      this.cleanupListeners();
      
      // 动画完成时，确保最终数值对齐
      if (isLevelUp) {
        // 升级后，进度条应该显示新等级的进度（从0开始）
        this.setProgressBarValue(newProgress * 100);
      } else {
        // 同等级内，进度条显示最终进度
        this.setProgressBarValue(Math.max(this.currentProgressBarValue, Math.max(0, Math.min(100, newProgress * 100))));
      }
      
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
    
    // 设置初始值，保证不回退
    this.setProgressBarValue(fromProgress);
    
    Animated.timing(this.progressBarAnimation, {
      toValue: Math.max(toProgress, this.currentProgressBarValue),
      duration,
      useNativeDriver,
    }).start(() => {
      // 动画完成后对齐记录值
      this.currentProgressBarValue = Math.max(this.currentProgressBarValue, toProgress);
      logger.info('进度条动画完成', 'startProgressBarAnimation');
    });
  }

  // 注意: startStatisticsAnimation 方法已删除，因为相关动画值未被使用

  // 获取动画值 - 只返回实际使用的动画
  public getAnimationValues() {
    return {
      scaleAnimation: this.scaleAnimation,
      opacityAnimation: this.opacityAnimation,
      numberAnimation: this.numberAnimation,
      levelAnimation: this.levelAnimation,
      progressBarAnimation: this.progressBarAnimation,
    };
  }

  // 统一设置进度条的助手，避免回退
  private setProgressBarValue(nextValue: number): void {
    const clamped = Math.max(0, Math.min(100, nextValue));
    // 保证单调不减 - 进度条永远不会回退
    const finalValue = Math.max(clamped, this.currentProgressBarValue);
    this.currentProgressBarValue = finalValue;
    this.progressBarAnimation.setValue(finalValue);
    
    // 添加调试日志（仅在开发环境）
    if (__DEV__) {
      console.log(`[AnimationManager] 进度条更新: ${clamped}% → ${finalValue}% (保护后)`);
    }
  }

  // 对外暴露：立即设置进度条，同时同步内部记录，避免后续动画回退
  public setProgressBarImmediate(percent: number): void {
    this.setProgressBarValue(percent);
  }
}

// 导出单例实例
export const animationManager = AnimationManager.getInstance(); 