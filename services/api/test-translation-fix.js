// 测试翻译修复
const { directTranslate } = require('./dist/controllers/directTranslationController');

// 模拟请求和响应对象
const mockReq = {
  body: {
    text: 'i want a new phone',
    uiLanguage: 'en-US'
  }
};

const mockRes = {
  json: (data) => {
    console.log('📊 返回数据:');
    console.log('  - 成功:', data.success);
    console.log('  - 原文:', data.data?.word);
    console.log('  - 语言:', data.data?.language);
    console.log('  - 翻译:', data.data?.translation);
    console.log('  - 释义:', data.data?.definitions?.[0]?.definition);
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

async function testTranslationFix() {
  try {
    console.log('🔍 测试翻译修复...');
    console.log('📝 测试文本:', mockReq.body.text);
    
    await directTranslate(mockReq, mockRes);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testTranslationFix();
