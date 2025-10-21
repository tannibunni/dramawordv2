// 离线词典功能测试
import { DictionaryManager } from '../dictionaryManager/DictionaryManager';
import { HybridQueryService } from '../hybridQueryService/HybridQueryService';

export class OfflineDictionaryTester {
  private dictionaryManager: DictionaryManager;
  private hybridQueryService: HybridQueryService;

  constructor() {
    this.dictionaryManager = DictionaryManager.getInstance();
    this.hybridQueryService = HybridQueryService.getInstance();
  }

  /**
   * 测试词典管理器初始化
   */
  async testDictionaryManagerInitialization(): Promise<boolean> {
    try {
      console.log('🧪 测试词典管理器初始化...');
      
      await this.dictionaryManager.initialize();
      
      const providers = this.dictionaryManager.getAvailableProviders();
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
   * 测试混合查询服务初始化
   */
  async testHybridQueryServiceInitialization(): Promise<boolean> {
    try {
      console.log('🧪 测试混合查询服务初始化...');
      
      await this.hybridQueryService.initialize();
      
      console.log('✅ 混合查询服务初始化成功');
      return true;
    } catch (error) {
      console.error('❌ 混合查询服务初始化失败:', error);
      return false;
    }
  }

  /**
   * 测试中文词典可用性
   */
  async testChineseDictionaryAvailability(): Promise<boolean> {
    try {
      console.log('🧪 测试中文词典可用性...');
      
      const isAvailable = await this.dictionaryManager.isDictionaryAvailable('ccedict');
      console.log(`📚 中文词典可用性: ${isAvailable ? '可用' : '不可用'}`);
      
      if (isAvailable) {
        const info = await this.dictionaryManager.getDictionaryInfo('ccedict');
        console.log(`📊 词典信息:`, info);
      }
      
      return isAvailable;
    } catch (error) {
      console.error('❌ 测试中文词典可用性失败:', error);
      return false;
    }
  }

  /**
   * 测试中文词汇查询
   */
  async testChineseWordQuery(): Promise<boolean> {
    try {
      console.log('🧪 测试中文词汇查询...');
      
      const testWords = ['你好', '谢谢', '再见'];
      
      for (const word of testWords) {
        console.log(`🔍 查询词汇: ${word}`);
        
        const result = await this.dictionaryManager.queryMultilingual(word, 'zh', 'zh-CN');
        
        if (result.success && result.candidates.length > 0) {
          console.log(`✅ 找到 ${result.candidates.length} 个候选词`);
          result.candidates.slice(0, 2).forEach((candidate, index) => {
            console.log(`  ${index + 1}. ${candidate.word} - ${candidate.translation}`);
          });
        } else {
          console.log(`⚠️ 未找到候选词`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ 测试中文词汇查询失败:', error);
      return false;
    }
  }

  /**
   * 测试混合查询功能
   */
  async testHybridQuery(): Promise<boolean> {
    try {
      console.log('🧪 测试混合查询功能...');
      
      const testInput = '你好';
      console.log(`🔍 混合查询: ${testInput}`);
      
      const result = await this.hybridQueryService.query(testInput, 'zh-CN', 'zh', {
        enableLocalDictionary: true,
        enableOnlineTranslation: true,
        localFirst: true,
        maxCandidates: 5
      });
      
      if (result.success && result.candidates.length > 0) {
        console.log(`✅ 混合查询成功，找到 ${result.candidates.length} 个候选词`);
        result.candidates.slice(0, 3).forEach((candidate, index) => {
          console.log(`  ${index + 1}. ${candidate.word} - ${candidate.translation}`);
        });
      } else {
        console.log(`⚠️ 混合查询未找到结果`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ 测试混合查询功能失败:', error);
      return false;
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 开始离线词典功能测试...');
    console.log('=' .repeat(50));
    
    const tests = [
      { name: '词典管理器初始化', test: () => this.testDictionaryManagerInitialization() },
      { name: '混合查询服务初始化', test: () => this.testHybridQueryServiceInitialization() },
      { name: '中文词典可用性', test: () => this.testChineseDictionaryAvailability() },
      { name: '中文词汇查询', test: () => this.testChineseWordQuery() },
      { name: '混合查询功能', test: () => this.testHybridQuery() }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const { name, test } of tests) {
      console.log(`\n📋 测试: ${name}`);
      console.log('-'.repeat(30));
      
      try {
        const result = await test();
        if (result) {
          passedTests++;
          console.log(`✅ ${name} - 通过`);
        } else {
          console.log(`❌ ${name} - 失败`);
        }
      } catch (error) {
        console.log(`❌ ${name} - 异常:`, error);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 测试结果: ${passedTests}/${totalTests} 通过`);
    
    if (passedTests === totalTests) {
      console.log('🎉 所有测试通过！离线词典功能正常工作');
    } else {
      console.log('⚠️ 部分测试失败，请检查离线词典配置');
    }
  }
}

// 导出测试函数供外部调用
export const runOfflineDictionaryTests = async () => {
  const tester = new OfflineDictionaryTester();
  await tester.runAllTests();
};
