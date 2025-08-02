const fs = require('fs');
const path = require('path');

console.log('🔍 检查经验值计算逻辑代码质量...\n');

// 需要检查的文件
const filesToCheck = [
  'apps/mobile/src/screens/Review/ReviewIntroScreen.tsx',
  'apps/mobile/src/services/experienceManager.ts',
  'apps/mobile/src/services/experienceService.ts'
];

// 代码质量检查规则
const qualityRules = [
  {
    name: '命名冲突检查',
    pattern: /experienceManager/g,
    description: '检查是否有命名冲突的experienceManager'
  },
  {
    name: '老旧代码检查',
    pattern: /finalExperience\s*\+=\s*gainedExp/g,
    description: '检查是否还有直接累加经验值的老旧代码'
  },
  {
    name: '未使用的变量检查',
    pattern: /const\s+(\w+)\s*=\s*[^;]+;\s*(?!.*\1)/g,
    description: '检查是否有未使用的变量'
  },
  {
    name: '重复代码检查',
    pattern: /AsyncStorage\.getItem\('experienceGain'\)/g,
    description: '检查是否有重复的AsyncStorage调用'
  },
  {
    name: '错误处理检查',
    pattern: /try\s*\{[\s\S]*?\}\s*catch\s*\(/g,
    description: '检查是否有适当的错误处理'
  }
];

// 函数和变量名称检查
const namingChecks = [
  {
    name: '经验值相关函数',
    patterns: [
      /function\s+(\w*experience\w*)/gi,
      /const\s+(\w*experience\w*)\s*=/gi,
      /async\s+(\w*experience\w*)/gi
    ]
  },
  {
    name: '经验值相关变量',
    patterns: [
      /const\s+(\w*Exp\w*)\s*=/gi,
      /let\s+(\w*Exp\w*)\s*=/gi,
      /var\s+(\w*Exp\w*)\s*=/gi
    ]
  }
];

// 检查单个文件
function checkFileQuality(filePath) {
  console.log(`📁 检查文件: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let issues = [];
    let suggestions = [];
    
    // 检查质量规则
    qualityRules.forEach(rule => {
      const matches = content.match(rule.pattern);
      if (matches) {
        issues.push({
          type: rule.name,
          description: rule.description,
          count: matches.length,
          locations: []
        });
        
        // 找到具体位置
        lines.forEach((line, index) => {
          if (line.match(rule.pattern)) {
            issues[issues.length - 1].locations.push({
              line: index + 1,
              content: line.trim()
            });
          }
        });
      }
    });
    
    // 检查命名
    namingChecks.forEach(check => {
      const foundNames = new Set();
      
      check.patterns.forEach(pattern => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            foundNames.add(match[1]);
          }
        }
      });
      
      if (foundNames.size > 0) {
        suggestions.push({
          type: check.name,
          names: Array.from(foundNames)
        });
      }
    });
    
    // 检查代码结构
    const functionCount = (content.match(/function\s+\w+|const\s+\w+\s*=\s*async|async\s+\w+\s*\(/g) || []).length;
    const variableCount = (content.match(/const\s+\w+|let\s+\w+|var\s+\w+/g) || []).length;
    
    // 检查注释质量
    const commentLines = lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('/*'));
    const commentRatio = commentLines.length / lines.length;
    
    // 输出结果
    if (issues.length > 0) {
      console.log(`❌ 发现 ${issues.length} 个问题:`);
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.type} (${issue.count} 处)`);
        console.log(`     ${issue.description}`);
        if (issue.locations.length > 0) {
          console.log(`     位置:`);
          issue.locations.slice(0, 3).forEach(loc => {
            console.log(`       行 ${loc.line}: ${loc.content}`);
          });
          if (issue.locations.length > 3) {
            console.log(`       ... 还有 ${issue.locations.length - 3} 处`);
          }
        }
        console.log('');
      });
    } else {
      console.log('✅ 未发现明显问题');
    }
    
    if (suggestions.length > 0) {
      console.log(`💡 发现 ${suggestions.length} 个命名建议:`);
      suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion.type}:`);
        suggestion.names.forEach(name => {
          console.log(`     - ${name}`);
        });
        console.log('');
      });
    }
    
    // 代码统计
    console.log(`📊 代码统计:`);
    console.log(`   函数数量: ${functionCount}`);
    console.log(`   变量数量: ${variableCount}`);
    console.log(`   注释比例: ${(commentRatio * 100).toFixed(1)}%`);
    console.log(`   代码行数: ${lines.length}`);
    
    return {
      issues,
      suggestions,
      stats: {
        functionCount,
        variableCount,
        commentRatio,
        lineCount: lines.length
      }
    };
    
  } catch (error) {
    console.error(`❌ 读取文件失败: ${error.message}`);
    return { issues: [], suggestions: [], stats: {} };
  }
}

// 检查经验值逻辑的清晰性
function checkExperienceLogicClarity() {
  console.log('\n🔍 检查经验值逻辑清晰性...\n');
  
  const clarityIssues = [];
  
  filesToCheck.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 检查是否有复杂的嵌套逻辑
      const nestedIfCount = (content.match(/if\s*\([^)]*\)\s*\{[\s\S]*?if\s*\(/g) || []).length;
      if (nestedIfCount > 3) {
        clarityIssues.push({
          file: filePath,
          issue: '嵌套if语句过多，可能影响代码可读性',
          count: nestedIfCount
        });
      }
      
      // 检查是否有过长的函数
      const functions = content.match(/function\s+\w+[\s\S]*?\n\s*\}/g) || [];
      functions.forEach(func => {
        const lines = func.split('\n').length;
        if (lines > 50) {
          clarityIssues.push({
            file: filePath,
            issue: '函数过长，建议拆分',
            lines: lines
          });
        }
      });
      
      // 检查是否有重复的逻辑
      const asyncStorageCalls = content.match(/AsyncStorage\.getItem\('experienceGain'\)/g) || [];
      if (asyncStorageCalls.length > 5) {
        clarityIssues.push({
          file: filePath,
          issue: 'AsyncStorage调用过多，可能存在重复逻辑',
          count: asyncStorageCalls.length
        });
      }
    }
  });
  
  if (clarityIssues.length > 0) {
    console.log(`⚠️ 发现 ${clarityIssues.length} 个清晰性问题:`);
    clarityIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.file}`);
      console.log(`     ${issue.issue}`);
      if (issue.count) console.log(`     数量: ${issue.count}`);
      if (issue.lines) console.log(`     行数: ${issue.lines}`);
      console.log('');
    });
  } else {
    console.log('✅ 经验值逻辑清晰性良好');
  }
  
  return clarityIssues;
}

