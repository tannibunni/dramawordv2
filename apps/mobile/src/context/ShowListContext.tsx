import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TMDBShow, TMDBService } from '../services/tmdbService';
import { unifiedSyncService } from '../services/unifiedSyncService';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../constants/config';

export type ShowStatus = 'watching' | 'completed' | 'plan_to_watch';

export interface Show extends TMDBShow {
  status: ShowStatus;
  wordCount: number;
  lastWatched?: string;
  icon?: string; // 单词本图标
  description?: string; // 单词本描述
}

interface ShowListContextType {
  shows: Show[];
  addShow: (show: Show) => void;
  changeShowStatus: (showId: number, newStatus: ShowStatus) => void;
  removeShow: (showId: number) => void;
  clearShows: () => Promise<void>;
  updateShow: (showId: number, updates: Partial<Show>) => void;
  syncShowsToCloud: () => Promise<void>;
  downloadShowsFromCloud: () => Promise<void>;
  isSyncing: boolean;
  ensureShowLanguage: (showId: number, language: string) => Promise<void>;
}

const ShowListContext = createContext<ShowListContextType | undefined>(undefined);

export const useShowList = () => {
  const ctx = useContext(ShowListContext);
  if (!ctx) throw new Error('useShowList must be used within ShowListProvider');
  return ctx;
};

const SHOWS_STORAGE_KEY = 'user_shows';
const SHOW_LANG_CACHE_KEY = (id: number, lang: string) => `tmdb_show_${id}_${lang}`;

