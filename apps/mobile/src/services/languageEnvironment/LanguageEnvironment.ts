// 语言环境核心接口
import { 
  InputAnalysis, 
  QueryStrategy, 
  LocalQueryResult, 
  OnlineQueryResult, 
  HybridQueryResult,
  UnifiedQueryResult
} from './types';

export interface LanguageEnvironment {
  readonly uiLanguage: 'en-US' | 'zh-CN';
  readonly targetLanguage: string;
  
  /**
   * 分析输入类型
   */
  analyzeInput(input: string): InputAnalysis;
  
  /**
   * 选择查询策略
   */
  selectQueryStrategy(input: string, analysis: InputAnalysis): QueryStrategy;
  
  /**
   * 本地词库查询
   */
  queryLocalDictionary(input: string, analysis: InputAnalysis): Promise<UnifiedQueryResult>;
  
  /**
   * 在线翻译查询
   */
  queryOnlineTranslation(input: string, analysis: InputAnalysis): Promise<UnifiedQueryResult>;
  
  /**
   * 混合查询（本地+在线）
   */
  queryHybrid(input: string, analysis: InputAnalysis): Promise<UnifiedQueryResult>;
  
  /**
   * 获取环境配置
   */
  getConfig(): {
    uiLanguage: 'en-US' | 'zh-CN';
    targetLanguage: string;
    supportedInputTypes: string[];
    preferredQueryStrategy: QueryStrategy;
  };
}
