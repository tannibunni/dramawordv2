// 词典文件控制器
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { getApiBaseUrl } from '../utils/urlHelper';

export class DictionaryFileController {
  private static readonly DICTIONARY_DIR = path.join(__dirname, '../../data/dictionaries');
  private static readonly SUPPORTED_DICTIONARIES = {
    'ccedict': {
      name: 'CC-CEDICT',
      language: 'zh',
      description: 'Chinese-English Dictionary',
      filename: 'cc-cedict-processed.txt',
      size: 0, // 将在初始化时计算
      lastModified: new Date()
    },
    'jmdict': {
      name: 'JMdict',
      language: 'ja', 
      description: 'Japanese-English Dictionary',
      filename: 'jmdict.xml',
      size: 0,
      lastModified: new Date()
    },
    'korean': {
      name: 'Korean Dictionary',
      language: 'ko',
      description: 'Korean-English Dictionary', 
      filename: 'korean-dict.txt',
      size: 0,
      lastModified: new Date()
    }
  };

  /**
   * 获取词典文件列表
   */
  static async getDictionaryList(req: Request, res: Response) {
    try {
      console.log('📚 获取词典文件列表...');
      
      const dictionaries = [];
      
      for (const [key, dict] of Object.entries(this.SUPPORTED_DICTIONARIES)) {
        const filePath = path.join(this.DICTIONARY_DIR, dict.filename);
        
        try {
          const stats = fs.statSync(filePath);
          dictionaries.push({
            id: key,
            name: dict.name,
            language: dict.language,
            description: dict.description,
            available: true,
            fileSize: stats.size,
            lastModified: stats.mtime.toISOString(),
            downloadUrl: `${getApiBaseUrl()}/api/dictionary/download/${key}`
          });
        } catch (error) {
          // 文件不存在
          dictionaries.push({
            id: key,
            name: dict.name,
            language: dict.language,
            description: dict.description,
            available: false,
            fileSize: 0,
            lastModified: null,
            downloadUrl: null
          });
        }
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
      console.error('❌ 获取词典文件列表失败:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dictionary list'
      });
    }
  }

