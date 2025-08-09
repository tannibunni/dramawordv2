#!/usr/bin/env node

/**
 * 前端错词功能测试脚本
 * 用于验证错词管理器的基本功能
 */

console.log('🧪 开始前端错词功能测试...\n');

// 模拟错词管理器（与前端实际使用的逻辑一致）
class TestWrongWordsManager {
  constructor() {
    this.wrongWordsSet = new Set();
    this.wrongWordsMap = new Map();
    this.statistics = {
      totalWrongWords: 0,
      newlyAdded: 0,
      recentlyRemoved: 0,
      lastUpdated: new Date()
    };
  }

  // 错词筛选逻辑
  isWrongWord(word) {
    const consecutiveCorrect = word.consecutiveCorrect || 0;
    const incorrectCount = word.incorrectCount || 0;
    const consecutiveIncorrect = word.consecutiveIncorrect || 0;
    
    console.log(`🔍 检查单词: ${word.word}`, {
      consecutiveCorrect,
      incorrectCount,
      consecutiveIncorrect
    });
    
    // 连续答对3次后从错词卡移除
    if (consecutiveCorrect >= 3) {
      console.log(`✅ ${word.word} 连续答对${consecutiveCorrect}次，不是错词`);
      return false;
    }
    
    // 有答错记录或连续答错
    const isWrong = incorrectCount > 0 || consecutiveIncorrect > 0;
    console.log(`🔍 ${word.word} 检查结果: ${isWrong ? '是错词' : '不是错词'}`);
    
    return isWrong;
  }

  addWrongWord(word, wordData) {
    console.log(`🔧 尝试添加错词: ${word}`, wordData);
    
    if (this.wrongWordsSet.has(word)) {
      console.log(`⚠️ ${word} 已存在于错词集合中`);
      return false;
    }

    this.wrongWordsSet.add(word);
    this.wrongWordsMap.set(word, {
      word,
      incorrectCount: wordData.incorrectCount || 0,
      consecutiveIncorrect: wordData.consecutiveIncorrect || 0,
      consecutiveCorrect: wordData.consecutiveCorrect || 0,
      addedAt: new Date(),
      lastReviewed: new Date(),
      reviewCount: wordData.reviewCount || 0
    });
    
    this.statistics.totalWrongWords++;
    this.statistics.newlyAdded++;
    this.statistics.lastUpdated = new Date();

    console.log(`✅ 成功添加错词: ${word}，当前总数: ${this.statistics.totalWrongWords}`);
    return true;
  }

  updateWrongWord(word, isCorrect, wordData) {
    console.log(`🔧 更新错词状态: ${word}`, { isCorrect, wordData });
    
    const wordInfo = this.wrongWordsMap.get(word);
    if (!wordInfo) {
      console.log(`⚠️ ${word} 不在错词集合中，无法更新`);
      return;
    }

    if (isCorrect) {
      wordInfo.consecutiveCorrect++;
      wordInfo.consecutiveIncorrect = 0;
      
      console.log(`✅ ${word} 答对了，连续正确次数: ${wordInfo.consecutiveCorrect}`);
      
      // 连续答对3次后移除
      if (wordInfo.consecutiveCorrect >= 3) {
        console.log(`🎉 ${word} 连续答对3次，从错词集合移除`);
        this.removeWrongWord(word, 'consecutiveCorrect');
        return;
      }
    } else {
      wordInfo.incorrectCount++;
      wordInfo.consecutiveIncorrect++;
      wordInfo.consecutiveCorrect = 0;
      
      console.log(`❌ ${word} 答错了，错误次数: ${wordInfo.incorrectCount}，连续错误: ${wordInfo.consecutiveIncorrect}`);
    }

    wordInfo.lastReviewed = new Date();
    wordInfo.reviewCount++;

    // 更新统计数据
    if (wordData) {
      wordInfo.incorrectCount = wordData.incorrectCount || wordInfo.incorrectCount;
      wordInfo.consecutiveIncorrect = wordData.consecutiveIncorrect || wordInfo.consecutiveIncorrect;
      wordInfo.consecutiveCorrect = wordData.consecutiveCorrect || wordInfo.consecutiveCorrect;
    }

    this.statistics.lastUpdated = new Date();

    console.log(`🔧 ${word} 更新完成，最终状态:`, {
      consecutiveCorrect: wordInfo.consecutiveCorrect,
      consecutiveIncorrect: wordInfo.consecutiveIncorrect,
      incorrectCount: wordInfo.incorrectCount
    });
  }

