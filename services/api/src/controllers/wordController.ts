import { Request, Response } from 'express';
import OpenAI from 'openai';
import { Word, IWord } from '../models/Word';
import { SearchHistory, ISearchHistory } from '../models/SearchHistory';
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
const wordCache = new Map<string, IWord>();

// 单词搜索 - 先查数据库，没有再用AI
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
      
      // 更新搜索次数和最后搜索时间
      await updateWordSearchStats(searchTerm);
      
      // 保存搜索历史
      await saveSearchHistoryToDB(searchTerm, cachedWord.definitions[0]?.definition || '暂无释义');
      
      res.json({
        success: true,
        data: cachedWord,
        source: 'cache'
      });
      return;
    }

    // 2. 检查数据库
    let wordData = await Word.findOne({ word: searchTerm });
    if (wordData) {
      logger.info(`✅ Found in database: ${searchTerm}`);
      
      // 更新搜索次数和最后搜索时间
      await updateWordSearchStats(searchTerm);
      
      // 保存到内存缓存
      wordCache.set(searchTerm, wordData);
      
      // 保存搜索历史
      await saveSearchHistoryToDB(searchTerm, wordData.definitions[0]?.definition || '暂无释义');
      
      res.json({
        success: true,
        data: wordData,
        source: 'database'
      });
      return;
    }

    // 3. 尝试使用 OpenAI 生成新单词信息
    logger.info(`🤖 Attempting to generate new word data with AI: ${searchTerm}`);
    
    try {
      const generatedData = await generateWordData(searchTerm);
      
      // 4. 保存到数据库
      wordData = new Word({
        word: searchTerm,
        phonetic: generatedData.phonetic,
        definitions: generatedData.definitions,
        searchCount: 1,
        lastSearched: new Date()
      });
      
      await wordData.save();
      logger.info(`💾 Saved new word to database: ${searchTerm}`);
      
      // 5. 保存到内存缓存
      wordCache.set(searchTerm, wordData);
      
      // 6. 保存搜索历史
      await saveSearchHistoryToDB(searchTerm, wordData.definitions[0]?.definition || '暂无释义');

      res.json({
        success: true,
        data: wordData,
        source: 'ai'
      });
    } catch (aiError) {
      logger.warn(`⚠️ AI generation failed for ${searchTerm}, using fallback data:`, aiError);
      
      // 使用模拟数据作为后备方案
      const fallbackData = getFallbackWordData(searchTerm);
      
      // 保存到数据库
      wordData = new Word({
        word: searchTerm,
        phonetic: fallbackData.phonetic,
        definitions: fallbackData.definitions,
        searchCount: 1,
        lastSearched: new Date()
      });
      
      await wordData.save();
      logger.info(`💾 Saved fallback word to database: ${searchTerm}`);
      
      // 保存到内存缓存
      wordCache.set(searchTerm, wordData);
      
      // 保存搜索历史
      await saveSearchHistoryToDB(searchTerm, wordData.definitions[0]?.definition || '暂无释义');

      res.json({
        success: true,
        data: wordData,
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

// 获取热门单词 - 从数据库获取
export const getPopularWords = async (req: Request, res: Response) => {
  try {
    logger.info('📊 Getting popular words from database');
    
    const popularWords = await Word.find({})
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

// 获取最近搜索 - 从数据库获取
export const getRecentSearches = async (req: Request, res: Response) => {
  try {
    logger.info('📝 Getting recent searches from database');
    
    const recentSearches = await SearchHistory.find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .select('word definition timestamp');
    
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

// 保存搜索历史到数据库
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

    await saveSearchHistoryToDB(word, definition, timestamp);
    
    logger.info(`💾 Saved search history: ${word}`);
    
    res.json({
      success: true,
      message: 'Search history saved'
    });

  } catch (error) {
    logger.error('❌ Save search history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save search history'
    });
  }
};

// 辅助函数：更新单词搜索统计
async function updateWordSearchStats(word: string): Promise<void> {
  try {
    await Word.updateOne(
      { word },
      { 
        $inc: { searchCount: 1 },
        $set: { lastSearched: new Date() }
      }
    );
  } catch (error) {
    logger.error(`❌ Error updating word stats for ${word}:`, error);
  }
}

// 辅助函数：保存搜索历史到数据库
async function saveSearchHistoryToDB(word: string, definition?: string, timestamp?: number): Promise<void> {
  try {
    const searchHistory = new SearchHistory({
      word: word.toLowerCase().trim(),
      definition: definition || '暂无释义',
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });
    
    await searchHistory.save();
  } catch (error) {
    logger.error(`❌ Error saving search history for ${word}:`, error);
  }
}

// 使用 OpenAI 生成单词数据
async function generateWordData(word: string) {
  try {
    const prompt = `
请为英文单词 "${word}" 生成详细的学习信息，包括：

1. 音标（IPA格式）
2. 词性和中文释义
3. 英文例句和中文翻译
4. 相关用法说明

请以JSON格式返回，格式如下：
{
  "word": "${word}",
  "phonetic": "/音标/",
  "definitions": [
    {
      "partOfSpeech": "词性",
      "definition": "中文释义",
      "examples": [
        {
          "english": "英文例句",
          "chinese": "中文翻译"
        }
      ]
    }
  ]
}

请确保返回的是有效的JSON格式，不要包含其他文字说明。
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "你是一个专业的英语学习助手，专门为学习者提供准确的单词释义和例句。请只返回JSON格式的数据，不要包含任何其他文字。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // 尝试解析JSON响应
    try {
      const wordData = JSON.parse(response);
      
      // 验证必要字段
      if (!wordData.word || !wordData.phonetic || !wordData.definitions) {
        throw new Error('Invalid word data structure');
      }
      
      return wordData;
    } catch (parseError) {
      logger.error('❌ Failed to parse OpenAI response:', response);
      throw new Error('Invalid JSON response from OpenAI');
    }

  } catch (error) {
    logger.error('❌ OpenAI API error:', error);
    throw error;
  }
}

// 获取后备单词数据（当 OpenAI 不可用时使用）
function getFallbackWordData(word: string) {
  const commonWords: { [key: string]: any } = {
    'hello': {
      phonetic: '/həˈloʊ/',
      definitions: [
        {
          partOfSpeech: 'int.',
          definition: '喂，你好',
          examples: [
            { english: 'Hello, how are you?', chinese: '你好，你好吗？' },
            { english: 'Hello there!', chinese: '你好！' }
          ]
        }
      ]
    },
    'world': {
      phonetic: '/wɜːrld/',
      definitions: [
        {
          partOfSpeech: 'n.',
          definition: '世界，地球',
          examples: [
            { english: 'The world is beautiful.', chinese: '这个世界很美丽。' },
            { english: 'People around the world.', chinese: '世界各地的人们。' }
          ]
        }
      ]
    },
    'learn': {
      phonetic: '/lɜːrn/',
      definitions: [
        {
          partOfSpeech: 'v.',
          definition: '学习，学会',
          examples: [
            { english: 'I want to learn English.', chinese: '我想学习英语。' },
            { english: 'She learns quickly.', chinese: '她学得很快。' }
          ]
        }
      ]
    },
    'study': {
      phonetic: '/ˈstʌdi/',
      definitions: [
        {
          partOfSpeech: 'v.',
          definition: '学习，研究',
          examples: [
            { english: 'I study every day.', chinese: '我每天学习。' },
            { english: 'He studies medicine.', chinese: '他学医。' }
          ]
        },
        {
          partOfSpeech: 'n.',
          definition: '学习，研究',
          examples: [
            { english: 'This is my study room.', chinese: '这是我的书房。' },
            { english: 'A study of history.', chinese: '历史研究。' }
          ]
        }
      ]
    }
  };

  // 如果单词在常见词列表中，返回预定义数据
  if (commonWords[word.toLowerCase()]) {
    return commonWords[word.toLowerCase()];
  }

  // 否则返回通用模板
  return {
    phonetic: `/${word}/`,
    definitions: [
      {
        partOfSpeech: 'n.',
        definition: `${word} 的基本含义`,
        examples: [
          { english: `This is ${word}.`, chinese: `这是 ${word}。` },
          { english: `I like ${word}.`, chinese: `我喜欢 ${word}。` }
        ]
      }
    ]
  };
}

export const wordController = {
  searchWord,
  getPopularWords,
  getRecentSearches,
  saveSearchHistory
}; 