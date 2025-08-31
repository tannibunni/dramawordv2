import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';
import sharp from 'sharp';
import { logger } from '../utils/logger';

// 配置存储 - 改进版本
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/avatars/';
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成更安全的文件名
    const userId = (req as any).user?.id || 'unknown';
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    
    // 只允许图片扩展名
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!allowedExts.includes(ext)) {
      return cb(new Error('不支持的文件格式，请上传 JPG、PNG、GIF 或 WebP 格式的图片'), '');
    }
    
    cb(null, `avatar-${userId}-${timestamp}-${random}${ext}`);
  }
});

// 改进的文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 检查MIME类型
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件 (JPG, PNG, GIF, WebP)'));
  }
};

// 创建上传中间件 - 改进版本
export const uploadAvatar = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 降低到2MB
    files: 1, // 只允许一个文件
    fieldSize: 1024 * 1024 // 1MB字段大小限制
  }
});

// 头像处理工具函数 - 带图片压缩
export const processAvatarFile = async (filePath: string): Promise<string> => {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error('头像文件不存在');
    }
    
    // 获取原始文件信息
    const originalStats = fs.statSync(filePath);
    const originalSizeInMB = originalStats.size / (1024 * 1024);
    
    logger.info(`[AvatarUpload] 开始处理头像文件: ${filePath}, 原始大小: ${originalSizeInMB.toFixed(2)}MB`);
    
    // 使用Sharp处理图片
    const processedImage = sharp(filePath);
    
    // 获取图片元数据
    const metadata = await processedImage.metadata();
    logger.info(`[AvatarUpload] 图片元数据: ${metadata.width}x${metadata.height}, 格式: ${metadata.format}`);
    
    // 图片压缩和优化配置
    const compressionConfig = {
      // 调整尺寸：最大200x200像素
      width: Math.min(metadata.width || 200, 200),
      height: Math.min(metadata.height || 200, 200),
      // 保持宽高比
      fit: 'cover' as const,
      // 居中裁剪
      position: 'center' as const,
      // 输出格式：WebP（更好的压缩率）
      format: 'webp' as const,
      // 质量设置
      quality: 85,
      // 优化选项
      options: {
        effort: 6, // 压缩努力程度 (0-6, 6为最高质量)
        lossless: false, // 允许有损压缩以获得更好的压缩率
      }
    };
    
    // 生成压缩后的文件路径
    const compressedFilePath = filePath.replace(/\.[^/.]+$/, '_compressed.webp');
    
    // 执行图片压缩
    await processedImage
      .resize(compressionConfig.width, compressionConfig.height, {
        fit: compressionConfig.fit,
        position: compressionConfig.position
      })
      .webp({
        quality: compressionConfig.quality,
        effort: compressionConfig.options.effort,
        lossless: compressionConfig.options.lossless
      })
      .toFile(compressedFilePath);
    
    // 获取压缩后的文件信息
    const compressedStats = fs.statSync(compressedFilePath);
    const compressedSizeInMB = compressedStats.size / (1024 * 1024);
    const compressionRatio = ((originalStats.size - compressedStats.size) / originalStats.size * 100).toFixed(1);
    
    logger.info(`[AvatarUpload] 图片压缩完成: ${compressedSizeInMB.toFixed(2)}MB, 压缩率: ${compressionRatio}%`);
    
    // 删除原始文件，保留压缩后的文件
    fs.unlinkSync(filePath);
    
    // 重命名压缩后的文件为原文件名（但保持.webp扩展名）
    const finalFilePath = filePath.replace(/\.[^/.]+$/, '.webp');
    fs.renameSync(compressedFilePath, finalFilePath);
    
    logger.info(`[AvatarUpload] 头像文件处理完成: ${finalFilePath}`);
    
    return finalFilePath;
    
  } catch (error) {
    logger.error('[AvatarUpload] 头像文件处理失败:', error);
    throw error;
  }
};

// 清理旧头像文件
export const cleanupOldAvatar = async (oldAvatarUrl: string): Promise<void> => {
  try {
    if (!oldAvatarUrl) return;
    
    // 提取文件名
    const filename = path.basename(oldAvatarUrl);
    const filePath = path.join('uploads/avatars/', filename);
    
    // 删除旧文件
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`[AvatarUpload] 已删除旧头像文件: ${filename}`);
    } else {
      logger.warn(`[AvatarUpload] 旧头像文件不存在: ${filename}`);
    }
  } catch (error) {
    logger.error('[AvatarUpload] 清理旧头像文件失败:', error);
    // 不抛出错误，避免影响主流程
  }
};
