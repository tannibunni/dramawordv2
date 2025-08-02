#!/usr/bin/env node

/**
 * 错词卡逻辑修复脚本
 * 解决错词卡显示为0的问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 开始修复错词卡逻辑...\n');

// 1. 修复 VocabularyContext 中的数据字段初始化
console.log('📝 1. 修复 VocabularyContext 数据字段初始化...');

const vocabularyContextPath = path.join(__dirname, '../apps/mobile/src/context/VocabularyContext.tsx');

let vocabularyContextContent = fs.readFileSync(vocabularyContextPath, 'utf8');

// 添加数据字段初始化函数
const initializeWordProgressFunction = `
  // 初始化单词学习进度字段
  const initializeWordProgress = (word: WordWithSource): WordWithSource => {
    return {
      ...word,
      incorrectCount: word.incorrectCount || 0,
      consecutiveIncorrect: word.consecutiveIncorrect || 0,
      consecutiveCorrect: word.consecutiveCorrect || 0,
      reviewCount: word.reviewCount || 0,
      correctCount: word.correctCount || 0,
      mastery: word.mastery || 1,
      lastReviewDate: word.lastReviewDate || word.collectedAt,
      nextReviewDate: word.nextReviewDate || word.collectedAt,
      interval: word.interval || 1,
      easeFactor: word.easeFactor || 2.5,
      totalStudyTime: word.totalStudyTime || 0,
      averageResponseTime: word.averageResponseTime || 0,
      confidence: word.confidence || 1
    };
  };
`;

// 在 VocabularyProvider 组件中添加初始化函数
if (!vocabularyContextContent.includes('initializeWordProgress')) {
  const providerStartIndex = vocabularyContextContent.indexOf('export const VocabularyProvider = ({ children }: { children: ReactNode }) => {');
  const insertIndex = vocabularyContextContent.indexOf('  const [vocabulary, setVocabulary] = useState<WordWithSource[]>([]);');
  
  vocabularyContextContent = vocabularyContextContent.slice(0, insertIndex) + 
    initializeWordProgressFunction + '\n  ' +
    vocabularyContextContent.slice(insertIndex);
}

// 修改 loadVocabularyFromStorage 函数，确保加载的数据有正确的字段
const loadVocabularyFromStorageRegex = /const loadVocabularyFromStorage = async \(\) => \{[\s\S]*?\};/;
const newLoadVocabularyFromStorage = `const loadVocabularyFromStorage = async () => {
    try {
      const storedData = await AsyncStorage.getItem(VOCABULARY_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // 确保所有单词都有正确的学习进度字段
        const initializedData = parsedData.map((word: WordWithSource) => initializeWordProgress(word));
        setVocabulary(initializedData);
        vocabularyLogger.info(\`从本地存储加载词汇数据: \${initializedData.length} 个单词\`);
      } else {
        // 如果没有本地数据，初始化为空数组
        setVocabulary([]);
        vocabularyLogger.info('本地存储中没有词汇数据，初始化为空数组');
      }
    } catch (error) {
      vocabularyLogger.error('加载本地词汇数据失败', error);
      setVocabulary([]);
    } finally {
      setIsLoaded(true);
    }
  };`;

vocabularyContextContent = vocabularyContextContent.replace(loadVocabularyFromStorageRegex, newLoadVocabularyFromStorage);

// 修改 updateWord 函数，确保更新的数据有正确的字段
const updateWordRegex = /const updateWord = \(word: string, data: Partial<WordWithSource>\) => \{[\s\S]*?\};/;
const newUpdateWord = `const updateWord = (word: string, data: Partial<WordWithSource>) => {
    setVocabulary(prev => prev.map(w => {
      if (w.word === word) {
        const updatedWord = { ...w, ...data };
        // 确保更新后的单词有正确的学习进度字段
        return initializeWordProgress(updatedWord);
      }
      return w;
    }));
  };`;

vocabularyContextContent = vocabularyContextContent.replace(updateWordRegex, newUpdateWord);

fs.writeFileSync(vocabularyContextPath, vocabularyContextContent);
console.log('✅ VocabularyContext 修复完成');

// 2. 修复 ReviewScreen 中的错词筛选逻辑
console.log('\n📝 2. 修复 ReviewScreen 错词筛选逻辑...');

const reviewScreenPath = path.join(__dirname, '../apps/mobile/src/screens/Review/ReviewScreen.tsx');
let reviewScreenContent = fs.readFileSync(reviewScreenPath, 'utf8');

// 添加错词筛选辅助函数
const wrongWordFilterFunction = `
  // 错词筛选辅助函数
  const isWrongWord = (word: any): boolean => {
    // 连续答对3次后从错词卡移除
    if ((word.consecutiveCorrect || 0) >= 3) {
      return false;
    }
    
    // 有答错记录或连续答错
    return (word.incorrectCount || 0) > 0 || (word.consecutiveIncorrect || 0) > 0;
  };
`;

// 在 ReviewScreen 组件中添加筛选函数
if (!reviewScreenContent.includes('isWrongWord')) {
  const componentStartIndex = reviewScreenContent.indexOf('const ReviewScreen: React.FC<ReviewScreenProps> = ({ type, id }) => {');
  const insertIndex = reviewScreenContent.indexOf('  const { vocabulary, updateWord } = useVocabulary();');
  
  reviewScreenContent = reviewScreenContent.slice(0, insertIndex) + 
    wrongWordFilterFunction + '\n  ' +
    reviewScreenContent.slice(insertIndex);
}

// 修改错词筛选逻辑
const wrongWordsFilterRegex = /const localWrongWords = vocabulary\.filter\(\(word: any\) => \{[\s\S]*?\}\);/;
const newWrongWordsFilter = `const localWrongWords = vocabulary.filter((word: any) => {
            console.log(\`🔍 检查单词: \${word.word}\`, {
              incorrectCount: word.incorrectCount,
              consecutiveIncorrect: word.consecutiveIncorrect,
              consecutiveCorrect: word.consecutiveCorrect,
              isWrongWord: isWrongWord(word)
            });
            return isWrongWord(word);
          });`;

reviewScreenContent = reviewScreenContent.replace(wrongWordsFilterRegex, newWrongWordsFilter);

fs.writeFileSync(reviewScreenPath, reviewScreenContent);
console.log('✅ ReviewScreen 错词筛选逻辑修复完成');

// 3. 修复 ReviewIntroScreen 中的错词数量计算
console.log('\n📝 3. 修复 ReviewIntroScreen 错词数量计算...');

const reviewIntroScreenPath = path.join(__dirname, '../apps/mobile/src/screens/Review/ReviewIntroScreen.tsx');
let reviewIntroScreenContent = fs.readFileSync(reviewIntroScreenPath, 'utf8');

// 添加错词筛选辅助函数
const introWrongWordFilterFunction = `
  // 错词筛选辅助函数
  const isWrongWord = (word: any): boolean => {
    // 连续答对3次后从错词卡移除
    if ((word.consecutiveCorrect || 0) >= 3) {
      return false;
    }
    
    // 有答错记录或连续答错
    return (word.incorrectCount || 0) > 0 || (word.consecutiveIncorrect || 0) > 0;
  };
`;

// 在 ReviewIntroScreen 组件中添加筛选函数
if (!reviewIntroScreenContent.includes('isWrongWord')) {
  const componentStartIndex = reviewIntroScreenContent.indexOf('const ReviewIntroScreen = () => {');
  const insertIndex = reviewIntroScreenContent.indexOf('  const { vocabulary } = useVocabulary();');
  
  reviewIntroScreenContent = reviewIntroScreenContent.slice(0, insertIndex) + 
    introWrongWordFilterFunction + '\n  ' +
    reviewIntroScreenContent.slice(insertIndex);
}

// 修改错词数量计算逻辑
const wrongWordsCountRegex = /const localWrongWords = vocabulary\.filter\(\(word: any\) => \{[\s\S]*?\}\);/g;
const newWrongWordsCount = `const localWrongWords = vocabulary.filter((word: any) => {
            console.log(\`🔍 ReviewIntroScreen 检查单词: \${word.word}\`, {
              incorrectCount: word.incorrectCount,
              consecutiveIncorrect: word.consecutiveIncorrect,
              consecutiveCorrect: word.consecutiveCorrect,
              isWrongWord: isWrongWord(word)
            });
            return isWrongWord(word);
          });`;

reviewIntroScreenContent = reviewIntroScreenContent.replace(wrongWordsCountRegex, newWrongWordsCount);

fs.writeFileSync(reviewIntroScreenPath, reviewIntroScreenContent);
console.log('✅ ReviewIntroScreen 错词数量计算修复完成');

// 4. 创建数据验证脚本
console.log('\n📝 4. 创建数据验证脚本...');

const validationScript = `#!/usr/bin/env node

/**
 * 错词卡数据验证脚本
 * 用于调试和验证错词卡数据完整性
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证错词卡数据...\\n');

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
    console.log(\`❌ \${word.word}: 连续答对\${word.consecutiveCorrect || 0}次，从错词卡移除\`);
    return false;
  }
  
  // 有答错记录或连续答错
  const hasWrongRecord = (word.incorrectCount || 0) > 0 || (word.consecutiveIncorrect || 0) > 0;
  if (hasWrongRecord) {
    console.log(\`✅ \${word.word}: 符合错词条件 (incorrectCount=\${word.incorrectCount || 0}, consecutiveIncorrect=\${word.consecutiveIncorrect || 0})\`);
  } else {
    console.log(\`❌ \${word.word}: 不符合错词条件 (incorrectCount=\${word.incorrectCount || 0}, consecutiveIncorrect=\${word.consecutiveIncorrect || 0})\`);
  }
  return hasWrongRecord;
};

// 验证数据字段完整性
const validateDataFields = () => {
  console.log('🔍 验证数据字段完整性...');
  mockVocabulary.forEach(word => {
    if (typeof word.incorrectCount === 'undefined') {
      console.warn(\`⚠️ 单词 \${word.word} 缺少 incorrectCount 字段\`);
    }
    if (typeof word.consecutiveIncorrect === 'undefined') {
      console.warn(\`⚠️ 单词 \${word.word} 缺少 consecutiveIncorrect 字段\`);
    }
    if (typeof word.consecutiveCorrect === 'undefined') {
      console.warn(\`⚠️ 单词 \${word.word} 缺少 consecutiveCorrect 字段\`);
    }
  });
};

// 测试错词筛选
const testWrongWordFilter = () => {
  console.log('\\n🔍 测试错词筛选逻辑...');
  const wrongWords = mockVocabulary.filter(isWrongWord);
  console.log(\`\\n📊 筛选结果: \${wrongWords.length} 个错词\`);
  console.log('错词列表:', wrongWords.map(w => w.word));
};

validateDataFields();
testWrongWordFilter();

console.log('\\n✅ 数据验证完成');
`;

const validationScriptPath = path.join(__dirname, 'validate-wrong-words-data.js');
fs.writeFileSync(validationScriptPath, validationScript);
console.log('✅ 数据验证脚本创建完成');

// 5. 创建测试脚本
console.log('\n📝 5. 创建测试脚本...');

const testScript = `#!/usr/bin/env node

/**
 * 错词卡功能测试脚本
 * 模拟完整的错词卡流程
 */

