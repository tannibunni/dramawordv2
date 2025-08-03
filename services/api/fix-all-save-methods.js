const fs = require('fs');
const path = require('path');

// 需要修复的文件列表
const filesToFix = [
  'services/api/src/controllers/userController.ts',
  'services/api/src/controllers/authController.ts', 
  'services/api/src/controllers/wechatController.ts',
  'services/api/src/controllers/wordController.ts',
  'services/api/src/controllers/userShowListController.ts',
  'services/api/src/controllers/feedbackController.ts',
  'services/api/src/services/paymentService.ts',
  'services/api/src/controllers/recommendationController.ts'
];

console.log('🔧 修复所有可能导致ParallelSaveError的save()方法...');
console.log('='.repeat(60));

// 修复策略
const fixStrategies = {
  // 用户相关的save()调用
  'user.save()': {
    pattern: /await user\.save\(\)/g,
    replacement: `await User.findByIdAndUpdate(
            user._id,
            { $set: updateData },
            { new: true }
          )`,
    context: '用户更新操作'
  },
  
  // 学习记录相关的save()调用
  'learningRecord.save()': {
    pattern: /await learningRecord\.save\(\)/g,
    replacement: `await UserLearningRecord.findByIdAndUpdate(
            learningRecord._id,
            { $set: learningRecordData },
            { new: true }
          )`,
    context: '学习记录更新'
  },
  
  // 支付相关的save()调用
  'payment.save()': {
    pattern: /await payment\.save\(\)/g,
    replacement: `await Payment.findByIdAndUpdate(
            payment._id,
            { $set: paymentData },
            { new: true }
          )`,
    context: '支付记录更新'
  },
  
  // 推荐相关的save()调用
  'recommendation.save()': {
    pattern: /await recommendation\.save\(\)/g,
    replacement: `await Recommendation.findByIdAndUpdate(
            recommendation._id,
            { $set: recommendationData },
            { new: true }
          )`,
    context: '推荐记录更新'
  },
  
  // 反馈相关的save()调用
  'newFeedback.save()': {
    pattern: /await newFeedback\.save\(\)/g,
    replacement: `await Feedback.findByIdAndUpdate(
            newFeedback._id,
            { $set: feedbackData },
            { new: true }
          )`,
    context: '反馈记录更新'
  },
  
  // 词汇相关的save()调用
  'userVocabulary.save()': {
    pattern: /await userVocabulary\.save\(\)/g,
    replacement: `await UserVocabulary.findByIdAndUpdate(
            userVocabulary._id,
            { $set: vocabularyData },
            { new: true }
          )`,
    context: '用户词汇更新'
  },
  
  // 搜索历史相关的save()调用
  'searchHistory.save()': {
    pattern: /await searchHistory\.save\(\)/g,
    replacement: `await SearchHistory.findByIdAndUpdate(
            searchHistory._id,
            { $set: historyData },
            { new: true }
          )`,
    context: '搜索历史更新'
  },
  
  // 云词相关的save()调用
  'cloudWord.save()': {
    pattern: /await cloudWord\.save\(\)/g,
    replacement: `await CloudWord.findByIdAndUpdate(
            cloudWord._id,
            { $set: wordData },
            { new: true }
          )`,
    context: '云词更新'
  }
};

// 检查文件是否存在
function checkFiles() {
  console.log('\n📋 检查需要修复的文件:');
  console.log('='.repeat(40));
  
  const existingFiles = [];
  const missingFiles = [];
  
  for (const file of filesToFix) {
    if (fs.existsSync(file)) {
      existingFiles.push(file);
      console.log(`✅ ${file}`);
    } else {
      missingFiles.push(file);
      console.log(`❌ ${file} (不存在)`);
    }
  }
  
  console.log(`\n📊 文件状态:`);
  console.log(`   存在: ${existingFiles.length} 个`);
  console.log(`   缺失: ${missingFiles.length} 个`);
  
  return existingFiles;
}

// 分析文件中的save()调用
function analyzeSaveCalls(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const saveCalls = [];
    
    lines.forEach((line, index) => {
      if (line.includes('.save()')) {
        saveCalls.push({
          line: index + 1,
          content: line.trim(),
          context: lines.slice(Math.max(0, index - 2), index + 3).join('\n')
        });
      }
    });
    
    return saveCalls;
  } catch (error) {
    console.error(`❌ 读取文件失败: ${filePath}`, error.message);
    return [];
  }
}

// 生成修复建议
function generateFixSuggestions() {
  console.log('\n💡 修复建议:');
  console.log('='.repeat(30));
  
  console.log('1. 新用户创建: 保留 save() 调用');
  console.log('   - 新用户创建时使用 save() 是安全的');
  console.log('   - 例如: const user = new User(userData); await user.save();');
  
  console.log('\n2. 用户更新: 替换为 findOneAndUpdate');
  console.log('   - 更新现有用户时使用 findOneAndUpdate');
  console.log('   - 避免并行保存冲突');
  
  console.log('\n3. 学习记录更新: 使用原子操作');
  console.log('   - 使用 findOneAndUpdate 或聚合管道');
  console.log('   - 确保数据一致性');
  
  console.log('\n4. 其他模型更新: 统一使用 findOneAndUpdate');
  console.log('   - 支付记录、推荐、反馈等');
  console.log('   - 避免并发问题');
}

// 主函数
function main() {
  console.log('🚀 分析并修复ParallelSaveError问题...');
  
  // 检查文件
  const existingFiles = checkFiles();
  
  if (existingFiles.length === 0) {
    console.log('\n❌ 没有找到需要修复的文件');
    return;
  }
  
  // 分析每个文件
  console.log('\n🔍 分析文件中的save()调用:');
  console.log('='.repeat(40));
  
  let totalSaveCalls = 0;
  
  for (const file of existingFiles) {
    const saveCalls = analyzeSaveCalls(file);
    totalSaveCalls += saveCalls.length;
    
    if (saveCalls.length > 0) {
      console.log(`\n📄 ${file}:`);
      saveCalls.forEach(call => {
        console.log(`   第${call.line}行: ${call.content}`);
      });
    }
  }
  
  console.log(`\n📊 总计发现 ${totalSaveCalls} 个save()调用`);
  
  // 生成修复建议
  generateFixSuggestions();
  
  console.log('\n✅ 分析完成！');
  console.log('\n📝 下一步操作:');
  console.log('1. 手动检查每个save()调用的上下文');
  console.log('2. 确定哪些是安全的（新对象创建）');
  console.log('3. 将不安全的更新操作替换为findOneAndUpdate');
  console.log('4. 测试修复后的功能');
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  checkFiles,
  analyzeSaveCalls,
  generateFixSuggestions
}; 