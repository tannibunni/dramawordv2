import { useCallback } from 'react';
import { learningDataService } from '../../../services/learningDataService';
import { wrongWordsManager } from '../services/wrongWordsManager';
import { LearningRecord, updateWordReview, Word } from '../../../services/learningAlgorithm';
import { useVocabulary } from '../../../context/VocabularyContext';

interface ReviewWord {
  id: string;
  word: string;
  translation: string;
  phonetic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  show?: string;
  lastReviewed: string;
  reviewCount: number;
  incorrectCount?: number;
  consecutiveIncorrect?: number;
  consecutiveCorrect?: number;
}

interface ReviewActionsProps {
  words: ReviewWord[];
  swiperIndex: number;
  updateBackendWordProgress: (word: string, isCorrect: boolean) => Promise<number>;
  updateStats: (word: string, isCorrect: boolean, translation?: string) => void;
  moveToNextWord: (totalWords: number) => void;
  updateSession: (action: 'correct' | 'incorrect' | 'skipped' | 'collected') => void;
  onReviewComplete?: () => void;
}

export const useReviewActions = ({
  words,
  swiperIndex,
  updateBackendWordProgress,
  updateStats,
  moveToNextWord,
  updateSession,
  onReviewComplete
}: ReviewActionsProps) => {
  const { updateWord } = useVocabulary();

  // 将 ReviewWord 转换为 Word 类型的适配器函数
  const convertReviewWordToWord = useCallback((reviewWord: ReviewWord): Word => {
    return {
      id: reviewWord.id,
      word: reviewWord.word,
      definitions: [reviewWord.translation],
      phonetic: reviewWord.phonetic,
      sourceShow: reviewWord.show ? { type: 'show' as const, id: reviewWord.show } : undefined,
      collectedAt: reviewWord.lastReviewed,
      reviewStage: reviewWord.reviewCount,
      nextReviewAt: reviewWord.lastReviewed,
      reviewHistory: [],
    };
  }, []);

  // 处理左滑操作（忘记）
  const handleSwipeLeft = useCallback(async (word: string) => {
    console.log(`🔄 handleSwipeLeft 开始处理: ${word}, swiperIndex: ${swiperIndex}`);
    
    // 1. 先用 updateWordReview 处理业务逻辑
    const wordObj = convertReviewWordToWord(words[swiperIndex]);
    const updatedWord = updateWordReview(wordObj, false);
    console.log(`📝 updateWordReview 完成: ${word}, 更新结果:`, updatedWord);
    
    try {
      // 2. 更新本地学习记录
      console.log(`💾 开始更新本地学习记录: ${word}`);
      await learningDataService.updateLearningRecord(
        updatedWord.word,
        word,
        false // 不正确
      );
      console.log(`✅ 本地学习记录更新成功: ${word}`);
      
      // 3. 直接更新 vocabulary context，确保错词卡能立即看到更新
      const currentWord = words[swiperIndex];
      if (currentWord) {
        const updatedWordData = {
          incorrectCount: (currentWord.incorrectCount || 0) + 1,
          consecutiveIncorrect: (currentWord.consecutiveIncorrect || 0) + 1,
          consecutiveCorrect: 0 // 答错时重置连续正确次数
        };
        
        updateWord(word, updatedWordData);
        console.log('✅ 已更新 vocabulary context，错词数据已同步');
        
        // 4. 实时添加到错词集合管理器
        const wordDataForWrongWords = {
          ...currentWord,
          ...updatedWordData
        };
        
        const added = wrongWordsManager.addWrongWord(word, wordDataForWrongWords);
        if (added) {
          console.log('✅ 错词已实时添加到错词集合:', word);
          console.log('📊 当前错词总数:', wrongWordsManager.getWrongWordsCount());
          
          // 立即保存错词集合到本地存储
          wrongWordsManager.saveToStorage().then(() => {
            console.log('✅ 错词集合已保存到本地存储');
          }).catch(error => {
            console.error('❌ 保存错词集合失败:', error);
          });
        } else {
          console.log('ℹ️ 错词已存在于错词集合中:', word);
        }
      }
      
      // 5. 立即更新后端用户词汇表
      console.log(`🌐 开始更新后端用户词汇表: ${word}, isCorrect: false`);
      const xpGained = await updateBackendWordProgress(word, false);
      console.log(`✅ 后端用户词汇表更新成功: ${word}, 获得经验值: ${xpGained}`);
      
      // 6. 更新统计
      console.log(`📊 更新统计 - 忘记单词: ${word}`);
      updateStats(word, false);
    } catch (error) {
      console.error('❌ 更新学习记录失败:', error);
      // 即使出错也要更新统计
      console.log(`📊 更新统计 - 忘记单词: ${word} (出错后)`);
      updateStats(word, false);
    }
    
    // 获取当前单词的释义
    const currentWord = words[swiperIndex];
    const translation = currentWord?.translation || '';
    updateSession('incorrect');
    
    // 检查是否是最后一张卡片
    const isLastCard = swiperIndex === words.length - 1;
    console.log(`🔍 检查是否是最后一张卡片: swiperIndex=${swiperIndex}, words.length=${words.length}, isLastCard=${isLastCard}`);
    
    if (isLastCard && onReviewComplete) {
      console.log('🎯 最后一张卡片，直接调用完成处理函数');
      // 延迟一点时间确保统计数据已更新
      setTimeout(() => {
        onReviewComplete();
      }, 100);
    } else {
      moveToNextWord(words.length);
    }
  }, [words, swiperIndex, convertReviewWordToWord, updateBackendWordProgress, updateStats, updateSession, moveToNextWord, updateWord]);

  // 处理右滑操作（记住）
  const handleSwipeRight = useCallback(async (word: string) => {
    console.log(`🔄 handleSwipeRight 开始处理: ${word}, swiperIndex: ${swiperIndex}`);
    
    // 1. 先用 updateWordReview 处理业务逻辑
    const wordObj = convertReviewWordToWord(words[swiperIndex]);
    const updatedWord = updateWordReview(wordObj, true);
    console.log(`📝 updateWordReview 完成: ${word}, 更新结果:`, updatedWord);
    
    try {
      // 2. 更新本地学习记录
      console.log(`💾 开始更新本地学习记录: ${word}`);
      await learningDataService.updateLearningRecord(
        updatedWord.word,
        word,
        true // 正确
      );
      console.log(`✅ 本地学习记录更新成功: ${word}`);
      
      // 3. 直接更新 vocabulary context，确保错词卡能立即看到更新
      const currentWord = words[swiperIndex];
      if (currentWord) {
        const updatedWordData = {
          incorrectCount: currentWord.incorrectCount || 0,
          consecutiveIncorrect: 0, // 答对时重置连续错误次数
          consecutiveCorrect: (currentWord.consecutiveCorrect || 0) + 1
        };
        
        updateWord(word, updatedWordData);
        console.log('✅ 已更新 vocabulary context，正确答题数据已同步');
        
        // 4. 更新错词集合管理器
        const wordDataForWrongWords = {
          ...currentWord,
          ...updatedWordData
        };
        
        console.log('🔧 ReviewScreen: 更新错词集合中的单词:', word, wordDataForWrongWords);
        wrongWordsManager.updateWrongWord(word, true, wordDataForWrongWords);
        console.log('🔄 已更新错词集合中的单词状态:', word);
        
        // 检查是否需要从错词集合移除（连续答对3次）
        const wordInfo = wrongWordsManager.getWrongWordInfo(word);
        console.log('🔧 ReviewScreen: 错词信息检查:', word, wordInfo);
        if (wordInfo && wordInfo.consecutiveCorrect >= 3) {
          console.log('🎉 单词连续答对3次，从错词集合移除:', word);
        }
      }
      
      // 5. 立即更新后端用户词汇表
      console.log(`🌐 开始更新后端用户词汇表: ${word}, isCorrect: true`);
      const xpGained = await updateBackendWordProgress(word, true);
      console.log(`✅ 后端用户词汇表更新成功: ${word}, 获得经验值: ${xpGained}`);
      
      // 6. 更新统计
      console.log(`📊 更新统计 - 记住单词: ${word}`);
      updateStats(word, true);
    } catch (error) {
      console.error('❌ 更新学习记录失败:', error);
      // 即使出错也要更新统计
      console.log(`📊 更新统计 - 记住单词: ${word} (出错后)`);
      updateStats(word, true);
    }
    
    // 获取当前单词的释义
    const currentWord = words[swiperIndex];
    const translation = currentWord?.translation || '';
    updateSession('correct');
    
    // 检查是否是最后一张卡片
    const isLastCard = swiperIndex === words.length - 1;
    console.log(`🔍 检查是否是最后一张卡片: swiperIndex=${swiperIndex}, words.length=${words.length}, isLastCard=${isLastCard}`);
    
    if (isLastCard && onReviewComplete) {
      console.log('🎯 最后一张卡片，直接调用完成处理函数');
      // 延迟一点时间确保统计数据已更新
      setTimeout(() => {
        onReviewComplete();
      }, 100);
    } else {
      moveToNextWord(words.length);
    }
  }, [words, swiperIndex, convertReviewWordToWord, updateBackendWordProgress, updateStats, updateSession, moveToNextWord, updateWord]);

  // 处理下滑操作（跳过）
  const handleSwipeDown = useCallback(async (word: string) => {
    try {
      // 更新学习记录
      await learningDataService.updateLearningRecord(
        words[swiperIndex].word,
        word,
        false // 跳过视为不正确
      );
      
      // 更新后端用户词汇表
      await updateBackendWordProgress(word, false);
    } catch (error) {
      console.error('更新学习记录失败:', error);
    }
    
    updateSession('skipped');
    moveToNextWord(words.length);
  }, [words, swiperIndex, updateBackendWordProgress, updateSession, moveToNextWord]);

  return {
    handleSwipeLeft,
    handleSwipeRight,
    handleSwipeDown
  };
}; 