import { logger } from '../utils/logger';

export interface UserActivityData {
  userId: string;
  lastLoginAt: Date;
  loginCount: number;
  totalSessionTime: number;
  averageSessionTime: number;
  actionsPerDay: number;
  dataSyncFrequency: number;
  lastSyncAt: Date;
  deviceCount: number;
  timezone: string;
  language: string;
}

export interface ActivityMetrics {
  loginFrequency: number;        // 登录频率 (次/天)
  sessionDuration: number;       // 平均会话时长 (分钟)
  dailyActions: number;          // 每日操作次数
  syncFrequency: number;         // 同步频率 (次/天)
  deviceActivity: number;        // 设备活跃度 (0-1)
  timezoneActivity: number;      // 时区活跃度 (0-1)
}

export interface ActivityLevel {
  level: 'high' | 'medium' | 'low' | 'inactive';
  score: number;                 // 活跃度分数 (0-100)
  confidence: number;            // 置信度 (0-1)
  factors: string[];             // 影响因素
  recommendations: string[];     // 优化建议
}

export class UserActivityAnalysisService {
  private static instance: UserActivityAnalysisService;
  private activityCache: Map<string, ActivityLevel> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存

  private constructor() {
    this.startPeriodicAnalysis();
  }

  public static getInstance(): UserActivityAnalysisService {
    if (!UserActivityAnalysisService.instance) {
      UserActivityAnalysisService.instance = new UserActivityAnalysisService();
    }
    return UserActivityAnalysisService.instance;
  }

  // 分析用户活跃度
  public async analyzeUserActivity(userId: string, activityData: UserActivityData): Promise<ActivityLevel> {
    try {
      // 检查缓存
      const cached = this.getCachedActivity(userId);
      if (cached) {
        return cached;
      }

      logger.info(`📊 分析用户活跃度: ${userId}`);

      // 计算活跃度指标
      const metrics = this.calculateActivityMetrics(activityData);
      
      // 计算活跃度分数
      const score = this.calculateActivityScore(metrics);
      
      // 确定活跃度等级
      const level = this.determineActivityLevel(score, metrics);
      
      // 生成影响因素和建议
      const factors = this.identifyActivityFactors(metrics, level);
      const recommendations = this.generateRecommendations(level, metrics);
      
      // 计算置信度
      const confidence = this.calculateConfidence(metrics, activityData);
      
      const activityLevel: ActivityLevel = {
        level,
        score,
        confidence,
        factors,
        recommendations
      };

      // 缓存结果
      this.cacheActivity(userId, activityLevel);
      
      logger.info(`✅ 用户活跃度分析完成: ${userId}, 等级: ${level}, 分数: ${score}`);
      
      return activityLevel;
    } catch (error) {
      logger.error(`❌ 用户活跃度分析失败: ${userId}`, error);
      return {
        level: 'medium',
        score: 50,
        confidence: 0.5,
        factors: ['分析失败'],
        recommendations: ['使用默认同步策略']
      };
    }
  }

