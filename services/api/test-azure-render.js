// 测试Azure翻译服务在Render上的配置
const https = require('https');

async function testAzureOnRender() {
  try {
    console.log('🔍 测试Azure翻译服务在Render上的配置...\n');
    
    const testText = '我要去学校';
    const endpoint = 'https://dramaword.cognitiveservices.azure.com/';
    const apiKey = 'YOUR_AZURE_API_KEY_HERE'; // 请在测试时替换为实际的API密钥
    
    console.log('📋 测试参数:');
    console.log(`- 端点: ${endpoint}`);
    console.log(`- API密钥: ${apiKey.substring(0, 10)}...`);
    console.log(`- 测试文本: ${testText}`);
    console.log(`- 目标语言: ja (日语)\n`);
    
    // 构建请求数据
    const requestData = JSON.stringify([
      {
        text: testText
      }
    ]);
    
    const options = {
      hostname: 'dramaword.cognitiveservices.azure.com',
      port: 443,
      path: '/translate?api-version=3.0&from=zh-Hans&to=ja',
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };
    
    console.log('🚀 发送Azure翻译请求...');
    
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(requestData);
      req.end();
    });
    
    console.log(`📊 响应状态: ${response.statusCode}`);
    console.log(`📊 响应头:`, JSON.stringify(response.headers, null, 2));
    
    if (response.statusCode === 200) {
      const result = JSON.parse(response.body);
      console.log(`📊 响应数据:`, JSON.stringify(result, null, 2));
      
      if (result && result[0] && result[0].translations && result[0].translations[0]) {
        const translatedText = result[0].translations[0].text;
        console.log(`\n✅ Azure翻译成功:`);
        console.log(`- 原文: ${testText}`);
        console.log(`- 译文: ${translatedText}`);
        console.log(`- 来源: Azure Translator API`);
      } else {
        console.log(`❌ 响应格式无效`);
      }
    } else {
      console.log(`❌ Azure翻译失败: ${response.statusCode}`);
      console.log(`📊 错误响应: ${response.body}`);
    }
    
  } catch (error) {
    console.error(`❌ 测试失败:`, error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log(`🔍 可能的原因: 域名解析失败`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`🔍 可能的原因: 连接被拒绝`);
    } else if (error.code === 'CERT_HAS_EXPIRED') {
      console.log(`🔍 可能的原因: SSL证书过期`);
    }
  }
}

// 运行测试
testAzureOnRender();