console.log('🧪 开始测试错词卡功能...\\n');

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

console.log('\\n🔄 测试场景1: 答错 apple');
updateWordProgress('apple', false);
console.log('答错后错词数量:', getWrongWordsCount());

console.log('\\n🔄 测试场景2: 答对 apple');
updateWordProgress('apple', true);
console.log('答对后错词数量:', getWrongWordsCount());

console.log('\\n🔄 测试场景3: 连续答对 apple 3次');
updateWordProgress('apple', true);
updateWordProgress('apple', true);
updateWordProgress('apple', true);
console.log('连续答对3次后错词数量:', getWrongWordsCount());

console.log('\\n🔄 测试场景4: 答错 banana');
updateWordProgress('banana', false);
console.log('答错 banana 后错词数量:', getWrongWordsCount());

console.log('\\n📊 最终状态:');
console.log('词汇表:', vocabulary);
console.log('错词数量:', getWrongWordsCount());

console.log('\\n✅ 错词卡功能测试完成');
`;

const testScriptPath = path.join(__dirname, 'test-wrong-words-functionality.js');
fs.writeFileSync(testScriptPath, testScript);
console.log('✅ 测试脚本创建完成');

console.log('\n🎉 错词卡逻辑修复完成！');
console.log('\n📋 修复内容总结:');
console.log('1. ✅ VocabularyContext 数据字段初始化');
console.log('2. ✅ ReviewScreen 错词筛选逻辑优化');
console.log('3. ✅ ReviewIntroScreen 错词数量计算修复');
console.log('4. ✅ 数据验证脚本创建');
console.log('5. ✅ 功能测试脚本创建');
console.log('\n🚀 下一步:');
console.log('1. 运行测试脚本: node scripts/test-wrong-words-functionality.js');
console.log('2. 运行验证脚本: node scripts/validate-wrong-words-data.js');
console.log('3. 重新构建应用并测试错词卡功能');
console.log('4. 检查日志输出，确认错词筛选逻辑正常工作'); 