const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 🎬 自动生成推荐内容脚本
// 功能：定期从TMDB获取热门剧集，智能生成推荐内容，并上传到云端数据库

class AutoRecommendationGenerator {
  constructor() {
    this.API_BASE_URL = 'https://dramawordv2.onrender.com';
    this.TMDB_BASE_URL = 'https://api.themoviedb.org/3';
    this.TMDB_API_KEY = process.env.TMDB_API_KEY || 'your_tmdb_api_key_here';
    this.BATCH_SIZE = 20; // 每次生成的推荐数量
    this.UPDATE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7天更新一次
  }

  // 从TMDB获取热门剧集
  async getPopularShows(page = 1, language = 'zh-CN') {
    try {
      const response = await axios.get(`${this.TMDB_BASE_URL}/tv/popular`, {
        params: {
          api_key: this.TMDB_API_KEY,
          language: language,
          page: page
        }
      });
      return response.data.results;
    } catch (error) {
      console.error('获取TMDB热门剧集失败:', error.message);
      return [];
    }
  }

  // 智能生成推荐文案
  generateRecommendationText(show, language) {
    const isChinese = language === 'zh-CN';
    
    const rating = show.vote_average;
    const genres = show.genre_ids || [];
    const year = new Date(show.first_air_date).getFullYear();
    
    // 评分等级
    let ratingLevel = '';
    if (rating >= 9.0) {
      ratingLevel = isChinese ? '神级' : 'Masterpiece';
    } else if (rating >= 8.5) {
      ratingLevel = isChinese ? '高分' : 'Highly Rated';
    } else if (rating >= 8.0) {
      ratingLevel = isChinese ? '优秀' : 'Excellent';
    } else {
      ratingLevel = isChinese ? '值得一看' : 'Worth Watching';
    }
    
    // 根据类型生成推荐文案
    let genreRecommendation = '';
    if (genres.includes(35)) { // 喜剧
      genreRecommendation = isChinese 
        ? '轻松幽默的喜剧，学英语必备！对话简单清晰，新手友好'
        : 'Light-hearted comedy perfect for English learning! Simple dialogues, beginner-friendly';
    } else if (genres.includes(80)) { // 犯罪
      genreRecommendation = isChinese 
        ? '犯罪剧巅峰之作，紧张刺激的剧情！学英语的同时体验精彩故事'
        : 'Crime drama masterpiece with thrilling plots! Learn English while enjoying amazing stories';
    } else if (genres.includes(18)) { // 剧情
      genreRecommendation = isChinese 
        ? '深度剧情剧，探讨人性！英语表达丰富，适合进阶学习'
        : 'Deep drama exploring human nature! Rich English expressions, perfect for advanced learners';
    } else if (genres.includes(9648)) { // 悬疑
      genreRecommendation = isChinese 
        ? '悬疑推理神作，烧脑剧情！英语词汇专业，挑战你的理解能力'
        : 'Mystery thriller masterpiece with mind-bending plots! Professional vocabulary, challenges your comprehension';
    } else if (genres.includes(10751)) { // 家庭
      genreRecommendation = isChinese 
        ? '温暖家庭剧，治愈系必看！日常英语对话，实用性强'
        : 'Heartwarming family drama, must-watch! Daily English conversations, highly practical';
    } else if (genres.includes(10765)) { // 科幻奇幻
      genreRecommendation = isChinese 
        ? '史诗级奇幻巨作，视觉震撼！英语词汇丰富，适合高级学习者'
        : 'Epic fantasy masterpiece with stunning visuals! Rich vocabulary, perfect for advanced learners';
    } else {
      genreRecommendation = isChinese 
        ? '不容错过的经典剧集！学英语的同时享受精彩内容'
        : 'Classic series not to be missed! Enjoy great content while learning English';
    }
    
    const yearLabel = isChinese ? `${year}年` : `${year}`;
    
    // 推荐文案模板
    const templates = [
      isChinese 
        ? `${ratingLevel}${yearLabel}必看！${genreRecommendation}`
        : `${ratingLevel} ${yearLabel} Must-Watch! ${genreRecommendation}`,
      isChinese 
        ? `${genreRecommendation}，${ratingLevel}评分${rating.toFixed(1)}分！`
        : `${genreRecommendation}, ${ratingLevel} rating ${rating.toFixed(1)}!`,
      isChinese 
        ? `学英语必备神剧！${genreRecommendation}，强烈安利`
        : `Essential for English learning! ${genreRecommendation}, highly recommended`,
      isChinese 
        ? `${yearLabel}年度神作！${genreRecommendation}，看完英语突飞猛进`
        : `${yearLabel} Masterpiece! ${genreRecommendation}, boost your English skills`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // 获取难度等级
  getDifficulty(show) {
    if (show.genre_ids?.includes(35)) return 'easy';
    if (show.vote_average > 8.5) return 'hard';
    if (show.vote_average > 7.5) return 'medium';
    return 'easy';
  }

  // 生成推荐内容
  async generateRecommendations(language = 'zh-CN') {
    console.log(`🎬 开始生成${language === 'zh-CN' ? '中文' : '英文'}推荐内容...`);
    
    // 获取热门剧集
    const popularShows = await this.getPopularShows(1, language);
    if (popularShows.length === 0) {
      console.log('❌ 无法获取热门剧集数据');
      return [];
    }
    
    // 生成推荐内容
    const recommendations = popularShows.slice(0, this.BATCH_SIZE).map(show => {
      const recommendation = this.generateRecommendationText(show, language);
      const difficulty = this.getDifficulty(show);
      
      return {
        tmdbShowId: show.id,
        title: show.name,
        originalTitle: show.original_name,
        backdropUrl: `https://image.tmdb.org/t/p/w780${show.backdrop_path}`,
        posterUrl: `https://image.tmdb.org/t/p/w92${show.poster_path}`,
        recommendation: {
          text: recommendation,
          difficulty: difficulty,
          language: language,
          category: this.getCategoryFromGenres(show.genre_ids),
          tags: this.generateTags(show, language)
        },
        metadata: {
          genre: show.genre_ids,
          rating: show.vote_average,
          year: new Date(show.first_air_date).getFullYear(),
          status: 'active',
          priority: this.calculatePriority(show),
          views: 0,
          likes: 0
        },
        author: {
          id: 'auto-generator',
          name: 'Auto Generator'
        }
      };
    });
    
    console.log(`✅ 生成了 ${recommendations.length} 个推荐内容`);
    return recommendations;
  }

  // 根据类型生成分类
  getCategoryFromGenres(genreIds) {
    const categories = [];
    if (genreIds.includes(35)) categories.push('comedy');
    if (genreIds.includes(80)) categories.push('crime');
    if (genreIds.includes(18)) categories.push('drama');
    if (genreIds.includes(9648)) categories.push('mystery');
    if (genreIds.includes(10751)) categories.push('family');
    if (genreIds.includes(10765)) categories.push('sci-fi');
    return categories.length > 0 ? categories : ['drama'];
  }

  // 生成标签
  generateTags(show, language) {
    const isChinese = language === 'zh-CN';
    const tags = [];
    
    if (show.vote_average >= 9.0) {
      tags.push(isChinese ? '神级' : 'Masterpiece');
    }
    if (show.genre_ids?.includes(35)) {
      tags.push(isChinese ? '喜剧' : 'Comedy');
    }
    if (show.genre_ids?.includes(80)) {
      tags.push(isChinese ? '犯罪' : 'Crime');
    }
    if (show.genre_ids?.includes(18)) {
      tags.push(isChinese ? '剧情' : 'Drama');
    }
    
    tags.push(isChinese ? '学英语' : 'English Learning');
    return tags;
  }

  // 计算优先级
  calculatePriority(show) {
    let priority = 5; // 默认优先级
    
    // 根据评分调整
    if (show.vote_average >= 9.0) priority += 3;
    else if (show.vote_average >= 8.5) priority += 2;
    else if (show.vote_average >= 8.0) priority += 1;
    
    // 根据年份调整（新剧优先）
    const year = new Date(show.first_air_date).getFullYear();
    const currentYear = new Date().getFullYear();
    if (year >= currentYear - 2) priority += 1;
    
    return Math.min(priority, 10); // 最高优先级为10
  }

  // 上传到云端数据库
  async uploadToCloud(recommendations) {
    try {
      console.log('📤 上传推荐内容到云端数据库...');
      
      const response = await axios.post(`${this.API_BASE_URL}/api/recommendations/batch-import`, {
        recommendations: recommendations
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        console.log(`✅ 成功上传 ${recommendations.length} 个推荐内容`);
        return true;
      } else {
        console.log('❌ 上传失败:', response.data.error);
        return false;
      }
    } catch (error) {
      console.error('❌ 上传失败:', error.message);
      return false;
    }
  }

  // 保存到本地文件（备用）
  saveToLocalFile(recommendations, language) {
    const filename = `auto-generated-recommendations-${language}-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(__dirname, filename);
    
    try {
      fs.writeFileSync(filepath, JSON.stringify(recommendations, null, 2));
      console.log(`💾 推荐内容已保存到本地文件: ${filename}`);
      return true;
    } catch (error) {
      console.error('❌ 保存本地文件失败:', error.message);
      return false;
    }
  }

  // 主执行函数
  async run() {
    console.log('🚀 开始自动生成推荐内容...');
    console.log('================================');
    
    const startTime = Date.now();
    
    try {
      // 生成中文推荐内容
      const zhRecommendations = await this.generateRecommendations('zh-CN');
      
      // 生成英文推荐内容
      const enRecommendations = await this.generateRecommendations('en-US');
      
      // 合并所有推荐内容
      const allRecommendations = [...zhRecommendations, ...enRecommendations];
      
      if (allRecommendations.length > 0) {
        // 上传到云端
        const uploadSuccess = await this.uploadToCloud(allRecommendations);
        
        if (!uploadSuccess) {
          // 如果上传失败，保存到本地文件
          this.saveToLocalFile(allRecommendations, 'mixed');
        }
        
        // 保存中英文分别到本地文件
        this.saveToLocalFile(zhRecommendations, 'zh-CN');
        this.saveToLocalFile(enRecommendations, 'en-US');
      }
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log('\n✨ 自动生成完成！');
      console.log(`📊 统计信息:`);
      console.log(`   - 中文推荐: ${zhRecommendations.length} 个`);
      console.log(`   - 英文推荐: ${enRecommendations.length} 个`);
      console.log(`   - 总推荐: ${allRecommendations.length} 个`);
      console.log(`   - 耗时: ${duration.toFixed(2)} 秒`);
      
    } catch (error) {
      console.error('❌ 自动生成失败:', error.message);
    }
  }
}

// 定时执行函数
async function scheduleGeneration() {
  const generator = new AutoRecommendationGenerator();
  
  console.log('⏰ 设置定时生成任务...');
  console.log(`🔄 更新间隔: ${generator.UPDATE_INTERVAL / (24 * 60 * 60 * 1000)} 天`);
  
  // 立即执行一次
  await generator.run();
  
  // 设置定时任务
  setInterval(async () => {
    console.log('\n🔄 定时任务触发，开始生成新的推荐内容...');
    await generator.run();
  }, generator.UPDATE_INTERVAL);
}

// 命令行参数处理
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('🎬 自动推荐内容生成器');
  console.log('================================');
  console.log('使用方法:');
  console.log('  node auto-generate-recommendations.js          # 执行一次生成');
  console.log('  node auto-generate-recommendations.js --schedule  # 启动定时任务');
  console.log('  node auto-generate-recommendations.js --help   # 显示帮助');
  console.log('');
  console.log('环境变量:');
  console.log('  TMDB_API_KEY=your_api_key  # TMDB API密钥');
  console.log('');
  console.log('功能特性:');
  console.log('  - 自动从TMDB获取热门剧集');
  console.log('  - 智能生成个性化推荐文案');
  console.log('  - 支持中英文双语内容');
  console.log('  - 自动上传到云端数据库');
  console.log('  - 本地文件备份');
  console.log('  - 定时自动更新');
} else if (args.includes('--schedule')) {
  scheduleGeneration();
} else {
  // 执行一次生成
  const generator = new AutoRecommendationGenerator();
  generator.run();
}

module.exports = AutoRecommendationGenerator; 