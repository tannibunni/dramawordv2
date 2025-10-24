// 调试日语词典状态
const { JapaneseDictionaryProvider } = require('./src/services/localDictionary/providers/JapaneseDictionaryProvider.ts');

async function debugJapaneseDictionary() {
  console.log('🔍 调试日语词典状态...');
  
  try {
    const japaneseProvider = new JapaneseDictionaryProvider();
    
    // 检查词典可用性
    console.log('🔍 检查日语词典可用性...');
    const isAvailable = await japaneseProvider.isAvailable();
    console.log(`📊 日语词典可用性: ${isAvailable}`);
    
    if (isAvailable) {
      // 测试罗马音查询
      console.log('🔍 测试罗马音查询 "sama"...');
      const romajiResult = await japaneseProvider.lookupByRomaji('sama', 10);
      
      console.log('📊 查询结果:', {
        success: romajiResult.success,
        candidatesCount: romajiResult.candidates?.length || 0,
        queryTime: romajiResult.queryTime
      });
      
      if (romajiResult.candidates && romajiResult.candidates.length > 0) {
        console.log('📋 候选词列表:');
        romajiResult.candidates.forEach((candidate, index) => {
          console.log(`  ${index + 1}. ${candidate.word} [${candidate.romaji}] - ${candidate.translation}`);
        });
      } else {
        console.log('⚠️ 没有找到候选词');
      }
    } else {
      console.log('❌ 日语词典不可用');
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

debugJapaneseDictionary();
