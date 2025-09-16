const mongoose = require('mongoose');
require('dotenv').config();

// 拼音映射数据
const pinyinMappings = [
  {
    pinyin: 'bing',
    candidates: [
      { chinese: '病', english: 'illness; disease', frequency: 100 },
      { chinese: '冰', english: 'ice', frequency: 90 },
      { chinese: '兵', english: 'soldier', frequency: 80 },
      { chinese: '饼', english: 'cake; biscuit', frequency: 70 },
      { chinese: '并', english: 'and; also', frequency: 60 }
    ]
  },
  {
    pinyin: 'mao',
    candidates: [
      { chinese: '猫', english: 'cat', frequency: 100 },
      { chinese: '毛', english: 'hair; fur', frequency: 90 },
      { chinese: '矛', english: 'spear', frequency: 80 },
      { chinese: '茅', english: 'thatch', frequency: 70 },
      { chinese: '锚', english: 'anchor', frequency: 60 }
    ]
  },
  {
    pinyin: 'ma',
    candidates: [
      { chinese: '马', english: 'horse', frequency: 100 },
      { chinese: '妈', english: 'mom', frequency: 90 },
      { chinese: '麻', english: 'hemp; numb', frequency: 80 },
      { chinese: '骂', english: 'scold', frequency: 70 },
      { chinese: '码', english: 'code; yard', frequency: 60 }
    ]
  },
  {
    pinyin: 'li',
    candidates: [
      { chinese: '里', english: 'inside; mile', frequency: 100 },
      { chinese: '力', english: 'power; force', frequency: 90 },
      { chinese: '立', english: 'stand; establish', frequency: 80 },
      { chinese: '理', english: 'reason; manage', frequency: 70 },
      { chinese: '利', english: 'benefit; sharp', frequency: 60 }
    ]
  },
  {
    pinyin: 'shi',
    candidates: [
      { chinese: '是', english: 'be; yes', frequency: 100 },
      { chinese: '时', english: 'time', frequency: 90 },
      { chinese: '事', english: 'thing; matter', frequency: 80 },
      { chinese: '十', english: 'ten', frequency: 70 },
      { chinese: '石', english: 'stone', frequency: 60 }
    ]
  },
  {
    pinyin: 'yi',
    candidates: [
      { chinese: '一', english: 'one', frequency: 100 },
      { chinese: '以', english: 'with; by', frequency: 90 },
      { chinese: '已', english: 'already', frequency: 80 },
      { chinese: '意', english: 'meaning; intention', frequency: 70 },
      { chinese: '易', english: 'easy; change', frequency: 60 }
    ]
  },
  {
    pinyin: 'bu',
    candidates: [
      { chinese: '不', english: 'not; no', frequency: 100 },
      { chinese: '步', english: 'step', frequency: 90 },
      { chinese: '部', english: 'part; department', frequency: 80 },
      { chinese: '布', english: 'cloth', frequency: 70 },
      { chinese: '补', english: 'supplement; repair', frequency: 60 }
    ]
  },
  {
    pinyin: 'zhi',
    candidates: [
      { chinese: '之', english: 'of; it', frequency: 100 },
      { chinese: '知', english: 'know', frequency: 90 },
      { chinese: '直', english: 'straight; direct', frequency: 80 },
      { chinese: '只', english: 'only; measure word', frequency: 70 },
      { chinese: '指', english: 'finger; point', frequency: 60 }
    ]
  },
  {
    pinyin: 'you',
    candidates: [
      { chinese: '有', english: 'have; there is', frequency: 100 },
      { chinese: '又', english: 'again; also', frequency: 90 },
      { chinese: '右', english: 'right', frequency: 80 },
      { chinese: '由', english: 'from; because', frequency: 70 },
      { chinese: '油', english: 'oil', frequency: 60 }
    ]
  },
  {
    pinyin: 'he',
    candidates: [
      { chinese: '和', english: 'and; with', frequency: 100 },
      { chinese: '河', english: 'river', frequency: 90 },
      { chinese: '何', english: 'what; how', frequency: 80 },
      { chinese: '合', english: 'combine; fit', frequency: 70 },
      { chinese: '核', english: 'nucleus; core', frequency: 60 }
    ]
  },
  {
    pinyin: 'jiao lian',
    candidates: [
      { chinese: '教练', english: 'coach', frequency: 100 },
      { chinese: '铰链', english: 'chain', frequency: 90 },
      { chinese: '脚链', english: 'ankle chain', frequency: 80 },
      { chinese: '交联', english: 'crosslink', frequency: 70 }
    ]
  },
  {
    pinyin: 'mei shi',
    candidates: [
      { chinese: '美食', english: 'delicious food', frequency: 100 },
      { chinese: '没事', english: 'nothing', frequency: 90 },
      { chinese: '美事', english: 'good thing', frequency: 80 }
    ]
  },
  {
    pinyin: 'shi jian',
    candidates: [
      { chinese: '时间', english: 'time', frequency: 100 },
      { chinese: '事件', english: 'event', frequency: 90 },
      { chinese: '实践', english: 'practice', frequency: 80 },
      { chinese: '世间', english: 'world', frequency: 70 }
    ]
  }
];

// 连接数据库
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

// 初始化拼音映射数据
async function initPinyinMappings() {
  try {
    const PinyinMapping = mongoose.model('PinyinMapping', new mongoose.Schema({
      pinyin: { type: String, required: true, unique: true },
      candidates: [{
        chinese: { type: String, required: true },
        english: { type: String, required: true },
        frequency: { type: Number, default: 1 }
      }],
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }));

    console.log('🔄 开始初始化拼音映射数据...');
    
    for (const mapping of pinyinMappings) {
      try {
        const existing = await PinyinMapping.findOne({ pinyin: mapping.pinyin });
        if (existing) {
          console.log(`⚠️  拼音 "${mapping.pinyin}" 已存在，跳过`);
          continue;
        }
        
        const newMapping = new PinyinMapping(mapping);
        await newMapping.save();
        console.log(`✅ 已添加拼音映射: ${mapping.pinyin}`);
      } catch (error) {
        console.error(`❌ 添加拼音映射失败 "${mapping.pinyin}":`, error.message);
      }
    }
    
    console.log('🎉 拼音映射数据初始化完成！');
  } catch (error) {
    console.error('❌ 初始化拼音映射数据失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 数据库连接已关闭');
  }
}

// 主函数
async function main() {
  await connectDB();
  await initPinyinMappings();
}

main().catch(console.error);
