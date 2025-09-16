const mongoose = require('mongoose');

async function diagnoseMongoDB() {
  console.log('🔍 MongoDB连接诊断开始...');
  
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dramaword';
  
  console.log('📋 环境信息:');
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  console.log(`- MONGODB_URI: ${MONGODB_URI ? '已设置' : '未设置'}`);
  console.log(`- URI长度: ${MONGODB_URI.length} 字符`);
  
  // 检查URI格式
  if (MONGODB_URI.includes('mongodb+srv://')) {
    console.log('✅ 使用MongoDB Atlas连接字符串');
  } else if (MONGODB_URI.includes('mongodb://')) {
    console.log('⚠️ 使用标准MongoDB连接字符串');
  } else {
    console.log('❌ 无效的MongoDB连接字符串');
  }
  
  // 尝试连接
  try {
    console.log('\n🔌 尝试连接MongoDB...');
    
    const options = {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      ssl: true,
      authSource: 'admin'
    };
    
    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ MongoDB连接成功！');
    
    // 测试基本操作
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`📊 数据库包含 ${collections.length} 个集合`);
    
    await mongoose.disconnect();
    console.log('✅ 连接已关闭');
    
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message);
    
    if (error.message.includes('IP whitelist')) {
      console.log('\n💡 解决方案:');
      console.log('1. 登录MongoDB Atlas控制台');
      console.log('2. 进入 Network Access 页面');
      console.log('3. 添加 Render 的IP地址到白名单');
      console.log('4. 或者添加 0.0.0.0/0 允许所有IP (不推荐生产环境)');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 解决方案:');
      console.log('1. 检查MONGODB_URI中的用户名和密码');
      console.log('2. 确认数据库用户有正确的权限');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 解决方案:');
      console.log('1. 检查网络连接');
      console.log('2. 增加超时时间');
      console.log('3. 检查防火墙设置');
    }
  }
}

diagnoseMongoDB().catch(console.error);
