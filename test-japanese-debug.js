const API_BASE_URL = 'https://dramawordv2.onrender.com/api/words';

// 测试日语查词 - 详细调试
async function testJapaneseWordDebug() {
  console.log('🧪 测试日语查词功能 - 详细调试...');
  
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
    console.log('📥 完整响应数据:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log('\n✅ 日语查词成功！');
      console.log('📝 原始单词:', data.data.word);
      console.log('📝 修正单词:', data.data.correctedWord);
      console.log('📝 假名字段:', data.data.kana);
      console.log('📝 音标字段:', data.data.phonetic);
      console.log('📝 释义:', data.data.definitions[0]?.definition);
      console.log('📝 例句:', data.data.definitions[0]?.examples[0]?.english);
      
      // 检查所有字段
      console.log('\n🔍 字段检查:');
      Object.keys(data.data).forEach(key => {
        console.log(`  ${key}: ${JSON.stringify(data.data[key])}`);
      });
    } else {
      console.log('❌ 日语查词失败:', data.error);
    }
    
    return data;
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return null;
  }
}

// 测试不同的日语输入
async function testDifferentInputs() {
  const testCases = [
    { input: 'taberu', expected: '食べる' },
    { input: 'nomu', expected: '飲む' },
    { input: 'iku', expected: '行く' },
    { input: 'miru', expected: '見る' },
    { input: 'kaku', expected: '書く' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 测试输入: ${testCase.input} (期望: ${testCase.expected})`);
    
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
        console.log(`✅ 结果: ${data.data.correctedWord}`);
        console.log(`   假名: ${data.data.kana || '未返回'}`);
        console.log(`   音标: ${data.data.phonetic}`);
        console.log(`   释义: ${data.data.definitions[0]?.definition}`);
        
        if (data.data.correctedWord === testCase.expected) {
          console.log(`   🎯 匹配期望值！`);
        } else {
          console.log(`   ⚠️ 不匹配期望值`);
        }
      } else {
        console.log(`❌ 查询失败:`, data.error);
      }
    } catch (error) {
      console.error(`❌ 测试失败:`, error);
    }
  }
}

// 运行测试
async function runTests() {
  console.log('🚀 开始详细调试日语查词功能...\n');
  
  // 测试单个单词
  await testJapaneseWordDebug();
  
  // 测试不同输入
  await testDifferentInputs();
  
  console.log('\n✅ 所有调试测试完成！');
}

// 执行测试
runTests().catch(console.error); 