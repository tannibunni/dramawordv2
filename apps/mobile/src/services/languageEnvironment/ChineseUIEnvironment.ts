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
import { API_CONFIG } from '../../config/api';
import { DictionaryManager } from '../dictionaryManager/DictionaryManager';
import { CCEDICTProvider } from '../localDictionary/providers/CCEDICTProvider';

const API_BASE_URL = API_CONFIG.BASE_URL;

export class ChineseUIEnvironment implements LanguageEnvironment {
  readonly uiLanguage = 'zh-CN' as const;
  readonly targetLanguage: string;
  
  constructor(targetLanguage: string) {
    this.targetLanguage = targetLanguage;
  }
  
  /**
   * 为中文词生成拼音（简单映射）
   */
  private generatePinyinForChinese(chinese: string): string | null {
    // 简单的拼音映射表（常用字符）
    const pinyinMap: { [key: string]: string } = {
      '间': 'jian',
      '谍': 'die',
      '减': 'jian',
      '肥': 'fei',
      '少': 'shao',
      '杯': 'bei',
      '子': 'zi',
      '背': 'bei',
      '国': 'guo',
      '家': 'jia',
      '际': 'ji',
      '面': 'mian',
      '包': 'bao',
      '棉': 'mian',
      '袍': 'pao',
      '我': 'wo',
      '爱': 'ai',
      '你': 'ni',
      '吃': 'chi',
      '苹': 'ping',
      '果': 'guo',
      '米': 'mi',
      '饭': 'fan'
    };
    
    try {
      const pinyinArray = chinese.split('').map(char => pinyinMap[char]).filter(Boolean);
      return pinyinArray.length === chinese.length ? pinyinArray.join(' ') : null;
    } catch (error) {
      console.log(`❌ 生成拼音失败: ${chinese}`, error);
      return null;
    }
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
            
            // 🔧 如果没有pinyin字段，使用前端拼音匹配验证
            const chinese = candidate.chinese;
            const expectedPinyin = this.generatePinyinForChinese(chinese);
            
            if (expectedPinyin) {
              const normalizedExpectedPinyin = expectedPinyin.toLowerCase().replace(/\s+/g, '');
              const isMatch = normalizedExpectedPinyin === normalizedInputPinyin;
              
              if (!isMatch) {
                console.log(`❌ 拼音不匹配: "${chinese}" -> "${expectedPinyin}" ≠ "${input}"`);
                return false;
              }
              
              console.log(`✅ 拼音匹配: "${chinese}" -> "${expectedPinyin}" = "${input}"`);
              return true;
            }
            
            // 如果无法生成拼音，进行基本的合理性检查
            const chineseLength = candidate.chinese.length;
            const inputSyllables = normalizedInputPinyin.length / 2; // 粗略估算音节数
            
            // 1. 基本长度检查：中文词长度应该在合理范围内
            if (chineseLength < 1 || chineseLength > 6 || chineseLength < Math.floor(inputSyllables * 0.5)) {
              return false;
            }
            
            // 2. 过滤明显不合理的结果（包含异常字符或组合）
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
          
          // 按合理性排序并限制返回数量（最多8个候选词）
          const sortedCandidates = validCandidates
            .sort((a: any, b: any) => {
              // 优先返回更常用的词（可以根据需要调整排序逻辑）
              const aScore = a.chinese.length <= 3 ? 1 : 0; // 偏好短词
              const bScore = b.chinese.length <= 3 ? 1 : 0;
              return bScore - aScore;
            })
            .slice(0, 8); // 最多返回8个候选词
          
          // 🔧 为拼音候选词创建特殊格式：包含中文和英文释义
          // 为每个候选词生成audioUrl
          const candidatesWithAudio = sortedCandidates.map((c: any) => ({
            ...c,
            audioUrl: `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(c.chinese)}&tl=zh&client=tw-ob`
          }));

          return {
            success: true,
            candidates: candidatesWithAudio,  // 保存包含audioUrl的候选词对象
            source: 'pinyin_api',
            confidence: 0.9,
            isPinyinResult: true,  // 标记为拼音结果
            wordData: {
              word: input,
              correctedWord: candidatesWithAudio[0].chinese,
              translation: candidatesWithAudio[0].chinese,
              pinyin: input,
              phonetic: input, // 添加phonetic字段
              audioUrl: candidatesWithAudio[0].audioUrl, // 添加audioUrl
              language: 'zh',
              definitions: candidatesWithAudio.map((c: any) => ({
                definition: c.english,
                examples: []
              })),
              candidates: candidatesWithAudio
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
          definitions: result.data.definitions?.length || 0,
          audioUrl: result.data.audioUrl
        });
        
        // 构建完整的定义，包含原始英文输入
        const enrichedDefinitions = result.data.definitions || [];
        
        // 如果没有定义，创建一个包含原始英文的定义
        if (enrichedDefinitions.length === 0 && originalInput) {
          enrichedDefinitions.push({
            partOfSpeech: '',
            definition: originalInput,
            examples: []
          });
        }
        
        return {
          pinyin: result.data.phonetic,
          phonetic: result.data.phonetic,
          definitions: enrichedDefinitions,
          audioUrl: result.data.audioUrl,
          language: 'zh'
        };
      }
      
