import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TMDBShow } from '../services/tmdbService';

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
}

const ShowListContext = createContext<ShowListContextType | undefined>(undefined);

export const useShowList = () => {
  const ctx = useContext(ShowListContext);
  if (!ctx) throw new Error('useShowList must be used within ShowListProvider');
  return ctx;
};

const SHOWS_STORAGE_KEY = 'user_shows';

export const ShowListProvider = ({ children }: { children: ReactNode }) => {
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 加载本地存储的剧集数据
  useEffect(() => {
    loadShowsFromStorage();
  }, []);

  // 当剧集数据变化时保存到本地存储
  useEffect(() => {
    if (isLoaded) {
      saveShowsToStorage();
    }
  }, [shows, isLoaded]);

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
      if (prev.some(s => s.id === show.id)) {
        console.log('📺 剧集已存在:', show.name);
        return prev;
      }
      console.log('➕ 添加新剧集:', show.name, 'ID:', show.id);
      return [show, ...prev]; // 新剧集添加到列表开头
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

  return (
    <ShowListContext.Provider value={{ shows, addShow, changeShowStatus, removeShow, clearShows, updateShow }}>
      {children}
    </ShowListContext.Provider>
  );
}; 