# 📚 CC-CEDICT 中文词典文件设置指南

## 🎯 概述

本指南将帮助你完整设置 CC-CEDICT 格式的中文词典文件，实现离线中文词典功能。

## 📋 前置要求

### 系统要求
- Node.js 16+ 
- npm 或 yarn
- wget 或 curl（用于下载文件）
- macOS/Linux/Windows（支持 bash）

### 项目结构
```
dramawordv2/
├── scripts/
│   ├── prepare-ccedict.js      # 词典处理脚本
│   └── setup-dictionaries.sh   # 设置脚本
├── data/
│   └── dictionaries/           # 本地词典文件目录
├── services/api/
│   └── data/dictionaries/      # API 词典文件目录
└── apps/mobile/src/services/
    └── dictionaryFileService.ts # 客户端下载服务
```

## 🚀 快速开始

### 方法1：使用自动化脚本（推荐）

```bash
# 1. 进入项目根目录
cd /path/to/dramawordv2

# 2. 给脚本执行权限
chmod +x scripts/setup-dictionaries.sh

# 3. 运行设置脚本
./scripts/setup-dictionaries.sh
```

### 方法2：手动执行步骤

```bash
# 1. 创建目录
mkdir -p data/dictionaries
mkdir -p services/api/data/dictionaries

# 2. 下载原始文件
wget -O data/dictionaries/cc-cedict-raw.txt \
  https://raw.githubusercontent.com/cc-cedict/cc-cedict/master/cedict_ts.u8

# 3. 处理词典文件
cd scripts
node prepare-ccedict.js

# 4. 复制到 API 目录
cp data/dictionaries/cc-cedict-processed.txt services/api/data/dictionaries/
cp data/dictionaries/cc-cedict.json services/api/data/dictionaries/
```

## 📁 文件说明

### 生成的文件

| 文件名 | 位置 | 说明 |
|--------|------|------|
| `cc-cedict-raw.txt` | `data/dictionaries/` | 原始 CC-CEDICT 文件 |
| `cc-cedict-processed.txt` | `data/dictionaries/` | 处理后的词典文件 |
| `cc-cedict.json` | `data/dictionaries/` | JSON 格式词典文件 |
| `cc-cedict-processed.txt` | `services/api/data/dictionaries/` | API 服务使用的文件 |

### 文件格式

#### 处理后的词典文件格式
```
# CC-CEDICT 处理后的中文词典文件
# 生成时间: 2024-01-01T00:00:00.000Z
# 总词条数: 50000
#
# 格式: 简体字 [拼音] /英文释义/ [词性] [频率]
#
你好 [ni3 hao3] /hello/hi/how are you?/ [interjection] [1000]
谢谢 [xie4 xie5] /thank you/thanks/ [interjection] [900]
再见 [zai4 jian4] /goodbye/see you again/ [interjection] [800]
```

#### JSON 格式
```json
{
  "metadata": {
    "name": "CC-CEDICT Chinese Dictionary",
    "version": "1.0.0",
    "language": "zh",
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "totalEntries": 50000
  },
  "entries": [
    {
      "traditional": "你好",
      "simplified": "你好",
      "pinyin": "ni hao",
      "pinyinWithTones": "ni3 hao3",
      "definitions": ["hello", "hi", "how are you?"],
      "partOfSpeech": "interjection",
      "frequency": 1000
    }
  ]
}
```

## 🔧 配置选项

### 处理脚本配置

在 `scripts/prepare-ccedict.js` 中修改 `CONFIG` 对象：

```javascript
const CONFIG = {
  // 词典文件下载URL
  downloadUrl: 'https://raw.githubusercontent.com/cc-cedict/cc-cedict/master/cedict_ts.u8',
  
  // 输出目录
  outputDir: path.join(__dirname, '../data/dictionaries'),
  
  // 处理选项
  options: {
    // 是否只保留常用词汇
    filterCommon: true,
    
    // 最大词汇数量（0表示不限制）
    maxEntries: 50000,
    
    // 是否包含繁体字
    includeTraditional: true,
    
    // 是否包含例句
    includeExamples: false
  }
};
```

### API 服务配置

在 `services/api/src/controllers/dictionaryFileController.ts` 中修改：

```typescript
private static readonly SUPPORTED_DICTIONARIES = {
  'ccedict': {
    name: 'CC-CEDICT',
    language: 'zh',
    description: 'Chinese-English Dictionary',
    filename: 'cc-cedict-processed.txt',  // 修改文件名
    size: 0,
    lastModified: new Date()
  }
};
```

