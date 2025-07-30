// 测试错词卡逻辑
console.log('🧪 测试错词卡逻辑...\n');

// 模拟错词卡筛选逻辑
function filterWrongWords(vocabulary) {
  return vocabulary.filter((word) => {
    // 如果连续答对次数 >= 3，则从错词卡移除
    if (word.consecutiveCorrect && word.consecutiveCorrect >= 3) {
      return false;
    }
    // 否则保持在错词卡中（有答错记录）
    return (word.incorrectCount && word.incorrectCount > 0) || 
           (word.consecutiveIncorrect && word.consecutiveIncorrect > 0);
  });
}

// 测试用例
const testCases = [
  {
    name: '连续答对3次 - 应该从错词卡移除',
    word: {
      word: 'test1',
      incorrectCount: 5,
      consecutiveIncorrect: 0,
      consecutiveCorrect: 3
    },
    expected: false
  },
  {
    name: '连续答对2次 - 应该保持在错词卡',
    word: {
      word: 'test2',
      incorrectCount: 3,
      consecutiveIncorrect: 0,
      consecutiveCorrect: 2
    },
    expected: true
  },
  {
    name: '连续答错 - 应该保持在错词卡',
    word: {
      word: 'test3',
      incorrectCount: 2,
      consecutiveIncorrect: 3,
      consecutiveCorrect: 0
    },
    expected: true
  },
  {
    name: '混合情况 - 应该保持在错词卡',
    word: {
      word: 'test4',
      incorrectCount: 1,
      consecutiveIncorrect: 1,
      consecutiveCorrect: 1
    },
    expected: true
  },
  {
    name: '连续答对4次 - 应该从错词卡移除',
    word: {
      word: 'test5',
      incorrectCount: 10,
      consecutiveIncorrect: 0,
      consecutiveCorrect: 4
    },
    expected: false
  }
];

console.log('📋 测试用例:');
testCases.forEach((testCase, index) => {
  const result = filterWrongWords([testCase.word]).length > 0;
  const status = result === testCase.expected ? '✅ 通过' : '❌ 失败';
  
  console.log(`${index + 1}. ${testCase.name}`);
  console.log(`   单词: ${testCase.word.word}`);
  console.log(`   数据: incorrectCount=${testCase.word.incorrectCount}, consecutiveIncorrect=${testCase.word.consecutiveIncorrect}, consecutiveCorrect=${testCase.word.consecutiveCorrect}`);
  console.log(`   结果: ${result ? '在错词卡中' : '从错词卡移除'} (期望: ${testCase.expected ? '在错词卡中' : '从错词卡移除'})`);
  console.log(`   状态: ${status}\n`);
});

// 测试实际数据
console.log('🔍 测试实际数据:');
const actualVocabulary = [
  {
    word: 'borough',
    incorrectCount: 9,
    consecutiveIncorrect: 0,
    consecutiveCorrect: 2
  }
];

const wrongWords = filterWrongWords(actualVocabulary);
console.log(`实际词汇表: ${actualVocabulary.length} 个单词`);
console.log(`错词卡: ${wrongWords.length} 个单词`);
wrongWords.forEach(word => {
  console.log(`  - ${word.word}: incorrectCount=${word.incorrectCount}, consecutiveIncorrect=${word.consecutiveIncorrect}, consecutiveCorrect=${word.consecutiveCorrect}`);
});

console.log('\n🎯 错词卡逻辑总结:');
console.log('✅ 连续答对3次或以上 → 从错词卡移除');
console.log('✅ 连续答对少于3次 → 保持在错词卡');
console.log('✅ 有答错记录 → 保持在错词卡'); 