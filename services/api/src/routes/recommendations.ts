import express from 'express';
import { RecommendationController } from '../controllers/recommendationController';
import { auth } from '../middleware/auth';

const router = express.Router();

// 公开接口 - 获取推荐内容
router.get('/', RecommendationController.getRecommendations);
router.get('/smart', RecommendationController.getSmartRecommendations);
router.get('/stats', RecommendationController.getRecommendationStats);
router.get('/:id', RecommendationController.getRecommendationById);

// 管理接口 - 需要认证
router.post('/', auth, RecommendationController.createRecommendation);
router.put('/:id', auth, RecommendationController.updateRecommendation);
router.delete('/:id', auth, RecommendationController.deleteRecommendation);
router.post('/batch-import', auth, RecommendationController.batchImportRecommendations);

export default router; 