#!/usr/bin/env node

/**
 * CC-CEDICT 词典文件处理脚本
 * 用于下载、处理和准备中文词典文件
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 配置
const CONFIG = {
  // 词典文件下载URL
  downloadUrl: 'https://raw.githubusercontent.com/cc-cedict/cc-cedict/master/cedict_ts.u8',
  
  // 输出目录
  outputDir: path.join(__dirname, '../data/dictionaries'),
  
  // 输出文件名
  outputFile: 'cc-cedict.txt',
  
  // 处理选项
  options: {
    // 是否只保留常用词汇（基于频率）
    filterCommon: true,
    
    // 最大词汇数量（0表示不限制）
    maxEntries: 50000,
    
    // 是否包含繁体字
    includeTraditional: true,
    
    // 是否包含例句
    includeExamples: false
  }
};

class CCEDICTPreparer {
  constructor() {
    this.entries = [];
    this.stats = {
      total: 0,
      processed: 0,
      filtered: 0,
      errors: 0
    };
  }

  /**
   * 下载词典文件
   */
  async downloadDictionary() {
    console.log('📥 开始下载 CC-CEDICT 词典文件...');
    
    return new Promise((resolve, reject) => {
      const url = CONFIG.downloadUrl;
      const protocol = url.startsWith('https:') ? https : http;
      
      const request = protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`下载失败: ${response.statusCode}`));
          return;
        }

        // 确保输出目录存在
        if (!fs.existsSync(CONFIG.outputDir)) {
          fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        }

        const filePath = path.join(CONFIG.outputDir, CONFIG.outputFile);
        const fileStream = fs.createWriteStream(filePath);
        
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ 词典文件下载完成: ${filePath}`);
          resolve(filePath);
        });
        
        fileStream.on('error', (error) => {
          fs.unlink(filePath, () => {}); // 删除不完整的文件
          reject(error);
        });
      });
      
      request.on('error', reject);
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('下载超时'));
      });
    });
  }

  /**
   * 解析词典文件
   */
  async parseDictionary(filePath) {
    console.log('📖 开始解析词典文件...');
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      this.stats.total++;
      
      // 跳过注释行和空行
      if (line.startsWith('#') || line.trim() === '') {
        continue;
      }
      
      try {
        const entry = this.parseLine(line);
        if (entry) {
          this.entries.push(entry);
          this.stats.processed++;
        }
      } catch (error) {
        this.stats.errors++;
        console.warn(`⚠️ 解析行失败: ${line.substring(0, 50)}...`);
      }
    }
    
    console.log(`📊 解析完成: 总计 ${this.stats.total} 行，成功解析 ${this.stats.processed} 条词条`);
  }

  /**
   * 解析单行词典条目
   */
  parseLine(line) {
    // CC-CEDICT 格式: 繁体字 简体字 [拼音] /英文释义1/英文释义2/
    const match = line.match(/^(.+?)\s+(.+?)\s+\[(.+?)\]\s+\/(.+)\/$/);
    
    if (!match) {
      return null;
    }
    
    const [, traditional, simplified, pinyin, definitions] = match;
    
    // 清理拼音（移除数字声调标记）
    const cleanPinyin = pinyin.replace(/[0-9]/g, '').trim();
    
    // 分割英文释义
    const englishDefinitions = definitions.split('/').filter(def => def.trim());
    
    return {
      traditional: traditional.trim(),
      simplified: simplified.trim(),
      pinyin: cleanPinyin,
      pinyinWithTones: pinyin.trim(),
      definitions: englishDefinitions,
      // 添加词性信息（简单推断）
      partOfSpeech: this.inferPartOfSpeech(englishDefinitions[0]),
      // 添加频率信息（基于词条长度，简单估算）
      frequency: this.estimateFrequency(simplified, englishDefinitions[0])
    };
  }

  /**
   * 推断词性
   */
  inferPartOfSpeech(definition) {
    const def = definition.toLowerCase();
    
    if (def.includes('verb') || def.includes('v.') || def.includes('to ')) {
      return 'verb';
    } else if (def.includes('noun') || def.includes('n.') || def.includes('the ')) {
      return 'noun';
    } else if (def.includes('adjective') || def.includes('adj.') || def.includes('very ')) {
      return 'adjective';
    } else if (def.includes('adverb') || def.includes('adv.')) {
      return 'adverb';
    } else {
      return 'other';
    }
  }

  /**
   * 估算词频
   */
  estimateFrequency(simplified, definition) {
    // 简单的频率估算：基于字符长度和定义复杂度
    let frequency = 1000; // 基础频率
    
    // 短词通常更常用
    if (simplified.length <= 2) {
      frequency += 500;
    } else if (simplified.length <= 4) {
      frequency += 200;
    }
    
    // 简单定义通常更常用
    if (definition.length <= 20) {
      frequency += 300;
    }
    
    return frequency;
  }

  /**
   * 过滤和排序词条
   */
  filterAndSort() {
    console.log('🔍 开始过滤和排序词条...');
    
    let filtered = [...this.entries];
    
    // 按频率排序
    filtered.sort((a, b) => b.frequency - a.frequency);
    
    // 限制数量
    if (CONFIG.options.maxEntries > 0) {
      filtered = filtered.slice(0, CONFIG.options.maxEntries);
    }
    
    // 去重（基于简体字）
    const seen = new Set();
    filtered = filtered.filter(entry => {
      if (seen.has(entry.simplified)) {
        return false;
      }
      seen.add(entry.simplified);
      return true;
    });
    
    this.stats.filtered = filtered.length;
    this.entries = filtered;
    
    console.log(`📊 过滤完成: 保留 ${this.stats.filtered} 条词条`);
  }

  /**
   * 生成处理后的词典文件
   */
  async generateProcessedFile() {
    console.log('📝 生成处理后的词典文件...');
    
    const outputPath = path.join(CONFIG.outputDir, 'cc-cedict-processed.txt');
    
    let content = `# CC-CEDICT 处理后的中文词典文件
