// 测试新设备数据下载功能
// 使用方法：在React Native环境中运行

import { NewDeviceDataDownloadService } from './src/services/newDeviceDataDownloadService';
import { NewDeviceDetectionService } from './src/services/newDeviceDetectionService';
import { CloudDataDownloadService } from './src/services/cloudDataDownloadService';
import { LocalDataOverwriteService } from './src/services/localDataOverwriteService';
import { DeviceInitializationService } from './src/services/deviceInitializationService';

// 测试新设备检测
export const testNewDeviceDetection = async (appleId) => {
  try {
    console.log('🧪 测试新设备检测...');
    
    const detectionService = NewDeviceDetectionService.getInstance();
    const result = await detectionService.detectNewDevice(appleId);
    
    console.log('✅ 新设备检测结果:', result);
    return result;
    
  } catch (error) {
    console.error('❌ 新设备检测测试失败:', error);
    throw error;
  }
};

// 测试云端数据下载
export const testCloudDataDownload = async (appleId) => {
  try {
    console.log('🧪 测试云端数据下载...');
    
    const downloadService = CloudDataDownloadService.getInstance();
    const result = await downloadService.downloadCloudData(appleId);
    
    console.log('✅ 云端数据下载结果:', result);
    return result;
    
  } catch (error) {
    console.error('❌ 云端数据下载测试失败:', error);
    throw error;
  }
};

// 测试本地数据覆盖
export const testLocalDataOverwrite = async (cloudData, deviceInfo) => {
  try {
    console.log('🧪 测试本地数据覆盖...');
    
    const overwriteService = LocalDataOverwriteService.getInstance();
    const result = await overwriteService.overwriteLocalData(cloudData, deviceInfo);
    
    console.log('✅ 本地数据覆盖结果:', result);
    return result;
    
  } catch (error) {
    console.error('❌ 本地数据覆盖测试失败:', error);
    throw error;
  }
};

// 测试设备初始化
export const testDeviceInitialization = async (deviceInfo, cloudData) => {
  try {
    console.log('🧪 测试设备初始化...');
    
    const initService = DeviceInitializationService.getInstance();
    const result = await initService.initializeDevice(deviceInfo, cloudData);
    
    console.log('✅ 设备初始化结果:', result);
    return result;
    
  } catch (error) {
    console.error('❌ 设备初始化测试失败:', error);
    throw error;
  }
};

// 测试完整的新设备数据下载流程
export const testCompleteNewDeviceDownload = async (appleId) => {
  try {
    console.log('🧪 测试完整的新设备数据下载流程...');
    
    const downloadService = NewDeviceDataDownloadService.getInstance();
    const result = await downloadService.processNewDeviceDataDownload(appleId);
    
    console.log('✅ 完整流程测试结果:', result);
    return result;
    
  } catch (error) {
    console.error('❌ 完整流程测试失败:', error);
    throw error;
  }
};

// 测试手动数据同步
export const testManualDataSync = async (appleId) => {
  try {
    console.log('🧪 测试手动数据同步...');
    
    const downloadService = NewDeviceDataDownloadService.getInstance();
    const result = await downloadService.manualDataSync(appleId);
    
    console.log('✅ 手动数据同步结果:', result);
    return result;
    
  } catch (error) {
    console.error('❌ 手动数据同步测试失败:', error);
    throw error;
  }
};

// 测试设备状态摘要
export const testDeviceStatusSummary = async (appleId) => {
  try {
    console.log('🧪 测试设备状态摘要...');
    
    const downloadService = NewDeviceDataDownloadService.getInstance();
    const result = await downloadService.getDeviceStatusSummary(appleId);
    
    console.log('✅ 设备状态摘要结果:', result);
    return result;
    
  } catch (error) {
    console.error('❌ 设备状态摘要测试失败:', error);
    throw error;
  }
};

// 测试进度监控
export const testProgressMonitoring = async (appleId) => {
  try {
    console.log('🧪 测试进度监控...');
    
    const downloadService = NewDeviceDataDownloadService.getInstance();
    
    // 开始下载
    const downloadPromise = downloadService.processNewDeviceDataDownload(appleId);
    
    // 监控进度
    const progressInterval = setInterval(() => {
      const progress = downloadService.getCurrentProgress();
      console.log('📊 当前进度:', progress);
      
      if (progress.stage === 'completed' || progress.stage === 'failed') {
        clearInterval(progressInterval);
      }
    }, 1000);
    
    const result = await downloadPromise;
    clearInterval(progressInterval);
    
    console.log('✅ 进度监控测试完成:', result);
    return result;
    
  } catch (error) {
    console.error('❌ 进度监控测试失败:', error);
    throw error;
  }
};

// 主测试函数
export const runAllTests = async (appleId) => {
  try {
    console.log('🚀 开始运行所有测试...');
    
    // 1. 测试新设备检测
    const detectionResult = await testNewDeviceDetection(appleId);
    
    // 2. 测试设备状态摘要
    const statusResult = await testDeviceStatusSummary(appleId);
    
    // 3. 如果是新设备，测试完整流程
    if (detectionResult.isNewDevice) {
      console.log('🔍 检测到新设备，测试完整下载流程...');
      
      // 测试云端数据下载
      const downloadResult = await testCloudDataDownload(appleId);
      
      if (downloadResult.success && downloadResult.data) {
        // 测试本地数据覆盖
        await testLocalDataOverwrite(downloadResult.data, detectionResult.deviceInfo);
        
        // 测试设备初始化
        await testDeviceInitialization(detectionResult.deviceInfo, downloadResult.data);
      }
      
      // 测试完整流程
      await testCompleteNewDeviceDownload(appleId);
      
    } else {
      console.log('ℹ️ 设备已初始化，测试手动同步...');
      
      // 测试手动数据同步
      await testManualDataSync(appleId);
    }
    
    // 4. 测试进度监控
    await testProgressMonitoring(appleId);
    
    console.log('✅ 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试运行失败:', error);
  }
};

// 导出所有测试函数
export default {
  testNewDeviceDetection,
  testCloudDataDownload,
  testLocalDataOverwrite,
  testDeviceInitialization,
  testCompleteNewDeviceDownload,
  testManualDataSync,
  testDeviceStatusSummary,
  testProgressMonitoring,
  runAllTests
};