// 检查变量和函数名称的一致性
function checkNamingConsistency() {
  console.log('\n🔍 检查命名一致性...\n');
  
  const namingIssues = [];
  const allNames = new Set();
  
  filesToCheck.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 提取所有经验值相关的名称
      const experienceNames = content.match(/\b\w*experience\w*\b/gi) || [];
      const expNames = content.match(/\b\w*exp\w*\b/gi) || [];
      
      [...experienceNames, ...expNames].forEach(name => {
        allNames.add(name.toLowerCase());
      });
    }
  });
  
  // 检查命名模式
  const namingPatterns = {
    camelCase: /^[a-z][a-zA-Z0-9]*$/,
    PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
    snake_case: /^[a-z][a-z0-9_]*$/,
    UPPER_CASE: /^[A-Z][A-Z0-9_]*$/
  };
  
  const patternCounts = {};
  allNames.forEach(name => {
    for (const [pattern, regex] of Object.entries(namingPatterns)) {
      if (regex.test(name)) {
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
        break;
      }
    }
  });
  
  console.log('📊 命名模式统计:');
  Object.entries(patternCounts).forEach(([pattern, count]) => {
    console.log(`   ${pattern}: ${count} 个`);
  });
  
  // 检查是否有不一致的命名
  const inconsistentNames = [];
  allNames.forEach(name => {
    const variations = Array.from(allNames).filter(n => 
      n.toLowerCase() === name.toLowerCase() && n !== name
    );
    if (variations.length > 0) {
      inconsistentNames.push({
        base: name,
        variations: variations
      });
    }
  });
  
  if (inconsistentNames.length > 0) {
    console.log('\n⚠️ 发现命名不一致:');
    inconsistentNames.forEach(item => {
      console.log(`   ${item.base} -> [${item.variations.join(', ')}]`);
    });
  } else {
    console.log('\n✅ 命名一致性良好');
  }
  
  return { patternCounts, inconsistentNames };
}

// 主检查函数
function main() {
  console.log('🎯 经验值计算逻辑代码质量检查报告\n');
  console.log('=' .repeat(60));
  
  let totalIssues = 0;
  let totalSuggestions = 0;
  
  // 检查每个文件
  filesToCheck.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const result = checkFileQuality(filePath);
      totalIssues += result.issues.length;
      totalSuggestions += result.suggestions.length;
      console.log('-' .repeat(60));
    } else {
      console.log(`❌ 文件不存在: ${filePath}`);
    }
  });
  
  // 检查逻辑清晰性
  const clarityIssues = checkExperienceLogicClarity();
  
  // 检查命名一致性
  const namingResult = checkNamingConsistency();
  
  // 总结
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 检查总结:`);
  console.log(`   总问题数: ${totalIssues}`);
  console.log(`   总建议数: ${totalSuggestions}`);
  console.log(`   清晰性问题: ${clarityIssues.length}`);
  console.log(`   命名不一致: ${namingResult.inconsistentNames.length}`);
  
  if (totalIssues === 0 && clarityIssues.length === 0 && namingResult.inconsistentNames.length === 0) {
    console.log('\n🎉 代码质量优秀！');
  } else {
    console.log('\n🔧 建议改进:');
    if (totalIssues > 0) {
      console.log('   - 修复发现的问题');
    }
    if (clarityIssues.length > 0) {
      console.log('   - 简化复杂逻辑，提高代码可读性');
    }
    if (namingResult.inconsistentNames.length > 0) {
      console.log('   - 统一命名规范');
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ 检查完成');
}

// 运行检查
main(); 