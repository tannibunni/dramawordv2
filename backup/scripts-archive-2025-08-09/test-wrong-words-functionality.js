#!/usr/bin/env node

/**
 * 错词卡功能测试脚本
 * 模拟完整的错词卡流程
 */

console.log('🧪 开始测试错词卡功能...\n');

// 模拟初始词汇表
let vocabulary = [
  {
    word: 'apple',
    incorrectCount: 0,
    consecutiveIncorrect: 0,
    consecutiveCorrect: 0
  },
  {
    word: 'banana',
    incorrectCount: 0,
    consecutiveIncorrect: 0,
    consecutiveCorrect: 0
  }
];

// 错词筛选函数
const isWrongWord = (word) => {
  if ((word.consecutiveCorrect || 0) >= 3) {
    return false;
  }
  return (word.incorrectCount || 0) > 0 || (word.consecutiveIncorrect || 0) > 0;
};

// 更新单词进度
const updateWordProgress = (word, isCorrect) => {
  const wordIndex = vocabulary.findIndex(w => w.word === word);
  if (wordIndex !== -1) {
    const currentWord = vocabulary[wordIndex];
    vocabulary[wordIndex] = {
      ...currentWord,
      incorrectCount: isCorrect ? (currentWord.incorrectCount || 0) : (currentWord.incorrectCount || 0) + 1,
      consecutiveIncorrect: isCorrect ? 0 : (currentWord.consecutiveIncorrect || 0) + 1,
      consecutiveCorrect: isCorrect ? (currentWord.consecutiveCorrect || 0) + 1 : 0
    };
  }
};

// 获取错词数量
const getWrongWordsCount = () => {
  return vocabulary.filter(isWrongWord).length;
};

// 测试场景
console.log('📊 初始状态:');
console.log('词汇表:', vocabulary);
console.log('错词数量:', getWrongWordsCount());

console.log('\n🔄 测试场景1: 答错 apple');
updateWordProgress('apple', false);
console.log('答错后错词数量:', getWrongWordsCount());

console.log('\n🔄 测试场景2: 答对 apple');
updateWordProgress('apple', true);
console.log('答对后错词数量:', getWrongWordsCount());

console.log('\n🔄 测试场景3: 连续答对 apple 3次');
updateWordProgress('apple', true);
updateWordProgress('apple', true);
updateWordProgress('apple', true);
console.log('连续答对3次后错词数量:', getWrongWordsCount());

console.log('\n🔄 测试场景4: 答错 banana');
updateWordProgress('banana', false);
console.log('答错 banana 后错词数量:', getWrongWordsCount());

console.log('\n📊 最终状态:');
console.log('词汇表:', vocabulary);
console.log('错词数量:', getWrongWordsCount());

console.log('\n✅ 错词卡功能测试完成');
