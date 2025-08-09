#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 调试经验值重复计算问题
console.log('🔍 开始检查经验值重复计算问题...\n');

// 检查的文件列表
const filesToCheck = [
  'apps/mobile/src/screens/Review/ReviewIntroScreen.tsx'
];

// 问题模式
const problematicPatterns = [
  {
    name: '直接累加经验值增益到finalExperience',
    pattern: /finalExperience\s*\+=\s*gainedExp/,
    description: '检测到直接将gainedExp加到finalExperience，可能导致重复计算'
  },
  {
    name: '从experienceGain读取并直接累加',
    pattern: /const\s+gainData\s*=\s*await\s+AsyncStorage\.getItem\('experienceGain'\)[\s\S]*?finalExperience\s*\+=\s*gainedExp/,
    description: '检测到从experienceGain读取数据并直接累加到finalExperience'
  },
  {
    name: '多个函数中的经验值累加逻辑',
    pattern: /(loadUserStats|loadBackendData|getCurrentUserData).*?finalExperience\s*\+=\s*gainedExp/,
    description: '检测到多个函数中都有直接累加经验值的逻辑'
  }
];

// 检查单个文件
function checkFile(filePath) {
  console.log(`📁 检查文件: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let issues = [];
    
    // 检查每个问题模式
    problematicPatterns.forEach(pattern => {
      const matches = content.match(pattern.pattern);
      if (matches) {
        issues.push({
          type: pattern.name,
          description: pattern.description,
          matches: matches.length
        });
      }
    });
    
    // 详细分析经验值处理逻辑
    const experienceGainPatterns = [
      {
        name: 'loadUserStats函数',
        startPattern: /const\s+loadUserStats\s*=\s*async\s*\(\)\s*=>\s*\{/,
        endPattern: /^\s*\};?\s*$/m
      },
      {
        name: 'loadBackendData函数',
        startPattern: /const\s+loadBackendData\s*=\s*async\s*\(\)\s*=>\s*\{/,
        endPattern: /^\s*\};?\s*$/m
      },
      {
        name: 'getCurrentUserData函数',
        startPattern: /const\s+getCurrentUserData\s*=\s*async\s*\(\)\s*=>\s*\{/,
        endPattern: /^\s*\};?\s*$/m
      }
    ];
    
    experienceGainPatterns.forEach(funcPattern => {
      const startMatch = content.match(funcPattern.startPattern);
      if (startMatch) {
        const startIndex = startMatch.index;
        const afterStart = content.substring(startIndex);
        
        // 查找函数结束位置
        let braceCount = 0;
        let endIndex = -1;
        
        for (let i = 0; i < afterStart.length; i++) {
          if (afterStart[i] === '{') braceCount++;
          if (afterStart[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i;
              break;
            }
          }
        }
        
        if (endIndex !== -1) {
          const functionContent = afterStart.substring(0, endIndex + 1);
          
          // 检查函数内的经验值处理逻辑
          const expGainChecks = functionContent.match(/experienceGain/g);
          const finalExpAssignments = functionContent.match(/finalExperience\s*=/g);
          const expAdditions = functionContent.match(/finalExperience\s*\+=/g);
          
          if (expGainChecks || finalExpAssignments || expAdditions) {
            issues.push({
              type: `${funcPattern.name}中的经验值处理`,
              description: `检测到经验值处理逻辑: experienceGain检查=${expGainChecks?.length || 0}, finalExperience赋值=${finalExpAssignments?.length || 0}, 经验值累加=${expAdditions?.length || 0}`,
              details: {
                experienceGainChecks: expGainChecks?.length || 0,
                finalExpAssignments: finalExpAssignments?.length || 0,
                expAdditions: expAdditions?.length || 0
              }
            });
          }
        }
      }
    });
    
    // 输出结果
    if (issues.length > 0) {
      console.log(`❌ 发现 ${issues.length} 个潜在问题:`);
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.type}`);
        console.log(`     ${issue.description}`);
        if (issue.details) {
          console.log(`     详情:`, issue.details);
        }
        console.log('');
      });
    } else {
      console.log('✅ 未发现明显的问题模式');
    }
    
    // 详细分析经验值累加的具体位置
    console.log('🔍 详细分析经验值累加位置:');
    lines.forEach((line, lineNumber) => {
      if (line.includes('finalExperience') && line.includes('+=')) {
        console.log(`   行 ${lineNumber + 1}: ${line.trim()}`);
      }
      if (line.includes('experienceGain') && line.includes('AsyncStorage')) {
        console.log(`   行 ${lineNumber + 1}: ${line.trim()}`);
      }
    });
    
    return issues;
    
  } catch (error) {
    console.error(`❌ 读取文件失败: ${error.message}`);
    return [];
  }
}

// 主检查逻辑
function main() {
  console.log('🎯 经验值重复计算问题检查报告\n');
  console.log('=' .repeat(60));
  
  let totalIssues = 0;
  
  filesToCheck.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const issues = checkFile(filePath);
      totalIssues += issues.length;
      console.log('-' .repeat(60));
    } else {
      console.log(`❌ 文件不存在: ${filePath}`);
    }
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 总结: 共发现 ${totalIssues} 个潜在问题`);
  
  if (totalIssues > 0) {
    console.log('\n🚨 建议修复方案:');
    console.log('1. 在累加经验值之前检查是否已经应用过该增益');
    console.log('2. 使用时间戳或状态标记来跟踪经验值增益的应用状态');
    console.log('3. 考虑使用事务性操作来确保经验值更新的原子性');
    console.log('4. 添加经验值增益的清理机制，避免重复应用');
  }
  
  console.log('\n✅ 检查完成');
}

// 运行检查
main(); 