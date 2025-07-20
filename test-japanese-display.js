const API_BASE_URL = 'https://dramawordv2.onrender.com/api/words';

// 测试日语显示效果
async function testJapaneseDisplay() {
  console.log('🧪 测试日语词卡显示效果...\n');
  
  const testWords = [
    { input: 'watashi', expected: '私' },
    { input: 'taberu', expected: '食べる' },
    { input: 'nomu', expected: '飲む' },
    { input: 'iku', expected: '行く' }
  ];
  
  for (const testCase of testWords) {
    console.log(`📝 测试: ${testCase.input}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: testCase.input,
          language: 'ja'
        }),
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        console.log(`  主要词语: ${data.data.correctedWord}`);
        console.log(`  假名标注: ${data.data.kana || '未返回'}`);
        console.log(`  罗马音: ${data.data.phonetic}`);
        console.log(`  释义: ${data.data.definitions[0]?.definition}`);
        console.log(`  例句: ${data.data.definitions[0]?.examples[0]?.english}`);
        console.log('');
      } else {
        console.log(`  ❌ 查询失败: ${data.error}\n`);
      }
    } catch (error) {
      console.error(`  ❌ 测试失败: ${error}\n`);
    }
  }
}

// 运行测试
testJapaneseDisplay().catch(console.error); 