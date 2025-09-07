import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dramaword';

export const connectDatabase = async (): Promise<void> => {
  try {
    // 优化连接配置
    const mongooseOptions = {
      maxPoolSize: 10,                    // 最大连接池大小
      serverSelectionTimeoutMS: 5000,     // 服务器选择超时
      socketTimeoutMS: 45000,             // Socket超时
      bufferCommands: false,              // 禁用命令缓冲
      maxIdleTimeMS: 30000,              // 最大空闲时间
      retryWrites: true,                 // 启用重试写入
      retryReads: true,                  // 启用重试读取
      compressors: ['zlib'] as ('zlib' | 'none' | 'snappy' | 'zstd')[],    // 启用压缩
      zlibCompressionLevel: 6 as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,           // 压缩级别
      heartbeatFrequencyMS: 10000,       // 心跳频率
      maxConnecting: 2,                  // 最大连接中数量
      minPoolSize: 2                     // 最小连接池大小
    };

    await mongoose.connect(MONGODB_URI, mongooseOptions);
    logger.info('✅ MongoDB connected successfully with optimized connection pool');
    
    // 监听连接事件
    mongoose.connection.on('error', (error) => {
      logger.error('❌ MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

    // 连接池监控
    mongoose.connection.on('connected', () => {
      logger.info('🔗 MongoDB connected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 MongoDB reconnected');
    });

    // 定期监控连接池状态
    setInterval(() => {
      const connectionState = mongoose.connection.readyState;
      const connectionStates = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      
      logger.info(`📊 MongoDB connection state: ${connectionStates[connectionState]}`);
      
      // 记录连接池统计信息
      if (mongoose.connection.db) {
        mongoose.connection.db.admin().serverStatus()
          .then((status) => {
            logger.info(`📈 MongoDB server status - Connections: ${status.connections?.current || 'N/A'}`);
          })
          .catch((error) => {
            logger.warn('⚠️ Failed to get server status:', error.message);
          });
      }
    }, 60000); // 每分钟检查一次
    
    // 优雅关闭
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('📴 MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('📴 MongoDB disconnected');
  } catch (error) {
    logger.error('❌ Error disconnecting from MongoDB:', error);
  }
}; 