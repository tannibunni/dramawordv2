// 中文UI环境实现
import { LanguageEnvironment } from './LanguageEnvironment';
import { 
  InputAnalysis, 
  QueryStrategy, 
  LocalQueryResult, 
  LocalQueryCandidate,
  OnlineQueryResult, 
  HybridQueryResult,
  UnifiedQueryResult,
  InputType 
} from './types';

export class ChineseUIEnvironment implements LanguageEnvironment {
  readonly uiLanguage = 'zh-CN' as const;
  readonly targetLanguage: string;
  
  constructor(targetLanguage: string) {
    this.targetLanguage = targetLanguage;
  }
  
  analyzeInput(input: string): InputAnalysis {
    const trimmed = input.trim();
    
    if (!trimmed) {
      return {
        type: 'unknown',
        confidence: 0,
        suggestions: {}
      };
    }
    
    // 根据目标语言选择分析策略
    switch (this.targetLanguage) {
      case 'en':
        return this.analyzeForEnglishLearning(trimmed);
      case 'ja':
        return this.analyzeForJapaneseLearning(trimmed);
      case 'ko':
        return this.analyzeForKoreanLearning(trimmed);
      case 'fr':
      case 'es':
      case 'de':
        return this.analyzeForEuropeanLanguageLearning(trimmed);
      default:
        return this.analyzeGeneric(trimmed);
    }
  }
  
  private analyzeForEnglishLearning(input: string): InputAnalysis {
    // 中文界面学习英文的输入分析
    const chineseChars = (input.match(/[\u4e00-\u9fff]/g) || []).length;
    const chineseRatio = chineseChars / input.length;
    
    const englishChars = (input.match(/[a-zA-Z]/g) || []).length;
    const englishRatio = englishChars / input.length;
    
    const otherChars = input.length - chineseChars - englishChars;
    const otherRatio = otherChars / input.length;
    
    // 1. 中文字符 - 最高优先级
    if (chineseRatio > 0.7) {
      return {
        type: 'chinese',
        confidence: chineseRatio,
        suggestions: {
          chinese: input
        }
      };
    }
    
    // 2. 英文字符 - 可能是英文单词
    if (englishRatio > 0.7 && otherRatio < 0.3) {
      return {
        type: 'english',
        confidence: 0.8,
        suggestions: {
          english: input
        }
      };
    }
    
    // 3. 混合类型
    if (chineseChars > 0 && englishChars > 0) {
      return {
        type: 'mixed',
        confidence: 0.5,
        suggestions: {
          chinese: input,
          english: input
        }
      };
    }
    
    // 4. 默认
    return {
      type: 'chinese',
      confidence: 0.5,
      suggestions: {
        chinese: input
      }
    };
  }
  
  private analyzeForJapaneseLearning(input: string): InputAnalysis {
    // 中文界面学习日文的输入分析
    const chineseChars = (input.match(/[\u4e00-\u9fff]/g) || []).length;
    const kanaChars = (input.match(/[\u3040-\u30ff]/g) || []).length;
    const englishChars = (input.match(/[a-zA-Z]/g) || []).length;
    
    const chineseRatio = chineseChars / input.length;
    const kanaRatio = kanaChars / input.length;
    const englishRatio = englishChars / input.length;
    
    // 1. 中文字符 - 最高优先级
    if (chineseRatio > 0.7) {
      return {
        type: 'chinese',
        confidence: chineseRatio,
        suggestions: {
          chinese: input
        }
      };
    }
    
    // 2. 日文假名
    if (kanaRatio > 0.7) {
      return {
        type: 'japanese_kana',
        confidence: kanaRatio,
        suggestions: {
          kana: input
        }
      };
    }
    
    // 3. 英文字符 - 可能是罗马音
    if (englishRatio > 0.7) {
      const isRomaji = this.isLikelyRomaji(input);
      
      if (isRomaji) {
        // 罗马音，转换为日文
        return {
          type: 'romaji',
          confidence: 0.8,
          suggestions: {
            romaji: input
          }
        };
      } else {
        // 英文单词，翻译成日文
        return {
          type: 'english',
          confidence: 0.8,
          suggestions: {
            english: input
          }
        };
      }
    }
    
    // 4. 默认
    return {
      type: 'chinese',
      confidence: 0.5,
      suggestions: {
        chinese: input
      }
    };
  }
  
  private analyzeForKoreanLearning(input: string): InputAnalysis {
    // 中文界面学习韩文的输入分析
    const chineseChars = (input.match(/[\u4e00-\u9fff]/g) || []).length;
    const koreanChars = (input.match(/[\uac00-\ud7af]/g) || []).length;
    const englishChars = (input.match(/[a-zA-Z]/g) || []).length;
    
    const chineseRatio = chineseChars / input.length;
    const koreanRatio = koreanChars / input.length;
    const englishRatio = englishChars / input.length;
    
    // 1. 中文字符 - 最高优先级
    if (chineseRatio > 0.7) {
      return {
        type: 'chinese',
        confidence: chineseRatio,
        suggestions: {
          chinese: input
        }
      };
    }
    
    // 2. 韩文字符
    if (koreanRatio > 0.7) {
      return {
        type: 'mixed', // 韩文作为混合类型处理
        confidence: koreanRatio,
        suggestions: {
          japanese: input // 暂时使用japanese字段
        }
      };
    }
    
    // 3. 英文字符
    if (englishRatio > 0.7) {
      return {
        type: 'english',
        confidence: 0.8,
        suggestions: {
          english: input
        }
      };
    }
    
    // 4. 默认
    return {
      type: 'chinese',
      confidence: 0.5,
      suggestions: {
        chinese: input
      }
    };
  }
  
