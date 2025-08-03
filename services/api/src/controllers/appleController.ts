import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AppleService } from '../services/appleService';
import { logger } from '../utils/logger';
import { normalizeAvatarUrl } from '../utils/urlHelper';

const JWT_SECRET = process.env.JWT_SECRET || 'dramaword_jwt_secret';

export class AppleController {
  static async login(req: Request, res: Response) {
    try {
      const { idToken, email, fullName } = req.body;
      if (!idToken) {
        return res.status(400).json({ success: false, message: '缺少idToken' });
      }
      
      // 添加调试日志
      logger.info(`🍎 Apple 登录请求开始`);
      logger.info(`🍎 接收到的 email: ${email}`);
      logger.info(`🍎 接收到的 fullName:`, fullName);
      logger.info(`🍎 环境变量检查 - APPLE_CLIENT_ID: ${process.env.APPLE_CLIENT_ID}`);
      
      // 验证idToken
      const appleUser = await AppleService.verifyIdToken(idToken);
      const { sub: appleId } = appleUser;
      
      // 从Apple JWT中获取用户信息
      const appleEmail = appleUser.email || email;
      const appleFullName = fullName || {};
      
      // 构建用户昵称 - 优先使用Apple提供的真实姓名
      let nickname = 'Apple用户';
      if (appleFullName && (appleFullName.givenName || appleFullName.familyName)) {
        const givenName = appleFullName.givenName || '';
        const familyName = appleFullName.familyName || '';
        nickname = `${givenName}${familyName}`.trim() || 'Apple用户';
        logger.info(`🍎 使用Apple真实姓名: ${nickname}`);
      } else if (appleEmail) {
        // 如果没有姓名，使用邮箱前缀作为昵称
        nickname = appleEmail.split('@')[0];
        logger.info(`🍎 使用邮箱前缀作为昵称: ${nickname}`);
      }

      // 查找或创建用户
      let user = await User.findOne({ 'auth.appleId': appleId });
      if (!user) {
        // 创建新用户 - 使用Apple ID的真实信息
        const userData = {
          username: `apple_${appleId.slice(0, 8)}`,
          nickname,
          email: appleEmail, // 使用Apple提供的邮箱
          auth: {
            loginType: 'apple',
            appleId,
            appleEmail: appleEmail,
            appleFullName: appleFullName,
            lastLoginAt: new Date(),
            isActive: true,
          },
          subscription: {
            type: 'lifetime',
            isActive: true,
            startDate: new Date(),
            expiryDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100年后过期
            autoRenew: false
          }
        };
        
        user = new User(userData);
        await user.save();
        logger.info(`🍎 创建新Apple用户: appleId=${appleId}, nickname=${nickname}, email=${appleEmail}`);
      } else {
        // 更新现有用户信息 - 优先使用Apple ID的真实信息
        const updateData: any = {
          'auth.lastLoginAt': new Date(),
          'auth.appleEmail': appleEmail,
          'auth.appleFullName': appleFullName
        };
        
        // 如果Apple提供了真实姓名，更新昵称
        if (nickname !== 'Apple用户' && nickname !== user.nickname) {
          updateData.nickname = nickname;
          logger.info(`🍎 更新用户昵称为Apple真实姓名: ${nickname}`);
        }
        
        // 如果Apple提供了邮箱，更新邮箱
        if (appleEmail && appleEmail !== user.email) {
          updateData.email = appleEmail;
          logger.info(`🍎 更新用户邮箱为Apple邮箱: ${appleEmail}`);
        }
        
        user = await User.findByIdAndUpdate(
          user._id,
          { $set: updateData },
          { new: true }
        );
        
        if (!user) {
          throw new Error('用户更新失败');
        }
        
        logger.info(`🍎 更新Apple用户信息: appleId=${appleId}, nickname=${nickname}, email=${appleEmail}`);
      }

      // 生成JWT
      const token = jwt.sign(
        { id: user._id, username: user.username, loginType: 'apple' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // 确保头像URL使用正确的生产环境地址
      const avatarUrl = normalizeAvatarUrl(user.avatar);

      return res.json({
        success: true,
        message: 'Apple登录成功',
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            nickname: user.nickname,
            email: user.email,
            avatar: avatarUrl,
            loginType: user.auth.loginType,
            learningStats: user.learningStats,
            settings: user.settings,
          },
        },
      });
    } catch (error) {
      logger.error('Apple登录失败:', error);
      return res.status(500).json({ success: false, message: 'Apple登录失败' });
    }
  }
} 