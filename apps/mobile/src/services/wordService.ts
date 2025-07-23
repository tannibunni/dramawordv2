// 单词服务 - 处理查词相关的API调用
import { colors } from '../../../../packages/ui/src/tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

// 类型定义
export interface WordDefinition {
  partOfSpeech: string;
  definition: string;
  examples: Array<{
    english: string;
    chinese: string;
  }>;
}

export interface WordData {
  word: string;
  phonetic: string;
  definitions: WordDefinition[];
  isCollected: boolean;
  audioUrl?: string;
  correctedWord?: string; // 新增：标准单词
  slangMeaning?: string | null; // 新增：网络俚语解释
  phraseExplanation?: string | null; // 新增：短语解释
  kana?: string; // 新增：日语假名
}

export interface SearchResult {
  success: boolean;
  data?: WordData;
  error?: string;
}

export interface RecentWord {
  id: string;
  word: string;
  translation: string;
  timestamp: number;
  candidates?: string[]; // 新增
}

// API配置

// 错误处理
class WordServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'WordServiceError';
  }
}

const SEARCH_HISTORY_KEY = 'search_history';

async function getUserToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch {
    return null;
  }
}

// 单词服务类
export class WordService {
  private static instance: WordService;

  private constructor() {}

  public static getInstance(): WordService {
    if (!WordService.instance) {
      WordService.instance = new WordService();
    }
    return WordService.instance;
  }

