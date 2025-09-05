import { guestUpgradeService } from './guestUpgradeService';
import { guestDataCleanupTest } from './guestDataCleanupTest';

/**
 * 游客升级流程示例
 * 展示完整的游客到注册用户迁移流程
 */
export class GuestUpgradeExample {
  
  /**
   * 完整的游客升级流程示例
   */
  public static async demonstrateGuestUpgradeFlow(): Promise<void> {
    try {
      console.log('🚀 开始演示游客升级流程...');
      
      // 步骤1: 创建测试游客数据
      console.log('\n📝 步骤1: 创建测试游客数据');
      await guestDataCleanupTest.createTestGuestData();
      
      // 步骤2: 验证游客数据存在
      console.log('\n🔍 步骤2: 验证游客数据');
      const verification = await guestDataCleanupTest.verifyGuestDataExists();
      console.log(`找到 ${verification.count} 项游客数据:`, verification.keys);
      
      // 步骤3: 模拟游客数据迁移到注册用户
      console.log('\n🔄 步骤3: 模拟数据迁移');
      const mockUserId = 'user_123456';
      const mockToken = 'mock_token_123';
      
      // 注意：这里只是演示，实际使用时需要真实的用户ID和token
      console.log('模拟迁移游客数据到注册用户:', mockUserId);
      
      // 步骤4: 验证清理功能
      console.log('\n🧹 步骤4: 测试清理功能');
      const cleanupResult = await guestUpgradeService.clearGuestDataManually();
      console.log('清理结果:', cleanupResult);
      
      // 步骤5: 验证清理效果
      console.log('\n✅ 步骤5: 验证清理效果');
      const afterVerification = await guestDataCleanupTest.verifyGuestDataExists();
      console.log(`清理后剩余游客数据: ${afterVerification.count} 项`);
      
      if (afterVerification.count === 0) {
        console.log('🎉 游客数据清理成功！');
      } else {
        console.log('⚠️ 仍有游客数据未清理:', afterVerification.keys);
      }
      
    } catch (error) {
      console.error('❌ 游客升级流程演示失败:', error);
    }
  }

  /**
   * 运行清理功能测试
   */
  public static async runCleanupTests(): Promise<void> {
    try {
      console.log('🧪 开始运行清理功能测试...');
      
      const testResults = await guestDataCleanupTest.runFullTestSuite();
      
      console.log('\n📊 测试结果汇总:');
      console.log(`总体结果: ${testResults.success ? '✅ 通过' : '❌ 失败'}`);
      console.log(`测试数量: ${testResults.results.length}`);
      
      testResults.results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.testName}: ${result.success ? '✅' : '❌'} ${result.message}`);
      });
      
    } catch (error) {
      console.error('❌ 运行清理测试失败:', error);
    }
  }

  /**
   * 实际使用示例：在注册成功后清理游客数据
   */
  public static async handleUserRegistrationSuccess(
    newUserId: string, 
    token: string
  ): Promise<{
    success: boolean;
    message: string;
    migratedDataTypes: string[];
    clearedKeys: number;
  }> {
    try {
      console.log('🎉 用户注册成功，开始处理游客数据迁移...');
      
      // 1. 迁移游客数据到注册用户
      const migrationResult = await guestUpgradeService.migrateGuestDataToRegistered(
        newUserId, 
        token
      );
      
      if (!migrationResult.success) {
        console.error('❌ 游客数据迁移失败:', migrationResult.message);
        return {
          success: false,
          message: `数据迁移失败: ${migrationResult.message}`,
          migratedDataTypes: [],
          clearedKeys: 0
        };
      }
      
      console.log('✅ 游客数据迁移成功:', migrationResult.migratedDataTypes);
      
      // 2. 验证清理效果
      const verification = await guestDataCleanupTest.verifyGuestDataExists();
      
      return {
        success: true,
        message: '游客数据迁移和清理完成',
        migratedDataTypes: migrationResult.migratedDataTypes,
        clearedKeys: verification.count
      };
      
    } catch (error) {
      console.error('❌ 处理用户注册成功时发生错误:', error);
      return {
        success: false,
        message: `处理失败: ${error instanceof Error ? error.message : '未知错误'}`,
        migratedDataTypes: [],
        clearedKeys: 0
      };
    }
  }

  /**
   * 手动清理游客数据（用于调试或特殊情况）
   */
  public static async manualCleanup(): Promise<void> {
    try {
      console.log('🧹 开始手动清理游客数据...');
      
      const result = await guestUpgradeService.clearGuestDataManually();
      
      if (result.success) {
        console.log('✅ 手动清理成功:', result.message);
      } else {
        console.error('❌ 手动清理失败:', result.message);
      }
      
    } catch (error) {
      console.error('❌ 手动清理过程中发生错误:', error);
    }
  }
}

// 导出便捷方法
export const guestUpgradeExample = {
  demonstrateFlow: GuestUpgradeExample.demonstrateGuestUpgradeFlow,
  runTests: GuestUpgradeExample.runCleanupTests,
  handleRegistrationSuccess: GuestUpgradeExample.handleUserRegistrationSuccess,
  manualCleanup: GuestUpgradeExample.manualCleanup
};