      return null;
    } catch (error) {
      console.log(`❌ 获取中文词汇详细信息失败:`, error);
      return null;
    }
  }

  /**
   * 🔧 统一使用OpenAI处理所有非本地词库的查询
   */
  private async queryWithOpenAI(input: string, analysis: InputAnalysis): Promise<UnifiedQueryResult> {
    try {
      console.log(`🤖 使用OpenAI处理查询: ${input} (${analysis.type})`);
      
      // 生成智能提示词
      const prompt = this.generateOpenAIPrompt(input, analysis.type);
      console.log(`📝 OpenAI提示词: ${prompt}`);
      
      // 调用OpenAI API
      const response = await fetch(`${API_BASE_URL}/openai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          model: 'gpt-4o-mini', // 使用最便宜的模型
          max_tokens: 500, // 增加token限制防止截断
          inputType: analysis.type, // 传递输入类型
          uiLanguage: 'zh', // UI语言
          targetLanguage: 'en' // 目标语言
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API调用失败: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ OpenAI响应:`, result);

      if (result.success && result.data) {
        // OpenAI返回的数据已经是WordData格式，直接使用
        const wordData = result.data;
        
        // 确保audioUrl使用正确的词条而不是整个JSON
        const audioWord = wordData.word || wordData.correctedWord || input;
        const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-cn&client=tw-ob&q=${encodeURIComponent(audioWord)}`;
        
        return {
          success: true,
          candidates: wordData.candidates || [wordData.word || wordData.correctedWord],
          source: 'openai',
          confidence: 0.9,
          wordData: {
            ...wordData,
            audioUrl: audioUrl,
            language: this.targetLanguage
          }
        };
      } else {
        throw new Error('OpenAI API返回失败');
      }
    } catch (error) {
      console.error(`❌ OpenAI查询失败:`, error);
      return {
        success: false,
        candidates: [],
        source: 'openai_error'
      };
    }
  }

  /**
   * 🔧 生成OpenAI智能提示词
   */
  private generateOpenAIPrompt(input: string, inputType: string): string {
    switch (inputType) {
      case 'pinyin':
        return `将拼音"${input}"转换为中文词汇，提供3-5个常用候选词，格式：{"translation": "主要翻译", "phonetic": "拼音", "definitions": [{"definition": "释义", "examples": ["例句1", "例句2"]}]}`;
      
      case 'english_sentence':
        return `将英文句子"${input}"翻译成中文，提供自然流畅的翻译，格式：{"translation": "中文翻译", "phonetic": "拼音", "definitions": [{"definition": "释义", "examples": ["例句1", "例句2"]}]}`;
      
      case 'english':
        return `将英文单词"${input}"翻译成中文，提供主要释义，格式：{"translation": "中文翻译", "phonetic": "拼音", "definitions": [{"definition": "释义", "examples": ["例句1", "例句2"]}]}`;
      
      default:
        return `将"${input}"翻译成中文，格式：{"translation": "中文翻译", "phonetic": "拼音", "definitions": [{"definition": "释义", "examples": ["例句1", "例句2"]}]}`;
    }
  }
}
