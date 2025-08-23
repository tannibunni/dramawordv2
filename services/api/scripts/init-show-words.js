/**
 * 剧集单词系统数据库初始化脚本
 * 运行此脚本前请确保已连接到正确的MongoDB数据库
 */

const { MongoClient } = require('mongodb');

// 数据库连接配置
const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';
const DB_NAME = 'dramaword';

async function initializeShowWordsSystem() {
  let client;
  
  try {
    console.log('🚀 开始初始化剧集单词系统...');
    
    // 连接数据库
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    const db = client.db(DB_NAME);
    
    // 1. 创建 showwordpreviews 集合
    console.log('📝 创建 showwordpreviews 集合...');
    await db.createCollection('showwordpreviews');
    
    // 2. 创建 showwordpackages 集合
    console.log('📦 创建 showwordpackages 集合...');
    await db.createCollection('showwordpackages');
    
    // 3. 创建索引
    console.log('🔍 创建索引...');
    
    // showwordpreviews 索引
    await db.collection('showwordpreviews').createIndex({ "showId": 1 });
    await db.collection('showwordpreviews').createIndex({ "showName": "text" });
    await db.collection('showwordpreviews').createIndex({ "language": 1 });
    await db.collection('showwordpreviews').createIndex({ "wordStats.totalUniqueWords": -1 });
    await db.collection('showwordpreviews').createIndex({ "isActive": 1 });
    
    // showwordpackages 索引
    await db.collection('showwordpackages').createIndex({ "packageId": 1 });
    await db.collection('showwordpackages').createIndex({ "showId": 1 });
    await db.collection('showwordpackages').createIndex({ "userId": 1 });
    await db.collection('showwordpackages').createIndex({ "packageInfo.difficulty": 1 });
    await db.collection('showwordpackages').createIndex({ "createdAt": -1 });
    
    // 4. 为现有集合添加索引
    console.log('🔗 为现有集合添加索引...');
    
    // cloudwords 索引
    try {
      await db.collection('cloudwords').createIndex({ "showAssociations.showId": 1 });
      console.log('✅ cloudwords 索引创建成功');
    } catch (error) {
      console.log('⚠️ cloudwords 索引可能已存在:', error.message);
    }
    
    // usershowlists 索引
    try {
      await db.collection('usershowlists').createIndex({ "shows.showId": 1 });
      console.log('✅ usershowlists 索引创建成功');
    } catch (error) {
      console.log('⚠️ usershowlists 索引可能已存在:', error.message);
    }
    
    // 5. 创建示例数据（可选）
    console.log('📊 创建示例数据...');
    await createSampleData(db);
    
    console.log('🎉 剧集单词系统初始化完成！');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

async function createSampleData(db) {
  try {
    // 检查是否已有数据
    const existingPreviews = await db.collection('showwordpreviews').countDocuments();
    if (existingPreviews > 0) {
      console.log('ℹ️ 示例数据已存在，跳过创建');
      return;
    }
    
    // 创建示例剧集单词预览
    const samplePreview = {
      showId: 'sample_show_123',
      showName: 'Friends',
      originalTitle: 'Friends',
      language: 'en',
      genre: ['comedy', 'drama'],
      year: 1994,
      wordStats: {
        totalUniqueWords: 156,
        totalAssociations: 234,
        userCount: 45,
        lastUpdated: new Date(),
        wordCategories: {
          nouns: 67,
          verbs: 45,
          adjectives: 32,
          adverbs: 12
        },
        difficultyLevel: 'intermediate',
        estimatedLearningTime: 45
      },
      popularWords: [
        {
          word: 'awesome',
          frequency: 23,
          definitions: ['极好的', '令人敬畏的'],
          difficulty: 'intermediate'
        },
        {
          word: 'friendship',
          frequency: 18,
          definitions: ['友谊', '友情'],
          difficulty: 'intermediate'
        },
        {
          word: 'coffee',
          frequency: 15,
          definitions: ['咖啡'],
          difficulty: 'beginner'
        }
      ],
      showInfo: {
        posterUrl: 'https://example.com/friends-poster.jpg',
        description: 'Six friends living in Manhattan navigate through life, love, and friendship.',
        totalEpisodes: 236,
        averageEpisodeLength: 22,
        rating: 8.9
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      lastWordAdded: new Date()
    };
    
    await db.collection('showwordpreviews').insertOne(samplePreview);
    console.log('✅ 示例剧集单词预览创建成功');
    
  } catch (error) {
    console.error('❌ 创建示例数据失败:', error);
  }
}

// 运行初始化
if (require.main === module) {
  initializeShowWordsSystem()
    .then(() => {
      console.log('🎯 初始化脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 初始化脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { initializeShowWordsSystem };