  // 计算活跃度指标
  private calculateActivityMetrics(data: UserActivityData): ActivityMetrics {
    const now = new Date();
    const daysSinceLastLogin = Math.max(1, (now.getTime() - data.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLastSync = Math.max(1, (now.getTime() - data.lastSyncAt.getTime()) / (1000 * 60 * 60 * 24));

    return {
      loginFrequency: data.loginCount / Math.max(1, daysSinceLastLogin),
      sessionDuration: data.averageSessionTime / (1000 * 60), // 转换为分钟
      dailyActions: data.actionsPerDay,
      syncFrequency: data.dataSyncFrequency / Math.max(1, daysSinceLastSync),
      deviceActivity: Math.min(1, data.deviceCount / 3), // 最多3个设备
      timezoneActivity: this.calculateTimezoneActivity(data.timezone, data.language)
    };
  }

  // 计算时区活跃度
  private calculateTimezoneActivity(timezone: string, language: string): number {
    const now = new Date();
    const userHour = new Date(now.toLocaleString("en-US", { timeZone: timezone })).getHours();
    
    // 根据时区和语言判断活跃时段
    let activityMultiplier = 1.0;
    
    // 亚洲时区 (中文、日文、韩文)
    if (['zh', 'ja', 'ko'].includes(language)) {
      if (userHour >= 7 && userHour <= 11) activityMultiplier = 1.2; // 上午活跃
      else if (userHour >= 19 && userHour <= 23) activityMultiplier = 1.1; // 晚上活跃
      else if (userHour >= 0 && userHour <= 6) activityMultiplier = 0.3; // 深夜不活跃
    }
    // 欧美时区 (英文、法文、德文等)
    else {
      if (userHour >= 9 && userHour <= 17) activityMultiplier = 1.1; // 工作时间
      else if (userHour >= 18 && userHour <= 22) activityMultiplier = 1.0; // 晚上
      else if (userHour >= 0 && userHour <= 8) activityMultiplier = 0.2; // 深夜
    }
    
    return Math.min(1, activityMultiplier);
  }

  // 计算活跃度分数
  private calculateActivityScore(metrics: ActivityMetrics): number {
    const weights = {
      loginFrequency: 0.25,      // 登录频率权重
      sessionDuration: 0.20,     // 会话时长权重
      dailyActions: 0.25,        // 每日操作权重
      syncFrequency: 0.15,       // 同步频率权重
      deviceActivity: 0.10,      // 设备活跃度权重
      timezoneActivity: 0.05     // 时区活跃度权重
    };

    // 标准化分数 (0-100)
    const loginScore = Math.min(100, metrics.loginFrequency * 10);
    const sessionScore = Math.min(100, metrics.sessionDuration * 2);
    const actionsScore = Math.min(100, metrics.dailyActions * 0.5);
    const syncScore = Math.min(100, metrics.syncFrequency * 5);
    const deviceScore = metrics.deviceActivity * 100;
    const timezoneScore = metrics.timezoneActivity * 100;

    const score = 
      loginScore * weights.loginFrequency +
      sessionScore * weights.sessionDuration +
      actionsScore * weights.dailyActions +
      syncScore * weights.syncFrequency +
      deviceScore * weights.deviceActivity +
      timezoneScore * weights.timezoneActivity;

    return Math.round(score);
  }

  // 确定活跃度等级
  private determineActivityLevel(score: number, metrics: ActivityMetrics): 'high' | 'medium' | 'low' | 'inactive' {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 30) return 'low';
    return 'inactive';
  }

  // 识别影响因素
  private identifyActivityFactors(metrics: ActivityMetrics, level: string): string[] {
    const factors: string[] = [];

    if (metrics.loginFrequency > 2) factors.push('高频登录');
    if (metrics.sessionDuration > 30) factors.push('长会话时长');
    if (metrics.dailyActions > 50) factors.push('高操作频率');
    if (metrics.syncFrequency > 10) factors.push('频繁同步');
    if (metrics.deviceActivity > 0.7) factors.push('多设备使用');
    if (metrics.timezoneActivity > 0.8) factors.push('活跃时段使用');

    if (metrics.loginFrequency < 0.5) factors.push('低频登录');
    if (metrics.sessionDuration < 10) factors.push('短会话时长');
    if (metrics.dailyActions < 10) factors.push('低操作频率');
    if (metrics.syncFrequency < 2) factors.push('低频同步');
    if (metrics.deviceActivity < 0.3) factors.push('单设备使用');
    if (metrics.timezoneActivity < 0.5) factors.push('非活跃时段使用');

    return factors;
  }

  // 生成优化建议
  private generateRecommendations(level: string, metrics: ActivityMetrics): string[] {
    const recommendations: string[] = [];

    switch (level) {
      case 'high':
        recommendations.push('使用高频同步策略');
        recommendations.push('启用实时数据同步');
        recommendations.push('优化网络连接');
        break;
      case 'medium':
        recommendations.push('使用标准同步策略');
        recommendations.push('启用智能延迟同步');
        recommendations.push('监控同步性能');
        break;
      case 'low':
        recommendations.push('使用低频同步策略');
        recommendations.push('启用批量同步');
        recommendations.push('优化电池使用');
        break;
      case 'inactive':
        recommendations.push('使用极低频同步策略');
        recommendations.push('启用离线优先模式');
        recommendations.push('减少后台同步');
        break;
    }

    // 基于指标的具体建议
    if (metrics.sessionDuration < 5) {
      recommendations.push('考虑增加会话时长');
    }
    if (metrics.deviceActivity > 0.8) {
      recommendations.push('优化多设备同步');
    }
    if (metrics.timezoneActivity < 0.3) {
      recommendations.push('调整同步时间窗口');
    }

    return recommendations;
  }

  // 计算置信度
  private calculateConfidence(metrics: ActivityMetrics, data: UserActivityData): number {
    let confidence = 0.5; // 基础置信度

    // 数据完整性检查
    if (data.loginCount > 0) confidence += 0.1;
    if (data.totalSessionTime > 0) confidence += 0.1;
    if (data.actionsPerDay > 0) confidence += 0.1;
    if (data.dataSyncFrequency > 0) confidence += 0.1;
    if (data.deviceCount > 0) confidence += 0.1;

    // 数据一致性检查
    if (metrics.loginFrequency > 0 && metrics.sessionDuration > 0) confidence += 0.1;
    if (metrics.dailyActions > 0 && metrics.syncFrequency > 0) confidence += 0.1;

    return Math.min(1, confidence);
  }

  // 获取缓存的活跃度
  private getCachedActivity(userId: string): ActivityLevel | null {
    const cached = this.activityCache.get(userId);
    const expiry = this.cacheExpiry.get(userId);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }
    
    return null;
  }

