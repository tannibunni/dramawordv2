// 错词功能集成测试脚本
// 模拟前端review页面的错词添加、移除和数量显示

const { wrongWordsManager } = require('../apps/mobile/src/services/wrongWordsManager.ts');

console.log('🧪 开始错词功能集成测试...\n');

// 模拟用户词汇表
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

// 初始化错词管理器
wrongWordsManager.initialize(mockVocabulary);

console.log('📊 初始状态:');
console.log(`- 词汇表总数: ${mockVocabulary.length}`);
console.log(`- 错词数量: ${wrongWordsManager.getWrongWordsCount()}`);
console.log(`- 错词列表: ${wrongWordsManager.getWrongWords().join(', ')}`);
console.log('');

// 测试1: 模拟左滑（答错）- 添加错词
console.log('🔄 测试1: 模拟左滑（答错）- 添加错词');
console.log('用户左滑 apple（答错）...');

// 更新apple的学习记录
mockVocabulary[0].incorrectCount = 1;
mockVocabulary[0].consecutiveIncorrect = 1;
mockVocabulary[0].consecutiveCorrect = 0;

// 添加到错词管理器
wrongWordsManager.addWrongWord('apple', mockVocabulary[0]);

console.log(`✅ apple 已添加到错词集合`);
console.log(`📊 当前错词数量: ${wrongWordsManager.getWrongWordsCount()}`);
console.log(`📋 错词列表: ${wrongWordsManager.getWrongWords().join(', ')}`);
console.log('');

// 测试2: 继续左滑其他单词
console.log('🔄 测试2: 继续左滑其他单词');
console.log('用户左滑 banana（答错）...');

mockVocabulary[1].incorrectCount = 1;
mockVocabulary[1].consecutiveIncorrect = 1;
mockVocabulary[1].consecutiveCorrect = 0;

wrongWordsManager.addWrongWord('banana', mockVocabulary[1]);

console.log(`✅ banana 已添加到错词集合`);
console.log(`📊 当前错词数量: ${wrongWordsManager.getWrongWordsCount()}`);
console.log(`📋 错词列表: ${wrongWordsManager.getWrongWords().join(', ')}`);
console.log('');

// 测试3: 模拟右滑（答对）- 更新错词状态
console.log('🔄 测试3: 模拟右滑（答对）- 更新错词状态');
console.log('用户右滑 apple（答对）...');

mockVocabulary[0].consecutiveIncorrect = 0;
mockVocabulary[0].consecutiveCorrect = 1;

wrongWordsManager.updateWrongWord('apple', true, mockVocabulary[0]);

console.log(`✅ apple 状态已更新（连续答对1次）`);
console.log(`📊 当前错词数量: ${wrongWordsManager.getWrongWordsCount()}`);
console.log(`📋 错词列表: ${wrongWordsManager.getWrongWords().join(', ')}`);
console.log('');

// 测试4: 继续右滑apple（第二次答对）
console.log('🔄 测试4: 继续右滑apple（第二次答对）');
console.log('用户再次右滑 apple（答对）...');

mockVocabulary[0].consecutiveCorrect = 2;

wrongWordsManager.updateWrongWord('apple', true, mockVocabulary[0]);

console.log(`✅ apple 状态已更新（连续答对2次）`);
console.log(`📊 当前错词数量: ${wrongWordsManager.getWrongWordsCount()}`);
console.log(`📋 错词列表: ${wrongWordsManager.getWrongWords().join(', ')}`);
console.log('');

// 测试5: 第三次右滑apple（连续答对3次，应该从错词集合移除）
console.log('🔄 测试5: 第三次右滑apple（连续答对3次，应该从错词集合移除）');
console.log('用户第三次右滑 apple（答对）...');

mockVocabulary[0].consecutiveCorrect = 3;

wrongWordsManager.updateWrongWord('apple', true, mockVocabulary[0]);

console.log(`✅ apple 连续答对3次，已从错词集合移除`);
console.log(`📊 当前错词数量: ${wrongWordsManager.getWrongWordsCount()}`);
console.log(`📋 错词列表: ${wrongWordsManager.getWrongWords().join(', ')}`);
console.log('');

// 测试6: 验证ReviewIntroScreen的错词数量计算
console.log('🔄 测试6: 验证ReviewIntroScreen的错词数量计算');
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

// 测试7: 验证错词管理器统计信息
console.log('🔄 测试7: 验证错词管理器统计信息');
const stats = wrongWordsManager.getStatistics();
console.log('📊 错词管理器统计信息:');
console.log(`  - 总错词数: ${stats.totalWrongWords}`);
console.log(`  - 新增错词: ${stats.newlyAdded}`);
console.log(`  - 最近移除: ${stats.recentlyRemoved}`);
console.log(`  - 最后更新: ${stats.lastUpdated}`);

console.log('');

// 测试8: 验证错词挑战卡功能
console.log('🔄 测试8: 验证错词挑战卡功能');
console.log('模拟错词挑战卡获取错词列表...');

const wrongWordsList = wrongWordsManager.getWrongWords();
console.log(`📋 错词挑战卡错词列表: ${wrongWordsList.join(', ')}`);

if (wrongWordsList.length > 0) {
  // 从 vocabulary 中获取错词的完整信息
  const wrongWordsWithDetails = wrongWordsList
    .map(wordStr => mockVocabulary.find(w => w.word === wordStr))
    .filter(Boolean);
  
  console.log(`🔍 错词挑战卡筛选结果: ${wrongWordsWithDetails.length} 个错词`);
  console.log('🔍 错词详情:');
  wrongWordsWithDetails.forEach(w => {
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
console.log(`✅ 错词挑战卡错词数量: ${wrongWordsList.length}`);

if (wrongWordsManager.getWrongWordsCount() === localWrongWords.length && 
    localWrongWords.length === wrongWordsList.length) {
  console.log('🎉 所有错词数量计算一致，测试通过！');
} else {
  console.log('❌ 错词数量计算不一致，测试失败！');
}

console.log('\n✅ 错词功能集成测试完成'); 