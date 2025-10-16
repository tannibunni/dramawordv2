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
import { API_CONFIG } from '../../config/api';
import { DictionaryManager } from '../dictionaryManager/DictionaryManager';
import { CCEDICTProvider } from '../localDictionary/providers/CCEDICTProvider';

const API_BASE_URL = API_CONFIG.BASE_URL;

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
    // 🔧 本地词典已禁用，统一使用在线翻译
    // 所有输入类型都使用在线翻译+OpenAI增强
    return 'online_only';
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
    
    try {
      // 🔧 对于拼音输入，优先使用离线CC-CEDICT词典
      if (analysis.type === 'pinyin' && this.targetLanguage === 'zh') {
        const pinyinQuery = input.toLowerCase().replace(/\s+/g, '');
        
        // 🔧 Step 1: 尝试使用离线CC-CEDICT词典
        try {
          const ccedictProvider = new CCEDICTProvider();
          const isAvailable = await ccedictProvider.isAvailable();
          
          if (isAvailable) {
            console.log(`📚 使用离线CC-CEDICT词典查询拼音: ${input} -> ${pinyinQuery}`);
            const offlineResult = await ccedictProvider.lookupByPinyin(pinyinQuery, 10);
            
            if (offlineResult.success && offlineResult.candidates.length > 0) {
              console.log(`✅ 离线词典返回 ${offlineResult.candidates.length} 个候选词`);
              
              // 转换为统一格式
              return {
                success: true,
                candidates: offlineResult.candidates.map((c: any) => ({
                  chinese: c.word,
                  english: c.translation
                })),
                source: 'offline_ccedict',
                confidence: 1.0,
                isPinyinResult: true,
                wordData: {
                  word: input,
                  correctedWord: offlineResult.candidates[0].word,
                  translation: offlineResult.candidates[0].word,
                  pinyin: input,
                  definitions: offlineResult.candidates.map((c: any) => ({
                    definition: c.translation,
                    examples: []
                  })),
                  candidates: offlineResult.candidates.map((c: any) => ({
                    chinese: c.word,
                    english: c.translation
                  }))
                }
              };
            } else {
              console.log(`⚠️ 离线词典未找到结果，降级到在线API`);
            }
          } else {
            console.log(`⚠️ 离线词典不可用，使用在线API`);
          }
        } catch (offlineError) {
          console.log(`⚠️ 离线词典查询失败，降级到在线API:`, offlineError);
        }
        
        // 🔧 Step 2: 降级到在线API（OpenAI生成）
        console.log(`📌 使用在线拼音候选词API: ${input} -> ${pinyinQuery}`);
        const response = await fetch(`${API_BASE_URL}/pinyin/candidates/${encodeURIComponent(pinyinQuery)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`Pinyin API error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data && result.data.candidates && result.data.candidates.length > 0) {
          // 🔧 过滤掉拼音不匹配的候选词（修复后端API返回无关结果的问题）
          const normalizedInputPinyin = input.toLowerCase().replace(/\s+/g, '');
          
          const validCandidates = result.data.candidates.filter((candidate: any) => {
            if (!candidate.chinese || !candidate.english) {
              return false;
            }
            
            // 如果候选词有pinyin字段，进行精确匹配验证
            if (candidate.pinyin) {
              const normalizedCandidatePinyin = candidate.pinyin.toLowerCase().replace(/\s+/g, '');
              return normalizedCandidatePinyin === normalizedInputPinyin;
            }
            
            // 如果没有pinyin字段，进行更严格的合理性检查
            const chineseLength = candidate.chinese.length;
            const inputSyllables = normalizedInputPinyin.length / 2; // 粗略估算音节数
            
            // 1. 基本长度检查：中文词长度应该在合理范围内
            if (chineseLength < 1 || chineseLength > 6 || chineseLength < Math.floor(inputSyllables * 0.5)) {
              return false;
            }
            
            // 2. 过滤明显不合理的结果（包含异常字符或组合）
            const chinese = candidate.chinese;
            const unreasonablePatterns = [
              /泥$/, // 以"泥"结尾的词通常不合理
              /握/, // "握"开头的词通常不是常用表达
              /^我想泥/, // 直接匹配不合理的组合
              /^握香/,
            ];
            
            // 如果匹配到不合理模式，检查是否是真实常用词
            for (const pattern of unreasonablePatterns) {
              if (pattern.test(chinese)) {
                // 只有在确实是不合理组合时才过滤
                if (chinese.includes('泥') || chinese.includes('握香')) {
                  return false;
                }
              }
            }
            
            return true;
          });
          
          if (validCandidates.length === 0) {
            return {
              success: false,
              candidates: []
            };
          }
          
          // 按合理性排序并限制返回数量（最多2个候选词）
          const sortedCandidates = validCandidates
            .sort((a: any, b: any) => {
              // 优先返回更常用的词（可以根据需要调整排序逻辑）
              const aScore = a.chinese.length <= 3 ? 1 : 0; // 偏好短词
              const bScore = b.chinese.length <= 3 ? 1 : 0;
              return bScore - aScore;
            })
            .slice(0, 2); // 最多返回2个候选词
          
          // 🔧 为拼音候选词创建特殊格式：包含中文和英文释义
          return {
            success: true,
            candidates: sortedCandidates,  // 保存排序和限制后的候选词对象
            source: 'pinyin_api',
            confidence: 0.9,
            isPinyinResult: true,  // 标记为拼音结果
            wordData: {
              word: input,
              correctedWord: sortedCandidates[0].chinese,
              translation: sortedCandidates[0].chinese,
              pinyin: input,
              definitions: sortedCandidates.map((c: any) => ({
                definition: c.english,
                examples: []
              })),
              candidates: sortedCandidates
            }
          };
        }
      }
      
      // 对于其他类型输入，使用直接翻译API
      const response = await fetch(`${API_BASE_URL}/direct-translate/direct-translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: input,
          uiLanguage: this.uiLanguage,
          targetLanguage: this.targetLanguage
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const translation = result.data.correctedWord || result.data.translation;
        
        // 如果翻译结果是中文，尝试获取拼音和英文释义
        let enrichedWordData = result.data;
        if (this.targetLanguage === 'zh' && translation && this.isChineseText(translation)) {
          console.log(`🔍 检测到中文翻译结果，尝试获取拼音和英文释义: ${translation}`);
          try {
            const enrichedData = await this.enrichChineseTranslation(translation, input);
            if (enrichedData) {
              enrichedWordData = {
                ...result.data,
                ...enrichedData
              };
              console.log(`✅ 成功增强中文翻译结果，添加拼音和释义`);
            }
          } catch (enrichError) {
            console.log(`⚠️ 增强中文翻译结果失败:`, enrichError);
          }
        }
        
        return {
          success: true,
          candidates: [translation],
          source: 'google_translate',
          confidence: 0.85,
          wordData: enrichedWordData
        };
      }

      return {
        success: false,
        candidates: []
      };
    } catch (error) {
      console.error(`❌ 在线翻译查询失败:`, error);
      return {
        success: false,
        candidates: []
      };
    }
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

  /**
   * 检查文本是否包含中文字符
   */
  private isChineseText(text: string): boolean {
    return /[\u4e00-\u9fff]/.test(text);
  }

  /**
   * 为中文翻译结果获取拼音和英文释义
   */
  private async enrichChineseTranslation(chineseText: string, originalInput: string): Promise<any> {
    try {
      console.log(`🔍 调用中文词汇API获取详细信息: ${chineseText}`);
      
      const response = await fetch(`${API_BASE_URL}/words/chinese/${encodeURIComponent(chineseText)}?uiLanguage=${this.uiLanguage}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.log(`⚠️ 中文词汇API调用失败: ${response.status}`);
        return null;
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.log(`✅ 成功获取中文词汇详细信息:`, {
          pinyin: result.data.phonetic,
          definitions: result.data.definitions?.length || 0
        });
        
        return {
          pinyin: result.data.phonetic,
          phonetic: result.data.phonetic,
          definitions: result.data.definitions || [],
          language: 'zh'
        };
      }
      
      return null;
    } catch (error) {
      console.log(`❌ 获取中文词汇详细信息失败:`, error);
      return null;
    }
  }
}
