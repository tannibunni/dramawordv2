// 测试Azure中文到日文翻译的具体问题
const axios = require('axios');

async function testAzureChineseJapanese() {
  try {
    console.log('🔍 测试Azure中文到日文翻译的具体问题...\n');
    
    // 1. 测试英文翻译（确认Azure工作正常）
    console.log('1️⃣ 测试英文翻译（确认Azure工作正常）:');
    try {
      const response = await axios.post('https://dramawordv2.onrender.com/api/words/translate', {
        word: 'hello',
        targetLanguage: 'ja'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log(`📊 状态: ${response.status}`);
      console.log(`📊 成功: ${response.data.success}`);
      console.log(`📊 候选词: ${JSON.stringify(response.data.candidates)}`);
      console.log(`📊 来源: ${response.data.source}`);
      
      if (response.data.source === 'azure_translation') {
        console.log('✅ Azure英文翻译工作正常');
      } else {
        console.log(`⚠️ 英文翻译使用了其他服务: ${response.data.source}`);
      }
    } catch (error) {
      console.error(`❌ 英文翻译测试失败: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. 测试中文翻译（问题所在）
    console.log('2️⃣ 测试中文翻译（问题所在）:');
    try {
      const response = await axios.post('https://dramawordv2.onrender.com/api/words/translate', {
        word: '你好',
        targetLanguage: 'ja'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log(`📊 状态: ${response.status}`);
      console.log(`📊 成功: ${response.data.success}`);
      console.log(`📊 候选词: ${JSON.stringify(response.data.candidates)}`);
      console.log(`📊 来源: ${response.data.source}`);
      
      if (response.data.source === 'azure_translation') {
        console.log('✅ Azure中文翻译工作正常');
      } else {
        console.log(`⚠️ 中文翻译使用了其他服务: ${response.data.source}`);
        console.log('💡 可能原因: Azure不支持中文到日文翻译，或配置问题');
      }
    } catch (error) {
      console.error(`❌ 中文翻译测试失败: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. 测试Azure翻译API的详细配置
    console.log('3️⃣ 测试Azure翻译API的详细配置:');
    try {
      const response = await axios.post('https://dramawordv2.onrender.com/api/direct-translate/direct-translate', {
        text: '你好',
        targetLanguage: 'ja',
        uiLanguage: 'zh-CN'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log(`📊 状态: ${response.status}`);
      console.log(`📊 成功: ${response.data.success}`);
      if (response.data.success && response.data.data) {
        console.log(`📊 翻译结果: ${response.data.data.translation}`);
        console.log(`📊 罗马音: ${response.data.data.romaji}`);
        console.log(`📊 音频URL: ${response.data.data.audioUrl}`);
        console.log('✅ 直接翻译API工作正常');
      } else {
        console.log(`📊 翻译失败: ${response.data.error}`);
      }
    } catch (error) {
      console.error(`❌ 直接翻译API测试失败: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 4. 测试不同的中文词汇
    console.log('4️⃣ 测试不同的中文词汇:');
    const testWords = ['你好', '谢谢', '再见', '我', '你', '他'];
    
    for (const word of testWords) {
      try {
        const response = await axios.post('https://dramawordv2.onrender.com/api/words/translate', {
          word: word,
          targetLanguage: 'ja'
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        });
        
        console.log(`📝 "${word}" -> 来源: ${response.data.source}, 候选词: ${JSON.stringify(response.data.candidates)}`);
        
      } catch (error) {
        console.error(`❌ "${word}" 测试失败: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Azure中文日文测试失败:', error.message);
  }
}

// 运行测试
testAzureChineseJapanese();
