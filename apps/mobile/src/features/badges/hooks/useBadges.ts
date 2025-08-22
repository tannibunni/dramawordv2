import { useState, useEffect } from 'react';
import { BadgeDefinition, UserBadgeProgress } from '../types/badge';
import badgeService from '../services/badgeService';

export const useBadges = (userId: string = 'user123') => {
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [userProgress, setUserProgress] = useState<UserBadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBadgeData();
  }, [userId]);

  const loadBadgeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [badgeDefinitions, progressData] = await Promise.all([
        badgeService.getBadgeDefinitions(),
        badgeService.getUserBadgeProgress(userId),
      ]);
      
      setBadges(badgeDefinitions);
      setUserProgress(progressData);
    } catch (err) {
      console.error('加载徽章数据失败:', err);
      setError('加载徽章数据失败');
    } finally {
      setLoading(false);
    }
  };

  const refreshBadges = () => {
    loadBadgeData();
  };

  const getUnlockedCount = () => {
    return userProgress.filter(p => p.unlocked).length;
  };

  const getTotalCount = () => {
    return badges.length;
  };

  const getBadgeProgress = (badgeId: string) => {
    return userProgress.find(p => p.badgeId === badgeId) || null;
  };

  const getBadgeDefinition = (badgeId: string) => {
    return badges.find(b => b.id === badgeId) || null;
  };

  return {
    badges,
    userProgress,
    loading,
    error,
    refreshBadges,
    getUnlockedCount,
    getTotalCount,
    getBadgeProgress,
    getBadgeDefinition,
  };
};
