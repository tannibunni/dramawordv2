import React, { createContext, useContext, useState, ReactNode } from 'react';
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
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

export const useVocabulary = () => {
  const ctx = useContext(VocabularyContext);
  if (!ctx) throw new Error('useVocabulary must be used within VocabularyProvider');
  return ctx;
};

export const VocabularyProvider = ({ children }: { children: ReactNode }) => {
  const [vocabulary, setVocabulary] = useState<WordWithSource[]>([
    // 添加一些测试数据
    {
      word: 'hello',
      phonetic: '/həˈloʊ/',
      definitions: [
        {
          partOfSpeech: 'interjection',
          definition: '你好，打招呼用语',
          examples: [
            { english: 'Hello, how are you?', chinese: '你好，你好吗？' },
            { english: 'Hello there!', chinese: '你好！' }
          ]
        }
      ],
      sourceShow: {
        id: 1,
        name: 'Friends',
        original_name: 'Friends',
        overview: 'A show about friends',
        first_air_date: '1994-09-22',
        last_air_date: '2004-05-06',
        type: 'Scripted',
        vote_average: 8.9,
        vote_count: 1000,
        popularity: 100,
        poster_path: '/test.jpg',
        backdrop_path: '/test.jpg',
        original_language: 'en',
        origin_country: ['US'],
        status: 'watching',
        wordCount: 0
      },
      collectedAt: new Date().toISOString()
    },
    {
      word: 'world',
      phonetic: '/wɜːld/',
      definitions: [
        {
          partOfSpeech: 'noun',
          definition: '世界，地球',
          examples: [
            { english: 'The world is beautiful.', chinese: '世界很美丽。' },
            { english: 'Around the world', chinese: '环游世界' }
          ]
        }
      ],
      sourceShow: {
        id: 1,
        name: 'Friends',
        original_name: 'Friends',
        overview: 'A show about friends',
        first_air_date: '1994-09-22',
        last_air_date: '2004-05-06',
        type: 'Scripted',
        vote_average: 8.9,
        vote_count: 1000,
        popularity: 100,
        poster_path: '/test.jpg',
        backdrop_path: '/test.jpg',
        original_language: 'en',
        origin_country: ['US'],
        status: 'watching',
        wordCount: 0
      },
      collectedAt: new Date().toISOString()
    }
  ]);

  const addWord = (word: WordData, sourceShow?: Show) => {
    setVocabulary(prev => {
      if (prev.some(w => w.word === word.word)) return prev;
      return [...prev, { ...word, sourceShow, collectedAt: new Date().toISOString() }];
    });
  };

  const removeWord = (word: string) => {
    setVocabulary(prev => prev.filter(w => w.word !== word));
  };

  const updateWord = (word: string, data: Partial<WordWithSource>) => {
    setVocabulary(prev => prev.map(w => w.word === word ? { ...w, ...data } : w));
  };

  const clearVocabulary = () => {
    setVocabulary([]);
  };

  // TODO: 可在此处与后端同步

  return (
    <VocabularyContext.Provider value={{ vocabulary, addWord, removeWord, updateWord, clearVocabulary }}>
      {children}
    </VocabularyContext.Provider>
  );
}; 