## 🧪 测试验证

### 1. 测试文件生成

```bash
# 检查文件是否存在
ls -la data/dictionaries/
ls -la services/api/data/dictionaries/

# 检查文件大小
du -h data/dictionaries/cc-cedict-processed.txt
```

### 2. 测试 API 服务

```bash
# 启动 API 服务器
cd services/api
npm start

# 测试词典列表接口
curl http://localhost:3000/api/dictionary/list

# 测试词典信息接口
curl http://localhost:3000/api/dictionary/info/ccedict
```

### 3. 测试客户端下载

在移动应用中：

```typescript
import DictionaryFileService from './services/dictionaryFileService';

const dictionaryService = DictionaryFileService.getInstance();

// 获取词典列表
const list = await dictionaryService.getDictionaryList();
console.log('词典列表:', list);

// 下载词典文件
const result = await dictionaryService.downloadDictionary('ccedict', (progress) => {
  console.log(`下载进度: ${progress.percentage.toFixed(1)}%`);
});
```

## 🔍 故障排除

### 常见问题

#### 1. 下载失败
```bash
# 检查网络连接
ping raw.githubusercontent.com

# 手动下载测试
curl -I https://raw.githubusercontent.com/cc-cedict/cc-cedict/master/cedict_ts.u8
```

#### 2. 文件处理失败
```bash
# 检查 Node.js 版本
node --version

# 检查文件权限
ls -la scripts/prepare-ccedict.js
chmod +x scripts/prepare-ccedict.js
```

#### 3. API 服务无法访问文件
```bash
# 检查文件路径
ls -la services/api/data/dictionaries/

# 检查 API 服务配置
grep -r "DICTIONARY_DIR" services/api/src/
```

#### 4. 移动端下载失败
```typescript
// 检查网络状态
import NetInfo from '@react-native-community/netinfo';
const netInfo = await NetInfo.fetch();
console.log('网络状态:', netInfo);

// 检查存储权限
import * as FileSystem from 'expo-file-system';
const info = await FileSystem.getInfoAsync(FileSystem.documentDirectory);
console.log('文档目录:', info);
```

### 调试模式

#### 启用详细日志
```bash
# 设置环境变量
export DEBUG=dictionary:*
export NODE_ENV=development

# 运行脚本
./scripts/setup-dictionaries.sh
```

#### 检查日志文件
```bash
# 查看处理日志
tail -f data/dictionaries/processing.log

# 查看 API 日志
tail -f services/api/logs/dictionary.log
```

## 📊 性能优化

### 文件大小优化

1. **减少词条数量**
   ```javascript
   options: {
     maxEntries: 30000,  // 减少到 3 万词条
     filterCommon: true  // 只保留常用词
   }
   ```

2. **压缩文件**
   ```bash
   # 压缩处理后的文件
   gzip data/dictionaries/cc-cedict-processed.txt
   ```

### 查询性能优化

1. **索引优化**
   ```javascript
   // 在 CCEDICTProvider 中添加索引
   await this.sqliteManager.createIndex('entries', 'simplified');
   await this.sqliteManager.createIndex('entries', 'pinyin');
   ```

2. **缓存优化**
   ```typescript
   // 在 HybridQueryService 中添加缓存
   private queryCache = new Map<string, any>();
   ```

## 🔄 更新维护

### 定期更新词典

```bash
# 创建更新脚本
cat > scripts/update-dictionaries.sh << 'EOF'
#!/bin/bash
echo "🔄 更新词典文件..."
./scripts/setup-dictionaries.sh
echo "✅ 词典更新完成"
EOF

chmod +x scripts/update-dictionaries.sh

# 设置定时任务（每周更新）
crontab -e
# 添加: 0 2 * * 0 /path/to/dramawordv2/scripts/update-dictionaries.sh
```

### 版本管理

```bash
# 备份当前版本
cp services/api/data/dictionaries/cc-cedict-processed.txt \
   services/api/data/dictionaries/cc-cedict-processed.txt.backup

# 版本标记
echo "v1.0.0-$(date +%Y%m%d)" > services/api/data/dictionaries/VERSION
```

## 📞 支持

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查项目日志文件
3. 提交 Issue 到项目仓库
4. 联系开发团队

---

**最后更新**: 2024年1月1日  
**版本**: 1.0.0
