import AsyncStorage from '@react-native-async-storage/async-storage';
import Logger from '../utils/logger';

// 创建页面专用日志器
const logger = Logger.forPage('WrongWordsManager');

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
  action?: string;
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
    if (this.isInitialized) {
      console.log('🔧 WrongWordsManager: 已经初始化过，跳过重复初始化');
      return;
    }

    console.log('🔧 WrongWordsManager: 开始初始化错词集合');
    console.log('🔧 词汇表数量:', vocabulary.length);

    try {
      // 从本地存储加载错词集合
      console.log('🔧 尝试从本地存储加载数据...');
      await this.loadFromStorage();
      
      console.log('🔧 本地存储加载完成，当前错词数量:', this.collection.wrongWordsSet.size);
      
      // 如果没有本地数据，从词汇表初始化
      if (this.collection.wrongWordsSet.size === 0) {
        console.log('🔧 本地存储为空，从词汇表重新初始化');
        this.initializeFromVocabulary(vocabulary);
      } else {
        console.log('🔧 使用本地存储的数据，跳过词汇表初始化');
      }

      this.isInitialized = true;
      logger.log(`错词集合初始化完成，共 ${this.collection.wrongWordsSet.size} 个错词`, 'initialize');
    } catch (error) {
      console.error('🔧 WrongWordsManager: 初始化失败', error);
      logger.error('错词集合初始化失败', 'initialize');
      // 初始化失败时从词汇表重新构建
      this.initializeFromVocabulary(vocabulary);
    }
  }

  /**
   * 从词汇表初始化错词集合
   */
  private initializeFromVocabulary(vocabulary: any[]): void {
    console.log('🔧 WrongWordsManager: 开始从词汇表初始化错词集合');
    console.log('🔧 词汇表总数:', vocabulary.length);
    
    let wrongWordCount = 0;
    vocabulary.forEach(word => {
      if (this.checkIsWrongWord(word)) {
        wrongWordCount++;
        console.log(`🔧 发现错词: ${word.word}`, {
          incorrectCount: word.incorrectCount,
          consecutiveIncorrect: word.consecutiveIncorrect,
          consecutiveCorrect: word.consecutiveCorrect
        });
      }
    });
    
    console.log(`🔧 WrongWordsManager: 初始化完成，发现 ${wrongWordCount} 个错词`);
    
    // 将错词添加到集合中
    vocabulary.forEach(word => {
      if (this.checkIsWrongWord(word)) {
        this.addWrongWord(word.word, word);
      }
    });
    
    // 立即保存到本地存储
    this.saveToStorage().then(() => {
      console.log('🔧 WrongWordsManager: 错词集合已保存到本地存储');
    }).catch(error => {
      console.error('🔧 WrongWordsManager: 保存错词集合失败:', error);
    });
    
    logger.log(`从词汇表初始化错词集合，共 ${this.collection.wrongWordsSet.size} 个错词`, 'initializeFromVocabulary');
  }

  /**
   * 公共方法：判断是否为错词
   */
  public checkIsWrongWord(word: any): boolean {
    const consecutiveCorrect = word.consecutiveCorrect || 0;
    const incorrectCount = word.incorrectCount || 0;
    const consecutiveIncorrect = word.consecutiveIncorrect || 0;
    
    // 连续答对2次后从错词卡移除（降低阈值，让用户更容易从错词卡中移除）
    if (consecutiveCorrect >= 2) {
      console.log(`🔍 WrongWordsManager: ${word.word} 连续答对${consecutiveCorrect}次，不是错词`);
      return false;
    }
    
    // 有答错记录或连续答错
    const isWrong = incorrectCount > 0 || consecutiveIncorrect > 0;
    console.log(`🔍 WrongWordsManager: ${word.word} 检查结果:`, {
      consecutiveCorrect,
      incorrectCount,
      consecutiveIncorrect,
      isWrong
    });
    
    return isWrong;
  }

  /**
   * 添加错词到集合
   */
  addWrongWord(word: string, wordData: any): boolean {
    console.log(`🔧 WrongWordsManager: 尝试添加错词 ${word}`, {
      incorrectCount: wordData?.incorrectCount,
      consecutiveIncorrect: wordData?.consecutiveIncorrect,
      consecutiveCorrect: wordData?.consecutiveCorrect
    });
    
    if (this.collection.wrongWordsSet.has(word)) {
      console.log(`🔧 WrongWordsManager: ${word} 已存在于错词集合中`);
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

    console.log(`🔧 WrongWordsManager: 成功添加错词 ${word}，当前错词总数: ${this.collection.statistics.totalWrongWords}`);
    logger.log(`添加错词: ${word}，当前错词总数: ${this.collection.statistics.totalWrongWords}`, 'addWrongWord');
    
    // 保存到本地存储
    this.saveToStorage().catch(error => {
      console.error('🔧 WrongWordsManager: 保存错词到本地存储失败:', error);
    });
    
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

    logger.log(`移除错词: ${word}，原因: ${reason}，当前错词总数: ${this.collection.statistics.totalWrongWords}`, 'removeWrongWord');
    
    // 保存到本地存储
    this.saveToStorage().catch(error => {
      console.error('🔧 WrongWordsManager: 保存错词移除到本地存储失败:', error);
    });
    
    return true;
  }

  /**
   * 更新错词状态
   */
  updateWrongWord(word: string, isCorrect: boolean, wordData?: any): void {
    console.log(`🔧 WrongWordsManager: 更新错词状态 ${word}`, {
      isCorrect,
      wordData: wordData ? {
        incorrectCount: wordData.incorrectCount,
        consecutiveIncorrect: wordData.consecutiveIncorrect,
        consecutiveCorrect: wordData.consecutiveCorrect
      } : 'none'
    });
    
    const wordInfo = this.collection.wrongWordsMap.get(word);
    if (!wordInfo) {
      console.log(`🔧 WrongWordsManager: ${word} 不在错词集合中，无法更新`);
      return;
    }

    const oldValue = { ...wordInfo };

    if (isCorrect) {
      wordInfo.consecutiveCorrect++;
      wordInfo.consecutiveIncorrect = 0;
      
      console.log(`🔧 WrongWordsManager: ${word} 答对了，连续正确次数: ${wordInfo.consecutiveCorrect}`);
      
      // 连续答对2次后移除（降低阈值）
      if (wordInfo.consecutiveCorrect >= 2) {
        console.log(`🔧 WrongWordsManager: ${word} 连续答对2次，从错词集合移除`);
        this.removeWrongWord(word, 'consecutiveCorrect');
        return;
      }
    } else {
      wordInfo.incorrectCount++;
      wordInfo.consecutiveIncorrect++;
      wordInfo.consecutiveCorrect = 0;
      
      console.log(`🔧 WrongWordsManager: ${word} 答错了，错误次数: ${wordInfo.incorrectCount}，连续错误: ${wordInfo.consecutiveIncorrect}`);
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

    console.log(`🔧 WrongWordsManager: ${word} 更新完成，最终状态:`, {
      consecutiveCorrect: wordInfo.consecutiveCorrect,
      consecutiveIncorrect: wordInfo.consecutiveIncorrect,
      incorrectCount: wordInfo.incorrectCount
    });
    logger.log(`更新错词: ${word}，正确: ${isCorrect}，连续正确: ${wordInfo.consecutiveCorrect}`, 'updateWrongWord');
    
    // 保存到本地存储
    this.saveToStorage().catch(error => {
      console.error('🔧 WrongWordsManager: 保存错词更新到本地存储失败:', error);
    });
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
    const count = this.collection.statistics.totalWrongWords;
    console.log(`🔧 WrongWordsManager: 当前错词总数: ${count}`);
    return count;
  }

  /**
   * 检查单词是否为错词
   */


  /**
   * 清空错词集合
   */
  clearWrongWords(): void {
    const oldSize = this.collection.wrongWordsSet.size;
    this.collection.wrongWordsSet.clear();
    this.collection.wrongWordsMap.clear();
    this.collection.statistics.totalWrongWords = 0;
    this.collection.statistics.lastUpdated = new Date();

    logger.log(`清空错词集合，原数量: ${oldSize}`, 'clearWrongWords');
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
          logger.error(`错词事件回调执行失败: ${event}`, 'publishEvent');
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
      logger.log('错词集合已保存到本地存储', 'saveToStorage');
    } catch (error) {
      logger.error('保存错词集合到本地存储失败', 'saveToStorage');
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

        logger.log(`从本地存储加载错词集合，共 ${this.collection.wrongWordsSet.size} 个错词`, 'loadFromStorage');
      }
    } catch (error) {
      logger.error('从本地存储加载错词集合失败', 'loadFromStorage');
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

  /**
   * 调试方法：打印错词管理器的详细状态
   */
  debugStatus(): void {
    console.log('🔧 WrongWordsManager 调试信息:');
    console.log('  - 是否已初始化:', this.isInitialized);
    console.log('  - 错词总数:', this.collection.statistics.totalWrongWords);
    console.log('  - 错词列表:', Array.from(this.collection.wrongWordsSet));
    console.log('  - 统计信息:', this.collection.statistics);
    
    // 打印每个错词的详细信息
    this.collection.wrongWordsMap.forEach((info, word) => {
      console.log(`  - ${word}:`, {
        incorrectCount: info.incorrectCount,
        consecutiveIncorrect: info.consecutiveIncorrect,
        consecutiveCorrect: info.consecutiveCorrect,
        reviewCount: info.reviewCount,
        addedAt: info.addedAt,
        lastReviewed: info.lastReviewed
      });
    });
  }

  /**
   * 清除本地存储缓存
   */
  async clearStorage(): Promise<void> {
    try {
      await AsyncStorage.removeItem('wrong_words_collection');
      console.log('🔧 WrongWordsManager: 本地存储缓存已清除');
      logger.log('错词集合本地存储缓存已清除', 'clearStorage');
    } catch (error) {
      console.error('🔧 WrongWordsManager: 清除缓存失败', error);
      logger.error('清除错词集合缓存失败', 'clearStorage');
    }
  }

  /**
   * 重置错词集合（清除内存和存储）
   */
  async reset(): Promise<void> {
    console.log('🔧 WrongWordsManager: 开始重置错词集合');
    
    // 清除内存中的数据
    this.collection.wrongWordsSet.clear();
    this.collection.wrongWordsMap.clear();
    this.collection.statistics = {
      totalWrongWords: 0,
      newlyAdded: 0,
      recentlyRemoved: 0,
      lastUpdated: new Date()
    };
    
    // 清除本地存储
    await this.clearStorage();
    
    // 重置初始化状态
    this.isInitialized = false;
    
    console.log('🔧 WrongWordsManager: 错词集合重置完成');
    logger.log('错词集合已重置', 'reset');
  }
}

// 导出单例实例
export const wrongWordsManager = WrongWordsManager.getInstance(); 