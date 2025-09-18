// 直接翻译路由
import express from 'express';
import { directTranslate } from '../controllers/directTranslationController';

const router = express.Router();

// 直接翻译英文句子
router.post('/direct-translate', directTranslate);

export default router;
