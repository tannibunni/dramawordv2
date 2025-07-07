"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WechatController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const wechatService_1 = require("../services/wechatService");
const logger_1 = require("../utils/logger");
const JWT_SECRET = process.env.JWT_SECRET || 'dramaword_jwt_secret';
class WechatController {
    static async login(req, res) {
        try {
            const { code, state } = req.body;
            if (!wechatService_1.WechatService.validateLoginParams(code)) {
                return res.status(400).json({
                    success: false,
                    message: '无效的授权码'
                });
            }
            if (state && !wechatService_1.WechatService.validateState(state)) {
                return res.status(400).json({
                    success: false,
                    message: '无效的状态参数'
                });
            }
            const wechatResult = await wechatService_1.WechatService.login(code);
            let user = await User_1.User.findOne({
                'auth.wechatOpenId': wechatResult.openid
            });
            if (!user) {
                const username = `wechat_${wechatResult.openid.substring(0, 8)}`;
                const nickname = wechatResult.userInfo.nickname || '微信用户';
                user = new User_1.User({
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
                logger_1.logger.info(`创建新微信用户: openid=${wechatResult.openid}, nickname=${nickname}`);
            }
            else {
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
                logger_1.logger.info(`更新微信用户信息: openid=${wechatResult.openid}`);
            }
            const token = jsonwebtoken_1.default.sign({
                userId: user._id,
                username: user.username,
                loginType: 'wechat'
            }, JWT_SECRET, { expiresIn: '7d' });
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
        }
        catch (error) {
            logger_1.logger.error('微信登录失败:', error);
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '微信登录失败'
            });
        }
    }
    static async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: '缺少refresh_token参数'
                });
            }
            const user = await User_1.User.findOne({
                'auth.wechatRefreshToken': refreshToken
            });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在或refresh_token无效'
                });
            }
            const wechatResult = await wechatService_1.WechatService.refreshAccessToken(refreshToken);
            user.auth.wechatAccessToken = wechatResult.access_token;
            user.auth.wechatRefreshToken = wechatResult.refresh_token;
            user.auth.wechatTokenExpiresAt = new Date(Date.now() + wechatResult.expires_in * 1000);
            user.auth.lastLoginAt = new Date();
            await user.save();
            const token = jsonwebtoken_1.default.sign({
                userId: user._id,
                username: user.username,
                loginType: 'wechat'
            }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({
                success: true,
                message: 'Token刷新成功',
                data: {
                    token,
                    refreshToken: wechatResult.refresh_token,
                    expiresIn: wechatResult.expires_in
                }
            });
        }
        catch (error) {
            logger_1.logger.error('刷新微信token失败:', error);
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : '刷新token失败'
            });
        }
    }
    static async checkToken(req, res) {
        try {
            const { accessToken, openid } = req.body;
            if (!accessToken || !openid) {
                return res.status(400).json({
                    success: false,
                    message: '缺少access_token或openid参数'
                });
            }
            const isValid = await wechatService_1.WechatService.checkAccessToken(accessToken, openid);
            return res.json({
                success: true,
                data: {
                    isValid
                }
            });
        }
        catch (error) {
            logger_1.logger.error('检查微信token失败:', error);
            return res.status(500).json({
                success: false,
                message: '检查token失败'
            });
        }
    }
    static async getAuthUrl(req, res) {
        try {
            const { redirectUri, state } = req.body;
            if (!redirectUri) {
                return res.status(400).json({
                    success: false,
                    message: '缺少redirect_uri参数'
                });
            }
            const authUrl = wechatService_1.WechatService.getAuthUrl(redirectUri, state);
            return res.json({
                success: true,
                data: {
                    authUrl,
                    state: state || wechatService_1.WechatService.generateState()
                }
            });
        }
        catch (error) {
            logger_1.logger.error('获取微信授权URL失败:', error);
            return res.status(500).json({
                success: false,
                message: '获取授权URL失败'
            });
        }
    }
    static async unbind(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: '未授权访问'
                });
            }
            const user = await User_1.User.findById(userId);
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
            user.auth.wechatId = null;
            user.auth.wechatOpenId = null;
            user.auth.wechatUnionId = null;
            user.auth.wechatNickname = null;
            user.auth.wechatAvatar = null;
            user.auth.wechatAccessToken = null;
            user.auth.wechatRefreshToken = null;
            user.auth.wechatTokenExpiresAt = null;
            await user.save();
            return res.json({
                success: true,
                message: '微信账号解绑成功'
            });
        }
        catch (error) {
            logger_1.logger.error('解绑微信账号失败:', error);
            return res.status(500).json({
                success: false,
                message: '解绑失败'
            });
        }
    }
}
exports.WechatController = WechatController;
//# sourceMappingURL=wechatController.js.map