"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const appleService_1 = require("../services/appleService");
const logger_1 = require("../utils/logger");
const JWT_SECRET = process.env.JWT_SECRET || 'dramaword_jwt_secret';
class AppleController {
    static async login(req, res) {
        try {
            const { idToken } = req.body;
            if (!idToken) {
                return res.status(400).json({ success: false, message: '缺少idToken' });
            }
            const appleUser = await appleService_1.AppleService.verifyIdToken(idToken);
            const { sub: appleId, email } = appleUser;
            let user = await User_1.User.findOne({ 'auth.appleId': appleId });
            if (!user) {
                user = new User_1.User({
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
            }
            else {
                user.auth.lastLoginAt = new Date();
                await user.save();
            }
            const token = jsonwebtoken_1.default.sign({ userId: user._id, username: user.username, loginType: 'apple' }, JWT_SECRET, { expiresIn: '7d' });
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
        }
        catch (error) {
            logger_1.logger.error('Apple登录失败:', error);
            return res.status(500).json({ success: false, message: 'Apple登录失败' });
        }
    }
}
exports.AppleController = AppleController;
