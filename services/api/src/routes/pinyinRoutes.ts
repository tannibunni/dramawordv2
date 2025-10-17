import express from 'express';
import { getPinyinCandidates, addPinyinMappings, getAllPinyinMappings, deletePinyinMapping } from '../controllers/pinyinController';

const router = express.Router();

// 获取拼音候选词
router.get('/candidates/:pinyin', getPinyinCandidates);

// 批量添加拼音映射（管理员功能）
router.post('/mappings', addPinyinMappings);

// 获取所有拼音映射（管理员功能）
router.get('/mappings', getAllPinyinMappings);

// 删除拼音映射（管理员功能，用于重新生成候选词）
router.delete('/mappings/:pinyin', deletePinyinMapping);

export default router;
