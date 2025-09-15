// 统一的单词数据类型定义
// 用于整个应用中的单词数据传递

export interface WordDefinition {
  partOfSpeech: string;
  definition: string;
  examples: Array<{
    english: string;
    chinese: string;
    pinyin?: string; // 例句拼音
    romaji?: string; // 日语罗马音
    japanese?: string; // 日语例句
    korean?: string; // 韩语例句
    french?: string; // 法语例句
    spanish?: string; // 西班牙语例句
    hangul?: string; // 韩语谚文
  }>;
}

// 统一的WordData接口
export interface WordData {
  word: string;                // 词条本身
  phonetic?: string;           // 拼音
  pinyin?: string;             // 标准拼音
  candidates?: string[];       // 候选词数组（拼音转中文时使用）
  definitions: WordDefinition[];
  audioUrl?: string;           // 发音音频链接
  isCollected?: boolean;       // 是否已收藏
  correctedWord?: string;      // 标准化词条
  searchCount?: number;        // 搜索次数
  lastSearched?: string;       // 最后搜索时间
  sources?: Array<{ id: string; type: 'wordbook' | 'episode'; name: string }>; // 单词来源
  feedbackStats?: { positive: number; negative: number; total: number }; // 反馈统计
  kana?: string;               // 日语假名
  language?: string;           // 语言代码 (en, ja, ko, fr, es, zh)
  slangMeaning?: string;       // 俚语/缩写含义 (统一为字符串)
  phraseExplanation?: string;  // 短语解释 (统一为字符串)
}

// 服务层使用的扩展接口 (用于API响应)
export interface ServiceWordData extends Omit<WordData, 'slangMeaning' | 'phraseExplanation'> {
  slangMeaning?: string | { definition: string; examples?: any[] } | null;
  phraseExplanation?: string | { definition: string; examples?: any[] } | null;
}

// 类型转换函数
export function adaptServiceWordData(serviceData: ServiceWordData): WordData {
  return {
    ...serviceData,
    // 将复杂类型转换为简单字符串
    slangMeaning: typeof serviceData.slangMeaning === 'string' 
      ? serviceData.slangMeaning 
      : serviceData.slangMeaning?.definition || undefined,
    phraseExplanation: typeof serviceData.phraseExplanation === 'string' 
      ? serviceData.phraseExplanation 
      : serviceData.phraseExplanation?.definition || undefined,
  };
} 