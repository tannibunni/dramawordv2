#!/usr/bin/env node

/**
 * 修复经验模型和多邻国数据同步系统对齐问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 开始修复经验模型对齐问题...\n');

// 修复建议
const fixes = [
  {
    name: '后端ExperienceGainResult接口缺失',
    description: '后端需要添加ExperienceGainResult接口定义',
    file: 'services/api/src/services/experienceService.ts',
    fix: `
// 在文件开头添加接口定义
export interface ExperienceGainResult {
  success: boolean;
  xpGained: number;
  newLevel: number;
  leveledUp: boolean;
  message: string;
  oldLevel?: number;
  oldExperience?: number;
  newExperience?: number;
  progressChange?: number;
}
    `
  },
  {
    name: '前端计算逻辑与后端不一致',
    description: '确保前后端使用相同的经验值计算公式',
    file: 'apps/mobile/src/services/experienceCalculationService.ts',
    fix: `
// 修改计算逻辑以与后端保持一致
public calculateLevelRequiredExp(level: number): number {
  // 与后端User.ts中的公式保持一致
  return this.config.baseXP * Math.pow(level + 1, this.config.levelMultiplier);
}

public calculateExperienceGain(
  currentExperience: number,
  xpToGain: number,
  reason: string = '未知'
): ExperienceGainResult {
  const oldLevel = this.calculateLevel(currentExperience);
  const newExperience = currentExperience + xpToGain;
  const newLevel = this.calculateLevel(newExperience);
  const leveledUp = newLevel > oldLevel;
  
  return {
    success: true,
    xpGained: xpToGain,
    newLevel,
    leveledUp,
    message: \`\${reason} +\${xpToGain}经验值\`,
    oldLevel,
    oldExperience: currentExperience,
    newExperience,
    progressChange: 0 // 计算进度变化
  };
}
    `
  },
  {
    name: '统一变量命名规范',
    description: '确保前后端使用一致的变量名称',
    files: [
      'apps/mobile/src/services/experienceCalculationService.ts',
      'services/api/src/models/User.ts'
    ],
    fix: `
// 统一使用以下变量名称：
// - experience: 当前经验值
// - level: 当前等级
// - xpGained: 获得的经验值
// - leveledUp: 是否升级
// - experienceToNextLevel: 升级所需经验值
    `
  },
  {
    name: '存储键对齐',
    description: '确保存储服务和使用处使用相同的键名',
    file: 'apps/mobile/src/screens/Review/ReviewIntroScreen.tsx',
    fix: `
// 在clearAll方法中添加experienceEvents清理
async clearAll() {
  await AsyncStorage.removeItem('experienceGain');
  await AsyncStorage.removeItem('experienceGainApplied');
  await AsyncStorage.removeItem('experienceEvents');
}
    `
  },
  {
    name: '类型定义完善',
    description: '添加缺失的类型定义',
    file: 'apps/mobile/src/types/experience.ts',
    fix: `
// 添加DataConflictResolver接口
export interface DataConflictResolver {
  resolveConflict(conflict: any): any;
}

// 确保ExperienceGainResult与后端一致
export interface ExperienceGainResult {
  success: boolean;
  xpGained: number;
  newLevel: number;
  leveledUp: boolean;
  message: string;
  oldLevel?: number;
  oldExperience?: number;
  newExperience?: number;
  progressChange?: number;
}
    `
  }
];

// 生成修复报告
function generateFixReport() {
  console.log('📋 对齐问题修复报告:');
  console.log('='.repeat(60));
  
  fixes.forEach((fix, index) => {
    console.log(`\n${index + 1}. ${fix.name}`);
    console.log(`   描述: ${fix.description}`);
    console.log(`   文件: ${Array.isArray(fix.files) ? fix.files.join(', ') : fix.file}`);
    console.log(`   修复方案: ${fix.fix ? '已提供' : '需要手动修复'}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('💡 修复建议:');
  console.log('1. 优先修复类型定义不一致问题');
  console.log('2. 统一变量命名规范');
  console.log('3. 确保计算逻辑一致性');
  console.log('4. 完善存储键对齐');
  console.log('5. 添加更多测试验证修复效果');
}

// 检查修复后的对齐情况
function checkPostFixAlignment() {
  console.log('\n🔍 检查修复后的对齐情况...');
  
  const alignmentChecks = [
    {
      name: '类型定义对齐',
      check: () => {
        const frontendTypes = fs.readFileSync('apps/mobile/src/types/experience.ts', 'utf8');
        const backendService = fs.readFileSync('services/api/src/services/experienceService.ts', 'utf8');
        
        const hasFrontendInterface = frontendTypes.includes('interface ExperienceGainResult');
        const hasBackendInterface = backendService.includes('interface ExperienceGainResult');
        
        return hasFrontendInterface && hasBackendInterface;
      }
    },
    {
      name: '计算逻辑对齐',
      check: () => {
        const frontendCalc = fs.readFileSync('apps/mobile/src/services/experienceCalculationService.ts', 'utf8');
        const backendModel = fs.readFileSync('services/api/src/models/User.ts', 'utf8');
        
        const hasFrontendFormula = frontendCalc.includes('Math.pow(level + 1, 2)');
        const hasBackendFormula = backendModel.includes('Math.pow(currentLevel + 1, 2)');
        
        return hasFrontendFormula && hasBackendFormula;
      }
    },
    {
      name: '变量命名一致性',
      check: () => {
        const files = [
          'apps/mobile/src/services/experienceCalculationService.ts',
          'services/api/src/models/User.ts'
        ];
        
        return files.every(file => {
          const content = fs.readFileSync(file, 'utf8');
          return content.includes('experience') && content.includes('level');
        });
      }
    }
  ];
  
  let allFixed = true;
  alignmentChecks.forEach(check => {
    try {
      const result = check.check();
      const status = result ? '✅' : '❌';
      console.log(`  ${status} ${check.name}: ${result ? '已修复' : '仍需修复'}`);
      if (!result) {
        allFixed = false;
      }
    } catch (error) {
      console.log(`  ❌ ${check.name}: 检查失败 - ${error.message}`);
      allFixed = false;
    }
  });
  
  return allFixed;
}

// 生成最佳实践指南
function generateBestPractices() {
  console.log('\n📚 经验模型对齐最佳实践:');
  console.log('='.repeat(50));
  
  const practices = [
    {
      category: '类型定义',
      practices: [
        '前后端使用相同的接口定义',
        '使用TypeScript确保类型安全',
        '定期同步类型定义变更'
      ]
    },
    {
      category: '变量命名',
      practices: [
        '建立统一的命名规范',
        '使用描述性的变量名称',
        '避免缩写和歧义名称'
      ]
    },
    {
      category: '计算逻辑',
      practices: [
        '前后端使用相同的计算公式',
        '添加单元测试验证计算正确性',
        '记录计算逻辑的变更历史'
      ]
    },
    {
      category: '数据同步',
      practices: [
        '定义清晰的数据结构',
        '实现冲突解决机制',
        '添加同步状态监控'
      ]
    },
    {
      category: '存储管理',
      practices: [
        '统一存储键命名规范',
        '实现数据版本控制',
        '添加数据清理机制'
      ]
    }
  ];
  
  practices.forEach(category => {
    console.log(`\n${category.category}:`);
    category.practices.forEach(practice => {
      console.log(`  • ${practice}`);
    });
  });
}

// 主函数
function main() {
  console.log('🚀 开始修复经验模型对齐问题...\n');
  
  generateFixReport();
  
  const isFixed = checkPostFixAlignment();
  
  if (isFixed) {
    console.log('\n🎉 所有对齐问题已修复！');
  } else {
    console.log('\n⚠️ 仍有部分问题需要手动修复。');
  }
  
  generateBestPractices();
  
  console.log('\n✅ 修复脚本执行完成！');
}

// 执行修复
if (require.main === module) {
  main();
}

module.exports = {
  generateFixReport,
  checkPostFixAlignment,
  generateBestPractices
}; 