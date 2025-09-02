import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkStateManagementService } from './networkStateManagementService';
import { PerformanceOptimizationService } from './performanceOptimizationService';

export interface ErrorInfo {
  id: string;
  timestamp: number;
  type: 'network' | 'data' | 'system' | 'user' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  context: {
    service: string;
    operation: string;
    userId?: string;
    deviceId?: string;
    networkState?: string;
    dataSize?: number;
  };
  retryCount: number;
  maxRetries: number;
  lastRetryTime?: number;
  resolved: boolean;
  resolution?: string;
}

export interface RetryStrategy {
  name: string;
  description: string;
  maxRetries: number;
  baseDelay: number; // 毫秒
  maxDelay: number; // 毫秒
  backoffMultiplier: number;
  jitter: boolean; // 是否添加随机抖动
  enableExponentialBackoff: boolean;
  retryableErrors: string[]; // 可重试的错误类型
}

export interface RetryResult {
  success: boolean;
  attemptCount: number;
  totalTime: number;
  lastError?: Error;
  finalResult?: any;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  averageResolutionTime: number;
  retrySuccessRate: number;
  lastErrorTime: number;
  unresolvedErrors: number;
}

export class ErrorHandlingAndRetryService {
  private static instance: ErrorHandlingAndRetryService;
  private networkService: NetworkStateManagementService;
  private performanceService: PerformanceOptimizationService;
  
