// 经验值相关类型定义

// 基础经验值接口
export interface BaseExperience {
  experience: number;
  level: number;
}

// 经验值配置接口
export interface ExperienceConfig {
  baseXP: number;
  levelMultiplier: number;
  dailyLimits: DailyLimits;
  xpRewards: XPRewards;
}

// 每日限制接口
export interface DailyLimits {
  review: number;
  smartChallenge: number;
  wrongWordChallenge: number;
  newWord: number;
  contribution: number;
  dailyCheckin: number;
  dailyCards: number;
  studyTime: number;
}

// 经验值奖励接口
export interface XPRewards {
  review: ReviewRewards;
  smartChallenge: number;
  wrongWordChallenge: number;
  newWord: number;
  contribution: number;
  dailyCheckin: number;
  dailyCards: number;
  studyTime: number;
}

// 复习奖励接口
export interface ReviewRewards {
  correct: number;
  incorrect: number;
}

// 等级信息接口
export interface LevelInfo {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  progressPercentage: number;
  totalExperience: number;
  levelName: string;
  levelColor: string;
}

// 经验值增益结果接口
export interface ExperienceGainResult {
  success: boolean;
  xpGained: number;
  newLevel: number;
  leveledUp: boolean;
  message: string;
  oldLevel: number;
  oldExperience: number;
  newExperience: number;
  progressChange: number;
}

// 每日限制检查结果接口
export interface DailyLimitCheck {
  canGain: boolean;
  remaining: number;
  limit: number;
  used: number;
}

// 经验值事件接口
export interface ExperienceEvent {
  type: ExperienceEventType;
  xpGained: number;
  leveledUp: boolean;
  message: string;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, any>;
}

// 经验值事件类型
export type ExperienceEventType = 
  | 'review'
  | 'smartChallenge'
  | 'wrongWordChallenge'
  | 'newWord'
  | 'contribution'
  | 'dailyCheckin'
  | 'dailyCards'
  | 'studyTime';

// 经验值统计接口
export interface ExperienceStats {
  totalXP: number;
  byType: Record<string, number>;
  byDay: Record<string, number>;
  averageXPPerEvent: number;
  mostProductiveDay: string;
  mostProductiveType: string;
}

// 用户经验值信息接口
export interface UserExperienceInfo {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  progressPercentage: number;
  totalExperience: number;
  dailyReviewXP: number;
  dailyStudyTimeXP: number;
  completedDailyCards: boolean;
  currentStreak: number;
  contributedWords: number;
}

// 经验值获取方式接口
export interface ExperienceWay {
  name: string;
  description: string;
  dailyLimit: string;
  xpPerAction: string;
}

// 经验值获取方式集合接口
export interface ExperienceWays {
  review: ExperienceWay;
  smartChallenge: ExperienceWay;
  wrongWordChallenge: ExperienceWay;
  newWord: ExperienceWay;
  contribution: ExperienceWay;
  dailyCheckin: ExperienceWay;
  dailyCards: ExperienceWay;
  studyTime: ExperienceWay;
}

// 经验值验证结果接口
export interface ExperienceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// 经验值计算选项接口
export interface ExperienceCalculationOptions {
  includeProgress?: boolean;
  includeLevelInfo?: boolean;
  includeStats?: boolean;
  validateData?: boolean;
}

// 经验值历史记录接口
export interface ExperienceHistory {
  events: ExperienceEvent[];
  totalEvents: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  summary: ExperienceStats;
}

// 经验值目标接口
export interface ExperienceGoal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'level';
  target: number;
  current: number;
  description: string;
  reward?: {
    type: string;
    value: any;
  };
  completed: boolean;
  deadline?: Date;
}

// 经验值成就接口
export interface ExperienceAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
  reward?: {
    type: string;
    value: any;
  };
}

// 经验值等级配置接口
export interface LevelConfig {
  level: number;
  name: string;
  color: string;
  requiredExp: number;
  rewards?: LevelReward[];
}

// 等级奖励接口
export interface LevelReward {
  type: string;
  value: any;
  description: string;
}

// 经验值同步数据接口
export interface ExperienceSyncData {
  userId: string;
  experience: number;
  level: number;
  lastUpdated: Date;
  events: ExperienceEvent[];
  version: number;
}

// 经验值缓存接口
export interface ExperienceCache {
  levelInfo: LevelInfo;
  lastCalculated: Date;
  events: ExperienceEvent[];
  stats: ExperienceStats;
}

// 经验值API响应接口
export interface ExperienceAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

