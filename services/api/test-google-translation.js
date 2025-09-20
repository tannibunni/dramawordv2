// 测试Google翻译功能
async function testGoogleTranslation() {
  try {
    console.log('🔍 测试Google翻译...');
    
    const searchTerm = '我吃中餐';
    const targetLang = 'ja';
    
    console.log(`📝 翻译: ${searchTerm} -> ${targetLang}`);
    
    const encodedText = encodeURIComponent(searchTerm);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh&tl=${targetLang}&dt=t&q=${encodedText}`;
    
    console.log(`🌐 请求URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`📊 响应状态: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`Google翻译API返回状态: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`📊 原始响应:`, JSON.stringify(data, null, 2));
    
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      const translatedText = data[0][0][0];
      console.log(`✅ Google翻译成功: ${searchTerm} -> ${translatedText}`);
      return [translatedText];
    } else {
      throw new Error('Google翻译返回格式无效');
    }
    
  } catch (error) {
    console.error(`❌ Google翻译失败: ${error.message}`);
    return [];
  }
}

// 运行测试
testGoogleTranslation();
