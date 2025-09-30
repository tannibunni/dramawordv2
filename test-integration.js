// 集成测试：验证智能混合查询系统

const API_BASE_URL = process.env.API_BASE_URL || 'https://dramawordv2.onrender.com';

async function testIntegration() {
  console.log('🧪 开始集成测试：智能混合查询系统\n');
  
  try {
    // 1. 测试词库状态检查
    console.log('1. 测试词库状态检查...');
    const statusResponse = await fetch(`${API_BASE_URL}/api/dictionary/status`);
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log(`✅ 词库状态: ${statusData.data.availableCount}/${statusData.data.totalCount} 个词库可用`);
    } else {
      console.log('❌ 词库状态检查失败');
    }
    
    // 2. 测试CloudWords查询
    console.log('\n2. 测试CloudWords查询...');
    const cloudWordsResponse = await fetch(`${API_BASE_URL}/api/words/cloud/hello?language=en`);
    if (cloudWordsResponse.ok) {
      const cloudWordsData = await cloudWordsResponse.json();
      if (cloudWordsData.success) {
        console.log(`✅ CloudWords查询成功: ${cloudWordsData.data.word}`);
      } else {
        console.log('⚠️ CloudWords中无数据，将使用OpenAI生成');
      }
    } else {
      console.log('❌ CloudWords查询失败');
    }
    
    // 3. 测试单词搜索 (智能混合查询)
    console.log('\n3. 测试智能混合查询...');
    const searchResponse = await fetch(`${API_BASE_URL}/api/words/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: 'hello',
        language: 'en',
        uiLanguage: 'zh-CN'
      })
    });
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.success) {
        console.log(`✅ 智能混合查询成功:`);
        console.log(`   - 单词: ${searchData.data.word}`);
        console.log(`   - 翻译: ${searchData.data.correctedWord}`);
        console.log(`   - 来源: ${searchData.source}`);
        console.log(`   - 释义数量: ${searchData.data.definitions?.length || 0}`);
      } else {
        console.log('❌ 智能混合查询失败');
      }
    } else {
      console.log('❌ 智能混合查询请求失败');
    }
    
    // 4. 测试中文翻译
    console.log('\n4. 测试中文翻译...');
    const chineseResponse = await fetch(`${API_BASE_URL}/api/words/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: '你好',
        language: 'zh',
        uiLanguage: 'en-US'
      })
    });
    
    if (chineseResponse.ok) {
      const chineseData = await chineseResponse.json();
      if (chineseData.success) {
        console.log(`✅ 中文翻译成功:`);
        console.log(`   - 单词: ${chineseData.data.word}`);
        console.log(`   - 翻译: ${chineseData.data.correctedWord}`);
        console.log(`   - 来源: ${chineseData.source}`);
        console.log(`   - 拼音: ${chineseData.data.pinyin || 'N/A'}`);
      } else {
        console.log('❌ 中文翻译失败');
      }
    } else {
      console.log('❌ 中文翻译请求失败');
    }
    
    // 5. 测试日语翻译
    console.log('\n5. 测试日语翻译...');
    const japaneseResponse = await fetch(`${API_BASE_URL}/api/words/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: 'こんにちは',
        language: 'ja',
        uiLanguage: 'en-US'
      })
    });
    
    if (japaneseResponse.ok) {
      const japaneseData = await japaneseResponse.json();
      if (japaneseData.success) {
        console.log(`✅ 日语翻译成功:`);
        console.log(`   - 单词: ${japaneseData.data.word}`);
        console.log(`   - 翻译: ${japaneseData.data.correctedWord}`);
        console.log(`   - 来源: ${japaneseData.source}`);
        console.log(`   - 罗马音: ${japaneseData.data.romaji || 'N/A'}`);
      } else {
        console.log('❌ 日语翻译失败');
      }
    } else {
      console.log('❌ 日语翻译请求失败');
    }
    
    console.log('\n🎉 集成测试完成！');
    
  } catch (error) {
    console.error('❌ 集成测试失败:', error);
  }
}

// 运行测试
testIntegration();
