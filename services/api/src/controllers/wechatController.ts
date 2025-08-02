import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { WechatService } from '../services/wechatService';
import { logger } from '../utils/logger';

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'dramaword_jwt_secret';

// 微信登录控制器
export class WechatController {
  /**
   * 微信登录
   */
  static async login(req: Request, res: Response) {
    try {
      const { code, state } = req.body;

      // 添加调试日志
      logger.info(`💬 微信登录请求开始`);
      logger.info(`💬 接收到的 code: ${code ? code.substring(0, 10) + '...' : 'null'}`);
      logger.info(`💬 接收到的 state: ${state || 'null'}`);
      logger.info(`💬 环境变量检查 - WECHAT_APP_ID: ${process.env.WECHAT_APP_ID}`);
      logger.info(`💬 环境变量检查 - WECHAT_APP_SECRET: ${process.env.WECHAT_APP_SECRET ? '已设置' : '未设置'}`);

      // 验证参数
      if (!WechatService.validateLoginParams(code)) {
        logger.error(`💬 微信登录参数验证失败: code=${code}`);
        return res.status(400).json({
          success: false,
          message: '无效的授权码'
        });
      }

      // 验证state（可选）
      if (state && !WechatService.validateState(state)) {
        logger.error(`💬 微信登录状态验证失败: state=${state}`);
        return res.status(400).json({
          success: false,
          message: '无效的状态参数'
        });
      }

      logger.info(`💬 开始执行微信登录流程...`);
      
      // 执行微信登录
      const wechatResult = await WechatService.login(code);
      
      logger.info(`💬 微信登录成功，获取到用户信息: openid=${wechatResult.openid}`);
      logger.info(`💬 用户昵称: ${wechatResult.userInfo.nickname}`);
      logger.info(`💬 用户头像: ${wechatResult.userInfo.headimgurl ? '已获取' : '未获取'}`);
      
      // 查找或创建用户
      let user = await User.findOne({
        'auth.wechatOpenId': wechatResult.openid
      });

      if (!user) {
        // 创建新用户
        const username = `wechat_${wechatResult.openid.substring(0, 8)}`;
        const nickname = wechatResult.userInfo.nickname || '微信用户';
        
        logger.info(`💬 创建新微信用户: username=${username}, nickname=${nickname}`);
        
        user = new User({
          username,
          nickname,
          avatar: wechatResult.userInfo.headimgurl,
          auth: {
            loginType: 'wechat',
            wechatId: wechatResult.openid,
            wechatOpenId: wechatResult.openid,
            wechatUnionId: wechatResult.unionid,
            wechatNickname: wechatResult.userInfo.nickname,
            wechatAvatar: wechatResult.userInfo.headimgurl,
            wechatAccessToken: wechatResult.accessToken,
            wechatRefreshToken: wechatResult.refreshToken,
            wechatTokenExpiresAt: new Date(Date.now() + wechatResult.expires_in * 1000),
            lastLoginAt: new Date(),
            isActive: true
          }
        });

        await user.save();
        logger.info(`💬 新微信用户创建成功: openid=${wechatResult.openid}, nickname=${nickname}`);
      } else {
        // 更新现有用户信息
        const newNickname = wechatResult.userInfo.nickname || '微信用户';
        const newAvatar = wechatResult.userInfo.headimgurl;
        
        logger.info(`💬 更新现有微信用户: openid=${wechatResult.openid}`);
        logger.info(`💬 原昵称: ${user.nickname}, 新昵称: ${newNickname}`);
        logger.info(`💬 头像更新: ${newAvatar ? '是' : '否'}`);
        
        // 更新用户基本信息
        if (newNickname !== user.nickname) {
          user.nickname = newNickname;
        }
        if (newAvatar && newAvatar !== user.avatar) {
          user.avatar = newAvatar;
        }
        
        // 更新微信认证信息
        user.auth.wechatNickname = wechatResult.userInfo.nickname;
        user.auth.wechatAvatar = wechatResult.userInfo.headimgurl;
        user.auth.wechatAccessToken = wechatResult.accessToken;
        user.auth.wechatRefreshToken = wechatResult.refreshToken;
        user.auth.wechatTokenExpiresAt = new Date(Date.now() + wechatResult.expires_in * 1000);
        user.auth.lastLoginAt = new Date();
        
        if (wechatResult.unionid && !user.auth.wechatUnionId) {
          user.auth.wechatUnionId = wechatResult.unionid;
        }

        await user.save();
        logger.info(`💬 微信用户信息更新成功: openid=${wechatResult.openid}, nickname=${newNickname}`);
      }

      // 生成JWT token
      const token = jwt.sign(
        { 
          userId: user._id,
          username: user.username,
          loginType: 'wechat'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      logger.info(`💬 微信登录完成，生成JWT token: userId=${user._id}`);

      // 返回用户信息和token
      return res.json({
        success: true,
        message: '微信登录成功',
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            loginType: user.auth.loginType,
            learningStats: user.learningStats,
            settings: user.settings
          }
        }
      });

    } catch (error) {
      logger.error('💬 微信登录失败:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '微信登录失败'
      });
    }
  }

  /**
   * 刷新微信token
   */
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: '缺少refresh_token参数'
        });
      }

      // 查找用户
      const user = await User.findOne({
        'auth.wechatRefreshToken': refreshToken
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在或refresh_token无效'
        });
      }

      // 刷新微信token
      const wechatResult = await WechatService.refreshAccessToken(refreshToken);

      // 更新用户token信息
      user.auth.wechatAccessToken = wechatResult.access_token;
      user.auth.wechatRefreshToken = wechatResult.refresh_token;
      user.auth.wechatTokenExpiresAt = new Date(Date.now() + wechatResult.expires_in * 1000);
      user.auth.lastLoginAt = new Date();

      await user.save();

      // 生成新的JWT token
      const token = jwt.sign(
        { 
          userId: user._id,
          username: user.username,
          loginType: 'wechat'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Token刷新成功',
        data: {
          token,
          refreshToken: wechatResult.refresh_token,
          expiresIn: wechatResult.expires_in
        }
      });

    } catch (error) {
      logger.error('刷新微信token失败:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '刷新token失败'
      });
    }
  }

  /**
   * 检查微信token有效性
   */
  static async checkToken(req: Request, res: Response) {
    try {
      const { accessToken, openid } = req.body;

      if (!accessToken || !openid) {
        return res.status(400).json({
          success: false,
          message: '缺少access_token或openid参数'
        });
      }

      const isValid = await WechatService.checkAccessToken(accessToken, openid);

      return res.json({
        success: true,
        data: {
          isValid
        }
      });

    } catch (error) {
      logger.error('检查微信token失败:', error);
      return res.status(500).json({
        success: false,
        message: '检查token失败'
      });
    }
  }

  /**
   * 获取微信授权URL
   */
  static async getAuthUrl(req: Request, res: Response) {
    try {
      const { redirectUri, state } = req.body;

      if (!redirectUri) {
        return res.status(400).json({
          success: false,
          message: '缺少redirect_uri参数'
        });
      }

      const authUrl = WechatService.getAuthUrl(redirectUri, state);

      return res.json({
        success: true,
        data: {
          authUrl,
          state: state || WechatService.generateState()
        }
      });

    } catch (error) {
      logger.error('获取微信授权URL失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取授权URL失败'
      });
    }
  }

  /**
   * 解绑微信账号
   */
  static async unbind(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授权访问'
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      if (user.auth.loginType !== 'wechat') {
        return res.status(400).json({
          success: false,
          message: '当前账号不是微信登录'
        });
      }
      // 清除微信相关信息
      user.auth.wechatId = '';
      user.auth.wechatOpenId = '';
      user.auth.wechatUnionId = '';
      user.auth.wechatNickname = '';
      user.auth.wechatAvatar = '';
      user.auth.wechatAccessToken = '';
      user.auth.wechatRefreshToken = '';
      user.auth.wechatTokenExpiresAt = new Date(0);

      await user.save();

      return res.json({
        success: true,
        message: '微信账号解绑成功'
      });

    } catch (error) {
      logger.error('解绑微信账号失败:', error);
      return res.status(500).json({
        success: false,
        message: '解绑失败'
      });
    }
  }
} 