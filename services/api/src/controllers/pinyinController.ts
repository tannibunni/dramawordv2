import { Request, Response } from 'express';
import { PinyinMapping } from '../models/PinyinMapping';

// 获取拼音候选词 - 支持动态创建
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
    let mapping = await PinyinMapping.findOne({ pinyin: pinyin.toLowerCase() });
    
    // 如果没有找到，调用OpenAI生成候选词
    if (!mapping) {
      console.log(`🔍 拼音 "${pinyin}" 未找到，调用OpenAI生成候选词`);
      
      try {
        const candidates = await generatePinyinCandidatesWithAI(pinyin);
        
        if (candidates && candidates.length > 0) {
          // 保存到数据库
          mapping = new PinyinMapping({
            pinyin: pinyin.toLowerCase(),
            candidates: candidates
          });
          await mapping.save();
          console.log(`✅ 拼音 "${pinyin}" 候选词已保存到数据库`);
        } else {
          return res.status(404).json({
            success: false,
            error: '无法生成该拼音的候选词'
          });
        }
      } catch (aiError) {
        console.error('OpenAI生成拼音候选词失败:', aiError);
        return res.status(500).json({
          success: false,
          error: 'AI生成候选词失败'
        });
      }
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

// 使用OpenAI生成拼音候选词
async function generatePinyinCandidatesWithAI(pinyin: string): Promise<Array<{chinese: string, english: string, frequency: number}>> {
  const { OpenAI } = require('openai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `请为拼音 "${pinyin}" 生成3-5个最常用的中文字符候选词，按使用频率排序。

返回JSON格式：
{
  "candidates": [
    {"chinese": "最常用字符", "english": "英文释义", "frequency": 100},
    {"chinese": "次常用字符", "english": "英文释义", "frequency": 90},
    {"chinese": "第三常用字符", "english": "英文释义", "frequency": 80}
  ]
}

要求：
1. 只返回最常用的中文字符
2. 英文释义要准确简洁
3. frequency按100-60递减
4. 只返回JSON，不要其他内容`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.3
    });

    const response = completion.choices[0].message.content;
    const parsed = JSON.parse(response);
    
    if (parsed.candidates && Array.isArray(parsed.candidates)) {
      return parsed.candidates;
    } else {
      throw new Error('AI返回格式不正确');
    }
  } catch (error) {
    console.error('OpenAI调用失败:', error);
    throw error;
  }
}

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
