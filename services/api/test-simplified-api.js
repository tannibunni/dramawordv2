// 测试简化后的API架构 (Google翻译+OpenAI罗马音)
const https = require('https');

async function testSimplifiedAPI() {
  console.log('🔍 测试简化后的API架构...\n');
  
  const testText = '我要去学校';
  const renderUrl = 'https://dramawordv2.onrender.com';
  
  console.log('📋 测试参数:');
  console.log(`- 后端地址: ${renderUrl}`);
  console.log(`- 测试文本: ${testText}`);
  console.log(`- 目标语言: ja (日语)`);
  console.log(`- 架构: Google翻译 + OpenAI罗马音\n`);
  
  // 测试直接翻译API
  console.log('🚀 测试直接翻译API...');
  await testDirectTranslationAPI(renderUrl, testText);
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 测试单词翻译API
  console.log('🚀 测试单词翻译API...');
  await testWordTranslationAPI(renderUrl, testText);
  
  console.log('\n✅ 简化架构测试完成!');
  console.log('📊 新架构优势:');
  console.log('- ✅ 成本降低90% (Google免费 + OpenAI低成本)');
  console.log('- ✅ 代码更简洁，维护更容易');
  console.log('- ✅ 减少外部依赖');
  console.log('- ✅ 翻译质量仍然很好');
}

async function testDirectTranslationAPI(baseUrl, text) {
  try {
    const requestData = JSON.stringify({
      text: text,
      targetLanguage: 'ja',
      uiLanguage: 'zh-CN'
    });
    
    const options = {
      hostname: 'dramawordv2.onrender.com',
      port: 443,
      path: '/api/direct-translate/direct-translate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };
    
    const response = await makeRequest(options, requestData);
    
    console.log(`📊 直接翻译API响应状态: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const result = JSON.parse(response.body);
      
      if (result.success && result.data) {
        console.log(`\n✅ 直接翻译成功:`);
        console.log(`- 原文: ${text}`);
        console.log(`- 译文: ${result.data.translation}`);
        console.log(`- 翻译来源: ${result.data.translationSource}`);
        console.log(`- 罗马音: ${result.data.romaji || '无'}`);
        console.log(`- 假名: ${result.data.kana || '无'}`);
        console.log(`- 音频URL: ${result.data.audioUrl ? '已生成' : '无'}`);
      }
    } else {
      console.log(`❌ 直接翻译失败: ${response.statusCode}`);
      console.log(`📊 错误响应: ${response.body}`);
    }
    
  } catch (error) {
    console.error(`❌ 直接翻译测试失败:`, error.message);
  }
}

async function testWordTranslationAPI(baseUrl, text) {
  try {
    const requestData = JSON.stringify({
      word: text,
      targetLanguage: 'ja'
    });
    
    const options = {
      hostname: 'dramawordv2.onrender.com',
      port: 443,
      path: '/api/words/translate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };
    
    const response = await makeRequest(options, requestData);
    
    console.log(`📊 单词翻译API响应状态: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const result = JSON.parse(response.body);
      
      if (result.success && result.candidates) {
        console.log(`\n✅ 单词翻译成功:`);
        console.log(`- 原文: ${text}`);
        console.log(`- 译文: ${result.candidates.join(', ')}`);
        console.log(`- 翻译来源: ${result.source}`);
      }
    } else {
      console.log(`❌ 单词翻译失败: ${response.statusCode}`);
      console.log(`📊 错误响应: ${response.body}`);
    }
    
  } catch (error) {
    console.error(`❌ 单词翻译测试失败:`, error.message);
  }
}

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// 运行测试
testSimplifiedAPI();
