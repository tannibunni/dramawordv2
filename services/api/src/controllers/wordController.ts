import { Request, Response } from 'express';
import OpenAI from 'openai';
import { Word, IWord } from '../models/Word';
import { SearchHistory, ISearchHistory } from '../models/SearchHistory';
import CloudWord from '../models/CloudWord';
import UserVocabulary from '../models/UserVocabulary';
import { logger } from '../utils/logger';

// 初始化 OpenAI
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  logger.error('❌ OPENAI_API_KEY environment variable is missing!');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key',
});

// 内存缓存，用于提高性能
const wordCache = new Map<string, any>();

// 单词搜索 - 先查云单词表，没有再用AI
export const searchWord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { word } = req.body;
    
    if (!word) {
      res.status(400).json({
        success: false,
        error: 'Word parameter is required'
      });
      return;
    }

    const searchTerm = word.toLowerCase().trim();
    logger.info(`🔍 Searching for word: ${searchTerm}`);

    // 1. 检查内存缓存
    if (wordCache.has(searchTerm)) {
      logger.info(`✅ Found in memory cache: ${searchTerm}`);
      const cachedWord = wordCache.get(searchTerm)!;
      
      // 更新云单词表搜索统计
      await updateCloudWordSearchStats(searchTerm);
      
      // 保存搜索历史
      await saveSearchHistoryToDB(searchTerm, cachedWord.definitions[0]?.definition || '暂无释义');
      
      res.json({
        success: true,
        data: cachedWord,
        source: 'cache'
      });
      return;
    }

    // 2. 检查云单词表
    let cloudWord = await CloudWord.findOne({ word: searchTerm });
    if (cloudWord) {
      logger.info(`✅ Found in cloud words: ${searchTerm}`);
      
      // 更新搜索次数和最后搜索时间
      await updateCloudWordSearchStats(searchTerm);
      
      // 保存到内存缓存
      wordCache.set(searchTerm, cloudWord);
      
      // 保存搜索历史
      await saveSearchHistoryToDB(searchTerm, cloudWord.definitions[0]?.definition || '暂无释义');
      
      res.json({
        success: true,
        data: cloudWord,
        source: 'cloud_words'
      });
      return;
    }

    // 3. 尝试使用 OpenAI 生成新单词信息
    logger.info(`🤖 Attempting to generate new word data with AI: ${searchTerm}`);
    
    try {
      const generatedData = await generateWordData(searchTerm);
      
      // 4. 保存到云单词表
      cloudWord = new CloudWord({
        word: searchTerm,
        phonetic: generatedData.phonetic,
        definitions: generatedData.definitions,
        audioUrl: generatedData.audioUrl || '',
        searchCount: 1,
        lastSearched: new Date()
      });
      
      await cloudWord.save();
      logger.info(`💾 Saved new word to cloud words: ${searchTerm}`);
      
      // 5. 保存到内存缓存
      wordCache.set(searchTerm, cloudWord);
      
      // 6. 保存搜索历史
      await saveSearchHistoryToDB(searchTerm, cloudWord.definitions[0]?.definition || '暂无释义');

      res.json({
        success: true,
        data: cloudWord,
        source: 'ai'
      });
    } catch (aiError) {
      logger.warn(`⚠️ AI generation failed for ${searchTerm}, using fallback data:`, aiError);
      
      // 使用模拟数据作为后备方案
      const fallbackData = getFallbackWordData(searchTerm);
      
      // 保存到云单词表
      cloudWord = new CloudWord({
        word: searchTerm,
        phonetic: fallbackData.phonetic,
        definitions: fallbackData.definitions,
        audioUrl: fallbackData.audioUrl || '',
        searchCount: 1,
        lastSearched: new Date()
      });
      
      await cloudWord.save();
      logger.info(`💾 Saved fallback word to cloud words: ${searchTerm}`);
      
      // 保存到内存缓存
      wordCache.set(searchTerm, cloudWord);
      
      // 保存搜索历史
      await saveSearchHistoryToDB(searchTerm, cloudWord.definitions[0]?.definition || '暂无释义');

      res.json({
        success: true,
        data: cloudWord,
        source: 'fallback',
        message: 'AI service unavailable, using basic definition'
      });
    }

  } catch (error) {
    logger.error('❌ Search word error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search word',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// 获取热门单词 - 从云单词表获取
export const getPopularWords = async (req: Request, res: Response) => {
  try {
    logger.info('📊 Getting popular words from cloud words');
    
    const popularWords = await CloudWord.find({})
      .sort({ searchCount: -1, lastSearched: -1 })
      .limit(10)
      .select('word definitions searchCount');
    
    const formattedWords = popularWords.map(word => ({
      word: word.word,
      definition: word.definitions[0]?.definition || '暂无释义',
      count: word.searchCount
    }));
    
    res.json({
      success: true,
      data: formattedWords
    });

  } catch (error) {
    logger.error('❌ Get popular words error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get popular words'
    });
  }
};

// 获取最近搜索 - 从搜索历史表获取
export const getRecentSearches = async (req: Request, res: Response) => {
  try {
    logger.info('📝 Getting recent searches from search history');
    
    // 使用聚合管道进行去重，每个单词只保留最新的一条记录
    const recentSearches = await SearchHistory.aggregate([
      // 按单词分组，获取每个单词的最新记录
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$word',
          word: { $first: '$word' },
          definition: { $first: '$definition' },
          timestamp: { $first: '$timestamp' }
        }
      },
      // 按时间戳排序，获取最新的10条记录
      {
        $sort: { timestamp: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    const formattedSearches = recentSearches.map(search => ({
      word: search.word,
      definition: search.definition,
      timestamp: search.timestamp
    }));
    
    res.json({
      success: true,
      data: formattedSearches
    });

  } catch (error) {
    logger.error('❌ Get recent searches error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recent searches'
    });
  }
};

// 保存搜索历史
export const saveSearchHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { word, definition, timestamp } = req.body;
    
    if (!word) {
      res.status(400).json({
        success: false,
        error: 'Word parameter is required'
      });
      return;
    }

    const searchHistory = new SearchHistory({
      word: word.toLowerCase().trim(),
      definition: definition || '暂无释义',
      timestamp: timestamp || Date.now()
    });
    
    await searchHistory.save();
    logger.info(`💾 Saved search history: ${word}`);
    
    res.json({
      success: true,
      message: 'Search history saved successfully'
    });

  } catch (error) {
    logger.error('❌ Save search history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save search history'
    });
  }
};

