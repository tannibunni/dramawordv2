import { Request, Response } from 'express';
import OpenAI from 'openai';
import mongoose from 'mongoose';
import { Word, IWord } from '../models/Word';
import { SearchHistory, ISearchHistory } from '../models/SearchHistory';
import { CloudWord } from '../models/CloudWord';
import UserVocabulary from '../models/UserVocabulary';
import { ChineseTranslation } from '../models/ChineseTranslation';
import { User } from '../models/User';
import { ExperienceService } from '../services/experienceService';
import { translationService } from '../services/translationService';
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

const openai = apiKey ? new OpenAI({
  apiKey: apiKey,
}) : null;

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

// 查询中文词汇详细信息
export const getChineseWordDetails = async (req: Request, res: Response) => {
  console.log(`🚀 getChineseWordDetails 函数被调用！`);
  try {
    const { word } = req.params;
    const { uiLanguage = 'en-US' } = req.query;

    console.log(`🔍 查询中文词汇详细信息: ${word}, UI语言: ${uiLanguage}`);
    console.log(`🔍 请求参数详情:`, {
      params: req.params,
      query: req.query,
      path: req.path,
      method: req.method
    });

    // 检查缓存
    const cacheKey = `chinese_${word}_${uiLanguage}`;
    console.log(`🔍 缓存键: ${cacheKey}`);
    console.log(`🔍 缓存检查: word=${word}, uiLanguage=${uiLanguage}`);
    
    if (wordCache.has(cacheKey)) {
      console.log(`✅ 从缓存返回中文词汇: ${word}`);
      const cachedData = wordCache.get(cacheKey);
      console.log(`🔍 缓存数据:`, cachedData);
      return res.json({
        success: true,
        data: cachedData
      });
    }

    // 使用OpenAI生成中文词汇详细信息
    const prompt = `请为中文词汇 "${word}" 生成详细信息，包括：

1. 拼音（带声调）
2. 英文释义（简洁准确）
3. 词性
4. 例句（中文+拼音+英文翻译）

返回JSON格式：
{
  "word": "${word}",
  "pinyin": "拼音带声调",
  "definitions": [
    {
      "partOfSpeech": "词性",
      "definition": "英文释义",
      "examples": [
        {
          "chinese": "中文例句",
          "pinyin": "例句拼音带声调",
          "english": "英文翻译"
        }
      ]
    }
  ]
}

要求：
- 拼音必须准确，带声调符号
- 英文释义要简洁准确
- 例句要实用，包含拼音和英文翻译
- 只返回JSON，不要其他内容`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.3
    });

    const response = completion.choices[0].message.content;
    // 清理控制字符，防止 JSON 解析错误
    const cleanedResponse = response.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    const wordData = JSON.parse(cleanedResponse);

    // 构建返回数据
    const result = {
      word: wordData.word,
      language: 'zh',
      uiLanguage: uiLanguage,
      phonetic: wordData.pinyin,
      pinyin: '', // 中文词汇的拼音统一使用 phonetic 字段
      definitions: wordData.definitions.map((def: any) => ({
        partOfSpeech: def.partOfSpeech || 'n.',
        definition: def.definition,
        examples: def.examples.map((ex: any) => ({
          chinese: ex.chinese,
          pinyin: ex.pinyin,
          english: ex.english
        }))
      })),
      audioUrl: generateChineseAudioUrl(wordData.pinyin || wordData.word, 'zh'),
      slangMeaning: null,
      phraseExplanation: null,
      correctedWord: wordData.word,
      searchCount: 1,
      lastSearched: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 缓存结果
    console.log(`🔍 设置缓存: ${cacheKey}`);
    wordCache.set(cacheKey, result);

    console.log(`✅ 生成中文词汇详细信息: ${word}`);
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ 查询中文词汇详细信息失败:', error);
    res.status(500).json({
      success: false,
      error: '查询中文词汇详细信息失败',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
};

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

function mapPromptFileName(language: string) {
  // 映射到prompt文件名
  if (language === 'zh' || language === 'zh-CN') return 'zh-CN';
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
  const mappedLang = mapPromptFileName(language); // 使用新的文件名映射函数
  logger.info(`🔍 getPromptTemplate 映射: mappedUI=${mappedUI}, mappedLang=${mappedLang}`);
  
  // 特殊逻辑：英文UI用户学习英文时，使用中文UI的prompt以返回中文释义
  let effectiveUI = mappedUI;
  if (mappedUI === 'en' && mappedLang === 'en') {
    effectiveUI = 'zh-CN';
    logger.info(`🔄 英文UI用户学习英文，切换到中文UI prompt以返回中文释义`);
  }
  
  // 优先查 /prompts/{effectiveUI}/{language}.json
  const promptDir = path.join(__dirname, '../../prompts', effectiveUI);
  const promptPath = path.join(promptDir, `${mappedLang}.json`);
  logger.info(`🔍 Prompt 路径调试: __dirname=${__dirname}, promptDir=${promptDir}, promptPath=${promptPath}`);
  if (fs.existsSync(promptPath)) {
    const templates = JSON.parse(fs.readFileSync(promptPath, 'utf-8'));
    logger.info(`✅ 找到 prompt 文件: ${promptPath}`);
    logger.info(`📄 Prompt 内容: ${JSON.stringify(templates[type], null, 2)}`);
    // 新增：返回时带上路径和内容，便于后续log
    return { template: templates[type], promptPath, promptContent: templates[type] };
  }
  // fallback: /prompts/{effectiveUI}-{language}.json
  const altPromptPath = path.join(__dirname, '../../prompts', `${effectiveUI}-${mappedLang}.json`);
  if (fs.existsSync(altPromptPath)) {
    const templates = JSON.parse(fs.readFileSync(altPromptPath, 'utf-8'));
    logger.info(`✅ 找到 fallback prompt 文件: ${altPromptPath}`);
    logger.info(`📄 Prompt 内容: ${JSON.stringify(templates[type], null, 2)}`);
    return { template: templates[type], promptPath: altPromptPath, promptContent: templates[type] };
  }
  // fallback: prompts/{effectiveUI}/default.json
  const fallbackPath = path.join(promptDir, 'default.json');
  if (fs.existsSync(fallbackPath)) {
    logger.info(`🔄 使用 fallback: ${fallbackPath}`);
    const templates = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
    return { template: templates[type], promptPath: fallbackPath, promptContent: templates[type] };
  }
  // fallback: prompts/{effectiveUI}.json（兼容老结构）
  const legacyPath = path.join(__dirname, '../../prompts', `${effectiveUI}.json`);
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
  
  // 移除强制英文释义的逻辑，让prompt文件本身决定输出语言
  // 这样英文UI用户学习英文时，会使用en/en.json中的中文释义prompt
  // 中文UI用户学习英文时，会使用zh-CN/en.json中的中文释义prompt
  
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
      
      // 改进错误日志记录，提供更详细的错误信息
      let errorDetails: {
        message: string;
        type: string;
        status: string;
        word: any;
        stack?: string;
      } = {
        message: 'Unknown error',
        type: 'Unknown',
        status: 'Unknown',
        word: searchTerm
      };
      
      if (aiError instanceof Error) {
        errorDetails.message = aiError.message;
        errorDetails.type = aiError.constructor.name;
        errorDetails.stack = aiError.stack;
      }
      
      // 检查是否是OpenAI API错误
      if (aiError && typeof aiError === 'object' && 'status' in aiError) {
        errorDetails.status = (aiError as any).status;
        if ('error' in aiError && aiError.error && typeof aiError.error === 'object') {
          const openaiError = aiError.error as any;
          if ('message' in openaiError) {
            errorDetails.message = openaiError.message;
          }
          if ('type' in openaiError) {
            errorDetails.type = openaiError.type;
          }
        }
      }
      
      logger.error(`❌ OpenAI API Error details:`, errorDetails);
      
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

// 获取最近搜索 - 从搜索历史表获取（支持分页）
export const getRecentSearches = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30; // 默认30条，最大30条
    const skip = (page - 1) * limit;
    
    if (!userId) {
      // 如果没有用户ID，返回空数组
      logger.info('📝 No user ID provided, returning empty recent searches');
      return res.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          hasMore: false
        }
      });
    }
    
    logger.info(`📝 Getting recent searches for user: ${userId}, page: ${page}, limit: ${limit}`);
    
    // 限制最大数量为30条
    const actualLimit = Math.min(limit, 30);
    
    // 使用聚合管道进行去重，每个单词只保留最新的一条记录
    const recentSearches = await SearchHistory.aggregate([
      // 首先按用户ID过滤
      { $match: { userId: userId } },
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
      // 按时间戳排序
      {
        $sort: { timestamp: -1 }
      },
      // 分页
      { $skip: skip },
      { $limit: actualLimit }
    ]);
    
    // 获取总数（用于分页信息）
    const totalCount = await SearchHistory.aggregate([
      { $match: { userId: userId } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$word',
          word: { $first: '$word' }
        }
      },
      { $count: 'total' }
    ]);
    
    const total = totalCount.length > 0 ? totalCount[0].total : 0;
    const hasMore = skip + actualLimit < total;
    
    const formattedSearches = recentSearches.map(search => ({
      word: search.word,
      definition: search.definition,
      timestamp: search.timestamp
    }));
    
    res.json({
      success: true,
      data: formattedSearches,
      pagination: {
        page,
        limit: actualLimit,
        total,
        hasMore
      }
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
    const userId = req.user?.id || req.body.userId;
    
    if (!word) {
      res.status(400).json({
        success: false,
        error: 'Word parameter is required'
      });
      return;
    }
    
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
      return;
    }

    const searchHistory = new SearchHistory({
      word: word.toLowerCase().trim(),
      definition: definition || '暂无释义',
      timestamp: timestamp || Date.now(),
      userId: userId // 添加用户ID
    });
    
    await searchHistory.save();
    logger.info(`💾 Saved search history: ${word} for user: ${userId}`);
    
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
    
    // 直接查询UserVocabulary，不依赖$lookup
    const userVocabulary = await UserVocabulary.find({ userId: userId });
    
    logger.info(`📊 Found ${userVocabulary.length} vocabulary records for user: ${userId}`);
    
    // 转换为前端需要的格式
    const formattedVocabulary = userVocabulary.map(record => ({
      _id: record._id,
      word: record.word, // 直接使用UserVocabulary中的word字段
      language: record.language, // 添加语言字段
      mastery: record.mastery,
      reviewCount: record.reviewCount,
      correctCount: record.correctCount,
      incorrectCount: record.incorrectCount,
      consecutiveCorrect: record.consecutiveCorrect,
      consecutiveIncorrect: record.consecutiveIncorrect,
      lastReviewDate: record.lastReviewDate,
      nextReviewDate: record.nextReviewDate,
      notes: record.notes,
      tags: record.tags,
      sourceShow: record.sourceShow,
      collectedAt: record.collectedAt
    }));
    
    res.json({
      success: true,
      data: formattedVocabulary
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

    // 查找用户单词本记录，如果不存在则创建
    let userWord = await UserVocabulary.findOne({
      userId: userId,
      word: searchTerm
    });

    if (!userWord) {
      logger.info(`📝 Creating new vocabulary entry for word: ${searchTerm}`);
      
      // 先查找或创建对应的CloudWord记录
      let cloudWord = await CloudWord.findOne({ 
        word: searchTerm, 
        language: 'en', 
        uiLanguage: 'zh-CN' 
      });
      
      if (!cloudWord) {
        logger.info(`📝 Creating new cloud word for: ${searchTerm}`);
        // 生成单词数据
        const generatedData = await generateWordData(searchTerm, 'en', 'zh-CN');
        cloudWord = new CloudWord({
          word: searchTerm,
          language: 'en',
          uiLanguage: 'zh-CN',
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
        logger.info(`✅ Created new cloud word: ${searchTerm}`);
      }
      
      // 创建新的用户词汇表记录，使用正确的wordId
      userWord = new UserVocabulary({
        userId: userId,
        word: searchTerm,
        wordId: cloudWord._id, // 使用正确的CloudWord ID
        language: 'en', // 默认英语
        reviewCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        mastery: 1,
        interval: 24, // 默认24小时
        easeFactor: 2.5,
        totalStudyTime: 0,
        averageResponseTime: 0,
        confidence: 1,
        lastReviewDate: new Date(),
        nextReviewDate: new Date(),
        tags: [] // 空标签数组
      });
    }

    // 更新学习进度 - 只更新特定字段，避免覆盖其他重要字段
    try {
      if (progress.reviewCount !== undefined) userWord.reviewCount = progress.reviewCount;
      if (progress.correctCount !== undefined) userWord.correctCount = progress.correctCount;
      if (progress.incorrectCount !== undefined) userWord.incorrectCount = progress.incorrectCount;
      if (progress.consecutiveCorrect !== undefined) userWord.consecutiveCorrect = progress.consecutiveCorrect;
      if (progress.consecutiveIncorrect !== undefined) userWord.consecutiveIncorrect = progress.consecutiveIncorrect;
      if (progress.mastery !== undefined) userWord.mastery = progress.mastery;
      if (progress.interval !== undefined) userWord.interval = progress.interval;
      if (progress.easeFactor !== undefined) userWord.easeFactor = progress.easeFactor;
      if (progress.totalStudyTime !== undefined) userWord.totalStudyTime = progress.totalStudyTime;
      if (progress.averageResponseTime !== undefined) userWord.averageResponseTime = progress.averageResponseTime;
      if (progress.confidence !== undefined) userWord.confidence = progress.confidence;
      
      // 安全处理日期字段
      if (progress.nextReviewDate !== undefined) {
        try {
          userWord.nextReviewDate = new Date(progress.nextReviewDate);
        } catch (dateError) {
          logger.warn(`⚠️ Invalid nextReviewDate format: ${progress.nextReviewDate}, using current date`);
          userWord.nextReviewDate = new Date();
        }
      }
      
      userWord.lastReviewDate = new Date();
    } catch (updateError) {
      logger.error('❌ Error updating progress fields:', updateError);
      throw updateError;
    }
    
    await userWord.save();
    logger.info(`✅ Updated progress for word: ${searchTerm}`);

    // 添加经验值（记得+2，不记得+1）
    let experienceResult = null;
    try {
      experienceResult = await ExperienceService.addExperienceForReview(userId, isSuccessfulReview);
      logger.info(`🎯 Experience gained for review: ${experienceResult.xpGained} XP (${isSuccessfulReview ? 'correct' : 'incorrect'})`);
    } catch (xpError) {
      logger.error('❌ Failed to add experience for review:', xpError);
      // 不中断流程，继续执行
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
      
      // 清理控制字符，防止 JSON 解析错误
      cleanedResponse = cleanedResponse.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      const parsedData = JSON.parse(cleanedResponse);
      
      // 验证和修复数据格式
      const definitions = Array.isArray(parsedData.definitions) ? parsedData.definitions.map((def: any) => ({
        partOfSpeech: def.partOfSpeech || 'n.',
        definition: def.definition || '暂无释义',
        examples: Array.isArray(def.examples) ? def.examples.map((ex: any) => {
          // 根据语言处理不同的例句格式
          console.log(`🔍 例句处理调试 - 语言: ${language}, 原始例句数据:`, ex);
          if (typeof ex === 'object') {
            // 优先检查特定语言的字段
            if (language === 'ko' && ex.korean) {
              return {
                korean: ex.korean, // 韩文例句
                chinese: ex.chinese || ex.english // 中文翻译或英文翻译
              };
            } else if (language === 'ja') {
              if (ex.japanese) {
                console.log(`🔍 找到日语例句: ${ex.japanese}`);
                return {
                  japanese: ex.japanese, // 日文例句
                  chinese: ex.chinese || ex.english, // 中文翻译或英文翻译
                  romaji: ex.romaji // 添加罗马音字段
                };
              } else if (ex.english) {
                // 检查 english 字段是否包含日文字符
                const hasJapaneseChars = /[あ-んア-ン一-龯]/.test(ex.english);
                console.log(`🔍 检查 english 字段是否包含日文: "${ex.english}", 结果: ${hasJapaneseChars}`);
                if (hasJapaneseChars) {
                  return {
                    japanese: ex.english, // 将包含日文的 english 字段作为日语例句
                    chinese: ex.chinese, // 中文翻译
                    romaji: ex.romaji // 添加罗马音字段
                  };
                }
              }
            } else if (language === 'fr' && ex.french) {
              return {
                french: ex.french, // 法文例句
                chinese: ex.chinese || ex.english // 中文翻译或英文翻译
              };
            } else if (language === 'es' && ex.spanish) {
              return {
                spanish: ex.spanish, // 西班牙文例句
                chinese: ex.chinese || ex.english // 中文翻译或英文翻译
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
              if (language === 'ko' && ex.korean) {
                // 检查韩语例句是否包含韩文字符
                const hasKoreanChars = /[가-힣]/.test(ex.korean);
                if (!hasKoreanChars) {
                  console.log(`🔄 强制替换韩语例句: "${ex.korean}" -> "${word}"`);
                  ex.korean = word;
                }
              } else if (language === 'ja' && ex.japanese) {
                // 检查日语例句是否包含日文字符
                const hasJapaneseChars = /[あ-んア-ン一-龯]/.test(ex.japanese);
                if (!hasJapaneseChars) {
                  console.log(`🔄 强制替换日语例句: "${ex.japanese}" -> "${word}"`);
                  ex.japanese = word;
                }
              }
            });
          }
        });
      }

      // 处理 slangMeaning 和 phraseExplanation，确保它们是字符串
      let slangMeaning = null;
      let phraseExplanation = null;
      
      if (parsedData.slangMeaning) {
        if (typeof parsedData.slangMeaning === 'string') {
          slangMeaning = parsedData.slangMeaning;
        } else if (typeof parsedData.slangMeaning === 'object' && parsedData.slangMeaning.definition) {
          slangMeaning = parsedData.slangMeaning.definition;
        }
      }
      
      if (parsedData.phraseExplanation) {
        if (typeof parsedData.phraseExplanation === 'string') {
          phraseExplanation = parsedData.phraseExplanation;
        } else if (typeof parsedData.phraseExplanation === 'object' && parsedData.phraseExplanation.definition) {
          phraseExplanation = parsedData.phraseExplanation.definition;
        }
      }
      
      // 添加调试日志
      logger.info(`🔍 数据处理调试 - slangMeaning: ${typeof slangMeaning} = ${JSON.stringify(slangMeaning)}`);
      logger.info(`🔍 数据处理调试 - phraseExplanation: ${typeof phraseExplanation} = ${JSON.stringify(phraseExplanation)}`);

      // 如果是日语词汇，使用智能翻译API替换释义
      if (language === 'ja') {
        try {
          logger.info(`🔍 开始智能翻译日语: ${word}, UI语言: ${uiLanguage}`);
          const translationResult = await translationService.smartTranslateJapanese(
            parsedData.correctedWord || word, 
            uiLanguage === 'zh-CN' ? 'zh' : 'en'
          );
          
          if (translationResult.success && translationResult.translatedText) {
            // 替换第一个定义的释义
            if (definitions.length > 0) {
              definitions[0].definition = translationResult.translatedText;
              logger.info(`✅ 日语智能翻译成功: ${word} -> ${translationResult.translatedText}`);
            }
          } else {
            logger.warn(`⚠️ 日语智能翻译失败: ${word}, 使用原始释义`);
          }
        } catch (error) {
          logger.error(`❌ 日语智能翻译异常: ${word}`, error);
        }
      }

      return {
        phonetic: parsedData.phonetic || `/${word}/`,
        pinyin: parsedData.pinyin || parsedData.phonetic || undefined, // 优先使用 pinyin 字段
        candidates: parsedData.candidates || [], // 添加候选词数组
        definitions: definitions,
        audioUrl: getGoogleTTSUrl(parsedData.phonetic || word, language),
        correctedWord: parsedData.correctedWord || word,
        kana: parsedData.kana || undefined,
        slangMeaning: slangMeaning,
        phraseExplanation: phraseExplanation,
        language: language // 添加语言字段
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
    phraseExplanation: null,
    correctedWord: word,
    language: language // 添加语言字段
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
    // 检查环境变量
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    const openAIKeyLength = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0;
    const openAIKeyPrefix = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 'Not set';
    
    logger.info(`🔍 OpenAI配置检查:`, {
      hasKey: hasOpenAIKey,
      keyLength: openAIKeyLength,
      keyPrefix: openAIKeyPrefix
    });
    
    if (!process.env.OPENAI_API_KEY) {
      res.json({
        success: false,
        error: 'OPENAI_API_KEY not found',
        details: {
          hasKey: false,
          keyLength: 0,
          environment: process.env.NODE_ENV || 'unknown'
        }
      });
      return;
    }

    // 测试API连接
    logger.info(`🧪 开始测试OpenAI API连接...`);
    const startTime = Date.now();
    
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

    const responseTime = Date.now() - startTime;
    const response = completion.choices[0]?.message?.content;
    
    logger.info(`✅ OpenAI API测试成功:`, {
      responseTime: `${responseTime}ms`,
      model: completion.model,
      usage: completion.usage
    });
    
    res.json({
      success: true,
      data: {
        response,
        model: completion.model,
        usage: completion.usage,
        responseTime: `${responseTime}ms`
      },
      config: {
        hasKey: true,
        keyLength: openAIKeyLength,
        keyPrefix: openAIKeyPrefix,
        environment: process.env.NODE_ENV || 'unknown'
      }
    });
  } catch (error) {
    logger.error('❌ OpenAI test error:', error);
    
    // 提供详细的错误信息
    let errorDetails = {
      message: 'Unknown error',
      type: 'Unknown',
      status: 'Unknown'
    };
    
    if (error instanceof Error) {
      errorDetails.message = error.message;
      errorDetails.type = error.constructor.name;
    }
    
    if (error && typeof error === 'object' && 'status' in error) {
      errorDetails.status = (error as any).status;
      if ('error' in error && error.error && typeof error.error === 'object') {
        const openaiError = error.error as any;
        if ('message' in openaiError) {
          errorDetails.message = openaiError.message;
        }
        if ('type' in openaiError) {
          errorDetails.type = openaiError.type;
        }
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'OpenAI connection test failed',
      details: errorDetails,
      config: {
        hasKey: !!process.env.OPENAI_API_KEY,
        keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
        keyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 'Not set',
        environment: process.env.NODE_ENV || 'unknown'
      }
    });
  }
};

// 英文查中文翻译 - 返回 1-3 个中文释义
export const translateEnglishToChinese = async (req: Request, res: Response) => {
  try {
    const { word } = req.body;
    if (!word) {
      res.status(400).json({ success: false, error: 'Word parameter is required' });
      return;
    }
    
    const searchTerm = word.trim();
    logger.info(`🌏 Translating English to Chinese: ${searchTerm}`);

    // 1. 检查内存缓存
    const cacheKey = `en_to_zh_${searchTerm}`;
    if (chineseTranslationCache.has(cacheKey)) {
      logger.info(`✅ Found in memory cache: ${cacheKey}`);
      const candidates = chineseTranslationCache.get(cacheKey)!;
      res.json({ success: true, query: searchTerm, candidates, source: 'memory_cache' });
      return;
    }

    // 2. 使用 Google 翻译 API 或 OpenAI 生成新的翻译
    logger.info(`🤖 Generating new translation: ${searchTerm} -> Chinese`);
    
    let candidates: string[] = [];
    let responseText = '';
    try {
      // 使用 OpenAI 进行英文到中文翻译
      const prompt = `你是专业的英文翻译助手。请将英文单词"${searchTerm}"翻译为1-3个常用中文词汇，按相关性降序排列，严格只返回一个 JSON 数组，如 ["词汇1","词汇2"]，不要其他内容。如果是常见名词，务必给出最常用中文词汇。如果没有合适的中文词汇，才返回空数组 []。`;
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '你是英文到中文翻译助手，只返回JSON数组，不要其他内容。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 100
      });
      responseText = completion.choices[0]?.message?.content;
      // 清理控制字符，防止 JSON 解析错误
      const cleanedResponse = (responseText || '').replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      candidates = JSON.parse(cleanedResponse || '[]');
      if (!Array.isArray(candidates)) candidates = [];
    } catch (e) {
      logger.error('❌ 解析 OpenAI 返回失败:', e, responseText);
      candidates = [];
    }

    // 3. fallback: 常见词典
    if (!candidates || candidates.length === 0) {
      const fallbackDict: Record<string, string[]> = {
        'hello': ['你好', '您好'],
        'world': ['世界'],
        'love': ['爱', '爱情'],
        'time': ['时间', '时候'],
        'water': ['水'],
        'food': ['食物', '食品'],
        'house': ['房子', '房屋'],
        'car': ['汽车', '车'],
        'book': ['书', '书籍'],
        'school': ['学校']
      };
      
      if (fallbackDict[searchTerm.toLowerCase()]) {
        candidates = fallbackDict[searchTerm.toLowerCase()];
        logger.info(`✅ 使用fallback词典: ${searchTerm} -> ${candidates.join(', ')}`);
      }
    }

    // 4. 缓存结果
    if (candidates && candidates.length > 0) {
      chineseTranslationCache.set(cacheKey, candidates);
    }

    res.json({ 
      success: true, 
      query: searchTerm, 
      candidates: candidates || [],
      source: 'ai_translation'
    });

  } catch (error) {
    logger.error('❌ Translate English to Chinese error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to translate English to Chinese'
    });
  }
};

// 中文查目标语言翻译 - 返回 1-3 个释义
export const translateChineseToEnglish = async (req: Request, res: Response) => {
  try {
    const { word, targetLanguage = 'en' } = req.body;
    if (!word) {
      res.status(400).json({ success: false, error: 'Word parameter is required' });
      return;
    }
    
    const searchTerm = word.trim();
    const targetLang = targetLanguage || 'en';
    logger.info(`🌏 Translating Chinese to ${targetLang}: ${searchTerm}`);

    // 1. 检查内存缓存（使用包含目标语言的键）
    const cacheKey = `${searchTerm}_${targetLang}`;
    if (chineseTranslationCache.has(cacheKey)) {
      logger.info(`✅ Found in memory cache: ${cacheKey}`);
      const candidates = chineseTranslationCache.get(cacheKey)!;
      await updateChineseTranslationSearchStats(searchTerm);
      res.json({ success: true, query: searchTerm, candidates, source: 'memory_cache' });
      return;
    }

    // 2. 检查数据库缓存（暂时保持原有逻辑，后续可以扩展数据库结构）
    let translation = await ChineseTranslation.findOne({ chineseWord: searchTerm });
    if (translation && targetLang === 'en') {
      logger.info(`✅ Found in database cache: ${searchTerm}`);
      await updateChineseTranslationSearchStats(searchTerm);
      chineseTranslationCache.set(cacheKey, translation.englishCandidates);
      res.json({ success: true, query: searchTerm, candidates: translation.englishCandidates, source: 'database_cache' });
      return;
    }

    // 3. 根据目标语言选择翻译方法
    let candidates: string[] = [];
    
    if (targetLang === 'ja') {
      // 使用Azure日文翻译服务
      logger.info(`🌏 使用Azure翻译服务: ${searchTerm} -> 日语`);
      try {
        const { JapaneseTranslationService } = await import('../services/japaneseTranslationService');
        const japaneseService = JapaneseTranslationService.getInstance();
        const translationResult = await japaneseService.translateToJapanese(searchTerm);
        
        if (translationResult.success && translationResult.data) {
          candidates = [translationResult.data.japaneseText];
          logger.info(`✅ Azure翻译成功: ${searchTerm} -> ${translationResult.data.japaneseText}`);
        } else {
          logger.error(`❌ Azure翻译失败: ${translationResult.error}`);
          candidates = [];
        }
      } catch (azureError) {
        logger.error(`❌ Azure翻译服务不可用: ${azureError.message}`);
        // 降级到OpenAI
        candidates = await generateTranslationWithOpenAI(searchTerm, targetLang);
        
        // 如果OpenAI也失败，使用Google翻译作为最后降级
        if (!candidates || candidates.length === 0) {
          logger.info(`🔄 Azure和OpenAI都失败，尝试Google翻译降级: ${searchTerm} -> ${targetLang}`);
          candidates = await generateTranslationWithGoogle(searchTerm, targetLang);
        }
      }
    } else {
      // 使用OpenAI翻译其他语言
      candidates = await generateTranslationWithOpenAI(searchTerm, targetLang);
      
      // 如果OpenAI失败，使用Google翻译作为降级
      if (!candidates || candidates.length === 0) {
        logger.info(`🔄 OpenAI失败，尝试Google翻译降级: ${searchTerm} -> ${targetLang}`);
        candidates = await generateTranslationWithGoogle(searchTerm, targetLang);
      }
    }

    // 4. fallback: 常见词典（仅对英文）
    if (!candidates || candidates.length === 0 && targetLang === 'en') {
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

    // 5. 保存到数据库缓存（仅对英文，保持原有逻辑）
    if (candidates && candidates.length > 0 && targetLang === 'en') {
      translation = new ChineseTranslation({
        chineseWord: searchTerm,
        englishCandidates: candidates,
        searchCount: 1,
        lastSearched: new Date()
      });
      await translation.save();
      logger.info(`💾 Saved to database: ${searchTerm} -> ${candidates}`);
    }

    // 6. 保存到内存缓存
    if (candidates && candidates.length > 0) {
      chineseTranslationCache.set(cacheKey, candidates);
      logger.info(`💾 Saved to memory cache: ${cacheKey} -> ${candidates}`);
    }

    // 7. 更新搜索统计
    await updateChineseTranslationSearchStats(searchTerm);

    res.json({ 
      success: true, 
      query: searchTerm, 
      candidates, 
      source: 'ai_generated',
      targetLanguage: targetLang
    });

  } catch (error) {
    logger.error('❌ Translation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Translation failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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

// 从云词库获取单词数据
export const getCloudWord = async (req: Request, res: Response): Promise<void> => {
  try {
    const word = req.params.word;
    const language = req.query.language as string || 'en';
    const uiLanguage = req.query.uiLanguage as string || 'zh-CN';
    
    logger.info(`☁️ 从云词库获取单词: ${word} (语言: ${language}, UI语言: ${uiLanguage})`);
    
    if (!word) {
      res.status(400).json({
        success: false,
        message: '单词参数不能为空'
      });
      return;
    }
    
    // 从CloudWord模型中查找
    const cloudWord = await CloudWord.findOne({
      word: word.toLowerCase(),
      language: mapTargetLanguage(language)
    });
    
    if (cloudWord) {
      logger.info(`✅ 从云词库找到单词: ${word}`);
      
      // 转换为前端需要的格式
      const wordData = {
        word: cloudWord.word,
        phonetic: cloudWord.phonetic,
        pinyin: cloudWord.pinyin,
        definitions: cloudWord.definitions || [],
        audioUrl: cloudWord.audioUrl,
        correctedWord: cloudWord.correctedWord,
        slangMeaning: cloudWord.slangMeaning,
        phraseExplanation: cloudWord.phraseExplanation,
        searchCount: cloudWord.searchCount,
        createdAt: cloudWord.createdAt,
        updatedAt: cloudWord.updatedAt,
        language: cloudWord.language // 添加语言字段
      };
      
      res.json({
        success: true,
        message: '从云词库获取成功',
        data: wordData
      });
    } else {
      logger.info(`⚠️ 云词库中未找到单词: ${word}`);
      res.json({
        success: false,
        message: '云词库中未找到该单词',
        data: null
      });
    }
  } catch (error) {
    logger.error('❌ 从云词库获取单词失败:', error);
    res.status(500).json({
      success: false,
      message: '从云词库获取单词失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 清除用户词汇表
export const clearUserVocabulary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
      return;
    }

    logger.info(`🗑️ Clearing vocabulary for user: ${userId}`);

    // 删除用户词汇表中的所有记录
    const result = await UserVocabulary.deleteMany({ userId: userId });

    logger.info(`✅ Cleared ${result.deletedCount} vocabulary records for user: ${userId}`);

    res.json({
      success: true,
      message: 'User vocabulary cleared successfully',
      data: {
        userId: userId,
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    logger.error('❌ Clear user vocabulary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear user vocabulary'
    });
  }
};

// 清除用户搜索历史
export const clearUserSearchHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
      return;
    }

    logger.info(`🗑️ Clearing search history for user: ${userId}`);

    // 删除搜索历史表中的所有记录
    const result = await SearchHistory.deleteMany({});

    logger.info(`✅ Cleared ${result.deletedCount} search history records`);

    res.json({
      success: true,
      message: 'Search history cleared successfully',
      data: {
        userId: userId,
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    logger.error('❌ Clear search history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear search history'
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
  clearUserVocabulary,
  clearUserSearchHistory,
  checkEnvironment,
  testOpenAI,
  translateChineseToEnglish,
  testPromptLoading
};

// 生成中文词汇发音URL
function generateChineseAudioUrl(word: string, language: string = 'zh'): string {
  try {
    // 使用Google TTS发音
    const encodedWord = encodeURIComponent(word);
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedWord}&tl=${language}&client=tw-ob`;
  } catch (error) {
    console.error('生成发音URL失败:', error);
    return '';
  }
}

// 使用OpenAI生成翻译的辅助函数
async function generateTranslationWithGoogle(searchTerm: string, targetLang: string): Promise<string[]> {
  try {
    logger.info(`🌐 使用Google翻译: ${searchTerm} -> ${targetLang}`);
    
    const encodedText = encodeURIComponent(searchTerm);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh&tl=${targetLang}&dt=t&q=${encodedText}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Google翻译API返回状态: ${response.status}`);
    }
    
    const data = await response.json();
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      const translatedText = data[0][0][0];
      logger.info(`✅ Google翻译成功: ${searchTerm} -> ${translatedText}`);
      return [translatedText];
    } else {
      throw new Error('Google翻译返回格式无效');
    }
    
  } catch (error) {
    logger.error(`❌ Google翻译失败: ${error}`);
    return [];
  }
}

async function generateTranslationWithOpenAI(searchTerm: string, targetLang: string): Promise<string[]> {
  try {
    if (!openai) {
      logger.warn(`⚠️ OpenAI客户端未初始化，跳过OpenAI翻译: ${searchTerm}`);
      return [];
    }
    
    logger.info(`🤖 使用OpenAI翻译: ${searchTerm} -> ${targetLang}`);
    
    const targetLanguageName = getLanguageName(targetLang);
    const prompt = `你是专业的中文翻译助手。请将中文词语"${searchTerm}"翻译为1-3个常用${targetLanguageName}单词，按相关性降序排列，严格只返回一个 JSON 数组，如 ["word1","word2"]，不要其他内容。如果是常见名词，务必给出最常用${targetLanguageName}单词。如果没有合适的${targetLanguageName}单词，才返回空数组 []。`;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: `你是中文到${targetLanguageName}翻译助手，只返回JSON数组，不要其他内容。` },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 100
    });
    
    const responseText = completion.choices[0]?.message?.content;
    const cleanedResponse = (responseText || '').replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    const candidates = JSON.parse(cleanedResponse || '[]');
    
    if (!Array.isArray(candidates)) {
      logger.warn(`⚠️ OpenAI返回不是数组: ${candidates}`);
      return [];
    }
    
    logger.info(`✅ OpenAI翻译成功: ${searchTerm} -> ${candidates.join(', ')}`);
    return candidates;
  } catch (error) {
    logger.error(`❌ OpenAI翻译失败: ${error}`);
    return [];
  }
} 