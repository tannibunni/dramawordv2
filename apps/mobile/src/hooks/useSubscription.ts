import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { subscriptionService } from '../services/subscriptionService';
import { SubscriptionStatus, ProductId } from '../types/subscription';

export const useSubscription = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化订阅状态
  useEffect(() => {
    const initializeSubscription = async () => {
      try {
        setIsLoading(true);
        await subscriptionService.initialize();
        const status = await subscriptionService.checkSubscriptionStatus();
        setSubscriptionStatus(status);
      } catch (error) {
        console.error('[useSubscription] 初始化失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSubscription();

    // 注册状态变化回调
    const unsubscribe = subscriptionService.registerStateCallback((newStatus) => {
      setSubscriptionStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  // 检查功能访问权限
  const canAccessFeature = useCallback((feature: string): boolean => {
    return subscriptionService.canAccessFeature(feature);
  }, []);

  // 检查语言支持
  const canAccessLanguage = useCallback((language: string): boolean => {
    return subscriptionService.canAccessLanguage(language);
  }, []);

  // 显示升级提示
  const showUpgradePrompt = useCallback((feature: string, onUpgrade?: () => void) => {
    const message = subscriptionService.getUpgradePromptMessage(feature);
    
    Alert.alert(
      '功能已锁定',
      message,
      [
        { text: '稍后再说', style: 'cancel' },
        { 
          text: '立即升级', 
          style: 'default',
          onPress: onUpgrade
        }
      ]
    );
  }, []);

  // 检查是否需要显示升级提示
  const shouldShowUpgradePrompt = useCallback((feature: string): boolean => {
    return subscriptionService.shouldShowUpgradePrompt(feature);
  }, []);

  // 获取功能权限列表
  const getFeaturePermissions = useCallback(() => {
    return subscriptionService.getFeaturePermissions();
  }, []);

  // 获取免费版功能说明
  const getFreeVersionFeatures = useCallback(() => {
    return subscriptionService.getFreeVersionFeatures();
  }, []);

  // 获取高级版功能说明
  const getPremiumFeatures = useCallback(() => {
    return subscriptionService.getPremiumFeatures();
  }, []);

  // 订阅产品
  const subscribeToPlan = useCallback(async (productId: ProductId) => {
    try {
      setIsLoading(true);
      const result = await subscriptionService.subscribeToPlan(productId);
      return result;
    } catch (error) {
      console.error('[useSubscription] 订阅失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '订阅失败',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 恢复购买
  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      const results = await subscriptionService.restorePurchases();
      return results;
    } catch (error) {
      console.error('[useSubscription] 恢复购买失败:', error);
      return [{
        success: false,
        error: error instanceof Error ? error.message : '恢复购买失败',
      }];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 检查订阅状态
  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const status = await subscriptionService.checkSubscriptionStatus();
      setSubscriptionStatus(status);
      return status;
    } catch (error) {
      console.error('[useSubscription] 检查订阅状态失败:', error);
      return null;
    }
  }, []);

  return {
    // 状态
    subscriptionStatus,
    isLoading,
    isSubscribed: subscriptionStatus?.isActive || false,
    
    // 权限检查
    canAccessFeature,
    canAccessLanguage,
    shouldShowUpgradePrompt,
    
    // 功能信息
    getFeaturePermissions,
    getFreeVersionFeatures,
    getPremiumFeatures,
    
    // 升级提示
    showUpgradePrompt,
    
    // 订阅操作
    subscribeToPlan,
    restorePurchases,
    checkSubscriptionStatus,
  };
};
