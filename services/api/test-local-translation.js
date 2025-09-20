// 测试本地翻译功能
const { translateChineseToEnglish } = require('./dist/controllers/wordController');

async function testLocalTranslation() {
  try {
    console.log('🔍 测试本地中文翻译到日文...');
    
    // 模拟请求对象
    const req = {
      body: {
        word: '我吃中餐',
        targetLanguage: 'ja'
      }
    };
    
    // 模拟响应对象
    const res = {
      status: (code) => ({
        json: (data) => {
          console.log('📊 响应状态:', code);
          console.log('📊 响应数据:', JSON.stringify(data, null, 2));
          return res;
        }
      }),
      json: (data) => {
        console.log('📊 响应数据:', JSON.stringify(data, null, 2));
      }
    };
    
    await translateChineseToEnglish(req, res);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行测试
testLocalTranslation();
