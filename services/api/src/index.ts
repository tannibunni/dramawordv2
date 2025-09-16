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
import omdbRoutes from './routes/omdb';
import searchRoutes from './routes/search';
import debugRoutes from './routes/debug';
import wordFeedbackRoutes from './routes/wordFeedback';
import experienceRoutes from './routes/experience';
import feedbackRoutes from './routes/feedback';
import paymentRoutes from './routes/payment';
import recommendationRoutes from './routes/recommendations';
import iapRoutes from './routes/iap';
import emailAuthRoutes from './routes/emailAuth';
import showWordRoutes from './routes/showWordRoutes.js';
import appleSyncRoutes from './routes/appleSync';
import deviceRoutes from './routes/device';
import dataVersionRoutes from './routes/dataVersion';
import networkRoutes from './routes/network';
import userStatsRoutes from './routes/userStats';
import userSearchRoutes from './routes/userSearch';
import badgeRoutes from './routes/badgeRoutes';
import cacheMonitoringRoutes from './routes/cacheMonitoringRoutes';
import pinyinRoutes from './routes/pinyinRoutes';
import adminRoutes from './routes/adminRoutes';
import batchProcessingRoutes from './routes/batchProcessing';
import smartSyncRoutes from './routes/smartSync';
import inviteRoutes from './routes/invite';
import CacheMonitoringService from './services/cacheMonitoringService';
import { logger } from './utils/logger';
import { OpenAI } from 'openai';

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
app.use('/api/omdb', omdbRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/word-feedback', wordFeedbackRoutes);
app.use('/api/experience', experienceRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/iap', iapRoutes);
app.use('/api/email-auth', emailAuthRoutes);
app.use('/api/show-words', showWordRoutes);
app.use('/api/sync/apple', appleSyncRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/data-version', dataVersionRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/user-stats', userStatsRoutes);
app.use('/api/user-search', userSearchRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/cache-monitoring', cacheMonitoringRoutes);
app.use('/api/pinyin', pinyinRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/batch', batchProcessingRoutes);
app.use('/api/smart-sync', smartSyncRoutes);
app.use('/api/invite', inviteRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown'
  });
});

// 临时邀请码验证端点（用于测试）
app.post('/api/invite/validate', (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: '邀请码不能为空'
      });
    }

    logger.info(`🔍 验证邀请码: ${code}`);

    // 模拟邀请码验证
    const mockInviteCodes = {
      'DWMFN05BRN5PN9S0': {
        code: 'DWMFN05BRN5PN9S0',
        discount: 20,
        maxUses: 100,
        usedCount: 5,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      'DWTEST123456789': {
        code: 'DWTEST123456789',
        discount: 10,
        maxUses: 50,
        usedCount: 10,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    };

    const inviteCode = mockInviteCodes[code];
    
    if (!inviteCode) {
      return res.status(404).json({
        success: false,
        message: '邀请码不存在'
      });
    }

    if (!inviteCode.isActive) {
      return res.status(400).json({
        success: false,
        message: '邀请码已失效'
      });
    }

    if (inviteCode.usedCount >= inviteCode.maxUses) {
      return res.status(400).json({
        success: false,
        message: '邀请码使用次数已达上限'
      });
    }

    if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
      return res.status(400).json({
        success: false,
        message: '邀请码已过期'
      });
    }

    logger.info(`✅ 邀请码验证成功: ${code}, 折扣: ${inviteCode.discount}%`);

    res.json({
      success: true,
      message: '邀请码验证成功',
      data: {
        code: inviteCode.code,
        discount: inviteCode.discount,
        maxUses: inviteCode.maxUses,
        usedCount: inviteCode.usedCount,
        expiresAt: inviteCode.expiresAt
      }
    });

  } catch (error) {
    logger.error('❌ 验证邀请码失败:', error);
    res.status(500).json({
      success: false,
      message: '验证邀请码失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// OpenAI健康检查端点
app.get('/health/openai', async (req, res) => {
  try {
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    const openAIKeyLength = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0;
    
    if (!hasOpenAIKey) {
      res.json({
        status: 'error',
        service: 'openai',
        error: 'OPENAI_API_KEY not configured',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
      });
      return;
    }
    
    // 简单测试OpenAI连接
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 5
    });
    const responseTime = Date.now() - startTime;
    
    res.json({
      status: 'ok',
      service: 'openai',
      responseTime: `${responseTime}ms`,
      model: completion.model,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      config: {
        hasKey: true,
        keyLength: openAIKeyLength,
        keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) + '...'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'openai',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      config: {
        hasKey: !!process.env.OPENAI_API_KEY,
        keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0
      }
    });
  }
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
    
    // 启动缓存监控服务
    const cacheMonitoringService = CacheMonitoringService.getInstance();
    cacheMonitoringService.startMonitoring();
    logger.info('📊 缓存监控服务已启动');
    
    // 启动服务器
    app.listen(PORT, () => {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://dramawordv2.onrender.com' 
        : `http://localhost:${PORT}`;
      
      logger.info(`🚀 API Server running on port ${PORT}`);
      logger.info(`📡 Health check: ${baseUrl}/health`);
      logger.info(`👥 User API: ${baseUrl}/api/users`);
      logger.info(`🔄 Sync API: ${baseUrl}/api/sync`);
      logger.info(`💬 WeChat API: ${baseUrl}/api/wechat`);
      logger.info(`🎬 TMDB API: ${baseUrl}/api/tmdb`);
      logger.info(`🏆 Badge API: ${baseUrl}/api/badges`);
      logger.info(`📊 Cache Monitoring: ${baseUrl}/api/cache-monitoring`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app; 