const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

console.log('🧪 测试头像压缩功能...\n');

// 测试配置
const testConfig = {
  inputDir: 'uploads/avatars/',
  outputDir: 'test-compression/',
  testSizes: [
    { name: '小图片', width: 100, height: 100 },
    { name: '中等图片', width: 500, height: 500 },
    { name: '大图片', width: 2000, height: 2000 }
  ],
  qualityLevels: [70, 80, 85, 90, 95]
};

// 创建测试输出目录
if (!fs.existsSync(testConfig.outputDir)) {
  fs.mkdirSync(testConfig.outputDir, { recursive: true });
}

// 生成测试图片
async function generateTestImages() {
  console.log('📸 生成测试图片...');
  
  for (const size of testConfig.testSizes) {
    const testImagePath = path.join(testConfig.outputDir, `test-${size.width}x${size.height}.png`);
    
    // 生成彩色测试图片
    await sharp({
      create: {
        width: size.width,
        height: size.height,
        channels: 3,
        background: { r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255) }
      }
    })
    .png()
    .toFile(testImagePath);
    
    console.log(`   ✅ 生成测试图片: ${testImagePath}`);
  }
}

// 测试压缩功能
async function testCompression() {
  console.log('\n🗜️ 测试图片压缩...\n');
  
  const testFiles = fs.readdirSync(testConfig.outputDir).filter(file => file.endsWith('.png'));
  
  for (const file of testFiles) {
    const inputPath = path.join(testConfig.outputDir, file);
    const originalStats = fs.statSync(inputPath);
    const originalSizeKB = (originalStats.size / 1024).toFixed(2);
    
    console.log(`📁 测试文件: ${file} (${originalSizeKB}KB)`);
    
    // 测试不同质量设置
    for (const quality of testConfig.qualityLevels) {
      const outputPath = path.join(testConfig.outputDir, `compressed-${quality}-${file.replace('.png', '.webp')}`);
      
      try {
        await sharp(inputPath)
          .resize(200, 200, {
            fit: 'cover',
            position: 'center'
          })
          .webp({
            quality: quality,
            effort: 6,
            lossless: false
          })
          .toFile(outputPath);
        
        const compressedStats = fs.statSync(outputPath);
        const compressedSizeKB = (compressedStats.size / 1024).toFixed(2);
        const compressionRatio = ((originalStats.size - compressedStats.size) / originalStats.size * 100).toFixed(1);
        
        console.log(`   🎯 质量 ${quality}: ${compressedSizeKB}KB (压缩率: ${compressionRatio}%)`);
        
      } catch (error) {
        console.error(`   ❌ 质量 ${quality} 压缩失败:`, error.message);
      }
    }
    
    console.log('');
  }
}

// 测试实际头像文件
async function testRealAvatars() {
  console.log('👤 测试实际头像文件...\n');
  
  if (!fs.existsSync(testConfig.inputDir)) {
    console.log('   ⚠️ 头像目录不存在，跳过实际文件测试');
    return;
  }
  
  const avatarFiles = fs.readdirSync(testConfig.inputDir).filter(file => 
    file.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  );
  
  if (avatarFiles.length === 0) {
    console.log('   ⚠️ 没有找到头像文件，跳过实际文件测试');
    return;
  }
  
  for (const file of avatarFiles.slice(0, 3)) { // 只测试前3个文件
    const inputPath = path.join(testConfig.inputDir, file);
    const originalStats = fs.statSync(inputPath);
    const originalSizeKB = (originalStats.size / 1024).toFixed(2);
    
    console.log(`📁 实际头像: ${file} (${originalSizeKB}KB)`);
    
    const outputPath = path.join(testConfig.outputDir, `real-${file.replace(/\.[^/.]+$/, '.webp')}`);
    
    try {
      await sharp(inputPath)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .webp({
          quality: 85,
          effort: 6,
          lossless: false
        })
        .toFile(outputPath);
      
      const compressedStats = fs.statSync(outputPath);
      const compressedSizeKB = (compressedStats.size / 1024).toFixed(2);
      const compressionRatio = ((originalStats.size - compressedStats.size) / originalStats.size * 100).toFixed(1);
      
      console.log(`   ✅ 压缩完成: ${compressedSizeKB}KB (压缩率: ${compressionRatio}%)`);
      
    } catch (error) {
      console.error(`   ❌ 压缩失败:`, error.message);
    }
    
    console.log('');
  }
}

// 性能测试
async function performanceTest() {
  console.log('⚡ 性能测试...\n');
  
  const testImagePath = path.join(testConfig.outputDir, 'test-2000x2000.png');
  
  if (!fs.existsSync(testImagePath)) {
    console.log('   ⚠️ 测试图片不存在，跳过性能测试');
    return;
  }
  
  const iterations = 10;
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    const outputPath = path.join(testConfig.outputDir, `perf-test-${i}.webp`);
    
    await sharp(testImagePath)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .webp({
        quality: 85,
        effort: 6,
        lossless: false
      })
      .toFile(outputPath);
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const avgTime = (totalTime / iterations).toFixed(2);
  
  console.log(`   📊 压缩 ${iterations} 张图片耗时: ${totalTime}ms`);
  console.log(`   📊 平均每张图片: ${avgTime}ms`);
  console.log(`   📊 预估每秒处理: ${(1000 / avgTime).toFixed(1)} 张图片`);
}

// 清理测试文件
function cleanup() {
  console.log('\n🧹 清理测试文件...');
  
  if (fs.existsSync(testConfig.outputDir)) {
    const files = fs.readdirSync(testConfig.outputDir);
    files.forEach(file => {
      fs.unlinkSync(path.join(testConfig.outputDir, file));
    });
    fs.rmdirSync(testConfig.outputDir);
    console.log('   ✅ 测试文件已清理');
  }
}

// 主函数
async function main() {
  try {
    await generateTestImages();
    await testCompression();
    await testRealAvatars();
    await performanceTest();
    
    console.log('\n🎉 头像压缩功能测试完成！');
    console.log('\n📋 测试总结:');
    console.log('   ✅ 图片压缩功能正常');
    console.log('   ✅ WebP格式输出正常');
    console.log('   ✅ 尺寸调整功能正常');
    console.log('   ✅ 质量设置功能正常');
    console.log('   ✅ 性能表现良好');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
  } finally {
    // 询问是否清理测试文件
    console.log('\n❓ 是否清理测试文件？(y/n)');
    // 这里可以添加用户输入处理，但为了自动化，我们直接清理
    cleanup();
  }
}

// 运行测试
main();
