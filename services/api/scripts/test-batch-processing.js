// 批量处理性能测试脚本
const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// 测试数据生成
function generateTestData(dataType, count) {
  const data = [];
  
  for (let i = 0; i < count; i++) {
    switch (dataType) {
      case 'learningRecords':
        data.push({
          wordId: `word_${i}`,
          userId: `user_${i % 10}`, // 10个用户
          timestamp: Date.now() - Math.random() * 86400000, // 过去24小时
          correct: Math.random() > 0.3,
          timeSpent: Math.random() * 5000 + 1000, // 1-6秒
          difficulty: Math.floor(Math.random() * 5) + 1
        });
        break;
        
      case 'experience':
        data.push({
          userId: `user_${i % 10}`,
          xpGained: Math.floor(Math.random() * 50) + 10, // 10-60 XP
          source: ['learning', 'review', 'achievement'][Math.floor(Math.random() * 3)],
          timestamp: Date.now() - Math.random() * 3600000, // 过去1小时
          level: Math.floor(Math.random() * 20) + 1
        });
        break;
        
      case 'vocabulary':
        data.push({
          userId: `user_${i % 10}`,
          word: `test_word_${i}`,
          translation: `测试词汇_${i}`,
          difficulty: Math.floor(Math.random() * 5) + 1,
          addedAt: Date.now() - Math.random() * 604800000, // 过去一周
          lastReviewed: Date.now() - Math.random() * 86400000
        });
        break;
        
      case 'searchHistory':
        data.push({
          userId: `user_${i % 10}`,
          query: `search_query_${i}`,
          timestamp: Date.now() - Math.random() * 86400000,
          resultCount: Math.floor(Math.random() * 100) + 1,
          language: ['en', 'zh', 'ja'][Math.floor(Math.random() * 3)]
        });
        break;
        
      default:
        data.push({
          userId: `user_${i % 10}`,
          data: `test_data_${i}`,
          timestamp: Date.now()
        });
    }
  }
  
  return data;
}

