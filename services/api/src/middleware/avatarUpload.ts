import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';

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
      return cb(new Error('不支持的文件格式'), '');
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

// 头像处理工具函数
export const processAvatarFile = async (filePath: string): Promise<string> => {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error('头像文件不存在');
    }
    
    // 获取文件信息
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    // 如果文件超过1MB，记录警告
    if (fileSizeInMB > 1) {
      console.warn(`⚠️ 头像文件较大: ${fileSizeInMB.toFixed(2)}MB`);
    }
    
    // 这里可以添加图片压缩逻辑
    // 目前先返回原文件路径
    return filePath;
    
  } catch (error) {
    console.error('头像文件处理失败:', error);
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
      console.log(`🗑️ 已删除旧头像文件: ${filename}`);
    }
  } catch (error) {
    console.error('清理旧头像文件失败:', error);
    // 不抛出错误，避免影响主流程
  }
};
