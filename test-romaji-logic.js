// 测试罗马音识别逻辑修复
console.log('=== 测试罗马音识别逻辑修复 ===');

// 模拟输入分析逻辑
function mockAnalyzeInput(input, targetLanguage) {
  const trimmed = input.trim();
  const englishChars = (trimmed.match(/[a-zA-Z]/g) || []).length;
  const englishRatio = englishChars / trimmed.length;
  
  // 模拟isLikelyRomaji函数
  function isLikelyRomaji(input) {
    if (!/^[a-zA-Z]+$/.test(input)) return false;
    if (input.length < 2 || input.length > 20) return false;
    
    const commonEnglishWords = ['the', 'and', 'or', 'but', 'game', 'hello', 'love'];
    if (commonEnglishWords.includes(input.toLowerCase())) return false;
    
    // 简单的罗马音模式检测
    const romajiPatterns = [
      /^[aeiou]/i,
      /[aeiou]$/i,
      /^[kgsztdnhbpmyrw][aeiou]/i,
    ];
    
    return romajiPatterns.some(pattern => pattern.test(input));
  }
  
  if (englishRatio > 0.7) {
    const isRomaji = isLikelyRomaji(trimmed);
    
    if (isRomaji && targetLanguage === 'ja') {
      return {
        type: 'romaji',
        confidence: 0.8
      };
    } else {
      return {
        type: 'english',
        confidence: 0.8
      };
    }
  }
  
  return {
    type: 'english',
    confidence: 0.3
  };
}

// 测试用例
const testCases = [
  { input: 'game', targetLanguage: 'ja', expected: 'romaji' },
  { input: 'game', targetLanguage: 'zh', expected: 'english' },
  { input: 'hello', targetLanguage: 'ja', expected: 'english' }, // hello是常见英文单词
  { input: 'hello', targetLanguage: 'zh', expected: 'english' },
  { input: 'konnichiwa', targetLanguage: 'ja', expected: 'romaji' },
  { input: 'konnichiwa', targetLanguage: 'zh', expected: 'english' },
];

testCases.forEach(testCase => {
  const result = mockAnalyzeInput(testCase.input, testCase.targetLanguage);
  const passed = result.type === testCase.expected;
  
  console.log(`输入: "${testCase.input}", 目标语言: ${testCase.targetLanguage}`);
  console.log(`结果: ${result.type}, 期望: ${testCase.expected}, ${passed ? '✅ 通过' : '❌ 失败'}`);
  console.log('---');
});
