import { Request, Response } from 'express';
import { PinyinMapping } from '../models/PinyinMapping';

// 获取拼音候选词
export const getPinyinCandidates = async (req: Request, res: Response) => {
  try {
    const { pinyin } = req.params;
    
    if (!pinyin) {
      return res.status(400).json({
        success: false,
        error: '拼音参数不能为空'
      });
    }

    // 从数据库查找拼音映射
    const mapping = await PinyinMapping.findOne({ pinyin: pinyin.toLowerCase() });
    
    if (!mapping) {
      return res.status(404).json({
        success: false,
        error: '未找到该拼音的候选词'
      });
    }

    // 按频率排序候选词
    const sortedCandidates = mapping.candidates
      .sort((a, b) => b.frequency - a.frequency)
      .map(candidate => ({
        chinese: candidate.chinese,
        english: candidate.english
      }));

    res.json({
      success: true,
      data: {
        pinyin: mapping.pinyin,
        candidates: sortedCandidates
      }
    });
  } catch (error) {
    console.error('获取拼音候选词错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
};

// 批量添加拼音映射（用于初始化数据）
export const addPinyinMappings = async (req: Request, res: Response) => {
  try {
    const { mappings } = req.body;
    
    if (!Array.isArray(mappings)) {
      return res.status(400).json({
        success: false,
        error: 'mappings必须是数组'
      });
    }

    const results = [];
    
    for (const mapping of mappings) {
      try {
        const existingMapping = await PinyinMapping.findOne({ pinyin: mapping.pinyin });
        
        if (existingMapping) {
          // 更新现有映射
          existingMapping.candidates = mapping.candidates;
          await existingMapping.save();
          results.push({ pinyin: mapping.pinyin, action: 'updated' });
        } else {
          // 创建新映射
          const newMapping = new PinyinMapping(mapping);
          await newMapping.save();
          results.push({ pinyin: mapping.pinyin, action: 'created' });
        }
      } catch (error) {
        results.push({ pinyin: mapping.pinyin, action: 'error', error: error.message });
      }
    }

    res.json({
      success: true,
      data: {
        processed: results.length,
        results
      }
    });
  } catch (error) {
    console.error('批量添加拼音映射错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
};

// 获取所有拼音映射（用于管理）
export const getAllPinyinMappings = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const mappings = await PinyinMapping.find()
      .sort({ pinyin: 1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await PinyinMapping.countDocuments();
    
    res.json({
      success: true,
      data: {
        mappings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取所有拼音映射错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
};
