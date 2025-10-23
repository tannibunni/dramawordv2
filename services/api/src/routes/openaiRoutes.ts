import express from 'express';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const router = express.Router();

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 获取prompt模板
 */
function getPromptTemplate(inputType: string, uiLanguage: string = 'en', targetLanguage: string = 'zh-CN'): string {
  try {
    const promptPath = path.join(__dirname, '../../prompts', uiLanguage, `${targetLanguage}.json`);
    
    if (!fs.existsSync(promptPath)) {
      logger.warn(`⚠️ Prompt文件不存在: ${promptPath}`);
      return getDefaultPrompt(inputType);
    }
    
    const promptData = JSON.parse(fs.readFileSync(promptPath, 'utf8'));
    const promptKey = getPromptKey(inputType);
    
    if (!promptData[promptKey]) {
      logger.warn(`⚠️ Prompt键不存在: ${promptKey} in ${promptPath}`);
      return getDefaultPrompt(inputType);
    }
    
    return promptData[promptKey];
  } catch (error) {
    logger.error(`❌ 读取prompt失败:`, error);
    return getDefaultPrompt(inputType);
  }
}

/**
 * 根据输入类型获取prompt键
 */
function getPromptKey(inputType: string): string {
  const keyMap: { [key: string]: string } = {
    'pinyin': 'pinyin_to_chinese',
    'english': 'english_to_chinese',
    'english_sentence': 'english_sentence_to_chinese',
    'chinese': 'chinese_to_english',
    'chinese_sentence': 'chinese_sentence_to_english',
    'general': 'general_translation'
  };
  
  return keyMap[inputType] || 'general_translation';
}

/**
 * 获取默认prompt
 */
function getDefaultPrompt(inputType: string): string {
  const defaultPrompts: { [key: string]: string } = {
    'pinyin': '将拼音转换为中文词汇，提供3-5个常用候选词',
    'english': '将英文单词翻译成中文，提供主要释义',
    'english_sentence': '将英文句子翻译成中文，提供自然流畅的翻译',
    'chinese': '提供中文词汇的英文释义和例句',
    'chinese_sentence': '将中文句子翻译成英文，提供自然流畅的翻译',
    'general': '根据输入类型提供适当的翻译或释义'
  };
  
  return defaultPrompts[inputType] || '提供翻译或释义';
}

/**
 * OpenAI聊天端点
 * POST /api/openai/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const { prompt, model = 'gpt-4o-mini', max_tokens = 200, inputType = 'general', uiLanguage = 'en', targetLanguage = 'zh-CN' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: prompt'
      });
    }
    
    logger.info(`🤖 OpenAI请求: ${prompt} (${inputType})`);
    
    // 获取智能prompt模板
    const systemPrompt = getPromptTemplate(inputType, uiLanguage, targetLanguage);
    const fullPrompt = systemPrompt.replace('{word}', prompt);
    
    logger.info(`📝 系统prompt: ${systemPrompt.substring(0, 100)}...`);
    logger.info(`📝 完整prompt: ${fullPrompt.substring(0, 200)}...`);
    
    // 调用OpenAI API
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: max_tokens
    });
    
    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }
    
    logger.info(`✅ OpenAI响应: ${responseText.substring(0, 100)}...`);
    
    // 尝试解析JSON响应
    let parsedResponse;
    try {
      // 清理响应文本
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '');
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/\s*```$/, '');
      }
      
      // 清理控制字符
      cleanedResponse = cleanedResponse.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      logger.warn(`⚠️ JSON解析失败，返回原始文本:`, parseError);
      parsedResponse = {
        translation: responseText,
        text: responseText
      };
    }
    
    res.json({
      success: true,
      data: parsedResponse,
      usage: completion.usage,
      model: completion.model
    });
    
  } catch (error) {
    logger.error('❌ OpenAI API错误:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'OpenAI API调用失败'
    });
  }
});

/**
 * OpenAI健康检查端点
 * GET /api/openai/health
 */
router.get('/health', async (req, res) => {
  try {
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    
    if (!hasOpenAIKey) {
      return res.json({
        status: 'error',
        service: 'openai',
        error: 'OPENAI_API_KEY not configured'
      });
    }
    
    // 简单测试连接
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5
    });
    
    res.json({
      status: 'ok',
      service: 'openai',
      model: completion.model,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'openai',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
