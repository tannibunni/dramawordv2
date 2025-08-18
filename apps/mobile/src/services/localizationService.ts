import { NativeModules, Platform } from 'react-native';
import { getProducts } from 'react-native-iap';
import { PRODUCT_IDS, ProductId } from '../types/subscription';

// 本地化产品信息接口
export interface LocalizedProduct {
  productId: ProductId;
  price: string; // 本地化价格字符串，如 "¥25.00"
  priceAmount: number; // 数字价格
  currency: string; // 货币代码，如 "CNY", "USD"
  title: string;
  description: string;
  introductoryPrice?: string; // 介绍性价格
}

// 注意：不再使用硬编码价格，完全依赖 App Store Connect 的价格配置

class LocalizationService {
  private static instance: LocalizationService;
  private currentRegion: string = 'US';
  private localizedProducts: LocalizedProduct[] = [];

  static getInstance(): LocalizationService {
    if (!LocalizationService.instance) {
      LocalizationService.instance = new LocalizationService();
    }
    return LocalizationService.instance;
  }

  constructor() {
    this.detectRegion();
  }

  /**
   * 检测用户地区
   */
  private async detectRegion() {
    try {
      // 方法1: 从设备获取地区设置
      if (Platform.OS === 'ios') {
        const locale = NativeModules.SettingsManager?.settings?.AppleLocale || 
                      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 'en_US';
        
        if (locale.includes('CN') || locale.includes('zh_Hans')) {
          this.currentRegion = 'CN';
        } else if (locale.includes('GB')) {
          this.currentRegion = 'GB';
        } else if (locale.includes('JP')) {
          this.currentRegion = 'JP';
        } else if (locale.includes('EU') || locale.includes('DE') || locale.includes('FR')) {
          this.currentRegion = 'EU';
        } else {
          this.currentRegion = 'US';
        }
      }

      console.log(`[LocalizationService] 检测到地区: ${this.currentRegion}`);
    } catch (error) {
      console.warn('[LocalizationService] 地区检测失败，使用默认地区 US', error);
      this.currentRegion = 'US';
    }
  }

  /**
   * 获取本地化产品列表
   */
  async getLocalizedProducts(): Promise<LocalizedProduct[]> {
    try {
      console.log('[LocalizationService] 从 App Store Connect 获取价格...');
      
      // 从 Apple App Store 获取真实价格
      const iapProducts = await getProducts({
        skus: [
          PRODUCT_IDS.MONTHLY,
          PRODUCT_IDS.QUARTERLY,
          PRODUCT_IDS.YEARLY
        ]
      });

      if (iapProducts.length > 0) {
        console.log(`[LocalizationService] ✅ 成功获取 ${iapProducts.length} 个 App Store 产品`);
        iapProducts.forEach(product => {
          console.log(`[LocalizationService] 产品: ${product.productId}, 价格: ${product.localizedPrice}, 货币: ${product.currency}`);
        });
        return this.parseIAPProducts(iapProducts);
      } else {
        console.warn('[LocalizationService] ⚠️ App Store 返回了空产品列表');
      }
    } catch (error) {
      console.error('[LocalizationService] ❌ App Store 获取失败:', error);
    }

    // 仅在 App Store 完全不可用时使用备用定价
    console.log('[LocalizationService] 🔄 使用最小备用定价 (仅开发阶段)');
    return this.getMinimalFallbackProducts();
  }

  /**
   * 解析 IAP 产品数据
   */
  private parseIAPProducts(iapProducts: any[]): LocalizedProduct[] {
    return iapProducts.map(product => {
      // 处理介绍性价格 (首月优惠)
      let introductoryPrice = null;
      if (product.introductoryPrice) {
        introductoryPrice = product.introductoryPricePaymentMode === 'FREETRIAL' 
          ? 'Free Trial' 
          : product.introductoryPriceSubscriptionPeriod || product.introductoryPrice;
      }

      // 获取本地化的标题和描述
      const localizedTitle = this.getLocalizedTitle(product.productId, product.title);
      const localizedDescription = this.getLocalizedDescription(product.productId, product.description);

      console.log(`[LocalizationService] 解析产品: ${product.productId}`);
      console.log(`[LocalizationService] - 价格: ${product.localizedPrice}`);
      console.log(`[LocalizationService] - 介绍价格: ${introductoryPrice}`);
      console.log(`[LocalizationService] - 货币: ${product.currency}`);

      return {
        productId: product.productId as ProductId,
        price: product.localizedPrice,
        priceAmount: parseFloat(product.price) || 0,
        currency: product.currency || 'USD',
        title: localizedTitle,
        description: localizedDescription,
        introductoryPrice
      };
    });
  }

