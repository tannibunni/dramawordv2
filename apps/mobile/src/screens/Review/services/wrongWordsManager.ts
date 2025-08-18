import AsyncStorage from '@react-native-async-storage/async-storage';
import Logger from '../../../utils/logger';
import { experienceManager } from './experienceManager';

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

// 错词数量状态接口
export interface WrongWordsCountState {
  wrongWordsCount: number;
  isLoading: boolean;
  lastUpdated: number;
}

// 错词数量更新回调
export type WrongWordsCountCallback = (count: number) => void;

/**
 * 错词集合管理器
 * 负责错词的添加、移除、更新和查询
 */
export class WrongWordsManager {
  private static instance: WrongWordsManager;
  private collection: WrongWordsCollection;
  private eventListeners: Map<WrongWordsEvent, Function[]> = new Map();
  private isInitialized = false;

  // 错词数量状态管理
  private wrongWordsCountState: WrongWordsCountState = {
    wrongWordsCount: 0,
    isLoading: false,
    lastUpdated: Date.now()
  };

  private countCallbacks: WrongWordsCountCallback[] = [];

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
      return;
    }

    try {
      this.isInitialized = true;
      
      // 从词汇表初始化错词集合
      await this.initializeFromVocabulary(vocabulary);
      
      // 保存到本地存储
      await this.saveToStorage();
      
    } catch (error) {
      console.error('🔧 WrongWordsManager: 初始化失败', error);
      this.isInitialized = false;
    }
  }

  /**
   * 从词汇表初始化错词集合
   */
  private async initializeFromVocabulary(vocabulary: any[]): Promise<void> {
    // 从词汇表初始化错词集合
    const wrongWords = vocabulary.filter(word => 
      word.incorrectCount > 0 || word.incorrectCount > 0
    );
    
    for (const word of wrongWords) {
      // 直接添加到集合中
      this.collection.wrongWordsSet.add(word.word);
      this.collection.wrongWordsMap.set(word.word, {
        word: word.word,
        incorrectCount: word.incorrectCount || 0,
        consecutiveIncorrect: word.consecutiveIncorrect || 0,
        consecutiveCorrect: word.consecutiveCorrect || 0,
        addedAt: new Date(),
        lastReviewed: new Date(),
        reviewCount: 0
      });
    }
    
    // 更新统计信息
    this.collection.statistics.totalWrongWords = this.collection.wrongWordsSet.size;
    this.collection.statistics.lastUpdated = new Date();
    
    // 保存到本地存储
    await this.saveToStorage();
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
      return false;
    }
    
    // 有答错记录或连续答错
    const isWrong = incorrectCount > 0 || consecutiveIncorrect > 0;
    
    return isWrong;
  }

  /**
   * 添加错词到集合
   */
  public addWrongWord(word: string, wordData: any): boolean {
    try {
      // 检查是否已存在
      if (this.collection.wrongWordsSet.has(word)) {
        return false;
      }
      
      // 添加到错词集合
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

      // 保存到本地存储
      this.saveToStorage();
      
      return true;
    } catch (error) {
      console.error('🔧 WrongWordsManager: 添加错词失败:', error);
      return false;
    }
  }

  /**
   * 从错词集合移除
   */
  public removeWrongWord(word: string, reason: string = 'manual'): boolean {
    if (!this.collection.wrongWordsSet.has(word)) {
      return false;
    }

    this.collection.wrongWordsSet.delete(word);
    this.collection.wrongWordsMap.delete(word);
    this.collection.statistics.totalWrongWords--;
    this.collection.statistics.recentlyRemoved++;
    this.collection.statistics.lastUpdated = new Date();

    // 保存到本地存储
    this.saveToStorage();
    
    return true;
  }

  /**
   * 更新错词状态
   */
  public updateWrongWord(word: string, isCorrect: boolean, wordData?: any): void {
    try {
      const wordInfo = this.collection.wrongWordsMap.get(word);
      if (!wordInfo) {
        return;
      }
      
      // 更新错词状态
      if (isCorrect) {
        wordInfo.consecutiveCorrect = (wordInfo.consecutiveCorrect || 0) + 1;
        wordInfo.consecutiveIncorrect = 0;
        
        // 连续答对2次，从错词集合移除
        if (wordInfo.consecutiveCorrect >= 2) {
          this.removeWrongWord(word, 'consecutiveCorrect');
          return;
        }
      } else {
        wordInfo.incorrectCount = (wordInfo.incorrectCount || 0) + 1;
        wordInfo.consecutiveIncorrect = (wordInfo.consecutiveIncorrect || 0) + 1;
        wordInfo.consecutiveCorrect = 0;
      }
      
      wordInfo.lastReviewed = new Date();
      wordInfo.reviewCount++;

      // 保存到本地存储
      this.saveToStorage();
      
    } catch (error) {
      console.error('🔧 WrongWordsManager: 更新错词状态失败:', error);
    }
  }

  /**
   * 获取错词列表
   */
  public getWrongWords(): string[] {
    return Array.from(this.collection.wrongWordsSet);
  }

  /**
   * 获取错词详细信息
   */
  public getWrongWordInfo(word: string): WrongWordInfo | undefined {
    return this.collection.wrongWordsMap.get(word);
  }

  /**
   * 获取统计信息
   */
  public getStatistics(): WrongWordsStatistics {
    return { ...this.collection.statistics };
  }

  /**
   * 检查单词是否在错词集合中
   */
  public hasWrongWord(word: string): boolean {
    return this.collection.wrongWordsSet.has(word);
  }

  /**
   * 获取错词数量
   */
  public getWrongWordsCount(): number {
    const count = this.collection.statistics.totalWrongWords;
    return count;
  }

  /**
   * 检查单词是否为错词
   */


  /**
   * 清空错词集合
   */
  public clearWrongWords(): void {
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
  public subscribe(event: WrongWordsEvent, callback: Function): () => void {
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
  public async saveToStorage(): Promise<void> {
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
  public async loadFromStorage(): Promise<void> {
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
  public exportData(): any {
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
  public debugStatus(): void {
    console.log('�� WrongWordsManager 调试信息:');
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
  public async clearStorage(): Promise<void> {
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
  public async reset(): Promise<void> {
    try {
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
      
    } catch (error) {
      console.error('🔧 WrongWordsManager: 重置失败', error);
    }
  }

  // ==================== 错词数量管理 ====================
  
  // 注册错词数量更新回调
  public registerCountCallback(callback: WrongWordsCountCallback): () => void {
    this.countCallbacks.push(callback);
    return () => {
      const index = this.countCallbacks.indexOf(callback);
      if (index > -1) {
        this.countCallbacks.splice(index, 1);
      }
    };
  }

  // 更新错词数量状态
  private updateWrongWordsCount(count: number): void {
    this.wrongWordsCountState = {
      wrongWordsCount: count,
      isLoading: false,
      lastUpdated: Date.now()
    };
    
    // 通知所有回调
    this.countCallbacks.forEach(callback => {
      try {
        callback(count);
      } catch (error) {
        console.error('🔧 WrongWordsManager: 错词数量回调执行失败:', error);
      }
    });
  }

  // 获取当前错词数量状态
  public getWrongWordsCountState(): WrongWordsCountState {
    return { ...this.wrongWordsCountState };
  }

  // 计算错词数量（从词汇表）
  public async calculateWrongWordsCount(vocabulary: any[]): Promise<number> {
    try {
      if (!vocabulary || vocabulary.length === 0) {
        return 0;
      }
      
      // 计算错词数量
      const count = vocabulary.filter(word => 
        word.incorrectCount > 0 || word.consecutiveIncorrect > 0
      ).length;
      
      return count;
    } catch (error) {
      console.error('🔧 WrongWordsManager: 计算错词数量失败', error);
      return 0;
    }
  }

  // 刷新错词数量
  public async refreshWrongWordsCount(vocabulary: any[]): Promise<number> {
    try {
      if (!this.isInitialized) {
        await this.initialize(vocabulary);
      }
      
      const count = await this.calculateWrongWordsCount(vocabulary);
      
      return count;
    } catch (error) {
      console.error('🔧 WrongWordsManager: 刷新错词数量失败', error);
      return 0;
    }
  }

  // 自动管理错词数量（整合初始化、计算、更新等功能）
  public async autoManageWrongWordsCount(
    vocabulary: any[],
    onCountUpdate?: (count: number) => void
  ): Promise<void> {
    try {
      // 1. 初始化错词管理器
      await this.initialize(vocabulary);
      
      // 2. 计算错词数量
      const count = await this.calculateWrongWordsCount(vocabulary);
      
      // 3. 回调通知
      if (onCountUpdate) {
        onCountUpdate(count);
      }
      
    } catch (error) {
      console.error('🔧 WrongWordsManager: 自动管理错词数量失败', error);
      if (onCountUpdate) {
        onCountUpdate(0);
      }
    }
  }

  // ==================== 页面错词数量管理 ====================
  
  // 统一管理页面错词数量
  public async managePageWrongWordsCount(
    vocabulary: any[],
    onCountUpdate?: (count: number) => void
  ): Promise<{
    wrongWordsCount: number;
    challengeCardConfig: {
      key: string;
      icon: string;
      title: string;
      subtitle: string;
      experienceGained: number;
      count: number;
      hasRefreshButton: boolean;
    };
    unsubscribe: () => void;
  }> {
    console.log('[wrongWordsManager] 开始统一管理页面错词数量');
    
    // 1. 自动管理错词数量
    await this.autoManageWrongWordsCount(vocabulary, (count) => {
      console.log('[wrongWordsManager] 错词数量更新:', count);
      
      // 回调通知
      if (onCountUpdate) {
        onCountUpdate(count);
      }
    });
    
    // 2. 获取当前错词数量
    const currentCount = this.getWrongWordsCount();
    
    // 3. 构建挑战卡片配置
    const challengeCardConfig = {
      key: 'wrong_words',
      icon: 'alert-circle',
      title: 'wrong_words_challenge',
      subtitle: 'wrong_words_count',
      experienceGained: experienceManager.getWrongWordChallengeExperience(),
      count: currentCount,
      hasRefreshButton: true
    };
    
    // 4. 返回结果和取消订阅函数
    return {
      wrongWordsCount: currentCount,
      challengeCardConfig,
      unsubscribe: () => {
        // 清理回调
        this.countCallbacks = [];
      }
    };
  }

  // 获取错词挑战卡片配置
  public getWrongWordsChallengeConfig(wrongWordsCount: number): {
    key: string;
    icon: string;
    title: string;
    subtitle: string;
    experienceGained: number;
    count: number;
    hasRefreshButton: boolean;
  } {
    return {
      key: 'wrong_words',
      icon: 'alert-circle',
      title: 'wrong_words_challenge',
      subtitle: 'wrong_words_count',
      experienceGained: experienceManager.getWrongWordChallengeExperience(),
      count: wrongWordsCount,
      hasRefreshButton: true
    };
  }

  // 页面组件错词数量Hook（简化版）
  public createPageWrongWordsHook(
    vocabulary: any[],
    onCountUpdate?: (count: number) => void
  ) {
    return {
      wrongWordsCount: this.getWrongWordsCount(),
      challengeCardConfig: this.getWrongWordsChallengeConfig(this.getWrongWordsCount()),
      initialize: () => this.managePageWrongWordsCount(vocabulary, onCountUpdate),
      refresh: () => this.refreshWrongWordsCount(vocabulary),
      unsubscribe: () => {
        this.countCallbacks = [];
      }
    };
  }
}

// 导出单例实例
export const wrongWordsManager = WrongWordsManager.getInstance(); 