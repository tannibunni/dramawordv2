import express from 'express';
import ShowWordController from '../controllers/showWordController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 获取剧集单词预览
router.get('/preview/:showId', ShowWordController.getShowPreview);

// 生成剧集单词包
router.post('/generate-package', authenticateToken, ShowWordController.generateWordPackage);

// 获取用户单词包列表
router.get('/user-packages/:userId', authenticateToken, ShowWordController.getUserWordPackages);

// 更新单词包学习进度
router.put('/update-progress', authenticateToken, ShowWordController.updatePackageProgress);

// 搜索剧集单词预览
router.get('/search', ShowWordController.searchShowPreviews);

// 获取热门剧集
router.get('/popular', ShowWordController.getPopularShows);

// 获取剧集单词统计列表
router.get('/shows', ShowWordController.getShowsWithWordCount);

// 获取指定剧集的单词列表
router.get('/words/:showId', ShowWordController.getShowWords);

// 创建或更新剧集单词预览（管理员）
router.post('/preview/:showId', authenticateToken, ShowWordController.createOrUpdatePreview);

export default router;
