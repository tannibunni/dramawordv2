#!/usr/bin/env node

/**
 * 错词管理器测试脚本
 * 测试错词集合的添加、移除、更新功能
 */

console.log('🧪 开始测试错词管理器...\n');

// 模拟错词管理器
class WrongWordsManager {
  constructor() {
    this.wrongWordsSet = new Set();
    this.wrongWordsMap = new Map();
    this.statistics = {
      totalWrongWords: 0,
      newlyAdded: 0,
      recentlyRemoved: 0,
      lastUpdated: new Date()
    };
    this.eventListeners = new Map();
  }

  // 添加错词
  addWrongWord(word, wordData) {
    if (this.wrongWordsSet.has(word)) {
      return false;
    }

    const wrongWordInfo = {
      word,
      incorrectCount: wordData.incorrectCount || 0,
      consecutiveIncorrect: wordData.consecutiveIncorrect || 0,
      consecutiveCorrect: wordData.consecutiveCorrect || 0,
      addedAt: new Date(),
      lastReviewed: new Date(),
      reviewCount: wordData.reviewCount || 0
    };

    this.wrongWordsSet.add(word);
    this.wrongWordsMap.set(word, wrongWordInfo);
    this.statistics.totalWrongWords++;
    this.statistics.newlyAdded++;
    this.statistics.lastUpdated = new Date();

    console.log(`✅ 添加错词: ${word}，当前总数: ${this.statistics.totalWrongWords}`);
    return true;
  }

  // 移除错词
  removeWrongWord(word, reason = 'manual') {
    if (!this.wrongWordsSet.has(word)) {
      return false;
    }

    this.wrongWordsSet.delete(word);
    this.wrongWordsMap.delete(word);
    this.statistics.totalWrongWords--;
    this.statistics.recentlyRemoved++;
    this.statistics.lastUpdated = new Date();

    console.log(`❌ 移除错词: ${word}，原因: ${reason}，当前总数: ${this.statistics.totalWrongWords}`);
    return true;
  }

  // 更新错词状态
  updateWrongWord(word, isCorrect, wordData) {
    const wordInfo = this.wrongWordsMap.get(word);
    if (!wordInfo) {
      return;
    }

    if (isCorrect) {
      wordInfo.consecutiveCorrect++;
      wordInfo.consecutiveIncorrect = 0;
      
      // 连续答对3次后移除
      if (wordInfo.consecutiveCorrect >= 3) {
        this.removeWrongWord(word, 'consecutiveCorrect');
        return;
      }
    } else {
      wordInfo.incorrectCount++;
      wordInfo.consecutiveIncorrect++;
      wordInfo.consecutiveCorrect = 0;
    }

    wordInfo.lastReviewed = new Date();
    wordInfo.reviewCount++;

    if (wordData) {
      wordInfo.incorrectCount = wordData.incorrectCount || wordInfo.incorrectCount;
      wordInfo.consecutiveIncorrect = wordData.consecutiveIncorrect || wordInfo.consecutiveIncorrect;
      wordInfo.consecutiveCorrect = wordData.consecutiveCorrect || wordInfo.consecutiveCorrect;
    }

    this.statistics.lastUpdated = new Date();

    console.log(`🔄 更新错词: ${word}，正确: ${isCorrect}，连续正确: ${wordInfo.consecutiveCorrect}`);
  }

  // 获取错词列表
  getWrongWords() {
    return Array.from(this.wrongWordsSet);
  }

  // 获取错词数量
  getWrongWordsCount() {
    return this.statistics.totalWrongWords;
  }

  // 获取统计信息
  getStatistics() {
    return { ...this.statistics };
  }

  // 检查是否包含错词
  hasWrongWord(word) {
    return this.wrongWordsSet.has(word);
  }

  // 获取错词信息
  getWrongWordInfo(word) {
    return this.wrongWordsMap.get(word);
  }
}

// 创建错词管理器实例
const wrongWordsManager = new WrongWordsManager();

