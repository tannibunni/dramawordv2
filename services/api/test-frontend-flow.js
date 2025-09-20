// 测试前端翻译流程
const axios = require('axios');

async function testFrontendFlow() {
  try {
    console.log('🔍 测试前端翻译流程...\n');
    
    // 模拟前端调用直接翻译API（用于句子翻译）
    console.log('📱 测试句子翻译流程 (direct-translate):');
    
    const sentenceTests = [
      { text: '我吃中餐', targetLanguage: 'ja' },
      { text: 'Hello world', targetLanguage: 'ja' },
      { text: 'I love you', targetLanguage: 'zh' },
      { text: 'Good morning', targetLanguage: 'ja' }
    ];
    
    for (const test of sentenceTests) {
      console.log(`📝 句子翻译: "${test.text}" -> ${test.targetLanguage}`);
      
      try {
        const response = await axios.post('https://dramawordv2.onrender.com/api/direct-translate/direct-translate', {
          text: test.text,
          targetLanguage: test.targetLanguage,
          uiLanguage: 'zh-CN'
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        
        if (response.data.success && response.data.data) {
          const result = response.data.data;
          console.log(`✅ 翻译成功:`);
          console.log(`   - 原文: ${result.word}`);
          console.log(`   - 翻译: ${result.translation}`);
          console.log(`   - 语言: ${result.language}`);
          if (result.phonetic) console.log(`   - 音标: ${result.phonetic}`);
          if (result.kana) console.log(`   - 假名: ${result.kana}`);
        } else {
          console.log(`❌ 翻译失败: ${response.data.error || '未知错误'}`);
        }
        
      } catch (error) {
        console.error(`❌ 测试失败: ${error.message}`);
      }
      
      console.log(''); // 空行分隔
    }
    
    console.log('📱 测试单词翻译流程 (words/translate):');
    
    const wordTests = [
      { word: '我吃中餐', targetLanguage: 'ja' },
      { word: '天空', targetLanguage: 'ja' },
      { word: '你好', targetLanguage: 'en' }
    ];
    
    for (const test of wordTests) {
      console.log(`📝 单词翻译: "${test.word}" -> ${test.targetLanguage}`);
      
      try {
        const response = await axios.post('https://dramawordv2.onrender.com/api/words/translate', {
          word: test.word,
          targetLanguage: test.targetLanguage
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        
        if (response.data.success && response.data.candidates && response.data.candidates.length > 0) {
          console.log(`✅ 翻译成功: ${response.data.candidates.join(', ')}`);
          console.log(`📊 来源: ${response.data.source}`);
        } else {
          console.log(`❌ 翻译失败: 候选词为空`);
        }
        
      } catch (error) {
        console.error(`❌ 测试失败: ${error.message}`);
      }
      
      console.log(''); // 空行分隔
    }
    
  } catch (error) {
    console.error('❌ 前端流程测试失败:', error.message);
  }
}

// 运行测试
testFrontendFlow();
