import crypto from 'crypto';
import { logger } from './logger';

// 加密配置
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

// 从环境变量获取加密密钥，如果没有则生成一个
let ENCRYPTION_KEY: Buffer;

try {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey) {
    ENCRYPTION_KEY = Buffer.from(envKey, 'hex');
    if (ENCRYPTION_KEY.length !== ENCRYPTION_KEY_LENGTH) {
      throw new Error('环境变量ENCRYPTION_KEY长度不正确');
    }
    logger.info('✅ 使用环境变量中的加密密钥');
  } else {
    // 生成新的加密密钥
    ENCRYPTION_KEY = crypto.randomBytes(ENCRYPTION_KEY_LENGTH);
    logger.warn('⚠️ 未找到环境变量ENCRYPTION_KEY，已生成新的加密密钥');
    logger.warn('⚠️ 请设置ENCRYPTION_KEY环境变量以确保数据一致性');
    logger.warn(`⚠️ 生成的密钥: ${ENCRYPTION_KEY.toString('hex')}`);
  }
} catch (error) {
  logger.error('❌ 加密密钥初始化失败:', error);
  // 使用默认密钥（仅用于开发环境）
  ENCRYPTION_KEY = crypto.randomBytes(ENCRYPTION_KEY_LENGTH);
  logger.warn('⚠️ 使用默认加密密钥（仅开发环境）');
}

/**
 * 加密数据
 * @param data 要加密的数据
 * @returns 加密后的数据（Base64编码）
 */
export async function encryptData(data: string): Promise<string> {
  try {
    // 生成随机IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // 创建加密器
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
    cipher.setAAD(Buffer.from('dramaword-sync', 'utf8')); // 附加认证数据
    
    // 加密数据
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // 获取认证标签
    const authTag = cipher.getAuthTag();
    
    // 组合IV、认证标签和加密数据
    const result = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);
    
    // 返回Base64编码的结果
    return result.toString('base64');
    
  } catch (error) {
    logger.error('❌ 数据加密失败:', error);
    throw new Error('数据加密失败');
  }
}

/**
 * 解密数据
 * @param encryptedData 加密后的数据（Base64编码）
 * @returns 解密后的原始数据
 */
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    // 解码Base64数据
    const data = Buffer.from(encryptedData, 'base64');
    
    // 提取IV、认证标签和加密数据
    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    // 创建解密器
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAAD(Buffer.from('dramaword-sync', 'utf8')); // 设置附加认证数据
    decipher.setAuthTag(authTag); // 设置认证标签
    
    // 解密数据
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
    
  } catch (error) {
    logger.error('❌ 数据解密失败:', error);
    throw new Error('数据解密失败');
  }
}

/**
 * 生成安全的随机密钥
 * @returns 十六进制编码的密钥
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(ENCRYPTION_KEY_LENGTH).toString('hex');
}

/**
 * 验证加密密钥格式
 * @param key 要验证的密钥
 * @returns 是否有效
 */
export function validateEncryptionKey(key: string): boolean {
  try {
    const buffer = Buffer.from(key, 'hex');
    return buffer.length === ENCRYPTION_KEY_LENGTH;
  } catch {
    return false;
  }
}

/**
 * 获取加密信息
 * @returns 加密配置信息
 */
export function getEncryptionInfo(): {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  authTagLength: number;
  hasCustomKey: boolean;
} {
  return {
    algorithm: ENCRYPTION_ALGORITHM,
    keyLength: ENCRYPTION_KEY_LENGTH * 8, // 转换为位
    ivLength: IV_LENGTH * 8,
    authTagLength: AUTH_TAG_LENGTH * 8,
    hasCustomKey: !!process.env.ENCRYPTION_KEY
  };
}

/**
 * 测试加密功能
 * @returns 测试结果
 */
export async function testEncryption(): Promise<boolean> {
  try {
    const testData = 'Hello, DramaWord! 🎭';
    const encrypted = await encryptData(testData);
    const decrypted = await decryptData(encrypted);
    
    const success = decrypted === testData;
    
    if (success) {
      logger.info('✅ 加密功能测试通过');
    } else {
      logger.error('❌ 加密功能测试失败：数据不匹配');
    }
    
    return success;
  } catch (error) {
    logger.error('❌ 加密功能测试失败:', error);
    return false;
  }
}

/**
 * 批量加密数据
 * @param dataArray 要加密的数据数组
 * @returns 加密后的数据数组
 */
export async function encryptDataBatch(dataArray: string[]): Promise<string[]> {
  try {
    const encryptedArray: string[] = [];
    
    for (const data of dataArray) {
      const encrypted = await encryptData(data);
      encryptedArray.push(encrypted);
    }
    
    logger.info(`✅ 批量加密完成: ${dataArray.length} 条数据`);
    return encryptedArray;
    
  } catch (error) {
    logger.error('❌ 批量加密失败:', error);
    throw new Error('批量加密失败');
  }
}

/**
 * 批量解密数据
 * @param encryptedArray 要解密的数据数组
 * @returns 解密后的数据数组
 */
export async function decryptDataBatch(encryptedArray: string[]): Promise<string[]> {
  try {
    const decryptedArray: string[] = [];
    
    for (const encrypted of encryptedArray) {
      const decrypted = await decryptData(encrypted);
      decryptedArray.push(decrypted);
    }
    
    logger.info(`✅ 批量解密完成: ${encryptedArray.length} 条数据`);
    return decryptedArray;
    
  } catch (error) {
    logger.error('❌ 批量解密失败:', error);
    throw new Error('批量解密失败');
  }
}

// 启动时测试加密功能
if (process.env.NODE_ENV === 'development') {
  testEncryption().then(success => {
    if (!success) {
      logger.error('❌ 加密功能测试失败，请检查配置');
    }
  });
}
