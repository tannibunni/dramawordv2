// 测试日语搜索功能
const API_BASE_URL = 'https://dramawordv2.onrender.com/api';

async function testJapaneseSearch() {
  console.log('🎯 测试日语搜索功能');
  
  const testWords = ['こんにちは', 'ありがとう', 'りんご', '水'];
  
  for (const word of testWords) {
    console.log(`\n🔍 测试单词: ${word}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/words/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          word: word.toLowerCase().trim(),
          language: 'ja'
        }),
      });

      console.log(`📊 响应状态: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ 搜索成功');
        console.log('📄 返回数据:', JSON.stringify(result, null, 2));
        
        if (result.data && result.data.definitions) {
          console.log('📝 释义数量:', result.data.definitions.length);
          result.data.definitions.forEach((def, idx) => {
            console.log(`  释义 ${idx + 1}: ${def.definition}`);
            if (def.examples) {
              def.examples.forEach((ex, exIdx) => {
                console.log(`    例句 ${exIdx + 1}: ${ex.english} -> ${ex.chinese}`);
              });
            }
          });
        }
      } else {
        const errorText = await response.text();
        console.log('❌ 搜索失败');
        console.log('📄 错误响应:', errorText);
      }
    } catch (error) {
      console.log('❌ 请求错误:', error.message);
    }
  }
}

// 运行测试
testJapaneseSearch().catch(console.error); 