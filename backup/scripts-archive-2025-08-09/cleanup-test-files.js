const fs = require('fs');
const path = require('path');

console.log('🧹 开始清理测试文件...\n');

// 要保留的重要文件
const keepFiles = [
  'accept-code.sh',
  'auto-accept-code.js',
  'debug-apple-login-token.js', // 最近使用的Apple登录调试
  'test-duolingo-sync-comprehensive.js', // 主要的同步测试
  'test-sync-fixes.js', // 同步修复测试
  'test-real-sync-fields.js', // 真实字段测试
  'test-wrong-words-manager.js', // 错词管理器测试
  'test-wrong-words-functionality.js', // 错词功能测试
  'validate-wrong-words-data.js', // 错词数据验证
  'test-experience-fix.js', // 经验值修复测试
  'test-jwt-token-issue.js', // JWT token问题测试
  'test-real-token-issue.js', // 真实token问题测试
  'test-guest-mode-complete.js', // 游客模式测试
  'test-badge-sync.js', // 徽章同步测试
  'test-real-backend-connection.js', // 后端连接测试
  'test-vocabulary-sync.js', // 词汇同步测试
  'test-unified-sync-integration.js', // 统一同步测试
  'test-experience-system.js', // 经验值系统测试
  'test-duolingo-style-sync.js', // Duolingo风格同步测试
  'test-wrong-words-frontend.js', // 错词前端测试
  'test-review-screen-fix.js', // 复习屏幕修复测试
  'test-animation-progress-final.js', // 动画进度测试
  'test-level-calculation-fix.js', // 等级计算修复测试
  'test-progress-animation-fix.js', // 进度动画修复测试
  'test-fixed-progress-calculation.js', // 固定进度计算测试
  'test-animation-manager.js', // 动画管理器测试
  'test-complete-wrong-words-flow.js', // 完整错词流程测试
  'test-real-wrong-words-api.js', // 真实错词API测试
  'test-wrong-words-backend-integration.js', // 错词后端集成测试
  'test-frontend-wrong-words.js', // 前端错词测试
  'test-wrong-words-simple.js', // 简单错词测试
  'test-wrong-words-integration.js', // 错词集成测试
  'test-wrong-words-final.js', // 最终错词测试
  'test-wrong-words.js', // 基础错词测试
  'test-experience-animation-accumulation.js', // 经验值动画累积测试
  'test-navigation-params.js', // 导航参数测试
  'test-experience-animation-flow.js', // 经验值动画流程测试
  'test-review-experience-simple.js', // 简单复习经验值测试
  'test-review-experience.js', // 复习经验值测试
  'test-language-picker-sync.js', // 语言选择器同步测试
  'test-local-user-model.js', // 本地用户模型测试
  'test-guest-token.js', // 游客token测试
  'validate-sync-solution.js', // 同步解决方案验证
  'create-avatars.js', // 创建头像
  'migrate-to-unified-sync.js', // 迁移到统一同步
  'cleanup-old-sync-services.js', // 清理旧同步服务
  'verify-unified-sync-consistency.js', // 验证统一同步一致性
  'verify-system-integration.js', // 验证系统集成
  'validate-cloud-database-fields.js', // 验证云数据库字段
  'test-data-conflict-protection.js', // 数据冲突保护测试
  'final-database-fix.js', // 最终数据库修复
  'fix-remaining-database-issues.js', // 修复剩余数据库问题
  'fix-user-subscription-and-parallel-save.js', // 修复用户订阅和并行保存
  'run-experience-tests.js', // 运行经验值测试
  'phase1-cleanup-report.js', // 第一阶段清理报告
  'experience-duplication-report.js', // 经验值重复报告
  'debug-experience-duplication-detailed.js', // 详细经验值重复调试
  'debug-experience-duplication.js', // 经验值重复调试
  'test-wechat-config.js', // 微信配置测试
  'test-wechat-logging.js', // 微信日志测试
  'debug-wechat-sdk-detailed.js', // 详细微信SDK调试
  'debug-wechat-sdk.js', // 微信SDK调试
  'test-apple-client-id.js', // Apple客户端ID测试
  'debug-apple-jwt-error.js', // Apple JWT错误调试
  'test-current-login-status.js', // 当前登录状态测试
  'debug-wechat-login.js', // 微信登录调试
  'test-user-info-capture.js', // 用户信息捕获测试
  'test-wechat-login-feasibility.js', // 微信登录可行性测试
  'detect-apple-login-feasibility.js', // 检测Apple登录可行性
  'fix-apple-login-config.js', // 修复Apple登录配置
  'test-apple-login-debug.js', // Apple登录调试测试
  'test-login-functionality.js', // 登录功能测试
  'auto-generate-recommendations.js', // 自动生成推荐
  'generate-recommendations-with-chatgpt.js', // 使用ChatGPT生成推荐
  'manage-recommendations.js', // 管理推荐
  'test-recommendations-api.js', // 推荐API测试
  'test-simple-recommendation.js', // 简单推荐测试
  'batch-import-recommendations.js', // 批量导入推荐
  'test-recommendations.js', // 推荐测试
  'test-wrong-words-logic.js', // 错词逻辑测试
  'test-experience-animation-accumulation.js', // 经验值动画累积测试
  'test-navigation-params.js', // 导航参数测试
  'test-experience-animation-flow.js', // 经验值动画流程测试
  'test-review-experience-simple.js', // 简单复习经验值测试
  'test-review-experience.js', // 复习经验值测试
  'test-language-picker-sync.js', // 语言选择器同步测试
  'debug-search-history.js', // 搜索历史调试
  'debug-guest-registration.js', // 游客注册调试
  'test-guest-token.js', // 游客token测试
  'compatibility-test-sync.js', // 兼容性同步测试
  'validate-sync-solution.js', // 同步解决方案验证
  'force-render-redeploy.md', // 强制重新部署说明
  'update-wechat-config.md', // 更新微信配置说明
  'debug-wechat-init.js', // 微信初始化调试
  'get-correct-udid.js', // 获取正确UDID
  'get-device-udid.js', // 获取设备UDID
  'check-xcode-config.md', // 检查Xcode配置说明
  'check-apple-developer-config.md', // 检查Apple开发者配置说明
  'fix-render-env-vars.md', // 修复Render环境变量说明
];

// 要删除的文件模式
const deletePatterns = [
  'debug-*.js',
  'test-*.js',
  'fix-*.js',
  '*.md'
];

// 获取所有文件
const files = fs.readdirSync('.');

console.log(`📊 总文件数: ${files.length}`);
console.log(`📊 保留文件数: ${keepFiles.length}`);

let deletedCount = 0;
let keptCount = 0;

// 删除文件
files.forEach(file => {
  if (file === 'cleanup-test-files.js') {
    console.log(`✅ 跳过清理脚本: ${file}`);
    return;
  }
  
  if (keepFiles.includes(file)) {
    console.log(`✅ 保留: ${file}`);
    keptCount++;
  } else {
    try {
      fs.unlinkSync(file);
      console.log(`🗑️ 删除: ${file}`);
      deletedCount++;
    } catch (error) {
      console.log(`❌ 删除失败: ${file} - ${error.message}`);
    }
  }
});

console.log(`\n📊 清理完成:`);
console.log(`  - 保留文件: ${keptCount}`);
console.log(`  - 删除文件: ${deletedCount}`);
console.log(`  - 剩余文件: ${files.length - deletedCount}`);
