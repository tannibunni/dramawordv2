// 错误类型枚举
export enum ErrorType {
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  UNKNOWN = 'UNKNOWN'
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// 错误信息接口
export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: any;
  context?: Record<string, any>;
  timestamp: number;
}

// 错误处理配置
export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableReporting: boolean;
  enableUserNotifications: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

// 错误处理结果
export interface ErrorHandlingResult {
  handled: boolean;
  shouldRetry: boolean;
  userMessage?: string;
  errorInfo: ErrorInfo;
}

// 错误处理器类
export class ErrorHandler {
  private static instance: ErrorHandler;
  private config: ErrorHandlerConfig;
  private errorHistory: ErrorInfo[] = [];

  private constructor() {
    this.config = {
      enableLogging: true,
      enableReporting: false,
      enableUserNotifications: true,
      logLevel: 'error'
    };
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 更新错误处理配置
   */
  public updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 处理错误的主要方法
   */
  public handleError(
    error: any,
    context?: Record<string, any>,
    options?: {
      type?: ErrorType;
      severity?: ErrorSeverity;
      shouldRetry?: boolean;
      userMessage?: string;
    }
  ): ErrorHandlingResult {
    const errorInfo = this.createErrorInfo(error, context, options);
    
    // 记录错误
    if (this.config.enableLogging) {
      this.logError(errorInfo);
    }

    // 添加到历史记录
    this.errorHistory.push(errorInfo);

    // 保持历史记录在合理范围内
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-50);
    }

    return {
      handled: true,
      shouldRetry: options?.shouldRetry ?? this.shouldRetry(errorInfo),
      userMessage: options?.userMessage ?? this.getUserMessage(errorInfo),
      errorInfo
    };
  }

  /**
   * 创建错误信息对象
   */
  private createErrorInfo(
    error: any,
    context?: Record<string, any>,
    options?: {
      type?: ErrorType;
      severity?: ErrorSeverity;
      userMessage?: string;
    }
  ): ErrorInfo {
    const errorMessage = this.extractErrorMessage(error);
    const errorType = options?.type ?? this.determineErrorType(error);
    const severity = options?.severity ?? this.determineSeverity(errorType, error);

    return {
      type: errorType,
      severity,
      message: errorMessage,
      originalError: error,
      context,
      timestamp: Date.now()
    };
  }

  /**
   * 提取错误消息
   */
  private extractErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object') {
      return error.message || error.error || JSON.stringify(error);
    }
    
    return 'Unknown error occurred';
  }

  /**
   * 确定错误类型
   */
  private determineErrorType(error: any): ErrorType {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
        return ErrorType.NETWORK;
      }
      
      if (message.includes('storage') || message.includes('asyncstorage')) {
        return ErrorType.STORAGE;
      }
      
      if (message.includes('auth') || message.includes('token') || message.includes('unauthorized')) {
        return ErrorType.AUTHENTICATION;
      }
      
      if (message.includes('validation') || message.includes('invalid')) {
        return ErrorType.VALIDATION;
      }
    }
    
    return ErrorType.UNKNOWN;
  }

  /**
   * 确定错误严重程度
   */
  private determineSeverity(type: ErrorType, error: any): ErrorSeverity {
    switch (type) {
      case ErrorType.AUTHENTICATION:
        return ErrorSeverity.HIGH;
      case ErrorType.NETWORK:
        return ErrorSeverity.MEDIUM;
      case ErrorType.STORAGE:
        return ErrorSeverity.MEDIUM;
      case ErrorType.VALIDATION:
        return ErrorSeverity.LOW;
      case ErrorType.BUSINESS_LOGIC:
        return ErrorSeverity.MEDIUM;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(errorInfo: ErrorInfo): boolean {
    switch (errorInfo.type) {
      case ErrorType.NETWORK:
        return true;
      case ErrorType.STORAGE:
        return true;
      case ErrorType.AUTHENTICATION:
        return false;
      case ErrorType.VALIDATION:
        return false;
      case ErrorType.BUSINESS_LOGIC:
        return false;
      default:
        return false;
    }
  }

  /**
   * 获取用户友好的错误消息
   */
  private getUserMessage(errorInfo: ErrorInfo): string {
    switch (errorInfo.type) {
      case ErrorType.NETWORK:
        return '网络连接失败，请检查网络设置后重试';
      case ErrorType.STORAGE:
        return '数据存储失败，请重试';
      case ErrorType.AUTHENTICATION:
        return '登录已过期，请重新登录';
      case ErrorType.VALIDATION:
        return '输入数据格式不正确，请检查后重试';
      case ErrorType.BUSINESS_LOGIC:
        return '操作失败，请稍后重试';
      default:
        return '发生未知错误，请重试';
    }
  }

  /**
   * 记录错误日志
   */
  private logError(errorInfo: ErrorInfo): void {
    const logMessage = `[${errorInfo.type}] ${errorInfo.message}`;
    const logData = {
      severity: errorInfo.severity,
      timestamp: new Date(errorInfo.timestamp).toISOString(),
      context: errorInfo.context,
      originalError: errorInfo.originalError
    };

    switch (this.config.logLevel) {
      case 'error':
        console.error(logMessage, logData);
        break;
      case 'warn':
        console.warn(logMessage, logData);
        break;
      case 'info':
        console.info(logMessage, logData);
        break;
      case 'debug':
        console.debug(logMessage, logData);
        break;
    }
  }

  /**
   * 获取错误历史
   */
  public getErrorHistory(): ErrorInfo[] {
    return [...this.errorHistory];
  }

  /**
   * 清除错误历史
   */
  public clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * 获取特定类型的错误统计
   */
  public getErrorStats(): Record<ErrorType, number> {
    const stats = Object.values(ErrorType).reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as Record<ErrorType, number>);

    this.errorHistory.forEach(error => {
      stats[error.type]++;
    });

    return stats;
  }
}

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance();

// 便捷的错误处理函数
export const handleError = (
  error: any,
  context?: Record<string, any>,
  options?: {
    type?: ErrorType;
    severity?: ErrorSeverity;
    shouldRetry?: boolean;
    userMessage?: string;
  }
): ErrorHandlingResult => {
  return errorHandler.handleError(error, context, options);
};

// 异步操作的错误处理包装器
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context?: Record<string, any>,
  options?: {
    type?: ErrorType;
    severity?: ErrorSeverity;
    shouldRetry?: boolean;
    userMessage?: string;
  }
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    const result = errorHandler.handleError(error, context, options);
    
    if (result.shouldRetry) {
      // 可以在这里实现重试逻辑
      console.warn('操作失败，建议重试:', result.errorInfo.message);
    }
    
    return null;
  }
}; 