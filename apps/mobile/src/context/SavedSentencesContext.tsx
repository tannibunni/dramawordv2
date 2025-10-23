import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import SavedSentencesService, { SavedSentence, ReviewMode } from '../services/savedSentencesService';

interface SavedSentencesContextType {
  savedSentences: SavedSentence[];
  isLoading: boolean;
  saveSentence: (sentence: Omit<SavedSentence, 'id' | 'createdAt' | 'reviewCount'>) => Promise<boolean>;
  removeSentence: (id: string) => Promise<boolean>;
  updateReview: (id: string) => Promise<boolean>;
  updateSentence: (id: string, updates: Partial<SavedSentence>) => Promise<boolean>;
  getReviewSentences: (mode: ReviewMode, limit?: number) => Promise<SavedSentence[]>;
  isSentenceSaved: (originalText: string) => Promise<boolean>;
  clearAllSentences: () => Promise<boolean>;
  getStatistics: () => Promise<any>;
  refreshSentences: () => Promise<void>;
}

const SavedSentencesContext = createContext<SavedSentencesContextType | undefined>(undefined);

interface SavedSentencesProviderProps {
  children: ReactNode;
}

export const SavedSentencesProvider: React.FC<SavedSentencesProviderProps> = ({ children }) => {
  const [savedSentences, setSavedSentences] = useState<SavedSentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载收藏的句子
  const loadSavedSentences = async () => {
    try {
      setIsLoading(true);
      const sentences = await SavedSentencesService.getSavedSentences();
      setSavedSentences(sentences);
      console.log('✅ 已加载收藏句子:', sentences.length);
    } catch (error) {
      console.error('❌ 加载收藏句子失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadSavedSentences();
  }, []);

  // 保存句子
  const saveSentence = async (sentence: Omit<SavedSentence, 'id' | 'createdAt' | 'reviewCount'>): Promise<boolean> => {
    try {
      const success = await SavedSentencesService.saveSentence(sentence);
      if (success) {
        await loadSavedSentences(); // 重新加载数据
      }
      return success;
    } catch (error) {
      console.error('❌ 保存句子失败:', error);
      return false;
    }
  };

  // 删除句子
  const removeSentence = async (id: string): Promise<boolean> => {
    try {
      const success = await SavedSentencesService.removeSentence(id);
      if (success) {
        await loadSavedSentences(); // 重新加载数据
      }
      return success;
    } catch (error) {
      console.error('❌ 删除句子失败:', error);
      return false;
    }
  };

  // 更新复习记录
  const updateReview = async (id: string): Promise<boolean> => {
    try {
      const success = await SavedSentencesService.updateReview(id);
      if (success) {
        await loadSavedSentences(); // 重新加载数据
      }
      return success;
    } catch (error) {
      console.error('❌ 更新复习记录失败:', error);
      return false;
    }
  };

  // 更新句子信息
  const updateSentence = async (id: string, updates: Partial<SavedSentence>): Promise<boolean> => {
    try {
      const success = await SavedSentencesService.updateSentence(id, updates);
      if (success) {
        await loadSavedSentences(); // 重新加载数据
      }
      return success;
    } catch (error) {
      console.error('❌ 更新句子信息失败:', error);
      return false;
    }
  };

  // 获取复习句子
  const getReviewSentences = async (mode: ReviewMode, limit: number = 10): Promise<SavedSentence[]> => {
    try {
      return await SavedSentencesService.getReviewSentences(mode, limit);
    } catch (error) {
      console.error('❌ 获取复习句子失败:', error);
      return [];
    }
  };

  // 检查句子是否已收藏
  const isSentenceSaved = async (originalText: string): Promise<boolean> => {
    try {
      return await SavedSentencesService.isSentenceSaved(originalText);
    } catch (error) {
      console.error('❌ 检查句子收藏状态失败:', error);
      return false;
    }
  };

  // 清空所有收藏
  const clearAllSentences = async (): Promise<boolean> => {
    try {
      const success = await SavedSentencesService.clearAllSentences();
      if (success) {
        await loadSavedSentences(); // 重新加载数据
      }
      return success;
    } catch (error) {
      console.error('❌ 清空收藏句子失败:', error);
      return false;
    }
  };

  // 获取统计信息
  const getStatistics = async () => {
    try {
      return await SavedSentencesService.getStatistics();
    } catch (error) {
      console.error('❌ 获取收藏统计失败:', error);
      return {
        total: 0,
        byDifficulty: { easy: 0, medium: 0, hard: 0 },
        byTags: {},
        reviewStats: { totalReviews: 0, averageReviews: 0 }
      };
    }
  };

  // 刷新句子列表
  const refreshSentences = async (): Promise<void> => {
    await loadSavedSentences();
  };

  const value: SavedSentencesContextType = {
    savedSentences,
    isLoading,
    saveSentence,
    removeSentence,
    updateReview,
    updateSentence,
    getReviewSentences,
    isSentenceSaved,
    clearAllSentences,
    getStatistics,
    refreshSentences
  };

  return (
    <SavedSentencesContext.Provider value={value}>
      {children}
    </SavedSentencesContext.Provider>
  );
};

// Hook to use the context
export const useSavedSentences = (): SavedSentencesContextType => {
  const context = useContext(SavedSentencesContext);
  if (context === undefined) {
    throw new Error('useSavedSentences must be used within a SavedSentencesProvider');
  }
  return context;
};

export default SavedSentencesContext;
