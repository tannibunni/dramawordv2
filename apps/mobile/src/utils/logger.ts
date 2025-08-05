// 统一的日志管理工具
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enableDebug: boolean;
  enableInfo: boolean;
  enableWarn: boolean;
  enableError: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      enableDebug: false, // 默认关闭debug日志
      enableInfo: true,
      enableWarn: true,
      enableError: true,
    };
  }

  private formatMessage(module: string, level: LogLevel, message: string): string {
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };
    return `${emoji[level]} [${module}] ${message}`;
  }

  debug(module: string, message: string, data?: any): void {
    if (this.config.enableDebug) {
      console.log(this.formatMessage(module, 'debug', message), data);
    }
  }

  info(module: string, message: string, data?: any): void {
    if (this.config.enableInfo) {
      console.log(this.formatMessage(module, 'info', message), data);
    }
  }

  warn(module: string, message: string, data?: any): void {
    if (this.config.enableWarn) {
      console.warn(this.formatMessage(module, 'warn', message), data);
    }
  }

  error(module: string, message: string, data?: any): void {
    if (this.config.enableError) {
      console.error(this.formatMessage(module, 'error', message), data);
    }
  }

  // 设置日志级别
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// 创建模块专用的日志工具
export const createModuleLogger = (moduleName: string) => ({
  debug: (message: string, data?: any) => logger.debug(moduleName, message, data),
  info: (message: string, data?: any) => logger.info(moduleName, message, data),
  warn: (message: string, data?: any) => logger.warn(moduleName, message, data),
  error: (message: string, data?: any) => logger.error(moduleName, message, data),
});

// 导出主日志实例
export const logger = new Logger();

// 预定义的模块日志工具
export const wrongWordLogger = createModuleLogger('错词卡');
export const experienceLogger = createModuleLogger('经验值');
export const userDataLogger = createModuleLogger('用户数据');
export const apiLogger = createModuleLogger('API');
export const vocabularyLogger = createModuleLogger('词汇表');
export const reviewLogger = createModuleLogger('复习');
export const authLogger = createModuleLogger('认证'); 