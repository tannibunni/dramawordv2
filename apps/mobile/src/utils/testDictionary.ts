/**
 * 离线词典测试工具
 * 
 * 使用方法：
 * 1. 在需要测试的地方导入这个文件
 * 2. 调用 testDictionary() 函数
 * 
 * 示例：
 * import { testDictionary } from './utils/testDictionary';
 * await testDictionary();
 */

import { DictionaryManager } from '../services/dictionaryManager/DictionaryManager';
import { HybridQueryService } from '../services/hybridQueryService/HybridQueryService';

/**
 * 测试词典管理器初始化
 */
export async function testDictionaryManagerInitialization(): Promise<boolean> {
  try {
    console.log('🧪 测试词典管理器初始化...');
    
    const dictionaryManager = DictionaryManager.getInstance();
    await dictionaryManager.initialize();
    
    const providers = dictionaryManager.getAvailableProviders();
    console.log(`✅ 词典管理器初始化成功，找到 ${providers.length} 个提供者`);
    
    providers.forEach(provider => {
      console.log(`  - ${provider.name} (${provider.language})`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ 词典管理器初始化失败:', error);
    return false;
  }
}

/**
 * 测试混合查询服务
 */
export async function testHybridQueryService(): Promise<boolean> {
  try {
    console.log('🧪 测试混合查询服务...');
    
    const hybridQueryService = HybridQueryService.getInstance();
    await hybridQueryService.initialize();
    
    console.log('✅ 混合查询服务初始化成功');
    return true;
  } catch (error) {
    console.error('❌ 混合查询服务初始化失败:', error);
    return false;
  }
}

/**
 * 测试中文词典查询
 */
export async function testChineseQuery(): Promise<boolean> {
  try {
    console.log('🧪 测试中文词典查询...');
    
    const dictionaryManager = DictionaryManager.getInstance();
    const testWords = ['你好', '谢谢'];
    
    for (const word of testWords) {
      console.log(`🔍 查询: ${word}`);
      
      const result = await dictionaryManager.queryMultilingual(word, 'zh', 'zh-CN');
      
      if (result.success && result.candidates.length > 0) {
        console.log(`✅ 找到 ${result.candidates.length} 个候选词`);
        console.log(`  第一个: ${result.candidates[0].word} - ${result.candidates[0].translation}`);
      } else {
        console.log(`⚠️ 未找到候选词`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ 测试中文词典查询失败:', error);
    return false;
  }
}

/**
 * 运行所有测试
 */
export async function testDictionary(): Promise<void> {
  console.log('🚀 开始离线词典功能测试...');
  console.log('='.repeat(50));
  
  const tests = [
    { name: '词典管理器初始化', test: testDictionaryManagerInitialization },
    { name: '混合查询服务', test: testHybridQueryService },
    { name: '中文词典查询', test: testChineseQuery }
  ];
  
  let passed = 0;
  
  for (const { name, test } of tests) {
    console.log(`\n📋 测试: ${name}`);
    console.log('-'.repeat(30));
    
    try {
      const result = await test();
      if (result) {
        passed++;
        console.log(`✅ ${name} - 通过`);
      } else {
        console.log(`❌ ${name} - 失败`);
      }
    } catch (error) {
      console.log(`❌ ${name} - 异常:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 测试结果: ${passed}/${tests.length} 通过`);
  
  if (passed === tests.length) {
    console.log('🎉 所有测试通过！');
  } else {
    console.log('⚠️ 部分测试失败，请检查配置');
  }
}

// 导出单独的测试函数，方便按需调用
export {
  testDictionaryManagerInitialization as testManager,
  testHybridQueryService as testHybrid,
  testChineseQuery as testChinese
};
