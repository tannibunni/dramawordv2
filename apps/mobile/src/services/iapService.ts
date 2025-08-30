import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  validateReceiptIos,
  validateReceiptAndroid,
  clearProductsIOS,
  clearTransactionIOS,
} from 'react-native-iap';
import { 
  PRODUCT_IDS, 
  ProductId, 
  Product, 
  PurchaseResult, 
  SubscriptionStatus 
} from '../types/subscription';

// 模拟产品数据（开发阶段使用）
const MOCK_PRODUCTS: Product[] = [
  {
    id: PRODUCT_IDS.MONTHLY,
    title: '月度订阅',
    description: '首月特价，后续$3.99/月',
    price: '$2.99',
    priceAmount: 2.99,
    currency: 'USD',
    type: 'subscription',
    subscriptionPeriod: 'P1M',
  },
  {
    id: PRODUCT_IDS.QUARTERLY,
    title: '季度订阅',
    description: '月均$3.66，节省8%',
    price: '$10.99',
    priceAmount: 10.99,
    currency: 'USD',
    type: 'subscription',
    subscriptionPeriod: 'P3M',
  },
  {
    id: PRODUCT_IDS.YEARLY,
    title: '年度订阅',
    description: '月均$3.00，节省25%',
    price: '$35.99',
    priceAmount: 35.99,
    currency: 'USD',
    type: 'subscription',
    subscriptionPeriod: 'P1Y',
  },
];

class IAPService {
  private static instance: IAPService;
  private isInitialized: boolean = false;
  private products: Product[] = [];
  private subscriptionStatus: SubscriptionStatus = {
    isActive: false,
  };
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  private constructor() {}

  public static getInstance(): IAPService {
    if (!IAPService.instance) {
      IAPService.instance = new IAPService();
    }
    return IAPService.instance;
  }

  /**
   * 初始化IAP服务
   */
  public async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      // 检查环境配置
      const isDevelopment = __DEV__ || process.env.EXPO_PUBLIC_ENVIRONMENT === 'development';
      const useSandbox = process.env.EXPO_PUBLIC_IAP_SANDBOX === 'true';
      
      if (isDevelopment && useSandbox) {
        console.log('[IAPService] 🧪 开发环境 - 使用沙盒模式');
        
        // 开发环境：先尝试沙盒模式，失败后使用模拟模式
        try {
          // 初始化连接
          await initConnection();
          console.log('[IAPService] ✅ IAP连接已建立');
          
          // 设置购买监听器
          this.setupPurchaseListeners();
          
          // 尝试获取真实产品信息
          await this.loadRealProducts();
          
          // 加载订阅状态
          await this.loadSubscriptionStatus();
          
          // 恢复购买
          await this.restorePurchasesPrivate();
          
          this.isInitialized = true;
          console.log('[IAPService] ✅ 沙盒模式初始化成功');
          return true;
        } catch (sandboxError) {
          console.log('[IAPService] ⚠️ 沙盒模式失败，切换到模拟模式:', sandboxError);
          // 继续执行下面的模拟模式逻辑
        }
      } else if (isDevelopment) {
        console.log('[IAPService] 🚀 开发环境 - 使用真实IAP');
      } else {
        console.log('[IAPService] 🚀 生产环境 - 使用真实IAP');
      }

      // 如果沙盒模式失败或不是沙盒环境，使用模拟模式
      console.log('[IAPService] 🎭 使用模拟模式进行测试');
      
      // 设置模拟产品
      this.products = MOCK_PRODUCTS;
      await this.loadSubscriptionStatus();
      this.isInitialized = true;
      
