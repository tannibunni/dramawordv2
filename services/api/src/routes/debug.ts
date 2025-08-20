import express from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import UserVocabulary from '../models/UserVocabulary';
import { CloudWord } from '../models/CloudWord';
import { User } from '../models/User';

const router = express.Router();

// 数据库状态检查
router.get('/db-status', async (req, res) => {
  try {
    const dbStatus = {
      connectionState: mongoose.connection.readyState,
      connectionStateText: getConnectionStateText(mongoose.connection.readyState),
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      models: Object.keys(mongoose.connection.models),
      collections: await getCollectionsList(),
      timestamp: new Date().toISOString()
    };

    logger.info('数据库状态检查:', dbStatus);
    
    res.json({
      success: true,
      data: dbStatus
    });
  } catch (error) {
    logger.error('数据库状态检查失败:', error);
    res.status(500).json({
      success: false,
      error: '数据库状态检查失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 查询集合数据
router.get('/collection/:collectionName', async (req, res) => {
  try {
    const { collectionName } = req.params;
    const { userId, word } = req.query;
    
    logger.info(`查询集合: ${collectionName}`, { userId, word });
    
    let data = [];
    
    switch (collectionName) {
      case 'uservocabularies':
        const query: any = {};
        if (userId) query.userId = userId;
        if (word) query.word = word;
        data = await UserVocabulary.find(query).limit(10);
        break;
        
      case 'cloudwords':
        const cloudQuery: any = {};
        if (word) cloudQuery.word = word;
        data = await CloudWord.find(cloudQuery).limit(10);
        break;
        
      case 'users':
        const userQuery: any = {};
        if (userId) userQuery.id = userId;
        data = await User.find(userQuery).limit(10);
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: '不支持的集合名称'
        });
    }
    
    logger.info(`查询结果: ${collectionName}`, { count: data.length });
    
    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    logger.error('查询集合失败:', error);
    res.status(500).json({
      success: false,
      error: '查询集合失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * 检查环境变量配置
 * GET /api/debug/env-check
 */
router.get('/env-check', (req, res) => {
  try {
    const envVars = {
      EMAIL_SERVICE: process.env.EMAIL_SERVICE,
      // Gmail配置
      GMAIL_USER: process.env.GMAIL_USER,
      GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? 
        `${process.env.GMAIL_APP_PASSWORD.substring(0, 4)}...${process.env.GMAIL_APP_PASSWORD.substring(process.env.GMAIL_APP_PASSWORD.length - 4)}` : 
        'NOT_SET',
      // Zoho配置
      ZOHO_USER: process.env.ZOHO_USER,
      ZOHO_PASSWORD: process.env.ZOHO_PASSWORD ? 
        `${process.env.ZOHO_PASSWORD.substring(0, 4)}...${process.env.ZOHO_PASSWORD.substring(process.env.ZOHO_PASSWORD.length - 4)}` : 
        'NOT_SET',
      EMAIL_FROM: process.env.EMAIL_FROM,
      FRONTEND_URL: process.env.FRONTEND_URL,
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    };
    
    res.json({
      success: true,
      message: '环境变量检查',
      environment: envVars,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '环境变量检查失败'
    });
  }
});

// 获取连接状态文本
function getConnectionStateText(state: number): string {
  switch (state) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    default: return 'unknown';
  }
}

// 获取集合列表
async function getCollectionsList(): Promise<string[]> {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    return collections.map(col => col.name);
  } catch (error) {
    logger.error('获取集合列表失败:', error);
    return [];
  }
}

// 同步测试端点（不需要认证）
router.post('/sync-test', async (req, res) => {
  try {
    const { data } = req.body;
    
    logger.info('同步测试请求:', {
      dataType: typeof data,
      dataSize: JSON.stringify(data).length,
      hasUserId: !!data?.userId,
      hasLearningRecords: !!data?.learningRecords,
      recordCount: data?.learningRecords?.length || 0
    });

    // 检查数据库连接
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        error: '数据库连接异常',
        connectionState: mongoose.connection.readyState,
        connectionStateText: getConnectionStateText(mongoose.connection.readyState)
      });
    }

    // 模拟同步操作
    const result = {
      success: true,
      message: '同步测试成功',
      data: {
        processedRecords: data?.learningRecords?.length || 0,
        databaseConnected: true,
        timestamp: new Date().toISOString()
      }
    };

    logger.info('同步测试成功:', result);
    res.json(result);
  } catch (error) {
    logger.error('同步测试失败:', error);
    res.status(500).json({
      success: false,
      error: '同步测试失败',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

export default router; 