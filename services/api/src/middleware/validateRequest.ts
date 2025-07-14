import { Request, Response, NextFunction } from 'express';

// 验证规则接口
interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: string[];
  format?: 'email' | 'url';
  pattern?: RegExp;
}

// 验证模式接口
interface ValidationSchema {
  body?: Record<string, ValidationRule>;
  query?: Record<string, ValidationRule>;
  params?: Record<string, ValidationRule>;
}

// 验证错误接口
interface ValidationError {
  field: string;
  message: string;
}

// 验证请求中间件
export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: ValidationError[] = [];

    // 验证请求体
    if (schema.body) {
      validateObject(req.body, schema.body, 'body', errors);
    }

    // 验证查询参数
    if (schema.query) {
      validateObject(req.query, schema.query, 'query', errors);
    }

    // 验证路径参数
    if (schema.params) {
      validateObject(req.params, schema.params, 'params', errors);
    }

    // 如果有验证错误，返回错误响应
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        errors
      });
    }

    next();
  };
};

// 验证对象
function validateObject(
  data: any,
  schema: Record<string, ValidationRule>,
  prefix: string,
  errors: ValidationError[]
) {
  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    const fieldPath = `${prefix}.${field}`;

    // 检查必填字段
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: fieldPath,
        message: `${field} 是必填字段`
      });
      continue;
    }

    // 如果字段不是必填且为空，跳过验证
    if (value === undefined || value === null) {
      continue;
    }

    // 验证类型
    if (!validateType(value, rule.type)) {
      errors.push({
        field: fieldPath,
        message: `${field} 必须是 ${rule.type} 类型`
      });
      continue;
    }

    // 验证字符串类型
    if (rule.type === 'string') {
      validateString(value, rule, fieldPath, errors);
    }

    // 验证数字类型
    if (rule.type === 'number') {
      validateNumber(value, rule, fieldPath, errors);
    }

    // 验证枚举值
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field: fieldPath,
        message: `${field} 必须是以下值之一: ${rule.enum.join(', ')}`
      });
    }
  }
}

// 验证类型
function validateType(value: any, type: string): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    default:
      return true;
  }
}

// 验证字符串
function validateString(
  value: string,
  rule: ValidationRule,
  fieldPath: string,
  errors: ValidationError[]
) {
  // 验证长度
  if (rule.minLength && value.length < rule.minLength) {
    errors.push({
      field: fieldPath,
      message: `${fieldPath.split('.').pop()} 长度不能少于 ${rule.minLength} 个字符`
    });
  }

  if (rule.maxLength && value.length > rule.maxLength) {
    errors.push({
      field: fieldPath,
      message: `${fieldPath.split('.').pop()} 长度不能超过 ${rule.maxLength} 个字符`
    });
  }

  // 验证格式
  if (rule.format === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      errors.push({
        field: fieldPath,
        message: `${fieldPath.split('.').pop()} 必须是有效的邮箱地址`
      });
    }
  }

  if (rule.format === 'url') {
    try {
      new URL(value);
    } catch {
      errors.push({
        field: fieldPath,
        message: `${fieldPath.split('.').pop()} 必须是有效的URL`
      });
    }
  }

  // 验证正则表达式
  if (rule.pattern && !rule.pattern.test(value)) {
    errors.push({
      field: fieldPath,
      message: `${fieldPath.split('.').pop()} 格式不正确`
    });
  }
}

// 验证数字
function validateNumber(
  value: number,
  rule: ValidationRule,
  fieldPath: string,
  errors: ValidationError[]
) {
  // 验证最小值
  if (rule.min !== undefined && value < rule.min) {
    errors.push({
      field: fieldPath,
      message: `${fieldPath.split('.').pop()} 不能小于 ${rule.min}`
    });
  }

  // 验证最大值
  if (rule.max !== undefined && value > rule.max) {
    errors.push({
      field: fieldPath,
      message: `${fieldPath.split('.').pop()} 不能大于 ${rule.max}`
    });
  }
} 