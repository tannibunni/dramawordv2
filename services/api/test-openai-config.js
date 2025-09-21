const https = require('https');

console.log('🔍 检查Render后端OpenAI配置...');

// 测试Render后端的OpenAI配置
async function testOpenAIConfig() {
  try {
    const testData = {
      text: 'わからない',
      targetLanguage: 'ja',
      uiLanguage: 'zh-CN'
    };

    console.log('📡 发送测试请求到Render后端...');
    
    const response = await fetch('https://dramawordv2.onrender.com/api/direct-translate/direct-translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ 后端响应成功');
    console.log('📊 响应数据:');
    console.log('- 翻译结果:', result.data?.correctedWord || '无');
    console.log('- 罗马音:', result.data?.romaji || '无');
    console.log('- 音频URL:', result.data?.audioUrl || '无');
    console.log('- 翻译来源:', result.data?.translationSource || '无');
    
    // 检查是否有罗马音
    if (result.data?.romaji) {
      console.log('✅ OpenAI罗马音生成成功');
    } else {
      console.log('❌ 罗马音生成失败 - 可能OpenAI API密钥未配置');
    }
    
    // 检查是否有音频URL
    if (result.data?.audioUrl) {
      console.log('✅ 音频URL生成成功');
    } else {
      console.log('❌ 音频URL生成失败');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testOpenAIConfig();