export const ShowListProvider = ({ children }: { children: ReactNode }) => {
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useAuth();
  // 记录已确保语言的数据，避免重复刷新
  const ensuredLangMapRef = useRef<Map<string, boolean>>(new Map());
  // 记录进行中的请求，避免并发重复
  const inflightRef = useRef<Set<string>>(new Set());

  // 加载本地存储的剧集数据
  useEffect(() => {
    loadShowsFromStorage();
  }, []);

  // 当剧集数据变化时保存到本地存储并同步到云端
  useEffect(() => {
    if (isLoaded) {
      saveShowsToStorage();
      // 延迟同步到云端，避免频繁同步
      const syncTimer = setTimeout(() => {
        if (user) {
          syncShowsToCloud();
        }
      }, 2000);
      
      return () => clearTimeout(syncTimer);
    }
  }, [shows, isLoaded, user]);

  // 剧单同步到云端 - 多邻国风格
  const syncShowsToCloud = async () => {
    if (!user || isSyncing) {
      return;
    }

    try {
      setIsSyncing(true);
      console.log('🔄 开始同步剧单到云端...');

      // 使用统一同步服务上传剧单数据
      await unifiedSyncService.addToSyncQueue({
        type: 'shows',
        data: {
          shows: shows,
          lastSyncTime: Date.now(),
          totalShows: shows.length
        },
        userId: user.id,
        operation: 'update',
        priority: 'high'
      });

      // 执行同步
      const result = await unifiedSyncService.syncPendingData();
      
      if (result.success) {
        console.log('✅ 剧单同步成功');
      } else {
        console.warn('⚠️ 剧单同步失败:', result.message);
      }
    } catch (error) {
      console.error('❌ 剧单同步失败:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // 从云端下载剧单数据 - 多邻国风格
  const downloadShowsFromCloud = async () => {
    if (!user || isSyncing) {
      return;
    }

    try {
      setIsSyncing(true);
      console.log('📥 开始从云端下载剧单数据...');

      // 获取认证token
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        console.warn('⚠️ 未找到用户数据，跳过剧单下载');
        return;
      }
      
      const parsedUserData = JSON.parse(userData);
      const token = parsedUserData.token;
      
      if (!token) {
        console.warn('⚠️ 未找到认证token，跳过剧单下载');
        return;
      }

      // 调用强制同步接口获取云端数据
      const response = await fetch(`${API_BASE_URL}/users/sync/force`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          // 发送空的同步数据，只触发下载
          learningRecords: [],
          searchHistory: [],
          userSettings: {},
          shows: []
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.download && result.data.download.shows) {
          const cloudShows = result.data.download.shows;
          console.log('✅ 从云端下载剧单数据成功:', cloudShows.length, '个剧集');
          
          // 更新本地剧单数据
          setShows(cloudShows);
          
          // 保存到本地存储
          await AsyncStorage.setItem(SHOWS_STORAGE_KEY, JSON.stringify(cloudShows));
        } else {
          console.warn('⚠️ 云端剧单数据为空或格式不正确');
        }
      } else {
        console.warn('⚠️ 剧单下载请求失败:', response.status);
      }
    } catch (error) {
      console.error('❌ 从云端下载剧单数据失败:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadShowsFromStorage = async () => {
    try {
      const storedData = await AsyncStorage.getItem(SHOWS_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setShows(parsedData);
        console.log('📺 从本地存储加载剧集数据:', parsedData.length, '个剧集');
      } else {
        console.log('📺 本地存储中没有剧集数据，初始化为空列表');
        setShows([]);
      }
    } catch (error) {
      console.error('❌ 加载剧集数据失败:', error);
      setShows([]);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveShowsToStorage = async () => {
    try {
      await AsyncStorage.setItem(SHOWS_STORAGE_KEY, JSON.stringify(shows));
      console.log('💾 保存剧集数据到本地存储:', shows.length, '个剧集');
    } catch (error) {
      console.error('❌ 保存剧集数据失败:', error);
    }
  };

  const addShow = (show: Show) => {
    setShows(prev => {
      const showIdNum = Number(show.id);
      const prevIds = prev.map(s => Number(s.id));
      console.log('addShow 参数 show.id:', show.id, '类型:', typeof show.id, '现有 shows:', prevIds);
      if (prevIds.includes(showIdNum)) {
        console.log('📺 剧集已存在:', show.name);
        return prev;
      }
      console.log('➕ 添加新剧集:', show.name, 'ID:', showIdNum);
      return [{ ...show, id: showIdNum }, ...prev]; // 新剧集添加到列表开头，确保 id 为 number
    });
  };

  const changeShowStatus = (showId: number, newStatus: ShowStatus) => {
    setShows(prev => {
      const updated = prev.map(s => s.id === showId ? { ...s, status: newStatus } : s);
      const changedShow = updated.find(s => s.id === showId);
      if (changedShow) {
        console.log('🔄 更新剧集状态:', changedShow.name, '新状态:', newStatus);
      }
      return updated;
    });
  };

  const removeShow = (showId: number) => {
    setShows(prev => {
      const showToRemove = prev.find(s => s.id === showId);
      const filtered = prev.filter(s => s.id !== showId);
      if (showToRemove) {
        console.log('➖ 删除剧集:', showToRemove.name, '剩余剧集数:', filtered.length);
      }
      return filtered;
    });
  };

  const clearShows = async () => {
    try {
      // 清空内存中的剧集数据
      setShows([]);
      // 清空本地存储
      await AsyncStorage.removeItem(SHOWS_STORAGE_KEY);
      console.log('🗑️ 清空所有剧集数据（内存+本地存储）');
    } catch (error) {
      console.error('❌ 清空剧集数据失败:', error);
    }
  };

  const updateShow = (showId: number, updates: Partial<Show>) => {
    setShows(prev => {
      const updated = prev.map(s => s.id === showId ? { ...s, ...updates } : s);
      const changedShow = updated.find(s => s.id === showId);
      if (changedShow) {
        console.log('🔄 更新剧集信息:', changedShow.name, '更新内容:', updates);
      }
      return updated;
    });
  };

  // 懒加载确保剧集为目标语言：有缓存则用缓存，否则调用 TMDB 获取并缓存
  const ensureShowLanguage = async (showId: number, language: string) => {
    try {
      const cacheKey = SHOW_LANG_CACHE_KEY(showId, language);
      const ensureKey = `${showId}_${language}`;

      // 已保证过该语言，直接返回
      if (ensuredLangMapRef.current.get(ensureKey)) {
        return;
      }
      // 正在请求中，避免并发重复
      if (inflightRef.current.has(ensureKey)) {
        return;
      }

      // 尝试读取缓存
      const cached = await AsyncStorage.getItem(cacheKey);
      const current = shows.find(s => s.id === showId);
      if (cached) {
        const data = JSON.parse(cached) as Partial<Show>;
        // 如果当前数据已与缓存一致，则标记为已保证并返回
        if (
          current &&
          current.name === data.name &&
          current.overview === data.overview &&
          ((current.genre_ids && data.genre_ids && current.genre_ids.join(',') === data.genre_ids.join(',')) ||
           (!current.genre_ids && !data.genre_ids))
        ) {
          ensuredLangMapRef.current.set(ensureKey, true);
          return;
        }
        // 否则仅在确有变化时更新
        updateShow(showId, {
          name: data.name,
          overview: data.overview,
          genres: data.genres,
          genre_ids: data.genre_ids,
        });
        ensuredLangMapRef.current.set(ensureKey, true);
        return;
      }

      // 未命中缓存，发起请求
      inflightRef.current.add(ensureKey);

      // 未命中缓存，调用 TMDB 获取目标语言详情
      const details = await TMDBService.getShowDetails(showId, language);
      const updates: Partial<Show> = {
        name: details.name,
        overview: details.overview,
        genres: details.genres,
        genre_ids: details.genre_ids,
      };
      // 仅在发生变化时才更新，避免无效setState引起的循环
      const after = shows.find(s => s.id === showId);
      const changed = !after ||
        after.name !== updates.name ||
        after.overview !== updates.overview ||
        ((after.genre_ids || []).join(',') !== (updates.genre_ids || []).join(','));
      if (changed) {
        updateShow(showId, updates);
      }
      await AsyncStorage.setItem(cacheKey, JSON.stringify(updates));
      ensuredLangMapRef.current.set(ensureKey, true);
    } catch (error) {
      console.warn('⚠️ ensureShowLanguage 失败:', { showId, language, error: String(error) });
    } finally {
      const ensureKey = `${showId}_${language}`;
      inflightRef.current.delete(ensureKey);
    }
  };

  return (
    <ShowListContext.Provider value={{ shows, addShow, changeShowStatus, removeShow, clearShows, updateShow, syncShowsToCloud, downloadShowsFromCloud, isSyncing, ensureShowLanguage }}>
      {children}
    </ShowListContext.Provider>
  );
}; 