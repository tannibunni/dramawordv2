const axios = require('axios');

class DatabaseChecker {
  constructor() {
    this.baseUrl = 'https://dramawordv2.onrender.com';
  }

  async runChecks() {
    console.log('🔍 开始检查数据库数据...\n');
    try {
      await this.checkUserVocabularyCollection();
      await this.checkCloudWordsCollection();
      await this.checkUserCollection();
    } catch (error) {
      console.error('❌ 检查过程中发生错误:', error.message);
    }
  }

  async checkUserVocabularyCollection() {
    try {
      console.log('📊 检查UserVocabulary集合...');
      const response = await axios.get(`${this.baseUrl}/api/debug/collection/uservocabularies`);
      
      if (response.status === 200 && response.data.success) {
        const data = response.data.data;
        console.log(`✅ UserVocabulary集合: ${data.length} 条记录`);
        
        if (data.length > 0) {
          console.log('🔍 UserVocabulary记录详情:');
          data.forEach((record, index) => {
            console.log(`  ${index + 1}. userId: ${record.userId}, word: ${record.word}, wordId: ${record.wordId}`);
            console.log(`     incorrectCount: ${record.incorrectCount}, consecutiveIncorrect: ${record.consecutiveIncorrect}`);
          });
        }
      } else {
        console.log('❌ 无法获取UserVocabulary数据');
      }
    } catch (error) {
      console.log('❌ 检查UserVocabulary失败:', error.message);
    }
  }

  async checkCloudWordsCollection() {
    try {
      console.log('\n📊 检查CloudWords集合...');
      const response = await axios.get(`${this.baseUrl}/api/debug/collection/cloudwords`);
      
      if (response.status === 200 && response.data.success) {
        const data = response.data.data;
        console.log(`✅ CloudWords集合: ${data.length} 条记录`);
        
        // 查找borough单词
        const boroughWord = data.find(record => record.word === 'borough');
        if (boroughWord) {
          console.log('🔍 borough单词详情:');
          console.log(`  _id: ${boroughWord._id}`);
          console.log(`  word: ${boroughWord.word}`);
          console.log(`  language: ${boroughWord.language}`);
          console.log(`  uiLanguage: ${boroughWord.uiLanguage}`);
        } else {
          console.log('❌ 未找到borough单词');
        }
      } else {
        console.log('❌ 无法获取CloudWords数据');
      }
    } catch (error) {
      console.log('❌ 检查CloudWords失败:', error.message);
    }
  }

  async checkUserCollection() {
    try {
      console.log('\n📊 检查Users集合...');
      const response = await axios.get(`${this.baseUrl}/api/debug/collection/users`);
      
      if (response.status === 200 && response.data.success) {
        const data = response.data.data;
        console.log(`✅ Users集合: ${data.length} 条记录`);
        
        // 查找测试用户
        const testUser = data.find(record => record.id === '688a556137eb80bdb7ebefb8');
        if (testUser) {
          console.log('🔍 测试用户详情:');
          console.log(`  id: ${testUser.id}`);
          console.log(`  username: ${testUser.username}`);
          console.log(`  nickname: ${testUser.nickname}`);
        } else {
          console.log('❌ 未找到测试用户');
        }
      } else {
        console.log('❌ 无法获取Users数据');
      }
    } catch (error) {
      console.log('❌ 检查Users失败:', error.message);
    }
  }
}

const checker = new DatabaseChecker();
checker.runChecks().catch(console.error); 