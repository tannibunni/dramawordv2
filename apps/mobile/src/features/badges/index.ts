// 导出所有徽章相关组件和功能
export { BadgeWallScreen } from './screens/BadgeWallScreen';
export { BadgeCard } from './components/BadgeCard';
export { BadgeDetailModal } from './components/BadgeDetailModal';
export { BadgeEntrySection } from './components/BadgeEntrySection';
export { useBadges } from './hooks/useBadges';
export { BadgeService } from './services/badgeService';
export type { 
  BadgeDefinition, 
  UserBadgeProgress, 
  BadgeDetailModalProps,
  BadgeMetric 
} from './types/badge';