  // 缓存活跃度
  private cacheActivity(userId: string, activity: ActivityLevel): void {
    this.activityCache.set(userId, activity);
    this.cacheExpiry.set(userId, Date.now() + this.CACHE_DURATION);
  }

  // 启动定期分析
  private startPeriodicAnalysis(): void {
    setInterval(() => {
      this.cleanExpiredCache();
    }, 60 * 1000); // 每分钟清理过期缓存
  }

  // 清理过期缓存
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [userId, expiry] of this.cacheExpiry.entries()) {
      if (now > expiry) {
        this.activityCache.delete(userId);
        this.cacheExpiry.delete(userId);
      }
    }
  }

  // 获取用户活跃度统计
  public getActivityStats(): {
    totalUsers: number;
    highActivity: number;
    mediumActivity: number;
    lowActivity: number;
    inactiveUsers: number;
    averageScore: number;
  } {
    const users = Array.from(this.activityCache.values());
    const totalUsers = users.length;
    
    const highActivity = users.filter(u => u.level === 'high').length;
    const mediumActivity = users.filter(u => u.level === 'medium').length;
    const lowActivity = users.filter(u => u.level === 'low').length;
    const inactiveUsers = users.filter(u => u.level === 'inactive').length;
    
    const averageScore = totalUsers > 0 
      ? users.reduce((sum, u) => sum + u.score, 0) / totalUsers 
      : 0;

    return {
      totalUsers,
      highActivity,
      mediumActivity,
      lowActivity,
      inactiveUsers,
      averageScore: Math.round(averageScore)
    };
  }

  // 清空缓存
  public clearCache(): void {
    this.activityCache.clear();
    this.cacheExpiry.clear();
    logger.info('🗑️ 用户活跃度缓存已清空');
  }
}

export const userActivityAnalysisService = UserActivityAnalysisService.getInstance();