// 获取用户单词本
export const getUserVocabulary = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || req.body.userId || (req.query.userId as string);
    
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
      return;
    }

    logger.info(`📚 Getting vocabulary for user: ${userId}`);
    
    // 联表查询用户单词本和云单词表
    const userVocabulary = await UserVocabulary.aggregate([
      {
        $match: { userId: userId }
      },
      {
        $lookup: {
          from: 'cloudwords',
          localField: 'wordId',
          foreignField: '_id',
          as: 'cloudWord'
        }
      },
      {
        $unwind: '$cloudWord'
      },
      {
        $project: {
          _id: 1,
          word: '$cloudWord.word',
          phonetic: '$cloudWord.phonetic',
          definitions: '$cloudWord.definitions',
          audioUrl: '$cloudWord.audioUrl',
          mastery: 1,
          reviewCount: 1,
          correctCount: 1,
          incorrectCount: 1,
          lastReviewDate: 1,
          nextReviewDate: 1,
          notes: 1,
          tags: 1,
          sourceShow: 1,
          collectedAt: 1
        }
      }
    ]);
    
    res.json({
      success: true,
      data: userVocabulary
    });

  } catch (error) {
    logger.error('❌ Get user vocabulary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user vocabulary'
    });
  }
};

// 添加单词到用户单词本
export const addToUserVocabulary = async (req: Request, res: Response) => {
  try {
    const { userId, word, sourceShow } = req.body;
    
    if (!userId || !word) {
      res.status(400).json({
        success: false,
        error: 'User ID and word are required'
      });
      return;
    }

    const searchTerm = word.toLowerCase().trim();
    logger.info(`📝 Adding word to user vocabulary: ${searchTerm} for user: ${userId}`);

    // 1. 查找或创建云单词
    let cloudWord = await CloudWord.findOne({ word: searchTerm });
    if (!cloudWord) {
      // 如果云单词不存在，创建它
      const generatedData = await generateWordData(searchTerm);
      cloudWord = new CloudWord({
        word: searchTerm,
        phonetic: generatedData.phonetic,
        definitions: generatedData.definitions,
        audioUrl: generatedData.audioUrl || '',
        searchCount: 1,
        lastSearched: new Date()
      });
      await cloudWord.save();
    }

    // 2. 检查用户是否已有此单词
    const existingUserWord = await UserVocabulary.findOne({
      userId: userId,
      wordId: cloudWord._id
    });

    if (existingUserWord) {
      res.status(400).json({
        success: false,
        error: 'Word already exists in user vocabulary'
      });
      return;
    }

    // 3. 创建用户单词本记录
    const userVocabulary = new UserVocabulary({
      userId: userId,
      wordId: cloudWord._id,
      word: searchTerm,
      sourceShow: sourceShow || null,
      collectedAt: new Date()
    });

    await userVocabulary.save();
    logger.info(`✅ Added word to user vocabulary: ${searchTerm}`);

    res.json({
      success: true,
      message: 'Word added to vocabulary successfully',
      data: {
        word: searchTerm,
        definitions: cloudWord.definitions
      }
    });

  } catch (error) {
    logger.error('❌ Add to user vocabulary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add word to vocabulary'
    });
  }
};

