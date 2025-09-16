import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export interface NetworkQualityRequest {
  networkType: 'wifi' | 'cellular' | 'unknown';
  signalStrength?: number;
  cellularGeneration?: '2G' | '3G' | '4G' | '5G';
  ssid?: string;
  carrier?: string;
  deviceId: string;
}

export interface NetworkQualityResponse {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  score: number; // 0-100
  recommendedAction: 'proceed' | 'delay' | 'compress' | 'abort';
  estimatedSpeed: number; // Mbps
  syncStrategy: {
    batchSize: number;
    timeout: number;
    retryAttempts: number;
    enableCompression: boolean;
  };
}

export interface NetworkStatusResponse {
  isConnected: boolean;
  networkType: 'wifi' | 'cellular' | 'unknown';
  quality: NetworkQualityResponse;
  lastCheckTime: Date;
  recommendations: string[];
}

export class NetworkController {
  // 获取网络质量评估
  static async getQuality(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const qualityData: NetworkQualityRequest = req.body;

      logger.info(`🌐 网络质量评估请求: 用户 ${userId}, 设备 ${qualityData.deviceId}`);

      // 验证请求数据
      if (!qualityData.networkType || !qualityData.deviceId) {
        return res.status(400).json({
          success: false,
          message: '网络类型和设备ID为必填项'
        });
      }

      // 评估网络质量
      const quality = await this.assessNetworkQuality(qualityData);

      logger.info(`✅ 网络质量评估完成: ${quality.quality} (${quality.score}/100)`);

      res.json({
        success: true,
        message: '网络质量评估完成',
        data: quality
      });

    } catch (error) {
      logger.error('❌ 网络质量评估失败:', error);
      res.status(500).json({
        success: false,
        message: '网络质量评估失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 评估网络质量
  private static async assessNetworkQuality(
    data: NetworkQualityRequest
  ): Promise<NetworkQualityResponse> {
    try {
      let quality: NetworkQualityResponse['quality'] = 'poor';
      let score = 0;
      let recommendedAction: NetworkQualityResponse['recommendedAction'] = 'abort';
      let estimatedSpeed = 0;

      if (data.networkType === 'wifi') {
        const strength = data.signalStrength || -50;
        
        if (strength >= -50) {
          quality = 'excellent';
          score = 90;
          recommendedAction = 'proceed';
          estimatedSpeed = 100; // 100 Mbps
        } else if (strength >= -60) {
          quality = 'good';
          score = 75;
          recommendedAction = 'proceed';
          estimatedSpeed = 50; // 50 Mbps
        } else if (strength >= -70) {
          quality = 'fair';
          score = 60;
          recommendedAction = 'delay';
          estimatedSpeed = 25; // 25 Mbps
        } else {
          quality = 'poor';
          score = 40;
          recommendedAction = 'compress';
          estimatedSpeed = 10; // 10 Mbps
        }
      } else if (data.networkType === 'cellular') {
        const generation = data.cellularGeneration;
        
        if (generation === '5G') {
          quality = 'excellent';
          score = 85;
          recommendedAction = 'proceed';
          estimatedSpeed = 50; // 50 Mbps
        } else if (generation === '4G') {
          quality = 'good';
          score = 70;
          recommendedAction = 'proceed';
          estimatedSpeed = 20; // 20 Mbps
        } else if (generation === '3G') {
          quality = 'fair';
          score = 50;
          recommendedAction = 'delay';
          estimatedSpeed = 5; // 5 Mbps
        } else {
          quality = 'poor';
          score = 30;
          recommendedAction = 'compress';
          estimatedSpeed = 1; // 1 Mbps
        }
      } else {
        quality = 'poor';
        score = 20;
        recommendedAction = 'abort';
        estimatedSpeed = 0;
      }

      // 根据网络质量确定同步策略
      const syncStrategy = this.determineSyncStrategy(quality, score);

      return {
        quality,
        score,
        recommendedAction,
        estimatedSpeed,
        syncStrategy
      };

    } catch (error) {
      logger.error('❌ 评估网络质量失败:', error);
      throw error;
    }
  }

  // 确定同步策略
  private static determineSyncStrategy(
    quality: NetworkQualityResponse['quality'],
    score: number
  ): NetworkQualityResponse['syncStrategy'] {
    if (quality === 'excellent') {
      return {
        batchSize: 1000,
        timeout: 30000,
        retryAttempts: 3,
        enableCompression: false
      };
    } else if (quality === 'good') {
      return {
        batchSize: 500,
        timeout: 45000,
        retryAttempts: 5,
        enableCompression: false
      };
    } else if (quality === 'fair') {
      return {
        batchSize: 200,
        timeout: 60000,
        retryAttempts: 7,
        enableCompression: true
      };
    } else {
      return {
        batchSize: 50,
        timeout: 90000,
        retryAttempts: 10,
        enableCompression: true
      };
    }
  }

  // 获取网络状态
  static async getStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { deviceId } = req.params;

      logger.info(`📊 获取网络状态: 用户 ${userId}, 设备 ${deviceId}`);

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: '设备ID为必填项'
        });
      }

      // 这里应该从数据库获取设备的网络状态
      // 目前返回模拟数据
      const networkStatus: NetworkStatusResponse = {
        isConnected: true,
        networkType: 'wifi',
        quality: {
          quality: 'good',
          score: 75,
          recommendedAction: 'proceed',
          estimatedSpeed: 50,
          syncStrategy: {
            batchSize: 500,
            timeout: 45000,
            retryAttempts: 5,
            enableCompression: false
          }
        },
        lastCheckTime: new Date(),
        recommendations: [
          '网络连接良好，可以正常同步',
          '建议在WiFi环境下进行大数据量同步',
          '移动网络下建议启用数据压缩'
        ]
      };