  // 搜索单词
  async searchWord(word: string, language: string = 'en', uiLanguage?: string): Promise<SearchResult> {
    try {
      console.log(`🔍 搜索单词: ${word} (语言: ${language}, 界面语言: ${uiLanguage})`);
      
      const token = await getUserToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/words/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          word: word.toLowerCase().trim(),
          language: language,
          ...(uiLanguage ? { uiLanguage } : {})
        }),
      });

      if (!response.ok) {
        throw new WordServiceError(`搜索失败: ${response.status}`, response.status);
      }

      const result = await response.json();
      console.log('🔍 后端返回的原始数据:', result);
      console.log('🔍 result.data:', result.data);
      
      if (result.success) {
        // 处理 Mongoose 文档结构，优先使用 _doc 字段
        const data = result.data._doc || result.data;
        
        // 转换API返回的数据格式
        const wordData: WordData = {
          word: data.word || data.correctedWord || word, // 优先使用 word，如果没有则使用 correctedWord，最后使用搜索词
          phonetic: data.phonetic || `/${word}/`,
          definitions: data.definitions || [],
          isCollected: false,
          audioUrl: data.audioUrl,
          correctedWord: data.correctedWord || word, // 如果没有 correctedWord，使用搜索词
          slangMeaning: data.slangMeaning || null, // 网络俚语解释
          phraseExplanation: data.phraseExplanation || null, // 短语解释
          kana: data.kana || undefined, // 日语假名
        };
        
        // 如果 definitions 为空，使用 correctedWord 生成一个基本的定义
        if (!wordData.definitions || wordData.definitions.length === 0) {
          wordData.definitions = [
            {
              partOfSpeech: 'n.',
              definition: `${wordData.correctedWord || wordData.word} 的释义`,
              examples: [
                {
                  english: `This is an example of ${wordData.correctedWord || wordData.word}.`,
                  chinese: `这是 ${wordData.correctedWord || wordData.word} 的例子。`
                }
              ]
            }
          ];
        }
        
        console.log('🔍 转换后的 wordData:', wordData);
        console.log(`✅ 单词搜索成功: ${word}`);
        return { success: true, data: wordData };
      } else {
        throw new WordServiceError(result.error || '搜索失败');
      }
    } catch (error) {
      console.error(`❌ 单词搜索错误: ${error}`);
      
      // 如果是网络错误，返回模拟数据
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('🌐 网络错误，使用模拟数据');
        return this.getMockWordData(word);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  // 获取热门单词
  async getPopularWords(): Promise<RecentWord[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/words/popular`);
      
      if (!response.ok) {
        throw new WordServiceError(`获取热门单词失败: ${response.status}`, response.status);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.data.map((word: any, index: number) => ({
          id: `popular-${index}`,
          word: word.word,
          translation: word.definition || '暂无释义',
          timestamp: Date.now() - index * 1000,
        }));
      } else {
        throw new WordServiceError(result.error || '获取热门单词失败');
      }
    } catch (error) {
      console.error(`❌ 获取热门单词错误: ${error}`);
      return this.getMockPopularWords();
    }
  }

  // 获取最近查词记录（支持本地/云端）
  async getRecentWords(): Promise<RecentWord[]> {
    const token = await getUserToken();
    if (!token) {
      // 游客：本地获取
      try {
        const local = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        if (local) {
          const parsedData = JSON.parse(local);
          if (parsedData && parsedData.length > 0) {
            return parsedData;
          }
        }
        // 如果没有本地数据，返回空数组（不返回模拟数据）
        console.log('📚 没有本地搜索历史，返回空数组');
        return [];
      } catch (e) {
        console.error('读取本地搜索历史失败:', e);
        // 出错时返回空数组
        return [];
      }
    }
    // 登录用户：云端
    try {
      const response = await fetch(`${API_BASE_URL}/words/recent-searches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new WordServiceError(`获取最近查词失败: ${response.status}`, response.status);
      const result = await response.json();
      if (result.success) {
        return result.data.map((word: any, index: number) => ({
          id: `recent-${index}`,
          word: word.word,
          translation: word.definition || '暂无释义',
          timestamp: word.timestamp || Date.now() - index * 1000,
        }));
      } else {
        throw new WordServiceError(result.error || '获取最近查词失败');
      }
    } catch (error) {
      console.error(`❌ 获取最近查词错误: ${error}`);
      // 云端获取失败时，尝试本地获取，如果本地也没有则返回空数组
      try {
        const local = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        if (local) {
          const parsedData = JSON.parse(local);
          if (parsedData && parsedData.length > 0) {
            return parsedData;
          }
        }
      } catch (e) {
        console.error('读取本地搜索历史失败:', e);
      }
      return [];
    }
  }

  // 保存查词记录（支持本地/云端）
  async saveSearchHistory(word: string, definition: string, candidates?: string[]): Promise<boolean> {
    const token = await getUserToken();
    if (!token) {
      // 游客：本地保存
      try {
        const local = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        let history: RecentWord[] = local ? JSON.parse(local) : [];
        // 去重，最多5条
        history = [{
          id: Date.now().toString(),
          word,
          translation: definition,
          timestamp: Date.now(),
          ...(candidates ? { candidates } : {})
        }, ...history.filter(w => w.word !== word)].slice(0, 5);
        await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
        return true;
      } catch (e) {
        console.error('保存本地搜索历史失败:', e);
        return false;
      }
    }
    // 登录用户：云端（暂不支持 candidates）
    try {
      const response = await fetch(`${API_BASE_URL}/words/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          word: word.toLowerCase().trim(),
          definition,
          timestamp: Date.now(),
        }),
      });
      return response.ok;
    } catch (error) {
      console.error(`❌ 保存查词记录错误: ${error}`);
      return false;
    }
  }

  // 清除搜索历史（支持本地/云端）
  async clearSearchHistory(): Promise<boolean> {
    const token = await getUserToken();
    if (!token) {
      // 游客：本地清除
      try {
        await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
        return true;
      } catch (e) {
        console.error('清除本地搜索历史失败:', e);
        return false;
      }
    }
    // 登录用户：云端
    try {
      const response = await fetch(`${API_BASE_URL}/words/clear-user-history`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch (error) {
      console.error(`❌ 清除搜索历史错误: ${error}`);
      return false;
    }
  }

  // 获取模拟单词数据（网络错误时使用）
  private getMockWordData(word: string): SearchResult {
    const mockData: { [key: string]: WordData } = {
      hello: {
        word: 'hello',
        phonetic: '/həˈloʊ/',
        definitions: [
          {
            partOfSpeech: 'int.',
            definition: '喂，你好',
            examples: [
              { english: 'Hello, how are you?', chinese: '你好，你好吗？' },
              { english: 'Hello there!', chinese: '你好！' },
            ],
          },
          {
            partOfSpeech: 'n.',
            definition: '问候，招呼',
            examples: [
              { english: 'Say hello to your friend.', chinese: '向你的朋友问好。' },
            ],
          },
        ],
        isCollected: false,
      },
      world: {
        word: 'world',
        phonetic: '/wɜːrld/',
        definitions: [
          {
            partOfSpeech: 'n.',
            definition: '世界，地球',
            examples: [
              { english: 'The world is beautiful.', chinese: '这个世界很美丽。' },
              { english: 'Around the world', chinese: '环游世界' },
            ],
          },
        ],
        isCollected: false,
      },
      learn: {
        word: 'learn',
        phonetic: '/lɜːrn/',
        definitions: [
          {
            partOfSpeech: 'v.',
            definition: '学习，学会',
            examples: [
              { english: 'I want to learn English.', chinese: '我想学习英语。' },
              { english: 'Learn from mistakes', chinese: '从错误中学习' },
            ],
          },
        ],
        isCollected: false,
      },
    };

    const data = mockData[word.toLowerCase()];
    if (data) {
      return { success: true, data };
    } else {
      // 生成通用模拟数据
      return {
        success: true,
        data: {
          word: word,
          phonetic: `/${word}/`,
          definitions: [
            {
              partOfSpeech: 'n.',
              definition: `${word} 的释义`,
              examples: [
                { english: `This is an example of ${word}.`, chinese: `这是 ${word} 的例子。` },
              ],
            },
          ],
          isCollected: false,
        },
      };
    }
  }

  // 获取模拟热门单词
  private getMockPopularWords(): RecentWord[] {
    return [
      { id: '1', word: 'hello', translation: '你好，喂', timestamp: Date.now() - 1000 },
      { id: '2', word: 'world', translation: '世界', timestamp: Date.now() - 2000 },
      { id: '3', word: 'learn', translation: '学习', timestamp: Date.now() - 3000 },
      { id: '4', word: 'beautiful', translation: '美丽的', timestamp: Date.now() - 4000 },
      { id: '5', word: 'experience', translation: '经验，经历', timestamp: Date.now() - 5000 },
    ];
  }

  // 获取模拟最近查词
  public getMockRecentWords(): RecentWord[] {
    return [
      { id: '1', word: 'hello', translation: '你好，喂', timestamp: Date.now() - 1000 },
      { id: '2', word: 'world', translation: '世界', timestamp: Date.now() - 2000 },
      { id: '3', word: 'test', translation: '测试', timestamp: Date.now() - 3000 },
      { id: '4', word: 'example', translation: '例子', timestamp: Date.now() - 4000 },
      { id: '5', word: 'learning', translation: '学习', timestamp: Date.now() - 5000 },
    ];
  }

  // 获取单词详情（优先本地缓存，没有则调用API）
  async getWordDetail(word: string): Promise<WordData | null> {
    try {
      console.log(`🔍 获取单词详情: ${word}`);
      
      // 1. 先查本地缓存
      const cacheKey = `word_detail_${word.toLowerCase()}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        try {
          const wordData = JSON.parse(cached);
          console.log(`✅ 从本地缓存获取单词详情: ${word}`);
          return wordData;
        } catch (error) {
          console.warn(`⚠️ 本地缓存数据格式错误，重新获取: ${word}`);
        }
      }
      
      // 2. 没有缓存就调用API
      console.log(`📡 本地无缓存，调用API获取单词详情: ${word}`);
      const result = await this.searchWord(word);
      
      if (result.success && result.data) {
        // 3. 缓存到本地
        await AsyncStorage.setItem(cacheKey, JSON.stringify(result.data));
        console.log(`✅ API获取成功并缓存: ${word}`);
        return result.data;
      } else {
        console.warn(`⚠️ API获取失败: ${word}`, result.error);
        return null;
      }
    } catch (error) {
      console.error(`❌ 获取单词详情失败: ${word}`, error);
      return null;
    }
  }

  // 清空用户缓存（只清空本地缓存，不影响数据库中的词库）
  async clearUserCache(): Promise<boolean> {
    try {
      console.log('🧹 清空用户缓存...');
      
      // 调用后端API清空用户的搜索历史
      const response = await fetch(`${API_BASE_URL}/words/clear-user-history`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 用户缓存清空成功:', result.message);
        return true;
      } else {
        console.log('⚠️ 后端清空失败，仅清空本地缓存');
        return true; // 即使后端失败，本地清空也算成功
      }
    } catch (error) {
      console.error(`❌ 清空用户缓存错误: ${error}`);
      // 即使网络错误，也返回成功，因为主要是清空本地缓存
      return true;
    }
  }

  // 中文查英文，返回 1-3 个英文释义
  async translateChineseToEnglish(word: string): Promise<{ success: boolean; candidates: string[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/words/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.trim() })
      });
      if (!response.ok) {
        throw new WordServiceError(`翻译失败: ${response.status}`, response.status);
      }
      const result = await response.json();
      if (result.success) {
        return { success: true, candidates: result.candidates || [] };
      } else {
        return { success: false, candidates: [], error: result.error || '翻译失败' };
      }
    } catch (error) {
      console.error('❌ 中文查英文错误:', error);
      return { success: false, candidates: [], error: error instanceof Error ? error.message : '未知错误' };
    }
  }
}

// 导出单例实例
export const wordService = WordService.getInstance(); 