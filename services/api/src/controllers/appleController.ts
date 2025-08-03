import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AppleService } from '../services/appleService';
import { logger } from '../utils/logger';

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

      // 构建用户昵称
      let nickname = 'Apple用户';
      if (fullName && (fullName.givenName || fullName.familyName)) {
        const givenName = fullName.givenName || '';
        const familyName = fullName.familyName || '';
        nickname = `${givenName}${familyName}`.trim() || 'Apple用户';
      } else if (email) {
        nickname = email.split('@')[0];
      }

      // 查找或创建用户
      let user = await User.findOne({ 'auth.appleId': appleId });
      if (!user) {
        // 创建新用户
        const userData = {
          username: `apple_${appleId.slice(0, 8)}`,
          nickname,
          email,
          auth: {
            loginType: 'apple',
            appleId,
            appleEmail: email,
            appleFullName: fullName,
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
        logger.info(`创建新Apple用户: appleId=${appleId}, nickname=${nickname}`);
      } else {
        // 更新现有用户信息 - 使用 findOneAndUpdate 避免并行保存冲突
        const updateData: any = {
          'auth.lastLoginAt': new Date(),
          'auth.appleEmail': email,
          'auth.appleFullName': fullName
        };
        
        if (nickname !== 'Apple用户') {
          updateData.nickname = nickname;
        }
        if (email && email !== user.email) {
          updateData.email = email;
        }
        
        user = await User.findByIdAndUpdate(
          user._id,
          { $set: updateData },
          { new: true }
        );
        
        if (!user) {
          throw new Error('用户更新失败');
        }
        
        logger.info(`更新Apple用户信息: appleId=${appleId}, nickname=${nickname}`);
      }

      // 生成JWT
      const token = jwt.sign(
        { userId: user._id, username: user.username, loginType: 'apple' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

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
            avatar: user.avatar,
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