      logger.info(`✅ 网络状态获取成功: ${deviceId}`);

      res.json({
        success: true,
        message: '网络状态获取成功',
        data: networkStatus
      });

    } catch (error) {
      logger.error('❌ 获取网络状态失败:', error);
      res.status(500).json({
        success: false,
        message: '获取网络状态失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 网络优化建议
  static async optimize(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { deviceId } = req.params;
      const { networkType, signalStrength, cellularGeneration } = req.body;

      logger.info(`⚡ 网络优化请求: 用户 ${userId}, 设备 ${deviceId}`);

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: '设备ID为必填项'
        });
      }

      // 生成优化建议
      const optimization = await this.generateOptimizationSuggestions({
        networkType,
        signalStrength,
        cellularGeneration
      });

      logger.info(`✅ 网络优化建议生成完成: ${deviceId}`);

      res.json({
        success: true,
        message: '网络优化建议生成完成',
        data: optimization
      });

    } catch (error) {
      logger.error('❌ 网络优化失败:', error);
      res.status(500).json({
        success: false,
        message: '网络优化失败，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 生成优化建议
  private static async generateOptimizationSuggestions(
    networkInfo: {
      networkType?: string;
      signalStrength?: number;
      cellularGeneration?: string;
    }
  ): Promise<{
    recommendations: string[];
    syncSettings: {
      batchSize: number;
      timeout: number;
      retryAttempts: number;
      enableCompression: boolean;
      syncInterval: number;
    };
    priority: 'high' | 'medium' | 'low';
  }> {
    try {
      const recommendations: string[] = [];
      let priority: 'high' | 'medium' | 'low' = 'medium';

      if (networkInfo.networkType === 'wifi') {
        if (networkInfo.signalStrength && networkInfo.signalStrength < -70) {
          recommendations.push('WiFi信号较弱，建议靠近路由器或检查网络连接');
          recommendations.push('考虑切换到移动网络或等待信号改善');
          priority = 'high';
        } else {
          recommendations.push('WiFi连接良好，适合进行数据同步');
          recommendations.push('可以增加同步频率和批次大小');
          priority = 'low';
        }
      } else if (networkInfo.networkType === 'cellular') {
        if (networkInfo.cellularGeneration === '5G') {
          recommendations.push('5G网络连接，同步速度较快');
          recommendations.push('可以正常进行数据同步');
          priority = 'low';
        } else if (networkInfo.cellularGeneration === '4G') {
          recommendations.push('4G网络连接，同步速度中等');
          recommendations.push('建议启用数据压缩以节省流量');
          priority = 'medium';
        } else {
          recommendations.push('网络速度较慢，建议等待网络改善');
          recommendations.push('启用数据压缩和减少同步频率');
          priority = 'high';
        }
      } else {
        recommendations.push('网络类型未知，建议检查网络连接');
        recommendations.push('暂停数据同步直到网络连接稳定');
        priority = 'high';
      }

      // 根据网络状况确定同步设置
      const syncSettings = this.determineOptimalSyncSettings(networkInfo);

      return {
        recommendations,
        syncSettings,
        priority
      };

    } catch (error) {
      logger.error('❌ 生成优化建议失败:', error);
      throw error;
    }
  }

  // 确定最优同步设置 - 优化批量处理策略
  private static determineOptimalSyncSettings(
    networkInfo: {
      networkType?: string;
      signalStrength?: number;
      cellularGeneration?: string;
    }
  ): {
    batchSize: number;
    timeout: number;
    retryAttempts: number;
    enableCompression: boolean;
    syncInterval: number;
  } {
    if (networkInfo.networkType === 'wifi') {
      if (networkInfo.signalStrength && networkInfo.signalStrength >= -60) {
        return {
          batchSize: 2000,              // 增加批量大小 (原1000) - 减少50%请求
          timeout: 30000,
          retryAttempts: 3,
          enableCompression: false,
          syncInterval: 2 * 60 * 1000 // 2分钟
        };
      } else {
        return {
          batchSize: 1000,              // 增加批量大小 (原500) - 减少50%请求
          timeout: 45000,
          retryAttempts: 5,
          enableCompression: true,
          syncInterval: 5 * 60 * 1000 // 5分钟
        };
      }
    } else if (networkInfo.networkType === 'cellular') {
      if (networkInfo.cellularGeneration === '5G') {
        return {
          batchSize: 1500,              // 增加批量大小 (原800) - 减少47%请求
          timeout: 35000,
          retryAttempts: 4,
          enableCompression: false,
          syncInterval: 3 * 60 * 1000 // 3分钟
        };
      } else if (networkInfo.cellularGeneration === '4G') {
        return {
          batchSize: 600,               // 增加批量大小 (原300) - 减少50%请求
          timeout: 50000,
          retryAttempts: 6,
          enableCompression: true,
          syncInterval: 10 * 60 * 1000 // 10分钟
        };
      } else {
        return {
          batchSize: 200,               // 增加批量大小 (原100) - 减少50%请求
          timeout: 60000,
          retryAttempts: 8,
          enableCompression: true,
          syncInterval: 15 * 60 * 1000 // 15分钟
        };
      }
    } else {
      return {
        batchSize: 100,                // 增加批量大小 (原50) - 减少50%请求
        timeout: 90000,
        retryAttempts: 10,
        enableCompression: true,
        syncInterval: 30 * 60 * 1000 // 30分钟
      };
    }
  }
}
