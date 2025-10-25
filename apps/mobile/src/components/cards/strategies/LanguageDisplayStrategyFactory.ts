import { LanguageDisplayStrategy } from './LanguageDisplayStrategy';
import { JapaneseDisplayStrategy } from './LanguageDisplayStrategy';
import { ChineseDisplayStrategy } from './LanguageDisplayStrategy';
import { KoreanDisplayStrategy } from './LanguageDisplayStrategy';
import { FrenchDisplayStrategy } from './LanguageDisplayStrategy';
import { SpanishDisplayStrategy } from './LanguageDisplayStrategy';
import { EnglishDisplayStrategy } from './LanguageDisplayStrategy';

/**
 * 语言显示策略工厂
 * 根据语言代码创建对应的显示策略
 */
export class LanguageDisplayStrategyFactory {
  private static strategies: Map<string, LanguageDisplayStrategy> = new Map();
  
  /**
   * 获取语言显示策略
   * @param language 语言代码
   * @returns 对应的显示策略实例
   */
  static getStrategy(language: string): LanguageDisplayStrategy {
    // 如果已有实例，直接返回
    if (this.strategies.has(language)) {
      return this.strategies.get(language)!;
    }
    
    // 创建新的策略实例
    let strategy: LanguageDisplayStrategy;
    
    switch (language) {
      case 'ja':
      case 'japanese':
        strategy = new JapaneseDisplayStrategy();
        break;
      case 'zh':
      case 'zh-CN':
      case 'chinese':
        strategy = new ChineseDisplayStrategy();
        break;
      case 'ko':
      case 'korean':
        strategy = new KoreanDisplayStrategy();
        break;
      case 'fr':
      case 'french':
        strategy = new FrenchDisplayStrategy();
        break;
      case 'es':
      case 'spanish':
        strategy = new SpanishDisplayStrategy();
        break;
      case 'en':
      case 'en-US':
      case 'english':
      default:
        strategy = new EnglishDisplayStrategy();
        break;
    }
    
    // 缓存策略实例
    this.strategies.set(language, strategy);
    
    return strategy;
  }
  
  /**
   * 清除策略缓存（用于测试或重置）
   */
  static clearCache(): void {
    this.strategies.clear();
  }
  
  /**
   * 获取支持的语言列表
   */
  static getSupportedLanguages(): string[] {
    return ['ja', 'zh', 'ko', 'fr', 'es', 'en'];
  }
}
