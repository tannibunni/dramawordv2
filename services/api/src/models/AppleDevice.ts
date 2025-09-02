import mongoose, { Document, Schema } from 'mongoose';

export interface IAppleDevice extends Document {
  appleId: string;           // Apple ID
  deviceId: string;          // 设备唯一标识
  deviceName: string;        // 设备名称
  deviceType: string;        // 设备类型（iOS/Android/Web）
  deviceModel?: string;      // 设备型号
  osVersion?: string;        // 操作系统版本
  appVersion?: string;       // 应用版本
  lastSyncTime: number;      // 最后同步时间
  dataTypes: string[];       // 同步的数据类型
  isActive: boolean;         // 是否活跃
  deactivatedAt?: Date;      // 停用时间
  syncCount: number;         // 同步次数
  totalDataSize: number;     // 总数据大小
  createdAt: Date;           // 创建时间
  updatedAt: Date;           // 更新时间
}

const AppleDeviceSchema = new Schema<IAppleDevice>({
  appleId: {
    type: String,
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true
  },
  deviceName: {
    type: String,
    required: true,
    default: 'Unknown Device'
  },
  deviceType: {
    type: String,
    required: true,
    enum: ['iOS', 'Android', 'Web', 'Desktop'],
    default: 'iOS'
  },
  deviceModel: {
    type: String,
    required: false
  },
  osVersion: {
    type: String,
    required: false
  },
  appVersion: {
    type: String,
    required: false
  },
  lastSyncTime: {
    type: Number,
    required: true,
    default: Date.now
  },
  dataTypes: [{
    type: String,
    enum: ['vocabulary', 'shows', 'learningRecords', 'experience', 'badges', 'userStats']
  }],
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  deactivatedAt: {
    type: Date,
    required: false
  },
  syncCount: {
    type: Number,
    required: true,
    default: 0
  },
  totalDataSize: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  collection: 'apple_devices'
});

// 复合索引：Apple ID + 设备ID（唯一）
AppleDeviceSchema.index({ appleId: 1, deviceId: 1 }, { unique: true });

// 复合索引：Apple ID + 活跃状态
AppleDeviceSchema.index({ appleId: 1, isActive: 1 });

// 复合索引：Apple ID + 最后同步时间
AppleDeviceSchema.index({ appleId: 1, lastSyncTime: -1 });

// 虚拟字段：设备年龄（天）
AppleDeviceSchema.virtual('deviceAgeDays').get(function() {
  const now = Date.now();
  return Math.floor((now - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// 虚拟字段：最后同步时间（天前）
AppleDeviceSchema.virtual('lastSyncDaysAgo').get(function() {
  const now = Date.now();
  return Math.floor((now - this.lastSyncTime) / (1000 * 60 * 60 * 24));
});

// 虚拟字段：总数据大小（MB）
AppleDeviceSchema.virtual('totalDataSizeMB').get(function() {
  return (this.totalDataSize / (1024 * 1024)).toFixed(2);
});

// 实例方法：更新同步信息
AppleDeviceSchema.methods.updateSyncInfo = function(dataTypes: string[], dataSize: number) {
  this.lastSyncTime = Date.now();
  this.dataTypes = dataTypes;
  this.syncCount += 1;
  this.totalDataSize = dataSize;
  this.isActive = true;
  this.deactivatedAt = undefined;
  
  return this.save();
};

// 实例方法：停用设备
AppleDeviceSchema.methods.deactivate = function() {
  this.isActive = false;
  this.deactivatedAt = new Date();
  return this.save();
};

// 实例方法：重新激活设备
AppleDeviceSchema.methods.reactivate = function() {
  this.isActive = true;
  this.deactivatedAt = undefined;
  return this.save();
};

// 实例方法：获取设备状态
AppleDeviceSchema.methods.getDeviceStatus = function() {
  return {
    deviceId: this.deviceId,
    deviceName: this.deviceName,
    deviceType: this.deviceType,
    isActive: this.isActive,
    lastSyncTime: this.lastSyncTime,
    lastSyncDaysAgo: this.lastSyncDaysAgo,
    syncCount: this.syncCount,
    totalDataSize: this.totalDataSize,
    totalDataSizeMB: this.totalDataSizeMB,
    deviceAgeDays: this.deviceAgeDays
  };
};

// 静态方法：获取Apple ID的所有活跃设备
AppleDeviceSchema.statics.getActiveDevices = function(appleId: string) {
  return this.find({ appleId, isActive: true })
    .sort({ lastSyncTime: -1 });
};

// 静态方法：获取Apple ID的设备统计
AppleDeviceSchema.statics.getDeviceStats = function(appleId: string) {
  return this.aggregate([
    { $match: { appleId } },
    {
      $group: {
        _id: null,
        totalDevices: { $sum: 1 },
        activeDevices: { $sum: { $cond: ['$isActive', 1, 0] } },
        inactiveDevices: { $sum: { $cond: ['$isActive', 0, 1] } },
        totalSyncCount: { $sum: '$syncCount' },
        avgSyncCount: { $avg: '$syncCount' },
        totalDataSize: { $sum: '$totalDataSize' },
        avgDataSize: { $avg: '$totalDataSize' }
      }
    },
    {
      $project: {
        _id: 0,
        totalDevices: 1,
        activeDevices: 1,
        inactiveDevices: 1,
        totalSyncCount: 1,
        avgSyncCount: 1,
        totalDataSize: 1,
        totalDataSizeMB: { $divide: ['$totalDataSize', 1024 * 1024] },
        avgDataSize: 1,
        avgDataSizeMB: { $divide: ['$avgDataSize', 1024 * 1024] }
      }
    }
  ]);
};

// 静态方法：清理非活跃设备
AppleDeviceSchema.statics.cleanupInactiveDevices = async function(appleId: string, daysThreshold: number = 90) {
  try {
    const thresholdTime = Date.now() - (daysThreshold * 24 * 60 * 60 * 1000);
    
    const inactiveDevices = await this.find({
      appleId,
      isActive: false,
      lastSyncTime: { $lt: thresholdTime }
    });

    if (inactiveDevices.length > 0) {
      const deletedCount = await this.deleteMany({
        _id: { $in: inactiveDevices.map(d => d._id) }
      });
      
      console.log(`🍎 清理Apple ID ${appleId} 的非活跃设备: ${deletedCount.deletedCount} 个`);
      return deletedCount.deletedCount;
    }
    
    return 0;
  } catch (error) {
    console.error('清理非活跃设备失败:', error);
    throw error;
  }
};

// 静态方法：获取设备类型分布
AppleDeviceSchema.statics.getDeviceTypeDistribution = function(appleId: string) {
  return this.aggregate([
    { $match: { appleId } },
    {
      $group: {
        _id: '$deviceType',
        count: { $sum: 1 },
        activeCount: { $sum: { $cond: ['$isActive', 1, 0] } }
      }
    },
    {
      $project: {
        deviceType: '$_id',
        count: 1,
        activeCount: 1,
        inactiveCount: { $subtract: ['$count', '$activeCount'] }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// 中间件：保存前更新最后修改时间
AppleDeviceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 中间件：保存后清理非活跃设备（异步）
AppleDeviceSchema.post('save', function() {
  if (this.isActive === false) {
    // 异步清理非活跃设备
    (this.constructor as any).cleanupInactiveDevices(this.appleId).catch((err: any) => {
      console.error('异步清理非活跃设备失败:', err);
    });
  }
});

export const AppleDevice = mongoose.model<IAppleDevice>('AppleDevice', AppleDeviceSchema);
