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
      const { idToken, email, fullName, guestUserId, deviceId } = req.body;
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

      let user: any = null;
      let isUpgrade = false;
      const normalizedEmail = appleEmail ? String(appleEmail).toLowerCase().trim() : undefined;

      // 检查是否为游客用户升级
      if (guestUserId) {
        user = await User.findById(guestUserId);
        if (user && user.auth.loginType === 'guest') {
          isUpgrade = true;
          logger.info(`🍎 游客用户升级: ${guestUserId} -> Apple登录`);
        } else {
          return res.status(400).json({
            success: false,
            message: '无效的游客用户ID'
          });
        }
      } else {
        // 查找或创建用户：优先按 appleId，其次按 email 合并，避免 email 唯一索引冲突
        const orConds: any[] = [{ 'auth.appleId': appleId }];
        if (normalizedEmail) orConds.push({ email: normalizedEmail });

        user = await User.findOne({ $or: orConds });
      }

      if (!user) {
        // 创建新用户 - 使用Apple ID的真实信息
        const userData = {
          username: `apple_${appleId.slice(0, 8)}`,
          nickname,
          email: normalizedEmail, // 使用Apple提供的邮箱（规范化）
          auth: {
            loginType: 'apple',
            appleId,
            appleEmail: normalizedEmail,
            appleFullName: appleFullName,
            lastLoginAt: new Date(),
            isActive: true,
          },
          subscription: {
            type: 'free',
            isActive: false,
            startDate: new Date(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后过期（免费用户）
            autoRenew: false
          }
        };
        
        user = new User(userData);
        await user.save();
        logger.info(`🍎 创建新Apple用户: appleId=${appleId}, nickname=${nickname}, email=${appleEmail}`);
      } else if (isUpgrade) {
        // 升级现有游客用户
        const originalGuestId = user.auth.guestId;
        
        // 更新用户信息
        user.nickname = nickname;
        user.email = normalizedEmail;
        user.auth.loginType = 'apple';
        user.auth.appleId = appleId;
        user.auth.appleEmail = normalizedEmail;
        user.auth.appleFullName = appleFullName;
        user.auth.lastLoginAt = new Date();
        user.auth.isActive = true;
        
        // 设置升级状态
        user.upgradeStatus = {
          isUpgraded: true,
          originalGuestId: originalGuestId,
          upgradeDate: new Date(),
          upgradeType: 'apple'
        };
        
        await user.save();
        logger.info(`🍎 游客用户升级成功: ${user._id}, 原游客ID: ${originalGuestId}`);
      } else {
        // 更新现有用户信息 - 合并 appleId / email / 姓名
        const updateData: any = {
          'auth.lastLoginAt': new Date(),
          'auth.appleEmail': normalizedEmail,
          'auth.appleFullName': appleFullName
        };
        
        // 如果Apple提供了真实姓名，更新昵称
        if (nickname !== 'Apple用户' && nickname !== user.nickname) {
          updateData.nickname = nickname;
          logger.info(`🍎 更新用户昵称为Apple真实姓名: ${nickname}`);
        }
        
        // 绑定 appleId（若历史账号无 appleId）
        if (!user.auth.appleId) {
          updateData['auth.appleId'] = appleId;
        }

        // 如果Apple提供了邮箱，且当前用户无邮箱，则补全；若已有不同邮箱则保持现状，避免触发唯一索引异常
        if (normalizedEmail && !user.email) {
          updateData.email = normalizedEmail;
          logger.info(`🍎 绑定邮箱为Apple邮箱: ${normalizedEmail}`);
        }

        // 重要：保护用户已上传的头像，不要被重置
        // 苹果登录时不提供头像，如果用户之前上传过头像，应该保留
        if (user.avatar) {
          logger.info(`🍎 保留用户已上传的头像: ${user.avatar}`);
        } else {
          logger.info(`🍎 用户暂无头像，保持为null`);
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
        message: isUpgrade ? '游客用户升级成功' : 'Apple登录成功',
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
            isUpgraded: isUpgrade,
            originalGuestId: isUpgrade ? user.upgradeStatus?.originalGuestId : undefined,
          },
        },
      });
    } catch (error) {
      logger.error('Apple登录失败:', error);
      return res.status(500).json({ success: false, message: 'Apple登录失败' });
    }
  }
} 