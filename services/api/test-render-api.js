// 测试Render上的后端API
const https = require('https');

async function testRenderAPI() {
  try {
    console.log('🔍 测试Render后端API...\n');
    
    const testText = '我要去学校';
    const renderUrl = 'https://dramawordv2.onrender.com';
    
    console.log('📋 测试参数:');
    console.log(`- 后端地址: ${renderUrl}`);
    console.log(`- 测试文本: ${testText}`);
    console.log(`- 目标语言: ja (日语)\n`);
    
    // 测试1: 直接翻译API
    console.log('🚀 测试1: 直接翻译API...');
    await testDirectTranslationAPI(renderUrl, testText);
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 测试2: 单词翻译API
    console.log('🚀 测试2: 单词翻译API...');
    await testWordTranslationAPI(renderUrl, testText);
    
  } catch (error) {
    console.error(`❌ 测试失败:`, error.message);
  }
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
      console.log(`📊 响应数据:`, JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        console.log(`\n✅ 直接翻译成功:`);
        console.log(`- 原文: ${text}`);
        console.log(`- 译文: ${result.data.translation}`);
        console.log(`- 翻译来源: ${result.data.translationSource || '未指定'}`);
        console.log(`- 罗马音: ${result.data.romaji || '无'}`);
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
      console.log(`📊 响应数据:`, JSON.stringify(result, null, 2));
      
      if (result.success && result.candidates) {
        console.log(`\n✅ 单词翻译成功:`);
        console.log(`- 原文: ${text}`);
        console.log(`- 译文: ${result.candidates.join(', ')}`);
        console.log(`- 翻译来源: ${result.source || '未指定'}`);
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
testRenderAPI();
