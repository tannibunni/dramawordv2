const fs = require('fs');
const path = require('path');

// 🎯 ChatGPT推荐内容生成工具
// 使用说明：
// 1. 复制下面的prompt到ChatGPT
// 2. 将ChatGPT返回的JSON复制到output.json文件
// 3. 运行此脚本自动处理并更新manage-recommendations.js

// ChatGPT Prompt模板
const CHATGPT_PROMPT = `
你是一个专业的英语学习内容推荐专家。请为以下美剧/英剧生成推荐内容，格式要求如下：

【输入格式】
剧集名称：[剧集名]
TMDB ID：[ID号]
类型：[喜剧/剧情/犯罪/悬疑等]
年份：[年份]
评分：[评分]

【输出格式】
请严格按照以下JSON格式输出，不要添加任何其他文字：

{
  "tmdbShowId": [TMDB_ID],
  "title": "[英文剧名]",
  "originalTitle": "[英文剧名]",
  "backdropUrl": "https://image.tmdb.org/t/p/w780/[backdrop_path]",
  "posterUrl": "https://image.tmdb.org/t/p/w92/[poster_path]",
  "recommendation": {
    "text": "[推荐文案，要求：1.小红书风格，2.强调英语学习价值，3.突出剧集特色，4.长度50-80字]",
    "difficulty": "[easy/medium/hard，根据剧集复杂度判断]",
    "language": "zh-CN",
    "category": ["[类型1]", "[类型2]"],
    "tags": ["[标签1]", "[标签2]", "[标签3]", "[标签4]"]
  },
  "metadata": {
    "genre": [[TMDB类型ID]],
    "rating": [评分],
    "year": [年份],
    "status": "active",
    "priority": [1-10，根据剧集质量判断],
    "views": 0,
    "likes": 0
  }
}

【推荐文案风格要求】
1. 使用"绝了"、"强烈安利"、"必看"等小红书表达
2. 强调英语学习效果："学英语必备"、"口语突飞猛进"、"听力训练"等
3. 突出剧集特色：剧情、演员、制作等
4. 情感共鸣：治愈、紧张、温暖等

【难度判断标准】
- easy: 喜剧、家庭剧、对话简单
- medium: 剧情剧、职场剧、中等复杂度
- hard: 犯罪剧、历史剧、专业术语多

【优先级判断标准】
- 10: 经典神作，必看
- 9: 高分佳作，强烈推荐
- 8: 优秀作品，值得一看
- 7: 不错作品，可以尝试
- 6: 一般作品，选择性观看

请为以下剧集生成推荐内容：

剧集名称：[在这里输入剧集名]
TMDB ID：[在这里输入TMDB ID]
类型：[在这里输入类型]
年份：[在这里输入年份]
评分：[在这里输入评分]
`;

// 处理ChatGPT输出的JSON
function processChatGPTOutput() {
  try {
    // 读取ChatGPT输出的JSON文件
    const outputPath = path.join(__dirname, 'output.json');
    
    if (!fs.existsSync(outputPath)) {
      console.log('❌ 未找到 output.json 文件');
      console.log('请将ChatGPT返回的JSON内容保存到 output.json 文件中');
      return;
    }
    
    const outputContent = fs.readFileSync(outputPath, 'utf8');
    let recommendations;
    
    try {
      // 尝试解析JSON
      recommendations = JSON.parse(outputContent);
      
      // 如果是单个对象，转换为数组
      if (!Array.isArray(recommendations)) {
        recommendations = [recommendations];
      }
    } catch (parseError) {
      console.log('❌ JSON解析失败，尝试清理格式...');
      
      // 尝试清理可能的格式问题
      let cleanedContent = outputContent
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      try {
        recommendations = JSON.parse(cleanedContent);
        if (!Array.isArray(recommendations)) {
          recommendations = [recommendations];
        }
      } catch (secondError) {
        console.log('❌ 清理后仍然无法解析JSON');
        console.log('请检查ChatGPT输出的格式是否正确');
        return;
      }
    }
    
    // 验证推荐内容格式
    const validatedRecommendations = recommendations.map((rec, index) => {
      // 检查必要字段
      if (!rec.tmdbShowId || !rec.title || !rec.recommendation) {
        console.log(`⚠️  第 ${index + 1} 个推荐内容格式不完整，跳过`);
        return null;
      }
      
      // 设置默认值
      return {
        tmdbShowId: rec.tmdbShowId,
        title: rec.title,
        originalTitle: rec.originalTitle || rec.title,
        backdropUrl: rec.backdropUrl || `https://image.tmdb.org/t/p/w780/default_backdrop.jpg`,
        posterUrl: rec.posterUrl || `https://image.tmdb.org/t/p/w92/default_poster.jpg`,
        recommendation: {
          text: rec.recommendation.text,
          difficulty: rec.recommendation.difficulty || 'medium',
          language: rec.recommendation.language || 'zh-CN',
          category: rec.recommendation.category || ['drama'],
          tags: rec.recommendation.tags || ['推荐']
        },
        metadata: {
          genre: rec.metadata?.genre || [18],
          rating: rec.metadata?.rating || 8.0,
          year: rec.metadata?.year || 2020,
          status: rec.metadata?.status || 'active',
          priority: rec.metadata?.priority || 7,
          views: rec.metadata?.views || 0,
          likes: rec.metadata?.likes || 0
        }
      };
    }).filter(Boolean);
    
    if (validatedRecommendations.length === 0) {
      console.log('❌ 没有有效的推荐内容');
      return;
    }
    
    console.log(`✅ 成功处理 ${validatedRecommendations.length} 个推荐内容`);
    
    // 更新manage-recommendations.js文件
    updateManageRecommendationsFile(validatedRecommendations);
    
    // 清理output.json文件
    fs.unlinkSync(outputPath);
    console.log('✅ 已清理 output.json 文件');
    
  } catch (error) {
    console.error('❌ 处理失败:', error.message);
  }
}

