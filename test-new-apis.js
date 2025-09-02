const https = require('https');

const BASE_URL = 'https://dramawordv2.onrender.com';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'dramawordv2.onrender.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAPIs() {
  console.log('🧪 测试新API端点...\n');
  
  const tests = [
    { name: '健康检查', path: '/health' },
    { name: '设备管理测试', path: '/api/device/test' },
    { name: '数据版本测试', path: '/api/data-version/test' },
    { name: '网络状态测试', path: '/api/network/test' },
    { name: '现有API测试', path: '/api/words/search', method: 'POST', data: { word: 'test' } }
  ];
  
  for (const test of tests) {
    try {
      console.log(`🔍 测试: ${test.name}`);
      const result = await makeRequest(test.path, test.method, test.data);
      console.log(`   状态: ${result.status}`);
      console.log(`   响应: ${JSON.stringify(result.data).substring(0, 100)}...`);
      console.log('');
    } catch (error) {
      console.log(`   ❌ 错误: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('✅ API测试完成');
}

testAPIs();
