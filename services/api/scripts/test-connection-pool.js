const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dramaword';

async function testConnectionPool() {
  try {
    console.log('🧪 开始连接池性能测试...');
    
    // 连接数据库 - 使用兼容的选项
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 20,
      minPoolSize: 5,
      maxConnecting: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 10000,
      maxIdleTimeMS: 60000,
      retryWrites: true,
      retryReads: true,
      compressors: ['zlib'],
      zlibCompressionLevel: 6,
      heartbeatFrequencyMS: 10000,
      readPreference: 'primary',
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 10000
      }
    });
    
    console.log('✅ 数据库连接成功');
    
    // 测试并发连接
    const concurrentConnections = 50;
    const promises = [];
    
    for (let i = 0; i < concurrentConnections; i++) {
      promises.push(testSingleConnection(i));
    }
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    console.log(`📊 测试结果:`);
    console.log(`- 并发连接数: ${concurrentConnections}`);
    console.log(`- 总耗时: ${endTime - startTime}ms`);
    console.log(`- 平均响应时间: ${(endTime - startTime) / concurrentConnections}ms`);
    console.log(`- 成功连接: ${results.filter(r => r.success).length}`);
    console.log(`- 失败连接: ${results.filter(r => !r.success).length}`);
    
    // 获取连接池统计
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    
    console.log(`📈 连接池统计:`);
    console.log(`- 当前连接数: ${serverStatus.connections?.current || 0}`);
    console.log(`- 可用连接数: ${serverStatus.connections?.available || 0}`);
    console.log(`- 总创建连接数: ${serverStatus.connections?.totalCreated || 0}`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📴 数据库连接已关闭');
  }
}

async function testSingleConnection(index) {
  try {
    const startTime = Date.now();
    
    // 模拟数据库操作
    await mongoose.connection.db.admin().ping();
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      success: true,
      index,
      responseTime
    };
  } catch (error) {
    return {
      success: false,
      index,
      error: error.message
    };
  }
}

// 运行测试
testConnectionPool();
