import AsyncStorage from '@react-native-async-storage/async-storage';
import { WordData } from '../components/cards/WordCard';

// 收藏的句子数据结构
export interface SavedSentence {
  id: string;
  originalText: string;        // 英文原文
  translation: string;         // 中文翻译
  phonetic?: string;          // 发音
  audioUrl?: string;          // 音频URL
  wordData?: WordData;        // 完整词卡数据
  createdAt: number;          // 收藏时间
  lastReviewed?: number;      // 最后复习时间
  reviewCount: number;        // 复习次数
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];            // 用户标签
  notes?: string;             // 用户笔记
  isDeleted?: boolean;        // 软删除标记
}

// 复习模式
export enum ReviewMode {
  RANDOM = 'random',           // 随机复习
  DIFFICULTY = 'difficulty',   // 按难度复习
  RECENT = 'recent',           // 最近收藏
  TAGS = 'tags'               // 按标签复习
}

// 句子收藏服务
class SavedSentencesService {
  private static SAVED_SENTENCES_KEY = 'user_saved_sentences';
  
  // 保存句子到收藏
  static async saveSentence(sentence: Omit<SavedSentence, 'id' | 'createdAt' | 'reviewCount'>): Promise<boolean> {
    try {
      const savedSentence: SavedSentence = {
        ...sentence,
        id: Date.now().toString(),
        createdAt: Date.now(),
        reviewCount: 0
      };
      
      const existing = await this.getSavedSentences();
      const exists = existing.some(s => s.originalText === sentence.originalText);
      
      if (!exists) {
        const updated = [savedSentence, ...existing];
        await AsyncStorage.setItem(this.SAVED_SENTENCES_KEY, JSON.stringify(updated));
        console.log('✅ 句子已保存到收藏:', savedSentence.originalText);
        return true;
      } else {
        console.log('⚠️ 句子已存在于收藏中:', sentence.originalText);
        return false;
      }
    } catch (error) {
      console.error('❌ 保存句子失败:', error);
      return false;
    }
  }
  
  // 获取所有收藏的句子
  static async getSavedSentences(): Promise<SavedSentence[]> {
    try {
      const data = await AsyncStorage.getItem(this.SAVED_SENTENCES_KEY);
      const sentences = data ? JSON.parse(data) : [];
      // 过滤掉已删除的句子
      return sentences.filter((s: SavedSentence) => !s.isDeleted);
    } catch (error) {
      console.error('❌ 获取收藏句子失败:', error);
      return [];
    }
  }
  
  // 删除句子
  static async removeSentence(id: string): Promise<boolean> {
    try {
      const sentences = await this.getSavedSentences();
      const updated = sentences.filter(s => s.id !== id);
      await AsyncStorage.setItem(this.SAVED_SENTENCES_KEY, JSON.stringify(updated));
      console.log('✅ 句子已从收藏中删除:', id);
      return true;
    } catch (error) {
      console.error('❌ 删除句子失败:', error);
      return false;
    }
  }
  
  // 更新复习记录
  static async updateReview(id: string): Promise<boolean> {
    try {
      const sentences = await this.getSavedSentences();
      const updated = sentences.map(s => 
        s.id === id 
          ? { ...s, lastReviewed: Date.now(), reviewCount: s.reviewCount + 1 }
          : s
      );
      await AsyncStorage.setItem(this.SAVED_SENTENCES_KEY, JSON.stringify(updated));
      console.log('✅ 复习记录已更新:', id);
      return true;
    } catch (error) {
      console.error('❌ 更新复习记录失败:', error);
      return false;
    }
  }
  
  // 更新句子信息
  static async updateSentence(id: string, updates: Partial<SavedSentence>): Promise<boolean> {
    try {
      const sentences = await this.getSavedSentences();
      const updated = sentences.map(s => 
        s.id === id ? { ...s, ...updates } : s
      );
      await AsyncStorage.setItem(this.SAVED_SENTENCES_KEY, JSON.stringify(updated));
      console.log('✅ 句子信息已更新:', id);
      return true;
    } catch (error) {
      console.error('❌ 更新句子信息失败:', error);
      return false;
    }
  }
  
  // 获取复习句子
  static async getReviewSentences(mode: ReviewMode, limit: number = 10): Promise<SavedSentence[]> {
    try {
      const sentences = await this.getSavedSentences();
      
      switch (mode) {
        case ReviewMode.RANDOM:
          return sentences.sort(() => Math.random() - 0.5).slice(0, limit);
        
        case ReviewMode.DIFFICULTY:
          return sentences
            .filter(s => s.difficulty === 'hard')
            .sort((a, b) => a.reviewCount - b.reviewCount)
            .slice(0, limit);
        
        case ReviewMode.RECENT:
          return sentences
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
        
        case ReviewMode.TAGS:
          // 按标签分组复习
          return sentences;
        
        default:
          return sentences.slice(0, limit);
      }
    } catch (error) {
      console.error('❌ 获取复习句子失败:', error);
      return [];
    }
  }
  
  // 检查句子是否已收藏
  static async isSentenceSaved(originalText: string): Promise<boolean> {
    try {
      const sentences = await this.getSavedSentences();
      return sentences.some(s => s.originalText === originalText);
    } catch (error) {
      console.error('❌ 检查句子收藏状态失败:', error);
      return false;
    }
  }
  
  // 清空所有收藏
  static async clearAllSentences(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.SAVED_SENTENCES_KEY);
      console.log('✅ 所有收藏句子已清空');
      return true;
    } catch (error) {
      console.error('❌ 清空收藏句子失败:', error);
      return false;
    }
  }
  
  // 获取收藏统计
  static async getStatistics(): Promise<{
    total: number;
    byDifficulty: { easy: number; medium: number; hard: number };
    byTags: { [key: string]: number };
    reviewStats: { totalReviews: number; averageReviews: number };
  }> {
    try {
      const sentences = await this.getSavedSentences();
      
      const byDifficulty = sentences.reduce((acc, s) => {
        const difficulty = s.difficulty || 'easy';
        acc[difficulty] = (acc[difficulty] || 0) + 1;
        return acc;
      }, { easy: 0, medium: 0, hard: 0 });
      
      const byTags = sentences.reduce((acc, s) => {
        if (s.tags) {
          s.tags.forEach(tag => {
            acc[tag] = (acc[tag] || 0) + 1;
          });
        }
        return acc;
      }, {} as { [key: string]: number });
      
      const totalReviews = sentences.reduce((sum, s) => sum + s.reviewCount, 0);
      const averageReviews = sentences.length > 0 ? totalReviews / sentences.length : 0;
      
      return {
        total: sentences.length,
        byDifficulty,
        byTags,
        reviewStats: {
          totalReviews,
          averageReviews: Math.round(averageReviews * 100) / 100
        }
      };
    } catch (error) {
      console.error('❌ 获取收藏统计失败:', error);
      return {
        total: 0,
        byDifficulty: { easy: 0, medium: 0, hard: 0 },
        byTags: {},
        reviewStats: { totalReviews: 0, averageReviews: 0 }
      };
    }
  }
}

export default SavedSentencesService;
