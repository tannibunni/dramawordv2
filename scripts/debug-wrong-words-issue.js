/**
 * 调试错词卡复习问题
 * 检查左滑的错词为什么没有出现在错词卡复习板块
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始调试错词卡复习问题...\n');

// 模拟错词卡逻辑
function simulateWrongWordsLogic() {
  console.log('📝 模拟错词卡逻辑分析:');
  
  // 1. 错词卡筛选逻辑
  console.log('\n1️⃣ 错词卡筛选逻辑 (ReviewScreen.tsx 第390-400行):');
  console.log('```javascript');
  console.log('const localWrongWords = vocabulary.filter((word: any) => ');
  console.log('  (word.incorrectCount && word.incorrectCount > 0) || ');
  console.log('  (word.consecutiveIncorrect && word.consecutiveIncorrect > 0)');
  console.log(');');
  console.log('```');
  
  // 2. 左滑处理逻辑
  console.log('\n2️⃣ 左滑处理逻辑 (ReviewScreen.tsx 第747-789行):');
  console.log('```javascript');
  console.log('const handleSwipeLeft = async (word: string) => {');
  console.log('  // 1. 先用 updateWordReview 处理业务逻辑');
  console.log('  const wordObj = convertReviewWordToWord(words[swiperIndex]);');
  console.log('  const updatedWord = updateWordReview(wordObj, false);');
  console.log('  ');
  console.log('  // 2. 更新本地学习记录');
  console.log('  await learningDataService.updateLearningRecord(');
  console.log('    updatedWord.word,');
  console.log('    word,');
  console.log('    false // 不正确');
  console.log('  );');
  console.log('}');
  console.log('```');
  
  // 3. 学习记录更新逻辑
  console.log('\n3️⃣ 学习记录更新逻辑 (learningAlgorithm.ts 第280-320行):');
  console.log('```javascript');
  console.log('updateLearningRecord(record, wasCorrect) {');
  console.log('  return {');
  console.log('    ...record,');
  console.log('    incorrectCount: record.incorrectCount + (wasCorrect ? 0 : 1),');
  console.log('    consecutiveIncorrect: wasCorrect ? 0 : record.consecutiveIncorrect + 1,');
  console.log('    consecutiveCorrect: wasCorrect ? record.consecutiveCorrect + 1 : 0,');
  console.log('  };');
  console.log('}');
  console.log('```');
  
  // 4. 错词数量计算逻辑
  console.log('\n4️⃣ 错词数量计算逻辑 (ReviewIntroScreen.tsx 第45-65行):');
  console.log('```javascript');
  console.log('const localWrongWords = vocabulary.filter((word: any) => {');
  console.log('  // 如果连续答对次数 >= 3，则从错词卡移除');
  console.log('  if (word.consecutiveCorrect && word.consecutiveCorrect >= 3) {');
  console.log('    return false;');
  console.log('  }');
  console.log('  // 否则保持在错词卡中（有答错记录）');
  console.log('  return (word.incorrectCount && word.incorrectCount > 0) || ');
  console.log('         (word.consecutiveIncorrect && word.consecutiveIncorrect > 0);');
  console.log('});');
  console.log('```');
}

// 分析可能的问题
function analyzePotentialIssues() {
  console.log('\n🔍 可能的问题分析:');
  
  console.log('\n❌ 问题1: 数据同步问题');
  console.log('   - 左滑后更新了 learningDataService 的学习记录');
  console.log('   - 但 vocabulary context 可能没有及时更新');
  console.log('   - 导致错词卡复习时看不到最新的错词数据');
  
  console.log('\n❌ 问题2: 数据结构不匹配');
  console.log('   - learningDataService 使用 LearningRecord 结构');
  console.log('   - vocabulary context 使用 WordWithSource 结构');
  console.log('   - 两个数据结构可能没有正确同步');
  
  console.log('\n❌ 问题3: 更新时机问题');
  console.log('   - 左滑后立即更新了学习记录');
  console.log('   - 但错词卡复习可能使用的是缓存数据');
  console.log('   - 需要刷新 vocabulary context 才能看到更新');
  
  console.log('\n❌ 问题4: 筛选逻辑问题');
  console.log('   - 错词卡筛选条件可能过于严格');
  console.log('   - 或者左滑后的数据没有满足筛选条件');
}

// 提供解决方案
function provideSolutions() {
  console.log('\n💡 解决方案建议:');
  
  console.log('\n✅ 方案1: 强制刷新 vocabulary context');
  console.log('```javascript');
  console.log('// 在 handleSwipeLeft 后添加');
  console.log('await refreshLearningProgress();');
  console.log('```');
  
  console.log('\n✅ 方案2: 直接更新 vocabulary context');
  console.log('```javascript');
  console.log('// 在 handleSwipeLeft 中直接更新 vocabulary');
  console.log('const { updateWord } = useVocabulary();');
  console.log('updateWord(word, {');
  console.log('  incorrectCount: (currentWord.incorrectCount || 0) + 1,');
  console.log('  consecutiveIncorrect: (currentWord.consecutiveIncorrect || 0) + 1,');
  console.log('  consecutiveCorrect: 0');
  console.log('});');
  console.log('```');
  
  console.log('\n✅ 方案3: 添加调试日志');
  console.log('```javascript');
  console.log('// 在错词卡筛选时添加详细日志');
  console.log('console.log("🔍 错词卡筛选前 vocabulary:", vocabulary.length);');
  console.log('console.log("🔍 错词卡筛选条件检查:");');
  console.log('vocabulary.forEach(word => {');
  console.log('  console.log(`  ${word.word}: incorrectCount=${word.incorrectCount}, consecutiveIncorrect=${word.consecutiveIncorrect}`);');
  console.log('});');
  console.log('```');
  
  console.log('\n✅ 方案4: 检查数据同步');
  console.log('```javascript');
  console.log('// 检查 learningDataService 和 vocabulary 的数据一致性');
  console.log('const learningRecords = await learningDataService.getLearningRecords();');
  console.log('console.log("🔍 Learning Records:", learningRecords.length);');
  console.log('console.log("🔍 Vocabulary:", vocabulary.length);');
  console.log('```');
}

// 创建测试数据
function createTestData() {
  console.log('\n🧪 创建测试数据:');
  
  const testVocabulary = [
    {
      word: 'test1',
      incorrectCount: 0,
      consecutiveIncorrect: 0,
      consecutiveCorrect: 0
    },
    {
      word: 'test2',
      incorrectCount: 1,
      consecutiveIncorrect: 1,
      consecutiveCorrect: 0
    },
    {
      word: 'test3',
      incorrectCount: 0,
      consecutiveIncorrect: 0,
      consecutiveCorrect: 3
    }
  ];
  
  console.log('测试数据:', testVocabulary);
  
  // 模拟错词卡筛选
  const wrongWords = testVocabulary.filter((word) => {
    if (word.consecutiveCorrect && word.consecutiveCorrect >= 3) {
      return false;
    }
    return (word.incorrectCount && word.incorrectCount > 0) || 
           (word.consecutiveIncorrect && word.consecutiveIncorrect > 0);
  });
  
  console.log('筛选结果:', wrongWords);
  console.log('错词数量:', wrongWords.length);
}

// 执行调试
simulateWrongWordsLogic();
analyzePotentialIssues();
provideSolutions();
createTestData();

console.log('\n🎯 调试总结:');
console.log('1. 检查左滑后 vocabulary context 是否正确更新');
console.log('2. 确认 learningDataService 和 vocabulary 数据同步');
console.log('3. 验证错词卡筛选逻辑是否正常工作');
console.log('4. 添加详细日志来追踪数据流');
console.log('5. 考虑在左滑后强制刷新错词卡数据'); 