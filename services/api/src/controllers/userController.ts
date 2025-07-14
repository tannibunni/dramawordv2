import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { UserLearningRecord } from '../models/UserLearningRecord';
import { SearchHistory } from '../models/SearchHistory';
import { generateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

// 用户控制器类
export class UserController {
  // 用户注册
  static async register(req: Request, res: Response) {
    try {
      const { username, nickname, loginType, phoneNumber, wechatId, appleId, guestId } = req.body;

      // 验证必填字段
      if (!username || !nickname || !loginType) {
        return res.status(400).json({
          success: false,
          message: '用户名、昵称和登录类型为必填项'
        });
      }

      // 检查用户名是否已存在
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        });
      }

      // 根据登录类型验证唯一标识
      let authQuery = {};
      switch (loginType) {
        case 'phone':
          if (!phoneNumber) {
            return res.status(400).json({
              success: false,
              message: '手机号登录需要提供手机号'
            });
          }
          authQuery = { 'auth.phoneNumber': phoneNumber };
          break;
        case 'wechat':
          if (!wechatId) {
            return res.status(400).json({
              success: false,
              message: '微信登录需要提供微信ID'
            });
          }
          authQuery = { 'auth.wechatId': wechatId };
          break;
        case 'apple':
          if (!appleId) {
            return res.status(400).json({
              success: false,
              message: 'Apple登录需要提供Apple ID'
            });
          }
          authQuery = { 'auth.appleId': appleId };
          break;
        case 'guest':
          if (!guestId) {
            return res.status(400).json({
              success: false,
              message: '游客登录需要提供游客ID'
            });
          }
          authQuery = { 'auth.guestId': guestId };
          break;
        default:
          return res.status(400).json({
            success: false,
            message: '不支持的登录类型'
          });
      }

      // 检查登录标识是否已存在
      const existingAuthUser = await User.findOne(authQuery);
      if (existingAuthUser) {
        return res.status(400).json({
          success: false,
          message: '该账号已存在'
        });
      }

      // 创建用户
      const userData: any = {
        username,
        nickname,
        auth: {
          loginType,
          lastLoginAt: new Date(),
          isActive: true
        }
      };

      // 设置对应的登录标识
      switch (loginType) {
        case 'phone':
          userData.auth.phoneNumber = phoneNumber;
          break;
        case 'wechat':
          userData.auth.wechatId = wechatId;
          break;
        case 'apple':
          userData.auth.appleId = appleId;
          break;
        case 'guest':
          userData.auth.guestId = guestId;
          break;
      }

      const user = new User(userData);
      await user.save();

      // 创建学习记录
      const learningRecord = new UserLearningRecord({
        userId: String(user._id),
        records: [],
        totalWords: 0,
        totalReviews: 0,
        averageMastery: 0,
        lastStudyDate: new Date()
      });
      await learningRecord.save();

      // 生成JWT token
      const token = generateToken(String(user._id));

      logger.info(`新用户注册成功: ${username} (${loginType})`);

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user: {
            id: user._id,
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            level: user.learningStats.level,
            levelName: (user as any).levelName || '初学者',
            experience: user.learningStats.experience,
            experienceToNextLevel: (user as any).experienceToNextLevel || 0
          },
          token
        }
      });
    } catch (error) {
      logger.error('用户注册失败:', error);
      res.status(500).json({
        success: false,
        message: '注册失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 用户登录
  static async login(req: Request, res: Response) {
    try {
      const { loginType, phoneNumber, wechatId, appleId, guestId } = req.body;

      if (!loginType) {
        return res.status(400).json({
          success: false,
          message: '登录类型为必填项'
        });
      }

      // 根据登录类型查找用户
      let user: IUser | null = null;
      switch (loginType) {
        case 'phone':
          if (!phoneNumber) {
            return res.status(400).json({
              success: false,
              message: '手机号登录需要提供手机号'
            });
          }
          user = await User.findOne({ 'auth.phoneNumber': phoneNumber });
          break;
        case 'wechat':
          if (!wechatId) {
            return res.status(400).json({
              success: false,
              message: '微信登录需要提供微信ID'
            });
          }
          user = await User.findOne({ 'auth.wechatId': wechatId });
          break;
        case 'apple':
          if (!appleId) {
            return res.status(400).json({
              success: false,
              message: 'Apple登录需要提供Apple ID'
            });
          }
          user = await User.findOne({ 'auth.appleId': appleId });
          break;
        case 'guest':
          if (!guestId) {
            return res.status(400).json({
              success: false,
              message: '游客登录需要提供游客ID'
            });
          }
          user = await User.findOne({ 'auth.guestId': guestId });
          break;
        default:
          return res.status(400).json({
            success: false,
            message: '不支持的登录类型'
          });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      if (!user.auth.isActive) {
        return res.status(403).json({
          success: false,
          message: '账号已被禁用'
        });
      }

      // 更新最后登录时间
      user.auth.lastLoginAt = new Date();
      await user.save();

      // 生成JWT token
      const token = generateToken(user._id.toString());

      logger.info(`用户登录成功: ${user.username} (${loginType})`);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: user._id,
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            level: user.learningStats.level,
            levelName: (user as any).levelName,
            experience: user.learningStats.experience,
            experienceToNextLevel: (user as any).experienceToNextLevel,
            learningStats: user.learningStats,
            settings: user.settings
          },
          token
        }
      });
    } catch (error) {
      logger.error('用户登录失败:', error);
      res.status(500).json({
        success: false,
        message: '登录失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取用户信息
  static async getUserInfo(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            email: user.email,
            level: user.learningStats.level,
            levelName: (user as any).levelName,
            experience: user.learningStats.experience,
            experienceToNextLevel: (user as any).experienceToNextLevel,
            learningStats: user.learningStats,
            settings: user.settings,
            auth: {
              loginType: user.auth.loginType,
              lastLoginAt: user.auth.lastLoginAt
            }
          }
        }
      });
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 更新用户信息
  static async updateUserInfo(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { nickname, avatar, email } = req.body;

      const updateData: any = {};
      if (nickname) updateData.nickname = nickname;
      if (avatar) updateData.avatar = avatar;
      if (email) updateData.email = email;

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      logger.info(`用户信息更新成功: ${user.username}`);

      res.json({
        success: true,
        message: '用户信息更新成功',
        data: {
          user: {
            id: user._id,
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            email: user.email
          }
        }
      });
    } catch (error) {
      logger.error('更新用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '更新用户信息失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 更新用户设置
  static async updateUserSettings(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { settings } = req.body;

      if (!settings) {
        return res.status(400).json({
          success: false,
          message: '设置数据为必填项'
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { settings },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      logger.info(`用户设置更新成功: ${user.username}`);

      res.json({
        success: true,
        message: '设置更新成功',
        data: {
          settings: user.settings
        }
      });
    } catch (error) {
      logger.error('更新用户设置失败:', error);
      res.status(500).json({
        success: false,
        message: '更新设置失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取用户学习统计
  static async getUserStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 获取学习记录统计
      const learningRecord = await UserLearningRecord.findOne({ userId });
      const searchHistory = await SearchHistory.find({ userId }).sort({ timestamp: -1 }).limit(10);

      const stats = {
        learningStats: user.learningStats,
        level: user.learningStats.level,
        levelName: (user as any).levelName,
        experience: user.learningStats.experience,
        experienceToNextLevel: (user as any).experienceToNextLevel,
        learningRecord: learningRecord ? {
          totalWords: learningRecord.totalWords,
          totalReviews: learningRecord.totalReviews,
          averageMastery: learningRecord.averageMastery,
          wordsToReview: (learningRecord as any).wordsToReview,
          masteredWords: (learningRecord as any).masteredWords,
          learningWords: (learningRecord as any).learningWords,
          newWords: (learningRecord as any).newWords,
          lastStudyDate: learningRecord.lastStudyDate
        } : null,
        recentSearchHistory: searchHistory
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('获取用户统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取统计失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 删除用户账号
  static async deleteAccount(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { password } = req.body; // 可以添加密码验证

      // 删除用户相关数据
      await User.findByIdAndDelete(userId);
      await UserLearningRecord.findOneAndDelete({ userId });
      await SearchHistory.deleteMany({ userId });

      logger.info(`用户账号删除成功: ${userId}`);

      res.json({
        success: true,
        message: '账号删除成功'
      });
    } catch (error) {
      logger.error('删除账号失败:', error);
      res.status(500).json({
        success: false,
        message: '删除账号失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 上传头像
  static async uploadAvatar(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的头像文件'
        });
      }

      // 生成头像URL
      const avatarUrl = `/uploads/avatars/${file.filename}`;

      // 更新用户头像
      const user = await User.findByIdAndUpdate(
        userId,
        { avatar: avatarUrl },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      logger.info(`用户头像上传成功: ${user.username}`);

      return res.json({
        success: true,
        message: '头像上传成功',
        data: {
          avatar: avatarUrl,
          user: {
            id: user._id,
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            email: user.email
          }
        }
      });
    } catch (error) {
      logger.error('上传头像失败:', error);
      return res.status(500).json({
        success: false,
        message: '上传头像失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 