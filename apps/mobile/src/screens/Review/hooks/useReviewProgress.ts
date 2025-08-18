import { useState, useRef, useEffect, useCallback } from 'react';
import { Animated } from 'react-native';

export const useReviewProgress = (totalWords: number) => {
  const [swiperIndex, setSwiperIndex] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isReviewComplete, setIsReviewComplete] = useState(false);
  
  // 五连击相关状态
  const [fiveStreakCount, setFiveStreakCount] = useState(0);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  
  // 进度条动画相关
  const progressAnimation = useRef(new Animated.Value(0)).current;
  
  // 监控 swiperIndex 变化
  useEffect(() => {
    if (swiperIndex === 0) return;

    // 修复进度计算逻辑：
    // swiperIndex 表示当前正在查看的卡片索引（从0开始）
    // 已完成的卡片数量是 swiperIndex（因为用户已经划完了 swiperIndex 张卡）
    // 进度计算：已完成的卡片数量 / 总卡片数量
    const denominator = totalWords > 0 ? totalWords : 1;
    const completedCards = swiperIndex; // 已完成的卡片数量
    const computedProgress = Math.min(100, Math.max(0, (completedCards / denominator) * 100));
    
    // 进度条不允许回退，保证单调递增
    const newProgress = Math.max(currentProgress, computedProgress);
    
    // 只在进度变化显著时记录日志
    if (Math.abs(newProgress - currentProgress) >= 10) {
      console.log(`📊 进度条更新: ${currentProgress.toFixed(0)}% → ${newProgress.toFixed(0)}%`);
    }
    
    // 避免频繁更新
    if (Math.abs(newProgress - currentProgress) < 0.1) {
      return;
    }
    
    // 使用 requestAnimationFrame 确保在下一帧更新状态，避免渲染过程中的状态更新
    requestAnimationFrame(() => {
      // 动画更新进度条
      Animated.timing(progressAnimation, {
        toValue: newProgress,
        duration: 300,
        useNativeDriver: false,
      }).start();
      
      setCurrentProgress(newProgress);
    });
  }, [swiperIndex, currentProgress, totalWords, progressAnimation]); // 移除 updateProgressBar 依赖
  
  // 处理正确答案，检查五连击
  const handleCorrectAnswer = () => {
    const newStreakCount = fiveStreakCount + 1;
    setFiveStreakCount(newStreakCount);
    
    console.log(`✅ 正确答案！当前连击: ${newStreakCount}`);
    
    // 检查是否达到五连击
    if (newStreakCount >= 5) {
      console.log('🎉 五连击达成！显示鼓励动画');
      setShowStreakAnimation(true);
      setFiveStreakCount(0); // 重置计数器
    }
  };
  
  // 处理错误答案，重置连击
  const handleWrongAnswer = () => {
    if (fiveStreakCount > 0) {
      console.log(`❌ 答错了，连击中断！之前连击: ${fiveStreakCount}`);
      setFiveStreakCount(0);
    }
  };
  
  // 从五连击动画继续
  const continueFromStreak = () => {
    console.log('🚀 继续学习');
    setShowStreakAnimation(false);
  };
  
  // 重置进度
  const resetProgress = useCallback(() => {
    console.log('📊 进度条重置: 0%');
    
    // 使用 requestAnimationFrame 确保状态更新在正确的时机进行
    requestAnimationFrame(() => {
      // 重置动画
      Animated.timing(progressAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setCurrentProgress(0);
      });
      
      // 移除重复的状态更新，避免useInsertionEffect警告
      // setCurrentProgress(0);
    });
  }, [progressAnimation]); // 添加 progressAnimation 依赖
  
  // 设置完成状态
  const setComplete = useCallback(() => {
    console.log('📊 进度条完成: 100%');
    
    // 使用 requestAnimationFrame 确保状态更新在正确的时机进行
    requestAnimationFrame(() => {
      // 动画到100%
      Animated.timing(progressAnimation, {
        toValue: 100,
        duration: 500,
        useNativeDriver: false,
      }).start(() => {
        // 只在动画完成后更新状态，避免重复调用
        setCurrentProgress(100);
      });
      
      // 移除重复的状态更新，避免useInsertionEffect警告
      // setCurrentProgress(100);
      
      // 修复：设置复习完成状态，让页面能跳转到ReviewCompleteScreen
      setIsReviewComplete(true);
      console.log('✅ 复习完成状态已设置: isReviewComplete = true');
    });
  }, []); // 移除 progressAnimation 依赖
  
  // 移动到下一个单词
  const moveToNextWord = (totalWords: number) => {
    console.log('🔄 moveToNextWord 开始 - current swiperIndex:', swiperIndex, 'words.length:', totalWords);
    if (swiperIndex < totalWords) {
      const newIndex = swiperIndex + 1;
      console.log('📱 移动到下一个单词 - new index:', newIndex);
      setSwiperIndex(newIndex);
      
      // 如果已经查看完所有卡片（newIndex === totalWords），表示复习完成
      if (newIndex === totalWords) {
        console.log('🎯 所有卡片已查看完毕，先显示8/8和100%进度条，然后延迟进入完成页面');
        console.log('📊 当前进度条状态: currentProgress=', currentProgress, 'progressAnimation=', progressAnimation);
        
        // 使用 requestAnimationFrame 确保状态更新在正确的时机进行
        requestAnimationFrame(() => {
          // 使用平滑的动画将进度条从当前进度动画到100%
          // 停止之前的动画
          requestAnimationFrame(() => {
            progressAnimation.stopAnimation();
          });
          
          // 计算当前进度到100%的动画
          const startProgress = currentProgress;
          const targetProgress = 100;
          
          console.log(`🎬 开始进度条动画: 从 ${startProgress.toFixed(2)}% 到 ${targetProgress}%`);
          
          Animated.timing(progressAnimation, {
            toValue: targetProgress,
            duration: 1500, // 1.5秒的平滑动画
            useNativeDriver: false,
          }).start(({ finished }) => {
            if (finished) {
              console.log('✅ 进度条动画到100%完成');
              setCurrentProgress(100);
            } else {
              console.log('⚠️ 进度条动画被中断，强制设置为100%');
              // 使用 requestAnimationFrame 避免在渲染过程中直接修改动画值
              requestAnimationFrame(() => {
                progressAnimation.setValue(100);
                setCurrentProgress(100);
              });
            }
          });
        });
        
        console.log('✅ 进度条动画已启动，等待4秒后进入完成页面');
        
        // 延迟后显示完成页面，让用户有足够时间看到 8/8 和 100% 进度条
        setTimeout(() => {
          console.log('🏁 延迟结束，现在进入完成页面');
          setComplete();
        }, 4000); // 4秒延迟，让用户充分看到完整的进度
      } else {
        console.log('📱 继续下一张卡');
      }
    } else {
      console.log('⚠️ swiperIndex 超出范围，无法移动到下一个单词');
    }
  };
  
  // 强制完成进度条
  const forceComplete = useCallback(() => {
    const startProgress = currentProgress;
    const targetProgress = 100;
    
    console.log(`📊 进度条强制完成: ${startProgress.toFixed(0)}% → 100%`);
    
    // 使用 requestAnimationFrame 确保状态更新在正确的时机进行
    requestAnimationFrame(() => {
      // 快速动画到100%
      Animated.timing(progressAnimation, {
        toValue: targetProgress,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        // 只在动画完成后更新状态
        setCurrentProgress(100);
      });
      
      // 移除重复的状态更新，避免useInsertionEffect警告
      // setCurrentProgress(100);
    });
  }, [currentProgress]); // 移除 progressAnimation 依赖
  
  // 调试进度条状态
  const debugProgress = useCallback(() => {
    console.log('📊 当前进度条状态:', {
      currentProgress: Math.round(currentProgress),
      totalWords,
      progressAnimation: progressAnimation
    });
  }, [currentProgress, totalWords]); // 移除 progressAnimation 依赖
  
  return {
    swiperIndex,
    setSwiperIndex,
    currentProgress,
    progressAnimation,
    isReviewComplete,
    resetProgress,
    setComplete,
    moveToNextWord,
    // 五连击相关
    fiveStreakCount,
    showStreakAnimation,
    handleCorrectAnswer,
    handleWrongAnswer,
    continueFromStreak,
    forceComplete,
    debugProgress
  };
}; 