const fs = require('fs');
const path = require('path');

console.log('🔍 检查前端Token存储和获取逻辑...\n');

// 检查token存储相关的文件
const filesToCheck = [
  'apps/mobile/src/services/userService.ts',
  'apps/mobile/src/services/storageService.ts',
  'apps/mobile/src/context/AuthContext.tsx',
  'apps/mobile/src/services/unifiedSyncService.ts'
];

function checkTokenStorageLogic() {
  console.log('📋 Token存储和获取逻辑分析:\n');
  
  filesToCheck.forEach(filePath => {
    console.log(`📄 检查文件: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 检查token相关的代码
      const tokenPatterns = [
        { pattern: /setAuthToken|getAuthToken/g, name: 'Token存储/获取方法' },
        { pattern: /authToken|userData\.token/g, name: 'Token字段引用' },
        { pattern: /Authorization.*Bearer/g, name: 'Authorization头设置' },
        { pattern: /AsyncStorage\.(get|set)Item.*token/g, name: 'AsyncStorage Token操作' }
      ];
      
      tokenPatterns.forEach(({ pattern, name }) => {
        const matches = content.match(pattern);
        if (matches) {
          console.log(`  ✅ ${name}: ${matches.length} 处`);
          matches.forEach((match, index) => {
            const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length;
            console.log(`     ${index + 1}. 行 ${lineNumber}: ${match.substring(0, 50)}...`);
          });
        } else {
          console.log(`  ❌ ${name}: 未找到`);
        }
      });
      
      console.log('');
    } else {
      console.log(`  ❌ 文件不存在: ${filePath}`);
    }
  });
}

function checkTokenConsistency() {
  console.log('🔍 Token存储一致性分析:\n');
  
  const storageService = fs.readFileSync('apps/mobile/src/services/storageService.ts', 'utf8');
  const userService = fs.readFileSync('apps/mobile/src/services/userService.ts', 'utf8');
  const unifiedSyncService = fs.readFileSync('apps/mobile/src/services/unifiedSyncService.ts', 'utf8');
  
  // 检查token存储键名
  const authTokenKey = storageService.match(/AUTH_TOKEN.*=.*['"`]([^'"`]+)['"`]/);
  if (authTokenKey) {
    console.log(`✅ Token存储键名: ${authTokenKey[1]}`);
  }
  
  // 检查不同服务中的token获取方式
  console.log('\n📊 各服务Token获取方式:');
  
  // storageService
  const storageGetAuthToken = storageService.includes('getAuthToken');
  console.log(`  - storageService: ${storageGetAuthToken ? '✅ 有getAuthToken方法' : '❌ 无getAuthToken方法'}`);
  
  // userService
  const userGetAuthToken = userService.includes('getAuthToken');
  console.log(`  - userService: ${userGetAuthToken ? '✅ 有getAuthToken方法' : '❌ 无getAuthToken方法'}`);
  
  // unifiedSyncService
  const syncGetAuthToken = unifiedSyncService.includes('getAuthToken');
  console.log(`  - unifiedSyncService: ${syncGetAuthToken ? '✅ 有getAuthToken方法' : '❌ 无getAuthToken方法'}`);
  
  // 检查token获取逻辑
  console.log('\n🔍 Token获取逻辑分析:');
  
  // 检查unifiedSyncService中的token获取逻辑
  const syncTokenLogic = unifiedSyncService.match(/getAuthToken\(\)[^}]+}/s);
  if (syncTokenLogic) {
    console.log('  - unifiedSyncService token获取逻辑:');
    console.log(`    ${syncTokenLogic[0].replace(/\n/g, '\n    ')}`);
  }
  
  // 检查userService中的token获取逻辑
  const userTokenLogic = userService.match(/getAuthToken\(\)[^}]+}/s);
  if (userTokenLogic) {
    console.log('  - userService token获取逻辑:');
    console.log(`    ${userTokenLogic[0].replace(/\n/g, '\n    ')}`);
  }
}

function checkAuthorizationHeaders() {
  console.log('\n🔍 Authorization头设置分析:\n');
  
  const unifiedSyncService = fs.readFileSync('apps/mobile/src/services/unifiedSyncService.ts', 'utf8');
  
  // 查找Authorization头设置
  const authHeaders = unifiedSyncService.match(/Authorization.*Bearer.*\$\{token\}/g);
  if (authHeaders) {
    console.log('✅ 找到Authorization头设置:');
    authHeaders.forEach((header, index) => {
      console.log(`  ${index + 1}. ${header}`);
    });
  } else {
    console.log('❌ 未找到Authorization头设置');
  }
  
  // 检查token变量使用
  const tokenUsage = unifiedSyncService.match(/\$\{token\}/g);
  if (tokenUsage) {
    console.log(`\n📊 Token变量使用次数: ${tokenUsage.length}`);
  }
}

// 运行检查
checkTokenStorageLogic();
checkTokenConsistency();
checkAuthorizationHeaders();

console.log('\n🎯 前端Token检查完成！'); 