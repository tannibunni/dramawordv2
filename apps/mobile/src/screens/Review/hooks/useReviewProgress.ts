import { useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export const useReviewProgress = () => {
  const [swiperIndex, setSwiperIndex] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isReviewComplete, setIsReviewComplete] = useState(false);
  
  // 进度条动画相关
  const progressAnimation = useRef(new Animated.Value(0)).current;
  
  // 监控 swiperIndex 变化
  useEffect(() => {
    if (swiperIndex === 0) return;
    
    // 修复进度计算逻辑：
    // 开始状态：进度条为0%（swiperIndex=0时）
    // 滑完第一张卡：进度条为50%（swiperIndex=1时，2张卡的情况下）
    // 滑完第二张卡：进度条为100%（swiperIndex=2时，2张卡的情况下）
    const newProgress = Math.min(100, Math.max(0, (swiperIndex / 1) * 100));
    
    console.log(`📊 进度条更新: swiperIndex=${swiperIndex}, progress=${newProgress.toFixed(2)}%`);
    console.log(`🎯 进度条状态: currentProgress=${currentProgress.toFixed(2)}%, newProgress=${newProgress.toFixed(2)}%`);
    
    // 防止重复动画：如果新进度与当前进度相同，跳过动画
    if (Math.abs(newProgress - currentProgress) < 0.1) {
      console.log(`⏭️ 进度条无变化，跳过动画: ${newProgress.toFixed(2)}%`);
      return;
    }
    
    // 停止之前的动画
    progressAnimation.stopAnimation();
    
    // 如果是最后一张卡（进度为100%），立即设置进度条，不使用动画
    if (newProgress >= 100) {
      console.log(`🚀 最后一张卡，立即设置进度条为100%`);
      progressAnimation.setValue(100);
      setCurrentProgress(100);
      return;
    }
    
    // 使用更快的动画速度，减少动画时长以跟上快速划卡
    Animated.timing(progressAnimation, {
      toValue: newProgress,
      duration: 100, // 进一步减少动画时长，让动画更快跟上快速划卡
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        console.log(`✅ 进度条动画完成: ${newProgress.toFixed(2)}%`);
      } else {
        console.log(`⚠️ 进度条动画被中断: ${newProgress.toFixed(2)}%`);
      }
    });
    
    setCurrentProgress(newProgress);
  }, [swiperIndex, currentProgress]);
  
  // 重置进度
  const resetProgress = () => {
    console.log('🔄 重置进度条到0%');
    progressAnimation.setValue(0);
    setCurrentProgress(0);
    setSwiperIndex(0);
    setIsReviewComplete(false);
  };
  
  // 设置完成状态
  const setComplete = () => {
    console.log('🏁 设置复习完成状态');
    setIsReviewComplete(true);
    // 确保进度条立即设置为100%
    progressAnimation.setValue(100);
    setCurrentProgress(100);
  };
  
  // 移动到下一个单词
  const moveToNextWord = (totalWords: number) => {
    console.log('🔄 moveToNextWord 开始 - current swiperIndex:', swiperIndex, 'words.length:', totalWords);
    if (swiperIndex < totalWords) {
      const newIndex = swiperIndex + 1;
      console.log('📱 移动到下一个单词 - new index:', newIndex);
      setSwiperIndex(newIndex);
      
      // 如果是最后一张卡，延迟显示完成页面
      if (newIndex === totalWords) {
        console.log('🎯 最后一张卡完成，准备显示完成页面');
        // 减少延迟时间，确保快速划卡时能及时显示完成页面
        setTimeout(() => {
          console.log('🏁 复习完成，计算最终统计数据');
          setComplete();
        }, 300);
      } else {
        console.log('📱 继续下一张卡');
      }
    } else {
      console.log('⚠️ swiperIndex 超出范围，无法移动到下一个单词');
    }
  };
  
  return {
    swiperIndex,
    setSwiperIndex,
    currentProgress,
    progressAnimation,
    isReviewComplete,
    resetProgress,
    setComplete,
    moveToNextWord
  };
}; 