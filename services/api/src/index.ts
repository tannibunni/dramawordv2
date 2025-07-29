import dotenv from 'dotenv';

// 加载环境变量 - 必须在最顶部
dotenv.config();

// 调试环境变量
console.log('🔧 Environment check:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import wordRoutes from './routes/wordRoutes';
import userRoutes from './routes/user';
import syncRoutes from './routes/sync';
import wechatRoutes from './routes/wechat';
import appleRoutes from './routes/apple';
import authRoutes from './routes/auth';
import tmdbRoutes from './routes/tmdb';
import debugRoutes from './routes/debug';
import wordFeedbackRoutes from './routes/wordFeedback';
import experienceRoutes from './routes/experience';
import feedbackRoutes from './routes/feedback';
import paymentRoutes from './routes/payment';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// 路由
app.use('/api/words', wordRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/wechat', wechatRoutes);
app.use('/api/apple', appleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/word-feedback', wordFeedbackRoutes);
app.use('/api/experience', experienceRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/payment', paymentRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 连接数据库
    await connectDatabase();
    
    // 启动服务器
    app.listen(PORT, () => {
      logger.info(`🚀 API Server running on port ${PORT}`);
      logger.info(`📡 Health check: http://localhost:${PORT}/health`);
      logger.info(`👥 User API: http://localhost:${PORT}/api/users`);
      logger.info(`🔄 Sync API: http://localhost:${PORT}/api/sync`);
      logger.info(`💬 WeChat API: http://localhost:${PORT}/api/wechat`);
      logger.info(`🎬 TMDB API: http://localhost:${PORT}/api/tmdb`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app; 