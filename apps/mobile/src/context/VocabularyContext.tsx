import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WordData } from '../components/cards/WordCard';
import { Show } from './ShowListContext';

export interface WordWithSource extends WordData {
  sourceShow?: Show;
  collectedAt: string;
}

interface VocabularyContextType {
  vocabulary: WordWithSource[];
  addWord: (word: WordData, sourceShow?: Show) => void;
  removeWord: (word: string) => void;
  updateWord: (word: string, data: Partial<WordWithSource>) => void;
  clearVocabulary: () => void;
  isWordInShow: (word: string, showId?: number) => boolean;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

export const useVocabulary = () => {
  const ctx = useContext(VocabularyContext);
  if (!ctx) throw new Error('useVocabulary must be used within VocabularyProvider');
  return ctx;
};

const VOCABULARY_STORAGE_KEY = 'user_vocabulary';

export const VocabularyProvider = ({ children }: { children: ReactNode }) => {
  const [vocabulary, setVocabulary] = useState<WordWithSource[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 加载本地存储的词汇数据
  useEffect(() => {
    loadVocabularyFromStorage();
  }, []);

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
      
      const newWord = { ...word, sourceShow, collectedAt: new Date().toISOString() };
      console.log('➕ 添加新单词:', newWord.word, '来源剧集:', sourceShow?.name, '来源ID:', sourceShow?.id);
      console.log('➕ 新单词完整数据:', newWord);
      return [...prev, newWord];
    });
  };

  const removeWord = (word: string) => {
    setVocabulary(prev => {
      const filtered = prev.filter(w => w.word !== word);
      console.log('➖ 删除单词:', word, '剩余单词数:', filtered.length);
      return filtered;
    });
  };

  const updateWord = (word: string, data: Partial<WordWithSource>) => {
    setVocabulary(prev => prev.map(w => w.word === word ? { ...w, ...data } : w));
  };

  const clearVocabulary = () => {
    setVocabulary([]);
    console.log('🗑️ 清空所有词汇数据');
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