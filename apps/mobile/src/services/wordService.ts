// 单词服务 - 处理查词相关的API调用
import { colors } from '../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';
import { cacheService, CACHE_KEYS } from './cacheService';
import Logger from '../utils/logger';

// 导入统一的类型定义
import type { WordData, WordDefinition, ServiceWordData } from '../types/word';
import { adaptServiceWordData } from '../types/word';

// 创建页面专用日志器
const logger = Logger.forPage('WordService');

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

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface RecentWordsResponse {
  data: RecentWord[];
  pagination: PaginationInfo;
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
      console.log(`🔍 搜索单词: ${word} (语言: ${language})`);
      
      // 生成包含语言信息的缓存键
      const cacheKey = `${word}_${language}_${uiLanguage || 'zh-CN'}`;
      
      // 1. 先查统一缓存
      const cached = await cacheService.get<WordData>(CACHE_KEYS.WORD_DETAIL, cacheKey);
      if (cached) {
        console.log(`✅ 从统一缓存获取搜索结果: ${cacheKey}`);
        return { success: true, data: cached };
      }
      
      const token = await getUserToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // 映射前端语言到后端语言
      const mapUILanguageForBackend = (uiLang?: string): string => {
        if (!uiLang) return 'zh-CN';
        if (uiLang === 'en-US') return 'en';
        if (uiLang === 'zh-CN') return 'zh-CN';
        return uiLang;
      };
      
      const mappedUILanguage = mapUILanguageForBackend(uiLanguage);
      console.log(`🔍 界面语言映射: ${uiLanguage} -> ${mappedUILanguage}`);
      
      const response = await fetch(`${API_BASE_URL}/words/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          word: word.toLowerCase().trim(),
          language: language,
          uiLanguage: mappedUILanguage // 使用映射后的界面语言
        }),
      });

      if (!response.ok) {
        throw new WordServiceError(`搜索失败: ${response.status}`, response.status);
      }

      const result = await response.json();
      console.log('🔍 后端返回的原始数据:', result);
      console.log('🔍 result.data:', result.data);
      
      if (result.success) {
        // 新增：兼容新版 results 数组结构（新 prompt）
        if (result.data && Array.isArray(result.data.results)) {
          const mapped = result.data.results.map((item: any) => ({
            word: item.chinese, // 兼容前端结构
            pinyin: item.pinyin,
            audioUrl: item.audioUrl,
            phraseExplanation: item.phraseExplanation,
            definitions: [
              {
                partOfSpeech: '',
                definition: item.definition,
                examples: (item.examples || []).map((ex: any) => ({
                  chinese: ex.chinese,
                  english: ex.english,
                  pinyin: ex.pinyin
                }))
              }
            ]
          }));
          // 只返回第一个，或你可以让前端支持多卡片切换
          const wordData = mapped[0];
          // 缓存搜索结果
          await cacheService.set(CACHE_KEYS.WORD_DETAIL, cacheKey, wordData);
          console.log(`✅ 搜索结果已缓存: ${cacheKey}`);
          return { success: true, data: wordData };
        }
        // 处理 Mongoose 文档结构，优先使用 _doc 字段
        const data = result.data ? (result.data._doc || result.data) : null;
        
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
          language: data.language || language, // 添加语言字段
        };
        
        // 在解析 examples 时，保留所有多语言字段，前端渲染时可根据 UI 语言优先展示。
        // 例如：
        // examples: [
        //   { english, chinese, japanese, korean, french, spanish, romaji, hangul, pinyin }
        // ]
        if (wordData.definitions && wordData.definitions.length > 0) {
          wordData.definitions.forEach(def => {
            def.examples = def.examples || [];
            def.examples.forEach(example => {
              // 确保所有字段都存在，如果不存在则设为空字符串
              example.english = example.english || '';
              example.chinese = example.chinese || '';
              example.japanese = example.japanese || '';
              example.korean = example.korean || '';
              example.french = example.french || '';
              example.spanish = example.spanish || '';
              example.romaji = example.romaji || '';
              example.hangul = example.hangul || '';
              example.pinyin = example.pinyin || '';
            });
          });
        }
        
        // 缓存搜索结果
        await cacheService.set(CACHE_KEYS.WORD_DETAIL, cacheKey, wordData);
        console.log(`✅ 搜索结果已缓存: ${cacheKey}`);
        
        return { success: true, data: wordData };
      } else {
        return { success: false, error: result.error || '搜索失败' };
      }
    } catch (error) {
      console.error('❌ 搜索单词失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
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
      
      if (result.success && result.data) {
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

  // 获取最近查词记录（支持本地/云端，支持分页）
  async getRecentWords(page: number = 1, limit: number = 30): Promise<RecentWordsResponse> {
    const token = await getUserToken();
    const userInfo = await AsyncStorage.getItem('userInfo');
    
    // 检查是否为游客模式（有token但没有userInfo）
    const isGuestMode = token && !userInfo;
    
    if (!token || isGuestMode) {
      // 游客或无token：本地获取
      try {
        const local = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        if (local) {
          const parsedData = JSON.parse(local);
          if (parsedData && parsedData.length > 0) {
            // 本地分页处理
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedData = parsedData.slice(startIndex, endIndex);
            const hasMore = endIndex < parsedData.length;
            
            return {
              data: paginatedData,
              pagination: {
                page,
                limit,
                total: parsedData.length,
                hasMore
              }
            };
          }
        }
        // 如果没有本地数据，返回空数组
        console.log('📚 没有本地搜索历史，返回空数组');
        return {
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            hasMore: false
          }
        };
      } catch (e) {
        console.error('读取本地搜索历史失败:', e);
        // 出错时返回空数组
        return {
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            hasMore: false
          }
        };
      }
    }
    
    // 登录用户：云端获取
    try {
      // 确保有用户ID
      if (!userInfo) {
        throw new Error('No user info available');
      }
      
      const parsedUserInfo = JSON.parse(userInfo);
      const userId = parsedUserInfo.id;
      
      if (!userId) {
        throw new Error('No user ID available');
      }
      
      const response = await fetch(`${API_BASE_URL}/words/recent-searches?userId=${userId}&page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new WordServiceError(`获取最近查词失败: ${response.status}`, response.status);
      const result = await response.json();
      
      if (result.success && result.data) {
        const formattedData = result.data.map((word: any, index: number) => ({
          id: `recent-${index}`,
          word: word.word,
          translation: word.definition || '暂无释义',
          timestamp: word.timestamp || Date.now() - index * 1000,
        }));
        
        return {
          data: formattedData,
          pagination: result.pagination || {
            page,
            limit,
            total: formattedData.length,
            hasMore: false
          }
        };
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
            // 本地分页处理
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedData = parsedData.slice(startIndex, endIndex);
            const hasMore = endIndex < parsedData.length;
            
            return {
              data: paginatedData,
              pagination: {
                page,
                limit,
                total: parsedData.length,
                hasMore
              }
            };
          }
        }
      } catch (e) {
        console.error('读取本地搜索历史失败:', e);
      }
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          hasMore: false
        }
      };
    }
  }

  // 保存查词记录（支持本地/云端）
  async saveSearchHistory(word: string, definition: string, candidates?: string[]): Promise<boolean> {
    const token = await getUserToken();
    
    // 检查是否为游客模式（有token但没有userInfo）
    const userInfo = await AsyncStorage.getItem('userInfo');
    const isGuestMode = token && !userInfo;
    
    if (!token || isGuestMode) {
      // 游客或无token：本地保存
      try {
        const local = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        let history: RecentWord[] = local ? JSON.parse(local) : [];
        // 去重，显示所有历史记录
        history = [{
          id: Date.now().toString(),
          word,
          translation: definition,
          timestamp: Date.now(),
          ...(candidates ? { candidates } : {})
        }, ...history.filter(w => w.word !== word)];
        await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
        console.log('✅ 游客模式：搜索历史已保存到本地');
        return true;
      } catch (e) {
        console.error('保存本地搜索历史失败:', e);
        return false;
      }
    }
    
    // 登录用户：通过多邻国数据同步方案
    try {
      // 导入unifiedSyncService
      const { unifiedSyncService } = await import('./unifiedSyncService');
      
      let userId = '';
      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo);
          userId = parsed.id || '';
        } catch (e) {
          console.warn('解析用户信息失败:', e);
        }
      }
      
      if (!userId) {
        console.warn('无法获取用户ID，降级到直接API调用');
        throw new Error('No user ID available');
      }
      
      // 通过同步队列保存搜索历史
      await unifiedSyncService.addToSyncQueue({
        type: 'searchHistory',
        data: {
          word: word.toLowerCase().trim(),
          definition,
          timestamp: Date.now(),
          ...(candidates ? { candidates } : {})
        },
        userId,
        operation: 'create',
        priority: 'medium'
      });
      
      console.log('✅ 搜索历史已加入同步队列');
      return true;
    } catch (error) {
      console.error(`❌ 保存搜索历史到同步队列失败: ${error}`);
      // 降级到直接API调用
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
      } catch (apiError) {
        console.error(`❌ 直接API调用也失败: ${apiError}`);
        return false;
      }
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

  // 获取单词详情（使用统一缓存服务）
  async getWordDetail(word: string, language?: string, uiLanguage?: string): Promise<WordData | null> {
    try {
      logger.log(`获取单词详情: ${word} (语言: ${language}, UI语言: ${uiLanguage})`, 'getWordDetail');
      
      // 生成包含语言信息的缓存键
      const cacheKey = `${word}_${language || 'en'}_${uiLanguage || 'zh-CN'}`;
      logger.log(`生成的缓存键: ${cacheKey}`, 'getWordDetail');
      
      // 1. 先查统一缓存
      const cached = await cacheService.get<WordData>(CACHE_KEYS.WORD_DETAIL, cacheKey);
      if (cached) {
        logger.log(`从统一缓存获取单词详情: ${cacheKey}`, 'getWordDetail');
        return cached;
      }
      logger.log(`统一缓存未找到: ${cacheKey}`, 'getWordDetail');
      
      // 2. 从云词库（CloudWords）获取数据
      logger.log(`尝试从云词库获取: ${word}`, 'getWordDetail');
      const cloudResult = await this.getFromCloudWords(word, language, uiLanguage);
      if (cloudResult) {
        logger.log(`从云词库获取成功: ${word}`, 'getWordDetail');
        // 使用类型转换函数将服务层数据转换为统一格式
        const adaptedResult = adaptServiceWordData(cloudResult as ServiceWordData);
        // 缓存到统一缓存服务
        await cacheService.set(CACHE_KEYS.WORD_DETAIL, cacheKey, adaptedResult);
        return adaptedResult;
      }
      logger.log(`云词库未找到: ${word}`, 'getWordDetail');
      
      // 3. 云词库没有数据，调用搜索API
      logger.log(`云词库无数据，调用搜索API: ${word}`, 'getWordDetail');
      const result = await this.searchWord(word, language, uiLanguage);
      
      if (result.success && result.data) {
        // 使用类型转换函数将服务层数据转换为统一格式
        const adaptedData = adaptServiceWordData(result.data as ServiceWordData);
        // 4. 缓存到统一缓存服务
        await cacheService.set(CACHE_KEYS.WORD_DETAIL, cacheKey, adaptedData);
        logger.log(`API获取成功并缓存: ${cacheKey}`, 'getWordDetail');
        return adaptedData;
      } else {
        logger.warn(`API获取失败: ${word}`, 'getWordDetail');
        return null;
      }
    } catch (error) {
      logger.error(`获取单词详情失败: ${word}`, 'getWordDetail');
      return null;
    }
  }

  // 从云词库获取单词数据
  private async getFromCloudWords(word: string, language?: string, uiLanguage?: string): Promise<WordData | null> {
    try {
      console.log(`☁️ 从云词库获取单词: ${word}`);
      
      const response = await fetch(`${API_BASE_URL}/words/cloud/${encodeURIComponent(word)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': uiLanguage || 'zh-CN',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          console.log(`✅ 云词库返回数据: ${word}`);
          return result.data;
        } else {
          console.log(`⚠️ 云词库无数据: ${word}`);
          return null;
        }
      } else {
        console.log(`⚠️ 云词库请求失败: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ 云词库请求错误: ${word}`, error);
      return null;
    }
  }

  // 清空用户缓存（使用统一缓存服务）
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
        console.log('✅ 后端用户缓存清空成功:', result.message);
      } else {
        console.log('⚠️ 后端清空失败，仅清空本地缓存');
      }

      // 清空统一缓存服务中的单词详情缓存
      await cacheService.clearPrefix(CACHE_KEYS.WORD_DETAIL);
      console.log('✅ 统一缓存服务清空成功');
      
      return true;
    } catch (error) {
      console.error(`❌ 清空用户缓存错误: ${error}`);
      // 即使网络错误，也清空本地缓存
      try {
        await cacheService.clearPrefix(CACHE_KEYS.WORD_DETAIL);
        console.log('✅ 网络错误后清空本地缓存成功');
      } catch (localError) {
        console.error('❌ 清空本地缓存也失败:', localError);
      }
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

  // 中文翻译到指定目标语言，返回 1-3 个目标语言释义
  async translateChineseToTargetLanguage(word: string, targetLanguage: string): Promise<{ success: boolean; candidates: string[]; error?: string }> {
    try {
      console.log(`🔍 中文翻译到目标语言: ${word} -> ${targetLanguage}`);
      
      const response = await fetch(`${API_BASE_URL}/words/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          word: word.trim(),
          targetLanguage: targetLanguage // 新增目标语言参数
        })
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
      console.error(`❌ 中文翻译到${targetLanguage}错误:`, error);
      return { success: false, candidates: [], error: error instanceof Error ? error.message : '未知错误' };
    }
  }

  // 英文翻译到中文，返回 1-3 个中文释义
  async translateEnglishToChinese(word: string): Promise<{ success: boolean; candidates: string[]; error?: string }> {
    try {
      console.log(`🔍 英文翻译到中文: ${word}`);
      
      // 使用现有的翻译API，因为专用API暂时不可用
      const response = await fetch(`${API_BASE_URL}/words/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          word: word.trim(),
          targetLanguage: 'zh'
        })
      });
      
      if (!response.ok) {
        throw new WordServiceError(`翻译失败: ${response.status}`, response.status);
      }
      
      const result = await response.json();
      if (result.success) {
        // 从返回的数据中提取中文释义作为候选词
        const candidates: string[] = [];
        if (result.data && result.data.definitions) {
          result.data.definitions.forEach((def: any) => {
            if (def.definition) {
              candidates.push(def.definition);
            }
          });
        }
        return { success: true, candidates: candidates };
      } else {
        return { success: false, candidates: [], error: result.error || '翻译失败' };
      }
    } catch (error) {
      console.error(`❌ 英文翻译到中文错误:`, error);
      return { success: false, candidates: [], error: error instanceof Error ? error.message : '未知错误' };
    }
  }

  // 英文翻译到目标语言，返回 1-3 个目标语言候选词
  async translateEnglishToTargetLanguage(word: string, targetLanguage: string): Promise<{ success: boolean; candidates: string[]; error?: string }> {
    try {
      console.log(`🔍 英文翻译到${targetLanguage}: ${word}`);
      
      const response = await fetch(`${API_BASE_URL}/words/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          word: word.trim(),
          targetLanguage: targetLanguage
        })
      });
      
      if (!response.ok) {
        throw new WordServiceError(`翻译失败: ${response.status}`, response.status);
      }
      
      const result = await response.json();
      if (result.success) {
        // 从返回的数据中提取目标语言释义作为候选词
        const candidates: string[] = [];
        if (result.data && result.data.definitions) {
          result.data.definitions.forEach((def: any) => {
            if (def.definition) {
              candidates.push(def.definition);
            }
          });
        }
        return { success: true, candidates: candidates };
      } else {
        return { success: false, candidates: [], error: result.error || '翻译失败' };
      }
    } catch (error) {
      console.error(`❌ 英文翻译到${targetLanguage}错误:`, error);
      return { success: false, candidates: [], error: error instanceof Error ? error.message : '未知错误' };
    }
  }

  // 中文翻译到日语，返回 1-3 个日语候选词
  async translateChineseToJapanese(word: string): Promise<{ success: boolean; candidates: string[]; error?: string }> {
    try {
      console.log(`🔍 中文翻译到日语: ${word}`);
      
      const response = await fetch(`${API_BASE_URL}/words/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          word: word.trim(),
          targetLanguage: 'ja'
        })
      });
      
      if (!response.ok) {
        throw new WordServiceError(`翻译失败: ${response.status}`, response.status);
      }
      
      const result = await response.json();
      if (result.success) {
        // 从返回的数据中提取日语释义作为候选词
        const candidates: string[] = [];
        if (result.data && result.data.definitions) {
          result.data.definitions.forEach((def: any) => {
            if (def.definition) {
              candidates.push(def.definition);
            }
          });
        }
        return { success: true, candidates: candidates };
      } else {
        return { success: false, candidates: [], error: result.error || '翻译失败' };
      }
    } catch (error) {
      console.error(`❌ 中文翻译到日语错误:`, error);
      return { success: false, candidates: [], error: error instanceof Error ? error.message : '未知错误' };
    }
  }

  // 英文翻译到日语，返回 1-3 个日语候选词
  async translateEnglishToJapanese(word: string): Promise<{ success: boolean; candidates: string[]; error?: string }> {
    try {
      console.log(`🔍 英文翻译到日语: ${word}`);
      
      const response = await fetch(`${API_BASE_URL}/words/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          word: word.trim(),
          targetLanguage: 'ja'
        })
      });
      
      if (!response.ok) {
        throw new WordServiceError(`翻译失败: ${response.status}`, response.status);
      }
      
      const result = await response.json();
      if (result.success) {
        // 从返回的数据中提取日语释义作为候选词
        const candidates: string[] = [];
        if (result.data && result.data.definitions) {
          result.data.definitions.forEach((def: any) => {
            if (def.definition) {
              candidates.push(def.definition);
            }
          });
        }
        return { success: true, candidates: candidates };
      } else {
        return { success: false, candidates: [], error: result.error || '翻译失败' };
      }
    } catch (error) {
      console.error(`❌ 英文翻译到日语错误:`, error);
      return { success: false, candidates: [], error: error instanceof Error ? error.message : '未知错误' };
    }
  }

  // 查询中文词汇详细信息
  async getChineseWordDetails(word: string, uiLanguage: string = 'en-US'): Promise<SearchResult> {
    try {
      console.log(`🔍 查询中文词汇详细信息: ${word} (UI语言: ${uiLanguage})`);
      
      // 参数验证
      if (!word || typeof word !== 'string') {
        console.error(`❌ 无效的词汇参数: ${word}`);
        return { success: false, error: '无效的词汇参数' };
      }
      
      if (!uiLanguage || typeof uiLanguage !== 'string') {
        console.error(`❌ 无效的UI语言参数: ${uiLanguage}`);
        return { success: false, error: '无效的UI语言参数' };
      }
      
      // 检查缓存
      const cached = await cacheService.get('chinese', `${word}_${uiLanguage}`);
      if (cached) {
        console.log(`✅ 从缓存返回中文词汇: ${word}`);
        return { success: true, data: cached as WordData };
      }
      
      const response = await fetch(`${API_BASE_URL}/words/chinese/${encodeURIComponent(word)}?uiLanguage=${uiLanguage}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        console.error(`❌ API请求失败: ${response.status} ${response.statusText}`);
        throw new WordServiceError(`查询中文词汇失败: ${response.status}`, response.status);
      }
      
      const result = await response.json();
      console.log(`🔍 API返回结果:`, result);
      
      if (result.success && result.data) {
        // 缓存结果
        await cacheService.set('chinese', `${word}_${uiLanguage}`, result.data, { maxAge: 24 * 60 * 60 * 1000 }); // 24小时缓存
        
        console.log(`✅ 查询中文词汇成功: ${word}`);
        return { success: true, data: result.data };
      } else {
        console.error(`❌ API返回失败:`, result);
        return { success: false, error: result.error || '查询中文词汇失败' };
      }
    } catch (error) {
      console.error(`❌ 查询中文词汇详细信息错误:`, error);
      return { success: false, error: error instanceof Error ? error.message : '未知错误' };
    }
  }
}

// 导出单例实例
export const wordService = WordService.getInstance(); 