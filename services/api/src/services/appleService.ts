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
    
    // 解码 JWT token 以获取实际 audience
    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const payload = parts[1];
        const decodedPayload = Buffer.from(payload, 'base64').toString('utf8');
        const payloadObj = JSON.parse(decodedPayload);
        
        logger.info(`🍎 JWT payload 解码成功`);
        logger.info(`🍎 实际 audience: ${payloadObj.aud}`);
        logger.info(`🍎 issuer: ${payloadObj.iss}`);
        logger.info(`🍎 subject: ${payloadObj.sub}`);
        
        // 检查 audience 是否匹配
        if (payloadObj.aud !== appleConfig.clientId) {
          logger.warn(`🍎 Audience 不匹配! 期望: ${appleConfig.clientId}, 实际: ${payloadObj.aud}`);
          
          // 如果 audience 是数组，检查是否包含期望的值
          if (Array.isArray(payloadObj.aud)) {
            const hasExpectedAudience = payloadObj.aud.includes(appleConfig.clientId);
            logger.info(`🍎 Audience 是数组，包含期望值: ${hasExpectedAudience}`);
            
            if (hasExpectedAudience) {
              logger.info(`🍎 使用数组中的第一个 audience: ${payloadObj.aud[0]}`);
              // 使用数组中的第一个值作为 audience
              const result = await appleSigninAuth.verifyIdToken(idToken, {
                audience: payloadObj.aud[0],
                ignoreExpiration: false,
              });
              
              logger.info(`🍎 Apple JWT 验证成功: ${result.sub}`);
              return result;
            }
          }
        }
      }
    } catch (decodeError) {
      logger.warn(`🍎 JWT 解码失败，继续正常验证: ${decodeError}`);
    }
    
    try {
      const result = await appleSigninAuth.verifyIdToken(idToken, {
        audience: appleConfig.clientId,
        ignoreExpiration: false,
      });
      
      logger.info(`🍎 Apple JWT 验证成功: ${result.sub}`);
      return result;
    } catch (error) {
      logger.error(`🍎 Apple JWT 验证失败:`, error);
      
      // 提供更详细的错误信息
      if (error.message && error.message.includes('jwt audience invalid')) {
        logger.error(`🍎 Audience 验证失败详情:`);
        logger.error(`   - 期望的 audience: ${appleConfig.clientId}`);
        logger.error(`   - 错误信息: ${error.message}`);
        logger.error(`🍎 建议检查:`);
        logger.error(`   1. Apple Developer Console 中的 App ID 配置`);
        logger.error(`   2. 应用端的 bundle identifier`);
        logger.error(`   3. 环境变量 APPLE_CLIENT_ID 设置`);
      }
      
      throw error;
    }
  }
} 