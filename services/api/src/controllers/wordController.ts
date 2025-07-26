import { Request, Response } from 'express';
import OpenAI from 'openai';
import { Word, IWord } from '../models/Word';
import { SearchHistory, ISearchHistory } from '../models/SearchHistory';
import { CloudWord } from '../models/CloudWord';
import UserVocabulary from '../models/UserVocabulary';
import { ChineseTranslation } from '../models/ChineseTranslation';
import { User } from '../models/User';
import { ExperienceService } from '../services/experienceService';
import { logger } from '../utils/logger';
import { openAIRateLimiter } from '../utils/rateLimiter';
import fs from 'fs';
import path from 'path';

// 初始化 OpenAI
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  logger.error('❌ OPENAI_API_KEY environment variable is missing!');
  // 不要退出进程，让应用继续运行，但记录错误
}

const openai = new OpenAI({
  apiKey: apiKey,
});

// 内存缓存，用于提高性能
const wordCache = new Map<string, any>();
const chineseTranslationCache = new Map<string, string[]>();

// 获取语言中文名
function getLanguageName(lang: string) {
  switch (lang) {
    case 'en': return '英语';
    case 'zh-CN': return '中文';
    case 'ja': return '日语';
    case 'ko': return '韩语';
    case 'fr': return '法语';
    case 'es': return '西班牙语';
    // 可继续扩展
    default: return lang;
  }
}

function mapUILanguage(uiLanguage: string) {
  if (uiLanguage.startsWith('en')) return 'en';
  if (uiLanguage.startsWith('zh')) return 'zh-CN';
  if (uiLanguage.startsWith('ja')) return 'ja';
  if (uiLanguage.startsWith('ko')) return 'ko';
  if (uiLanguage.startsWith('fr')) return 'fr';
  if (uiLanguage.startsWith('es')) return 'es';
  return uiLanguage;
}
function mapTargetLanguage(language: string) {
  // 映射到数据库支持的枚举值
  if (language === 'zh' || language === 'zh-CN') return 'zh';
  if (language === 'en') return 'en';
  if (language === 'ja') return 'ja';
  if (language === 'ko') return 'ko';
  if (language === 'fr') return 'fr';
  if (language === 'es') return 'es';
  return language;
}
function getPromptTemplate(uiLanguage: string, language: string, type: string) {
  logger.info(`🔍 getPromptTemplate 参数: uiLanguage=${uiLanguage}, language=${language}, type=${type}`);
  const mappedUI = mapUILanguage(uiLanguage);
  const mappedLang = mapTargetLanguage(language);
  logger.info(`🔍 getPromptTemplate 映射: mappedUI=${mappedUI}, mappedLang=${mappedLang}`);
  // 优先查 /prompts/{uiLanguage}/{language}.json
  const promptDir = path.join(__dirname, '../../prompts', mappedUI);
  const promptPath = path.join(promptDir, `${mappedLang}.json`);
  logger.info(`🔍 Prompt 路径调试: __dirname=${__dirname}, promptDir=${promptDir}, promptPath=${promptPath}`);
  if (fs.existsSync(promptPath)) {
    const templates = JSON.parse(fs.readFileSync(promptPath, 'utf-8'));
    logger.info(`✅ 找到 prompt 文件: ${promptPath}`);
    logger.info(`📄 Prompt 内容: ${JSON.stringify(templates[type], null, 2)}`);
    // 新增：返回时带上路径和内容，便于后续log
    return { template: templates[type], promptPath, promptContent: templates[type] };
  }
  // fallback: /prompts/{uiLanguage}-{language}.json
  const altPromptPath = path.join(__dirname, '../../prompts', `${mappedUI}-${mappedLang}.json`);
  if (fs.existsSync(altPromptPath)) {
    const templates = JSON.parse(fs.readFileSync(altPromptPath, 'utf-8'));
    logger.info(`✅ 找到 fallback prompt 文件: ${altPromptPath}`);
    logger.info(`📄 Prompt 内容: ${JSON.stringify(templates[type], null, 2)}`);
    return { template: templates[type], promptPath: altPromptPath, promptContent: templates[type] };
  }
  // fallback: prompts/{uiLanguage}/default.json
  const fallbackPath = path.join(promptDir, 'default.json');
  if (fs.existsSync(fallbackPath)) {
    logger.info(`🔄 使用 fallback: ${fallbackPath}`);
    const templates = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
    return { template: templates[type], promptPath: fallbackPath, promptContent: templates[type] };
  }
  // fallback: prompts/{uiLanguage}.json（兼容老结构）
  const legacyPath = path.join(__dirname, '../../prompts', `${mappedUI}.json`);
  if (fs.existsSync(legacyPath)) {
    logger.info(`🔄 使用 legacy fallback: ${legacyPath}`);
    const templates = JSON.parse(fs.readFileSync(legacyPath, 'utf-8'));
    return { template: templates[type], promptPath: legacyPath, promptContent: templates[type] };
  }
  logger.error(`❌ 所有 prompt 文件都未找到: ${promptPath}`);
  throw new Error(`Prompt template not found: ${promptPath}`);
}