// 测试场景
console.log('📊 初始状态:');
console.log('错词数量:', wrongWordsManager.getWrongWordsCount());
console.log('错词列表:', wrongWordsManager.getWrongWords());

console.log('\n🔄 测试场景1: 添加错词');
const word1 = { word: 'apple', incorrectCount: 1, consecutiveIncorrect: 1, consecutiveCorrect: 0 };
wrongWordsManager.addWrongWord('apple', word1);
console.log('错词数量:', wrongWordsManager.getWrongWordsCount());
console.log('错词列表:', wrongWordsManager.getWrongWords());

console.log('\n🔄 测试场景2: 添加另一个错词');
const word2 = { word: 'banana', incorrectCount: 2, consecutiveIncorrect: 0, consecutiveCorrect: 0 };
wrongWordsManager.addWrongWord('banana', word2);
console.log('错词数量:', wrongWordsManager.getWrongWordsCount());
console.log('错词列表:', wrongWordsManager.getWrongWords());

console.log('\n🔄 测试场景3: 答对 apple 1次');
wrongWordsManager.updateWrongWord('apple', true, { consecutiveCorrect: 1 });
console.log('apple 信息:', wrongWordsManager.getWrongWordInfo('apple'));
console.log('错词数量:', wrongWordsManager.getWrongWordsCount());

console.log('\n🔄 测试场景4: 答对 apple 2次');
wrongWordsManager.updateWrongWord('apple', true, { consecutiveCorrect: 2 });
console.log('apple 信息:', wrongWordsManager.getWrongWordInfo('apple'));
console.log('错词数量:', wrongWordsManager.getWrongWordsCount());

console.log('\n🔄 测试场景5: 答对 apple 3次（应该被移除）');
wrongWordsManager.updateWrongWord('apple', true, { consecutiveCorrect: 3 });
console.log('错词数量:', wrongWordsManager.getWrongWordsCount());
console.log('错词列表:', wrongWordsManager.getWrongWords());
console.log('apple 是否还在错词集合中:', wrongWordsManager.hasWrongWord('apple'));

console.log('\n🔄 测试场景6: 答错 banana');
wrongWordsManager.updateWrongWord('banana', false, { incorrectCount: 3, consecutiveIncorrect: 1 });
console.log('banana 信息:', wrongWordsManager.getWrongWordInfo('banana'));
console.log('错词数量:', wrongWordsManager.getWrongWordsCount());

console.log('\n🔄 测试场景7: 手动移除 banana');
wrongWordsManager.removeWrongWord('banana', 'manual');
console.log('错词数量:', wrongWordsManager.getWrongWordsCount());
console.log('错词列表:', wrongWordsManager.getWrongWords());

console.log('\n📊 最终统计信息:');
console.log('统计信息:', wrongWordsManager.getStatistics());

console.log('\n✅ 错词管理器测试完成');

// 性能测试
console.log('\n🚀 性能测试:');
console.log('测试大量错词的添加和查询性能...');

const startTime = Date.now();
const testWords = [];
for (let i = 0; i < 1000; i++) {
  testWords.push({
    word: `word${i}`,
    incorrectCount: Math.floor(Math.random() * 5) + 1,
    consecutiveIncorrect: Math.floor(Math.random() * 3),
    consecutiveCorrect: Math.floor(Math.random() * 3)
  });
}

// 批量添加
const addStartTime = Date.now();
testWords.forEach(word => {
  wrongWordsManager.addWrongWord(word.word, word);
});
const addEndTime = Date.now();

// 查询测试
const queryStartTime = Date.now();
for (let i = 0; i < 1000; i++) {
  wrongWordsManager.hasWrongWord(`word${i}`);
}
const queryEndTime = Date.now();

console.log(`批量添加 1000 个错词耗时: ${addEndTime - addStartTime}ms`);
console.log(`查询 1000 个错词耗时: ${queryEndTime - queryStartTime}ms`);
console.log(`最终错词数量: ${wrongWordsManager.getWrongWordsCount()}`);

console.log('\n🎉 性能测试完成'); 