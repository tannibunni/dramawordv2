const https = require('https');

const SERVER_URL = 'https://dramawordv2.onrender.com';

async function debugTokenIssue() {
  console.log('🔍 调试Token问题...');
  
  // 测试不同的token格式
  const testCases = [
    { name: '空token', token: '' },
    { name: '无效token', token: 'invalid-token' },
    { name: '格式错误的Bearer', token: 'Bearer' },
    { name: '缺少Bearer前缀', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QiLCJpYXQiOjE2MzQ1Njc4OTAsImV4cCI6MTYzNDU3MTQ5MH0.test' },
    { name: '正确的Bearer格式', token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QiLCJpYXQiOjE2MzQ1Njc4OTAsImV4cCI6MTYzNDU3MTQ5MH0.test' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 测试: ${testCase.name}`);
    try {
      const response = await makeRequest('/api/sync/status', testCase.token);
      console.log(`✅ 成功: ${response.status || 'OK'}`);
      if (response.message) {
        console.log(`📝 消息: ${response.message}`);
      }
    } catch (error) {
      console.log(`❌ 失败: ${error.message}`);
    }
  }
  
  console.log('\n📊 调试完成');
  console.log('如果所有测试都返回认证错误，说明服务器认证正常工作');
}

function makeRequest(path, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dramawordv2.onrender.com',
      port: 443,
      path: path,
      method: 'GET',
      timeout: 10000
    };

    if (token) {
      options.headers = {
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
      };
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.end();
  });
}

debugTokenIssue(); 