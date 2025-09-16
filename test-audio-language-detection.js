// 测试音频服务语言检测功能
const testWords = [
  // 中文
  '美丽', '来源', '学习', '中文',
  
  // 英文
  'beautiful', 'origin', 'learn', 'english',
  
  // 日文
  'こんにちは', 'ありがとう', '日本語',
  
  // 韩文
  '안녕하세요', '감사합니다', '한국어',
  
  // 俄文
  'привет', 'спасибо', 'русский',
  
  // 阿拉伯文
  'مرحبا', 'شكرا', 'عربي',
  
  // 泰文
  'สวัสดี', 'ขอบคุณ', 'ไทย',
  
  // 混合语言
  'Hello 世界', 'Beautiful 美丽', 'こんにちは world',
  
  // 数字和符号
  '123', 'hello123', 'test@example.com',
  
  // 空字符串和特殊字符
  '', '   ', '!@#$%^&*()',
];

// 模拟语言检测函数
function detectLanguage(word) {
  // 计算各种语言的字符比例
  const languageScores = {
    'zh': (word.match(/[\u4e00-\u9fff]/g) || []).length,
    'ja': (word.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length,
    'ko': (word.match(/[\uac00-\ud7af]/g) || []).length,
    'ru': (word.match(/[\u0400-\u04ff]/g) || []).length,
    'ar': (word.match(/[\u0600-\u06ff]/g) || []).length,
    'th': (word.match(/[\u0e00-\u0e7f]/g) || []).length,
    'en': (word.match(/[a-zA-Z]/g) || []).length
  };

  // 找到得分最高的语言
  const maxScore = Math.max(...Object.values(languageScores));
  
  // 如果没有非英文字符，默认为英文
  if (maxScore === 0) {
    return 'en';
  }

  // 返回得分最高的语言
  for (const [language, score] of Object.entries(languageScores)) {
    if (score === maxScore) {
      return language;
    }
  }

  // 默认返回英文
  return 'en';
}

// 获取语言检测置信度
function getLanguageConfidence(word, language) {
  const patterns = {
    'zh': /[\u4e00-\u9fff]/g,
    'ja': /[\u3040-\u309f\u30a0-\u30ff]/g,
    'ko': /[\uac00-\ud7af]/g,
    'ru': /[\u0400-\u04ff]/g,
    'ar': /[\u0600-\u06ff]/g,
    'th': /[\u0e00-\u0e7f]/g,
    'en': /[a-zA-Z]/g
  };

  const pattern = patterns[language];
  if (pattern) {
    const matches = word.match(pattern);
    const confidence = matches ? (matches.length / word.length) : 0;
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'medium';
    if (confidence > 0) return 'low';
    return 'very-low';
  }
  return 'unknown';
}

console.log('🧪 测试音频服务语言检测功能\n');

testWords.forEach(word => {
  const detectedLanguage = detectLanguage(word);
  const confidence = getLanguageConfidence(word, detectedLanguage);
  
  console.log(`词汇: "${word}"`);
  console.log(`  检测语言: ${detectedLanguage}`);
  console.log(`  置信度: ${confidence}`);
  console.log(`  TTS URL: https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word)}&tl=${detectedLanguage}&client=tw-ob`);
  console.log('');
});

console.log('✅ 语言检测测试完成');
