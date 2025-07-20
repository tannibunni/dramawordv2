const API_BASE_URL = 'https://dramawordv2.onrender.com/api/words';

// 测试日语查词
async function testJapaneseWord() {
  console.log('🧪 测试日语查词功能...');
  
  try {
    console.log('📤 发送请求到:', `${API_BASE_URL}/search`);
    console.log('📤 请求方法: POST');
    console.log('📤 请求体:', {
      word: 'taberu',
      language: 'ja'
    });
    
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        word: 'taberu',
        language: 'ja'
      }),
    });

    console.log('📥 响应状态:', response.status);
    
    const data = await response.json();
    console.log('📥 响应数据:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log('\n✅ 日语查词成功！');
      console.log('📝 单词:', data.data.correctedWord);
      console.log('📝 假名:', data.data.kana);
      console.log('📝 罗马音:', data.data.phonetic);
      console.log('📝 释义:', data.data.definitions[0]?.definition);
      console.log('📝 例句:', data.data.definitions[0]?.examples[0]?.english);
    } else {
      console.log('❌ 日语查词失败:', data.error);
    }
    
    return data;
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return null;
  }
}

// 测试更多日语单词
async function testMoreJapaneseWords() {
  const words = ['nomu', 'iku', 'miru', 'kaku'];
  
  for (const word of words) {
    console.log(`\n🧪 测试单词: ${word}`);
    
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
        console.log(`✅ ${word} -> ${data.data.correctedWord} (${data.data.kana})`);
        console.log(`   罗马音: ${data.data.phonetic}`);
        console.log(`   释义: ${data.data.definitions[0]?.definition}`);
      } else {
        console.log(`❌ ${word} 查询失败:`, data.error);
      }
    } catch (error) {
      console.error(`❌ ${word} 测试失败:`, error);
    }
  }
}

// 运行测试
async function runTests() {
  console.log('🚀 开始测试日语查词功能...\n');
  
  // 测试单个单词
  await testJapaneseWord();
  
  // 测试多个单词
  await testMoreJapaneseWords();
  
  console.log('\n✅ 所有测试完成！');
}

// 执行测试
runTests().catch(console.error); 