export interface DailyReward {
  id: string;
  name: string;
  description: string;
  xpAmount: number;
  icon: string;
  status: 'available' | 'claimed' | 'locked';
  condition: string;
  progress?: string;
  claimedAt?: Date;
  expiresAt: Date;
}

export interface DailyRewardsState {
  rewards: DailyReward[];
  totalAvailableXP: number;
  lastResetDate: string;
  isLoading: boolean;
}

export interface DailyRewardCondition {
  id: string;
  checkCondition: () => Promise<boolean>;
  getProgress: () => Promise<string>;
  getDescription: () => string;
}

export interface DailyRewardConfig {
  id: string;
  name: string;
  xpAmount: number;
  icon: string;
  description: string;
}
