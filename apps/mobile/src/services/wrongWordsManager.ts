import AsyncStorage from '@react-native-async-storage/async-storage';
import { vocabularyLogger } from '../utils/logger';

// 错词集合数据结构
export interface WrongWordsCollection {
  wrongWordsSet: Set<string>;
  wrongWordsMap: Map<string, WrongWordInfo>;
  statistics: WrongWordsStatistics;
}

// 错词详细信息
export interface WrongWordInfo {
  word: string;
  incorrectCount: number;
  consecutiveIncorrect: number;
  consecutiveCorrect: number;
  addedAt: Date;
  lastReviewed: Date;
  reviewCount: number;
}

// 统计信息
export interface WrongWordsStatistics {
  totalWrongWords: number;
  newlyAdded: number;
  recentlyRemoved: number;
  lastUpdated: Date;
}

// 错词事件类型
export type WrongWordsEvent = 'wordAdded' | 'wordRemoved' | 'wordUpdated' | 'collectionChanged';

// 错词事件数据
export interface WrongWordsEventData {
  word: string;
  timestamp: number;
  reason?: string;
  oldValue?: any;
  newValue?: any;
}

/**
 * 错词集合管理器
 * 负责错词的添加、移除、更新和查询
 */
export class WrongWordsManager {
  private static instance: WrongWordsManager;
  private collection: WrongWordsCollection;
  private eventListeners: Map<WrongWordsEvent, Function[]> = new Map();
  private isInitialized = false;

  private constructor() {
    this.collection = {
      wrongWordsSet: new Set(),
      wrongWordsMap: new Map(),
      statistics: {
        totalWrongWords: 0,
        newlyAdded: 0,
        recentlyRemoved: 0,
        lastUpdated: new Date()
      }
    };
  }

  static getInstance(): WrongWordsManager {
    if (!WrongWordsManager.instance) {
      WrongWordsManager.instance = new WrongWordsManager();
    }
    return WrongWordsManager.instance;
  }

  /**
   * 初始化错词集合
   */
  async initialize(vocabulary: any[]): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 从本地存储加载错词集合
      await this.loadFromStorage();
      
      // 如果没有本地数据，从词汇表初始化
      if (this.collection.wrongWordsSet.size === 0) {
        this.initializeFromVocabulary(vocabulary);
      }

