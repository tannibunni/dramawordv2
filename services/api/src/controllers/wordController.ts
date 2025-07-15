import { Request, Response } from 'express';
import OpenAI from 'openai';
import { Word, IWord } from '../models/Word';
import { SearchHistory, ISearchHistory } from '../models/SearchHistory';
import { CloudWord } from '../models/CloudWord';
import UserVocabulary from '../models/UserVocabulary';
import { logger } from '../utils/logger';

// 初始化 OpenAI
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  logger.error('❌ OPENAI_API_KEY environment variable is missing!');
  // 不要退出进程，让应用继续运行，但记录错误
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
      // 修复：缓存里存的是普通对象，不能再 .toObject()
      res.json({
        success: true,
        data: {
          ...cachedWord,
          correctedWord: cachedWord.correctedWord || searchTerm
        },
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
      wordCache.set(searchTerm, cloudWord.toObject());
      
      // 保存搜索历史
      await saveSearchHistoryToDB(searchTerm, cloudWord.definitions[0]?.definition || '暂无释义');
      
      res.json({
        success: true,
        data: {
          ...cloudWord.toObject(),
          correctedWord: cloudWord.correctedWord || searchTerm
        },
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
        correctedWord: generatedData.correctedWord || searchTerm,
        searchCount: 1,
        lastSearched: new Date()
      });
      
      await cloudWord.save();
      logger.info(`💾 Saved new word to cloud words: ${searchTerm}`);
      
      // 5. 保存到内存缓存
      wordCache.set(searchTerm, cloudWord.toObject());
      
      // 6. 保存搜索历史
      await saveSearchHistoryToDB(searchTerm, cloudWord.definitions[0]?.definition || '暂无释义');

      res.json({
        success: true,
        data: {
          ...cloudWord.toObject(),
          correctedWord: cloudWord.correctedWord || searchTerm
        },
        source: 'ai'
      });
    } catch (aiError) {
      logger.warn(`⚠️ AI generation failed for ${searchTerm}, using fallback data:`, aiError);
      logger.error(`❌ OpenAI API Error details:`, {
        message: aiError instanceof Error ? aiError.message : 'Unknown error',
        stack: aiError instanceof Error ? aiError.stack : undefined,
        word: searchTerm
      });
      
      // 使用模拟数据作为后备方案
      const fallbackData = getFallbackWordData(searchTerm);
      
      // 保存到云单词表
      cloudWord = new CloudWord({
        word: searchTerm,
        phonetic: fallbackData.phonetic,
        definitions: fallbackData.definitions,
        audioUrl: fallbackData.audioUrl || '',
        correctedWord: searchTerm, // fallback 时使用原词作为 correctedWord
        searchCount: 1,
        lastSearched: new Date()
      });
      
      await cloudWord.save();
      logger.info(`💾 Saved fallback word to cloud words: ${searchTerm}`);
      
      // 保存到内存缓存
      wordCache.set(searchTerm, cloudWord.toObject());
      
      // 保存搜索历史
      await saveSearchHistoryToDB(searchTerm, cloudWord.definitions[0]?.definition || '暂无释义');

      res.json({
        success: true,
        data: {
          ...cloudWord.toObject(),
          correctedWord: cloudWord.correctedWord || searchTerm
        },
        source: 'fallback',
        message: 'AI service unavailable, using basic definition'
      });
    }

    // 删除 didyoumean2 相关建议词逻辑
    // 只有缓存、云表、AI、fallback都查不到时才会走到这里
    // 引入 didyoumean2
    // const didYouMean = require('didyoumean2').default;
    // 获取所有云单词
    // const allCloudWords = await CloudWord.find({}).select('word -_id');
    // const wordList = allCloudWords.map((w: any) => w.word);
    // 查找相似词，阈值可调整
    // const suggestions = didYouMean(searchTerm, wordList, { returnType: 'all-matches', threshold: 0.6 });
    // logger.info(`🔎 No result for ${searchTerm}, suggestions: ${suggestions}`);
    // res.status(404).json({
    //   success: false,
    //   error: 'Word not found',
    //   suggestions
    // });
    // return;

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
    const userId = req.params.userId || req.body.userId || req.query.userId;
    
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
      error: 'Failed to add word to vocabulary',
      details: error instanceof Error ? error.message : 'Unknown error'
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

// 删除用户单词本中的单词
export const removeFromUserVocabulary = async (req: Request, res: Response) => {
  try {
    const { userId, word } = req.body;
    
    if (!userId || !word) {
      res.status(400).json({
        success: false,
        error: 'User ID and word are required'
      });
      return;
    }

    const searchTerm = word.toLowerCase().trim();
    logger.info(`🗑️ Removing word from user vocabulary: ${searchTerm} for user: ${userId}`);

    // 查找并删除用户单词本记录
    const deletedWord = await UserVocabulary.findOneAndDelete({
      userId: userId,
      word: searchTerm
    });

    if (!deletedWord) {
      res.status(404).json({
        success: false,
        error: 'Word not found in user vocabulary'
      });
      return;
    }

    logger.info(`✅ Removed word from user vocabulary: ${searchTerm}`);

    res.json({
      success: true,
      message: 'Word removed from vocabulary successfully',
      data: {
        word: searchTerm
      }
    });

  } catch (error) {
    logger.error('❌ Remove from user vocabulary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove word from vocabulary'
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

// 获取有道 TTS 发音链接（美音，免费，无需鉴权）
function getYoudaoTTSUrl(word: string) {
  return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=2`;
}

// 使用 OpenAI 生成单词数据
async function generateWordData(word: string) {
  const prompt = `你是专业的英语词典助手和拼写纠错专家。

任务：为单词或短语 "${word}" 生成词典信息，并检查拼写是否正确。

重要：请仔细检查用户输入的单词是否有拼写错误。常见的拼写错误包括：
- "freind" → "friend" (i 和 e 顺序错误)
- "beautifull" → "beautiful" (多了一个 l)
- "recieve" → "receive" (i 和 e 顺序错误)
- "occured" → "occurred" (少了一个 r)
- "seperate" → "separate" (a 和 e 顺序错误)
- "definately" → "definitely" (a 和 e 顺序错误)
- "accomodate" → "accommodate" (少了一个 m)
- "neccessary" → "necessary" (多了一个 c)

返回JSON格式：
{
  "phonetic": "/音标/",
  "definitions": [
    {
      "partOfSpeech": "词性",
      "definition": "【必须是中文释义，不能是英文或其他语言】",
      "examples": [
        {
          "english": "英文例句",
          "chinese": "【必须是该例句的中文翻译，不能是英文或其他语言】"
        }
      ]
    }
  ],
  "correctedWord": "【如果用户输入的单词拼写正确，返回原词；如果拼写错误，返回正确的拼写。请仔细检查并修正拼写错误】"
}

要求：
- 无论查询什么语言，释义（definition）和例句的中文（chinese）字段都必须是中文。
- 如果查到的释义或例句不是中文，请用"暂无中文释义"或"暂无中文例句"代替。
- correctedWord 字段：必须仔细检查拼写，如果用户输入的单词拼写正确，返回原词；如果拼写错误，返回正确的拼写。
- 只返回JSON，不要其他内容。`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "你是词典助手。只返回JSON格式，不要其他内容。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    try {
      const parsedData = JSON.parse(responseText);
      
      // 验证和修复数据格式
      const definitions = Array.isArray(parsedData.definitions) ? parsedData.definitions.map((def: any) => ({
        partOfSpeech: def.partOfSpeech || 'n.',
        definition: def.definition || '暂无释义',
        examples: Array.isArray(def.examples) ? def.examples.map((ex: any) => {
          // 保持对象格式，不要转换为字符串
          if (typeof ex === 'object' && ex.english && ex.chinese) {
            return {
              english: ex.english,
              chinese: ex.chinese
            };
          }
          // 如果是字符串格式，尝试解析为对象
          if (typeof ex === 'string') {
            const parts = ex.split(' - ');
            if (parts.length >= 2) {
              return {
                english: parts[0].trim(),
                chinese: parts[1].trim()
              };
            }
            return {
              english: ex,
              chinese: '暂无中文翻译'
            };
          }
          // 默认返回空对象
          return {
            english: '',
            chinese: ''
          };
        }) : []
      })) : [];

      return {
        phonetic: parsedData.phonetic || `/${word}/`,
        definitions: definitions,
        audioUrl: getYoudaoTTSUrl(word),
        correctedWord: parsedData.correctedWord || word
      };
    } catch (parseError) {
      logger.error('❌ Failed to parse OpenAI response:', parseError);
      logger.error('Raw response:', responseText);
      throw new Error('Invalid response format from OpenAI');
    }
  }

// 获取后备单词数据
function getFallbackWordData(word: string) {
  // 检测是否为英文单词（简单检测：是否包含英文字母）
  const isEnglish = /[a-zA-Z]/.test(word);
  
  return {
    phonetic: isEnglish ? `/${word}/` : '',
    definitions: [
      {
        partOfSpeech: isEnglish ? 'noun' : 'n.',
        definition: `${word} 的基本含义`,
        examples: isEnglish ? [
          { english: `This is a ${word}.`, chinese: `这是一个${word}。` },
          { english: `I like ${word}.`, chinese: `我喜欢${word}。` }
        ] : [
          { english: `${word}`, chinese: `${word} 的含义` }
        ]
      }
    ],
    audioUrl: getYoudaoTTSUrl(word)
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

// 清空用户搜索历史（包括最近查词）
export const clearUserHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.warn('🗑️ Clearing all search history (including recent searches)...');
    
    // 清空所有搜索历史记录，包括最近查词
    await SearchHistory.deleteMany({});
    
    logger.info('✅ All search history cleared successfully');

    res.json({
      success: true,
      message: 'All search history and recent searches cleared successfully'
    });

  } catch (error) {
    logger.error('❌ Clear user history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear search history'
    });
  }
};

// 调试接口 - 检查环境变量状态
export const checkEnvironment = async (req: Request, res: Response): Promise<void> => {
  try {
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    const openAIKeyLength = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0;
    
    res.json({
      success: true,
      data: {
        hasOpenAIKey,
        openAIKeyLength,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('❌ Check environment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check environment'
    });
  }
};

// 测试 Open AI 连接
export const testOpenAI = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      res.json({
        success: false,
        error: 'OPENAI_API_KEY not found'
      });
      return;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Hello, please respond with 'OpenAI connection successful'"
        }
      ],
      max_tokens: 50
    });

    const response = completion.choices[0]?.message?.content;
    
    res.json({
      success: true,
      data: {
        response,
        model: completion.model,
        usage: completion.usage
      }
    });
  } catch (error) {
    logger.error('❌ OpenAI test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
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
  clearUserHistory,
  checkEnvironment,
  testOpenAI
}; 