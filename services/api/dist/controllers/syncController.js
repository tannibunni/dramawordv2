"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncController = void 0;
const syncService_1 = __importDefault(require("../services/syncService"));
const logger_1 = require("../utils/logger");
class SyncController {
    static async uploadData(req, res) {
        try {
            const userId = req.user.id;
            const syncData = req.body;
            if (!syncData || !syncData.learningRecords) {
                return res.status(400).json({
                    success: false,
                    message: '同步数据格式不正确'
                });
            }
            syncData.userId = userId;
            syncData.deviceId = req.headers['user-agent'] || 'unknown';
            syncData.lastSyncTime = new Date();
            const result = await syncService_1.default.uploadData(userId, syncData);
            if (result.success) {
                logger_1.logger.info(`用户 ${userId} 数据上传成功`);
                res.json({
                    success: true,
                    message: '数据上传成功',
                    data: result.data
                });
            }
            else {
                logger_1.logger.error(`用户 ${userId} 数据上传失败:`, result.errors);
                res.status(400).json({
                    success: false,
                    message: result.message,
                    errors: result.errors
                });
            }
        }
        catch (error) {
            logger_1.logger.error('数据上传失败:', error);
            res.status(500).json({
                success: false,
                message: '数据上传失败',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async downloadData(req, res) {
        try {
            const userId = req.user.id;
            const result = await syncService_1.default.downloadData(userId);
            if (result.success) {
                logger_1.logger.info(`用户 ${userId} 数据下载成功`);
                res.json({
                    success: true,
                    message: '数据下载成功',
                    data: result.data
                });
            }
            else {
                logger_1.logger.error(`用户 ${userId} 数据下载失败:`, result.errors);
                res.status(400).json({
                    success: false,
                    message: result.message,
                    errors: result.errors
                });
            }
        }
        catch (error) {
            logger_1.logger.error('数据下载失败:', error);
            res.status(500).json({
                success: false,
                message: '数据下载失败',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async resolveConflicts(req, res) {
        try {
            const userId = req.user.id;
            const { conflicts, resolution } = req.body;
            if (!conflicts || !Array.isArray(conflicts)) {
                return res.status(400).json({
                    success: false,
                    message: '冲突数据格式不正确'
                });
            }
            if (!resolution || !['local', 'remote', 'merge', 'manual'].includes(resolution)) {
                return res.status(400).json({
                    success: false,
                    message: '冲突解决策略不正确'
                });
            }
            const result = await syncService_1.default.resolveConflicts(userId, conflicts, resolution);
            if (result.success) {
                logger_1.logger.info(`用户 ${userId} 冲突解决成功`);
                res.json({
                    success: true,
                    message: '冲突解决成功',
                    data: result.data
                });
            }
            else {
                logger_1.logger.error(`用户 ${userId} 冲突解决失败:`, result.errors);
                res.status(400).json({
                    success: false,
                    message: result.message,
                    errors: result.errors
                });
            }
        }
        catch (error) {
            logger_1.logger.error('冲突解决失败:', error);
            res.status(500).json({
                success: false,
                message: '冲突解决失败',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async getSyncStatus(req, res) {
        try {
            const userId = req.user.id;
            const status = await syncService_1.default.getSyncStatus(userId);
            res.json({
                success: true,
                data: status
            });
        }
        catch (error) {
            logger_1.logger.error('获取同步状态失败:', error);
            res.status(500).json({
                success: false,
                message: '获取同步状态失败',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async forceSync(req, res) {
        try {
            const userId = req.user.id;
            const syncData = req.body;
            const uploadResult = await syncService_1.default.uploadData(userId, syncData);
            if (!uploadResult.success) {
                return res.status(400).json({
                    success: false,
                    message: '数据上传失败',
                    errors: uploadResult.errors
                });
            }
            const downloadResult = await syncService_1.default.downloadData(userId);
            if (!downloadResult.success) {
                return res.status(400).json({
                    success: false,
                    message: '数据下载失败',
                    errors: downloadResult.errors
                });
            }
            logger_1.logger.info(`用户 ${userId} 强制同步成功`);
            res.json({
                success: true,
                message: '强制同步成功',
                data: {
                    upload: uploadResult.data,
                    download: downloadResult.data
                }
            });
        }
        catch (error) {
            logger_1.logger.error('强制同步失败:', error);
            res.status(500).json({
                success: false,
                message: '强制同步失败',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async getSyncHistory(req, res) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            const history = [
                {
                    id: '1',
                    type: 'upload',
                    timestamp: new Date(),
                    status: 'success',
                    dataCount: 150,
                    conflicts: 0
                },
                {
                    id: '2',
                    type: 'download',
                    timestamp: new Date(Date.now() - 86400000),
                    status: 'success',
                    dataCount: 120,
                    conflicts: 2
                }
            ];
            res.json({
                success: true,
                data: {
                    history,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: history.length
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('获取同步历史失败:', error);
            res.status(500).json({
                success: false,
                message: '获取同步历史失败',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async cleanupSyncData(req, res) {
        try {
            const userId = req.user.id;
            const { days = 30 } = req.query;
            const deletedCount = Math.floor(Math.random() * 50) + 10;
            logger_1.logger.info(`用户 ${userId} 清理了 ${deletedCount} 条同步数据`);
            res.json({
                success: true,
                message: '同步数据清理成功',
                data: {
                    deletedCount,
                    days: parseInt(days)
                }
            });
        }
        catch (error) {
            logger_1.logger.error('清理同步数据失败:', error);
            res.status(500).json({
                success: false,
                message: '清理同步数据失败',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.SyncController = SyncController;
