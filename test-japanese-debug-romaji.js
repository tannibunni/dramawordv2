const API_BASE_URL = 'https://dramawordv2.onrender.com/api/words';

// 调试ChatGPT的原始响应
async function debugJapaneseRomaji() {
  console.log('🔍 调试ChatGPT的原始响应...\n');
  
  const testWord = 'taberu';
  console.log(`📝 测试单词: ${testWord}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        word: testWord,
        language: 'ja'
      }),
    });

    const data = await response.json();
    
    if (data.success && data.data) {
      console.log(`✅ 查询成功`);
      console.log(`  主要词语: ${data.data.correctedWord}`);
      console.log(`  假名: ${data.data.kana || '未返回'}`);
      console.log(`  罗马音: ${data.data.phonetic}`);
      console.log(`  释义: ${data.data.definitions[0]?.definition}`);
      
      // 显示例句的详细信息
      if (data.data.definitions[0]?.examples && data.data.definitions[0].examples.length > 0) {
        const example = data.data.definitions[0].examples[0];
        console.log(`  例句详情:`);
        console.log(`    原始数据:`, JSON.stringify(example, null, 2));
        console.log(`    日语原文: ${example.english}`);
        console.log(`    罗马音: ${example.romaji || '未返回'}`);
        console.log(`    中文翻译: ${example.chinese}`);
      }
    } else {
      console.log(`❌ 查询失败: ${data.error}`);
    }
  } catch (error) {
    console.error(`❌ 测试失败: ${error}`);
  }
}

// 运行调试
debugJapaneseRomaji().catch(console.error); 