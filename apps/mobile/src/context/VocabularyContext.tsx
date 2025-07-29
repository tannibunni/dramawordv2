import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WordData } from '../components/cards/WordCard';
import { Show } from './ShowListContext';
import { wordService } from '../services/wordService';
import { API_BASE_URL } from '../constants/config';

export interface WordWithSource extends WordData {
  sourceShow?: Show;
  collectedAt: string;
  // 学习进度字段
  mastery?: number;
  reviewCount?: number;
  correctCount?: number;
  incorrectCount?: number;
  consecutiveCorrect?: number;
  consecutiveIncorrect?: number;
  lastReviewDate?: string;
  nextReviewDate?: string;
  interval?: number;
  easeFactor?: number;
  totalStudyTime?: number;
  averageResponseTime?: number;
  confidence?: number;
  notes?: string;
  tags?: string[];
}

interface VocabularyContextType {
  vocabulary: WordWithSource[];
  addWord: (word: WordData, sourceShow?: Show) => void;
  removeWord: (word: string, sourceShowId?: number) => void;
  updateWord: (word: string, data: Partial<WordWithSource>) => void;
  clearVocabulary: () => Promise<void>;
  isWordInShow: (word: string, showId?: number) => boolean;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

export const useVocabulary = () => {
  const ctx = useContext(VocabularyContext);
  if (!ctx) throw new Error('useVocabulary must be used within VocabularyProvider');
  return ctx;
};

async function getUserToken() {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch {
    return null;
  }
}

async function getUserId() {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) return JSON.parse(userData).id;
    return null;
  } catch {
    return null;
  }
}

const VOCABULARY_STORAGE_KEY = 'user_vocabulary';

