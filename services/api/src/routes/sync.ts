import express from 'express';
import { SyncController } from '../controllers/syncController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

// 所有同步路由都需要认证
router.use(authenticateToken);

// 上传本地数据到云端
router.post('/upload',
  validateRequest({
    body: {
      learningRecords: { type: 'array', required: true },
      searchHistory: { type: 'array', required: false },
      userSettings: { type: 'object', required: false }
    }
  }),
  SyncController.uploadData
);

// 从云端下载数据
router.get('/download',
  SyncController.downloadData
);

// 强制同步（上传+下载）
router.post('/force',
  validateRequest({
    body: {
      learningRecords: { type: 'array', required: true },
      searchHistory: { type: 'array', required: false },
      userSettings: { type: 'object', required: false }
    }
  }),
  SyncController.forceSync
);

// 解决数据冲突
router.post('/resolve-conflicts',
  validateRequest({
    body: {
      conflicts: { type: 'array', required: true },
      resolution: { type: 'string', required: true, enum: ['local', 'remote', 'merge', 'manual'] }
    }
  }),
  SyncController.resolveConflicts
);

// 获取同步状态
router.get('/status',
  SyncController.getSyncStatus
);

// 获取同步历史
router.get('/history',
  validateRequest({
    query: {
      page: { type: 'number', required: false, min: 1 },
      limit: { type: 'number', required: false, min: 1, max: 100 }
    }
  }),
  SyncController.getSyncHistory
);

// 清理同步数据
router.delete('/cleanup',
  validateRequest({
    query: {
      days: { type: 'number', required: false, min: 1, max: 365 }
    }
  }),
  SyncController.cleanupSyncData
);

export default router; 