// 经验值错误类型
export enum ExperienceErrorType {
  INVALID_EXPERIENCE = 'INVALID_EXPERIENCE',
  INVALID_LEVEL = 'INVALID_LEVEL',
  DAILY_LIMIT_EXCEEDED = 'DAILY_LIMIT_EXCEEDED',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  SYNC_ERROR = 'SYNC_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
}

// 数据冲突解决器类型
export interface DataConflictResolver {
  resolveConflict(conflict: any): any;
}

// 经验值错误接口
export interface ExperienceError {
  type: ExperienceErrorType;
  message: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// 经验值服务接口
export interface IExperienceService {
  getExperienceInfo(): Promise<UserExperienceInfo | null>;
  getExperienceWays(): Promise<ExperienceWays | null>;
  addReviewExperience(isCorrect: boolean): Promise<ExperienceGainResult | null>;
  addSmartChallengeExperience(): Promise<ExperienceGainResult | null>;
  addWrongWordChallengeExperience(): Promise<ExperienceGainResult | null>;
  addNewWordExperience(): Promise<ExperienceGainResult | null>;
  addContributionExperience(): Promise<ExperienceGainResult | null>;
  dailyCheckin(): Promise<ExperienceGainResult | null>;
  completeDailyCards(): Promise<ExperienceGainResult | null>;
  addStudyTime(minutes: number): Promise<ExperienceGainResult | null>;
}

// 经验值计算服务接口
export interface IExperienceCalculationService {
  calculateLevel(experience: number): number;
  calculateLevelRequiredExp(level: number): number;
  calculateExpToNextLevel(experience: number): number;
  calculateProgressPercentage(experience: number): number;
  calculateLevelInfo(experience: number): LevelInfo;
  checkLevelUp(oldExperience: number, newExperience: number): {
    leveledUp: boolean;
    oldLevel: number;
    newLevel: number;
    levelsGained: number;
  };
  calculateExperienceGain(
    currentExperience: number,
    xpToGain: number,
    reason?: string
  ): ExperienceGainResult;
  validateExperienceData(data: any): ExperienceValidationResult;
  getConfig(): ExperienceConfig;
  updateConfig(config: Partial<ExperienceConfig>): void;
}

// 经验值管理器接口
export interface IExperienceManager {
  addReviewExperience(isCorrect?: boolean): Promise<ExperienceGainResult | null>;
  addSmartChallengeExperience(): Promise<ExperienceGainResult | null>;
  addWrongWordChallengeExperience(): Promise<ExperienceGainResult | null>;
  addNewWordExperience(): Promise<ExperienceGainResult | null>;
  addContributionExperience(): Promise<ExperienceGainResult | null>;
  addDailyCheckinExperience(): Promise<ExperienceGainResult | null>;
  addDailyCardsExperience(): Promise<ExperienceGainResult | null>;
  addStudyTimeExperience(minutes: number): Promise<ExperienceGainResult | null>;
  getCurrentExperienceInfo(): Promise<UserExperienceInfo | null>;
  getExperienceEvents(): Promise<ExperienceEvent[]>;
  clearExperienceEvents(): Promise<void>;
  isProcessingExperience(): boolean;
}

// 经验值常量
export const EXPERIENCE_CONSTANTS = {
  MAX_LEVEL: 100,
  MIN_EXPERIENCE: 0,
  MAX_EXPERIENCE: 999999999,
  DEFAULT_BASE_XP: 50,
  DEFAULT_LEVEL_MULTIPLIER: 2,
  DAILY_RESET_HOUR: 0, // 0点重置
  SYNC_INTERVAL: 5 * 60 * 1000, // 5分钟
  CACHE_DURATION: 10 * 60 * 1000, // 10分钟
} as const;

// 经验值工具类型
export type ExperienceEventTypeMap = {
  review: { isCorrect: boolean };
  smartChallenge: {};
  wrongWordChallenge: {};
  newWord: {};
  contribution: {};
  dailyCheckin: {};
  dailyCards: {};
  studyTime: { minutes: number };
};

// 经验值事件创建器类型
export type CreateExperienceEvent<T extends ExperienceEventType> = 
  T extends keyof ExperienceEventTypeMap
    ? (params: ExperienceEventTypeMap[T]) => ExperienceEvent
    : never;

// 经验值计算函数类型
export type ExperienceCalculationFunction<T = any> = (
  experience: number,
  options?: ExperienceCalculationOptions
) => T;

// 经验值验证函数类型
export type ExperienceValidationFunction = (
  data: any
) => ExperienceValidationResult;

// 经验值格式化函数类型
export type ExperienceFormatFunction = (
  value: number,
  format?: 'number' | 'short' | 'long'
) => string; 