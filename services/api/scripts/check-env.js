console.log('🔍 环境变量检查...\n');

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'OPENAI_API_KEY'
];

const optionalEnvVars = [
  'REDIS_URL',
  'NODE_ENV',
  'PORT'
];

console.log('📋 必需环境变量:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${envVar}: 未设置`);
  }
});

console.log('\n📋 可选环境变量:');
optionalEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${value}`);
  } else {
    console.log(`⚠️ ${envVar}: 未设置`);
  }
});

console.log('\n🔍 MongoDB URI 分析:');
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  console.log(`- 类型: ${mongoUri.includes('mongodb+srv://') ? 'Atlas' : '标准'}`);
  console.log(`- 长度: ${mongoUri.length} 字符`);
  console.log(`- 包含用户名: ${mongoUri.includes('@') ? '是' : '否'}`);
  console.log(`- 包含密码: ${mongoUri.includes(':') && mongoUri.includes('@') ? '是' : '否'}`);
  console.log(`- 包含数据库名: ${mongoUri.includes('/') ? '是' : '否'}`);
} else {
  console.log('❌ MONGODB_URI 未设置');
}

console.log('\n💡 如果MongoDB连接失败，请检查:');
console.log('1. MongoDB Atlas IP白名单设置');
console.log('2. 数据库用户权限');
console.log('3. 网络连接');
console.log('4. 环境变量是否正确设置');
