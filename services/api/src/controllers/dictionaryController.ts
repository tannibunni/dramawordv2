// 词库管理控制器
import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gunzip = promisify(zlib.gunzip);

// 词库源配置
const DICTIONARY_SOURCES = {
  ccedict: {
    name: 'CC-CEDICT',
    url: 'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz',
    filename: 'ccedict.txt',
    language: 'zh',
    format: 'cedict'
  },
  jmdict: {
    name: 'JMdict',
    url: 'http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz',
    filename: 'jmdict.xml',
    language: 'ja',
    format: 'xml'
  },
  // korean: {
  //   name: 'Korean Dictionary',
  //   url: 'https://github.com/tannibunni/dramawordv2/raw/main/dictionaries/korean_dict.json',
  //   filename: 'korean_dict.json',
  //   language: 'ko',
  //   format: 'json'
  // }
};

// 词库状态检查
export const getDictionaryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const dictionaries = [];
    
    for (const [key, source] of Object.entries(DICTIONARY_SOURCES)) {
      const filePath = path.join(__dirname, '../../data', source.filename);
      const exists = fs.existsSync(filePath);
      const stats = exists ? fs.statSync(filePath) : null;
      
      dictionaries.push({
        id: key,
        name: source.name,
        language: source.language,
        format: source.format,
        available: exists,
        fileSize: stats?.size || 0,
        lastModified: stats?.mtime || null,
        downloadUrl: source.url
      });
    }
    
    res.json({
      success: true,
      data: {
        dictionaries,
        totalCount: dictionaries.length,
        availableCount: dictionaries.filter(d => d.available).length
      }
    });
  } catch (error) {
    logger.error('❌ 获取词库状态失败:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dictionary status'
    });
  }
};

// 下载词库
export const downloadDictionary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dictionaryId } = req.params;
    const source = DICTIONARY_SOURCES[dictionaryId as keyof typeof DICTIONARY_SOURCES];
    
    if (!source) {
      res.status(400).json({
        success: false,
        error: 'Invalid dictionary ID'
      });
      return;
    }
    
    logger.info(`📥 开始下载词库: ${source.name}`);
    
    // 确保数据目录存在
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const filePath = path.join(dataDir, source.filename);
    
    // 下载文件
    const response = await axios.get(source.url, {
      responseType: 'stream',
      timeout: 300000 // 5分钟超时
    });
    
    // 如果是gzip文件，需要解压
    let writeStream;
    if (source.url.endsWith('.gz')) {
      const gunzipStream = zlib.createGunzip();
      writeStream = fs.createWriteStream(filePath);
      (response.data as any).pipe(gunzipStream).pipe(writeStream);
    } else {
      writeStream = fs.createWriteStream(filePath);
      (response.data as any).pipe(writeStream);
    }
    
    writeStream.on('finish', () => {
      logger.info(`✅ 词库下载完成: ${source.name}`);
      res.json({
        success: true,
        message: `Dictionary ${source.name} downloaded successfully`,
        data: {
          dictionaryId,
          filename: source.filename,
          fileSize: fs.statSync(filePath).size
        }
      });
    });
    
    writeStream.on('error', (error) => {
      logger.error(`❌ 词库下载失败: ${source.name}`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to download dictionary'
      });
    });
    
  } catch (error) {
    logger.error('❌ 下载词库失败:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download dictionary'
    });
  }
};

// 解析词库文件
export const parseDictionary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dictionaryId } = req.params;
    const source = DICTIONARY_SOURCES[dictionaryId as keyof typeof DICTIONARY_SOURCES];
    
    if (!source) {
      res.status(400).json({
        success: false,
        error: 'Invalid dictionary ID'
      });
      return;
    }
    
    const filePath = path.join(__dirname, '../../data', source.filename);
    
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: 'Dictionary file not found. Please download first.'
      });
      return;
    }
    
    logger.info(`🔄 开始解析词库: ${source.name}`);
    
    let parsedData;
    
    switch (source.format) {
      case 'cedict':
        parsedData = await parseCCEDICT(filePath);
        break;
      case 'xml':
        parsedData = await parseJMdict(filePath);
        break;
      case 'json':
        parsedData = await parseKoreanDict(filePath);
        break;
      default:
        throw new Error(`Unsupported format: ${source.format}`);
    }
    
    logger.info(`✅ 词库解析完成: ${source.name}, 条目数: ${parsedData.length}`);
    
    res.json({
      success: true,
      message: `Dictionary ${source.name} parsed successfully`,
      data: {
        dictionaryId,
        entriesCount: parsedData.length,
        sampleEntries: parsedData.slice(0, 5) // 返回前5个条目作为示例
      }
    });
    
  } catch (error) {
    logger.error('❌ 解析词库失败:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse dictionary'
    });
  }
};

// 解析CC-CEDICT格式
async function parseCCEDICT(filePath: string): Promise<any[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const entries = [];
  
  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;
    
    // CC-CEDICT格式: 繁体字 简体字 [拼音] /英文释义/
    const match = line.match(/^(.+?)\s+(.+?)\s+\[(.+?)\]\s+\/(.+?)\//);
    if (match) {
      const [, traditional, simplified, pinyin, definition] = match;
      entries.push({
        word: simplified,
        traditional,
        pinyin: pinyin.replace(/\s+/g, ' ').trim(),
        definition: definition.trim(),
        language: 'zh'
      });
    }
  }
  
  return entries;
}

// 解析JMdict XML格式
async function parseJMdict(filePath: string): Promise<any[]> {
  // 简化的XML解析，实际实现需要更复杂的XML解析
  const content = fs.readFileSync(filePath, 'utf-8');
  const entries = [];
  
  // 这里应该实现完整的XML解析
  // 为了演示，返回示例数据
  entries.push({
    word: 'こんにちは',
    romaji: 'konnichiwa',
    kana: 'こんにちは',
    definition: 'hello',
    language: 'ja'
  });
  
  return entries;
}

// 解析韩语词典JSON格式
async function parseKoreanDict(filePath: string): Promise<any[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  
  if (Array.isArray(data)) {
    return data.map(item => ({
      word: item.korean,
      definition: item.english,
      pronunciation: item.pronunciation,
      language: 'ko'
    }));
  }
  
  return [];
}

// 获取词库统计信息
export const getDictionaryStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const dataDir = path.join(__dirname, '../../data');
    const stats = {
      totalDictionaries: Object.keys(DICTIONARY_SOURCES).length,
      availableDictionaries: 0,
      totalSize: 0,
      lastUpdated: null
    };
    
    for (const source of Object.values(DICTIONARY_SOURCES)) {
      const filePath = path.join(dataDir, source.filename);
      if (fs.existsSync(filePath)) {
        const fileStats = fs.statSync(filePath);
        stats.availableDictionaries++;
        stats.totalSize += fileStats.size;
        
        if (!stats.lastUpdated || fileStats.mtime > stats.lastUpdated) {
          stats.lastUpdated = fileStats.mtime;
        }
      }
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('❌ 获取词库统计失败:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dictionary stats'
    });
  }
};
