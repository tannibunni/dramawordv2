import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, DeviceInfo } from 'react-native';
import { API_BASE_URL } from '../constants/config';

// 错误追踪接口
export interface ErrorTrackingInfo {
  totalCrashes: number;
  totalErrors: number;
  performanceIssues: number;
  lastCrashDate?: Date;
  lastErrorDate?: Date;
  crashReports: CrashReport[];
  performanceReports: PerformanceReport[];
}

export interface CrashReport {
  date: Date;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  deviceInfo: string;
}

export interface PerformanceReport {
  date: Date;
  issueType: 'slow_load' | 'memory_high' | 'battery_drain' | 'network_slow';
  severity: 'low' | 'medium' | 'high';
  details: string;
  metrics: {
    loadTime?: number;
    memoryUsage?: number;
    batteryLevel?: number;
    networkSpeed?: number;
  };
}

// 错误追踪服务
class ErrorTrackingService {
  private static instance: ErrorTrackingService;
  private errorTrackingInfo: ErrorTrackingInfo | null = null;
  private performanceMetrics: Map<string, number> = new Map();
  private errorQueue: CrashReport[] = [];
  private performanceQueue: PerformanceReport[] = [];

  public static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService();
    }
    return ErrorTrackingService.instance;
  }

  /**
   * 初始化错误追踪服务
   */
  public async initialize(): Promise<void> {
    try {
      console.log('[ErrorTrackingService] 初始化错误追踪服务...');
      
      // 加载本地存储的错误追踪信息
      await this.loadStoredErrorTracking();
      
      // 设置全局错误处理器
      this.setupGlobalErrorHandlers();
      
      // 开始性能监控
      this.startPerformanceMonitoring();
      
      console.log('[ErrorTrackingService] 错误追踪服务初始化完成');
    } catch (error) {
      console.error('[ErrorTrackingService] 初始化失败:', error);
    }
  }

  /**
   * 记录崩溃报告
   */
  public async recordCrash(error: Error, stackTrace?: string): Promise<void> {
    try {
      const crashReport: CrashReport = {
        date: new Date(),
        errorType: error.name || 'UnknownError',
        errorMessage: error.message || 'Unknown error occurred',
        stackTrace: stackTrace || error.stack,
        deviceInfo: await this.getDeviceInfo()
      };

      console.log('[ErrorTrackingService] 记录崩溃报告:', crashReport);

      // 添加到队列
      this.errorQueue.push(crashReport);

      // 更新本地统计
      if (this.errorTrackingInfo) {
        this.errorTrackingInfo.totalCrashes++;
        this.errorTrackingInfo.lastCrashDate = new Date();
        this.errorTrackingInfo.crashReports.push(crashReport);
      }

      // 保存到本地存储
      await this.saveErrorTracking();

      // 尝试上传到后端
      await this.uploadErrorReports();
    } catch (error) {
      console.error('[ErrorTrackingService] 记录崩溃报告失败:', error);
    }
  }

  /**
   * 记录错误报告
   */
  public async recordError(error: Error, context?: string): Promise<void> {
    try {
      const errorReport: CrashReport = {
        date: new Date(),
        errorType: error.name || 'Error',
        errorMessage: context ? `${context}: ${error.message}` : error.message || 'Unknown error',
        stackTrace: error.stack,
        deviceInfo: await this.getDeviceInfo()
      };

      console.log('[ErrorTrackingService] 记录错误报告:', errorReport);

      // 添加到队列
      this.errorQueue.push(errorReport);

      // 更新本地统计
      if (this.errorTrackingInfo) {
        this.errorTrackingInfo.totalErrors++;
        this.errorTrackingInfo.lastErrorDate = new Date();
        this.errorTrackingInfo.crashReports.push(errorReport);
      }

      // 保存到本地存储
      await this.saveErrorTracking();

      // 尝试上传到后端
      await this.uploadErrorReports();
    } catch (error) {
      console.error('[ErrorTrackingService] 记录错误报告失败:', error);
    }
  }

  /**
   * 记录性能问题
   */
  public async recordPerformanceIssue(
    issueType: 'slow_load' | 'memory_high' | 'battery_drain' | 'network_slow',
    severity: 'low' | 'medium' | 'high',
    details: string,
    metrics: {
      loadTime?: number;
      memoryUsage?: number;
      batteryLevel?: number;
      networkSpeed?: number;
    }
  ): Promise<void> {
    try {
      const performanceReport: PerformanceReport = {
        date: new Date(),
        issueType,
        severity,
        details,
        metrics
      };

      console.log('[ErrorTrackingService] 记录性能问题:', performanceReport);

      // 添加到队列
      this.performanceQueue.push(performanceReport);

      // 更新本地统计
      if (this.errorTrackingInfo) {
        this.errorTrackingInfo.performanceIssues++;
        this.errorTrackingInfo.performanceReports.push(performanceReport);
      }

      // 保存到本地存储
      await this.saveErrorTracking();

      // 尝试上传到后端
      await this.uploadPerformanceReports();
    } catch (error) {
      console.error('[ErrorTrackingService] 记录性能问题失败:', error);
    }
  }

  /**
   * 监控页面加载时间
   */
  public startLoadTimeMonitoring(pageName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.set(`${pageName}_load_time`, loadTime);
      
      // 如果加载时间超过3秒，记录性能问题
      if (loadTime > 3000) {
        this.recordPerformanceIssue(
          'slow_load',
          loadTime > 5000 ? 'high' : 'medium',
          `${pageName} 页面加载时间过长: ${loadTime}ms`,
          { loadTime }
        );
      }
    };
  }

  /**
   * 监控内存使用
   */
  public async checkMemoryUsage(): Promise<void> {
    try {
      // 这里可以集成实际的内存监控库
      // 目前使用模拟数据
      const memoryUsage = Math.random() * 100; // 模拟内存使用百分比
      
      if (memoryUsage > 80) {
        await this.recordPerformanceIssue(
          'memory_high',
          memoryUsage > 90 ? 'high' : 'medium',
          `内存使用率过高: ${memoryUsage.toFixed(1)}%`,
          { memoryUsage }
        );
      }
    } catch (error) {
      console.error('[ErrorTrackingService] 检查内存使用失败:', error);
    }
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalErrorHandlers(): void {
    // JavaScript错误处理
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      
      // 尝试从错误参数中提取错误信息
      const errorMessage = args.find(arg => arg instanceof Error);
      if (errorMessage) {
        this.recordError(errorMessage as Error, 'Console Error');
      }
    };

    // React Native环境下的未捕获Promise拒绝处理
    // 注意：在React Native中，我们使用不同的方式处理未捕获的Promise拒绝
    if (typeof global !== 'undefined' && global.HermesInternal) {
      // 在Hermes引擎中处理未捕获的Promise拒绝
      const originalUnhandledRejection = global.HermesInternal?.enablePromiseRejectionTracker;
      if (originalUnhandledRejection) {
        global.HermesInternal.enablePromiseRejectionTracker = (tracker: any) => {
          const result = originalUnhandledRejection(tracker);
          if (tracker && tracker.onUnhandled) {
            const originalOnUnhandled = tracker.onUnhandled;
            tracker.onUnhandled = (id: number, error: any) => {
              this.recordError(new Error(String(error)), 'Unhandled Promise Rejection');
              if (originalOnUnhandled) {
                originalOnUnhandled(id, error);
              }
            };
          }
          return result;
        };
      }
    }
  }

  /**
   * 开始性能监控
   */
  private startPerformanceMonitoring(): void {
    // 每5分钟检查一次内存使用
    setInterval(() => {
      this.checkMemoryUsage();
    }, 5 * 60 * 1000);

    // 每10分钟上传一次报告
    setInterval(() => {
      this.uploadErrorReports();
      this.uploadPerformanceReports();
    }, 10 * 60 * 1000);
  }

  /**
   * 获取设备信息
   */
  private async getDeviceInfo(): Promise<string> {
    try {
      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version,
        timestamp: new Date().toISOString()
      };
      
      return JSON.stringify(deviceInfo);
    } catch (error) {
      return `Platform: ${Platform.OS}, Version: ${Platform.Version}`;
    }
  }

  /**
   * 加载本地存储的错误追踪信息
   */
  private async loadStoredErrorTracking(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('errorTrackingInfo');
      if (stored) {
        const parsed = JSON.parse(stored);
        // 转换日期字符串为Date对象
        if (parsed.crashReports) {
          parsed.crashReports = parsed.crashReports.map((report: any) => ({
            ...report,
            date: new Date(report.date)
          }));
        }
        if (parsed.performanceReports) {
          parsed.performanceReports = parsed.performanceReports.map((report: any) => ({
            ...report,
            date: new Date(report.date)
          }));
        }
        this.errorTrackingInfo = parsed;
      } else {
        // 初始化默认值
        this.errorTrackingInfo = {
          totalCrashes: 0,
          totalErrors: 0,
          performanceIssues: 0,
          crashReports: [],
          performanceReports: []
        };
      }
    } catch (error) {
      console.error('[ErrorTrackingService] 加载本地错误追踪信息失败:', error);
      this.errorTrackingInfo = {
        totalCrashes: 0,
        totalErrors: 0,
        performanceIssues: 0,
        crashReports: [],
        performanceReports: []
      };
    }
  }

  /**
   * 保存错误追踪信息到本地存储
   */
  private async saveErrorTracking(): Promise<void> {
    try {
      if (this.errorTrackingInfo) {
        await AsyncStorage.setItem('errorTrackingInfo', JSON.stringify(this.errorTrackingInfo));
      }
    } catch (error) {
      console.error('[ErrorTrackingService] 保存错误追踪信息失败:', error);
    }
  }

  /**
   * 上传错误报告到后端
   */
  private async uploadErrorReports(): Promise<void> {
    try {
      if (this.errorQueue.length === 0) return;

      const userData = await AsyncStorage.getItem('userData');
      if (!userData) return;

      const { id: userId, token } = JSON.parse(userData);
      if (!userId || !token) return;

      const response = await fetch(`${API_BASE_URL}/users/${userId}/error-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          errorReports: this.errorQueue
        })
      });

      if (response.ok) {
        console.log('[ErrorTrackingService] 错误报告上传成功');
        this.errorQueue = []; // 清空队列
      } else {
        console.error('[ErrorTrackingService] 错误报告上传失败:', response.status);
      }
    } catch (error) {
      console.error('[ErrorTrackingService] 上传错误报告失败:', error);
    }
  }

  /**
   * 上传性能报告到后端
   */
  private async uploadPerformanceReports(): Promise<void> {
    try {
      if (this.performanceQueue.length === 0) return;

      const userData = await AsyncStorage.getItem('userData');
      if (!userData) return;

      const { id: userId, token } = JSON.parse(userData);
      if (!userId || !token) return;

      const response = await fetch(`${API_BASE_URL}/users/${userId}/performance-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          performanceReports: this.performanceQueue
        })
      });

      if (response.ok) {
        console.log('[ErrorTrackingService] 性能报告上传成功');
        this.performanceQueue = []; // 清空队列
      } else {
        console.error('[ErrorTrackingService] 性能报告上传失败:', response.status);
      }
    } catch (error) {
      console.error('[ErrorTrackingService] 上传性能报告失败:', error);
    }
  }

  /**
   * 获取错误追踪统计信息
   */
  public getErrorTrackingStats(): ErrorTrackingInfo | null {
    return this.errorTrackingInfo;
  }

  /**
   * 清除错误追踪数据
   */
  public async clearErrorTracking(): Promise<void> {
    try {
      this.errorTrackingInfo = {
        totalCrashes: 0,
        totalErrors: 0,
        performanceIssues: 0,
        crashReports: [],
        performanceReports: []
      };
      
      this.errorQueue = [];
      this.performanceQueue = [];
      
      await AsyncStorage.removeItem('errorTrackingInfo');
      console.log('[ErrorTrackingService] 错误追踪数据已清除');
    } catch (error) {
      console.error('[ErrorTrackingService] 清除错误追踪数据失败:', error);
    }
  }
}

export const errorTrackingService = ErrorTrackingService.getInstance();
export default errorTrackingService;
