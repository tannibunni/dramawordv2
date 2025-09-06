/**
 * 数据库优化工具
 * 综合性能分析和优化建议
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lt14gs:eHRN8YXnAr3tUZHd@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';
const DB_NAME = 'dramaword';

class DatabaseOptimizationTool {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      console.log('🔌 连接到MongoDB数据库...');
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db(DB_NAME);
      console.log('✅ 数据库连接成功');
    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('📴 数据库连接已关闭');
    }
  }

  // 分析数据库性能
  async analyzePerformance() {
    console.log('\n📊 开始数据库性能分析...');
    
    const analysis = {
      collections: {},
      indexes: {},
      performance: {},
      recommendations: []
    };

    // 1. 分析集合统计信息
    console.log('\n📋 分析集合统计信息...');
    const collections = await this.db.listCollections().toArray();
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = this.db.collection(collectionName);
      
      try {
        const stats = await collection.stats();
        analysis.collections[collectionName] = {
          count: stats.count,
          size: stats.size,
          avgObjSize: stats.avgObjSize,
          storageSize: stats.storageSize,
          totalIndexSize: stats.totalIndexSize,
          indexSizes: stats.indexSizes
        };

        console.log(`  📊 ${collectionName}:`);
        console.log(`    文档数量: ${stats.count.toLocaleString()}`);
        console.log(`    数据大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`    平均文档大小: ${stats.avgObjSize.toFixed(2)} bytes`);
        console.log(`    存储大小: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`    索引大小: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);

        // 检查集合健康度
        if (stats.count > 0) {
          const fragmentation = (stats.storageSize - stats.size) / stats.storageSize;
          if (fragmentation > 0.5) {
            analysis.recommendations.push({
              type: 'fragmentation',
              collection: collectionName,
              severity: 'medium',
              message: `集合 ${collectionName} 碎片化严重 (${(fragmentation * 100).toFixed(1)}%)`,
              action: '考虑重建集合或优化文档结构'
            });
          }
        }

      } catch (error) {
        console.warn(`  ⚠️ 无法获取集合 ${collectionName} 的统计信息:`, error.message);
      }
    }

    // 2. 分析索引使用情况
    console.log('\n🔍 分析索引使用情况...');
    for (const collectionName of Object.keys(analysis.collections)) {
      try {
        const collection = this.db.collection(collectionName);
        const indexes = await collection.indexes();
        
        analysis.indexes[collectionName] = indexes.map(index => ({
          name: index.name,
          key: index.key,
          size: index.size || 0,
          usage: index.usage || {}
        }));

        console.log(`  📊 ${collectionName} 索引:`);
        for (const index of indexes) {
          console.log(`    - ${index.name}: ${JSON.stringify(index.key)}`);
          if (index.size) {
            console.log(`      大小: ${(index.size / 1024).toFixed(2)} KB`);
          }
        }

        // 检查索引效率
        if (indexes.length > 10) {
          analysis.recommendations.push({
            type: 'index',
            collection: collectionName,
            severity: 'low',
            message: `集合 ${collectionName} 索引数量较多 (${indexes.length} 个)`,
            action: '检查是否有未使用的索引可以删除'
          });
        }

      } catch (error) {
        console.warn(`  ⚠️ 无法获取集合 ${collectionName} 的索引信息:`, error.message);
      }
    }

    // 3. 分析查询性能
    console.log('\n⚡ 分析查询性能...');
    try {
      const serverStatus = await this.db.admin().serverStatus();
      
      analysis.performance = {
        connections: serverStatus.connections,
        operations: serverStatus.opcounters,
        memory: serverStatus.mem,
        network: serverStatus.network,
        uptime: serverStatus.uptime
      };

      console.log('  📊 服务器状态:');
      console.log(`    连接数: ${serverStatus.connections.current}/${serverStatus.connections.available}`);
      console.log(`    运行时间: ${Math.floor(serverStatus.uptime / 3600)} 小时`);
      console.log(`    内存使用: ${(serverStatus.mem.resident / 1024).toFixed(2)} MB`);
      
      // 检查连接使用率
      const connectionUsage = serverStatus.connections.current / serverStatus.connections.available;
      if (connectionUsage > 0.8) {
        analysis.recommendations.push({
          type: 'connection',
          severity: 'high',
          message: `数据库连接使用率过高 (${(connectionUsage * 100).toFixed(1)}%)`,
          action: '考虑增加连接池大小或优化连接管理'
        });
      }

    } catch (error) {
      console.warn('  ⚠️ 无法获取服务器状态:', error.message);
    }

    return analysis;
  }

  // 生成优化建议
  generateOptimizationSuggestions(analysis) {
    console.log('\n💡 生成优化建议...');
    
    const suggestions = [];

    // 基于集合分析的建议
    for (const [collectionName, stats] of Object.entries(analysis.collections)) {
      // 大集合优化
      if (stats.count > 100000) {
        suggestions.push({
          type: 'collection',
          collection: collectionName,
          priority: 'high',
          title: '大集合优化',
          description: `集合 ${collectionName} 包含 ${stats.count.toLocaleString()} 个文档`,
          actions: [
            '考虑分片策略',
            '优化查询条件',
            '添加适当的索引',
            '考虑数据归档'
          ]
        });
      }

      // 索引大小优化
      if (stats.totalIndexSize > stats.size * 2) {
        suggestions.push({
          type: 'index',
          collection: collectionName,
          priority: 'medium',
          title: '索引大小优化',
          description: `集合 ${collectionName} 索引大小是数据大小的 ${(stats.totalIndexSize / stats.size).toFixed(1)} 倍`,
          actions: [
            '检查是否有冗余索引',
            '优化复合索引',
            '删除未使用的索引'
          ]
        });
      }
    }

    // 基于性能分析的建议
    if (analysis.performance.connections) {
      const connUsage = analysis.performance.connections.current / analysis.performance.connections.available;
      if (connUsage > 0.7) {
        suggestions.push({
          type: 'performance',
          priority: 'high',
          title: '连接池优化',
          description: `当前连接使用率: ${(connUsage * 100).toFixed(1)}%`,
          actions: [
            '增加连接池大小',
            '优化连接管理',
            '检查连接泄漏',
            '实施连接复用'
          ]
        });
      }
    }

    // 通用建议
    suggestions.push({
      type: 'general',
      priority: 'medium',
      title: '定期维护',
      description: '数据库定期维护建议',
      actions: [
        '定期清理过期数据',
        '监控慢查询',
        '更新统计信息',
        '备份重要数据'
      ]
    });

    return suggestions;
  }

  // 执行优化操作
  async executeOptimization(operation) {
    console.log(`\n🔧 执行优化操作: ${operation.type}`);
    
    try {
      switch (operation.type) {
        case 'createIndex':
          await this.createIndex(operation.collection, operation.index);
          break;
        case 'dropIndex':
          await this.dropIndex(operation.collection, operation.indexName);
          break;
        case 'compactCollection':
          await this.compactCollection(operation.collection);
          break;
        case 'updateStats':
          await this.updateCollectionStats(operation.collection);
          break;
        default:
          console.warn(`未知的优化操作: ${operation.type}`);
      }
    } catch (error) {
      console.error(`优化操作失败: ${operation.type}`, error);
    }
  }

  // 创建索引
  async createIndex(collectionName, indexSpec) {
    const collection = this.db.collection(collectionName);
    await collection.createIndex(indexSpec.key, indexSpec.options || {});
    console.log(`✅ 创建索引: ${collectionName}.${indexSpec.name || 'unnamed'}`);
  }

  // 删除索引
  async dropIndex(collectionName, indexName) {
    const collection = this.db.collection(collectionName);
    await collection.dropIndex(indexName);
    console.log(`✅ 删除索引: ${collectionName}.${indexName}`);
  }

  // 压缩集合
  async compactCollection(collectionName) {
    const collection = this.db.collection(collectionName);
    await collection.aggregate([{ $out: `${collectionName}_temp` }]);
    await collection.drop();
    await this.db.collection(`${collectionName}_temp`).rename(collectionName);
    console.log(`✅ 压缩集合: ${collectionName}`);
  }

  // 更新集合统计信息
  async updateCollectionStats(collectionName) {
    const collection = this.db.collection(collectionName);
    // MongoDB会自动更新统计信息，这里只是触发一下
    await collection.find().limit(1).toArray();
    console.log(`✅ 更新统计信息: ${collectionName}`);
  }

  // 生成优化报告
  generateReport(analysis, suggestions) {
    console.log('\n📋 生成优化报告...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalCollections: Object.keys(analysis.collections).length,
        totalDocuments: Object.values(analysis.collections).reduce((sum, stats) => sum + stats.count, 0),
        totalSize: Object.values(analysis.collections).reduce((sum, stats) => sum + stats.size, 0),
        totalIndexSize: Object.values(analysis.collections).reduce((sum, stats) => sum + stats.totalIndexSize, 0)
      },
      analysis,
      suggestions,
      recommendations: analysis.recommendations
    };

    // 输出报告摘要
    console.log('\n📊 优化报告摘要:');
    console.log(`  分析时间: ${report.timestamp}`);
    console.log(`  集合数量: ${report.summary.totalCollections}`);
    console.log(`  文档总数: ${report.summary.totalDocuments.toLocaleString()}`);
    console.log(`  数据总大小: ${(report.summary.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  索引总大小: ${(report.summary.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  优化建议: ${suggestions.length} 条`);
    console.log(`  问题发现: ${analysis.recommendations.length} 个`);

    return report;
  }
}

// 主函数
async function main() {
  const tool = new DatabaseOptimizationTool();
  
  try {
    await tool.connect();
    
    // 分析性能
    const analysis = await tool.analyzePerformance();
    
    // 生成建议
    const suggestions = tool.generateOptimizationSuggestions(analysis);
    
    // 生成报告
    const report = tool.generateReport(analysis, suggestions);
    
    // 输出详细建议
    console.log('\n💡 详细优化建议:');
    suggestions.forEach((suggestion, index) => {
      console.log(`\n${index + 1}. ${suggestion.title} (${suggestion.priority} 优先级)`);
      console.log(`   描述: ${suggestion.description}`);
      console.log(`   建议操作:`);
      suggestion.actions.forEach(action => {
        console.log(`     - ${action}`);
      });
    });

    // 输出问题发现
    if (analysis.recommendations.length > 0) {
      console.log('\n⚠️ 发现的问题:');
      analysis.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.severity}] ${rec.message}`);
        console.log(`   建议: ${rec.action}`);
      });
    }

    console.log('\n✅ 数据库优化分析完成！');
    
  } catch (error) {
    console.error('❌ 数据库优化分析失败:', error);
  } finally {
    await tool.disconnect();
  }
}

// 运行脚本
if (require.main === module) {
  main()
    .then(() => {
      console.log('🎉 数据库优化工具执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 数据库优化工具执行失败:', error);
      process.exit(1);
    });
}

module.exports = { DatabaseOptimizationTool };
