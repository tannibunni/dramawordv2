#!/usr/bin/env node

/**
 * 错词卡数据验证脚本
 * 用于调试和验证错词卡数据完整性
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证错词卡数据...\n');

// 模拟 vocabulary 数据
const mockVocabulary = [
  {
    word: 'test1',
    incorrectCount: 1,
    consecutiveIncorrect: 1,
    consecutiveCorrect: 0
  },
  {
    word: 'test2',
    incorrectCount: 0,
    consecutiveIncorrect: 0,
    consecutiveCorrect: 3
  },
  {
    word: 'test3',
    incorrectCount: 2,
    consecutiveIncorrect: 0,
    consecutiveCorrect: 1
  },
  {
    word: 'test4',
    // 缺少字段的单词
  }
];

// 错词筛选函数
const isWrongWord = (word) => {
  // 连续答对3次后从错词卡移除
  if ((word.consecutiveCorrect || 0) >= 3) {
    console.log(`❌ ${word.word}: 连续答对${word.consecutiveCorrect || 0}次，从错词卡移除`);
    return false;
  }
  
  // 有答错记录或连续答错
  const hasWrongRecord = (word.incorrectCount || 0) > 0 || (word.consecutiveIncorrect || 0) > 0;
  if (hasWrongRecord) {
    console.log(`✅ ${word.word}: 符合错词条件 (incorrectCount=${word.incorrectCount || 0}, consecutiveIncorrect=${word.consecutiveIncorrect || 0})`);
  } else {
    console.log(`❌ ${word.word}: 不符合错词条件 (incorrectCount=${word.incorrectCount || 0}, consecutiveIncorrect=${word.consecutiveIncorrect || 0})`);
  }
  return hasWrongRecord;
};

// 验证数据字段完整性
const validateDataFields = () => {
  console.log('🔍 验证数据字段完整性...');
  mockVocabulary.forEach(word => {
    if (typeof word.incorrectCount === 'undefined') {
      console.warn(`⚠️ 单词 ${word.word} 缺少 incorrectCount 字段`);
    }
    if (typeof word.consecutiveIncorrect === 'undefined') {
      console.warn(`⚠️ 单词 ${word.word} 缺少 consecutiveIncorrect 字段`);
    }
    if (typeof word.consecutiveCorrect === 'undefined') {
      console.warn(`⚠️ 单词 ${word.word} 缺少 consecutiveCorrect 字段`);
    }
  });
};

// 测试错词筛选
const testWrongWordFilter = () => {
  console.log('\n🔍 测试错词筛选逻辑...');
  const wrongWords = mockVocabulary.filter(isWrongWord);
  console.log(`\n📊 筛选结果: ${wrongWords.length} 个错词`);
  console.log('错词列表:', wrongWords.map(w => w.word));
};

validateDataFields();
testWrongWordFilter();

console.log('\n✅ 数据验证完成');