  /**
   * 获取本地化标题
   */
  private getLocalizedTitle(productId: string, fallbackTitle: string): string {
    const isChinese = this.currentRegion === 'CN';
    
    switch (productId) {
      case PRODUCT_IDS.MONTHLY:
        return isChinese ? '月度订阅' : 'Monthly Subscription';
      case PRODUCT_IDS.QUARTERLY:
        return isChinese ? '季度订阅' : 'Quarterly Subscription';
      case PRODUCT_IDS.YEARLY:
        return isChinese ? '年度订阅' : 'Yearly Subscription';
      default:
        return fallbackTitle;
    }
  }

  /**
   * 获取本地化描述
   */
  private getLocalizedDescription(productId: string, fallbackDescription: string): string {
    const isChinese = this.currentRegion === 'CN';
    
    switch (productId) {
      case PRODUCT_IDS.MONTHLY:
        return isChinese ? '最灵活的选择，随时可取消' : 'Most flexible choice, cancel anytime';
      case PRODUCT_IDS.QUARTERLY:
        return isChinese ? '平衡选择，节省8%' : 'Balanced choice, save 8%';
      case PRODUCT_IDS.YEARLY:
        return isChinese ? '最划算的选择，节省25%' : 'Most cost-effective, save 25%';
      default:
        return fallbackDescription;
    }
  }

  /**
   * 获取最小备用产品定价 (仅开发环境)
   */
  private getMinimalFallbackProducts(): LocalizedProduct[] {
    console.warn('[LocalizationService] ⚠️ 使用最小备用定价，请确保在生产环境中App Store Connect配置正确');
    
    return [
      {
        productId: PRODUCT_IDS.MONTHLY,
        price: '$3.99',
        priceAmount: 3.99,
        currency: 'USD',
        title: 'Monthly Subscription',
        description: 'Monthly plan with first month discount',
        introductoryPrice: '$2.99'
      },
      {
        productId: PRODUCT_IDS.QUARTERLY,
        price: '$10.99',
        priceAmount: 10.99,
        currency: 'USD',
        title: 'Quarterly Subscription',
        description: 'Save 8% with quarterly plan'
      },
      {
        productId: PRODUCT_IDS.YEARLY,
        price: '$35.99',
        priceAmount: 35.99,
        currency: 'USD',
        title: 'Yearly Subscription',
        description: 'Save 25% with yearly plan'
      }
    ];
  }

  /**
   * 获取当前地区
   */
  getCurrentRegion(): string {
    return this.currentRegion;
  }

  /**
   * 获取货币符号 (从实际产品数据中获取)
   */
  getCurrencySymbol(currency?: string): string {
    if (currency) {
      const symbols: Record<string, string> = {
        'USD': '$',
        'CNY': '¥',
        'EUR': '€',
        'JPY': '¥',
        'GBP': '£',
        'CAD': 'C$',
        'AUD': 'A$',
        'KRW': '₩',
        'HKD': 'HK$',
        'SGD': 'S$',
      };
      return symbols[currency] || currency;
    }
    return '$'; // 默认
  }

  /**
   * 获取货币代码 (从实际产品数据中获取)
   */
  getCurrencyCode(localizedProducts?: LocalizedProduct[]): string {
    if (localizedProducts && localizedProducts.length > 0) {
      return localizedProducts[0].currency;
    }
    return 'USD'; // 默认
  }

  /**
   * 格式化价格显示
   */
  formatPrice(amount: number, currency?: string): string {
    const currencyCode = currency || 'USD';
    const symbol = this.getCurrencySymbol(currencyCode);
    
    // 对于某些货币，去掉小数点
    if (currencyCode === 'JPY' || currencyCode === 'KRW') {
      return `${symbol}${Math.round(amount)}`;
    }
    
    return `${symbol}${amount.toFixed(2)}`;
  }
}

export const localizationService = LocalizationService.getInstance();
