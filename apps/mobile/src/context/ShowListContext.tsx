import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TMDBShow } from '../services/tmdbService';

export type ShowStatus = 'watching' | 'completed' | 'plan_to_watch';

export interface Show extends TMDBShow {
  status: ShowStatus;
  wordCount: number;
  lastWatched?: string;
}

interface ShowListContextType {
  shows: Show[];
  addShow: (show: Show) => void;
  changeShowStatus: (showId: number, newStatus: ShowStatus) => void;
  removeShow: (showId: number) => void;
  clearShows: () => void;
}

const ShowListContext = createContext<ShowListContextType | undefined>(undefined);

export const useShowList = () => {
  const ctx = useContext(ShowListContext);
  if (!ctx) throw new Error('useShowList must be used within ShowListProvider');
  return ctx;
};

export const ShowListProvider = ({ children }: { children: ReactNode }) => {
  const [shows, setShows] = useState<Show[]>([]);

  const addShow = (show: Show) => {
    setShows(prev => {
      if (prev.some(s => s.id === show.id)) return prev;
      return [...prev, show];
    });
  };

  const changeShowStatus = (showId: number, newStatus: ShowStatus) => {
    setShows(prev => prev.map(s => s.id === showId ? { ...s, status: newStatus } : s));
  };

  const removeShow = (showId: number) => {
    setShows(prev => prev.filter(s => s.id !== showId));
  };

  const clearShows = () => {
    setShows([]);
  };

  // TODO: 可在此处与后端同步

  return (
    <ShowListContext.Provider value={{ shows, addShow, changeShowStatus, removeShow, clearShows }}>
      {children}
    </ShowListContext.Provider>
  );
}; 