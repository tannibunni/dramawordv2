// 词典文件路由
import { Router } from 'express';
import DictionaryFileController from '../controllers/dictionaryFileController';

const router = Router();

/**
 * @route GET /api/dictionary/list
 * @desc 获取词典文件列表
 * @access Public
 */
router.get('/list', DictionaryFileController.getDictionaryList);

/**
 * @route GET /api/dictionary/info/:dictionaryId
 * @desc 获取词典文件信息
 * @access Public
 */
router.get('/info/:dictionaryId', DictionaryFileController.getDictionaryInfo);

/**
 * @route GET /api/dictionary/download/:dictionaryId
 * @desc 下载词典文件
 * @access Public
 */
router.get('/download/:dictionaryId', DictionaryFileController.downloadDictionary);

/**
 * @route POST /api/dictionary/upload/:dictionaryId
 * @desc 上传词典文件（管理员功能）
 * @access Private (需要管理员权限)
 */
router.post('/upload/:dictionaryId', DictionaryFileController.uploadDictionary);

export default router;
