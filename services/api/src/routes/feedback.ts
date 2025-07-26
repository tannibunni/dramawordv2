import express from 'express';
import { submitFeedback, getFeedbackStats } from '../controllers/feedbackController';

const router = express.Router();

// 提交反馈
router.post('/', submitFeedback);

// 获取反馈统计（可选，用于管理后台）
router.get('/stats', getFeedbackStats);

export default router; 