// 产品ID配置
export const PRODUCT_IDS = {
  MONTHLY: 'com.tannibunni.dramawordmobile.premium_monthly',
  QUARTERLY: 'com.tannibunni.dramawordmobile.premium_quarterly',
  YEARLY: 'com.tannibunni.dramawordmobile.premium_yearly',
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

// 产品信息接口
export interface Product {
  id: ProductId;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
  type: 'subscription' | 'non_consumable';
  subscriptionPeriod?: string;
}

// 购买结果接口
export interface PurchaseResult {
  success: boolean;
  productId?: ProductId;
  transactionId?: string;
  error?: string;
  receipt?: string;
}

// 订阅状态接口
export interface SubscriptionStatus {
  isActive: boolean;
  productId?: ProductId;
  expiresAt?: Date;
  isTrial?: boolean;
  trialEndsAt?: Date;
  trialStartedAt?: Date;
}

// 订阅计划类型
export interface SubscriptionPlan {
  id: ProductId;
  name: string;
  price: string;
  description: string;
  isRecommended?: boolean;
  isPopular?: boolean;
  savings?: string;
  originalPrice?: string;
}

// 功能权限接口
export interface FeaturePermission {
  feature: string;
  isAccessible: boolean;
  requiresSubscription: boolean;
  message?: string;
  freeTierAccess?: 'full' | 'limited' | 'none'; // 免费版本访问级别
}

// 功能定义
export const FEATURES = {
  BASIC_WORD_LOOKUP: 'basic_word_lookup', // 基础单词查询（中英文）
  ADVANCED_WORD_LOOKUP: 'advanced_word_lookup', // 高级单词查询（多语言）
  WORD_STORAGE: 'word_storage', // 单词本功能
  SHOW_MANAGEMENT: 'show_management', // 剧单管理
  REVIEW_SYSTEM: 'review_system', // 复习系统
  LEARNING_STATS: 'learning_stats', // 学习统计
  AI_INTERPRETATION: 'ai_interpretation', // AI智能释义
  OFFLINE_LEARNING: 'offline_learning', // 离线学习
  MULTI_DEVICE_SYNC: 'multi_device_sync', // 多设备同步
} as const;

export type Feature = typeof FEATURES[keyof typeof FEATURES];

// 订阅状态变化回调
export type SubscriptionStateCallback = (status: SubscriptionStatus) => void;

import { t, AppLanguage } from '../constants/translations';

// 订阅计划配置（原始数据）
const SUBSCRIPTION_PLANS_DATA: Array<{
  id: ProductId;
  name: string;
  price: string;
  priceUnit: string;
  description: string;
  isRecommended?: boolean;
  isPopular?: boolean;
  introPrice?: string;
}> = [
  {
    id: 'com.tannibunni.dramawordmobile.premium_monthly' as ProductId,
    name: 'monthly_subscription',
    price: '$3.99',
    priceUnit: 'per_month',
    description: 'most_flexible_choice,cancel_anytime',
    introPrice: '$2.99',
  },
  {
    id: 'com.tannibunni.dramawordmobile.premium_quarterly' as ProductId,
    name: 'quarterly_subscription',
    price: '$10.99',
    priceUnit: 'per_quarter',
    description: 'balanced_choice,save_8_percent',
    isRecommended: true,
  },
  {
    id: 'com.tannibunni.dramawordmobile.premium_yearly' as ProductId,
    name: 'yearly_subscription',
    price: '$35.99',
    priceUnit: 'per_year',
    description: 'save_amount:$12.89,most_cost_effective',
    isPopular: true,
  },
];

// 获取翻译后的订阅计划
export const getTranslatedSubscriptionPlans = (language: AppLanguage = 'zh-CN'): SubscriptionPlan[] => {
  return SUBSCRIPTION_PLANS_DATA.map(plan => {
    let description = '';
    const descParts = plan.description.split(',');
    
    if (plan.id === 'com.tannibunni.dramawordmobile.premium_monthly') {
      description = `${t('most_flexible_choice', language)}，${t('cancel_anytime', language)}`;
    } else if (plan.id === 'com.tannibunni.dramawordmobile.premium_quarterly') {
      description = `${t('balanced_choice', language)}，$3.66/month，${t('save_8_percent', language)}`;
    } else if (plan.id === 'com.tannibunni.dramawordmobile.premium_yearly') {
      description = `${t('save_amount', language, { amount: '$12.89' })}，$3.00/month，25% Off，${t('most_cost_effective', language)}`;
    }
    
    return {
      ...plan,
      name: t(plan.name as any, language),
      price: plan.priceUnit ? `${plan.price}${t(plan.priceUnit as any, language)}` : plan.price,
      description
    };
  });
};

// 保持向后兼容性
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = getTranslatedSubscriptionPlans();