# 生成时间: ${new Date().toISOString()}
# 总词条数: ${this.entries.length}
# 处理统计: ${JSON.stringify(this.stats, null, 2)}
#
# 格式: 简体字 [拼音] /英文释义/ [词性] [频率]
#
`;

    for (const entry of this.entries) {
      const definitions = entry.definitions.join('/');
      content += `${entry.simplified} [${entry.pinyinWithTones}] /${definitions}/ [${entry.partOfSpeech}] [${entry.frequency}]\n`;
    }
    
    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`✅ 处理后的词典文件已生成: ${outputPath}`);
    
    return outputPath;
  }

  /**
   * 生成 JSON 格式的词典文件
   */
  async generateJsonFile() {
    console.log('📝 生成 JSON 格式的词典文件...');
    
    const outputPath = path.join(CONFIG.outputDir, 'cc-cedict.json');
    
    const jsonData = {
      metadata: {
        name: 'CC-CEDICT Chinese Dictionary',
        version: '1.0.0',
        language: 'zh',
        generatedAt: new Date().toISOString(),
        totalEntries: this.entries.length,
        stats: this.stats
      },
      entries: this.entries
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log(`✅ JSON 词典文件已生成: ${outputPath}`);
    
    return outputPath;
  }

  /**
   * 生成统计报告
   */
  generateReport() {
    console.log('\n📊 词典处理统计报告:');
    console.log('=' .repeat(50));
    console.log(`总行数: ${this.stats.total}`);
    console.log(`成功解析: ${this.stats.processed}`);
    console.log(`最终保留: ${this.stats.filtered}`);
    console.log(`解析错误: ${this.stats.errors}`);
    console.log(`成功率: ${((this.stats.processed / this.stats.total) * 100).toFixed(2)}%`);
    
    // 词性统计
    const posStats = {};
    this.entries.forEach(entry => {
      posStats[entry.partOfSpeech] = (posStats[entry.partOfSpeech] || 0) + 1;
    });
    
    console.log('\n词性分布:');
    Object.entries(posStats).forEach(([pos, count]) => {
      console.log(`  ${pos}: ${count} (${((count / this.entries.length) * 100).toFixed(1)}%)`);
    });
    
    // 长度统计
    const lengthStats = {};
    this.entries.forEach(entry => {
      const length = entry.simplified.length;
      lengthStats[length] = (lengthStats[length] || 0) + 1;
    });
    
    console.log('\n字符长度分布:');
    Object.entries(lengthStats)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([length, count]) => {
        console.log(`  ${length} 字符: ${count} (${((count / this.entries.length) * 100).toFixed(1)}%)`);
      });
  }

  /**
   * 运行完整的处理流程
   */
  async run() {
    try {
      console.log('🚀 开始处理 CC-CEDICT 词典文件...');
      console.log('=' .repeat(50));
      
      // 1. 下载词典文件
      const filePath = await this.downloadDictionary();
      
      // 2. 解析词典文件
      await this.parseDictionary(filePath);
      
      // 3. 过滤和排序
      this.filterAndSort();
      
      // 4. 生成处理后的文件
      await this.generateProcessedFile();
      
      // 5. 生成 JSON 文件
      await this.generateJsonFile();
      
      // 6. 生成统计报告
      this.generateReport();
      
      console.log('\n🎉 CC-CEDICT 词典文件处理完成！');
      
    } catch (error) {
      console.error('❌ 处理失败:', error);
      process.exit(1);
    }
  }
}

// 运行脚本
if (require.main === module) {
  const preparer = new CCEDICTPreparer();
  preparer.run();
}

module.exports = CCEDICTPreparer;
