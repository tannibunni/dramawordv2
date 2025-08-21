import AsyncStorage from '@react-native-async-storage/async-storage';
import { iapService } from './iapService';
import { 
  ProductId, 
  PurchaseResult, 
  SubscriptionStatus,
  SubscriptionPlan,
  FeaturePermission,
  SubscriptionStateCallback,
  SUBSCRIPTION_PLANS
} from '../types/subscription';

class SubscriptionService {
  private static instance: SubscriptionService;
  private stateCallbacks: SubscriptionStateCallback[] = [];
  private currentStatus: SubscriptionStatus = {
    isActive: false,
  };

  private constructor() {}

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * 初始化订阅服务
   */
  public async initialize(): Promise<void> {
    try {
      // 初始化IAP服务
      await iapService.initialize();
      
      // 获取当前订阅状态
      this.currentStatus = await iapService.checkSubscriptionStatus();
      
      console.log('[SubscriptionService] 初始化成功，当前状态:', this.currentStatus);
    } catch (error) {
      console.error('[SubscriptionService] 初始化失败:', error);
    }
  }

  /**
   * 获取所有订阅计划
   */
  public getSubscriptionPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  }

  /**
   * 获取推荐计划
   */
  public getRecommendedPlan(): SubscriptionPlan | null {
    return SUBSCRIPTION_PLANS.find(plan => plan.isRecommended) || null;
  }

  /**
   * 获取最受欢迎计划
   */
  public getPopularPlan(): SubscriptionPlan | null {
    return SUBSCRIPTION_PLANS.find(plan => plan.isPopular) || null;
  }

  /**
   * 订阅产品
   */
  public async subscribeToPlan(productId: ProductId): Promise<PurchaseResult> {
    try {
      console.log(`[SubscriptionService] 开始订阅计划: ${productId}`);

      // 调用IAP服务购买产品
      const result = await iapService.purchaseProduct(productId);
      
      if (result.success) {
        // 更新本地状态
        this.currentStatus = await iapService.checkSubscriptionStatus();
        
        // 通知所有回调
        this.notifyStateChange(this.currentStatus);
        
        // 保存订阅记录
        await this.saveSubscriptionRecord(result);
        
        console.log('[SubscriptionService] 订阅成功:', result);
      }

      return result;
    } catch (error) {
      console.error('[SubscriptionService] 订阅失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '订阅失败',
      };
    }
  }

  /**
   * 恢复购买
   */
  public async restorePurchases(): Promise<PurchaseResult[]> {
    try {
      console.log('[SubscriptionService] 开始恢复购买');
      
      const results = await iapService.restorePurchases();
      
      if (results.some(r => r.success)) {
        // 更新本地状态
        this.currentStatus = await iapService.checkSubscriptionStatus();
        
        // 通知所有回调
        this.notifyStateChange(this.currentStatus);
        
        console.log('[SubscriptionService] 恢复购买成功');
      }

      return results;
    } catch (error) {
      console.error('[SubscriptionService] 恢复购买失败:', error);
      return [{
        success: false,
        error: error instanceof Error ? error.message : '恢复购买失败',
      }];
    }
  }

  /**
   * 检查订阅状态
   */
  public async checkSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const oldStatus = this.currentStatus;
      
      // 在开发模式下，检查是否有测试状态
      if (__DEV__) {
        const testStatus = await this.getTestSubscriptionStatus();
        if (testStatus) {
          this.currentStatus = testStatus;
          
          // 如果状态发生变化，通知所有回调
          if (JSON.stringify(oldStatus) !== JSON.stringify(this.currentStatus)) {
            this.notifyStateChange(this.currentStatus);
          }
          
          console.log('🧪 [SubscriptionService] 使用测试订阅状态:', this.currentStatus);
          return this.currentStatus;
        }
      }
      
      // 正常模式下从IAP服务获取状态
      this.currentStatus = await iapService.checkSubscriptionStatus();
      
      // 如果状态发生变化，通知所有回调
      if (JSON.stringify(oldStatus) !== JSON.stringify(this.currentStatus)) {
        this.notifyStateChange(this.currentStatus);
      }
      
      return this.currentStatus;
    } catch (error) {
      console.error('[SubscriptionService] 检查订阅状态失败:', error);
      return this.currentStatus;
    }
  }

  /**
   * 获取当前订阅状态
   */
  public getCurrentSubscriptionStatus(): SubscriptionStatus {
    return this.currentStatus;
  }

  /**
   * 检查功能访问权限
   */
  public canAccessFeature(feature: string): boolean {
    // 如果用户已订阅，可以访问所有功能
    if (this.currentStatus.isActive) {
      return true;
    }

    // 检查是否在14天试用期内
    if (this.isInTrialPeriod()) {
      return true; // 试用期内可以访问所有功能
    }

    // 试用期结束后，免费用户只能访问基础查词功能
    const basicFeatures = ['basic_word_lookup'];
    return basicFeatures.includes(feature);
  }

  /**
   * 检查是否在14天试用期内
   */
  private isInTrialPeriod(): boolean {
    // 检查是否有试用期记录
    if (!this.currentStatus.isTrial || !this.currentStatus.trialEndsAt) {
      return false;
    }

    const now = new Date();
    const trialEnd = new Date(this.currentStatus.trialEndsAt);
    
    return now < trialEnd;
  }

  /**
   * 获取试用期信息
   */
  public getTrialInfo(): { isActive: boolean; daysLeft: number; endDate?: Date; hoursLeft?: number } {
    if (!this.isInTrialPeriod()) {
      return { isActive: false, daysLeft: 0 };
    }

    const now = new Date();
    const trialEnd = new Date(this.currentStatus.trialEndsAt!);
    const timeLeft = trialEnd.getTime() - now.getTime();
    
    // 计算剩余天数（向下取整，更准确）
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    
    // 计算剩余小时数
    const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return {
      isActive: true,
      daysLeft: Math.max(0, daysLeft),
      hoursLeft: Math.max(0, hoursLeft),
      endDate: trialEnd,
    };
  }

  /**
   * 检查语言支持
   */
  public canAccessLanguage(language: string): boolean {
    // 如果用户已订阅，可以访问所有语言
    if (this.currentStatus.isActive) {
      return true;
    }

    // 检查是否在14天试用期内
    if (this.isInTrialPeriod()) {
      return true; // 试用期内可以访问所有语言
    }

    // 试用期结束后，免费用户只能访问中英文
    const freeLanguages = ['zh', 'en', 'zh-cn', 'zh-tw', 'en-us', 'en-gb'];
    return freeLanguages.includes(language.toLowerCase());
  }

  /**
   * 获取功能权限列表
   */
  public getFeaturePermissions(): FeaturePermission[] {
    const isInTrial = this.isInTrialPeriod();
    const trialInfo = this.getTrialInfo();

    const features: Array<{
      id: string;
      name: string;
      description: string;
      freeAccess: 'full' | 'limited' | 'none';
    }> = [
      { 
        id: 'basic_word_lookup', 
        name: '基础单词查询', 
        description: '支持中英文单词查询',
        freeAccess: 'full' // 免费版本完全支持
      },
      { 
        id: 'advanced_word_lookup', 
        name: '多语言支持', 
        description: '支持日语、韩语、西班牙语等',
        freeAccess: isInTrial ? 'full' : 'none'
      },
      { 
        id: 'word_storage', 
        name: '单词本功能', 
        description: isInTrial ? '无限制储存' : '不支持',
        freeAccess: isInTrial ? 'full' : 'none'
      },
      { 
        id: 'review_system', 
        name: '复习系统', 
        description: isInTrial ? '完整智能复习系统' : '不支持',
        freeAccess: isInTrial ? 'full' : 'none'
      },
      { 
        id: 'learning_stats', 
        name: '学习统计', 
        description: isInTrial ? '详细学习分析' : '不支持',
        freeAccess: isInTrial ? 'full' : 'none'
      },
      { 
        id: 'show_management', 
        name: '剧单管理', 
        description: isInTrial ? '完整剧单管理' : '不支持',
        freeAccess: isInTrial ? 'full' : 'none'
      },
      { 
        id: 'ai_interpretation', 
        name: 'AI智能释义', 
        description: 'OpenAI提供的个性化释义',
        freeAccess: isInTrial ? 'full' : 'none'
      },
      { 
        id: 'offline_learning', 
        name: '离线学习', 
        description: '无网络时也能学习',
        freeAccess: isInTrial ? 'full' : 'none'
      },
      { 
        id: 'multi_device_sync', 
        name: '多设备同步', 
        description: '数据在多个设备间同步',
        freeAccess: isInTrial ? 'full' : 'none'
      },
    ];

    return features.map(feature => {
      const isAccessible = this.canAccessFeature(feature.id);
      const requiresSubscription = !isAccessible;
      
      let message = feature.description;
      if (isInTrial && feature.freeAccess === 'full') {
        message += ` (试用期内免费)`;
      } else if (!isInTrial && feature.freeAccess === 'limited') {
        message += ` (免费版限制)`;
      } else if (!isInTrial && feature.freeAccess === 'none') {
        message += ` (需要升级)`;
      }

      return {
        feature: feature.id,
        isAccessible,
        requiresSubscription,
        freeTierAccess: feature.freeAccess,
        message,
      };
    });
  }

  /**
   * 获取免费版功能说明
   */
  public getFreeVersionFeatures(): string[] {
    const isInTrial = this.isInTrialPeriod();
    
    if (isInTrial) {
      return [
        '✅ 完整的中英文查词功能',
        '✅ 多语言支持（日语、韩语、西班牙语等）',
        '✅ 无限单词储存',
        '✅ 完整智能复习系统',
        '✅ 详细学习统计和分析',
        '✅ AI智能释义',
        '✅ 离线学习功能',
        '✅ 多设备数据同步',
        '⏰ 14天试用期，到期后功能受限',
      ];
    } else {
      return [
        '✅ 基础中英文查词功能',
        '❌ 其他语言支持',
        '❌ 最多3个单词储存',
        '❌ 基础复习功能',
        '❌ 基础学习统计',
        '❌ AI智能释义',
        '❌ 离线学习功能',
        '❌ 多设备数据同步',
        '💡 升级到高级版解锁所有功能',
      ];
    }
  }

  /**
   * 获取高级版功能说明
   */
  public getPremiumFeatures(): string[] {
    return [
      '多语言支持（日语、韩语、西班牙语等）',
      'AI智能释义和个性化解释',
      '无限单词储存',
      '完整的智能复习系统',
      '详细的学习统计和分析',
      '离线学习功能',
      '多设备数据同步',
      '优先客服支持',
    ];
  }

  /**
   * 注册状态变化回调
   */
  public registerStateCallback(callback: SubscriptionStateCallback): () => void {
    this.stateCallbacks.push(callback);
    
    // 返回取消注册的函数
    return () => {
      const index = this.stateCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 检查是否需要显示升级提示
   */
  public shouldShowUpgradePrompt(feature: string): boolean {
    // 如果用户已经订阅，不需要显示升级提示
    if (this.currentStatus.isActive) {
      return false;
    }

    // 检查功能是否需要订阅
    return !this.canAccessFeature(feature);
  }

  /**
   * 获取升级提示消息
   */
  public getUpgradePromptMessage(feature: string): string {
    const trialInfo = this.getTrialInfo();
    
    if (trialInfo.isActive) {
      return `试用期还有 ${trialInfo.daysLeft} 天，到期后此功能将被锁定。立即订阅保持完整功能！`;
    }

    const featureNames: Record<string, string> = {
      'basic_word_lookup': '基础单词查询',
      'advanced_word_lookup': '多语言支持',
      'word_storage': '无限单词储存',
      'review_system': '完整复习系统',
      'ai_definition': 'AI智能释义',
      'offline_learning': '离线学习',
      'multi_device': '多设备同步',
    };

    const featureName = featureNames[feature] || '高级功能';
    
    return `此功能需要高级版订阅。升级后您可以享受${featureName}等更多功能！`;
  }



  // ==================== 私有方法 ====================

  /**
   * 获取测试订阅状态（仅开发模式）
   */
  private async getTestSubscriptionStatus(): Promise<SubscriptionStatus | null> {
    if (!__DEV__) return null;
    
    try {
      const testData = await AsyncStorage.getItem('test_subscription_state');
      if (testData) {
        const parsed = JSON.parse(testData);
        return parsed.data;
      }
    } catch (error) {
      console.error('[SubscriptionService] 获取测试状态失败:', error);
    }
    
    return null;
  }

  /**
   * 通知状态变化
   */
  private notifyStateChange(status: SubscriptionStatus): void {
    this.stateCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('[SubscriptionService] 回调执行失败:', error);
      }
    });
  }

  /**
   * 保存订阅记录
   */
  private async saveSubscriptionRecord(result: PurchaseResult): Promise<void> {
    try {
      const record = {
        productId: result.productId,
        transactionId: result.transactionId,
        purchaseDate: new Date().toISOString(),
        receipt: result.receipt,
      };

      await AsyncStorage.setItem('subscription_record', JSON.stringify(record));
      console.log('[SubscriptionService] 订阅记录已保存');
    } catch (error) {
      console.error('[SubscriptionService] 保存订阅记录失败:', error);
    }
  }
}

// 导出单例实例
export const subscriptionService = SubscriptionService.getInstance();
