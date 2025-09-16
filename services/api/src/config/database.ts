import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dramaword';

export const connectDatabase = async (): Promise<void> => {
  try {
    // 检查MongoDB URI
    if (!MONGODB_URI || MONGODB_URI === 'mongodb://localhost:27017/dramaword') {
      logger.warn('⚠️ 使用默认MongoDB URI，请设置MONGODB_URI环境变量');
    }

    // 🚀 高性能连接池配置 - 针对高并发优化
    const mongooseOptions = {
      // 连接池配置 - 提高并发性能
      maxPoolSize: 20,                    // 最大连接池大小 (原10) - 提高100%
      minPoolSize: 5,                     // 最小连接池大小 (原2) - 提高150%
      maxConnecting: 5,                   // 最大连接中数量 (原2) - 提高150%
      
      // 超时配置 - 平衡性能和稳定性
      serverSelectionTimeoutMS: 30000,    // 服务器选择超时 (增加到30秒)
      socketTimeoutMS: 60000,             // Socket超时 (原45000) - 提高33%
      connectTimeoutMS: 30000,            // 连接超时 (增加到30秒)
      maxIdleTimeMS: 60000,              // 最大空闲时间 (原30000) - 提高100%
      
      // 重试和容错配置
      retryWrites: true,                 // 启用重试写入
      retryReads: true,                  // 启用重试读取
      
      // 压缩和性能优化
      compressors: ['zlib'] as ('zlib' | 'none' | 'snappy' | 'zstd')[],
      zlibCompressionLevel: 6 as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
      
      // 心跳和监控
      heartbeatFrequencyMS: 10000,        // 心跳频率
      
      // 读写关注配置
      readPreference: 'primary' as const,          // 读取偏好
      writeConcern: {                     // 写入关注
        w: 'majority' as const,                    // 写入确认
        j: true,                          // 日志确认
        wtimeout: 10000                   // 写入超时
      },
      
      // 连接字符串选项
      directConnection: false,            // 不直接连接
      ssl: true,                          // 启用SSL (Atlas需要)
      authSource: 'admin',                // 认证源
      
      // 性能监控
      monitorCommands: process.env.NODE_ENV === 'development', // 开发环境监控命令
    };

    // 尝试连接数据库，带重试机制
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        await mongoose.connect(MONGODB_URI, mongooseOptions);
        logger.info('✅ MongoDB connected successfully with high-performance connection pool');
        break;
      } catch (error) {
        retryCount++;
        logger.error(`❌ MongoDB连接失败 (尝试 ${retryCount}/${maxRetries}):`, error);
        
        if (retryCount < maxRetries) {
          const waitTime = retryCount * 5000; // 5秒, 10秒, 15秒
          logger.info(`⏳ ${waitTime/1000}秒后重试连接...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw error;
        }
      }
    }
    
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
      
        // 获取连接池统计信息
        if (mongoose.connection.db) {
          mongoose.connection.db.admin().serverStatus()
            .then((status) => {
              logger.info(`📈 MongoDB server status:`, {
                connections: {
                  current: status.connections?.current || 0,
                  available: status.connections?.available || 0,
                  totalCreated: status.connections?.totalCreated || 0
                },
                memory: {
                  resident: status.mem?.resident || 0,
                  virtual: status.mem?.virtual || 0
                },
                uptime: status.uptime || 0
              });
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