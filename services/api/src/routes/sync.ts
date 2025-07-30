import express from 'express';
import { SyncController } from '../controllers/syncController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 实时数据同步
router.post('/realtime', authenticateToken, SyncController.uploadData);

// 批量数据同步
router.post('/batch', authenticateToken, SyncController.uploadData);

// 缓存数据同步
router.post('/cache', authenticateToken, SyncController.uploadData);

// 获取同步状态
router.get('/status', authenticateToken, SyncController.getSyncStatus);

// 强制同步
router.post('/force', authenticateToken, SyncController.forceSync);

// 获取同步历史
router.get('/history', authenticateToken, SyncController.getSyncHistory);

export default router; 