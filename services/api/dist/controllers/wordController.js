"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wordController = exports.testOpenAI = exports.checkEnvironment = exports.clearUserHistory = exports.clearAllData = exports.removeFromUserVocabulary = exports.updateWordProgress = exports.addToUserVocabulary = exports.getUserVocabulary = exports.saveSearchHistory = exports.getRecentSearches = exports.getPopularWords = exports.searchWord = void 0;
const openai_1 = __importDefault(require("openai"));
const Word_1 = require("../models/Word");
const SearchHistory_1 = require("../models/SearchHistory");
const CloudWord_1 = __importDefault(require("../models/CloudWord"));
const UserVocabulary_1 = __importDefault(require("../models/UserVocabulary"));
const logger_1 = require("../utils/logger");
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    logger_1.logger.error('❌ OPENAI_API_KEY environment variable is missing!');
}
const openai = new openai_1.default({
    apiKey: apiKey || 'dummy-key',
});
const wordCache = new Map();
const searchWord = async (req, res) => {
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
        logger_1.logger.info(`🔍 Searching for word: ${searchTerm}`);
        if (wordCache.has(searchTerm)) {
            logger_1.logger.info(`✅ Found in memory cache: ${searchTerm}`);
            const cachedWord = wordCache.get(searchTerm);
            await updateCloudWordSearchStats(searchTerm);
            await saveSearchHistoryToDB(searchTerm, cachedWord.definitions[0]?.definition || '暂无释义');
            res.json({
                success: true,
                data: cachedWord,
                source: 'cache'
            });
            return;
        }
        let cloudWord = await CloudWord_1.default.findOne({ word: searchTerm });
        if (cloudWord) {
            logger_1.logger.info(`✅ Found in cloud words: ${searchTerm}`);
            await updateCloudWordSearchStats(searchTerm);
            wordCache.set(searchTerm, cloudWord);
            await saveSearchHistoryToDB(searchTerm, cloudWord.definitions[0]?.definition || '暂无释义');
            res.json({
                success: true,
                data: cloudWord,
                source: 'cloud_words'
            });
            return;
        }
        logger_1.logger.info(`🤖 Attempting to generate new word data with AI: ${searchTerm}`);
        try {
            const generatedData = await generateWordData(searchTerm);
            cloudWord = new CloudWord_1.default({
                word: searchTerm,
                phonetic: generatedData.phonetic,
                definitions: generatedData.definitions,
                audioUrl: generatedData.audioUrl || '',
                searchCount: 1,
                lastSearched: new Date()
            });
            await cloudWord.save();
            logger_1.logger.info(`💾 Saved new word to cloud words: ${searchTerm}`);
            wordCache.set(searchTerm, cloudWord);
            await saveSearchHistoryToDB(searchTerm, cloudWord.definitions[0]?.definition || '暂无释义');
            res.json({
                success: true,
                data: cloudWord,
                source: 'ai'
            });
        }
        catch (aiError) {
            logger_1.logger.warn(`⚠️ AI generation failed for ${searchTerm}, using fallback data:`, aiError);
            logger_1.logger.error(`❌ OpenAI API Error details:`, {
                message: aiError instanceof Error ? aiError.message : 'Unknown error',
                stack: aiError instanceof Error ? aiError.stack : undefined,
                word: searchTerm
            });
            const fallbackData = getFallbackWordData(searchTerm);
            cloudWord = new CloudWord_1.default({
                word: searchTerm,
                phonetic: fallbackData.phonetic,
                definitions: fallbackData.definitions,
                audioUrl: fallbackData.audioUrl || '',
                searchCount: 1,
                lastSearched: new Date()
            });
            await cloudWord.save();
            logger_1.logger.info(`💾 Saved fallback word to cloud words: ${searchTerm}`);
            wordCache.set(searchTerm, cloudWord);
            await saveSearchHistoryToDB(searchTerm, cloudWord.definitions[0]?.definition || '暂无释义');
            res.json({
                success: true,
                data: cloudWord,
                source: 'fallback',
                message: 'AI service unavailable, using basic definition'
            });
        }
    }
    catch (error) {
        logger_1.logger.error('❌ Search word error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search word',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.searchWord = searchWord;
const getPopularWords = async (req, res) => {
    try {
        logger_1.logger.info('📊 Getting popular words from cloud words');
        const popularWords = await CloudWord_1.default.find({})
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
    }
    catch (error) {
        logger_1.logger.error('❌ Get popular words error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get popular words'
        });
    }
};
exports.getPopularWords = getPopularWords;
const getRecentSearches = async (req, res) => {
    try {
        logger_1.logger.info('📝 Getting recent searches from search history');
        const recentSearches = await SearchHistory_1.SearchHistory.aggregate([
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
    }
    catch (error) {
        logger_1.logger.error('❌ Get recent searches error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get recent searches'
        });
    }
};
exports.getRecentSearches = getRecentSearches;
const saveSearchHistory = async (req, res) => {
    try {
        const { word, definition, timestamp } = req.body;
        if (!word) {
            res.status(400).json({
                success: false,
                error: 'Word parameter is required'
            });
            return;
        }
        const searchHistory = new SearchHistory_1.SearchHistory({
            word: word.toLowerCase().trim(),
            definition: definition || '暂无释义',
            timestamp: timestamp || Date.now()
        });
        await searchHistory.save();
        logger_1.logger.info(`💾 Saved search history: ${word}`);
        res.json({
            success: true,
            message: 'Search history saved successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Save search history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save search history'
        });
    }
};
exports.saveSearchHistory = saveSearchHistory;
const getUserVocabulary = async (req, res) => {
    try {
        const userId = req.params.userId || req.body.userId || req.query.userId;
        if (!userId) {
            res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
            return;
        }
        logger_1.logger.info(`📚 Getting vocabulary for user: ${userId}`);
        const userVocabulary = await UserVocabulary_1.default.aggregate([
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
    }
    catch (error) {
        logger_1.logger.error('❌ Get user vocabulary error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user vocabulary'
        });
    }
};
exports.getUserVocabulary = getUserVocabulary;
const addToUserVocabulary = async (req, res) => {
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
        logger_1.logger.info(`📝 Adding word to user vocabulary: ${searchTerm} for user: ${userId}`);
        let cloudWord = await CloudWord_1.default.findOne({ word: searchTerm });
        if (!cloudWord) {
            const generatedData = await generateWordData(searchTerm);
            cloudWord = new CloudWord_1.default({
                word: searchTerm,
                phonetic: generatedData.phonetic,
                definitions: generatedData.definitions,
                audioUrl: generatedData.audioUrl || '',
                searchCount: 1,
                lastSearched: new Date()
            });
            await cloudWord.save();
        }
        const existingUserWord = await UserVocabulary_1.default.findOne({
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
        const userVocabulary = new UserVocabulary_1.default({
            userId: userId,
            wordId: cloudWord._id,
            word: searchTerm,
            sourceShow: sourceShow || null,
            collectedAt: new Date()
        });
        await userVocabulary.save();
        logger_1.logger.info(`✅ Added word to user vocabulary: ${searchTerm}`);
        res.json({
            success: true,
            message: 'Word added to vocabulary successfully',
            data: {
                word: searchTerm,
                definitions: cloudWord.definitions
            }
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Add to user vocabulary error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add word to vocabulary',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.addToUserVocabulary = addToUserVocabulary;
const updateWordProgress = async (req, res) => {
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
        logger_1.logger.info(`📊 Updating progress for word: ${searchTerm}`);
        const userWord = await UserVocabulary_1.default.findOne({
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
        Object.assign(userWord, progress);
        userWord.lastReviewDate = new Date();
        await userWord.save();
        logger_1.logger.info(`✅ Updated progress for word: ${searchTerm}`);
        res.json({
            success: true,
            message: 'Word progress updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Update word progress error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update word progress'
        });
    }
};
exports.updateWordProgress = updateWordProgress;
const removeFromUserVocabulary = async (req, res) => {
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
        logger_1.logger.info(`🗑️ Removing word from user vocabulary: ${searchTerm} for user: ${userId}`);
        const deletedWord = await UserVocabulary_1.default.findOneAndDelete({
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
        logger_1.logger.info(`✅ Removed word from user vocabulary: ${searchTerm}`);
        res.json({
            success: true,
            message: 'Word removed from vocabulary successfully',
            data: {
                word: searchTerm
            }
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Remove from user vocabulary error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove word from vocabulary'
        });
    }
};
exports.removeFromUserVocabulary = removeFromUserVocabulary;
async function updateCloudWordSearchStats(word) {
    try {
        await CloudWord_1.default.updateOne({ word: word.toLowerCase() }, {
            $inc: { searchCount: 1 },
            $set: { lastSearched: new Date() }
        });
    }
    catch (error) {
        logger_1.logger.error(`❌ Failed to update search stats for ${word}:`, error);
    }
}
async function saveSearchHistoryToDB(word, definition, timestamp) {
    try {
        const searchHistory = new SearchHistory_1.SearchHistory({
            word: word.toLowerCase().trim(),
            definition: definition || '暂无释义',
            timestamp: timestamp || Date.now()
        });
        await searchHistory.save();
    }
    catch (error) {
        logger_1.logger.error(`❌ Failed to save search history for ${word}:`, error);
    }
}
async function generateWordData(word) {
    const prompt = `为单词或短语 "${word}" 生成词典信息，返回JSON格式：

{
  "phonetic": "/音标/",
  "definitions": [
    {
      "partOfSpeech": "词性",
      "definition": "中文释义",
      "examples": [
        {
          "english": "例句原文",
          "chinese": "中文翻译"
        }
      ]
    }
  ]
}

只返回JSON，不要其他内容。`;
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
        const definitions = Array.isArray(parsedData.definitions) ? parsedData.definitions.map((def) => ({
            partOfSpeech: def.partOfSpeech || 'n.',
            definition: def.definition || '暂无释义',
            examples: Array.isArray(def.examples) ? def.examples.map((ex) => {
                if (typeof ex === 'object' && ex.english && ex.chinese) {
                    return `${ex.english} - ${ex.chinese}`;
                }
                return typeof ex === 'string' ? ex : ex.toString();
            }) : []
        })) : [];
        return {
            phonetic: parsedData.phonetic || `/${word}/`,
            definitions: definitions,
            audioUrl: parsedData.audioUrl || ''
        };
    }
    catch (parseError) {
        logger_1.logger.error('❌ Failed to parse OpenAI response:', parseError);
        logger_1.logger.error('Raw response:', responseText);
        throw new Error('Invalid response format from OpenAI');
    }
}
function getFallbackWordData(word) {
    const isEnglish = /[a-zA-Z]/.test(word);
    return {
        phonetic: isEnglish ? `/${word}/` : '',
        definitions: [
            {
                partOfSpeech: isEnglish ? 'noun' : 'n.',
                definition: `${word} 的基本含义`,
                examples: isEnglish ? [
                    `This is a ${word}. - 这是一个${word}。`,
                    `I like ${word}. - 我喜欢${word}。`
                ] : [
                    `${word} - ${word} 的含义`
                ]
            }
        ],
        audioUrl: ''
    };
}
const clearAllData = async (req, res) => {
    try {
        logger_1.logger.warn('🗑️ Clearing all data...');
        await CloudWord_1.default.deleteMany({});
        await UserVocabulary_1.default.deleteMany({});
        await SearchHistory_1.SearchHistory.deleteMany({});
        await Word_1.Word.deleteMany({});
        wordCache.clear();
        logger_1.logger.info('✅ All data cleared successfully');
        res.json({
            success: true,
            message: 'All data cleared successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Clear all data error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear all data'
        });
    }
};
exports.clearAllData = clearAllData;
const clearUserHistory = async (req, res) => {
    try {
        logger_1.logger.warn('🗑️ Clearing all search history (including recent searches)...');
        await SearchHistory_1.SearchHistory.deleteMany({});
        logger_1.logger.info('✅ All search history cleared successfully');
        res.json({
            success: true,
            message: 'All search history and recent searches cleared successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Clear user history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear search history'
        });
    }
};
exports.clearUserHistory = clearUserHistory;
const checkEnvironment = async (req, res) => {
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
    }
    catch (error) {
        logger_1.logger.error('❌ Check environment error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check environment'
        });
    }
};
exports.checkEnvironment = checkEnvironment;
const testOpenAI = async (req, res) => {
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
    }
    catch (error) {
        logger_1.logger.error('❌ OpenAI test error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error instanceof Error ? error.stack : undefined
        });
    }
};
exports.testOpenAI = testOpenAI;
exports.wordController = {
    searchWord: exports.searchWord,
    getPopularWords: exports.getPopularWords,
    getRecentSearches: exports.getRecentSearches,
    saveSearchHistory: exports.saveSearchHistory,
    getUserVocabulary: exports.getUserVocabulary,
    addToUserVocabulary: exports.addToUserVocabulary,
    updateWordProgress: exports.updateWordProgress,
    clearAllData: exports.clearAllData,
    clearUserHistory: exports.clearUserHistory,
    checkEnvironment: exports.checkEnvironment,
    testOpenAI: exports.testOpenAI
};
