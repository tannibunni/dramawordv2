import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dramaword';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ MongoDB connected successfully');
    
    // 监听连接事件
    mongoose.connection.on('error', (error) => {
      logger.error('❌ MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });
    
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