  removeWrongWord(word, reason = 'manual') {
    console.log(`🔧 移除错词: ${word}，原因: ${reason}`);
    
    if (!this.wrongWordsSet.has(word)) {
      console.log(`⚠️ ${word} 不在错词集合中`);
      return false;
    }

    this.wrongWordsSet.delete(word);
    this.wrongWordsMap.delete(word);
    this.statistics.totalWrongWords--;
    this.statistics.recentlyRemoved++;
    this.statistics.lastUpdated = new Date();

    console.log(`✅ 成功移除错词: ${word}，当前总数: ${this.statistics.totalWrongWords}`);
    return true;
  }

  getWrongWords() {
    return Array.from(this.wrongWordsSet);
  }

  getWrongWordsCount() {
    const count = this.statistics.totalWrongWords;
    console.log(`📊 当前错词总数: ${count}`);
    return count;
  }

  getStatistics() {
    return { ...this.statistics };
  }
}

// 测试数据
const testVocabulary = [
  { word: 'apple', incorrectCount: 2, consecutiveIncorrect: 1, consecutiveCorrect: 0 },
  { word: 'banana', incorrectCount: 0, consecutiveIncorrect: 0, consecutiveCorrect: 3 },
  { word: 'cherry', incorrectCount: 1, consecutiveIncorrect: 0, consecutiveCorrect: 2 },
  { word: 'date', incorrectCount: 0, consecutiveIncorrect: 0, consecutiveCorrect: 0 },
  { word: 'elderberry', incorrectCount: 3, consecutiveIncorrect: 2, consecutiveCorrect: 0 }
];

// 创建测试实例
const wrongWordsManager = new TestWrongWordsManager();

console.log('📋 测试数据:');
testVocabulary.forEach(word => {
  console.log(`  - ${word.word}: 错误${word.incorrectCount}次, 连续错误${word.consecutiveIncorrect}次, 连续正确${word.consecutiveCorrect}次`);
});

console.log('\n🔍 测试1: 错词筛选逻辑');
console.log('='.repeat(50));
testVocabulary.forEach(word => {
  const isWrong = wrongWordsManager.isWrongWord(word);
  console.log(`${isWrong ? '❌' : '✅'} ${word.word}: ${isWrong ? '是错词' : '不是错词'}`);
});

console.log('\n🔧 测试2: 错词添加');
console.log('='.repeat(50));
testVocabulary.forEach(word => {
  if (wrongWordsManager.isWrongWord(word)) {
    wrongWordsManager.addWrongWord(word.word, word);
  }
});

console.log('\n📊 测试3: 错词统计');
console.log('='.repeat(50));
console.log('错词列表:', wrongWordsManager.getWrongWords());
console.log('错词数量:', wrongWordsManager.getWrongWordsCount());
console.log('统计信息:', wrongWordsManager.getStatistics());

console.log('\n🔄 测试4: 错词更新');
console.log('='.repeat(50));

// 模拟答对操作
console.log('\n--- 模拟答对操作 ---');
wrongWordsManager.updateWrongWord('apple', true, { consecutiveCorrect: 1 });
wrongWordsManager.updateWrongWord('apple', true, { consecutiveCorrect: 2 });
wrongWordsManager.updateWrongWord('apple', true, { consecutiveCorrect: 3 }); // 应该被移除

// 模拟答错操作
console.log('\n--- 模拟答错操作 ---');
wrongWordsManager.updateWrongWord('cherry', false, { incorrectCount: 2, consecutiveIncorrect: 1 });

console.log('\n📊 最终统计');
console.log('='.repeat(50));
console.log('错词列表:', wrongWordsManager.getWrongWords());
console.log('错词数量:', wrongWordsManager.getWrongWordsCount());
console.log('统计信息:', wrongWordsManager.getStatistics());

console.log('\n✅ 前端错词功能测试完成！');
console.log('\n💡 测试要点:');
console.log('1. 连续答对3次的单词应该从错词集合中移除');
console.log('2. 有答错记录的单词应该被识别为错词');
console.log('3. 错词数量应该正确统计');
console.log('4. 错词状态更新应该正确'); 