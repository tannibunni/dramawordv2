// 前端错词功能实际测试脚本
// 模拟用户在review页面的实际操作

console.log('🧪 开始前端错词功能实际测试...\n');

// 模拟错词管理器（与前端实际使用的逻辑一致）
class FrontendWrongWordsManager {
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

  initialize(vocabulary) {
    console.log('🔧 初始化错词管理器...');
    vocabulary.forEach(word => {
      if (this.isWrongWord(word)) {
        this.addWrongWord(word.word, word);
      }
    });
    console.log(`✅ 错词管理器初始化完成，共 ${this.wrongWordsSet.size} 个错词`);
  }

  isWrongWord(word) {
    // 连续答对3次后从错词卡移除
    if ((word.consecutiveCorrect || 0) >= 3) {
      return false;
    }
    
    // 有答错记录或连续答错
    return (word.incorrectCount || 0) > 0 || (word.consecutiveIncorrect || 0) > 0;
  }

  addWrongWord(word, wordData) {
    if (this.wrongWordsSet.has(word)) {
      console.log(`ℹ️ 错词已存在于错词集合中: ${word}`);
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

    console.log(`✅ 错词已实时添加到错词集合: ${word}`);
    console.log(`📊 当前错词总数: ${this.statistics.totalWrongWords}`);
    return true;
  }

  updateWrongWord(word, isCorrect, wordData) {
    const wordInfo = this.wrongWordsMap.get(word);
    if (!wordInfo) {
      console.log(`⚠️ 单词 ${word} 不在错词集合中`);
      return;
    }

    if (isCorrect) {
      wordInfo.consecutiveCorrect++;
      wordInfo.consecutiveIncorrect = 0;
      
      console.log(`🔄 已更新错词集合中的单词状态: ${word}`);
      
      // 连续答对3次后移除
      if (wordInfo.consecutiveCorrect >= 3) {
        console.log(`🎉 单词连续答对3次，从错词集合移除: ${word}`);
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

    // 更新统计数据
    if (wordData) {
      wordInfo.incorrectCount = wordData.incorrectCount || wordInfo.incorrectCount;
      wordInfo.consecutiveIncorrect = wordData.consecutiveIncorrect || wordInfo.consecutiveIncorrect;
      wordInfo.consecutiveCorrect = wordData.consecutiveCorrect || wordInfo.consecutiveCorrect;
    }

    this.statistics.lastUpdated = new Date();
  }

  removeWrongWord(word, reason = 'manual') {
    if (!this.wrongWordsSet.has(word)) {
      return false;
    }

    this.wrongWordsSet.delete(word);
    this.wrongWordsMap.delete(word);
    this.statistics.totalWrongWords--;
    this.statistics.recentlyRemoved++;
    this.statistics.lastUpdated = new Date();

    console.log(`🗑️ 移除错词: ${word}，原因: ${reason}，当前错词总数: ${this.statistics.totalWrongWords}`);
    return true;
  }

  getWrongWords() {
    return Array.from(this.wrongWordsSet);
  }

  getWrongWordsCount() {
    return this.statistics.totalWrongWords;
  }

  getStatistics() {
    return { ...this.statistics };
  }

  getWrongWordInfo(word) {
    return this.wrongWordsMap.get(word);
  }
}

// 创建错词管理器实例
const wrongWordsManager = new FrontendWrongWordsManager();

// 模拟用户词汇表（包含学习记录）
const mockVocabulary = [
  {
    word: 'apple',
    translation: '苹果',
    incorrectCount: 0,
    consecutiveIncorrect: 0,
    consecutiveCorrect: 0,
    reviewCount: 0
  },
  {
    word: 'banana',
    translation: '香蕉',
    incorrectCount: 0,
    consecutiveIncorrect: 0,
    consecutiveCorrect: 0,
    reviewCount: 0
  },
  {
    word: 'orange',
    translation: '橙子',
    incorrectCount: 0,
    consecutiveIncorrect: 0,
    consecutiveCorrect: 0,
    reviewCount: 0
  },
  {
    word: 'grape',
    translation: '葡萄',
    incorrectCount: 0,
    consecutiveIncorrect: 0,
    consecutiveCorrect: 0,
    reviewCount: 0
  },
  {
    word: 'strawberry',
    translation: '草莓',
    incorrectCount: 0,
    consecutiveIncorrect: 0,
    consecutiveCorrect: 0,
    reviewCount: 0
  }
];

console.log('📊 初始状态:');
console.log(`- 词汇表总数: ${mockVocabulary.length}`);
console.log(`- 错词数量: ${wrongWordsManager.getWrongWordsCount()}`);
console.log('');

// 初始化错词管理器
wrongWordsManager.initialize(mockVocabulary);

console.log('\n🎯 开始模拟用户操作...\n');

// 场景1: 用户进入review页面，左滑答错几个单词
console.log('📱 场景1: 用户进入review页面，左滑答错几个单词');
console.log('用户左滑 apple（答错）...');

// 模拟handleSwipeLeft操作
mockVocabulary[0].incorrectCount = 1;
mockVocabulary[0].consecutiveIncorrect = 1;
mockVocabulary[0].consecutiveCorrect = 0;

// 添加到错词管理器
wrongWordsManager.addWrongWord('apple', mockVocabulary[0]);

console.log('用户左滑 banana（答错）...');
mockVocabulary[1].incorrectCount = 1;
mockVocabulary[1].consecutiveIncorrect = 1;
mockVocabulary[1].consecutiveCorrect = 0;

wrongWordsManager.addWrongWord('banana', mockVocabulary[1]);

console.log('用户左滑 orange（答错）...');
mockVocabulary[2].incorrectCount = 1;
mockVocabulary[2].consecutiveIncorrect = 1;
mockVocabulary[2].consecutiveCorrect = 0;

wrongWordsManager.addWrongWord('orange', mockVocabulary[2]);

console.log(`\n📊 当前错词状态:`);
console.log(`- 错词数量: ${wrongWordsManager.getWrongWordsCount()}`);
console.log(`- 错词列表: ${wrongWordsManager.getWrongWords().join(', ')}`);
console.log('');

// 场景2: 用户进入错词挑战卡
console.log('📱 场景2: 用户进入错词挑战卡');
console.log('模拟错词挑战卡获取错词列表...');

const wrongWordsList = wrongWordsManager.getWrongWords();
console.log(`🔍 错词管理器返回错词列表: ${wrongWordsList.join(', ')}`);

if (wrongWordsList.length > 0) {
  // 从 vocabulary 中获取错词的完整信息
  const wrongWordsWithDetails = wrongWordsList
    .map(wordStr => mockVocabulary.find(w => w.word === wordStr))
    .filter(Boolean);
  
  console.log(`🔍 错词卡筛选结果: ${wrongWordsWithDetails.length} 个错词`);
  console.log('🔍 错词详情:');
  wrongWordsWithDetails.forEach(w => {
    console.log(`  - ${w.word}: incorrectCount=${w.incorrectCount}, consecutiveIncorrect=${w.consecutiveIncorrect}, consecutiveCorrect=${w.consecutiveCorrect}`);
  });
} else {
  console.log('🔍 错词管理器中没有错词，返回空数组');
}

console.log('');

// 场景3: 用户在错词挑战卡中右滑答对apple
console.log('📱 场景3: 用户在错词挑战卡中右滑答对apple');
console.log('用户右滑 apple（答对）...');

// 模拟handleSwipeRight操作
mockVocabulary[0].consecutiveIncorrect = 0;
mockVocabulary[0].consecutiveCorrect = 1;

wrongWordsManager.updateWrongWord('apple', true, mockVocabulary[0]);

// 检查是否需要从错词集合移除
const wordInfo = wrongWordsManager.getWrongWordInfo('apple');
if (wordInfo && wordInfo.consecutiveCorrect >= 3) {
  console.log('🎉 单词连续答对3次，从错词集合移除');
}

console.log(`📊 当前错词状态:`);
console.log(`- 错词数量: ${wrongWordsManager.getWrongWordsCount()}`);
console.log(`- 错词列表: ${wrongWordsManager.getWrongWords().join(', ')}`);
console.log('');

// 场景4: 继续右滑apple（第二次答对）
console.log('📱 场景4: 继续右滑apple（第二次答对）');
console.log('用户再次右滑 apple（答对）...');

mockVocabulary[0].consecutiveCorrect = 2;

wrongWordsManager.updateWrongWord('apple', true, mockVocabulary[0]);

console.log(`📊 当前错词状态:`);
console.log(`- 错词数量: ${wrongWordsManager.getWrongWordsCount()}`);
console.log(`- 错词列表: ${wrongWordsManager.getWrongWords().join(', ')}`);
console.log('');

// 场景5: 第三次右滑apple（连续答对3次，应该从错词集合移除）
console.log('📱 场景5: 第三次右滑apple（连续答对3次，应该从错词集合移除）');
console.log('用户第三次右滑 apple（答对）...');

mockVocabulary[0].consecutiveCorrect = 3;

wrongWordsManager.updateWrongWord('apple', true, mockVocabulary[0]);

console.log(`📊 当前错词状态:`);
console.log(`- 错词数量: ${wrongWordsManager.getWrongWordsCount()}`);
console.log(`- 错词列表: ${wrongWordsManager.getWrongWords().join(', ')}`);
console.log('');

// 场景6: 验证ReviewIntroScreen的错词数量显示
console.log('📱 场景6: 验证ReviewIntroScreen的错词数量显示');
console.log('模拟ReviewIntroScreen计算错词数量...');

// 模拟ReviewIntroScreen的错词数量计算逻辑
const localWrongWords = mockVocabulary.filter((word) => {
  return wrongWordsManager.isWrongWord(word);
});

console.log(`🔍 ReviewIntroScreen 错词数量计算结果: ${localWrongWords.length}`);
console.log(`📋 错词详情:`);
localWrongWords.forEach(word => {
  console.log(`  - ${word.word}: incorrectCount=${word.incorrectCount}, consecutiveIncorrect=${word.consecutiveIncorrect}, consecutiveCorrect=${word.consecutiveCorrect}`);
});

console.log('');

// 场景7: 验证错词挑战卡数量更新
console.log('📱 场景7: 验证错词挑战卡数量更新');
console.log('重新获取错词挑战卡列表...');

const updatedWrongWordsList = wrongWordsManager.getWrongWords();
console.log(`🔍 错词挑战卡错词列表: ${updatedWrongWordsList.join(', ')}`);

if (updatedWrongWordsList.length > 0) {
  const updatedWrongWordsWithDetails = updatedWrongWordsList
    .map(wordStr => mockVocabulary.find(w => w.word === wordStr))
    .filter(Boolean);
  
  console.log(`🔍 错词挑战卡筛选结果: ${updatedWrongWordsWithDetails.length} 个错词`);
  console.log('🔍 错词详情:');
  updatedWrongWordsWithDetails.forEach(w => {
    console.log(`  - ${w.word}: incorrectCount=${w.incorrectCount}, consecutiveIncorrect=${w.consecutiveIncorrect}, consecutiveCorrect=${w.consecutiveCorrect}`);
  });
} else {
  console.log('🔍 错词挑战卡中没有错词');
}

console.log('');

// 最终验证
console.log('🎯 最终验证:');
console.log(`✅ 错词管理器错词数量: ${wrongWordsManager.getWrongWordsCount()}`);
console.log(`✅ ReviewIntroScreen 计算错词数量: ${localWrongWords.length}`);
console.log(`✅ 错词挑战卡错词数量: ${updatedWrongWordsList.length}`);

if (wrongWordsManager.getWrongWordsCount() === localWrongWords.length && 
    localWrongWords.length === updatedWrongWordsList.length) {
  console.log('🎉 所有错词数量计算一致，测试通过！');
} else {
  console.log('❌ 错词数量计算不一致，测试失败！');
}

// 验证统计信息
const stats = wrongWordsManager.getStatistics();
console.log('\n📊 错词管理器统计信息:');
console.log(`  - 总错词数: ${stats.totalWrongWords}`);
console.log(`  - 新增错词: ${stats.newlyAdded}`);
console.log(`  - 最近移除: ${stats.recentlyRemoved}`);
console.log(`  - 最后更新: ${stats.lastUpdated}`);

console.log('\n✅ 前端错词功能实际测试完成'); 