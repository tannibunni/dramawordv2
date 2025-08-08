import { Show } from '../../../context/ShowListContext';
import { experienceManager } from './experienceManager';

// 数据管理服务
export class DataManagerService {
  private static instance: DataManagerService;

  private constructor() {}

  static getInstance(): DataManagerService {
    if (!DataManagerService.instance) {
      DataManagerService.instance = new DataManagerService();
    }
    return DataManagerService.instance;
  }

  // 分离剧集和单词本数据
  separateShowsAndWordbooks(shows: Show[]): {
    showItems: Show[];
    wordbookItems: Show[];
  } {
    const showItems = shows.filter(show => show.type !== 'wordbook');
    const wordbookItems = shows.filter(show => show.type === 'wordbook');
    
    return { showItems, wordbookItems };
  }

  // 获取剧集或单词本的单词数量
  getShowWords(vocabulary: any[], showId: number): any[] {
    return vocabulary.filter(word => {
      const sourceShowId = word.sourceShow?.id;
      return word.sourceShow && Number(sourceShowId) === Number(showId);
    });
  }

  // 计算剧集或单词本的单词数量
  getShowWordCount(vocabulary: any[], showId: number): number {
    return this.getShowWords(vocabulary, showId).length;
  }

  // 获取所有剧集和单词本的单词统计
  getAllShowsWordCounts(vocabulary: any[], shows: Show[]): Map<number, number> {
    const wordCounts = new Map<number, number>();
    
    shows.forEach(show => {
      const count = this.getShowWordCount(vocabulary, show.id);
      wordCounts.set(show.id, count);
    });
    
    return wordCounts;
  }

  // ==================== 页面数据准备 ====================
  
  // 准备页面所需的所有数据
  preparePageData(shows: Show[], vocabulary: any[]): {
    showItems: Show[];
    wordbookItems: Show[];
    showItemsWithCounts: Array<{ show: Show; wordCount: number }>;
    wordbookItemsWithCounts: Array<{ show: Show; wordCount: number }>;
    totalShowsCount: number;
    totalWordbooksCount: number;
    totalVocabularyCount: number;
  } {
    console.log('[dataManagerService] 准备页面数据');
    
    // 分离剧集和单词本
    const { showItems, wordbookItems } = this.separateShowsAndWordbooks(shows);
    
    // 计算每个剧集的单词数量
    const showItemsWithCounts = showItems.map(show => ({
      show,
      wordCount: this.getShowWordCount(vocabulary, show.id)
    }));
    
    // 计算每个单词本的单词数量
    const wordbookItemsWithCounts = wordbookItems.map(show => ({
      show,
      wordCount: this.getShowWordCount(vocabulary, show.id)
    }));
    
    // 计算总数
    const totalShowsCount = showItems.length;
    const totalWordbooksCount = wordbookItems.length;
    const totalVocabularyCount = vocabulary.length;
    
    return {
      showItems,
      wordbookItems,
      showItemsWithCounts,
      wordbookItemsWithCounts,
      totalShowsCount,
      totalWordbooksCount,
      totalVocabularyCount
    };
  }

  // 获取剧集显示数据（带单词数量）
  getShowDisplayData(shows: Show[], vocabulary: any[]): Array<{ show: Show; wordCount: number }> {
    const { showItems } = this.separateShowsAndWordbooks(shows);
    
    return showItems.map(show => ({
      show,
      wordCount: this.getShowWordCount(vocabulary, show.id)
    }));
  }

  // 获取单词本显示数据（带单词数量）
  getWordbookDisplayData(shows: Show[], vocabulary: any[]): Array<{ show: Show; wordCount: number }> {
    const { wordbookItems } = this.separateShowsAndWordbooks(shows);
    
    return wordbookItems.map(show => ({
      show,
      wordCount: this.getShowWordCount(vocabulary, show.id)
    }));
  }

  // ==================== 统计信息计算 ====================
  
