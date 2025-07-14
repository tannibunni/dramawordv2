import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AppleService } from '../services/appleService';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'dramaword_jwt_secret';

export class AppleController {
  static async login(req: Request, res: Response) {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({ success: false, message: '缺少idToken' });
      }
      // 验证idToken
      const appleUser = await AppleService.verifyIdToken(idToken);
      const { sub: appleId, email } = appleUser;

      // 查找或创建用户
      let user = await User.findOne({ 'auth.appleId': appleId });
      if (!user) {
        user = new User({
          username: `apple_${appleId.slice(0, 8)}`,
          nickname: email ? email.split('@')[0] : 'Apple用户',
          email,
          auth: {
            loginType: 'apple',
            appleId,
            lastLoginAt: new Date(),
            isActive: true,
          },
        });
        await user.save();
      } else {
        user.auth.lastLoginAt = new Date();
        await user.save();
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