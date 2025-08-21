import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscriptionService } from './subscriptionService';

/**
 * 订阅状态测试服务
 * 仅在开发模式下使用，用于模拟不同的订阅状态
 */

export type TestSubscriptionState = 
  | 'trial_active'      // 试用期激活中
  | 'trial_expired'     // 试用期已结束
  | 'premium_monthly'   // 付费会员（月度）
  | 'premium_yearly'    // 付费会员（年度）
  | 'free_user';        // 免费用户

const TEST_SUBSCRIPTION_KEY = 'test_subscription_state';

class SubscriptionTestService {
  private static instance: SubscriptionTestService;

  private constructor() {}

  static getInstance(): SubscriptionTestService {
    if (!SubscriptionTestService.instance) {
      SubscriptionTestService.instance = new SubscriptionTestService();
    }
    return SubscriptionTestService.instance;
  }

  /**
   * 设置测试订阅状态
   */
  async setTestState(state: TestSubscriptionState): Promise<void> {
    if (!__DEV__) {
      console.warn('[SubscriptionTestService] 仅在开发模式下可用');
      return;
    }

    try {
      const testData = this.generateTestData(state);
      
      // 保存测试状态
      await AsyncStorage.setItem(TEST_SUBSCRIPTION_KEY, JSON.stringify({
        state,
        data: testData,
        timestamp: Date.now()
      }));

      // 更新订阅服务的状态
      await this.applyTestState(testData);

      console.log(`🧪 [SubscriptionTestService] 已设置测试状态: ${state}`, testData);
    } catch (error) {
      console.error('[SubscriptionTestService] 设置测试状态失败:', error);
    }
  }

  /**
   * 获取当前测试状态
   */
  async getCurrentTestState(): Promise<TestSubscriptionState | null> {
    if (!__DEV__) return null;

    try {
      const data = await AsyncStorage.getItem(TEST_SUBSCRIPTION_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.state;
      }
    } catch (error) {
      console.error('[SubscriptionTestService] 获取测试状态失败:', error);
    }
    return null;
  }

  /**
   * 清除测试状态
   */
  async clearTestState(): Promise<void> {
    if (!__DEV__) return;

    try {
      await AsyncStorage.removeItem(TEST_SUBSCRIPTION_KEY);
      console.log('🧪 [SubscriptionTestService] 已清除测试状态');
    } catch (error) {
      console.error('[SubscriptionTestService] 清除测试状态失败:', error);
    }
  }

  /**
   * 检查是否处于测试模式
   */
  async isTestModeActive(): Promise<boolean> {
    if (!__DEV__) return false;
    
    const testState = await this.getCurrentTestState();
    return testState !== null;
  }

  /**
   * 生成测试数据
   */
  private generateTestData(state: TestSubscriptionState) {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    
    switch (state) {
      case 'trial_active':
        return {
          isActive: false,
          isTrial: true,
          trialStartDate: new Date(now.getTime() - 3 * oneDay).toISOString(), // 3天前开始
          trialEndsAt: new Date(now.getTime() + 11 * oneDay).toISOString(), // 11天后结束
          productId: null,
          expiresAt: null
        };

      case 'trial_expired':
        return {
          isActive: false,
          isTrial: false,
          trialStartDate: new Date(now.getTime() - 20 * oneDay).toISOString(), // 20天前开始
          trialEndsAt: new Date(now.getTime() - 6 * oneDay).toISOString(), // 6天前结束
          productId: null,
          expiresAt: null
        };

      case 'premium_monthly':
        return {
          isActive: true,
          isTrial: false,
          trialStartDate: new Date(now.getTime() - 45 * oneDay).toISOString(),
          trialEndsAt: new Date(now.getTime() - 31 * oneDay).toISOString(),
          productId: 'com.tannibunni.dramawordmobile.premium_monthly',
          expiresAt: new Date(now.getTime() + 20 * oneDay).toISOString() // 20天后到期
        };

      case 'premium_yearly':
        return {
          isActive: true,
          isTrial: false,
          trialStartDate: new Date(now.getTime() - 100 * oneDay).toISOString(),
          trialEndsAt: new Date(now.getTime() - 86 * oneDay).toISOString(),
          productId: 'com.tannibunni.dramawordmobile.premium_yearly',
          expiresAt: new Date(now.getTime() + 300 * oneDay).toISOString() // 300天后到期
        };

      case 'free_user':
        return {
          isActive: false,
          isTrial: false,
          trialStartDate: null,
          trialEndsAt: null,
          productId: null,
          expiresAt: null
        };

      default:
        throw new Error(`未知的测试状态: ${state}`);
    }
  }

  /**
   * 应用测试状态到订阅服务
   */
  private async applyTestState(testData: any): Promise<void> {
    try {
      // 将测试数据保存到订阅服务使用的存储位置
      await AsyncStorage.setItem('subscription_status', JSON.stringify(testData));
      
      // 触发订阅服务重新检查状态
      // 这里可能需要调用订阅服务的刷新方法
      console.log('🧪 [SubscriptionTestService] 已应用测试数据到订阅服务');
    } catch (error) {
      console.error('[SubscriptionTestService] 应用测试状态失败:', error);
    }
  }

  /**
   * 获取所有可用的测试状态
   */
  getAvailableTestStates(): Array<{state: TestSubscriptionState, label: string, description: string}> {
    return [
      {
        state: 'trial_active',
        label: '试用期激活中',
        description: '用户正在14天试用期内，可以使用所有功能'
      },
      {
        state: 'trial_expired',
        label: '试用期已结束',
        description: '14天试用期已结束，只能使用基础功能（查单词）'
      },
      {
        state: 'premium_monthly',
        label: '付费会员（月度）',
        description: '付费月度会员，可以使用所有功能'
      },
      {
        state: 'premium_yearly',
        label: '付费会员（年度）',
        description: '付费年度会员，可以使用所有功能'
      },
      {
        state: 'free_user',
        label: '免费用户',
        description: '从未试用过的免费用户'
      }
    ];
  }

  /**
   * 模拟试用期到期
   */
  async simulateTrialExpiration(): Promise<void> {
    await this.setTestState('trial_expired');
  }

  /**
   * 模拟购买订阅
   */
  async simulatePurchase(productType: 'monthly' | 'yearly' = 'monthly'): Promise<void> {
    const state = productType === 'monthly' ? 'premium_monthly' : 'premium_yearly';
    await this.setTestState(state);
  }

  /**
   * 重置到试用期状态
   */
  async resetToTrial(): Promise<void> {
    await this.setTestState('trial_active');
  }
}

export default SubscriptionTestService.getInstance();
