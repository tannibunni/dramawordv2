"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateToCloudWords = migrateToCloudWords;
exports.validateMigration = validateMigration;
const mongoose_1 = __importDefault(require("mongoose"));
const Word_1 = require("../models/Word");
const CloudWord_1 = __importDefault(require("../models/CloudWord"));
const UserVocabulary_1 = __importDefault(require("../models/UserVocabulary"));
const logger_1 = require("./logger");
async function migrateToCloudWords() {
    try {
        logger_1.logger.info('🚀 开始数据迁移到云单词表架构...');
        const existingWords = await Word_1.Word.find({});
        logger_1.logger.info(`📊 找到 ${existingWords.length} 个现有单词记录`);
        if (existingWords.length === 0) {
            logger_1.logger.info('✅ 没有现有数据需要迁移');
            return;
        }
        const uniqueWords = new Map();
        existingWords.forEach(word => {
            const wordKey = word.word.toLowerCase();
            if (!uniqueWords.has(wordKey)) {
                uniqueWords.set(wordKey, {
                    word: word.word.toLowerCase(),
                    phonetic: word.phonetic || '',
                    definitions: word.definitions || [],
                    audioUrl: word.audioUrl || '',
                    searchCount: word.searchCount || 1,
                    lastSearched: word.lastSearched || new Date()
                });
            }
            else {
                const existing = uniqueWords.get(wordKey);
                existing.searchCount += word.searchCount || 1;
                if (word.lastSearched && (!existing.lastSearched || word.lastSearched > existing.lastSearched)) {
                    existing.lastSearched = word.lastSearched;
                }
            }
        });
        logger_1.logger.info(`📝 去重后需要创建 ${uniqueWords.size} 个云单词记录`);
        const cloudWords = Array.from(uniqueWords.values());
        const cloudWordDocs = cloudWords.map(wordData => new CloudWord_1.default(wordData));
        await CloudWord_1.default.insertMany(cloudWordDocs, { ordered: false });
        logger_1.logger.info(`✅ 成功创建 ${cloudWordDocs.length} 个云单词记录`);
        const cloudWordMap = new Map();
        const savedCloudWords = await CloudWord_1.default.find({});
        savedCloudWords.forEach(cloudWord => {
            cloudWordMap.set(cloudWord.word.toLowerCase(), cloudWord._id);
        });
        const userVocabularies = await UserVocabulary_1.default.find({});
        logger_1.logger.info(`📚 找到 ${userVocabularies.length} 个用户单词本记录`);
        let updatedCount = 0;
        for (const userVocab of userVocabularies) {
            const cloudWordId = cloudWordMap.get(userVocab.word.toLowerCase());
            if (cloudWordId) {
                userVocab.wordId = cloudWordId;
                await userVocab.save();
                updatedCount++;
            }
        }
        logger_1.logger.info(`✅ 成功更新 ${updatedCount} 个用户单词本记录`);
        logger_1.logger.info('🎉 数据迁移完成！');
        const finalCloudWords = await CloudWord_1.default.countDocuments();
        const finalUserVocabularies = await UserVocabulary_1.default.countDocuments();
        logger_1.logger.info(`📊 迁移后统计:`);
        logger_1.logger.info(`   - 云单词表: ${finalCloudWords} 个单词`);
        logger_1.logger.info(`   - 用户单词本: ${finalUserVocabularies} 个记录`);
    }
    catch (error) {
        logger_1.logger.error('❌ 数据迁移失败:', error);
        throw error;
    }
}
async function validateMigration() {
    try {
        logger_1.logger.info('🔍 验证数据迁移结果...');
        const cloudWordCount = await CloudWord_1.default.countDocuments();
        logger_1.logger.info(`📊 云单词表: ${cloudWordCount} 个单词`);
        const userVocabCount = await UserVocabulary_1.default.countDocuments();
        logger_1.logger.info(`📚 用户单词本: ${userVocabCount} 个记录`);
        const orphanedRecords = await UserVocabulary_1.default.find({
            wordId: { $exists: false }
        });
        if (orphanedRecords.length > 0) {
            logger_1.logger.warn(`⚠️ 发现 ${orphanedRecords.length} 个孤立的用户单词记录`);
        }
        else {
            logger_1.logger.info('✅ 所有用户单词记录都有有效的云单词引用');
        }
        const popularWords = await CloudWord_1.default.find({})
            .sort({ searchCount: -1 })
            .limit(5)
            .select('word searchCount');
        logger_1.logger.info('🔥 热门单词:');
        popularWords.forEach((word, index) => {
            logger_1.logger.info(`   ${index + 1}. ${word.word} (搜索 ${word.searchCount} 次)`);
        });
        logger_1.logger.info('✅ 数据迁移验证完成');
    }
    catch (error) {
        logger_1.logger.error('❌ 数据迁移验证失败:', error);
        throw error;
    }
}
if (require.main === module) {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dramaword';
    mongoose_1.default.connect(mongoUri)
        .then(async () => {
        logger_1.logger.info('📦 数据库连接成功');
        try {
            await migrateToCloudWords();
            await validateMigration();
            logger_1.logger.info('🎉 迁移脚本执行完成');
        }
        catch (error) {
            logger_1.logger.error('❌ 迁移脚本执行失败:', error);
        }
        finally {
            await mongoose_1.default.disconnect();
            logger_1.logger.info('🔌 数据库连接已关闭');
            process.exit(0);
        }
    })
        .catch((error) => {
        logger_1.logger.error('❌ 数据库连接失败:', error);
        process.exit(1);
    });
}
