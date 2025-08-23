import { ShowWordPreview, IShowWordPreview } from '../models/ShowWordPreview';
import { ShowWordPackage, IShowWordPackage } from '../models/ShowWordPackage';
import { CloudWord } from '../models/CloudWord';
import UserShowList from '../models/UserShowList';

export class ShowWordService {
  
  /**
   * 获取剧集单词统计列表
   */
  static async getShowsWithWordCount() {
    try {
      // 聚合查询，统计每个剧集的单词数量
      const showsWithWordCount = await CloudWord.aggregate([
        {
          $match: {
            showName: { $exists: true, $ne: null, $nin: ['', null] }
          }
        },
        {
          $group: {
            _id: '$showName',
            showId: { $first: '$showId' },
            language: { $first: '$language' },
            wordCount: { $sum: 1 },
            // 获取一些示例单词用于展示
            sampleWords: { $push: { word: '$word', definitions: '$definitions' } }
          }
        },
        {
          $project: {
            showName: '$_id',
            showId: 1,
            language: 1,
            wordCount: 1,
            sampleWords: { $slice: ['$sampleWords', 3] } // 只取前3个单词作为示例
          }
        },
        {
          $sort: { wordCount: -1 }
        }
      ]);

      return showsWithWordCount;
    } catch (error) {
      console.error('[ShowWordService] 获取剧集单词统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定剧集的单词列表
   */
  static async getShowWords(showId: string) {
    try {
      // 查询指定剧集的所有单词
      const words = await CloudWord.find({
        showId: showId
      }).select('word definitions phonetic difficulty tags');
      
      return words;
    } catch (error) {
      console.error('[ShowWordService] 获取剧集单词失败:', error);
      throw error;
    }
  }

  /**
   * 创建或更新剧集单词预览
   */
  static async createOrUpdatePreview(showId: string): Promise<IShowWordPreview> {
    try {
      console.log(`[ShowWordService] 开始创建剧集单词预览: ${showId}`);
      
      // 1. 获取该剧集下所有单词关联（这里需要先创建 wordshowassociations 集合）
      // 暂时从 cloudwords 中查找
      const wordAssociations = await CloudWord.find({
        'showAssociations.showId': showId
      });
      
      // 2. 获取剧集信息
      const showInfo = await UserShowList.findOne(
        { 'shows.showId': showId },
        { 'shows.$': 1 }
      );
      
      if (!showInfo || !showInfo.shows || showInfo.shows.length === 0) {
        throw new Error(`剧集 ${showId} 不存在`);
      }
      
      const show = showInfo.shows[0];
      
      // 3. 统计单词信息
      const wordStats = this.calculateWordStats(wordAssociations);
      const popularWords = await this.getPopularWords(showId, 10);
      
      // 4. 创建预览文档
      const previewData = {
        showId,
        showName: show.name,
        originalTitle: show.original_name || show.name,
        language: 'en', // 默认英语，因为UserShowList中没有language字段
        genre: show.genres || [],
        year: new Date().getFullYear(), // 暂时使用当前年份
        wordStats,
        popularWords,
        showInfo: {
          posterUrl: show.poster_path || '',
          description: '', // UserShowList中没有description字段
          totalEpisodes: 0, // UserShowList中没有totalEpisodes字段
          averageEpisodeLength: 22,
          rating: show.vote_average || 0
        },
        lastWordAdded: new Date()
      };
      
      // 5. 插入或更新预览
      const preview = await ShowWordPreview.findOneAndUpdate(
        { showId },
        { $set: previewData },
        { upsert: true, new: true }
      );
      
      console.log(`[ShowWordService] 剧集单词预览创建成功: ${showId}`);
      return preview;
      
    } catch (error) {
      console.error(`[ShowWordService] 创建剧集单词预览失败:`, error);
      throw error;
    }
  }
  
  /**
   * 计算单词统计信息
   */
  private static calculateWordStats(wordAssociations: any[]) {
    const uniqueWords = new Set();
    const userSet = new Set();
    
    wordAssociations.forEach(doc => {
      if (doc.showAssociations) {
        doc.showAssociations.forEach((assoc: any) => {
          uniqueWords.add(assoc.word);
          if (assoc.userId) {
            userSet.add(assoc.userId.toString());
          }
        });
      }
    });
    
    const totalUniqueWords = uniqueWords.size;
    const totalAssociations = wordAssociations.length;
    const userCount = userSet.size;
    
    // 计算单词分类（简化版本）
    const wordCategories = {
      nouns: Math.floor(totalUniqueWords * 0.4),
      verbs: Math.floor(totalUniqueWords * 0.3),
      adjectives: Math.floor(totalUniqueWords * 0.2),
      adverbs: Math.floor(totalUniqueWords * 0.1)
    };
    
    // 计算难度等级
    const difficultyLevel = this.calculateDifficultyLevel(totalUniqueWords);
    
    // 估算学习时间（每个单词0.3分钟）
    const estimatedLearningTime = Math.ceil(totalUniqueWords * 0.3);
    
    return {
      totalUniqueWords,
      totalAssociations,
      userCount,
      lastUpdated: new Date(),
      wordCategories,
      difficultyLevel,
      estimatedLearningTime
    };
  }
  
  /**
   * 计算难度等级
   */
  private static calculateDifficultyLevel(wordCount: number): string {
    if (wordCount <= 20) return 'beginner';
    if (wordCount <= 50) return 'beginner-intermediate';
    if (wordCount <= 100) return 'intermediate';
    if (wordCount <= 200) return 'intermediate-advanced';
    return 'advanced';
  }
  
  /**
   * 获取热门单词
   */
  private static async getPopularWords(showId: string, limit: number = 10) {
    try {
      // 从 cloudwords 中获取该剧集的热门单词
      const popularWords = await CloudWord.aggregate([
        { $match: { 'showAssociations.showId': showId } },
        { $unwind: '$showAssociations' },
        { $match: { 'showAssociations.showId': showId } },
        {
          $group: {
            _id: '$word',
            frequency: { $sum: 1 },
            definitions: { $first: '$definitions' }
          }
        },
        { $sort: { frequency: -1 } },
        { $limit: limit },
        {
          $project: {
            word: '$_id',
            frequency: 1,
            definitions: { $map: { input: '$definitions', as: 'def', in: '$$def.definition' } },
            difficulty: { $literal: 'intermediate' }
          }
        }
      ]);
      
      return popularWords;
    } catch (error) {
      console.error(`[ShowWordService] 获取热门单词失败:`, error);
      return [];
    }
  }
  
  /**
   * 生成剧集单词包
   */
  static async generateWordPackage(
    showId: string, 
    userId: string, 
    packageType: 'essential' | 'complete' | 'beginner' = 'essential'
  ): Promise<IShowWordPackage> {
    try {
      console.log(`[ShowWordService] 开始生成单词包: ${showId}, 类型: ${packageType}`);
      
      // 1. 获取剧集预览
      const preview = await ShowWordPreview.findOne({ showId });
      if (!preview) {
        throw new Error('剧集预览不存在，请先创建预览');
      }
      
      // 2. 根据包类型选择单词
      let selectedWords = [];
      switch (packageType) {
        case 'essential':
          selectedWords = preview.popularWords.slice(0, 30);
          break;
        case 'complete':
          selectedWords = preview.popularWords;
          break;
        case 'beginner':
          selectedWords = preview.popularWords.filter(w => w.difficulty === 'beginner').slice(0, 20);
          break;
        default:
          selectedWords = preview.popularWords.slice(0, 20);
      }
      
      // 3. 获取单词详细信息
      const wordDetails = await Promise.all(
        selectedWords.map(async (word) => {
          const cloudWord = await CloudWord.findOne({ word: word.word });
          if (!cloudWord) return null;
          
          return {
            wordId: cloudWord._id,
            word: word.word,
            definitions: cloudWord.definitions.map((d: any) => d.definition),
            phonetic: cloudWord.phonetic,
            examples: cloudWord.definitions[0]?.examples?.slice(0, 2) || [],
            difficulty: word.difficulty,
            tags: this.generateTags(word.word, cloudWord.definitions)
          };
        })
      );
      
      // 过滤掉空值
      const validWords = wordDetails.filter(word => word !== null);
      
      // 4. 创建单词包
      const packageId = `package_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const wordPackage = new ShowWordPackage({
        packageId,
        showId,
        showName: preview.showName,
        userId,
        words: validWords,
        packageInfo: {
          name: `${preview.showName} ${packageType.charAt(0).toUpperCase() + packageType.slice(1)} Words`,
          description: `${packageType} vocabulary from ${preview.showName}`,
          wordCount: validWords.length,
          estimatedStudyTime: Math.ceil(validWords.length * 0.3),
          difficulty: preview.wordStats.difficultyLevel,
          tags: preview.genre
        },
        downloadInfo: {
          downloadedAt: new Date(),
          lastAccessed: new Date(),
          studyProgress: 0,
          completedWords: 0,
          totalWords: validWords.length
        }
      });
      
      // 5. 保存单词包
      const savedPackage = await wordPackage.save();
      
      console.log(`[ShowWordService] 单词包生成成功: ${packageId}`);
      return savedPackage;
      
    } catch (error) {
      console.error(`[ShowWordService] 生成单词包失败:`, error);
      throw error;
    }
  }
  
  /**
   * 生成单词标签
   */
  private static generateTags(word: string, definitions: any[]): string[] {
    const tags = [];
    
    // 基于词性添加标签
    definitions.forEach(def => {
      if (def.partOfSpeech === 'noun') tags.push('noun');
      if (def.partOfSpeech === 'verb') tags.push('verb');
      if (def.partOfSpeech === 'adjective') tags.push('adjective');
      if (def.partOfSpeech === 'adverb') tags.push('adverb');
    });
    
    // 基于单词长度添加难度标签
    if (word.length <= 4) tags.push('short');
    if (word.length >= 8) tags.push('long');
    
    // 基于内容添加主题标签
    if (definitions.some(def => 
      def.definition.includes('好') || 
      def.definition.includes('棒') || 
      def.definition.includes('awesome')
    )) {
      tags.push('positive');
    }
    
    return [...new Set(tags)]; // 去重
  }
  
  /**
   * 获取用户的单词包列表
   */
  static async getUserWordPackages(userId: string): Promise<IShowWordPackage[]> {
    try {
      const packages = await ShowWordPackage.find({ 
        userId, 
        isActive: true 
      }).sort({ createdAt: -1 });
      
      return packages;
    } catch (error) {
      console.error(`[ShowWordService] 获取用户单词包失败:`, error);
      throw error;
    }
  }
  
  /**
   * 更新单词包学习进度
   */
  static async updatePackageProgress(
    packageId: string, 
    userId: string, 
    completedWords: number
  ): Promise<IShowWordPackage> {
    try {
      const package_ = await ShowWordPackage.findOne({ packageId, userId });
      if (!package_) {
        throw new Error('单词包不存在');
      }
      
      const studyProgress = completedWords / package_.packageInfo.wordCount;
      
      const updatedPackage = await ShowWordPackage.findByIdAndUpdate(
        package_.id,
        {
          $set: {
            'downloadInfo.studyProgress': studyProgress,
            'downloadInfo.completedWords': completedWords,
            'downloadInfo.lastAccessed': new Date()
          }
        },
        { new: true }
      );
      
      return updatedPackage!;
    } catch (error) {
      console.error(`[ShowWordService] 更新单词包进度失败:`, error);
      throw error;
    }
  }
  
  /**
   * 搜索剧集单词预览
   */
  static async searchShowPreviews(
    query: string,
    language?: string,
    limit: number = 20
  ): Promise<IShowWordPreview[]> {
    try {
      let searchQuery: any = { isActive: true };
      
      if (query) {
        searchQuery.$text = { $search: query };
      }
      
      if (language) {
        searchQuery.language = language;
      }
      
      const previews = await ShowWordPreview.find(searchQuery)
        .sort({ 'wordStats.totalUniqueWords': -1 })
        .limit(limit);
      
      return previews;
    } catch (error) {
      console.error(`[ShowWordService] 搜索剧集预览失败:`, error);
      throw error;
    }
  }
}

export default ShowWordService;
