/**
 * ========================================
 * 🔄 [SYNC SERVICES INDEX] 数据同步服务索引
 * ========================================
 * 
 * 此文件列出了所有数据同步相关的服务文件
 * 便于开发者快速定位和了解同步服务架构
 * 
 * 核心同步服务:
 * ========================================
 */

// 核心同步服务
export { UnifiedSyncService } from './unifiedSyncService';
export { NewDeviceDataDownloadService } from './newDeviceDataDownloadService';
export { SmartUploadStrategy } from './smartUploadStrategy';
export { DataConflictResolutionService } from './dataConflictResolutionService';
export { NetworkStateManagementService } from './networkStateManagementService';

// 设备管理服务
export { NewDeviceDetectionService } from './newDeviceDetectionService';
export { DeviceInitializationService } from './deviceInitializationService';

// 数据管理服务
export { LocalDataOverwriteService } from './localDataOverwriteService';
export { IncrementalSyncStrategyService } from './incrementalSyncStrategyService';
export { DataVersionManagementService } from './dataVersionManagementService';

// 辅助服务
export { ErrorHandlingAndRetryService } from './errorHandlingAndRetryService';
export { PerformanceOptimizationService } from './performanceOptimizationService';

// Apple相关服务
export { AppleLoginAutoDetectionService } from './appleLoginAutoDetectionService';
export { AppleCrossDeviceSyncService } from './appleCrossDeviceSyncService';

// 内存管理服务
export { SmartMemoryManager } from './smartMemoryManager';

/**
 * ========================================
 * 使用示例:
 * ========================================
 * 
 * import { 
 *   UnifiedSyncService,
 *   NewDeviceDataDownloadService,
 *   SmartUploadStrategy 
 * } from './syncServices';
 * 
 * // 获取服务实例
 * const syncService = UnifiedSyncService.getInstance();
 * const downloadService = NewDeviceDataDownloadService.getInstance();
 * const uploadStrategy = SmartUploadStrategy.getInstance();
 * 
 * ========================================
 */
