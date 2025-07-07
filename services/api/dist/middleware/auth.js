"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.optionalAuth = exports.authenticateToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};
exports.generateToken = generateToken;
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '访问令牌缺失'
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await User_1.User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
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
        req.user = {
            id: user._id.toString(),
            username: user.username
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Token验证失败:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: '无效的访问令牌'
            });
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: '访问令牌已过期'
            });
        }
        res.status(500).json({
            success: false,
            message: '认证失败'
        });
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            const user = await User_1.User.findById(decoded.id);
            if (user && user.auth.isActive) {
                req.user = {
                    id: user._id.toString(),
                    username: user.username
                };
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: '需要认证'
                });
            }
            const user = await User_1.User.findById(req.user.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: '用户不存在'
                });
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('权限检查失败:', error);
            res.status(500).json({
                success: false,
                message: '权限检查失败'
            });
        }
    };
};
exports.requireRole = requireRole;
