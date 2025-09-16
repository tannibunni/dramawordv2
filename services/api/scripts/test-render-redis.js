// 测试Render Redis连接
const Redis = require('ioredis');

// 使用你提供的External Redis URL
const REDIS_URL = 'rediss://red-d33g2ibe5dus73e8hm3g:1DIj8yk7mD0fMHAIDxS5TOUSHo3kIrGt@oregon-keyvalue.render.com:6379';

async function testRenderRedis() {
  console.log('🔍 测试Render Redis连接...\n');
  
  let redis;
  
  try {
    // 创建Redis连接
    console.log('1. 创建Redis连接...');
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
      tls: {
        rejectUnauthorized: false,
        servername: 'oregon-keyvalue.render.com'
      }
    });
    
    // 监听连接事件
    redis.on('connect', () => {
      console.log('✅ Redis连接成功');
    });
    
    redis.on('error', (error) => {
      console.error('❌ Redis连接错误:', error.message);
    });
    
    // 连接Redis
    console.log('2. 连接到Redis服务器...');
    await redis.connect();
    
    // 测试基本操作
    console.log('3. 测试基本操作...');
    
    // 设置测试数据
    await redis.set('test:connection', 'Hello Render Redis!');
    console.log('✅ 设置测试数据成功');
    
    // 获取测试数据
    const value = await redis.get('test:connection');
    console.log('✅ 获取测试数据成功:', value);
    
    // 设置过期时间
    await redis.setex('test:ttl', 60, 'TTL test data');
    console.log('✅ 设置TTL测试数据成功');
    
    // 检查TTL
    const ttl = await redis.ttl('test:ttl');
    console.log('✅ TTL检查成功:', ttl + '秒');
    
    // 删除测试数据
    await redis.del('test:connection', 'test:ttl');
    console.log('✅ 删除测试数据成功');
    
    // 获取Redis信息
    console.log('4. 获取Redis服务器信息...');
    const info = await redis.info();
    console.log('✅ Redis服务器信息获取成功');
    
    // 解析关键信息
    const lines = info.split('\r\n');
    const keyInfo = {};
    
    lines.forEach(line => {
      if (line.includes('redis_version') || 
          line.includes('used_memory_human') || 
          line.includes('connected_clients') ||
          line.includes('total_commands_processed')) {
        const [key, value] = line.split(':');
        if (key && value) {
          keyInfo[key] = value;
        }
      }
    });
    
    console.log('\n📊 Redis服务器信息:');
    console.log('  - Redis版本:', keyInfo.redis_version || '未知');
    console.log('  - 内存使用:', keyInfo.used_memory_human || '未知');
    console.log('  - 连接客户端数:', keyInfo.connected_clients || '未知');
    console.log('  - 总命令数:', keyInfo.total_commands_processed || '未知');
    
    // 测试缓存策略
    console.log('\n5. 测试缓存策略...');
    
    // 模拟用户数据缓存
    const userData = {
      id: 'test_user_123',
      name: 'Test User',
      email: 'test@example.com',
      lastLogin: new Date().toISOString()
    };
    
    await redis.setex('user:test_user_123', 3600, JSON.stringify(userData));
    console.log('✅ 用户数据缓存设置成功');
    
    const cachedUser = await redis.get('user:test_user_123');
    const parsedUser = JSON.parse(cachedUser);
    console.log('✅ 用户数据缓存获取成功:', parsedUser.name);
    
    // 模拟词汇数据缓存
    const wordData = {
      word: 'hello',
      definition: 'a greeting',
      language: 'en',
      timestamp: Date.now()
    };
    
    await redis.setex('word:hello', 1800, JSON.stringify(wordData));
    console.log('✅ 词汇数据缓存设置成功');
    
    const cachedWord = await redis.get('word:hello');
    const parsedWord = JSON.parse(cachedWord);
    console.log('✅ 词汇数据缓存获取成功:', parsedWord.word);
    
    // 清理测试数据
    await redis.del('user:test_user_123', 'word:hello');
    console.log('✅ 测试数据清理完成');
    
    console.log('\n🎉 Render Redis连接测试完全成功！');
    console.log('✅ 你的Redis配置正确，可以正常使用');
    
  } catch (error) {
    console.error('❌ Redis连接测试失败:', error.message);
    console.error('详细错误:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 可能的原因:');
      console.log('  - Redis服务未启动');
      console.log('  - 网络连接问题');
      console.log('  - 防火墙阻止连接');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 可能的原因:');
      console.log('  - Redis服务器地址错误');
      console.log('  - DNS解析问题');
    } else if (error.message.includes('WRONGPASS')) {
      console.log('\n💡 可能的原因:');
      console.log('  - Redis密码错误');
      console.log('  - 认证失败');
    }
    
  } finally {
    if (redis) {
      await redis.quit();
      console.log('\n📴 Redis连接已关闭');
    }
  }
}

// 运行测试
testRenderRedis().catch(console.error);
