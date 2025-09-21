const { ChinesePronunciationService } = require('./dist/services/chinesePronunciationService');

async function testChinesePinyinFlow() {
  try {
    console.log('=== 测试中文拼音生成流程 ===');
    
    const service = ChinesePronunciationService.getInstance();
    const result = await service.getPronunciationInfo('我爱你');
    
    console.log('拼音服务结果:', result);
    
    // 模拟translationResult数据结构
    const translationResult = {
      success: true,
      data: {
        translatedText: '我爱你',
        sourceLanguage: 'auto',
        audioUrl: result.audioUrl,
        pinyin: result.pinyin,
        toneMarks: result.toneMarks
      },
      translationSource: 'google_translation'
    };
    
    console.log('模拟的translationResult:', JSON.stringify(translationResult, null, 2));
    
    // 模拟最终结果构建
    const finalResult = {
      success: true,
      data: {
        word: 'i love you',
        language: 'zh',
        phonetic: translationResult.data.pinyin || '',
        pinyin: translationResult.data.pinyin || '',
        correctedWord: translationResult.data.translatedText,
        audioUrl: translationResult.data.audioUrl || '',
        translation: translationResult.data.translatedText,
        translationSource: translationResult.translationSource
      }
    };
    
    console.log('最终结果:', JSON.stringify(finalResult, null, 2));
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testChinesePinyinFlow();
