import { BadgeDefinition, UserBadgeProgress } from '../types/badge';

// 模拟徽章数据（实际应该从服务端获取）
const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'collector_10',
    name: '初级收藏家',
    description: '收集10个单词',
    icon: 'badge_collect_10.png',
    metric: 'words_collected_total',
    target: 10
  },
  {
    id: 'collector_50',
    name: '中级收藏家',
    description: '收集50个单词',
    icon: 'badge_collect_50.png',
    metric: 'words_collected_total',
    target: 50
  },
  {
    id: 'collector_100',
    name: '高级收藏家',
    description: '收集100个单词',
    icon: 'badge_collect_100.png',
    metric: 'words_collected_total',
    target: 100
  },
  {
    id: 'reviewer_10',
    name: '复习达人',
    description: '完成10次复习',
    icon: 'badge_review_10.png',
    metric: 'review_sessions_completed',
    target: 10
  },
  {
    id: 'streak_7',
    name: '坚持一周',
    description: '连续学习7天',
    icon: 'badge_streak_7.png',
    metric: 'daily_checkin_streak',
    target: 7
  },
  {
    id: 'streak_30',
    name: '月度达人',
    description: '连续学习30天',
    icon: 'badge_streak_30.png',
    metric: 'daily_checkin_streak',
    target: 30
  },
  {
    id: 'contributor_5',
    name: '贡献者',
    description: '贡献5个词条',
    icon: 'badge_contributor_5.png',
    metric: 'words_contributed',
    target: 5
  },
  {
    id: 'showlist_3',
    name: '剧集收藏家',
    description: '创建3个剧单',
    icon: 'badge_showlist_3.png',
    metric: 'showlist_created',
    target: 3
  }
];

export class BadgeService {
  // 获取所有徽章定义
  async getBadgeDefinitions(): Promise<BadgeDefinition[]> {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    return BADGE_DEFINITIONS;
  }

  // 获取用户徽章进度（模拟数据）
  async getUserBadgeProgress(userId: string): Promise<UserBadgeProgress[]> {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 模拟用户进度数据
    return BADGE_DEFINITIONS.map(badge => ({
      userId,
      badgeId: badge.id,
      unlocked: Math.random() > 0.5, // 随机解锁状态
      progress: Math.floor(Math.random() * badge.target),
      target: badge.target,
      unlockedAt: Math.random() > 0.5 ? new Date() : undefined
    }));
  }

  // 获取徽章定义（根据ID）
  async getBadgeDefinition(badgeId: string): Promise<BadgeDefinition | null> {
    const badges = await this.getBadgeDefinitions();
    return badges.find(badge => badge.id === badgeId) || null;
  }

  // 获取用户特定徽章进度
  async getUserBadgeProgressById(userId: string, badgeId: string): Promise<UserBadgeProgress | null> {
    const allProgress = await this.getUserBadgeProgress(userId);
    return allProgress.find(progress => progress.badgeId === badgeId) || null;
  }
}

export default new BadgeService();
