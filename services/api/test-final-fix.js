// 测试最终修复结果
const https = require('https');

async function testFinalFix() {
  console.log('🔍 测试最终修复结果...\n');
  
  const testText = '请出去';
  const renderUrl = 'https://dramawordv2.onrender.com';
  
  console.log('📋 测试参数:');
  console.log(`- 后端地址: ${renderUrl}`);
  console.log(`- 测试文本: ${testText}`);
  console.log(`- 目标语言: ja (日语)\n`);
  
  // 测试直接翻译API
  console.log('🚀 测试直接翻译API...');
  await testDirectTranslationAPI(renderUrl, testText);
  
  console.log('\n✅ 测试完成!');
  console.log('📊 预期结果:');
  console.log('- ✅ 无Jotoba错误');
  console.log('- ✅ 翻译来源显示google_translation');
  console.log('- ✅ 有audioUrl音频链接');
  console.log('- ✅ 有罗马音显示');
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
        console.log(`- 音频URL: ${result.data.audioUrl ? '已生成' : '❌ 缺失'}`);
        
        if (result.data.audioUrl) {
          console.log(`📱 音频链接: ${result.data.audioUrl}`);
        }
      }
    } else {
      console.log(`❌ 直接翻译失败: ${response.statusCode}`);
      console.log(`📊 错误响应: ${response.body}`);
    }
    
  } catch (error) {
    console.error(`❌ 直接翻译测试失败:`, error.message);
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
testFinalFix();
