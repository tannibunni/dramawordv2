// 测试多语言功能
const API_BASE_URL = 'https://dramawordv2.onrender.com/api';

async function testMultilanguage() {
  console.log('🌍 测试多语言功能...\n');

  const testCases = [
    { word: 'hello', language: 'en', description: '英语单词' },
    { word: '사과', language: 'ko', description: '韩语单词（苹果）' },
    { word: 'りんご', language: 'ja', description: '日语单词（苹果）' },
  ];

  for (const testCase of testCases) {
    console.log(`📝 测试 ${testCase.description}: "${testCase.word}" (${testCase.language})`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/words/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: testCase.word,
          language: testCase.language
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 成功');
        console.log(`   释义: ${result.data.definitions?.[0]?.definition || '无释义'}`);
        console.log(`   例句: ${result.data.definitions?.[0]?.examples?.[0]?.english || '无例句'}`);
        console.log(`   翻译: ${result.data.definitions?.[0]?.examples?.[0]?.chinese || '无翻译'}`);
        console.log(`   来源: ${result.source}`);
        
        // 详细日志
        if (result.source === 'ai') {
          console.log('   🔍 AI响应详情:');
          console.log(`      例句字段: ${JSON.stringify(result.data.definitions?.[0]?.examples?.[0])}`);
        }
      } else {
        console.log('❌ 失败:', result.error);
      }
    } catch (error) {
      console.log('❌ 请求失败:', error.message);
    }
    
    console.log('');
  }
}

// 运行测试
testMultilanguage().catch(console.error); 