export const VocabularyProvider = ({ children }: { children: ReactNode }) => {
  const [vocabulary, setVocabulary] = useState<WordWithSource[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 加载本地存储的词汇数据
  useEffect(() => {
    loadVocabularyFromStorage();
  }, []);

  // 同步后端学习进度数据
  useEffect(() => {
    if (isLoaded && vocabulary.length > 0) {
      syncLearningProgress();
    }
  }, [isLoaded, vocabulary.length]);

  // 当词汇数据变化时保存到本地存储
  useEffect(() => {
    if (isLoaded) {
      saveVocabularyToStorage();
    }
  }, [vocabulary, isLoaded]);

  const loadVocabularyFromStorage = async () => {
    try {
      const storedData = await AsyncStorage.getItem(VOCABULARY_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setVocabulary(parsedData);
        console.log('📚 从本地存储加载词汇数据:', parsedData.length, '个单词');
      } else {
        // 如果没有本地数据，初始化为空数组
        console.log('📚 本地存储中没有词汇数据，初始化为空列表');
        setVocabulary([]);
      }
    } catch (error) {
      console.error('❌ 加载词汇数据失败:', error);
      setVocabulary([]);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveVocabularyToStorage = async () => {
    try {
      await AsyncStorage.setItem(VOCABULARY_STORAGE_KEY, JSON.stringify(vocabulary));
      console.log('💾 保存词汇数据到本地存储:', vocabulary.length, '个单词');
    } catch (error) {
      console.error('❌ 保存词汇数据失败:', error);
    }
  };

  const syncLearningProgress = async () => {
    try {
      const userId = await getUserId();
      if (!userId) {
        console.log('⚠️ 用户未登录，跳过学习进度同步');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/words/user/vocabulary?userId=${userId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // 将后端数据与本地数据合并
          setVocabulary(prev => {
            const updatedVocabulary = prev.map(localWord => {
              const backendWord = result.data.find((bw: any) => bw.word === localWord.word);
              if (backendWord) {
                return {
                  ...localWord,
                  mastery: backendWord.mastery || 0,
                  reviewCount: backendWord.reviewCount || 0,
                  correctCount: backendWord.correctCount || 0,
                  incorrectCount: backendWord.incorrectCount || 0,
                  consecutiveCorrect: backendWord.consecutiveCorrect || 0,
                  consecutiveIncorrect: backendWord.consecutiveIncorrect || 0,
                  lastReviewDate: backendWord.lastReviewDate,
                  nextReviewDate: backendWord.nextReviewDate,
                  interval: backendWord.interval || 24,
                  easeFactor: backendWord.easeFactor || 2.5,
                  totalStudyTime: backendWord.totalStudyTime || 0,
                  averageResponseTime: backendWord.averageResponseTime || 0,
                  confidence: backendWord.confidence || 1,
                  notes: backendWord.notes || '',
                  tags: backendWord.tags || []
                };
              }
              return localWord;
            });
            console.log('🔄 学习进度同步完成，更新了', updatedVocabulary.length, '个单词');
            return updatedVocabulary;
          });
        }
      }
    } catch (error) {
      console.error('❌ 同步学习进度失败:', error);
    }
  };

  const addWord = (word: WordData, sourceShow?: Show) => {
    setVocabulary(prev => {
      // 检查是否已经存在相同的单词和剧集组合
      const existingWord = prev.find(w => 
        w.word === word.word && 
        w.sourceShow?.id === sourceShow?.id
      );
      
      if (existingWord) {
        console.log('⚠️ 单词已存在于该剧集中:', word.word, '剧集:', sourceShow?.name);
        return prev;
      }
      // --- 补全 type 字段 ---
      let fixedSourceShow = sourceShow;
      if (sourceShow && !sourceShow.type) {
        // 这里假设 id 为数字时为 show，否则为 wordbook，可根据实际业务调整
        fixedSourceShow = { ...sourceShow, type: typeof sourceShow.id === 'number' ? 'show' : 'wordbook' };
      }
      // 新增：language 字段
      const language = (word as any).language || 'en';
      const newWord = { ...word, sourceShow: fixedSourceShow, collectedAt: new Date().toISOString(), language };
      // 云端同步
      (async () => {
        const token = await getUserToken();
        const userId = await getUserId();
        if (token && userId) {
          try {
            await fetch(`${API_BASE_URL}/words/user/vocabulary`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ userId, word: word.word, sourceShow, language }),
            });
            console.log('✅ 云端词汇本已同步');
          } catch (e) {
            console.error('❌ 云端词汇本同步失败:', e);
          }
        }
      })();
      console.log('➕ 添加新单词:', newWord.word, '来源剧集:', sourceShow?.name, '来源ID:', sourceShow?.id);
      console.log('➕ 新单词完整数据:', newWord);
      return [...prev, newWord];
    });
  };

  const removeWord = (word: string, sourceShowId?: number) => {
    setVocabulary(prev => {
      const filtered = prev.filter(w => {
        // 如果提供了 sourceShowId，则精确匹配单词和来源
        if (sourceShowId !== undefined) {
          return !(w.word === word && w.sourceShow?.id === sourceShowId);
        }
        // 否则删除所有相同单词的记录（保持向后兼容）
        return w.word !== word;
      });
      // 云端同步
      (async () => {
        const token = await getUserToken();
        const userId = await getUserId();
        if (token && userId) {
          try {
            await fetch(`${API_BASE_URL}/words/user/vocabulary`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ userId, word }),
            });
            console.log('✅ 云端词汇本删除同步');
          } catch (e) {
            console.error('❌ 云端词汇本删除同步失败:', e);
          }
        }
      })();
      console.log('➖ 删除单词:', word, sourceShowId ? `来源ID: ${sourceShowId}` : '', '剩余单词数:', filtered.length);
      return filtered;
    });
  };

  const updateWord = (word: string, data: Partial<WordWithSource>) => {
    setVocabulary(prev => prev.map(w => w.word === word ? { ...w, ...data } : w));
  };

  const clearVocabulary = async () => {
    try {
      // 清空内存中的词汇数据
      setVocabulary([]);
      // 清空本地存储
      await AsyncStorage.removeItem(VOCABULARY_STORAGE_KEY);
      console.log('🗑️ 清空所有词汇数据（内存+本地存储）');
    } catch (error) {
      console.error('❌ 清空词汇数据失败:', error);
    }
  };

  const isWordInShow = (word: string, showId?: number) => {
    return vocabulary.some(w => w.word === word && w.sourceShow?.id === showId);
  };

  return (
    <VocabularyContext.Provider value={{ vocabulary, addWord, removeWord, updateWord, clearVocabulary, isWordInShow }}>
      {children}
    </VocabularyContext.Provider>
  );
}; 