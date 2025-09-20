// 测试Jotoba API状态
const axios = require('axios');

async function testJotobaAPI() {
  try {
    console.log('🔍 测试Jotoba API状态...\n');
    
    const testCases = [
      '私は家に帰ります',  // 句子（会失败）
      '家',               // 单词（应该成功）
      '帰る',             // 动词（应该成功）
      '私',               // 代词（应该成功）
    ];
    
    for (const text of testCases) {
      console.log(`📝 测试: "${text}"`);
      
      try {
        const response = await axios.post('https://jotoba.de/api/search', {
          query: text,
          language: 'english',
          no_english: false,
          page_size: 1
        }, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'DramaWord/1.0'
          }
        });
        
        console.log(`📊 状态: ${response.status}`);
        console.log(`📊 数据:`, JSON.stringify(response.data, null, 2));
        
        if (response.data.words && response.data.words.length > 0) {
          const word = response.data.words[0];
          console.log(`✅ Jotoba成功: ${text}`);
          console.log(`📊 罗马音: ${word.reading || 'N/A'}`);
          console.log(`📊 假名: ${word.kana || 'N/A'}`);
        } else {
          console.log(`⚠️ Jotoba返回空结果: ${text}`);
        }
        
      } catch (error) {
        console.error(`❌ Jotoba失败: ${text} - ${error.message}`);
        if (error.response) {
          console.error(`📊 错误状态: ${error.response.status}`);
          console.error(`📊 错误数据:`, error.response.data);
        }
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
    }
    
    console.log('🎯 分析:');
    console.log('- 如果单词成功但句子失败: Jotoba只支持单词查询');
    console.log('- 如果所有查询都失败: Jotoba API可能有问题');
    console.log('- 如果返回404: API端点可能变更');
    console.log('- 当前降级方案: Jotoba -> OpenAI -> Wanakana');
    
  } catch (error) {
    console.error('❌ Jotoba API测试失败:', error.message);
  }
}

// 运行测试
testJotobaAPI();
