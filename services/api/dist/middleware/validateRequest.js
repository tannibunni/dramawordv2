"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (schema) => {
    return (req, res, next) => {
        const errors = [];
        if (schema.body) {
            validateObject(req.body, schema.body, 'body', errors);
        }
        if (schema.query) {
            validateObject(req.query, schema.query, 'query', errors);
        }
        if (schema.params) {
            validateObject(req.params, schema.params, 'params', errors);
        }
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
exports.validateRequest = validateRequest;
function validateObject(data, schema, prefix, errors) {
    for (const [field, rule] of Object.entries(schema)) {
        const value = data[field];
        const fieldPath = `${prefix}.${field}`;
        if (rule.required && (value === undefined || value === null || value === '')) {
            errors.push({
                field: fieldPath,
                message: `${field} 是必填字段`
            });
            continue;
        }
        if (value === undefined || value === null) {
            continue;
        }
        if (!validateType(value, rule.type)) {
            errors.push({
                field: fieldPath,
                message: `${field} 必须是 ${rule.type} 类型`
            });
            continue;
        }
        if (rule.type === 'string') {
            validateString(value, rule, fieldPath, errors);
        }
        if (rule.type === 'number') {
            validateNumber(value, rule, fieldPath, errors);
        }
        if (rule.enum && !rule.enum.includes(value)) {
            errors.push({
                field: fieldPath,
                message: `${field} 必须是以下值之一: ${rule.enum.join(', ')}`
            });
        }
    }
}
function validateType(value, type) {
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
function validateString(value, rule, fieldPath, errors) {
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
        }
        catch {
            errors.push({
                field: fieldPath,
                message: `${fieldPath.split('.').pop()} 必须是有效的URL`
            });
        }
    }
    if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
            field: fieldPath,
            message: `${fieldPath.split('.').pop()} 格式不正确`
        });
    }
}
function validateNumber(value, rule, fieldPath, errors) {
    if (rule.min !== undefined && value < rule.min) {
        errors.push({
            field: fieldPath,
            message: `${fieldPath.split('.').pop()} 不能小于 ${rule.min}`
        });
    }
    if (rule.max !== undefined && value > rule.max) {
        errors.push({
            field: fieldPath,
            message: `${fieldPath.split('.').pop()} 不能大于 ${rule.max}`
        });
    }
}
