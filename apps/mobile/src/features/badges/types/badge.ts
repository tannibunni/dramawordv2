// 徽章定义
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  metric: BadgeMetric;
  target: number;
}

// 徽章指标类型
export type BadgeMetric = 
  | 'words_collected_total'
  | 'review_sessions_completed'
  | 'daily_checkin_streak'
  | 'words_contributed'
  | 'learning_time_hours'
  | 'showlist_created';

// 徽章状态枚举
export type BadgeStatus = 'locked' | 'ready_to_unlock' | 'unlocked';

// 用户徽章进度
export interface UserBadgeProgress {
  userId: string;
  badgeId: string;
  unlocked: boolean;
  progress: number;
  target: number;
  unlockedAt?: Date;
  // 新增：徽章状态
  status: BadgeStatus;
  // 新增：是否已点击打开过
  hasBeenOpened?: boolean;
}

// 徽章详情弹窗属性
export interface BadgeDetailModalProps {
  visible: boolean;
  onClose: () => void;
  badge: BadgeDefinition | null;
  userProgress: UserBadgeProgress | null;
}

// 宝箱打开弹窗属性
export interface BadgeChestModalProps {
  visible: boolean;
  onClose: () => void;
  onOpen: () => void;
  badge: BadgeDefinition | null;
  userProgress: UserBadgeProgress | null;
}
