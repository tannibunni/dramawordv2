// 测试EN界面下英文单词翻译为中文的功能
const { analyzeInput, getQuerySuggestions } = require('./apps/mobile/src/utils/inputDetector.js');

function testEnglishWordTranslation() {
  console.log('=== 测试EN界面下英文单词翻译为中文 ===');
  
  const testCases = [
    { input: 'game', uiLanguage: 'en-US', targetLanguage: 'zh' },
    { input: 'hello', uiLanguage: 'en-US', targetLanguage: 'zh' },
    { input: 'love', uiLanguage: 'en-US', targetLanguage: 'zh' },
    { input: 'water', uiLanguage: 'en-US', targetLanguage: 'zh' }
  ];
  
  testCases.forEach(testCase => {
    console.log(`\n--- 测试输入: "${testCase.input}" ---`);
    
    // 1. 分析输入类型
    const analysis = analyzeInput(testCase.input);
    console.log('输入分析结果:', analysis);
    
    // 2. 获取查询建议
    const suggestions = getQuerySuggestions(analysis);
    console.log('查询建议:', suggestions);
    
    // 3. 检查是否应该直接翻译
    const shouldTranslateDirectly = testCase.uiLanguage === 'en-US' && 
                                   testCase.targetLanguage === 'zh' && 
                                   analysis.type === 'english';
    
    console.log(`是否应该直接翻译: ${shouldTranslateDirectly}`);
    
    if (shouldTranslateDirectly) {
      console.log('✅ 应该调用英文翻译中文功能');
    } else {
      console.log('❌ 不会调用翻译功能');
    }
  });
}

testEnglishWordTranslation();
