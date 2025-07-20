import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { WordFeedbackController } from '../controllers/wordFeedbackController';

const router = express.Router();

// 提交单词反馈
router.post('/feedback', authenticateToken, WordFeedbackController.submitFeedback);

// 获取单词反馈统计
router.get('/feedback/stats/:word', WordFeedbackController.getFeedbackStats);

// 获取用户对特定单词的反馈
router.get('/feedback/user/:word', authenticateToken, WordFeedbackController.getUserFeedback);

export default router; 