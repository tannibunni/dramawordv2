// 语言环境工厂类
import { LanguageEnvironment } from './LanguageEnvironment';
import { EnglishUIEnvironment } from './EnglishUIEnvironment';
import { ChineseUIEnvironment } from './ChineseUIEnvironment';

export class LanguageEnvironmentFactory {
  private static instance: LanguageEnvironmentFactory;
  private environmentCache: Map<string, LanguageEnvironment> = new Map();
  
  static getInstance(): LanguageEnvironmentFactory {
    if (!LanguageEnvironmentFactory.instance) {
      LanguageEnvironmentFactory.instance = new LanguageEnvironmentFactory();
    }
    return LanguageEnvironmentFactory.instance;
  }
  
  /**
   * 创建语言环境
   */
  createEnvironment(uiLanguage: string, targetLanguage: string): LanguageEnvironment {
    const key = `${uiLanguage}_${targetLanguage}`;
    
    // 检查缓存
    if (this.environmentCache.has(key)) {
      return this.environmentCache.get(key)!;
    }
    
    // 创建新环境
    let environment: LanguageEnvironment;
    
    if (uiLanguage === 'en-US') {
      environment = new EnglishUIEnvironment(targetLanguage);
    } else if (uiLanguage === 'zh-CN') {
      environment = new ChineseUIEnvironment(targetLanguage);
    } else {
      throw new Error(`Unsupported UI language: ${uiLanguage}`);
    }
    
    // 缓存环境
    this.environmentCache.set(key, environment);
    
    console.log(`✅ 创建语言环境: ${uiLanguage} -> ${targetLanguage}`);
    return environment;
  }
  
  /**
   * 获取所有支持的语言组合
   */
  getSupportedLanguageCombinations(): Array<{uiLanguage: string, targetLanguage: string, name: string}> {
    return [
      // 英文界面
      { uiLanguage: 'en-US', targetLanguage: 'zh', name: 'English UI - Chinese Target' },
      { uiLanguage: 'en-US', targetLanguage: 'ja', name: 'English UI - Japanese Target' },
      { uiLanguage: 'en-US', targetLanguage: 'ko', name: 'English UI - Korean Target' },
      { uiLanguage: 'en-US', targetLanguage: 'fr', name: 'English UI - French Target' },
      { uiLanguage: 'en-US', targetLanguage: 'es', name: 'English UI - Spanish Target' },
      { uiLanguage: 'en-US', targetLanguage: 'de', name: 'English UI - German Target' },
      
      // 中文界面
      { uiLanguage: 'zh-CN', targetLanguage: 'en', name: 'Chinese UI - English Target' },
      { uiLanguage: 'zh-CN', targetLanguage: 'ja', name: 'Chinese UI - Japanese Target' },
      { uiLanguage: 'zh-CN', targetLanguage: 'ko', name: 'Chinese UI - Korean Target' },
      { uiLanguage: 'zh-CN', targetLanguage: 'fr', name: 'Chinese UI - French Target' },
      { uiLanguage: 'zh-CN', targetLanguage: 'es', name: 'Chinese UI - Spanish Target' },
      { uiLanguage: 'zh-CN', targetLanguage: 'de', name: 'Chinese UI - German Target' },
    ];
  }
  
  /**
   * 检查语言组合是否支持
   */
  isLanguageCombinationSupported(uiLanguage: string, targetLanguage: string): boolean {
    const combinations = this.getSupportedLanguageCombinations();
    return combinations.some(combo => 
      combo.uiLanguage === uiLanguage && combo.targetLanguage === targetLanguage
    );
  }
  
  /**
   * 获取环境配置信息
   */
  getEnvironmentInfo(uiLanguage: string, targetLanguage: string): {
    supported: boolean;
    name: string;
    supportedInputTypes: string[];
    preferredQueryStrategy: string;
  } | null {
    if (!this.isLanguageCombinationSupported(uiLanguage, targetLanguage)) {
      return null;
    }
    
    const environment = this.createEnvironment(uiLanguage, targetLanguage);
    const config = environment.getConfig();
    
    const combination = this.getSupportedLanguageCombinations().find(combo => 
      combo.uiLanguage === uiLanguage && combo.targetLanguage === targetLanguage
    );
    
    return {
      supported: true,
      name: combination?.name || `${uiLanguage} -> ${targetLanguage}`,
      supportedInputTypes: config.supportedInputTypes,
      preferredQueryStrategy: config.preferredQueryStrategy
    };
  }
  
  /**
   * 清除环境缓存
   */
  clearCache(): void {
    this.environmentCache.clear();
    console.log('🧹 语言环境缓存已清除');
  }
  
  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    cacheSize: number;
    cachedEnvironments: string[];
  } {
    return {
      cacheSize: this.environmentCache.size,
      cachedEnvironments: Array.from(this.environmentCache.keys())
    };
  }
}
