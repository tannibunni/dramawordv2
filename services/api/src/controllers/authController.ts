import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'dramaword_jwt_secret';

// 模拟验证码存储（生产环境应该使用Redis）
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

export class AuthController {
  /**
   * 发送验证码
   */
  static async sendVerificationCode(req: Request, res: Response) {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber || phoneNumber.length !== 11) {
        return res.status(400).json({
          success: false,
          message: '无效的手机号'
        });
      }

      // 生成6位验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5分钟有效期

      // 存储验证码
      verificationCodes.set(phoneNumber, { code, expiresAt });

      // 模拟发送短信（生产环境调用真实短信服务）
      logger.info(`模拟发送验证码到 ${phoneNumber}: ${code}`);

      res.json({
        success: true,
        message: '验证码已发送',
        data: {
          phoneNumber,
          expiresIn: 300 // 5分钟
        }
      });
    } catch (error) {
      logger.error('发送验证码失败:', error);
      res.status(500).json({
        success: false,
        message: '发送验证码失败'
      });
    }
  }

  /**
   * 验证验证码
   */
  static async verifyCode(req: Request, res: Response) {
    try {
      const { phoneNumber, code } = req.body;

      if (!phoneNumber || !code) {
        return res.status(400).json({
          success: false,
          message: '缺少手机号或验证码'
        });
      }

      const storedData = verificationCodes.get(phoneNumber);
      if (!storedData) {
        return res.status(400).json({
          success: false,
          message: '验证码不存在或已过期'
        });
      }

      if (Date.now() > storedData.expiresAt) {
        verificationCodes.delete(phoneNumber);
        return res.status(400).json({
          success: false,
          message: '验证码已过期'
        });
      }

      if (storedData.code !== code) {
        return res.status(400).json({
          success: false,
          message: '验证码错误'
        });
      }

      // 验证成功，删除验证码
      verificationCodes.delete(phoneNumber);

      res.json({
        success: true,
        message: '验证码验证成功'
      });
    } catch (error) {
      logger.error('验证验证码失败:', error);
      res.status(500).json({
        success: false,
        message: '验证验证码失败'
      });
    }
  }

  /**
   * 手机号登录
   */
  static async phoneLogin(req: Request, res: Response) {
    try {
      const { phoneNumber, code } = req.body;

      if (!phoneNumber || !code) {
        return res.status(400).json({
          success: false,
          message: '缺少手机号或验证码'
        });
      }

      // 验证验证码
      const storedData = verificationCodes.get(phoneNumber);
      if (!storedData || storedData.code !== code || Date.now() > storedData.expiresAt) {
        return res.status(400).json({
          success: false,
          message: '验证码无效或已过期'
        });
      }

      // 验证成功，删除验证码
      verificationCodes.delete(phoneNumber);

      // 查找或创建用户
      let user = await User.findOne({ 'auth.phoneNumber': phoneNumber });

      if (!user) {
        // 创建新用户
        const username = `phone_${phoneNumber.substring(7)}`;
        user = new User({
          username,
          nickname: `用户${phoneNumber.substring(7)}`,
          auth: {
            loginType: 'phone',
            phoneNumber,
            lastLoginAt: new Date(),
            isActive: true
          }
        });

        await user.save();
        logger.info(`创建新手机号用户: ${phoneNumber}`);
      } else {
        // 更新现有用户 - 使用 findOneAndUpdate 避免并行保存冲突
        user = await User.findByIdAndUpdate(
          user._id,
          { $set: { 'auth.lastLoginAt': new Date() } },
          { new: true }
        );
        logger.info(`手机号用户登录: ${phoneNumber}`);
      }

      // 生成JWT token
      const token = jwt.sign(
        { 
          id: user._id,
          username: user.username,
          loginType: 'phone'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: '手机号登录成功',
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
      logger.error('手机号登录失败:', error);
      res.status(500).json({
        success: false,
        message: '手机号登录失败'
      });
    }
  }
} 