// 更新manage-recommendations.js文件
function updateManageRecommendationsFile(newRecommendations) {
  try {
    const manageFilePath = path.join(__dirname, 'manage-recommendations.js');
    let content = fs.readFileSync(manageFilePath, 'utf8');
    
    // 找到developerRecommendations数组的开始位置
    const startMarker = 'const developerRecommendations = [';
    const startIndex = content.indexOf(startMarker);
    
    if (startIndex === -1) {
      console.log('❌ 未找到 developerRecommendations 数组');
      return;
    }
    
    // 找到数组的结束位置
    const endMarker = '];';
    const endIndex = content.indexOf(endMarker, startIndex);
    
    if (endIndex === -1) {
      console.log('❌ 未找到数组结束位置');
      return;
    }
    
    // 生成新的推荐内容字符串
    const newRecommendationsString = newRecommendations.map(rec => {
      return `  {
    tmdbShowId: ${rec.tmdbShowId},
    title: '${rec.title}',
    originalTitle: '${rec.originalTitle}',
    backdropUrl: '${rec.backdropUrl}',
    posterUrl: '${rec.posterUrl}',
    recommendation: {
      text: '${rec.recommendation.text}',
      difficulty: '${rec.recommendation.difficulty}',
      language: '${rec.recommendation.language}',
      category: [${rec.recommendation.category.map(cat => `'${cat}'`).join(', ')}],
      tags: [${rec.recommendation.tags.map(tag => `'${tag}'`).join(', ')}]
    },
    metadata: {
      genre: [${rec.metadata.genre.join(', ')}],
      rating: ${rec.metadata.rating},
      year: ${rec.metadata.year},
      status: '${rec.metadata.status}',
      priority: ${rec.metadata.priority},
      views: ${rec.metadata.views},
      likes: ${rec.metadata.likes}
    }
  }`;
    }).join(',\n\n');
    
    // 替换数组内容
    const newContent = content.substring(0, startIndex + startMarker.length) + 
                      '\n' + newRecommendationsString + '\n' +
                      content.substring(endIndex);
    
    // 写回文件
    fs.writeFileSync(manageFilePath, newContent, 'utf8');
    
    console.log('✅ 已更新 manage-recommendations.js 文件');
    console.log(`📝 添加了 ${newRecommendations.length} 个新的推荐内容`);
    
  } catch (error) {
    console.error('❌ 更新文件失败:', error.message);
  }
}

// 显示使用说明
function showInstructions() {
  console.log('🎯 ChatGPT推荐内容生成工具');
  console.log('================================');
  console.log('');
  console.log('📝 使用步骤：');
  console.log('1. 复制下面的prompt到ChatGPT');
  console.log('2. 将ChatGPT返回的JSON复制到output.json文件');
  console.log('3. 运行此脚本自动处理并更新manage-recommendations.js');
  console.log('');
  console.log('📋 ChatGPT Prompt:');
  console.log(CHATGPT_PROMPT);
  console.log('');
  console.log('💡 提示：');
  console.log('- 可以一次生成多个剧集的推荐内容');
  console.log('- ChatGPT返回的JSON会自动验证和清理');
  console.log('- 脚本会自动更新manage-recommendations.js文件');
  console.log('- 处理完成后会自动清理output.json文件');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showInstructions();
    return;
  }
  
  if (args.includes('--show-prompt')) {
    console.log(CHATGPT_PROMPT);
    return;
  }
  
  // 检查是否有output.json文件
  const outputPath = path.join(__dirname, 'output.json');
  if (fs.existsSync(outputPath)) {
    console.log('🔄 发现 output.json 文件，开始处理...');
    processChatGPTOutput();
  } else {
    console.log('📝 未发现 output.json 文件，显示使用说明...');
    showInstructions();
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  CHATGPT_PROMPT,
  processChatGPTOutput,
  updateManageRecommendationsFile
}; 