  private analyzeForEuropeanLanguageLearning(input: string): InputAnalysis {
    // 中文界面学习欧洲语言的输入分析
    const chineseChars = (input.match(/[\u4e00-\u9fff]/g) || []).length;
    const chineseRatio = chineseChars / input.length;
    
    const englishChars = (input.match(/[a-zA-Z]/g) || []).length;
    const englishRatio = englishChars / input.length;
    
    // 1. 中文字符 - 最高优先级
    if (chineseRatio > 0.7) {
      return {
        type: 'chinese',
        confidence: chineseRatio,
        suggestions: {
          chinese: input
        }
      };
    }
    
    // 2. 英文字符
    if (englishRatio > 0.7) {
      return {
        type: 'english',
        confidence: 0.8,
        suggestions: {
          english: input
        }
      };
    }
    
    // 3. 默认
    return {
      type: 'chinese',
      confidence: 0.5,
      suggestions: {
        chinese: input
      }
    };
  }
  
  private analyzeGeneric(input: string): InputAnalysis {
    // 通用分析逻辑
    const chineseChars = (input.match(/[\u4e00-\u9fff]/g) || []).length;
    const chineseRatio = chineseChars / input.length;
    
    if (chineseRatio > 0.7) {
      return {
        type: 'chinese',
        confidence: 0.8,
        suggestions: {
          chinese: input
        }
      };
    }
    
    return {
      type: 'unknown',
      confidence: 0.1,
      suggestions: {}
    };
  }
  
  selectQueryStrategy(input: string, analysis: InputAnalysis): QueryStrategy {
    // 根据输入类型和目标语言选择查询策略
    switch (analysis.type) {
      case 'chinese':
        // 中文字符输入混合查询
        return 'hybrid';
      case 'japanese_kana':
      case 'japanese_kanji':
        // 日文字符输入混合查询
        return 'hybrid';
      case 'romaji':
        // 罗马音输入优先本地词库
        return 'local_only';
      case 'english':
        // 英文输入混合查询
        return 'hybrid';
      default:
        // 默认混合查询
        return 'hybrid';
    }
  }
  
  async queryLocalDictionary(input: string, analysis: InputAnalysis): Promise<UnifiedQueryResult> {
    console.log(`🔍 本地词库查询: ${input} (${analysis.type})`);
    
    try {
      const { HybridQueryService } = await import('../hybridQueryService');
      const hybridService = HybridQueryService.getInstance();
      
      const result = await hybridService.query(input, this.uiLanguage, this.targetLanguage, {
        enableLocalDictionary: true,
        enableOnlineTranslation: false,
        localFirst: true,
        maxCandidates: 10,
        minConfidence: 0.3
      });
      
      return result;
    } catch (error) {
      console.error('❌ 本地词库查询失败:', error);
      return {
        success: false,
        candidates: []
      };
    }
  }
  
  async queryOnlineTranslation(input: string, analysis: InputAnalysis): Promise<UnifiedQueryResult> {
    console.log(`🔍 在线翻译查询: ${input} (${analysis.type})`);
    
    // TODO: 实现在线翻译查询逻辑
    // 暂时返回空结果，后续实现
    return {
      success: false,
      candidates: []
    };
  }
  
  async queryHybrid(input: string, analysis: InputAnalysis): Promise<UnifiedQueryResult> {
    console.log(`🔍 混合查询: ${input} (${analysis.type})`);
    
    try {
      const { HybridQueryService } = await import('../hybridQueryService');
      const hybridService = HybridQueryService.getInstance();
      
      const result = await hybridService.query(input, this.uiLanguage, this.targetLanguage, {
        enableLocalDictionary: true,
        enableOnlineTranslation: true,
        localFirst: true,
        maxCandidates: 10,
        minConfidence: 0.3
      });
      
      return result;
    } catch (error) {
      console.error('❌ 混合查询失败:', error);
      return {
        success: false,
        candidates: []
      };
    }
  }
  
  getConfig() {
    return {
      uiLanguage: this.uiLanguage,
      targetLanguage: this.targetLanguage,
      supportedInputTypes: this.getSupportedInputTypes(),
      preferredQueryStrategy: 'hybrid' as QueryStrategy
    };
  }
  
  private getSupportedInputTypes(): string[] {
    switch (this.targetLanguage) {
      case 'en':
        return ['chinese', 'english', 'mixed'];
      case 'ja':
        return ['chinese', 'romaji', 'japanese_kana', 'japanese_kanji', 'english', 'mixed'];
      case 'ko':
        return ['chinese', 'english', 'mixed'];
      default:
        return ['chinese', 'english', 'mixed'];
    }
  }
  
  // 辅助方法
  private isLikelyRomaji(input: string): boolean {
    // 罗马音特征检查
    if (!/^[a-zA-Z]+$/.test(input)) return false;
    if (input.length < 2 || input.length > 20) return false;
    
    // 检查是否包含明显的英文单词
    const commonEnglishWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
      'hello', 'world', 'good', 'bad', 'nice', 'beautiful', 'wonderful', 'amazing'
    ];
    
    const lowerInput = input.toLowerCase();
    if (commonEnglishWords.includes(lowerInput)) {
      return false;
    }
    
    // 检查罗马音模式
    const romajiPatterns = [
      /^[aeiou]/i,
      /[aeiou]$/i,
      /^[kgsztdnhbpmyrw][aeiou]/i,
      /[kgsztdnhbpmyrw][aeiou]$/i
    ];
    
    return romajiPatterns.some(pattern => pattern.test(input));
  }
}