// 更新单词学习进度
export const updateWordProgress = async (req: Request, res: Response) => {
  try {
    const { userId, word, progress } = req.body;
    
    if (!userId || !word || !progress) {
      res.status(400).json({
        success: false,
        error: 'User ID, word, and progress are required'
      });
      return;
    }

    const searchTerm = word.toLowerCase().trim();
    logger.info(`📊 Updating progress for word: ${searchTerm}`);

    // 查找用户单词本记录
    const userWord = await UserVocabulary.findOne({
      userId: userId,
      word: searchTerm
    });

    if (!userWord) {
      res.status(404).json({
        success: false,
        error: 'Word not found in user vocabulary'
      });
      return;
    }

    // 更新学习进度
    Object.assign(userWord, progress);
    userWord.lastReviewDate = new Date();
    
    await userWord.save();
    logger.info(`✅ Updated progress for word: ${searchTerm}`);

    res.json({
      success: true,
      message: 'Word progress updated successfully'
    });

  } catch (error) {
    logger.error('❌ Update word progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update word progress'
    });
  }
};

// 更新云单词表搜索统计
async function updateCloudWordSearchStats(word: string): Promise<void> {
  try {
    await CloudWord.updateOne(
      { word: word.toLowerCase() },
      { 
        $inc: { searchCount: 1 },
        $set: { lastSearched: new Date() }
      }
    );
  } catch (error) {
    logger.error(`❌ Failed to update search stats for ${word}:`, error);
  }
}

// 保存搜索历史到数据库
async function saveSearchHistoryToDB(word: string, definition?: string, timestamp?: number): Promise<void> {
  try {
    const searchHistory = new SearchHistory({
      word: word.toLowerCase().trim(),
      definition: definition || '暂无释义',
      timestamp: timestamp || Date.now()
    });
    
    await searchHistory.save();
  } catch (error) {
    logger.error(`❌ Failed to save search history for ${word}:`, error);
  }
}

// 使用 OpenAI 生成单词数据
async function generateWordData(word: string) {
  const prompt = `请为英文单词 "${word}" 提供以下信息，以JSON格式返回：
{
  "phonetic": "音标",
  "definitions": [
    {
      "partOfSpeech": "词性",
      "definition": "中文释义",
      "examples": ["例句1", "例句2"]
    }
  ],
  "audioUrl": "发音URL（如果有的话）"
}

请确保：
1. 音标使用国际音标
2. 释义准确且通俗易懂
3. 例句简单实用
4. 只返回JSON，不要其他文字`;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "你是一个专业的英语词典助手，提供准确的单词释义和例句。"
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 500
  });

  const responseText = completion.choices[0]?.message?.content;
  if (!responseText) {
    throw new Error('No response from OpenAI');
  }

  try {
    const parsedData = JSON.parse(responseText);
    return {
      phonetic: parsedData.phonetic || '',
      definitions: parsedData.definitions || [],
      audioUrl: parsedData.audioUrl || ''
    };
  } catch (parseError) {
    logger.error('❌ Failed to parse OpenAI response:', parseError);
    throw new Error('Invalid response format from OpenAI');
  }
}

// 获取后备单词数据
function getFallbackWordData(word: string) {
  return {
    phonetic: `/${word}/`,
    definitions: [
      {
        partOfSpeech: 'noun',
        definition: `${word} 的基本含义`,
        examples: [`This is a ${word}.`, `I like ${word}.`]
      }
    ],
    audioUrl: ''
  };
}

// 清空所有数据（调试用）
export const clearAllData = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.warn('🗑️ Clearing all data...');
    
    // 清空所有相关表
    await CloudWord.deleteMany({});
    await UserVocabulary.deleteMany({});
    await SearchHistory.deleteMany({});
    await Word.deleteMany({});
    
    // 清空内存缓存
    wordCache.clear();
    
    logger.info('✅ All data cleared successfully');
    
    res.json({
      success: true,
      message: 'All data cleared successfully'
    });

  } catch (error) {
    logger.error('❌ Clear all data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear all data'
    });
  }
};

// 清空用户搜索历史（调试用）
export const clearUserHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
      return;
    }

    logger.warn(`🗑️ Clearing search history for user: ${userId}`);
    
    await SearchHistory.deleteMany({ userId: userId });
    
    logger.info(`✅ Search history cleared for user: ${userId}`);
    
    res.json({
      success: true,
      message: 'User search history cleared successfully'
    });

  } catch (error) {
    logger.error('❌ Clear user history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear user history'
    });
  }
};

export const wordController = {
  searchWord,
  getPopularWords,
  getRecentSearches,
  saveSearchHistory,
  getUserVocabulary,
  addToUserVocabulary,
  updateWordProgress,
  clearAllData,
  clearUserHistory
}; 