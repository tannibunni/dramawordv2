"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const User_1 = require("../models/User");
const UserLearningRecord_1 = require("../models/UserLearningRecord");
const SearchHistory_1 = require("../models/SearchHistory");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
class UserController {
    static async register(req, res) {
        try {
            const { username, nickname, loginType, phoneNumber, wechatId, appleId, guestId } = req.body;
            if (!username || !nickname || !loginType) {
                return res.status(400).json({
                    success: false,
                    message: '用户名、昵称和登录类型为必填项'
                });
            }
            const existingUser = await User_1.User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: '用户名已存在'
                });
            }
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
            const existingAuthUser = await User_1.User.findOne(authQuery);
            if (existingAuthUser) {
                return res.status(400).json({
                    success: false,
                    message: '该账号已存在'
                });
            }
            const userData = {
                username,
                nickname,
                auth: {
                    loginType,
                    lastLoginAt: new Date(),
                    isActive: true
                }
            };
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
            const user = new User_1.User(userData);
            await user.save();
            const learningRecord = new UserLearningRecord_1.UserLearningRecord({
                userId: String(user._id),
                records: [],
                totalWords: 0,
                totalReviews: 0,
                averageMastery: 0,
                lastStudyDate: new Date()
            });
            await learningRecord.save();
            const token = (0, auth_1.generateToken)(String(user._id));
            logger_1.logger.info(`新用户注册成功: ${username} (${loginType})`);
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
                        levelName: user.levelName || '初学者',
                        experience: user.learningStats.experience,
                        experienceToNextLevel: user.experienceToNextLevel || 0
                    },
                    token
                }
            });
        }
        catch (error) {
            logger_1.logger.error('用户注册失败:', error);
            res.status(500).json({
                success: false,
                message: '注册失败',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async login(req, res) {
        try {
            const { loginType, phoneNumber, wechatId, appleId, guestId } = req.body;
            if (!loginType) {
                return res.status(400).json({
                    success: false,
                    message: '登录类型为必填项'
                });
            }
            let user = null;
            switch (loginType) {
                case 'phone':
                    if (!phoneNumber) {
                        return res.status(400).json({
                            success: false,
                            message: '手机号登录需要提供手机号'
                        });
                    }
                    user = await User_1.User.findOne({ 'auth.phoneNumber': phoneNumber });
                    break;
                case 'wechat':
                    if (!wechatId) {
                        return res.status(400).json({
                            success: false,
                            message: '微信登录需要提供微信ID'
                        });
                    }
                    user = await User_1.User.findOne({ 'auth.wechatId': wechatId });
                    break;
                case 'apple':
                    if (!appleId) {
                        return res.status(400).json({
                            success: false,
                            message: 'Apple登录需要提供Apple ID'
                        });
                    }
                    user = await User_1.User.findOne({ 'auth.appleId': appleId });
                    break;
                case 'guest':
                    if (!guestId) {
                        return res.status(400).json({
                            success: false,
                            message: '游客登录需要提供游客ID'
                        });
                    }
                    user = await User_1.User.findOne({ 'auth.guestId': guestId });
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
            user.auth.lastLoginAt = new Date();
            await user.save();
            const token = (0, auth_1.generateToken)(user._id.toString());
            logger_1.logger.info(`用户登录成功: ${user.username} (${loginType})`);
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
                        levelName: user.levelName,
                        experience: user.learningStats.experience,
                        experienceToNextLevel: user.experienceToNextLevel,
                        learningStats: user.learningStats,
                        settings: user.settings
                    },
                    token
                }
            });
        }
        catch (error) {
            logger_1.logger.error('用户登录失败:', error);
            res.status(500).json({
                success: false,
                message: '登录失败',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async getUserInfo(req, res) {
        try {
            const userId = req.user.id;
            const user = await User_1.User.findById(userId);
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
                        levelName: user.levelName,
                        experience: user.learningStats.experience,
                        experienceToNextLevel: user.experienceToNextLevel,
                        learningStats: user.learningStats,
                        settings: user.settings,
                        auth: {
                            loginType: user.auth.loginType,
                            lastLoginAt: user.auth.lastLoginAt
                        }
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('获取用户信息失败:', error);
            res.status(500).json({
                success: false,
                message: '获取用户信息失败',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async updateUserInfo(req, res) {
        try {
            const userId = req.user.id;
            const { nickname, avatar, email } = req.body;
            const updateData = {};
            if (nickname)
                updateData.nickname = nickname;
            if (avatar)
                updateData.avatar = avatar;
            if (email)
                updateData.email = email;
            const user = await User_1.User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }
            logger_1.logger.info(`用户信息更新成功: ${user.username}`);
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
        }
        catch (error) {
            logger_1.logger.error('更新用户信息失败:', error);
            res.status(500).json({
                success: false,
                message: '更新用户信息失败',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async updateUserSettings(req, res) {
        try {
            const userId = req.user.id;
            const { settings } = req.body;
            if (!settings) {
                return res.status(400).json({
                    success: false,
                    message: '设置数据为必填项'
                });
            }
            const user = await User_1.User.findByIdAndUpdate(userId, { settings }, { new: true, runValidators: true });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }
            logger_1.logger.info(`用户设置更新成功: ${user.username}`);
            res.json({
                success: true,
                message: '设置更新成功',
                data: {
                    settings: user.settings
                }
            });
        }
        catch (error) {
            logger_1.logger.error('更新用户设置失败:', error);
            res.status(500).json({
                success: false,
                message: '更新设置失败',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async getUserStats(req, res) {
        try {
            const userId = req.user.id;
            const user = await User_1.User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }
            const learningRecord = await UserLearningRecord_1.UserLearningRecord.findOne({ userId });
            const searchHistory = await SearchHistory_1.SearchHistory.find({ userId }).sort({ timestamp: -1 }).limit(10);
            const stats = {
                learningStats: user.learningStats,
                level: user.learningStats.level,
                levelName: user.levelName,
                experience: user.learningStats.experience,
                experienceToNextLevel: user.experienceToNextLevel,
                learningRecord: learningRecord ? {
                    totalWords: learningRecord.totalWords,
                    totalReviews: learningRecord.totalReviews,
                    averageMastery: learningRecord.averageMastery,
                    wordsToReview: learningRecord.wordsToReview,
                    masteredWords: learningRecord.masteredWords,
                    learningWords: learningRecord.learningWords,
                    newWords: learningRecord.newWords,
                    lastStudyDate: learningRecord.lastStudyDate
                } : null,
                recentSearchHistory: searchHistory
            };
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            logger_1.logger.error('获取用户统计失败:', error);
            res.status(500).json({
                success: false,
                message: '获取统计失败',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async deleteAccount(req, res) {
        try {
            const userId = req.user.id;
            const { password } = req.body;
            await User_1.User.findByIdAndDelete(userId);
            await UserLearningRecord_1.UserLearningRecord.findOneAndDelete({ userId });
            await SearchHistory_1.SearchHistory.deleteMany({ userId });
            logger_1.logger.info(`用户账号删除成功: ${userId}`);
            res.json({
                success: true,
                message: '账号删除成功'
            });
        }
        catch (error) {
            logger_1.logger.error('删除账号失败:', error);
            res.status(500).json({
                success: false,
                message: '删除账号失败',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async uploadAvatar(req, res) {
        try {
            const userId = req.user.id;
            const file = req.file;
            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: '请选择要上传的头像文件'
                });
            }
            const avatarUrl = `/uploads/avatars/${file.filename}`;
            const user = await User_1.User.findByIdAndUpdate(userId, { avatar: avatarUrl }, { new: true });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }
            logger_1.logger.info(`用户头像上传成功: ${user.username}`);
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
        }
        catch (error) {
            logger_1.logger.error('上传头像失败:', error);
            return res.status(500).json({
                success: false,
                message: '上传头像失败',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.UserController = UserController;
