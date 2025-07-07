"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wordController = exports.saveSearchHistory = exports.getRecentSearches = exports.getPopularWords = exports.searchWord = void 0;
const openai_1 = __importDefault(require("openai"));
const Word_1 = require("../models/Word");
const SearchHistory_1 = require("../models/SearchHistory");
const logger_1 = require("../utils/logger");
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    logger_1.logger.error('❌ OPENAI_API_KEY environment variable is missing!');
    process.exit(1);
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
            await updateWordSearchStats(searchTerm);
            await saveSearchHistoryToDB(searchTerm, cachedWord.definitions[0]?.definition || '暂无释义');
            res.json({
                success: true,
                data: cachedWord,
                source: 'cache'
            });
            return;
        }
        let wordData = await Word_1.Word.findOne({ word: searchTerm });
        if (wordData) {
            logger_1.logger.info(`✅ Found in database: ${searchTerm}`);
            await updateWordSearchStats(searchTerm);
            wordCache.set(searchTerm, wordData);
            await saveSearchHistoryToDB(searchTerm, wordData.definitions[0]?.definition || '暂无释义');
            res.json({
                success: true,
                data: wordData,
                source: 'database'
            });
            return;
        }
        logger_1.logger.info(`🤖 Generating new word data with AI: ${searchTerm}`);
        const generatedData = await generateWordData(searchTerm);
        wordData = new Word_1.Word({
            word: searchTerm,
            phonetic: generatedData.phonetic,
            definitions: generatedData.definitions,
            searchCount: 1,
            lastSearched: new Date()
        });
        await wordData.save();
        logger_1.logger.info(`💾 Saved new word to database: ${searchTerm}`);
        wordCache.set(searchTerm, wordData);
        await saveSearchHistoryToDB(searchTerm, wordData.definitions[0]?.definition || '暂无释义');
        res.json({
            success: true,
            data: wordData,
            source: 'ai'
        });
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
        logger_1.logger.info('📊 Getting popular words from database');
        const popularWords = await Word_1.Word.find({})
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
        logger_1.logger.info('📝 Getting recent searches from database');
        const recentSearches = await SearchHistory_1.SearchHistory.find({})
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
        await saveSearchHistoryToDB(word, definition, timestamp);
        logger_1.logger.info(`💾 Saved search history: ${word}`);
        res.json({
            success: true,
            message: 'Search history saved'
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
async function updateWordSearchStats(word) {
    try {
        await Word_1.Word.updateOne({ word }, {
            $inc: { searchCount: 1 },
            $set: { lastSearched: new Date() }
        });
    }
    catch (error) {
        logger_1.logger.error(`❌ Error updating word stats for ${word}:`, error);
    }
}
async function saveSearchHistoryToDB(word, definition, timestamp) {
    try {
        const searchHistory = new SearchHistory_1.SearchHistory({
            word: word.toLowerCase().trim(),
            definition: definition || '暂无释义',
            timestamp: timestamp ? new Date(timestamp) : new Date()
        });
        await searchHistory.save();
    }
    catch (error) {
        logger_1.logger.error(`❌ Error saving search history for ${word}:`, error);
    }
}
async function generateWordData(word) {
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
        try {
            const wordData = JSON.parse(response);
            if (!wordData.word || !wordData.phonetic || !wordData.definitions) {
                throw new Error('Invalid word data structure');
            }
            return wordData;
        }
        catch (parseError) {
            logger_1.logger.error('❌ Failed to parse OpenAI response:', response);
            throw new Error('Invalid JSON response from OpenAI');
        }
    }
    catch (error) {
        logger_1.logger.error('❌ OpenAI API error:', error);
        throw error;
    }
}
exports.wordController = {
    searchWord: exports.searchWord,
    getPopularWords: exports.getPopularWords,
    getRecentSearches: exports.getRecentSearches,
    saveSearchHistory: exports.saveSearchHistory
};
//# sourceMappingURL=wordController.js.map