// 测试所有语言组合的翻译
const axios = require('axios');

async function testAllTranslations() {
  try {
    console.log('🔍 全面测试翻译功能...\n');
    
    const testCases = [
      // 中文到日文
      { word: '我吃中餐', targetLanguage: 'ja', expected: '中華料理を食べます' },
      { word: '你好', targetLanguage: 'ja', expected: 'こんにちは' },
      { word: '谢谢', targetLanguage: 'ja', expected: 'ありがとう' },
      { word: '天空', targetLanguage: 'ja', expected: '空' },
      { word: '水', targetLanguage: 'ja', expected: '水' },
      
      // 中文到英文
      { word: '天空', targetLanguage: 'en', expected: 'sky' },
      { word: '水', targetLanguage: 'en', expected: 'water' },
      { word: '苹果', targetLanguage: 'en', expected: 'apple' },
      { word: '书', targetLanguage: 'en', expected: 'book' },
      { word: '朋友', targetLanguage: 'en', expected: 'friend' },
      
      // 中文到韩文
      { word: '你好', targetLanguage: 'ko', expected: '안녕하세요' },
      { word: '谢谢', targetLanguage: 'ko', expected: '감사합니다' },
      
      // 中文到法文
      { word: '你好', targetLanguage: 'fr', expected: 'bonjour' },
      { word: '谢谢', targetLanguage: 'fr', expected: 'merci' },
      
      // 中文到西班牙文
      { word: '你好', targetLanguage: 'es', expected: 'hola' },
      { word: '谢谢', targetLanguage: 'es', expected: 'gracias' }
    ];
    
    let successCount = 0;
    let totalCount = testCases.length;
    
    for (const testCase of testCases) {
      console.log(`📝 测试: ${testCase.word} -> ${testCase.targetLanguage}`);
      
      try {
        const response = await axios.post('https://dramawordv2.onrender.com/api/words/translate', {
          word: testCase.word,
          targetLanguage: testCase.targetLanguage
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        
        if (response.data.success && response.data.candidates && response.data.candidates.length > 0) {
          const translation = response.data.candidates[0];
          console.log(`✅ 翻译成功: ${testCase.word} -> ${translation}`);
          console.log(`📊 来源: ${response.data.source}`);
          successCount++;
        } else {
          console.log(`❌ 翻译失败: 候选词为空`);
        }
        
      } catch (error) {
        console.error(`❌ 测试失败: ${error.message}`);
      }
      
      console.log(''); // 空行分隔
    }
    
    console.log(`\n📊 测试总结:`);
    console.log(`✅ 成功: ${successCount}/${totalCount}`);
    console.log(`❌ 失败: ${totalCount - successCount}/${totalCount}`);
    console.log(`📈 成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ 总体测试失败:', error.message);
  }
}

// 运行测试
testAllTranslations();