      this.isInitialized = true;
      vocabularyLogger.info(`错词集合初始化完成，共 ${this.collection.wrongWordsSet.size} 个错词`);
    } catch (error) {
      vocabularyLogger.error('错词集合初始化失败', error);
      // 初始化失败时从词汇表重新构建
      this.initializeFromVocabulary(vocabulary);
    }
  }

  /**
   * 从词汇表初始化错词集合
   */
  private initializeFromVocabulary(vocabulary: any[]): void {
    vocabulary.forEach(word => {
      if (this.isWrongWord(word)) {
        this.addWrongWord(word.word, word);
      }
    });
    vocabularyLogger.info(`从词汇表初始化错词集合，共 ${this.collection.wrongWordsSet.size} 个错词`);
  }

  /**
   * 判断是否为错词
   */
  private isWrongWord(word: any): boolean {
    // 连续答对3次后从错词卡移除
    if ((word.consecutiveCorrect || 0) >= 3) {
      return false;
    }
    
    // 有答错记录或连续答错
    return (word.incorrectCount || 0) > 0 || (word.consecutiveIncorrect || 0) > 0;
  }

  /**
   * 添加错词到集合
   */
  addWrongWord(word: string, wordData: any): boolean {
    if (this.collection.wrongWordsSet.has(word)) {
      return false; // 已存在
    }

    const wrongWordInfo: WrongWordInfo = {
      word,
      incorrectCount: wordData.incorrectCount || 0,
      consecutiveIncorrect: wordData.consecutiveIncorrect || 0,
      consecutiveCorrect: wordData.consecutiveCorrect || 0,
      addedAt: new Date(),
      lastReviewed: new Date(),
      reviewCount: wordData.reviewCount || 0
    };

    this.collection.wrongWordsSet.add(word);
    this.collection.wrongWordsMap.set(word, wrongWordInfo);
    this.collection.statistics.totalWrongWords++;
    this.collection.statistics.newlyAdded++;
    this.collection.statistics.lastUpdated = new Date();

    // 发布事件
    this.publishEvent('wordAdded', { word, timestamp: Date.now() });
    this.publishEvent('collectionChanged', { 
      word, 
      action: 'added', 
      timestamp: Date.now() 
    });

    vocabularyLogger.info(`添加错词: ${word}，当前错词总数: ${this.collection.statistics.totalWrongWords}`);
    return true;
  }

  /**
   * 从错词集合移除
   */
  removeWrongWord(word: string, reason: string = 'manual'): boolean {
    if (!this.collection.wrongWordsSet.has(word)) {
      return false;
    }

    this.collection.wrongWordsSet.delete(word);
    this.collection.wrongWordsMap.delete(word);
    this.collection.statistics.totalWrongWords--;
    this.collection.statistics.recentlyRemoved++;
    this.collection.statistics.lastUpdated = new Date();

    // 发布事件
    this.publishEvent('wordRemoved', { 
      word, 
      reason, 
      timestamp: Date.now() 
    });
    this.publishEvent('collectionChanged', { 
      word, 
      action: 'removed', 
      reason, 
      timestamp: Date.now() 
    });

    vocabularyLogger.info(`移除错词: ${word}，原因: ${reason}，当前错词总数: ${this.collection.statistics.totalWrongWords}`);
    return true;
  }

  /**
   * 更新错词状态
   */
  updateWrongWord(word: string, isCorrect: boolean, wordData?: any): void {
    const wordInfo = this.collection.wrongWordsMap.get(word);
    if (!wordInfo) {
      return;
    }

    const oldValue = { ...wordInfo };

    if (isCorrect) {
      wordInfo.consecutiveCorrect++;
      wordInfo.consecutiveIncorrect = 0;
      
      // 连续答对3次后移除
      if (wordInfo.consecutiveCorrect >= 3) {
        this.removeWrongWord(word, 'consecutiveCorrect');
        return;
      }
    } else {
      wordInfo.incorrectCount++;
      wordInfo.consecutiveIncorrect++;
      wordInfo.consecutiveCorrect = 0;
    }

    wordInfo.lastReviewed = new Date();
    wordInfo.reviewCount++;

    // 更新统计数据
    if (wordData) {
      wordInfo.incorrectCount = wordData.incorrectCount || wordInfo.incorrectCount;
      wordInfo.consecutiveIncorrect = wordData.consecutiveIncorrect || wordInfo.consecutiveIncorrect;
      wordInfo.consecutiveCorrect = wordData.consecutiveCorrect || wordInfo.consecutiveCorrect;
    }

    this.collection.statistics.lastUpdated = new Date();

    // 发布事件
    this.publishEvent('wordUpdated', { 
      word, 
      oldValue, 
      newValue: wordInfo, 
      timestamp: Date.now() 
    });

    vocabularyLogger.debug(`更新错词: ${word}，正确: ${isCorrect}，连续正确: ${wordInfo.consecutiveCorrect}`);
  }

  /**
   * 获取错词列表
   */
  getWrongWords(): string[] {
    return Array.from(this.collection.wrongWordsSet);
  }

  /**
   * 获取错词详细信息
   */
  getWrongWordInfo(word: string): WrongWordInfo | undefined {
    return this.collection.wrongWordsMap.get(word);
  }

  /**
   * 获取统计信息
   */
  getStatistics(): WrongWordsStatistics {
    return { ...this.collection.statistics };
  }

  /**
   * 检查单词是否在错词集合中
   */
  hasWrongWord(word: string): boolean {
    return this.collection.wrongWordsSet.has(word);
  }

  /**
   * 获取错词数量
   */
  getWrongWordsCount(): number {
    return this.collection.statistics.totalWrongWords;
  }

  /**
   * 检查单词是否为错词
   */
  isWrongWord(word: any): boolean {
    // 连续答对3次后从错词卡移除
    if ((word.consecutiveCorrect || 0) >= 3) {
      return false;
    }
    
    // 有答错记录或连续答错
    return (word.incorrectCount || 0) > 0 || (word.consecutiveIncorrect || 0) > 0;
  }

  /**
   * 清空错词集合
   */
  clearWrongWords(): void {
    const oldSize = this.collection.wrongWordsSet.size;
    this.collection.wrongWordsSet.clear();
    this.collection.wrongWordsMap.clear();
    this.collection.statistics.totalWrongWords = 0;
    this.collection.statistics.lastUpdated = new Date();

    vocabularyLogger.info(`清空错词集合，原数量: ${oldSize}`);
  }

  /**
   * 订阅事件
   */
  subscribe(event: WrongWordsEvent, callback: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);

    // 返回取消订阅函数
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * 发布事件
   */
  private publishEvent(event: WrongWordsEvent, data: WrongWordsEventData): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          vocabularyLogger.error(`错词事件回调执行失败: ${event}`, error);
        }
      });
    }
  }

  /**
   * 保存到本地存储
   */
  async saveToStorage(): Promise<void> {
    try {
      const dataToSave = {
        wrongWordsSet: Array.from(this.collection.wrongWordsSet),
        wrongWordsMap: Array.from(this.collection.wrongWordsMap.entries()),
        statistics: this.collection.statistics,
        lastSaved: Date.now()
      };

      await AsyncStorage.setItem('wrong_words_collection', JSON.stringify(dataToSave));
      vocabularyLogger.debug('错词集合已保存到本地存储');
    } catch (error) {
      vocabularyLogger.error('保存错词集合到本地存储失败', error);
    }
  }

  /**
   * 从本地存储加载
   */
  async loadFromStorage(): Promise<void> {
    try {
      const storedData = await AsyncStorage.getItem('wrong_words_collection');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        this.collection.wrongWordsSet = new Set(parsedData.wrongWordsSet || []);
        this.collection.wrongWordsMap = new Map(parsedData.wrongWordsMap || []);
        this.collection.statistics = {
          ...parsedData.statistics,
          lastUpdated: new Date(parsedData.statistics?.lastUpdated || Date.now())
        };

        vocabularyLogger.info(`从本地存储加载错词集合，共 ${this.collection.wrongWordsSet.size} 个错词`);
      }
    } catch (error) {
      vocabularyLogger.error('从本地存储加载错词集合失败', error);
    }
  }

  /**
   * 导出错词集合数据（用于调试）
   */
  exportData(): any {
    return {
      wrongWords: this.getWrongWords(),
      statistics: this.getStatistics(),
      totalWords: this.collection.wrongWordsSet.size,
      isInitialized: this.isInitialized
    };
  }
}

// 导出单例实例
export const wrongWordsManager = WrongWordsManager.getInstance(); 