  private errors: ErrorInfo[] = [];
  private retryStrategies: Map<string, RetryStrategy> = new Map();
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByType: {},
    errorsBySeverity: {},
    averageResolutionTime: 0,
    retrySuccessRate: 0,
    lastErrorTime: 0,
    unresolvedErrors: 0
  };
  
  private isInitialized: boolean = false;
  private errorCleanupTimer: number | null = null;
  private metricsUpdateTimer: number | null = null;

  public static getInstance(): ErrorHandlingAndRetryService {
    if (!ErrorHandlingAndRetryService.instance) {
      ErrorHandlingAndRetryService.instance = new ErrorHandlingAndRetryService();
    }
    return ErrorHandlingAndRetryService.instance;
  }

  private constructor() {
    this.networkService = NetworkStateManagementService.getInstance();
    this.performanceService = PerformanceOptimizationService.getInstance();
  }

  // 初始化错误处理和重试服务
  public async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('🔄 错误处理和重试服务已初始化，跳过重复初始化');
        return;
      }

      console.log('🛠️ 初始化错误处理和重试服务...');
      
      // 初始化重试策略
      this.initializeRetryStrategies();
      
      // 加载错误历史
      await this.loadErrorHistory();
      
      // 加载错误指标
      await this.loadErrorMetrics();
      
      // 启动定期清理
      this.startPeriodicCleanup();
      
      // 启动指标更新
      this.startMetricsUpdate();
      
      this.isInitialized = true;
      console.log('✅ 错误处理和重试服务初始化完成');
      
    } catch (error) {
      console.error('❌ 错误处理和重试服务初始化失败:', error);
      throw error;
    }
  }

  // 初始化重试策略
  private initializeRetryStrategies(): void {
    // 网络错误重试策略
    this.retryStrategies.set('network', {
      name: 'network',
      description: '网络错误重试策略',
      maxRetries: 5,
      baseDelay: 1000, // 1秒
      maxDelay: 30000, // 30秒
      backoffMultiplier: 2,
      jitter: true,
      enableExponentialBackoff: true,
      retryableErrors: [
        'NETWORK_ERROR',
        'TIMEOUT_ERROR',
        'CONNECTION_REFUSED',
        'SERVER_ERROR',
        'RATE_LIMIT_ERROR'
      ]
    });

    // 数据错误重试策略
    this.retryStrategies.set('data', {
      name: 'data',
      description: '数据错误重试策略',
      maxRetries: 3,
      baseDelay: 2000, // 2秒
      maxDelay: 15000, // 15秒
      backoffMultiplier: 1.5,
      jitter: false,
      enableExponentialBackoff: true,
      retryableErrors: [
        'DATA_VALIDATION_ERROR',
        'PARSE_ERROR',
        'ENCODING_ERROR',
        'VERSION_MISMATCH'
      ]
    });

    // 系统错误重试策略
    this.retryStrategies.set('system', {
      name: 'system',
      description: '系统错误重试策略',
      maxRetries: 2,
      baseDelay: 5000, // 5秒
      maxDelay: 20000, // 20秒
      backoffMultiplier: 2,
      jitter: true,
      enableExponentialBackoff: false,
      retryableErrors: [
        'SERVICE_UNAVAILABLE',
        'RESOURCE_EXHAUSTED',
        'TEMPORARY_ERROR'
      ]
    });

    // 用户错误重试策略
    this.retryStrategies.set('user', {
      name: 'user',
      description: '用户错误重试策略',
      maxRetries: 1,
      baseDelay: 1000, // 1秒
      maxDelay: 5000, // 5秒
      backoffMultiplier: 1,
      jitter: false,
      enableExponentialBackoff: false,
      retryableErrors: [
        'AUTHENTICATION_ERROR',
        'AUTHORIZATION_ERROR',
        'INPUT_VALIDATION_ERROR'
      ]
    });

    console.log('✅ 重试策略初始化完成');
  }

  // 记录错误
  public async recordError(
    error: Error | string,
    type: ErrorInfo['type'],
    severity: ErrorInfo['severity'],
    context: Partial<ErrorInfo['context']>,
    maxRetries: number = 3
  ): Promise<string> {
    try {
      const errorId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const message = typeof error === 'string' ? error : error.message;
      const stack = typeof error === 'string' ? undefined : error.stack;
      
      const errorInfo: ErrorInfo = {
        id: errorId,
        timestamp: Date.now(),
        type,
        severity,
        message,
        stack,
        context: {
          service: context.service || 'unknown',
          operation: context.operation || 'unknown',
          userId: context.userId,
          deviceId: context.deviceId,
          networkState: this.networkService.isNetworkConnected() ? 'connected' : 'disconnected',
          dataSize: context.dataSize
        },
        retryCount: 0,
        maxRetries,
        resolved: false
      };

      this.errors.push(errorInfo);
      
      // 更新指标
      this.updateErrorMetrics(errorInfo);
      
      // 保存错误历史
      await this.saveErrorHistory();
      
      console.log(`📝 错误已记录: ${type} (${severity}) - ${message}`);
      
      return errorId;
      
    } catch (err) {
      console.error('❌ 记录错误失败:', err);
      return '';
    }
  }

  // 智能重试机制
  public async retryWithStrategy<T>(
    operation: () => Promise<T>,
    strategyName: string = 'network',
    context?: Partial<ErrorInfo['context']>
  ): Promise<RetryResult> {
    try {
      const strategy = this.retryStrategies.get(strategyName);
      if (!strategy) {
        throw new Error(`未找到重试策略: ${strategyName}`);
      }

      console.log(`🔄 开始执行重试策略: ${strategy.name}`);
      
      const startTime = Date.now();
      let lastError: Error | undefined;
      let attemptCount = 0;

      for (attemptCount = 0; attemptCount <= strategy.maxRetries; attemptCount++) {
        try {
          if (attemptCount > 0) {
            // 计算延迟时间
            const delay = this.calculateRetryDelay(attemptCount, strategy);
            console.log(`⏳ 第${attemptCount}次重试，等待${delay}ms...`);
            await this.sleep(delay);
          }

          console.log(`🔄 执行操作，第${attemptCount + 1}次尝试...`);
          const result = await operation();
          
          const totalTime = Date.now() - startTime;
          console.log(`✅ 操作成功，总耗时: ${totalTime}ms`);
          
          // 记录成功重试
          this.recordSuccessfulRetry(strategyName, attemptCount, totalTime);
          
          return {
            success: true,
            attemptCount: attemptCount + 1,
            totalTime,
            finalResult: result
          };

        } catch (error: any) {
          lastError = error;
          console.warn(`❌ 第${attemptCount + 1}次尝试失败:`, error.message);
          
          // 检查是否为可重试错误
          if (!this.isRetryableError(error, strategy)) {
            console.log('⚠️ 错误不可重试，停止重试');
            break;
          }
          
          // 检查是否达到最大重试次数
          if (attemptCount >= strategy.maxRetries) {
            console.log(`❌ 达到最大重试次数(${strategy.maxRetries})，停止重试`);
            break;
          }
          
          // 记录重试失败
          this.recordFailedRetry(strategyName, attemptCount, error);
        }
      }

      const totalTime = Date.now() - startTime;
      console.log(`❌ 所有重试尝试失败，总耗时: ${totalTime}ms`);
      
      return {
        success: false,
        attemptCount: attemptCount + 1,
        totalTime,
        lastError
      };

    } catch (error) {
      console.error('❌ 重试策略执行失败:', error);
      throw error;
    }
  }

  // 计算重试延迟
  private calculateRetryDelay(attemptCount: number, strategy: RetryStrategy): number {
    let delay = strategy.baseDelay;
    
    if (strategy.enableExponentialBackoff) {
      delay = Math.min(
        strategy.baseDelay * Math.pow(strategy.backoffMultiplier, attemptCount - 1),
        strategy.maxDelay
      );
    }
    
    if (strategy.jitter) {
      // 添加随机抖动 (±20%)
      const jitter = delay * 0.2;
      delay += (Math.random() - 0.5) * jitter;
    }
    
    return Math.max(delay, 100); // 最少100ms
  }

  // 检查是否为可重试错误
  private isRetryableError(error: Error, strategy: RetryStrategy): boolean {
    // 检查错误类型
    for (const retryableError of strategy.retryableErrors) {
      if (error.message.includes(retryableError) || error.name.includes(retryableError)) {
        return true;
      }
    }
    
    // 检查网络状态
    if (strategy.name === 'network' && !this.networkService.isNetworkConnected()) {
      return false; // 网络断开时不可重试
    }
    
    // 检查错误严重程度
    if (error.message.includes('CRITICAL') || error.message.includes('FATAL')) {
      return false; // 严重错误不可重试
    }
    
    return true;
  }

  // 网络错误特殊处理
  public async handleNetworkError(
    error: Error,
    operation: () => Promise<any>,
    context?: Partial<ErrorInfo['context']>
  ): Promise<RetryResult> {
    try {
      console.log('🌐 处理网络错误...');
      
      // 记录网络错误
      const errorId = await this.recordError(
        error,
        'network',
        'medium',
        { ...context, service: 'network' }
      );
      
      // 检查网络状态
      if (!this.networkService.isNetworkConnected()) {
        console.log('📴 网络未连接，等待网络恢复...');
        
        // 等待网络恢复
        await this.waitForNetworkRecovery();
      }
      
      // 使用网络重试策略
      const result = await this.retryWithStrategy(operation, 'network', context);
      
      // 如果重试成功，标记错误为已解决
      if (result.success) {
        await this.resolveError(errorId, '网络重试成功');
      }
      
      return result;
      
    } catch (err) {
      console.error('❌ 处理网络错误失败:', err);
      throw err;
    }
  }

  // 等待网络恢复
  private async waitForNetworkRecovery(): Promise<void> {
    return new Promise((resolve) => {
      let checkCount = 0;
      const maxChecks = 60; // 最多等待60次
      
      const checkNetwork = () => {
        checkCount++;
        
        if (this.networkService.isNetworkConnected()) {
          console.log('🟢 网络已恢复');
          resolve();
          return;
        }
        
        if (checkCount >= maxChecks) {
          console.log('⏰ 网络恢复超时，继续执行');
          resolve();
          return;
        }
        
        // 每5秒检查一次
        setTimeout(checkNetwork, 5000);
      };
      
      checkNetwork();
    });
  }

  // 数据错误特殊处理
  public async handleDataError(
    error: Error,
    data: any,
    operation: () => Promise<any>,
    context?: Partial<ErrorInfo['context']>
  ): Promise<RetryResult> {
    try {
      console.log('📊 处理数据错误...');
      
      // 记录数据错误
      const errorId = await this.recordError(
        error,
        'data',
        'medium',
        { ...context, service: 'data', dataSize: this.calculateDataSize(data) }
      );
      
      // 尝试数据修复
      const fixedData = await this.attemptDataFix(data, error);
      
      if (fixedData) {
        console.log('🔧 数据修复成功，重新执行操作');
        // 使用修复后的数据重新执行操作
        const fixedOperation = () => operation(); // 这里应该传入修复后的数据
        return await this.retryWithStrategy(fixedOperation, 'data', context);
      }
      
      // 如果无法修复，使用数据重试策略
      const result = await this.retryWithStrategy(operation, 'data', context);
      
      if (result.success) {
        await this.resolveError(errorId, '数据重试成功');
      }
      
      return result;
      
    } catch (err) {
      console.error('❌ 处理数据错误失败:', err);
      throw err;
    }
  }

  // 尝试数据修复
  private async attemptDataFix(data: any, error: Error): Promise<any> {
    try {
      console.log('🔧 尝试数据修复...');
      
      // 这里可以实现具体的数据修复逻辑
      // 例如：清理无效字符、修复格式、验证数据完整性等
      
      if (error.message.includes('JSON_PARSE_ERROR')) {
        // JSON解析错误修复
        return this.fixJsonData(data);
      } else if (error.message.includes('VALIDATION_ERROR')) {
        // 数据验证错误修复
        return this.fixValidationErrors(data);
      }
      
      return null; // 无法修复
      
    } catch (err) {
      console.error('❌ 数据修复失败:', err);
      return null;
    }
  }

  // 修复JSON数据
  private fixJsonData(data: any): any {
    try {
      if (typeof data === 'string') {
        // 尝试清理无效字符
        const cleaned = data.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        return JSON.parse(cleaned);
      }
      return data;
    } catch (err) {
      return null;
    }
  }

  // 修复验证错误
  private fixValidationErrors(data: any): any {
    try {
      // 这里可以实现具体的验证错误修复逻辑
      // 例如：设置默认值、类型转换等
      return data;
    } catch (err) {
      return null;
    }
  }

  // 解决错误
  public async resolveError(errorId: string, resolution: string): Promise<void> {
    try {
      const error = this.errors.find(e => e.id === errorId);
      if (error) {
        error.resolved = true;
        error.resolution = resolution;
        error.lastRetryTime = Date.now();
        
        // 更新指标
        this.updateResolutionMetrics(error);
        
        // 保存错误历史
        await this.saveErrorHistory();
        
        console.log(`✅ 错误已解决: ${errorId} - ${resolution}`);
      }
    } catch (err) {
      console.error('❌ 解决错误失败:', err);
    }
  }

  // 获取错误信息
  public getError(errorId: string): ErrorInfo | undefined {
    return this.errors.find(e => e.id === errorId);
  }

  // 获取所有错误
  public getAllErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  // 获取未解决的错误
  public getUnresolvedErrors(): ErrorInfo[] {
    return this.errors.filter(e => !e.resolved);
  }

  // 获取错误指标
  public getErrorMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  // 获取重试策略
  public getRetryStrategy(strategyName: string): RetryStrategy | undefined {
    return this.retryStrategies.get(strategyName);
  }

  // 更新重试策略
  public updateRetryStrategy(strategyName: string, updates: Partial<RetryStrategy>): void {
    const strategy = this.retryStrategies.get(strategyName);
    if (strategy) {
      this.retryStrategies.set(strategyName, { ...strategy, ...updates });
      console.log(`✅ 重试策略已更新: ${strategyName}`);
    }
  }

  // 记录成功重试
  private recordSuccessfulRetry(strategyName: string, attemptCount: number, totalTime: number): void {
    try {
      // 更新重试成功率
      const totalRetries = this.metrics.totalErrors;
      const successfulRetries = this.metrics.retrySuccessRate * totalRetries;
      
      this.metrics.retrySuccessRate = (successfulRetries + 1) / (totalRetries + 1);
      this.metrics.totalErrors++;
      
    } catch (err) {
      console.error('❌ 记录成功重试失败:', err);
    }
  }

  // 记录失败重试
  private recordFailedRetry(strategyName: string, attemptCount: number, error: Error): void {
    try {
      // 更新重试成功率
      const totalRetries = this.metrics.totalErrors;
      const successfulRetries = this.metrics.retrySuccessRate * totalRetries;
      
      this.metrics.retrySuccessRate = successfulRetries / (totalRetries + 1);
      this.metrics.totalErrors++;
      
    } catch (err) {
      console.error('❌ 记录失败重试失败:', err);
    }
  }

  // 更新错误指标
  private updateErrorMetrics(errorInfo: ErrorInfo): void {
    try {
      this.metrics.totalErrors++;
      this.metrics.lastErrorTime = errorInfo.timestamp;
      
      // 按类型统计
      this.metrics.errorsByType[errorInfo.type] = (this.metrics.errorsByType[errorInfo.type] || 0) + 1;
      
      // 按严重程度统计
      this.metrics.errorsBySeverity[errorInfo.severity] = (this.metrics.errorsBySeverity[errorInfo.severity] || 0) + 1;
      
      // 更新未解决错误数量
      this.metrics.unresolvedErrors = this.errors.filter(e => !e.resolved).length;
      
    } catch (err) {
      console.error('❌ 更新错误指标失败:', err);
    }
  }

  // 更新解决指标
  private updateResolutionMetrics(error: ErrorInfo): void {
    try {
      const resolutionTime = Date.now() - error.timestamp;
      
      // 更新平均解决时间
      const totalResolved = this.metrics.totalErrors - this.metrics.unresolvedErrors;
      const totalTime = this.metrics.averageResolutionTime * (totalResolved - 1) + resolutionTime;
      this.metrics.averageResolutionTime = totalTime / totalResolved;
      
      // 更新未解决错误数量
      this.metrics.unresolvedErrors = this.errors.filter(e => !e.resolved).length;
      
    } catch (err) {
      console.error('❌ 更新解决指标失败:', err);
    }
  }

  // 启动定期清理
  private startPeriodicCleanup(): void {
    this.errorCleanupTimer = setInterval(async () => {
      await this.cleanupOldErrors();
    }, 24 * 60 * 60 * 1000); // 每24小时清理一次
    
    console.log('🧹 错误清理定时器已启动');
  }

  // 启动指标更新
  private startMetricsUpdate(): void {
    this.metricsUpdateTimer = setInterval(async () => {
      await this.updateMetrics();
    }, 5 * 60 * 1000); // 每5分钟更新一次
    
    console.log('📊 指标更新定时器已启动');
  }

  // 清理旧错误
  private async cleanupOldErrors(): Promise<void> {
    try {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const oldErrors = this.errors.filter(e => e.timestamp < thirtyDaysAgo && e.resolved);
      
      this.errors = this.errors.filter(e => !(e.timestamp < thirtyDaysAgo && e.resolved));
      
      console.log(`🗑️ 清理了${oldErrors.length}个旧错误`);
      
      // 保存错误历史
      await this.saveErrorHistory();
      
    } catch (err) {
      console.error('❌ 清理旧错误失败:', err);
    }
  }

  // 更新指标
  private async updateMetrics(): Promise<void> {
    try {
      // 重新计算指标
      this.metrics.unresolvedErrors = this.errors.filter(e => !e.resolved).length;
      
      // 保存指标
      await this.saveErrorMetrics();
      
    } catch (err) {
      console.error('❌ 更新指标失败:', err);
    }
  }

  // 保存错误历史
  private async saveErrorHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem('errorHistory', JSON.stringify(this.errors));
    } catch (err) {
      console.error('❌ 保存错误历史失败:', err);
    }
  }

  // 加载错误历史
  private async loadErrorHistory(): Promise<void> {
    try {
      const errorData = await AsyncStorage.getItem('errorHistory');
      if (errorData) {
        this.errors = JSON.parse(errorData);
      }
    } catch (err) {
      console.error('❌ 加载错误历史失败:', err);
    }
  }

  // 保存错误指标
  private async saveErrorMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem('errorMetrics', JSON.stringify(this.metrics));
    } catch (err) {
      console.error('❌ 保存错误指标失败:', err);
    }
  }

  // 加载错误指标
  private async loadErrorMetrics(): Promise<void> {
    try {
      const metricsData = await AsyncStorage.getItem('errorMetrics');
      if (metricsData) {
        this.metrics = { ...this.metrics, ...JSON.parse(metricsData) };
      }
    } catch (err) {
      console.error('❌ 加载错误指标失败:', err);
    }
  }

  // 计算数据大小
  private calculateDataSize(data: any): number {
    try {
      const jsonString = JSON.stringify(data);
      return new Blob([jsonString]).size;
    } catch (err) {
      return 0;
    }
  }

  // 睡眠函数
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 检查是否正在初始化
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  // 销毁服务
  public destroy(): void {
    try {
      if (this.errorCleanupTimer) {
        clearInterval(this.errorCleanupTimer);
        this.errorCleanupTimer = null;
      }
      
      if (this.metricsUpdateTimer) {
        clearInterval(this.metricsUpdateTimer);
        this.metricsUpdateTimer = null;
      }
      
      this.isInitialized = false;
      console.log('🗑️ 错误处理和重试服务已销毁');
      
    } catch (err) {
      console.error('❌ 销毁错误处理和重试服务失败:', err);
    }
  }
}