// 测试批量处理
async function testBatchProcessing(dataType, batchSize, totalItems) {
  console.log(`🧪 开始测试批量处理: ${dataType}`);
  console.log(`📊 配置: 批量大小=${batchSize}, 总数据量=${totalItems}`);
  
  const testData = generateTestData(dataType, totalItems);
  const batches = Math.ceil(totalItems / batchSize);
  
  console.log(`📦 将分为 ${batches} 个批次处理`);
  
  const startTime = Date.now();
  const results = [];
  const errors = [];
  
  // 分批发送数据
  for (let i = 0; i < batches; i++) {
    const batchStart = i * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, totalItems);
    const batchData = testData.slice(batchStart, batchEnd);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/batch/${dataType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: batchData
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        results.push({
          batch: i + 1,
          items: batchData.length,
          queuedCount: result.data.queuedCount,
          queueLength: result.data.queueLength,
          estimatedTime: result.data.estimatedProcessingTime
        });
        
        console.log(`✅ 批次 ${i + 1}/${batches} 完成: ${batchData.length} 条数据`);
      } else {
        errors.push({
          batch: i + 1,
          error: result.message || '未知错误'
        });
        console.log(`❌ 批次 ${i + 1}/${batches} 失败: ${result.message}`);
      }
      
      // 批次间延迟
      if (i < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      errors.push({
        batch: i + 1,
        error: error.message
      });
      console.log(`❌ 批次 ${i + 1}/${batches} 异常: ${error.message}`);
    }
  }
  
  const totalTime = Date.now() - startTime;
  
  // 等待处理完成
  console.log(`⏳ 等待批量处理完成...`);
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 检查处理状态
  try {
    const statusResponse = await fetch(`${API_BASE_URL}/api/batch/status/${dataType}`);
    const statusResult = await statusResponse.json();
    
    if (statusResult.success) {
      console.log(`📊 处理状态:`, statusResult.data);
    }
  } catch (error) {
    console.log(`⚠️ 无法获取处理状态: ${error.message}`);
  }
  
  // 输出测试结果
  console.log(`\n📊 测试结果:`);
  console.log(`- 数据类型: ${dataType}`);
  console.log(`- 总数据量: ${totalItems}`);
  console.log(`- 批次数量: ${batches}`);
  console.log(`- 成功批次: ${results.length}`);
  console.log(`- 失败批次: ${errors.length}`);
  console.log(`- 总耗时: ${totalTime}ms`);
  console.log(`- 平均每批次耗时: ${(totalTime / batches).toFixed(2)}ms`);
  console.log(`- 平均每项耗时: ${(totalTime / totalItems).toFixed(2)}ms`);
  console.log(`- 吞吐量: ${(totalItems / (totalTime / 1000)).toFixed(2)} items/sec`);
  
  if (errors.length > 0) {
    console.log(`\n❌ 错误详情:`);
    errors.forEach(error => {
      console.log(`- 批次 ${error.batch}: ${error.error}`);
    });
  }
  
  return {
    dataType,
    totalItems,
    batches,
    successfulBatches: results.length,
    failedBatches: errors.length,
    totalTime,
    averageTimePerBatch: totalTime / batches,
    averageTimePerItem: totalTime / totalItems,
    throughput: totalItems / (totalTime / 1000),
    errors
  };
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始批量处理性能测试\n');
  
  const testConfigs = [
    { dataType: 'learningRecords', batchSize: 200, totalItems: 1000 },
    { dataType: 'experience', batchSize: 500, totalItems: 2000 },
    { dataType: 'vocabulary', batchSize: 100, totalItems: 500 },
    { dataType: 'searchHistory', batchSize: 300, totalItems: 1500 }
  ];
  
  const results = [];
  
  for (const config of testConfigs) {
    try {
      const result = await testBatchProcessing(config.dataType, config.batchSize, config.totalItems);
      results.push(result);
      
      // 测试间延迟
      console.log('\n⏳ 等待5秒后开始下一个测试...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error(`❌ 测试失败: ${config.dataType}`, error);
    }
  }
  
  // 输出总结
  console.log('\n🎯 测试总结:');
  console.log('='.repeat(80));
  
  results.forEach(result => {
    console.log(`\n📊 ${result.dataType}:`);
    console.log(`  - 总数据量: ${result.totalItems}`);
    console.log(`  - 成功批次: ${result.successfulBatches}/${result.batches}`);
    console.log(`  - 总耗时: ${result.totalTime}ms`);
    console.log(`  - 平均每项耗时: ${result.averageTimePerItem.toFixed(2)}ms`);
    console.log(`  - 吞吐量: ${result.throughput.toFixed(2)} items/sec`);
    console.log(`  - 成功率: ${((result.successfulBatches / result.batches) * 100).toFixed(2)}%`);
  });
  
  const totalItems = results.reduce((sum, r) => sum + r.totalItems, 0);
  const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
  const totalBatches = results.reduce((sum, r) => sum + r.batches, 0);
  const successfulBatches = results.reduce((sum, r) => sum + r.successfulBatches, 0);
  
  console.log(`\n🏆 总体性能:`);
  console.log(`  - 总数据量: ${totalItems}`);
  console.log(`  - 总批次: ${totalBatches}`);
  console.log(`  - 成功批次: ${successfulBatches}`);
  console.log(`  - 总耗时: ${totalTime}ms`);
  console.log(`  - 平均吞吐量: ${(totalItems / (totalTime / 1000)).toFixed(2)} items/sec`);
  console.log(`  - 总体成功率: ${((successfulBatches / totalBatches) * 100).toFixed(2)}%`);
  
  console.log('\n✅ 批量处理性能测试完成！');
}

// 运行测试
runAllTests().catch(console.error);
