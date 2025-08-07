// 统一的日志工具
type LogLevel = 'LOG' | 'WARN' | 'ERROR' | 'INFO';

interface LogContext {
  page?: string;
  function?: string;
}

class Logger {
  private static formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    const prefix = context?.page && context?.function 
      ? `[${context.page}/${context.function}]`
      : context?.page 
        ? `[${context.page}]`
        : '';
    
    return `${timestamp} ${prefix} ${message}`;
  }

  static log(message: string, context?: LogContext): void {
    console.log(this.formatMessage('LOG', message, context));
  }

  static warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('WARN', message, context));
  }

  static error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('ERROR', message, context));
  }

  static info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('INFO', message, context));
  }

  // 创建特定页面的日志器
  static forPage(page: string) {
    return {
      log: (message: string, functionName?: string) => 
        this.log(message, { page, function: functionName }),
      warn: (message: string, functionName?: string) => 
        this.warn(message, { page, function: functionName }),
      error: (message: string, functionName?: string) => 
        this.error(message, { page, function: functionName }),
      info: (message: string, functionName?: string) => 
        this.info(message, { page, function: functionName }),
    };
  }
}

export default Logger; 