function renderPrompt(template: string, params: Record<string, string>) {
  let result = template;
  for (const key in params) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), params[key]);
  }
  return result;
}

function getLanguagePrompt(word: string, language: string, uiLanguage: string) {
  logger.info(`🔍 getLanguagePrompt 参数: word=${word}, language=${language}, uiLanguage=${uiLanguage}`);
  const isEnglishUI = uiLanguage && uiLanguage.startsWith('en');
  const isChineseUI = uiLanguage && (uiLanguage.startsWith('zh') || uiLanguage === 'zh-CN');
  const exampleField = isEnglishUI ? 'english' : (isChineseUI ? 'chinese' : getLanguageName(uiLanguage));
  const definitionLang = getLanguageName(uiLanguage);
  const targetLang = getLanguageName(language);
  logger.info(`🔍 getLanguagePrompt 处理: isEnglishUI=${isEnglishUI}, isChineseUI=${isChineseUI}, exampleField=${exampleField}, definitionLang=${definitionLang}, targetLang=${targetLang}`);
  const template = getPromptTemplate(uiLanguage, language, 'definition');
  let prompt = renderPrompt(template.template, {
    word,
    language,
    uiLanguage: definitionLang,
    targetLang,
    exampleField
  });
  // 兜底：英文界面强制英文释义
  if (isEnglishUI) {
    prompt += '\n\nImportant: All definitions, explanations, and example translations must be in English, suitable for English speakers learning this language.';
  }
  return { template: prompt, promptPath: template.promptPath, promptContent: template.promptContent };
}

