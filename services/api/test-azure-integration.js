// 测试Azure翻译集成
const { directTranslate } = require('./dist/controllers/directTranslationController');

// 模拟请求和响应对象
const mockReq = {
  body: {
    text: 'i like chinese food',
    uiLanguage: 'en-US'
  }
};

const mockRes = {
  json: (data) => {
    console.log('📊 返回数据:', JSON.stringify(data, null, 2));
  },
  status: (code) => {
    console.log(`📊 状态码: ${code}`);
    return {
      json: (data) => {
        console.log('📊 错误数据:', JSON.stringify(data, null, 2));
      }
    };
  }
};

async function testAzureIntegration() {
  try {
    console.log('🔍 测试Azure翻译集成...');
    console.log('📝 测试文本:', mockReq.body.text);
    
    await directTranslate(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testAzureIntegration();
