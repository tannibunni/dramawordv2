// 单词服务 - 处理查词相关的API调用
import { colors } from '../../../../packages/ui/src/tokens';
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
}

// API配置

// 错误处理
class WordServiceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'WordServiceError';
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
  async searchWord(word: string): Promise<SearchResult> {
    try {
      console.log(`🔍 搜索单词: ${word}`);
      
      const response = await fetch(`${API_BASE_URL}/mongo/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: word.toLowerCase().trim() }),
      });

      if (!response.ok) {
        throw new WordServiceError(`搜索失败: ${response.status}`, response.status);
      }

      const result = await response.json();
      
      if (result.success) {
        // 转换API返回的数据格式
        const wordData: WordData = {
          word: result.data.word,
          phonetic: result.data.phonetic || `/${word}/`,
          definitions: result.data.definitions || [],
          isCollected: false,
          audioUrl: result.data.audioUrl,
        };
        
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
      const response = await fetch(`${API_BASE_URL}/mongo/popular`);
      
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

  // 获取最近查词记录
  async getRecentWords(): Promise<RecentWord[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/mongo/recent-searches`);
      
      if (!response.ok) {
        throw new WordServiceError(`获取最近查词失败: ${response.status}`, response.status);
      }

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
      return this.getMockRecentWords();
    }
  }

  // 保存查词记录
  async saveSearchHistory(word: string, definition: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/mongo/user/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
  private getMockRecentWords(): RecentWord[] {
    return [
      { id: '1', word: 'hello', translation: '你好，喂', timestamp: Date.now() - 1000 },
      { id: '2', word: 'world', translation: '世界', timestamp: Date.now() - 2000 },
      { id: '3', word: 'test', translation: '测试', timestamp: Date.now() - 3000 },
      { id: '4', word: 'example', translation: '例子', timestamp: Date.now() - 4000 },
      { id: '5', word: 'learning', translation: '学习', timestamp: Date.now() - 5000 },
    ];
  }
}

// 导出单例实例
export const wordService = WordService.getInstance(); 