import { subscriptionService } from './subscriptionService';

// 定义功能类型
export type FeatureType = 
  | 'wordLookup'           // 查单词（中英）- 基础功能，始终可用
  | 'vocabulary'            // 词汇本
  | 'showList'              // 剧集列表
  | 'review'                // 复习功能
  | 'dailyRewards'          // 每日奖励
  | 'advancedSearch'        // 高级搜索
  | 'learningStats'         // 学习统计
  | 'dataSync'              // 数据同步
  | 'customSettings';       // 自定义设置

// 功能配置接口
interface FeatureConfig {
  name: FeatureType;
  displayName: string;
  description: string;
  requiresSubscription: boolean;
  trialAccess: boolean; // 试用期是否可用
}

// 功能配置表
const FEATURE_CONFIGS: Record<FeatureType, FeatureConfig> = {
  wordLookup: {
    name: 'wordLookup',
    displayName: '查单词',
    description: '中英文单词查询',
    requiresSubscription: false,
    trialAccess: true,
  },
  vocabulary: {
    name: 'vocabulary',
    displayName: '词汇本',
    description: '管理收藏的单词',
    requiresSubscription: true,
    trialAccess: true,
  },
  showList: {
    name: 'showList',
    displayName: '剧集列表',
    description: '收藏的剧集和电影',
    requiresSubscription: true,
    trialAccess: true,
  },
  review: {
    name: 'review',
    displayName: '复习功能',
    description: '智能复习和练习',
    requiresSubscription: true,
    trialAccess: true,
  },
  dailyRewards: {
    name: 'dailyRewards',
    displayName: '每日奖励',
    description: '每日学习奖励和经验值',
    requiresSubscription: true,
    trialAccess: true,
  },
  advancedSearch: {
    name: 'advancedSearch',
    displayName: '高级搜索',
    description: '多语言、多条件搜索',
    requiresSubscription: true,
    trialAccess: true,
  },
  learningStats: {
    name: 'learningStats',
    displayName: '学习统计',
    description: '详细的学习进度和统计',
    requiresSubscription: true,
    trialAccess: true,
  },
  dataSync: {
    name: 'dataSync',
    displayName: '数据同步',
    description: '云端数据同步和备份',
    requiresSubscription: true,
    trialAccess: true,
  },
  customSettings: {
    name: 'customSettings',
    displayName: '自定义设置',
    description: '个性化学习设置',
    requiresSubscription: true,
    trialAccess: true,
  },
};

class FeatureAccessService {
  private static instance: FeatureAccessService;
  private upgradeModalCallback?: (feature: FeatureType) => void;

  private constructor() {}

  static getInstance(): FeatureAccessService {
    if (!FeatureAccessService.instance) {
      FeatureAccessService.instance = new FeatureAccessService();
    }
    return FeatureAccessService.instance;
  }

  /**
   * 检查用户是否可以访问指定功能
   */
  async canAccessFeature(feature: FeatureType): Promise<boolean> {
    try {
      const status = await subscriptionService.checkSubscriptionStatus();
      
      // 付费会员可以访问所有功能
      if (status?.isActive) {
        return true;
      }
      
      // 试用期用户可以访问所有功能
      if (status?.isTrial) {
        return true;
      }
      
      // 试用期结束后，只有基础功能可用
      const featureConfig = FEATURE_CONFIGS[feature];
      if (!featureConfig) {
        console.warn(`[FeatureAccessService] 未知功能: ${feature}`);
        return false;
      }
      
      // 基础功能始终可用
      if (!featureConfig.requiresSubscription) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[FeatureAccessService] 检查功能权限失败:', error);
      // 出错时默认允许访问，避免阻塞用户体验
      return true;
    }
  }

  /**
   * 获取功能配置信息
   */
  getFeatureConfig(feature: FeatureType): FeatureConfig | null {
    return FEATURE_CONFIGS[feature] || null;
  }

  /**
   * 获取所有功能配置
   */
  getAllFeatureConfigs(): FeatureConfig[] {
    return Object.values(FEATURE_CONFIGS);
  }

  /**
   * 获取用户当前可用的功能列表
   */
  async getAvailableFeatures(): Promise<FeatureType[]> {
    const availableFeatures: FeatureType[] = [];
    
    for (const feature of Object.keys(FEATURE_CONFIGS) as FeatureType[]) {
      if (await this.canAccessFeature(feature)) {
        availableFeatures.push(feature);
      }
    }
    
    return availableFeatures;
  }

  /**
   * 获取用户当前不可用的功能列表
   */
  async getUnavailableFeatures(): Promise<FeatureType[]> {
    const unavailableFeatures: FeatureType[] = [];
    
    for (const feature of Object.keys(FEATURE_CONFIGS) as FeatureType[]) {
      if (!(await this.canAccessFeature(feature))) {
        unavailableFeatures.push(feature);
      }
    }
    
    return unavailableFeatures;
  }

  /**
   * 设置升级弹窗回调函数
   */
  setUpgradeModalCallback(callback: ((feature: FeatureType) => void) | undefined): void {
    this.upgradeModalCallback = callback;
  }

  /**
   * 触发升级弹窗
   */
  triggerUpgradeModal(feature: FeatureType): void {
    if (this.upgradeModalCallback) {
      this.upgradeModalCallback(feature);
    } else {
      console.warn('[FeatureAccessService] 升级弹窗回调未设置');
    }
  }

  /**
   * 检查并处理功能访问
   * 如果用户无法访问，自动触发升级弹窗
   */
  async checkAndHandleAccess(feature: FeatureType): Promise<boolean> {
    const canAccess = await this.canAccessFeature(feature);
    
    if (!canAccess) {
      this.triggerUpgradeModal(feature);
      return false;
    }
    
    return true;
  }

  /**
   * 获取功能限制提示信息
   */
  getFeatureRestrictionMessage(feature: FeatureType): string {
    const featureConfig = FEATURE_CONFIGS[feature];
    if (!featureConfig) return '';
    
    return `试用期结束后，${featureConfig.displayName}功能需要升级到付费版才能使用`;
  }

  /**
   * 检查用户是否处于试用期结束状态
   */
  async isTrialExpired(): Promise<boolean> {
    try {
      const status = await subscriptionService.checkSubscriptionStatus();
      return !status?.isActive && !status?.isTrial;
    } catch (error) {
      console.error('[FeatureAccessService] 检查试用期状态失败:', error);
      return false;
    }
  }
}

export default FeatureAccessService.getInstance();
