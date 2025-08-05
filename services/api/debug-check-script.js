const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

async function debugCheckScript() {
  try {
    console.log('🔍 调试检查脚本...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到MongoDB数据库');
    
    const db = mongoose.connection.db;
    
    // 检查UserLearningRecord
    console.log('\n=== UserLearningRecord 调试 ===');
    const learningRecord = await db.collection('userlearningrecords').findOne();
    if (learningRecord) {
      console.log('文档结构:', Object.keys(learningRecord));
      console.log('records数组长度:', learningRecord.records ? learningRecord.records.length : 0);
      if (learningRecord.records && learningRecord.records.length > 0) {
        const firstRecord = learningRecord.records[0];
        console.log('第一个记录结构:', Object.keys(firstRecord));
        console.log('wordId值:', firstRecord.wordId);
        console.log('wordId类型:', typeof firstRecord.wordId);
        console.log('wordId存在:', firstRecord.wordId !== undefined);
      }
    }
    
    // 检查UserShowList
    console.log('\n=== UserShowList 调试 ===');
    const showList = await db.collection('usershowlists').findOne();
    if (showList) {
      console.log('文档结构:', Object.keys(showList));
      console.log('shows数组长度:', showList.shows ? showList.shows.length : 0);
      if (showList.shows && showList.shows.length > 0) {
        const firstShow = showList.shows[0];
        console.log('第一个节目结构:', Object.keys(firstShow));
        console.log('showId值:', firstShow.showId);
        console.log('showId类型:', typeof firstShow.showId);
        console.log('showId存在:', firstShow.showId !== undefined);
        console.log('progress值:', firstShow.progress);
        console.log('progress类型:', typeof firstShow.progress);
        console.log('progress存在:', firstShow.progress !== undefined);
      }
    }
    
    // 测试字段检查逻辑
    console.log('\n=== 测试字段检查逻辑 ===');
    
    // 测试UserLearningRecord的wordId检查
    if (learningRecord && learningRecord.records && learningRecord.records.length > 0) {
      const firstRecord = learningRecord.records[0];
      const wordIdValue = firstRecord.wordId;
      console.log('wordId检查结果:', wordIdValue !== undefined ? '✅' : '❌');
      console.log('wordId实际值:', wordIdValue);
    }
    
    // 测试UserShowList的showId和progress检查
    if (showList && showList.shows && showList.shows.length > 0) {
      const firstShow = showList.shows[0];
      const showIdValue = firstShow.showId;
      const progressValue = firstShow.progress;
      console.log('showId检查结果:', showIdValue !== undefined ? '✅' : '❌');
      console.log('showId实际值:', showIdValue);
      console.log('progress检查结果:', progressValue !== undefined ? '✅' : '❌');
      console.log('progress实际值:', progressValue);
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 已断开数据库连接');
  }
}

debugCheckScript(); 