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
  const [vocabulary, setVocabulary] = useState<WordWithSource[]>([]);

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