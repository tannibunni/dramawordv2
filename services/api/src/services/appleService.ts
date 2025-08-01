import appleSigninAuth from 'apple-signin-auth';
import { appleConfig } from '../config/apple';
import { logger } from '../utils/logger';

export class AppleService {
  static async verifyIdToken(idToken: string) {
    // 添加调试日志
    logger.info(`🍎 Apple JWT 验证开始`);
    logger.info(`🍎 配置的 clientId: ${appleConfig.clientId}`);
    logger.info(`🍎 环境变量 APPLE_CLIENT_ID: ${process.env.APPLE_CLIENT_ID}`);
    logger.info(`🍎 idToken 长度: ${idToken.length}`);
    
    try {
      const result = await appleSigninAuth.verifyIdToken(idToken, {
        audience: appleConfig.clientId,
        ignoreExpiration: false,
      });
      
      logger.info(`🍎 Apple JWT 验证成功: ${result.sub}`);
      return result;
    } catch (error) {
      logger.error(`🍎 Apple JWT 验证失败:`, error);
      throw error;
    }
  }
} 