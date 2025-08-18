import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 邮箱注册
export const registerWithEmail = async (req: Request, res: Response) => {
  try {
    const { email, password, nickname } = req.body;

    // 验证输入
    if (!email || !password || !nickname) {
      return res.status(400).json({
        success: false,
        error: '邮箱、密码和昵称都是必填项'
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: '邮箱格式不正确'
      });
    }

    // 验证密码强度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: '密码长度至少6位'
      });
    }

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '该邮箱已被注册'
      });
    }

    // 检查昵称是否已存在
    const existingNickname = await User.findOne({ nickname });
    if (existingNickname) {
      return res.status(400).json({
        success: false,
        error: '该昵称已被使用'
      });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 12);

    // 生成验证令牌
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期

    // 生成用户名
    const username = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // 创建用户
    const user = new User({
      username,
      nickname,
      email: email.toLowerCase(),
      auth: {
        loginType: 'email',
        passwordHash,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpiresAt,
        lastLoginAt: new Date(),
        isActive: true
      },
      learningStats: {
        totalWordsLearned: 0,
        totalReviews: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageAccuracy: 0,
        totalStudyTime: 0,
        lastStudyDate: null,
        level: 1,
        experience: 0,
        dailyReviewXP: 0,
        dailyStudyTimeXP: 0,
        lastDailyReset: new Date(),
        completedDailyCards: false,
        lastDailyCardsDate: null
      }
    });

    await user.save();

    // 发送验证邮件
    try {
      await sendVerificationEmail(email, verificationToken, nickname);
      logger.info(`[EmailAuth] 验证邮件已发送到: ${email}`);
    } catch (emailError) {
      logger.error('[EmailAuth] 发送验证邮件失败:', emailError);
      // 继续注册流程，只是警告用户邮件发送失败
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info(`[EmailAuth] 用户注册成功: ${email}`);

    res.status(201).json({
      success: true,
      message: '注册成功！请检查邮箱验证邮件',
      user: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        emailVerified: user.auth.emailVerified,
        loginType: user.auth.loginType
      },
      token
    });

  } catch (error) {
    logger.error('[EmailAuth] 注册失败:', error);
    res.status(500).json({
      success: false,
      error: '注册失败，请稍后重试'
    });
  }
};

// 邮箱登录
export const loginWithEmail = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '邮箱和密码都是必填项'
      });
    }

    // 查找用户
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      'auth.loginType': 'email'
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: '邮箱或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.auth.passwordHash!);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: '邮箱或密码错误'
      });
    }

    // 检查账户是否激活
    if (!user.auth.isActive) {
      return res.status(400).json({
        success: false,
        error: '账户已被禁用'
      });
    }

    // 更新最后登录时间
    user.auth.lastLoginAt = new Date();
    await user.save();

    // 生成JWT令牌
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info(`[EmailAuth] 用户登录成功: ${email}`);

    res.json({
      success: true,
      message: '登录成功',
      user: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        emailVerified: user.auth.emailVerified,
        loginType: user.auth.loginType
      },
      token
    });

  } catch (error) {
    logger.error('[EmailAuth] 登录失败:', error);
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试'
    });
  }
};

// 验证邮箱
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: '验证令牌不能为空'
      });
    }

    // 查找用户
    const user = await User.findOne({
      'auth.emailVerificationToken': token,
      'auth.emailVerificationExpiresAt': { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: '验证令牌无效或已过期'
      });
    }

    // 更新用户验证状态
    user.auth.emailVerified = true;
    user.auth.emailVerificationToken = undefined;
    user.auth.emailVerificationExpiresAt = undefined;
    await user.save();

    logger.info(`[EmailAuth] 邮箱验证成功: ${user.email}`);

    res.json({
      success: true,
      message: '邮箱验证成功！'
    });

  } catch (error) {
    logger.error('[EmailAuth] 邮箱验证失败:', error);
    res.status(500).json({
      success: false,
      error: '验证失败，请稍后重试'
    });
  }
};

// 重新发送验证邮件
export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: '邮箱不能为空'
      });
    }

    // 查找用户
    const user = await User.findOne({
      email: email.toLowerCase(),
      'auth.loginType': 'email',
      'auth.emailVerified': false
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: '用户不存在或邮箱已验证'
      });
    }

    // 生成新的验证令牌
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.auth.emailVerificationToken = verificationToken;
    user.auth.emailVerificationExpiresAt = verificationExpiresAt;
    await user.save();

    // 发送验证邮件
    await sendVerificationEmail(email, verificationToken, user.nickname);

    logger.info(`[EmailAuth] 重新发送验证邮件: ${email}`);

    res.json({
      success: true,
      message: '验证邮件已重新发送'
    });

  } catch (error) {
    logger.error('[EmailAuth] 重新发送验证邮件失败:', error);
    res.status(500).json({
      success: false,
      error: '发送失败，请稍后重试'
    });
  }
};

// 忘记密码
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: '邮箱不能为空'
      });
    }

    // 查找用户
    const user = await User.findOne({
      email: email.toLowerCase(),
      'auth.loginType': 'email'
    });

    if (!user) {
      // 为了安全，即使用户不存在也返回成功
      return res.json({
        success: true,
        message: '如果该邮箱已注册，重置密码邮件已发送'
      });
    }

    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期

    user.auth.passwordResetToken = resetToken;
    user.auth.passwordResetExpiresAt = resetExpiresAt;
    await user.save();

    // 发送重置邮件
    await sendPasswordResetEmail(email, resetToken, user.nickname);

    logger.info(`[EmailAuth] 密码重置邮件已发送: ${email}`);

    res.json({
      success: true,
      message: '如果该邮箱已注册，重置密码邮件已发送'
    });

  } catch (error) {
    logger.error('[EmailAuth] 发送密码重置邮件失败:', error);
    res.status(500).json({
      success: false,
      error: '发送失败，请稍后重试'
    });
  }
};

// 重置密码
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: '重置令牌和新密码都是必填项'
      });
    }

    // 验证密码强度
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: '密码长度至少6位'
      });
    }

    // 查找用户
    const user = await User.findOne({
      'auth.passwordResetToken': token,
      'auth.passwordResetExpiresAt': { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: '重置令牌无效或已过期'
      });
    }

    // 加密新密码
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // 更新密码并清除重置令牌
    user.auth.passwordHash = passwordHash;
    user.auth.passwordResetToken = undefined;
    user.auth.passwordResetExpiresAt = undefined;
    await user.save();

    logger.info(`[EmailAuth] 密码重置成功: ${user.email}`);

    res.json({
      success: true,
      message: '密码重置成功！'
    });

  } catch (error) {
    logger.error('[EmailAuth] 密码重置失败:', error);
    res.status(500).json({
      success: false,
      error: '重置失败，请稍后重试'
    });
  }
};
