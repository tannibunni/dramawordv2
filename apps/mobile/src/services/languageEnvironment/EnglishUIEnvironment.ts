// 英文UI环境实现
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

export class EnglishUIEnvironment implements LanguageEnvironment {
  readonly uiLanguage = 'en-US' as const;
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
      case 'zh':
        return this.analyzeForChineseLearning(trimmed);
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
  
  private analyzeForChineseLearning(input: string): InputAnalysis {
    // 英文界面学习中文的输入分析
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
    
    // 2. 英文字符 - 可能是英文单词或拼音
    if (englishRatio > 0.7 && otherRatio < 0.3) {
      const isPinyin = this.isLikelyPinyin(input);
      
      if (isPinyin) {
        // 拼音，转换为中文
        return {
          type: 'pinyin',
          confidence: 0.8,
          suggestions: {
            pinyin: input
          }
        };
      } else {
        // 英文单词，翻译成中文
        return {
          type: 'english',
          confidence: 0.8,
          suggestions: {
            english: input
          }
        };
      }
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
      type: 'english',
      confidence: 0.5,
      suggestions: {
        english: input
      }
    };
  }
  
  private analyzeForJapaneseLearning(input: string): InputAnalysis {
    // 英文界面学习日文的输入分析
    const chineseChars = (input.match(/[\u4e00-\u9fff]/g) || []).length;
    const kanaChars = (input.match(/[\u3040-\u30ff]/g) || []).length;
    const englishChars = (input.match(/[a-zA-Z]/g) || []).length;
    
    const chineseRatio = chineseChars / input.length;
    const kanaRatio = kanaChars / input.length;
    const englishRatio = englishChars / input.length;
    
    // 1. 日文假名
    if (kanaRatio > 0.7) {
      return {
        type: 'japanese_kana',
        confidence: kanaRatio,
        suggestions: {
          kana: input
        }
      };
    }
    
    // 2. 日文汉字
    if (chineseRatio > 0.7) {
      return {
        type: 'japanese_kanji',
        confidence: chineseRatio,
        suggestions: {
          kanji: input
        }
      };
    }
    
    // 3. 英文字符 - 可能是英文单词或罗马音
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
      type: 'english',
      confidence: 0.5,
      suggestions: {
        english: input
      }
    };
  }
  
  private analyzeForKoreanLearning(input: string): InputAnalysis {
    // 英文界面学习韩文的输入分析
    const koreanChars = (input.match(/[\uac00-\ud7af]/g) || []).length;
    const englishChars = (input.match(/[a-zA-Z]/g) || []).length;
    
    const koreanRatio = koreanChars / input.length;
    const englishRatio = englishChars / input.length;
    
    // 1. 韩文字符
    if (koreanRatio > 0.7) {
      return {
        type: 'mixed', // 韩文作为混合类型处理
        confidence: koreanRatio,
        suggestions: {
          japanese: input // 暂时使用japanese字段
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
      type: 'english',
      confidence: 0.5,
      suggestions: {
        english: input
      }
    };
  }
  
  private analyzeForEuropeanLanguageLearning(input: string): InputAnalysis {
    // 英文界面学习欧洲语言的输入分析
    const englishChars = (input.match(/[a-zA-Z]/g) || []).length;
    const englishRatio = englishChars / input.length;
    
    if (englishRatio > 0.7) {
      return {
        type: 'english',
        confidence: 0.8,
        suggestions: {
          english: input
        }
      };
    }
    
    return {
      type: 'unknown',
      confidence: 0.1,
      suggestions: {}
    };
  }
  
  private analyzeGeneric(input: string): InputAnalysis {
    // 通用分析逻辑
    const englishChars = (input.match(/[a-zA-Z]/g) || []).length;
    const englishRatio = englishChars / input.length;
    
    if (englishRatio > 0.7) {
      return {
        type: 'english',
        confidence: 0.8,
        suggestions: {
          english: input
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
      case 'pinyin':
        // 拼音输入优先本地词库
        return 'local_only';
      case 'romaji':
        // 罗马音输入优先本地词库
        return 'local_only';
      case 'chinese':
        // 中文字符输入混合查询
        return 'hybrid';
      case 'japanese_kana':
      case 'japanese_kanji':
        // 日文字符输入混合查询
        return 'hybrid';
      case 'english':
        // 英文输入混合查询
        return 'hybrid';
      default:
        // 默认混合查询
        return 'hybrid';
    }
  }
  
  async queryLocalDictionary(input: string, analysis: InputAnalysis): Promise<UnifiedQueryResult> {
    // TODO: 实现本地词库查询逻辑
    console.log(`🔍 本地词库查询: ${input} (${analysis.type})`);
    
    // 暂时返回空结果，后续实现
    return {
      success: false,
      candidates: []
    };
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
      // 先尝试本地词库
      const localResult = await this.queryLocalDictionary(input, analysis);
      
      if (localResult.success && localResult.candidates.length > 0) {
        return {
          success: true,
          candidates: localResult.candidates.map(c => {
            if (typeof c === 'string') {
              return c;
            } else {
              const candidate = c as LocalQueryCandidate;
              return candidate.chinese || candidate.japanese || candidate.english || '';
            }
          }),
          source: 'local_dictionary',
          wordData: localResult
        };
      }
      
      // 本地词库没有结果，尝试在线翻译
      const onlineResult = await this.queryOnlineTranslation(input, analysis);
      
      if (onlineResult.success && onlineResult.candidates.length > 0) {
        return {
          success: true,
          candidates: onlineResult.candidates,
          source: onlineResult.source || 'online_translation',
          wordData: onlineResult.wordData
        };
      }
      
      return {
        success: false,
        candidates: []
      };
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
      case 'zh':
        return ['english', 'pinyin', 'chinese', 'mixed'];
      case 'ja':
        return ['english', 'romaji', 'japanese_kana', 'japanese_kanji', 'mixed'];
      case 'ko':
        return ['english', 'mixed'];
      default:
        return ['english', 'mixed'];
    }
  }
  
  // 辅助方法
  private isLikelyPinyin(input: string): boolean {
    // 拼音特征检查
    if (!/^[a-z\s]+$/.test(input)) return false;
    if (input.length < 2 || input.length > 50) return false;
    
    // 检查是否包含明显的英文单词
    const commonEnglishWords = [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
      'tomorrow', 'today', 'yesterday', 'morning', 'afternoon', 'evening',
      'hello', 'world', 'good', 'bad', 'nice', 'beautiful', 'wonderful', 'amazing'
    ];
    
    const inputWords = input.toLowerCase().split(/\s+/);
    for (const word of inputWords) {
      if (commonEnglishWords.includes(word)) {
        return false;
      }
    }
    
    // 检查拼音模式
    const pinyinPatterns = [
      /^[a-z]+[aeiou][a-z]*$/,
      /^[a-z]+[aeiou][a-z]*\s+[a-z]+[aeiou][a-z]*$/,
      /^[a-z]+[aeiou][a-z]*\s+[a-z]+[aeiou][a-z]*\s+[a-z]+[aeiou][a-z]*$/
    ];
    
    return pinyinPatterns.some(pattern => pattern.test(input));
  }
  
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