      console.log('[IAPService] ✅ 模拟模式初始化完成');
      return false; // 表示使用了模拟模式
    } catch (error) {
      console.error('[IAPService] ❌ 所有初始化方式都失败:', error);
      
      // 最后的备用方案：使用模拟产品
      this.products = MOCK_PRODUCTS;
      await this.loadSubscriptionStatus();
      this.isInitialized = true;
      
      return false; // 表示使用了备用模式
    }
  }

  /**
   * 设置购买监听器
   */
  private setupPurchaseListeners(): void {
    this.purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
      console.log('[IAPService] 📦 收到购买更新:', purchase);
      
      const receipt = purchase.transactionReceipt;
      if (receipt) {
        try {
          // 验证收据
          const isValid = await this.validatePurchaseReceipt(purchase);
          
          if (isValid) {
            console.log('[IAPService] ✅ 购买验证成功');
            await this.processPurchase(purchase);
            await finishTransaction({ purchase });
          } else {
            console.error('[IAPService] ❌ 收据验证失败');
          }
        } catch (error) {
          console.error('[IAPService] ❌ 处理购买失败:', error);
        }
      }
    });

    this.purchaseErrorSubscription = purchaseErrorListener((error) => {
      console.error('[IAPService] ❌ 购买错误:', error);
    });
  }

  /**
   * 加载真实产品信息
   */
  private async loadRealProducts(): Promise<void> {
    try {
      console.log('[IAPService] 📱 从App Store获取产品信息...');
      
      const products = await getProducts({
        skus: [
          PRODUCT_IDS.MONTHLY,
          PRODUCT_IDS.QUARTERLY,
          PRODUCT_IDS.YEARLY
        ]
      });

      console.log(`[IAPService] ✅ 获取到 ${products.length} 个产品`);
      
      // 转换为内部Product格式
      this.products = products.map(product => ({
        id: product.productId as ProductId,
        title: product.title,
        description: product.description,
        price: product.localizedPrice,
        priceAmount: parseFloat(product.price) || 0,
        currency: product.currency || 'USD',
        type: 'subscription',
        subscriptionPeriod: this.getSubscriptionPeriod(product.productId)
      }));

      // 打印产品信息
      this.products.forEach(product => {
        console.log(`[IAPService] 产品: ${product.id} - ${product.price} (${product.currency})`);
      });

    } catch (error) {
      console.error('[IAPService] ❌ 获取产品信息失败:', error);
      throw error;
    }
  }

  /**
   * 恢复购买 (私有方法，用于初始化)
   */
  private async restorePurchasesPrivate(): Promise<void> {
    try {
      console.log('[IAPService] 🔄 恢复之前的购买...');
      
      const availablePurchases = await getAvailablePurchases();
      
      if (availablePurchases.length > 0) {
        console.log(`[IAPService] 📦 找到 ${availablePurchases.length} 个有效购买`);
        
        for (const purchase of availablePurchases) {
          await this.processPurchase(purchase);
        }
      } else {
        console.log('[IAPService] 📭 没有找到有效的购买记录');
      }
      
    } catch (error) {
      console.error('[IAPService] ❌ 恢复购买失败:', error);
    }
  }

  /**
   * 获取所有产品信息
   */
  public async getProducts(): Promise<Product[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.products;
  }

  /**
   * 根据ID获取产品信息
   */
  public async getProduct(productId: ProductId): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find(p => p.id === productId) || null;
  }

  /**
   * 购买产品
   */
  public async purchaseProduct(productId: ProductId): Promise<PurchaseResult> {
    try {
      console.log(`[IAPService] 💳 开始购买产品: ${productId}`);

      if (!this.isInitialized) {
        await this.initialize();
      }

      // 检查产品是否存在
      const product = this.products.find(p => p.id === productId);
      if (!product) {
        throw new Error(`产品不存在: ${productId}`);
      }

      console.log(`[IAPService] 🛒 发起购买请求: ${product.title} (${product.price})`);
      
      // 发起购买请求
      const purchase = await requestPurchase({
        sku: productId,
        ...(Platform.OS === 'android' && {
          skus: [productId],
        }),
      });

      console.log('[IAPService] ✅ 购买请求成功:', purchase);
      
      // 处理购买结果
      if (Array.isArray(purchase)) {
        const firstPurchase = purchase[0];
        return {
          success: true,
          productId,
          transactionId: firstPurchase?.transactionId || '',
          receipt: firstPurchase?.transactionReceipt || '',
        };
      } else if (purchase) {
        return {
          success: true,
          productId,
          transactionId: (purchase as any).transactionId || '',
          receipt: (purchase as any).transactionReceipt || '',
        };
      } else {
        throw new Error('购买请求失败');
      }

    } catch (error) {
      console.error('[IAPService] ❌ 购买失败:', error);
      
      // 判断错误类型
      let errorMessage = '购买失败';
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as any).code;
        console.log(`[IAPService] 🔍 错误代码: ${errorCode}`);
        
        if (errorCode === 'E_USER_CANCELLED') {
          errorMessage = '用户取消购买';
        } else if (errorCode === 'E_ALREADY_OWNED') {
          errorMessage = '已拥有此订阅';
        } else if (errorCode === 'E_SERVICE_ERROR') {
          errorMessage = '服务不可用';
        } else if (errorCode === 'E_ITEM_UNAVAILABLE') {
          errorMessage = '商品不可用，请检查沙盒环境';
        } else if (errorCode === 'E_NETWORK_ERROR') {
          errorMessage = '网络错误，请稍后重试';
        } else if (errorCode === 'E_RECEIPT_NOT_VALID') {
          errorMessage = '收据无效';
        } else {
          errorMessage = `购买失败 (${errorCode})`;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 恢复购买 (公共接口)
   */
  public async restorePurchases(): Promise<PurchaseResult[]> {
    try {
      console.log('[IAPService] 开始恢复购买');
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      const availablePurchases = await getAvailablePurchases();
      const results: PurchaseResult[] = [];

      for (const purchase of availablePurchases) {
        // 验证每个购买
        const isValid = await this.validatePurchaseReceipt(purchase);
        
        if (isValid) {
          // 处理有效的购买
          await this.processPurchase(purchase);
          
          results.push({
            success: true,
            productId: purchase.productId as ProductId,
            transactionId: purchase.transactionId,
            receipt: purchase.transactionReceipt,
          });
        }
      }

      console.log(`[IAPService] ✅ 恢复了 ${results.length} 个有效购买`);
      return results;
    } catch (error) {
      console.error('[IAPService] 恢复购买失败:', error);
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
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // 尝试从后端同步最新的订阅状态
    try {
      await this.syncSubscriptionStatusFromBackend();
    } catch (error) {
      console.warn('[IAPService] 从后端同步订阅状态失败，使用本地状态:', error);
    }
    
    return this.subscriptionStatus;
  }

  /**
   * 从后端同步订阅状态
   */
  private async syncSubscriptionStatusFromBackend(): Promise<void> {
    try {
      const response = await fetch('https://dramawordv2.onrender.com/api/iap/subscription-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.subscription) {
          const backendStatus = data.subscription;
          
          // 更新本地订阅状态
          this.subscriptionStatus = {
            isActive: backendStatus.isActive,
            isTrial: backendStatus.isTrial,
            expiresAt: backendStatus.expiresAt ? new Date(backendStatus.expiresAt) : undefined,
            trialEndsAt: backendStatus.trialEndsAt ? new Date(backendStatus.trialEndsAt) : undefined,
            productId: backendStatus.subscriptionType ? this.mapSubscriptionTypeToProductId(backendStatus.subscriptionType) : undefined
          };

          // 保存到本地存储
          await this.saveSubscriptionStatus(this.subscriptionStatus);
          
          console.log('[IAPService] 从后端同步订阅状态成功:', this.subscriptionStatus);
        }
      } else {
        console.warn('[IAPService] 后端订阅状态查询失败:', response.status);
      }
    } catch (error) {
      console.error('[IAPService] 从后端同步订阅状态异常:', error);
    }
  }

  /**
   * 获取认证token
   */
  private async getAuthToken(): Promise<string> {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        return parsed.token || '';
      }
      return '';
    } catch (error) {
      console.error('[IAPService] 获取认证token失败:', error);
      return '';
    }
  }

  /**
   * 将订阅类型映射到产品ID
   */
  private mapSubscriptionTypeToProductId(subscriptionType: string): ProductId | undefined {
    switch (subscriptionType) {
      case 'monthly':
        return 'com.tannibunni.dramawordmobile.premium_monthly';
      case 'yearly':
        return 'com.tannibunni.dramawordmobile.premium_yearly';
      case 'quarterly':
        return 'com.tannibunni.dramawordmobile.premium_quarterly';
      default:
        return undefined;
    }
  }

  /**
   * 验证收据
   */
  public async validateReceipt(receipt: string): Promise<boolean> {
    try {
      // TODO: 实现收据验证逻辑
      // 这里需要与苹果服务器或自己的后端验证收据
      console.log('[IAPService] 收据验证:', receipt);
      return true;
    } catch (error) {
      console.error('[IAPService] 收据验证失败:', error);
      return false;
    }
  }

  /**
   * 获取当前订阅状态
   */
  public getCurrentSubscriptionStatus(): SubscriptionStatus {
    return this.subscriptionStatus;
  }

  /**
   * 检查功能访问权限
   */
  public canAccessFeature(feature: string): boolean {
    // 如果用户已订阅，可以访问所有功能
    if (this.subscriptionStatus.isActive) {
      return true;
    }

    // 检查是否在14天试用期内
    if (this.isInTrialPeriod()) {
      return true; // 试用期内可以访问所有功能
    }

    // 试用期结束后，免费用户只能访问基础查词功能
    const basicFeatures = ['basic_word_lookup', 'chinese_english'];
    return basicFeatures.includes(feature);
  }

  /**
   * 检查是否在14天试用期内
   */
  private isInTrialPeriod(): boolean {
    if (!this.subscriptionStatus.isTrial || !this.subscriptionStatus.trialEndsAt) {
      return false;
    }

    const now = new Date();
    const trialEnd = new Date(this.subscriptionStatus.trialEndsAt);
    
    return now < trialEnd;
  }

  /**
   * 检查语言支持
   */
  public canAccessLanguage(language: string): boolean {
    // 如果用户已订阅，可以访问所有语言
    if (this.subscriptionStatus.isActive) {
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

  // ==================== 私有方法 ====================

  /**
   * 加载订阅状态
   */
  private async loadSubscriptionStatus(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('subscription_status');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.subscriptionStatus = {
          ...parsed,
          expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
          trialEndsAt: parsed.trialEndsAt ? new Date(parsed.trialEndsAt) : undefined,
        };
      } else {
        // 如果没有存储的状态，为新用户自动启动14天试用期
        const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14天后，使用毫秒计算

        this.subscriptionStatus = {
          isActive: false,
          isTrial: true,
          trialEndsAt,
          trialStartedAt: new Date(),
        };

        // 保存新的试用期状态
        await this.saveSubscriptionStatus(this.subscriptionStatus);
        console.log('[IAPService] 新用户自动启动14天试用期，到期时间:', trialEndsAt);
      }
      
      console.log('[IAPService] 加载订阅状态:', this.subscriptionStatus);
    } catch (error) {
      console.error('[IAPService] 加载订阅状态失败:', error);
      // 错误时为新用户启动试用期
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      this.subscriptionStatus = {
        isActive: false,
        isTrial: true,
        trialEndsAt,
        trialStartedAt: new Date(),
      };

      try {
        await this.saveSubscriptionStatus(this.subscriptionStatus);
        console.log('[IAPService] 错误恢复：为用户启动14天试用期');
      } catch (saveError) {
        console.error('[IAPService] 保存试用期状态失败:', saveError);
      }
    }
  }

  /**
   * 保存订阅状态
   */
  private async saveSubscriptionStatus(status: SubscriptionStatus): Promise<void> {
    try {
      this.subscriptionStatus = status;
      await AsyncStorage.setItem('subscription_status', JSON.stringify(status));
    } catch (error) {
      console.error('[IAPService] 保存订阅状态失败:', error);
    }
  }

  /**
   * 模拟购买流程（开发阶段使用）
   */
  private async mockPurchase(productId: ProductId): Promise<PurchaseResult> {
    return new Promise((resolve) => {
      // 模拟网络延迟
      setTimeout(async () => {
        try {
          // 生成模拟交易ID
          const transactionId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // 更新订阅状态
          const newStatus: SubscriptionStatus = {
            isActive: true,
            productId,
            expiresAt: this.calculateExpiryDate(productId),
            isTrial: false,
          };
          
          await this.saveSubscriptionStatus(newStatus);
          
          console.log(`[IAPService] 模拟购买成功: ${productId}`);
          
          resolve({
            success: true,
            productId,
            transactionId,
            receipt: `mock_receipt_${transactionId}`,
          });
        } catch (error) {
          resolve({
            success: false,
            error: '模拟购买失败',
          });
        }
      }, 1000);
    });
  }

  /**
   * 模拟恢复购买（开发阶段使用）
   */
  private async mockRestorePurchases(): Promise<PurchaseResult[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.subscriptionStatus.isActive) {
          resolve([{
            success: true,
            productId: this.subscriptionStatus.productId,
            transactionId: 'mock_restored',
          }]);
        } else {
          resolve([{
            success: false,
            error: '没有可恢复的购买',
          }]);
        }
      }, 500);
    });
  }

  /**
   * 计算订阅到期时间
   */
  private calculateExpiryDate(productId: ProductId): Date {
    const now = new Date();
    
    switch (productId) {
      case PRODUCT_IDS.MONTHLY:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天
      case PRODUCT_IDS.QUARTERLY:
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90天
      case PRODUCT_IDS.YEARLY:
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365天
      default:
        return now;
    }
  }

  /**
   * 验证购买收据
   */
  private async validatePurchaseReceipt(purchase: any): Promise<boolean> {
    try {
      console.log('[IAPService] 🔍 验证收据...');
      
      if (Platform.OS === 'ios') {
        // iOS收据验证 - 先发送到我们的后端验证
        const response = await fetch('https://dramawordv2.onrender.com/api/iap/validate-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            receipt: purchase.transactionReceipt,
            bundleId: 'com.tannibunni.dramawordmobile'
          }),
        });
        
        const result = await response.json();
        return result.success;
        
      } else if (Platform.OS === 'android') {
        // Android收据验证
        const result = await validateReceiptAndroid({
          packageName: purchase.packageNameAndroid,
          productId: purchase.productId,
          productToken: purchase.purchaseToken,
          accessToken: '', // 需要配置Google Play凭据
        });
        
        return Boolean(result) && result.isValid !== false;
      }
      
      return false;
      
    } catch (error) {
      console.error('[IAPService] ❌ 收据验证失败:', error);
      
      // 在开发环境中，允许跳过验证
      if (__DEV__) {
        console.warn('[IAPService] ⚠️ 开发环境跳过收据验证');
        return true;
      }
      
      return false;
    }
  }

  /**
   * 处理购买
   */
  private async processPurchase(purchase: any): Promise<void> {
    try {
      console.log('[IAPService] ⚙️ 处理购买:', purchase.productId);
      
      // 验证收据并更新后端订阅状态
      const isValid = await this.validatePurchaseReceipt(purchase);
      if (isValid) {
        console.log('[IAPService] ✅ 收据验证成功，从后端同步订阅状态');
        
        // 从后端同步最新的订阅状态
        await this.syncSubscriptionStatusFromBackend();
        
        console.log('[IAPService] ✅ 订阅状态已从后端同步');
      } else {
        console.warn('[IAPService] ⚠️ 收据验证失败，使用本地状态');
        
        // 如果验证失败，仍然更新本地状态（开发环境）
        this.subscriptionStatus = {
          isActive: true,
          productId: purchase.productId as ProductId,
          isTrial: false,
        };
        
        // 保存到本地存储
        await this.saveSubscriptionStatus(this.subscriptionStatus);
      }
      
    } catch (error) {
      console.error('[IAPService] ❌ 处理购买失败:', error);
    }
  }

  /**
   * 获取订阅周期
   */
  private getSubscriptionPeriod(productId: string): string {
    switch (productId) {
      case PRODUCT_IDS.MONTHLY:
        return 'P1M';
      case PRODUCT_IDS.QUARTERLY:
        return 'P3M';  
      case PRODUCT_IDS.YEARLY:
        return 'P1Y';
      default:
        return 'P1M';
    }
  }

  /**
   * 销毁服务
   */
  public async destroy(): Promise<void> {
    try {
      // 移除监听器
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }
      
      // 断开连接
      await endConnection();
      
      this.isInitialized = false;
      console.log('[IAPService] 🔌 IAP服务已断开');
      
    } catch (error) {
      console.error('[IAPService] ❌ 销毁IAP服务失败:', error);
    }
  }
}

// 导出单例实例
export const iapService = IAPService.getInstance();