  // 计算页面统计信息
  calculatePageStatistics(shows: Show[], vocabulary: any[]): {
    totalShows: number;
    totalWordbooks: number;
    totalVocabulary: number;
    showsWithWords: number;
    wordbooksWithWords: number;
    averageWordsPerShow: number;
    averageWordsPerWordbook: number;
  } {
    const { showItems, wordbookItems } = this.separateShowsAndWordbooks(shows);
    
    // 计算有单词的剧集和单词本数量
    const showsWithWords = showItems.filter(show => 
      this.getShowWordCount(vocabulary, show.id) > 0
    ).length;
    
    const wordbooksWithWords = wordbookItems.filter(show => 
      this.getShowWordCount(vocabulary, show.id) > 0
    ).length;
    
    // 计算平均单词数量
    const averageWordsPerShow = showItems.length > 0 
      ? showItems.reduce((sum, show) => sum + this.getShowWordCount(vocabulary, show.id), 0) / showItems.length 
      : 0;
    
    const averageWordsPerWordbook = wordbookItems.length > 0 
      ? wordbookItems.reduce((sum, show) => sum + this.getShowWordCount(vocabulary, show.id), 0) / wordbookItems.length 
      : 0;
    
    return {
      totalShows: showItems.length,
      totalWordbooks: wordbookItems.length,
      totalVocabulary: vocabulary.length,
      showsWithWords,
      wordbooksWithWords,
      averageWordsPerShow: Math.round(averageWordsPerShow * 100) / 100,
      averageWordsPerWordbook: Math.round(averageWordsPerWordbook * 100) / 100
    };
  }

  // ==================== 数据验证和清理 ====================
  
  // 验证数据完整性
  validateData(shows: Show[], vocabulary: any[]): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // 检查shows是否为空
    if (!shows || shows.length === 0) {
      issues.push('没有可用的剧集或单词本数据');
    }
    
    // 检查vocabulary是否为空
    if (!vocabulary || vocabulary.length === 0) {
      issues.push('没有可用的词汇数据');
    }
    
    // 检查数据一致性
    if (shows && vocabulary) {
      const { showItems, wordbookItems } = this.separateShowsAndWordbooks(shows);
      const allShows = [...showItems, ...wordbookItems];
      
      // 检查是否有重复的ID
      const ids = allShows.map(show => show.id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        issues.push('存在重复的剧集或单词本ID');
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // 清理无效数据
  cleanData(shows: Show[], vocabulary: any[]): {
    cleanedShows: Show[];
    cleanedVocabulary: any[];
  } {
    // 过滤掉无效的shows
    const cleanedShows = shows.filter(show => 
      show && show.id && show.name && show.type
    );
    
    // 过滤掉无效的vocabulary
    const cleanedVocabulary = vocabulary.filter(word => 
      word && word.id && word.word
    );
    
    return {
      cleanedShows,
      cleanedVocabulary
    };
  }

  // ==================== 挑战卡片管理 ====================
  
  // 获取挑战卡片配置
  getChallengeCardsConfig(
    vocabularyLength: number,
    wrongWordsCount: number
  ): Array<{
    key: string;
    icon: string;
    title: string;
    subtitle: string;
    experienceGained: number;
    count: number;
    hasRefreshButton?: boolean;
  }> {
    return [
      {
        key: 'shuffle',
        icon: 'lightbulb',
        title: 'smart_challenge',
        subtitle: 'mastered_cards',
        experienceGained: experienceManager.getSmartChallengeExperience(),
        count: vocabularyLength
      },
      {
        key: 'wrong_words',
        icon: 'alert-circle',
        title: 'wrong_words_challenge',
        subtitle: 'wrong_words_count',
        experienceGained: experienceManager.getWrongWordChallengeExperience(),
        count: wrongWordsCount,
        hasRefreshButton: true
      }
    ];
  }

  // 获取单个挑战卡片配置
  getChallengeCardConfig(
    key: string,
    vocabularyLength: number,
    wrongWordsCount: number
  ): {
    key: string;
    icon: string;
    title: string;
    subtitle: string;
    experienceGained: number;
    count: number;
    hasRefreshButton?: boolean;
  } | null {
    const configs = this.getChallengeCardsConfig(vocabularyLength, wrongWordsCount);
    return configs.find(config => config.key === key) || null;
  }

  // ==================== 页面状态管理 ====================
  
  // 统一获取页面状态
  getPageState(
    shows: Show[],
    vocabulary: any[],
    wrongWordsCount: number
  ): {
    vocabularyLength: number;
    wrongWordsCount: number;
    challengeCards: Array<{
      key: string;
      icon: string;
      title: string;
      subtitle: string;
      experienceGained: number;
      count: number;
      hasRefreshButton?: boolean;
    }>;
    showItems: Show[];
    wordbookItems: Show[];
    showItemsWithCounts: Array<{ show: Show; wordCount: number }>;
    wordbookItemsWithCounts: Array<{ show: Show; wordCount: number }>;
  } {
    const pageData = this.preparePageData(shows, vocabulary);
    const challengeCards = this.getChallengeCardsConfig(vocabulary.length, wrongWordsCount);
    
    return {
      vocabularyLength: vocabulary.length,
      wrongWordsCount,
      challengeCards,
      ...pageData
    };
  }
}

export const dataManagerService = DataManagerService.getInstance();
