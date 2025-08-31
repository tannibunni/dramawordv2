import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { UserLearningRecord } from '../models/UserLearningRecord';
import UserVocabulary from '../models/UserVocabulary';
import UserShowList from '../models/UserShowList';
import { SearchHistory } from '../models/SearchHistory';
import { generateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import { normalizeAvatarUrl, getApiBaseUrl } from '../utils/urlHelper';

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
        },
        // 为新用户提供免费的默认订阅
        subscription: {
          type: 'lifetime',
          isActive: true,
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100年后过期
          autoRenew: false
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

      // 确保头像URL使用正确的生产环境地址
      const avatarUrl = normalizeAvatarUrl(user.avatar);

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user: {
            id: user._id,
            username: user.username,
            nickname: user.nickname,
            avatar: avatarUrl,
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

      // 更新最后登录时间 - 使用 findOneAndUpdate 避免并行保存冲突
      await User.findByIdAndUpdate(
        user._id,
        { $set: { 'auth.lastLoginAt': new Date() } },
        { new: true }
      );

      // 生成JWT token
      const token = generateToken(user._id.toString());

      logger.info(`用户登录成功: ${user.username} (${loginType})`);

      // 确保头像URL使用正确的生产环境地址
      const avatarUrl = normalizeAvatarUrl(user.avatar);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: user._id,
            username: user.username,
            nickname: user.nickname,
            avatar: avatarUrl,
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

      // 确保头像URL使用正确的生产环境地址
      const avatarUrl = normalizeAvatarUrl(user.avatar);

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            nickname: user.nickname,
            avatar: avatarUrl,
            email: user.email,
            level: user.learningStats.level,
            levelName: (user as any).levelName,
            experience: user.learningStats.experience,
            experienceToNextLevel: (user as any).experienceToNextLevel,
            contributedWords: user.contributedWords,
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

      // 确保头像URL使用正确的生产环境地址
      const avatarUrl = normalizeAvatarUrl(user.avatar);

      res.json({
        success: true,
        message: '用户信息更新成功',
        data: {
          user: {
            id: user._id,
            username: user.username,
            nickname: user.nickname,
            avatar: avatarUrl,
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

  // 更新用户学习统计
  static async updateUserStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { totalReviews, collectedWords, contributedWords, currentStreak, experience, level, updateContinuousLearning } = req.body;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 更新学习统计
      const updateData: any = {};
      
      if (totalReviews !== undefined) {
        // 增加复习次数（累加模式）
        user.learningStats.totalReviews = (user.learningStats.totalReviews || 0) + totalReviews;
        updateData['learningStats.totalReviews'] = user.learningStats.totalReviews;
      }
      
      if (collectedWords !== undefined) {
        user.learningStats.totalWordsLearned = collectedWords;
        updateData['learningStats.totalWordsLearned'] = collectedWords;
      }
      
      if (contributedWords !== undefined) {
        user.contributedWords = contributedWords;
        updateData['contributedWords'] = contributedWords;
      }
      
      if (currentStreak !== undefined) {
        user.learningStats.currentStreak = currentStreak;
        updateData['learningStats.currentStreak'] = currentStreak;
      }
      
      if (experience !== undefined) {
        user.learningStats.experience = experience;
        updateData['learningStats.experience'] = experience;
      }
      
      if (level !== undefined) {
        user.learningStats.level = level;
        updateData['learningStats.level'] = level;
      }

      // 处理连续学习更新
      if (updateContinuousLearning) {
        // 更新连续学习天数
        await user.updateStudyStreak();
        
        // 添加连续学习奖励
        await user.addContinuousLearningReward();
        
        // 获取连续学习状态
        const continuousStatus = user.checkContinuousLearningStatus();
        
        updateData['learningStats.currentStreak'] = user.learningStats.currentStreak;
        updateData['learningStats.longestStreak'] = user.learningStats.longestStreak;
        updateData['learningStats.lastStudyDate'] = user.learningStats.lastStudyDate;
        updateData['continuousStatus'] = continuousStatus;
        
        logger.info(`连续学习更新成功: ${user.username}, 连续天数: ${user.learningStats.currentStreak}, 最长记录: ${user.learningStats.longestStreak}`);
      }

      // 使用 findOneAndUpdate 避免并行保存冲突
      await User.findByIdAndUpdate(
        user._id,
        { $set: updateData },
        { new: true }
      );

      logger.info(`用户学习统计更新成功: ${user.username}`, updateData);

      res.json({
        success: true,
        message: '学习统计更新成功',
        data: {
          learningStats: user.learningStats,
          continuousStatus: updateContinuousLearning ? user.checkContinuousLearningStatus() : null
        }
      });
    } catch (error) {
      logger.error('更新用户学习统计失败:', error);
      res.status(500).json({
        success: false,
        message: '更新学习统计失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 删除用户账号
  static async deleteAccount(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { confirmText } = req.body; // 确认文本验证

      // 验证确认文本
      if (confirmText !== '删除') {
        return res.status(400).json({
          success: false,
          message: '请输入正确的确认文本'
        });
      }

      // 查找用户
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      logger.info(`🗑️ 开始删除用户账号: ${userId}, username: ${user.username}`);

      // 删除用户相关数据
      const deletePromises = [
        // 删除用户基本信息
        User.findByIdAndDelete(userId),
        // 删除用户学习记录
        UserLearningRecord.deleteMany({ userId }),
        // 删除搜索历史
        SearchHistory.deleteMany({ userId }),
        // 删除用户词汇
        UserVocabulary.deleteMany({ userId }),
        // 删除用户剧集列表
        UserShowList.deleteMany({ userId })
      ];

      await Promise.all(deletePromises);

      logger.info(`✅ 用户账号删除成功: ${userId}, username: ${user.username}`);

      res.json({
        success: true,
        message: '账号删除成功',
        data: {
          deletedUserId: userId,
          deletedUsername: user.username
        }
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

  // 上传头像 - 改进版本
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

      // 获取用户当前头像信息
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 处理头像文件
      const { processAvatarFile, cleanupOldAvatar } = await import('../middleware/avatarUpload');
      await processAvatarFile(file.path);

      // 生成头像URL - 使用工具函数获取正确的base URL
      const baseUrl = getApiBaseUrl();
      const avatarUrl = `${baseUrl}/uploads/avatars/${file.filename}`;

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

      // 清理旧头像文件（异步执行，不阻塞响应）
      if (currentUser.avatar && currentUser.avatar !== avatarUrl) {
        cleanupOldAvatar(currentUser.avatar).catch(err => 
          logger.warn('清理旧头像文件失败:', err)
        );
      }

      logger.info(`用户头像上传成功: ${user.username}, 文件大小: ${(file.size / 1024).toFixed(2)}KB`);

      // 确保返回的头像URL使用正确的生产环境地址
      const normalizedAvatarUrl = normalizeAvatarUrl(user.avatar);

      return res.json({
        success: true,
        message: '头像上传成功',
        data: {
          avatar: normalizedAvatarUrl,
          user: {
            id: user._id,
            username: user.username,
            nickname: user.nickname,
            avatar: normalizedAvatarUrl,
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

  // 清除用户学习统计
  static async clearUserStats(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '用户ID是必需的'
        });
      }

      logger.info(`🗑️ 清除用户学习统计: ${userId}`);

      // 重置用户的学习统计
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            'learningStats.experience': 0,
            'learningStats.level': 1,
            'learningStats.currentStreak': 0,
            'learningStats.longestStreak': 0,
            'learningStats.lastStudyDate': null,
            'learningStats.totalStudyTime': 0,
            'learningStats.totalReviews': 0,
            'learningStats.accuracy': 0,
            'learningStats.masteredWords': 0,
            'learningStats.collectedWords': 0,
            'learningStats.contributedWords': 0
          }
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 清除用户学习记录
      const deletedRecords = await UserLearningRecord.deleteMany({ userId: userId });

      logger.info(`✅ 用户学习统计已清除: ${userId}, 删除了 ${deletedRecords.deletedCount} 条学习记录`);

      res.json({
        success: true,
        message: '用户学习统计清除成功',
        data: {
          userId: userId,
          deletedRecordsCount: deletedRecords.deletedCount
        }
      });
    } catch (error) {
      logger.error('❌ 清除用户学习统计失败:', error);
      res.status(500).json({
        success: false,
        message: '清除用户学习统计失败'
      });
    }
  }
} 