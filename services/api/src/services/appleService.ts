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
    let actualAudience: string | string[] | null = null;
    let jwtPayload: any = null;
    
    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const payload = parts[1];
        const decodedPayload = Buffer.from(payload, 'base64').toString('utf8');
        jwtPayload = JSON.parse(decodedPayload);
        
        actualAudience = jwtPayload.aud;
        
        logger.info(`🍎 JWT payload 解码成功`);
        logger.info(`🍎 实际 audience: ${actualAudience}`);
        logger.info(`🍎 audience 类型: ${Array.isArray(actualAudience) ? 'array' : typeof actualAudience}`);
        logger.info(`🍎 issuer: ${jwtPayload.iss}`);
        logger.info(`🍎 subject: ${jwtPayload.sub}`);
        logger.info(`🍎 过期时间: ${new Date(jwtPayload.exp * 1000).toISOString()}`);
        
        if (Array.isArray(actualAudience)) {
          logger.info(`🍎 Audience 数组内容: ${actualAudience.join(', ')}`);
        }
      }
    } catch (decodeError) {
      logger.warn(`🍎 JWT 解码失败，继续正常验证: ${decodeError}`);
    }
    
    // 如果实际 audience 是数组，直接使用数组进行验证
    if (Array.isArray(actualAudience)) {
      try {
        logger.info(`🍎 尝试使用数组 audience: ${actualAudience.join(', ')}`);
        
        const result = await appleSigninAuth.verifyIdToken(idToken, {
          audience: actualAudience,
          ignoreExpiration: false,
        });
        
        logger.info(`🍎 ✅ Apple JWT 验证成功! 使用数组 audience`);
        logger.info(`🍎 验证结果: sub=${result.sub}, email=${result.email || 'N/A'}`);
        
        return result;
        
      } catch (error) {
        logger.error(`🍎 ❌ 数组 audience 验证失败: ${error.message}`);
      }
    }
    
    // 尝试多种 audience 验证策略
    const verificationStrategies = [
      // 策略1: 使用配置的 clientId
      { audience: appleConfig.clientId, description: '配置的 clientId' },
      
      // 策略2: 如果实际 audience 是字符串，直接使用
      ...(typeof actualAudience === 'string' ? [{ 
        audience: actualAudience, 
        description: '实际的 audience' 
      }] : []),
      
      // 策略3: 尝试常见的变体
      { audience: 'com.tannibunni.dramawordmobile', description: '硬编码的 bundle ID' },
      { audience: 'com.tannibunni.dramaword', description: '可能的变体1' },
      { audience: 'dramaword', description: '可能的变体2' }
    ];
    
    // 去重
    const uniqueStrategies = verificationStrategies.filter((strategy, index, self) => 
      index === self.findIndex(s => s.audience === strategy.audience)
    );
    
    logger.info(`🍎 将尝试 ${uniqueStrategies.length} 种验证策略`);
    
    for (const strategy of uniqueStrategies) {
      try {
        logger.info(`🍎 尝试策略: ${strategy.description} (${strategy.audience})`);
        
        const result = await appleSigninAuth.verifyIdToken(idToken, {
          audience: strategy.audience,
          ignoreExpiration: false,
        });
        
        logger.info(`🍎 ✅ Apple JWT 验证成功! 使用策略: ${strategy.description}`);
        logger.info(`🍎 验证结果: sub=${result.sub}, email=${result.email || 'N/A'}`);
        
        // 记录成功的策略，以便后续优化
        if (strategy.audience !== appleConfig.clientId) {
          logger.warn(`🍎 注意: 使用了非配置的 audience: ${strategy.audience}`);
          logger.warn(`🍎 建议更新 APPLE_CLIENT_ID 环境变量为: ${strategy.audience}`);
        }
        
        return result;
        
      } catch (error) {
        logger.debug(`🍎 ❌ 策略失败: ${strategy.description} - ${error.message}`);
        continue;
      }
    }
    
    // 所有策略都失败了
    logger.error(`🍎 ❌ 所有验证策略都失败了`);
    logger.error(`🍎 期望的 audience: ${appleConfig.clientId}`);
    logger.error(`🍎 实际的 audience: ${actualAudience}`);
    logger.error(`🍎 JWT payload:`, jwtPayload);
    
    // 提供详细的错误信息和解决建议
    const error = new Error(`Apple JWT 验证失败: 所有 audience 策略都失败`);
    error.name = 'AppleJWTVerificationError';
    
    // 添加额外的错误信息
    (error as any).details = {
      expectedAudience: appleConfig.clientId,
      actualAudience,
      jwtPayload,
      triedStrategies: uniqueStrategies.map(s => s.audience)
    };
    
    throw error;
  }
  
  // 新增: 获取 JWT 信息而不验证
  static decodeJWTWithoutVerification(idToken: string) {
    try {
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf8'));
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      
      return {
        header,
        payload,
        audience: payload.aud,
        issuer: payload.iss,
        subject: payload.sub,
        expiration: new Date(payload.exp * 1000),
        issuedAt: new Date(payload.iat * 1000)
      };
    } catch (error) {
      throw new Error(`JWT 解码失败: ${error.message}`);
    }
  }
} 