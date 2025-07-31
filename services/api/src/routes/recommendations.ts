import express from 'express';
import { RecommendationController } from '../controllers/recommendationController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 公开接口 - 获取推荐内容
router.get('/', RecommendationController.getRecommendations);
router.get('/smart', RecommendationController.getSmartRecommendations);
router.get('/stats', RecommendationController.getRecommendationStats);
router.get('/:id', RecommendationController.getRecommendationById);

// 管理接口 - 需要认证
router.post('/', authenticateToken, RecommendationController.createRecommendation);
router.put('/:id', authenticateToken, RecommendationController.updateRecommendation);
router.delete('/:id', authenticateToken, RecommendationController.deleteRecommendation);
router.post('/batch-import', authenticateToken, RecommendationController.batchImportRecommendations);

export default router; 