const API_BASE_URL = 'https://dramawordv2.onrender.com/api/words';

// 测试ChatGPT返回的romaji字段
async function testJapaneseRomaji() {
  console.log('🧪 测试ChatGPT返回的romaji字段...\n');
  
  const testWords = [
    'watashi',
    'taberu', 
    'nomu',
    'iku'
  ];
  
  for (const word of testWords) {
    console.log(`📝 测试单词: ${word}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: word,
          language: 'ja'
        }),
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        console.log(`  主要词语: ${data.data.correctedWord}`);
        console.log(`  假名: ${data.data.kana || '未返回'}`);
        console.log(`  罗马音: ${data.data.phonetic}`);
        console.log(`  释义: ${data.data.definitions[0]?.definition}`);
        
        // 显示例句的三行格式
        if (data.data.definitions[0]?.examples && data.data.definitions[0].examples.length > 0) {
          const example = data.data.definitions[0].examples[0];
          console.log(`  例句显示格式:`);
          console.log(`    日语原文: ${example.english}`);
          console.log(`    罗马音: ${example.romaji || '未返回'}`);
          console.log(`    中文翻译: ${example.chinese}`);
        }
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
testJapaneseRomaji().catch(console.error); 