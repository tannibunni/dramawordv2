import mongoose from 'mongoose';
import { Word } from '../models/Word';
import CloudWord from '../models/CloudWord';
import UserVocabulary from '../models/UserVocabulary';
import { logger } from './logger';

// 数据迁移脚本：将现有单词数据迁移到云单词表架构
export async function migrateToCloudWords() {
  try {
    logger.info('🚀 开始数据迁移到云单词表架构...');

    // 1. 收集所有现有单词数据
    const existingWords = await Word.find({});
    logger.info(`📊 找到 ${existingWords.length} 个现有单词记录`);

    if (existingWords.length === 0) {
      logger.info('✅ 没有现有数据需要迁移');
      return;
    }

    // 2. 去重并创建云单词表
    const uniqueWords = new Map<string, any>();
    existingWords.forEach(word => {
      const wordKey = word.word.toLowerCase();
      if (!uniqueWords.has(wordKey)) {
        uniqueWords.set(wordKey, {
          word: word.word.toLowerCase(),
          phonetic: word.phonetic || '',
          definitions: word.definitions || [],
          audioUrl: (word as any).audioUrl || '',
          searchCount: word.searchCount || 1,
          lastSearched: word.lastSearched || new Date()
        });
      } else {
        // 如果已存在，更新搜索统计
        const existing = uniqueWords.get(wordKey)!;
        existing.searchCount += word.searchCount || 1;
        if (word.lastSearched && (!existing.lastSearched || word.lastSearched > existing.lastSearched)) {
          existing.lastSearched = word.lastSearched;
        }
      }
    });

    logger.info(`📝 去重后需要创建 ${uniqueWords.size} 个云单词记录`);

    // 3. 批量插入云单词表
    const cloudWords = Array.from(uniqueWords.values());
    const cloudWordDocs = cloudWords.map(wordData => new CloudWord(wordData));
    
    await CloudWord.insertMany(cloudWordDocs as any[], { ordered: false });
    logger.info(`✅ 成功创建 ${cloudWordDocs.length} 个云单词记录`);

    // 4. 创建云单词ID映射
    const cloudWordMap = new Map<string, mongoose.Types.ObjectId>();
    const savedCloudWords = await CloudWord.find({});
    savedCloudWords.forEach(cloudWord => {
      cloudWordMap.set(cloudWord.word.toLowerCase(), cloudWord._id as any);
    });

    // 5. 更新用户单词本，添加 wordId 引用
    const userVocabularies = await UserVocabulary.find({});
    logger.info(`📚 找到 ${userVocabularies.length} 个用户单词本记录`);

    let updatedCount = 0;
    for (const userVocab of userVocabularies) {
      const cloudWordId = cloudWordMap.get(userVocab.word.toLowerCase());
      if (cloudWordId) {
        (userVocab as any).wordId = cloudWordId;
        await userVocab.save();
        updatedCount++;
      }
    }

    logger.info(`✅ 成功更新 ${updatedCount} 个用户单词本记录`);

    logger.info('🎉 数据迁移完成！');
    
    // 6. 输出统计信息
    const finalCloudWords = await CloudWord.countDocuments();
    const finalUserVocabularies = await UserVocabulary.countDocuments();
    
    logger.info(`📊 迁移后统计:`);
    logger.info(`   - 云单词表: ${finalCloudWords} 个单词`);
    logger.info(`   - 用户单词本: ${finalUserVocabularies} 个记录`);

  } catch (error) {
    logger.error('❌ 数据迁移失败:', error);
    throw error;
  }
}

// 验证迁移结果
export async function validateMigration() {
  try {
    logger.info('🔍 验证数据迁移结果...');

    // 检查云单词表
    const cloudWordCount = await CloudWord.countDocuments();
    logger.info(`📊 云单词表: ${cloudWordCount} 个单词`);

    // 检查用户单词本
    const userVocabCount = await UserVocabulary.countDocuments();
    logger.info(`📚 用户单词本: ${userVocabCount} 个记录`);

    // 检查关联完整性
    const orphanedRecords = await UserVocabulary.find({
      wordId: { $exists: false }
    });
    
    if (orphanedRecords.length > 0) {
      logger.warn(`⚠️ 发现 ${orphanedRecords.length} 个孤立的用户单词记录`);
    } else {
      logger.info('✅ 所有用户单词记录都有有效的云单词引用');
    }

    // 检查热门单词
    const popularWords = await CloudWord.find({})
      .sort({ searchCount: -1 })
      .limit(5)
      .select('word searchCount');

    logger.info('🔥 热门单词:');
    popularWords.forEach((word, index) => {
      logger.info(`   ${index + 1}. ${word.word} (搜索 ${word.searchCount} 次)`);
    });

    logger.info('✅ 数据迁移验证完成');

  } catch (error) {
    logger.error('❌ 数据迁移验证失败:', error);
    throw error;
  }
}

// 运行迁移（如果直接执行此文件）
if (require.main === module) {
  // 连接数据库
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dramaword';
  
  mongoose.connect(mongoUri)
    .then(async () => {
      logger.info('📦 数据库连接成功');
      
      try {
        await migrateToCloudWords();
        await validateMigration();
        logger.info('🎉 迁移脚本执行完成');
      } catch (error) {
        logger.error('❌ 迁移脚本执行失败:', error);
      } finally {
        await mongoose.disconnect();
        logger.info('🔌 数据库连接已关闭');
        process.exit(0);
      }
    })
    .catch((error) => {
      logger.error('❌ 数据库连接失败:', error);
      process.exit(1);
    });
} 