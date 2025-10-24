import { useState, useEffect, useCallback } from 'react';
import { useVocabulary } from '../../../context/VocabularyContext';
import { wrongWordsManager } from '../services/wrongWordsManager';
import { wordService } from '../../../services/wordService';
import dayjs from 'dayjs';

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
  wordData?: WordData; // 新增：完整的词卡数据缓存
}

interface ReviewLogicProps {
  type?: string;
  id?: number;
  reviewMode: 'smart' | 'all';
}

export const useReviewLogic = ({ type, id, reviewMode }: ReviewLogicProps) => {
  const [words, setWords] = useState<ReviewWord[]>([]);
  const [isEbbinghaus, setIsEbbinghaus] = useState(false);
  const [showEbbinghausTip, setShowEbbinghausTip] = useState(true);
  const { vocabulary } = useVocabulary();

  const MIN_REVIEW_BATCH = 10;

  // 获取复习批次
  const getReviewBatch = useCallback(async (words: any[], filterFn: (w: any) => boolean) => {
    const all = words.filter(filterFn);
    
    console.log(`🔍 getReviewBatch: 过滤后单词数量: ${all.length}, 类型: ${type}, 模式: ${reviewMode}`);
    
    // 去重：基于单词名称去重，保留第一个出现的
    const uniqueWords = all.reduce((acc: any[], word: any) => {
      const exists = acc.find(w => w.word === word.word);
      if (!exists) {
        acc.push(word);
      }
      return acc;
    }, []);
    
    console.log(`🔍 getReviewBatch: 去重后单词数量: ${uniqueWords.length}`);
    
    // 判断是否为挑战词卡（随机复习或错词挑战）
    const isChallengeMode = !type || (type === 'shuffle' || type === 'random' || type === 'wrong_words');
    
    if (isChallengeMode) {
      // 错词挑战：专门显示用户之前不记得的单词
      if (type === 'wrong_words') {
        console.log('🔍 ReviewScreen: 进入错词挑战模式');
        setIsEbbinghaus(false);
        
        // 调试：打印错词管理器状态
        wrongWordsManager.debugStatus();
        
        // 使用错词管理器获取错词列表
        const wrongWordsList = wrongWordsManager.getWrongWords();
        console.log('🔍 错词管理器返回错词列表:', wrongWordsList);
        
        if (wrongWordsList.length > 0) {
          // 从 vocabulary 中获取错词的完整信息
          const wrongWordsWithDetails = wrongWordsList
            .map(wordStr => vocabulary.find(w => w.word === wordStr))
            .filter(Boolean);
          
          console.log(`🔍 错词卡筛选结果: ${wrongWordsWithDetails.length} 个错词`);
          
          // 如果错词数量不足，补充一些需要复习的单词
          if (wrongWordsWithDetails.length < MIN_REVIEW_BATCH) {
            const remainingWords = vocabulary.filter(w => 
              !wrongWordsList.includes(w.word) && 
              ((w.incorrectCount || 0) > 0 || (w.consecutiveIncorrect || 0) > 0)
            );
            const additionalWords = remainingWords.slice(0, MIN_REVIEW_BATCH - wrongWordsWithDetails.length);
            wrongWordsWithDetails.push(...additionalWords);
            console.log(`🔍 补充了 ${additionalWords.length} 个需要复习的单词`);
          }
          
          return wrongWordsWithDetails.slice(0, MIN_REVIEW_BATCH);
        } else {
          console.log('🔍 错词管理器中没有错词，尝试从词汇表筛选');
          
          // 如果错词集合为空，从词汇表中筛选错词
          const vocabularyWrongWords = vocabulary.filter(w => 
            (w.incorrectCount || 0) > 0 || (w.consecutiveIncorrect || 0) > 0
          );
          
          console.log(`🔍 从词汇表筛选到 ${vocabularyWrongWords.length} 个错词`);
          
          if (vocabularyWrongWords.length > 0) {
            return vocabularyWrongWords.slice(0, MIN_REVIEW_BATCH);
          } else {
            console.log('🔍 词汇表中也没有错词，返回空数组');
            return [];
          }
        }
      }
      
      // 其他挑战词卡：使用艾宾斯记忆法
      if (reviewMode === 'all') {
        // 全部模式：显示所有单词，不限制时间
        setIsEbbinghaus(false);
        console.log(`🔍 全部模式: 返回 ${uniqueWords.length} 个单词`);
        return uniqueWords;
      }
      
      // 智能模式：优先显示需要复习的单词（艾宾斯记忆法推荐）
      const dueWords = uniqueWords.filter((w: any) => {
        const nextReview = w.nextReviewAt || w.nextReviewDate;
        return nextReview ? dayjs(nextReview).isBefore(dayjs()) : true;
      });
      
      console.log(`🔍 智能模式: 到期单词 ${dueWords.length} 个, 总单词 ${uniqueWords.length} 个`);
      
      // 如果到期的单词足够多，优先显示这些
      if (dueWords.length >= MIN_REVIEW_BATCH) {
        setIsEbbinghaus(true);
        return dueWords.slice(0, MIN_REVIEW_BATCH);
      }
      
      // 如果到期的单词不够，补充其他单词
      const otherWords = uniqueWords.filter((w: any) => {
        const nextReview = w.nextReviewAt || w.nextReviewDate;
        const isNotDue = nextReview ? dayjs(nextReview).isAfter(dayjs()) : true;
        const isNotInDueWords = !dueWords.some(dueWord => dueWord.word === w.word);
        return isNotDue && isNotInDueWords;
      });
      
      const mixedWords = [...dueWords, ...otherWords];
      setIsEbbinghaus(dueWords.length > 0);
      
      console.log(`🔍 智能模式: 到期单词 ${dueWords.length} 个, 其他单词 ${otherWords.length} 个, 混合单词 ${mixedWords.length} 个`);
      return mixedWords;
    } else {
      // 剧单/单词本：显示所有单词，不使用艾宾斯记忆法
      setIsEbbinghaus(false);
      console.log(`🔍 剧单/单词本模式: 返回 ${uniqueWords.length} 个单词`);
      return uniqueWords;
    }
  }, [type, reviewMode, vocabulary]);

  // 加载复习单词
  const loadReviewWords = useCallback(async () => {
    let filterFn: (w: any) => boolean = () => true;
    if (type === 'show' && id !== undefined) {
      filterFn = (w: any) => {
        const match = w.sourceShow?.type === type && String(w.sourceShow?.id) === String(id);
        return match;
      };
    } else if (type === 'wordbook' && id !== undefined) {
      filterFn = (w: any) => {
        const match = w.sourceShow?.type === type && String(w.sourceShow?.id) === String(id);
        return match;
      };
    }
    
    const batch = await getReviewBatch(vocabulary, filterFn);
    console.log('review batch:', batch);
    
    // 确保每个复习词都包含完整的wordData缓存
    const wordsWithData = batch.map((word: any) => ({
      ...word,
      // 如果word已经是WordWithSource，它已经包含了完整的WordData信息
      // 我们只需要确保wordData字段被正确设置
      wordData: word.wordData || {
        word: word.word,
        translation: word.translation,
        phonetic: word.phonetic,
        pinyin: word.pinyin,
        romaji: word.romaji,
        kana: word.kana,
        definitions: word.definitions,
        audioUrl: word.audioUrl,
        language: word.language,
        // 保留其他WordData字段
        ...word
      }
    }));
    
    console.log('words with data:', wordsWithData);
    setWords(wordsWithData);
  }, [vocabulary, type, id, getReviewBatch]);

  // 初始化错词管理器
  useEffect(() => {
    if (vocabulary && vocabulary.length > 0) {
      console.log('🔧 ReviewScreen: 初始化错词管理器');
      wrongWordsManager.initialize(vocabulary).then(() => {
        console.log('🔧 ReviewScreen: 错词管理器初始化完成');
        // 初始化完成后重新加载复习单词
        loadReviewWords();
      }).catch(error => {
        console.error('🔧 ReviewScreen: 错词管理器初始化失败:', error);
        // 即使初始化失败也要加载复习单词
        loadReviewWords();
      });
    }
  }, [vocabulary]);

  // 加载单词
  useEffect(() => {
    console.log('ReviewScreen: useEffect triggered - vocabulary length:', vocabulary.length, 'type:', type, 'id:', id);
    loadReviewWords().catch(error => {
      console.error('加载复习单词失败:', error);
    });
  }, [vocabulary, type, id, loadReviewWords]);

  return {
    words,
    isEbbinghaus,
    showEbbinghausTip,
    setShowEbbinghausTip,
    loadReviewWords,
    getReviewBatch
  };
}; 