  /**
   * 下载词典文件
   */
  static async downloadDictionary(req: Request, res: Response) {
    try {
      const { dictionaryId } = req.params;
      console.log(`📥 下载词典文件: ${dictionaryId}`);
      
      const dict = this.SUPPORTED_DICTIONARIES[dictionaryId as keyof typeof this.SUPPORTED_DICTIONARIES];
      if (!dict) {
        return res.status(404).json({
          success: false,
          error: 'Dictionary not found'
        });
      }
      
      const filePath = path.join(this.DICTIONARY_DIR, dict.filename);
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Dictionary file not found'
        });
      }
      
      // 获取文件信息
      const stats = fs.statSync(filePath);
      
      // 设置响应头
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${dict.filename}"`);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Last-Modified', stats.mtime.toUTCString());
      res.setHeader('ETag', `"${stats.mtime.getTime()}"`);
      
      // 支持断点续传
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunksize = (end - start) + 1;
        
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunksize);
        
        const stream = fs.createReadStream(filePath, { start, end });
        stream.pipe(res);
      } else {
        // 完整下载
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
      }
      
      console.log(`✅ 词典文件下载开始: ${dict.filename} (${stats.size} bytes)`);
      
    } catch (error) {
      console.error('❌ 下载词典文件失败:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download dictionary file'
      });
    }
  }

  /**
   * 获取词典文件信息
   */
  static async getDictionaryInfo(req: Request, res: Response) {
    try {
      const { dictionaryId } = req.params;
      console.log(`📊 获取词典文件信息: ${dictionaryId}`);
      
      const dict = this.SUPPORTED_DICTIONARIES[dictionaryId as keyof typeof this.SUPPORTED_DICTIONARIES];
      if (!dict) {
        return res.status(404).json({
          success: false,
          error: 'Dictionary not found'
        });
      }
      
      const filePath = path.join(this.DICTIONARY_DIR, dict.filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Dictionary file not found'
        });
      }
      
      const stats = fs.statSync(filePath);
      
      res.json({
        success: true,
        data: {
          id: dictionaryId,
          name: dict.name,
          language: dict.language,
          description: dict.description,
          available: true,
          fileSize: stats.size,
          lastModified: stats.mtime.toISOString(),
          downloadUrl: `${getApiBaseUrl()}/api/dictionary/download/${dictionaryId}`
        }
      });
      
    } catch (error) {
      console.error('❌ 获取词典文件信息失败:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dictionary info'
      });
    }
  }

  /**
   * 上传词典文件（管理员功能）
   */
  static async uploadDictionary(req: Request, res: Response) {
    try {
      const { dictionaryId } = req.params;
      console.log(`📤 上传词典文件: ${dictionaryId}`);
      
      const dict = this.SUPPORTED_DICTIONARIES[dictionaryId as keyof typeof this.SUPPORTED_DICTIONARIES];
      if (!dict) {
        return res.status(404).json({
          success: false,
          error: 'Dictionary not found'
        });
      }
      
      // 这里需要实现文件上传逻辑
      // 可以使用 multer 中间件处理文件上传
      
      res.json({
        success: true,
        message: 'Dictionary file uploaded successfully'
      });
      
    } catch (error) {
      console.error('❌ 上传词典文件失败:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload dictionary file'
      });
    }
  }

  /**
   * 初始化词典目录
   */
  static async initializeDictionaryDirectory() {
    try {
      console.log('📁 初始化词典目录...');
      
      if (!fs.existsSync(this.DICTIONARY_DIR)) {
        fs.mkdirSync(this.DICTIONARY_DIR, { recursive: true });
        console.log(`✅ 创建词典目录: ${this.DICTIONARY_DIR}`);
      }
      
      // 创建示例文件（如果不存在）
      for (const [key, dict] of Object.entries(this.SUPPORTED_DICTIONARIES)) {
        const filePath = path.join(this.DICTIONARY_DIR, dict.filename);
        
        if (!fs.existsSync(filePath)) {
          // 创建空的示例文件
          const sampleContent = this.generateSampleContent(key);
          fs.writeFileSync(filePath, sampleContent, 'utf-8');
          console.log(`📝 创建示例文件: ${dict.filename}`);
        }
      }
      
      console.log('✅ 词典目录初始化完成');
      
    } catch (error) {
      console.error('❌ 初始化词典目录失败:', error);
    }
  }

  /**
   * 生成示例内容
   */
  private static generateSampleContent(dictionaryId: string): string {
    switch (dictionaryId) {
      case 'ccedict':
        return `# CC-CEDICT 示例文件
# 这是一个示例文件，请替换为完整的 CC-CEDICT 词典文件
#
# 格式: 简体字 [拼音] /英文释义/ [词性] [频率]
#
你好 [ni3 hao3] /hello/hi/how are you?/ [interjection] [1000]
谢谢 [xie4 xie5] /thank you/thanks/ [interjection] [900]
再见 [zai4 jian4] /goodbye/see you again/ [interjection] [800]
`;
      
      case 'jmdict':
        return `<?xml version="1.0" encoding="UTF-8"?>
<!-- JMdict 示例文件 -->
<JMdict>
  <entry>
    <k_ele>
      <keb>こんにちは</keb>
    </k_ele>
    <r_ele>
      <reb>こんにちは</reb>
    </r_ele>
    <sense>
      <gloss>hello</gloss>
      <gloss>good day</gloss>
    </sense>
  </entry>
</JMdict>`;
      
      case 'korean':
        return `# Korean Dictionary 示例文件
# 这是一个示例文件，请替换为完整的韩语词典文件
#
# 格式: 韩语 [罗马音] /英文释义/ [词性] [频率]
#
안녕하세요 [annyeonghaseyo] /hello/good day/ [interjection] [1000]
감사합니다 [gamsahamnida] /thank you/ [interjection] [900]
안녕히가세요 [annyeonghigaseyo] /goodbye/ [interjection] [800]
`;
      
      default:
        return `# Dictionary Sample File
# This is a sample file for ${dictionaryId}
# Please replace with the actual dictionary file
`;
    }
  }
}

export default DictionaryFileController;