// 单词搜索 - 先查云单词表，没有再用AI
export const searchWord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { word, language = 'en', uiLanguage = 'zh-CN' } = req.body;
    
    if (!word) {
      res.status(400).json({
        success: false,
        error: 'Word parameter is required'
      });
      return;
    }

    const searchTerm = word.toLowerCase().trim();
    
    // 简化语言检测逻辑：直接使用前端传递的语言参数
    let detectedLanguage = language;
    
    // 只在中文字符的情况下才改变语言检测
    if (language === 'en' && /[\u4e00-\u9fff]/.test(searchTerm)) {
      detectedLanguage = 'zh';
      logger.info(`🔍 检测到中文字符，将语言从 'en' 改为 'zh': ${searchTerm}`);
    }
    
    const cacheKey = `${searchTerm}_${detectedLanguage}_${uiLanguage}`;
    logger.info(`🔍 Searching for word: ${searchTerm} in ${detectedLanguage} (original: ${language})`);

    // 1. 检查内存缓存
    if (wordCache.has(cacheKey)) {
      logger.info(`✅ Found in memory cache: ${searchTerm}`);
      const cachedWord = wordCache.get(cacheKey)!;
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

    // 2. 检查云单词表 - 使用映射后的语言值
    const dbLanguage = mapTargetLanguage(detectedLanguage);
    let cloudWord = await CloudWord.findOne({ word: searchTerm, language: dbLanguage, uiLanguage });
    if (cloudWord) {
      logger.info(`✅ Found in cloud words: ${searchTerm}`);
      
      // 更新搜索次数和最后搜索时间
      await updateCloudWordSearchStats(searchTerm, dbLanguage, uiLanguage);
      
      // 保存到内存缓存
      wordCache.set(cacheKey, cloudWord.toObject());
      
      // 保存搜索历史
      await saveSearchHistoryToDB(searchTerm, cloudWord.definitions[0]?.definition || '暂无释义');
      
      const wordData = cloudWord.toObject();
      res.json({
        success: true,
        data: {
          ...wordData,
          correctedWord: wordData.correctedWord || searchTerm
        },
        source: 'cloud_words'
      });
      return;
    }

    // 3. 尝试使用 OpenAI 生成新单词信息
    logger.info(`🤖 Attempting to generate new word data with AI: ${searchTerm}`);
    logger.info(`🔍 Debug: About to call generateWordData for: ${searchTerm}`);
    
    try {
      const { template: prompt, promptPath, promptContent } = getLanguagePrompt(searchTerm, detectedLanguage, uiLanguage);
      logger.info(`📝 本次查词引用的prompt文件: ${promptPath}`);
      logger.info(`📝 prompt内容: ${JSON.stringify(promptContent, null, 2)}`);
      const generatedData = await generateWordData(searchTerm, dbLanguage, uiLanguage); // 传递映射后的语言值
      logger.info(`🔍 Debug: generateWordData completed for: ${searchTerm}`);
      
      // 4. 保存到云单词表（先检查是否已存在）
      logger.info(`🔍 Debug: About to save to cloud words: ${searchTerm}`);
      
      // 再次检查数据库，确保单词真的不存在
      const existingWord = await CloudWord.findOne({ word: searchTerm, language: dbLanguage, uiLanguage });
      if (existingWord) {
        logger.info(`🔄 Word found in database during AI save check: ${searchTerm}`);
        cloudWord = existingWord;
        // 更新搜索次数和最后搜索时间
        await updateCloudWordSearchStats(searchTerm, dbLanguage, uiLanguage);
      } else {
        // 如果单词不存在，创建新记录并保存到数据库
        logger.info(`📝 Creating new word data and saving to database: ${searchTerm}`);
        cloudWord = new CloudWord({
          word: searchTerm,
          language: dbLanguage,
          uiLanguage,
          phonetic: generatedData.phonetic,
          pinyin: generatedData.pinyin,
          definitions: generatedData.definitions,
          audioUrl: generatedData.audioUrl || '',
          slangMeaning: generatedData.slangMeaning || null,
          phraseExplanation: generatedData.phraseExplanation || null,
          correctedWord: generatedData.correctedWord || searchTerm,
          searchCount: 1,
          lastSearched: new Date()
        });
        
        // 保存到数据库
        await cloudWord.save();
        logger.info(`✅ New word saved to database: ${searchTerm}`);
        
        // 增加用户的贡献新词计数和经验值
        const userId = req.user?.id;
        if (userId) {
          try {
            // 添加经验值
            const experienceResult = await ExperienceService.addExperienceForContribution(userId);
            logger.info(`✅ Experience gained for contribution: ${experienceResult.xpGained} XP`);
          } catch (userUpdateError) {
            logger.error(`❌ Failed to add experience for contribution ${userId}:`, userUpdateError);
            // 不中断流程，继续执行
          }
        }
      }
      
      // 5. 保存到内存缓存
      wordCache.set(cacheKey, cloudWord.toObject());
      
      // 6. 保存搜索历史
      await saveSearchHistoryToDB(searchTerm, cloudWord.definitions[0]?.definition || '暂无释义');

      const wordData = cloudWord.toObject();
      logger.info(`📄 Word data for response:`, {
        word: wordData.word,
        correctedWord: wordData.correctedWord,
        hasCorrectedWord: !!wordData.correctedWord
      });
      
      res.json({
        success: true,
        data: {
          ...wordData,
          correctedWord: wordData.correctedWord || searchTerm
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
      
      // 记录AI错误，但不立即返回，继续使用fallback
      logger.error(`❌ AI generation failed, will use fallback for: ${searchTerm}`);
      
      // 使用模拟数据作为后备方案
      const fallbackData = getFallbackWordData(searchTerm, language);
      
      // 保存到云单词表（先检查是否已存在）
      // 再次检查数据库，确保单词真的不存在
      const existingFallbackWord = await CloudWord.findOne({ word: searchTerm, language: dbLanguage, uiLanguage });
      if (existingFallbackWord) {
        logger.info(`🔄 Word found in database during fallback save check: ${searchTerm}`);
        cloudWord = existingFallbackWord;
        // 更新搜索次数和最后搜索时间
        await updateCloudWordSearchStats(searchTerm, dbLanguage, uiLanguage);
      } else {
        // 如果单词不存在，创建新记录并保存到数据库
        logger.info(`📝 Creating fallback word data and saving to database: ${searchTerm}`);
        cloudWord = new CloudWord({
          word: searchTerm,
          language: dbLanguage,
          uiLanguage,
          phonetic: fallbackData.phonetic,
          definitions: fallbackData.definitions,
          audioUrl: fallbackData.audioUrl || '',
          slangMeaning: null, // fallback 时 slangMeaning 为 null
          phraseExplanation: null, // fallback 时 phraseExplanation 为 null
          correctedWord: searchTerm, // fallback 时使用原词作为 correctedWord
          searchCount: 1,
          lastSearched: new Date()
        });
        
        // 保存到数据库
        await cloudWord.save();
        logger.info(`✅ Fallback word saved to database: ${searchTerm}`);
        
        // 增加用户的贡献新词计数和经验值（fallback 也算贡献）
        const userId = req.user?.id;
        if (userId) {
          try {
            // 添加经验值
            const experienceResult = await ExperienceService.addExperienceForContribution(userId);
            logger.info(`✅ Experience gained for contribution (fallback): ${experienceResult.xpGained} XP`);
          } catch (userUpdateError) {
            logger.error(`❌ Failed to add experience for contribution ${userId} (fallback):`, userUpdateError);
            // 不中断流程，继续执行
          }
        }
      }
      
      // 保存到内存缓存
      wordCache.set(cacheKey, cloudWord.toObject());
      
      // 保存搜索历史
      await saveSearchHistoryToDB(searchTerm, cloudWord.definitions[0]?.definition || '暂无释义');

      const wordData = cloudWord.toObject();
      res.json({
        success: true,
        data: {
          ...wordData,
          correctedWord: wordData.correctedWord || searchTerm
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
    logger.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      word: req.body.word,
      language: req.body.language
    });
    
    // 特殊处理重复键错误
    if (error instanceof Error && error.message.includes('duplicate key error')) {
      logger.error(`❌ Duplicate key error for word: ${req.body.word}`);
      res.status(500).json({
        success: false,
        error: `搜索失败: 单词 "${req.body.word}" 已存在于数据库中，但查询时出现错误`,
        details: {
          word: req.body.word,
          language: req.body.language,
          errorType: 'duplicate_key_error'
        }
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: `搜索失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        word: req.body.word,
        language: req.body.language,
        errorType: 'general_error'
      }
    });
  }
};

// 获取热门单词 - 从云单词表获取
export const getPopularWords = async (req: Request, res: Response) => {
  try {
    logger.info('📊 Getting popular words from cloud words');
    
    const { language = 'en' } = req.query;
    
    const popularWords = await CloudWord.find({ language })
      .sort({ searchCount: -1, lastSearched: -1 })
      .limit(10)
      .select('word definitions searchCount language');
    
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
    const { userId, word, sourceShow, language = 'en', uiLanguage = 'zh-CN' } = req.body;
    
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
    const dbLanguage = mapTargetLanguage(language);
    let cloudWord = await CloudWord.findOne({ word: searchTerm, language: dbLanguage, uiLanguage });
    if (!cloudWord) {
      // 如果云单词不存在，创建它
      const generatedData = await generateWordData(searchTerm, dbLanguage, uiLanguage);
      try {
        cloudWord = new CloudWord({
          word: searchTerm,
          language: mapTargetLanguage(language),
          uiLanguage,
          phonetic: generatedData.phonetic,
          definitions: generatedData.definitions,
          audioUrl: generatedData.audioUrl || '',
          slangMeaning: generatedData.slangMeaning || null,
          phraseExplanation: generatedData.phraseExplanation || null,
          correctedWord: generatedData.correctedWord || searchTerm,
          searchCount: 1,
          lastSearched: new Date()
        });
        await cloudWord.save();
      } catch (saveError) {
        // 如果是重复键错误，重新查询已存在的单词
        if (saveError.code === 11000) {
          logger.info(`🔄 Word already exists in addToUserVocabulary, fetching from database: ${searchTerm}`);
          cloudWord = await CloudWord.findOne({ word: searchTerm, language: dbLanguage, uiLanguage });
          if (!cloudWord) {
            throw saveError; // 如果还是找不到，抛出原始错误
          }
        } else {
          throw saveError;
        }
      }
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
      language: cloudWord.language, // 新增
      sourceShow: sourceShow || null,
      collectedAt: new Date()
    });

    await userVocabulary.save();
    logger.info(`✅ Added word to user vocabulary: ${searchTerm}`);

    // 4. 添加经验值（收集新单词）
    let experienceResult = null;
    try {
      experienceResult = await ExperienceService.addExperienceForNewWord(userId);
      logger.info(`🎯 Experience gained for new word: ${experienceResult.xpGained} XP`);
    } catch (xpError) {
      logger.error('❌ Failed to add experience for new word:', xpError);
      // 不中断流程，继续执行
    }

    res.json({
      success: true,
      message: 'Word added to vocabulary successfully',
      data: {
        word: searchTerm,
        definitions: cloudWord.definitions,
        experience: experienceResult ? {
          xpGained: experienceResult.xpGained,
          newLevel: experienceResult.newLevel,
          leveledUp: experienceResult.leveledUp,
          message: experienceResult.message
        } : null
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
    const { userId, word, progress, isSuccessfulReview = false } = req.body;
    
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

    // 如果是成功复习，添加经验值
    let experienceResult = null;
    if (isSuccessfulReview) {
      try {
        experienceResult = await ExperienceService.addExperienceForReview(userId);
        logger.info(`🎯 Experience gained for review: ${experienceResult.xpGained} XP`);
      } catch (xpError) {
        logger.error('❌ Failed to add experience for review:', xpError);
        // 不中断流程，继续执行
      }
    }

    res.json({
      success: true,
      message: 'Word progress updated successfully',
      data: {
        experience: experienceResult ? {
          xpGained: experienceResult.xpGained,
          newLevel: experienceResult.newLevel,
          leveledUp: experienceResult.leveledUp,
          message: experienceResult.message
        } : null
      }
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
async function updateCloudWordSearchStats(word: string, language: string = 'en', uiLanguage: string = 'zh-CN'): Promise<void> {
  try {
    await CloudWord.updateOne(
      { word: word.toLowerCase(), language, uiLanguage },
      { 
        $inc: { searchCount: 1 },
        $set: { lastSearched: new Date() }
      }
    );
  } catch (error) {
    logger.error(`❌ Failed to update search stats for ${word} (${language}, ${uiLanguage}):`, error);
  }
}

// 更新中译英映射的搜索统计
async function updateChineseTranslationSearchStats(chineseWord: string): Promise<void> {
  try {
    await ChineseTranslation.updateOne(
      { chineseWord },
      { 
        $inc: { searchCount: 1 },
        $set: { lastSearched: new Date() }
      }
    );
  } catch (error) {
    logger.error(`❌ Failed to update Chinese translation search stats for ${chineseWord}:`, error);
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

// 获取 Google TTS 发音链接（免费，无需鉴权）
function getGoogleTTSUrl(word: string, language: string = 'en') {
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word)}&tl=${language}&client=tw-ob`;
}

// 使用 OpenAI 生成单词数据
async function generateWordData(word: string, language: string = 'en', uiLanguage: string = 'zh-CN') {
  // 根据语言生成不同的 prompt
  const { template: prompt, promptPath, promptContent } = getLanguagePrompt(word, language, uiLanguage);
  logger.info(`📝 本次查词引用的prompt文件: ${promptPath}`);
  logger.info(`📝 prompt内容: ${JSON.stringify(promptContent, null, 2)}`);

    // 优化：EN界面和CN界面分别根据目标语言返回不同的system role
    function getSystemMessage(lang: string, uiLanguage: string) {
      const isEnglishUI = uiLanguage && uiLanguage.startsWith('en');
      const isChineseUI = uiLanguage && (uiLanguage.startsWith('zh') || uiLanguage === 'zh-CN');

      const commonInstructionEN = `You are an intelligent dictionary assistant. Explain the meaning of a word like you're chatting with a curious learner. Go beyond standard definitions—include context, slang (if any), tone, and simple examples. Be clear, friendly, and natural. Always return JSON format.`;
      const commonInstructionZH = `你是一个智能词典助手。请像和好奇的语言学习者对话一样解释单词，不要只给干巴巴的释义。请提供使用语境、俚语含义（如果有）、语气、简单例句。语气自然友好。始终返回 JSON 格式。`;

      // UI语言与目标语言一致时无需特殊 role
      if ((isEnglishUI && (lang === 'en' || lang === 'en-US' || lang === 'en-GB')) ||
          (isChineseUI && (lang === 'zh' || lang === 'zh-CN'))) {
        return "";
      }

      switch (lang) {
        case 'zh': case 'zh-CN':
          return isEnglishUI
            ? `You are a Chinese-English dictionary assistant. All output should be in English. ${commonInstructionEN}`
            : commonInstructionZH;
        case 'en': case 'en-US': case 'en-GB':
          return isEnglishUI
            ? commonInstructionEN
            : `你是英语词典助手。所有输出请用中文。${commonInstructionZH}`;
        case 'ja': case 'ja-JP':
          return isEnglishUI
            ? `You are a Japanese-English dictionary assistant. All output should be in English. ${commonInstructionEN}`
            : `你是日语词典助手。所有输出请用中文。${commonInstructionZH}`;
        case 'ko': case 'ko-KR':
          return isEnglishUI
            ? `You are a Korean-English dictionary assistant. All output should be in English. ${commonInstructionEN}`
            : `你是韩语词典助手。所有输出请用中文。${commonInstructionZH}`;
        case 'fr': case 'fr-FR':
          return isEnglishUI
            ? `You are a French-English dictionary assistant. All output should be in English. ${commonInstructionEN}`
            : `你是法语词典助手。所有输出请用中文。${commonInstructionZH}`;
        case 'es': case 'es-ES':
          return isEnglishUI
            ? `You are a Spanish-English dictionary assistant. All output should be in English. ${commonInstructionEN}`
            : `你是西班牙语词典助手。所有输出请用中文。${commonInstructionZH}`;
        default:
          return isEnglishUI
            ? `You are a multilingual dictionary assistant. All output should be in English. ${commonInstructionEN}`
            : `你是多语言词典助手。所有输出请用中文。${commonInstructionZH}`;
      }
    }

    // 新增：详细log打印本次发送给OpenAI的完整prompt内容
    logger.info(`📝 发送给OpenAI的完整prompt: system: ${getSystemMessage(language, uiLanguage)} | user: ${prompt}`);

    // 使用限流器执行OpenAI请求
    const completion = await openAIRateLimiter.executeRequest(async () => {
      return await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: getSystemMessage(language, uiLanguage)
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // 添加日志查看AI原始响应
    logger.info(`🤖 AI原始响应 (${language}): ${responseText}`);

    try {
      // 清理 markdown 代码块标记
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '');
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/\s*```$/, '');
      }
      
      const parsedData = JSON.parse(cleanedResponse);
      
      // 验证和修复数据格式
      const definitions = Array.isArray(parsedData.definitions) ? parsedData.definitions.map((def: any) => ({
        partOfSpeech: def.partOfSpeech || 'n.',
        definition: def.definition || '暂无释义',
        examples: Array.isArray(def.examples) ? def.examples.map((ex: any) => {
          // 根据语言处理不同的例句格式
          if (typeof ex === 'object') {
            // 优先检查特定语言的字段
            if (language === 'ko' && ex.korean && ex.chinese) {
              return {
                english: ex.korean, // 韩文例句
                chinese: ex.chinese
              };
            } else if (language === 'ja' && ex.japanese && ex.chinese) {
              return {
                english: ex.japanese, // 日文例句
                chinese: ex.chinese,
                romaji: ex.romaji // 添加罗马音字段
              };
            } else if (ex.english && ex.chinese) {
              // 如果AI返回的是english字段，但语言不是英语，我们需要检查内容
              if (language === 'ko' || language === 'ja') {
                // 检查是否包含目标语言的字符
                const hasKoreanChars = /[가-힣]/.test(ex.english);
                const hasJapaneseChars = /[あ-んア-ン一-龯]/.test(ex.english);
                
                console.log(`🔍 语言检测: ${language}, 例句: "${ex.english}", 韩文字符: ${hasKoreanChars}, 日文字符: ${hasJapaneseChars}`);
                
                if ((language === 'ko' && hasKoreanChars) || (language === 'ja' && hasJapaneseChars)) {
                  return {
                    english: ex.english,
                    chinese: ex.chinese
                  };
                } else {
                  // AI返回了英文例句，强制替换为目标语言
                  console.log(`🔄 强制替换英文例句为原词: ${word}`);
                  return {
                    english: word, // 使用原词作为例句
                    chinese: ex.chinese
                  };
                }
              } else {
                return {
                  english: ex.english,
                  chinese: ex.chinese
                };
              }
            }
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

      // 强制替换非英语语言的例句
      if (language === 'ko' || language === 'ja') {
        definitions.forEach(def => {
          if (def.examples && def.examples.length > 0) {
            def.examples.forEach(ex => {
              // 检查例句是否包含目标语言字符
              const hasKoreanChars = /[가-힣]/.test(ex.english);
              const hasJapaneseChars = /[あ-んア-ン一-龯]/.test(ex.english);
              
              if ((language === 'ko' && !hasKoreanChars) || (language === 'ja' && !hasJapaneseChars)) {
                console.log(`🔄 强制替换例句: "${ex.english}" -> "${word}"`);
                ex.english = word;
              }
            });
          }
        });
      }

      return {
        phonetic: parsedData.phonetic || `/${word}/`,
        pinyin: parsedData.pinyin || parsedData.phonetic || undefined, // 优先使用 pinyin 字段
        definitions: definitions,
        audioUrl: getGoogleTTSUrl(word, language),
        correctedWord: parsedData.correctedWord || word,
        kana: parsedData.kana || undefined,
        slangMeaning: parsedData.slangMeaning || null,
        phraseExplanation: parsedData.phraseExplanation || null
      };
    } catch (parseError) {
      logger.error('❌ Failed to parse OpenAI response:', parseError);
      logger.error('Raw response:', responseText);
      throw new Error('Invalid response format from OpenAI');
    }
  }

// 获取后备单词数据 - 返回错误信息而不是假数据
function getFallbackWordData(word: string, language: string = 'en') {
  return {
    phonetic: '',
    definitions: [
      {
        partOfSpeech: '',
        definition: '查询失败，请重试',
        examples: []
      }
    ],
    audioUrl: '',
    slangMeaning: null,
    phraseExplanation: null
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

// 中文查英文 - 返回 1-3 个英文释义
export const translateChineseToEnglish = async (req: Request, res: Response) => {
  try {
    const { word } = req.body;
    if (!word) {
      res.status(400).json({ success: false, error: 'Word parameter is required' });
      return;
    }
    const searchTerm = word.trim();
    logger.info(`🌏 Translating Chinese to English: ${searchTerm}`);

    // 1. 检查内存缓存
    if (chineseTranslationCache.has(searchTerm)) {
      logger.info(`✅ Found in memory cache: ${searchTerm}`);
      const candidates = chineseTranslationCache.get(searchTerm)!;
      await updateChineseTranslationSearchStats(searchTerm);
      res.json({ success: true, query: searchTerm, candidates, source: 'memory_cache' });
      return;
    }

    // 2. 检查数据库缓存
    let translation = await ChineseTranslation.findOne({ chineseWord: searchTerm });
    if (translation) {
      logger.info(`✅ Found in database cache: ${searchTerm}`);
      await updateChineseTranslationSearchStats(searchTerm);
      chineseTranslationCache.set(searchTerm, translation.englishCandidates);
      res.json({ success: true, query: searchTerm, candidates: translation.englishCandidates, source: 'database_cache' });
      return;
    }

    // 3. 使用 OpenAI 生成新的翻译
    logger.info(`🤖 Generating new translation with AI: ${searchTerm}`);
    const prompt = `你是专业的中英词典助手。请将中文词语“${searchTerm}”翻译为1-3个常用英文单词，按相关性降序排列，严格只返回一个 JSON 数组，如 ["sky","heaven"]，不要其他内容。如果是常见名词（如“天空”、“城市”、“苹果”），务必给出最常用英文单词。如果没有合适的英文单词，才返回空数组 []。`;
    let candidates: string[] = [];
    let responseText = '';
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '你是中英词典助手，只返回JSON数组，不要其他内容。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 100
      });
      responseText = completion.choices[0]?.message?.content;
      candidates = JSON.parse(responseText || '[]');
      if (!Array.isArray(candidates)) candidates = [];
    } catch (e) {
      logger.error('❌ 解析 OpenAI 返回失败:', e, responseText);
      candidates = [];
    }

    // 4. fallback: 常见词典
    if (!candidates || candidates.length === 0) {
      const fallbackDict: Record<string, string[]> = {
        '天空': ['sky', 'heaven'],
        '城市': ['city', 'urban'],
        '苹果': ['apple'],
        '水': ['water'],
        '太阳': ['sun'],
        '月亮': ['moon'],
        '山': ['mountain'],
        '河': ['river'],
        '树': ['tree'],
        '花': ['flower'],
        '书': ['book'],
        '电脑': ['computer'],
        '手机': ['phone'],
        '桌子': ['table'],
        '椅子': ['chair'],
        '狗': ['dog'],
        '猫': ['cat'],
        '鸟': ['bird'],
        '鱼': ['fish'],
        '汽车': ['car'],
        '飞机': ['plane'],
        '火车': ['train'],
        '学校': ['school'],
        '老师': ['teacher'],
        '学生': ['student'],
        '朋友': ['friend'],
        '家': ['home', 'house'],
        '工作': ['work', 'job'],
        '学习': ['study', 'learn'],
        '快乐': ['happy', 'joyful'],
        '悲伤': ['sad', 'sorrow'],
        // ...可扩展
      };
      if (fallbackDict[searchTerm]) {
        candidates = fallbackDict[searchTerm];
        logger.info(`🔄 使用 fallback 词典补充: ${searchTerm} -> ${candidates}`);
      }
    }

    // 5. 保存到数据库缓存
    if (candidates && candidates.length > 0) {
      translation = new ChineseTranslation({
        chineseWord: searchTerm,
        englishCandidates: candidates,
        searchCount: 1,
        lastSearched: new Date()
      });
      await translation.save();
      logger.info(`💾 Saved new translation to database: ${searchTerm} -> ${candidates}`);
      chineseTranslationCache.set(searchTerm, candidates);
    }

    res.json({ success: true, query: searchTerm, candidates, source: candidates.length > 0 ? 'ai' : 'fallback' });
  } catch (error) {
    logger.error('❌ translateChineseToEnglish error:', error);
    res.status(500).json({ success: false, error: 'Failed to translate', message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// 测试 prompt 文件加载
export const getRateLimitStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = openAIRateLimiter.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('❌ Rate limit status error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const testPromptLoading = async (req: Request, res: Response): Promise<void> => {
  try {
    const { uiLanguage = 'zh-CN', language = 'en' } = req.query;
    
    logger.info(`🧪 测试 prompt 文件加载: uiLanguage=${uiLanguage}, language=${language}`);
    
    try {
      const { template, promptPath, promptContent } = getPromptTemplate(uiLanguage as string, language as string, 'definition');
      
      res.json({
        success: true,
        data: {
          uiLanguage,
          language,
          template,
          message: 'Prompt 文件加载成功'
        }
      });
    } catch (error) {
      res.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          uiLanguage,
          language,
          message: 'Prompt 文件加载失败'
        }
      });
    }
  } catch (error) {
    logger.error('❌ Test prompt loading error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test prompt loading'
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
  testOpenAI,
  translateChineseToEnglish,
  testPromptLoading
}; 