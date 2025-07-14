import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { logger } from '../utils/logger';

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
      };
    }
  }
}

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 生成JWT token
export const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// 验证JWT token中间件
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    // 检查用户是否存在
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (!user.auth.isActive) {
      return res.status(403).json({
        success: false,
        message: '账号已被禁用'
      });
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: user._id.toString(),
      username: user.username
    };

    next();
  } catch (error) {
    logger.error('Token验证失败:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期'
      });
    }

    res.status(500).json({
      success: false,
      message: '认证失败'
    });
  }
};

// 可选认证中间件（不强制要求token）
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = await User.findById(decoded.id);
      
      if (user && user.auth.isActive) {
        req.user = {
          id: user._id.toString(),
          username: user.username
        };
      }
    }

    next();
  } catch (error) {
    // 可选认证失败不影响请求继续
    next();
  }
};

// 检查用户权限中间件
export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '需要认证'
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 这里可以添加角色检查逻辑
      // 目前所有认证用户都有基本权限
      next();
    } catch (error) {
      logger.error('权限检查失败:', error);
      res.status(500).json({
        success: false,
        message: '权限检查失败'
      });
    }
  };
}; 