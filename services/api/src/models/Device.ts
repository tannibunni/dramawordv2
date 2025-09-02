import mongoose, { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceType: 'ios' | 'android' | 'web' | 'unknown';
  osVersion: string;
  appVersion: string;
  deviceFingerprint: string;
  isInitialized: boolean;
  lastSyncTime: Date;
  lastActiveTime: Date;
  networkType: 'wifi' | 'cellular' | 'unknown';
  syncStatus: 'active' | 'inactive' | 'error';
  metadata: {
    manufacturer?: string;
    model?: string;
    screenResolution?: string;
    totalStorage?: number;
    availableStorage?: number;
    batteryLevel?: number;
    isCharging?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // 实例方法
  updateSyncStatus(status: 'active' | 'inactive' | 'error'): Promise<IDevice>;
  updateNetworkStatus(networkType: 'wifi' | 'cellular' | 'unknown'): Promise<IDevice>;
  markAsInitialized(): Promise<IDevice>;
  updateFingerprint(newFingerprint: string): Promise<IDevice>;
}

export interface IDeviceModel extends mongoose.Model<IDevice> {
  findActiveDevices(userId: string): Promise<IDevice[]>;
  findInitializedDevices(userId: string): Promise<IDevice[]>;
  cleanupExpiredDevices(): Promise<any>;
}

const DeviceSchema = new Schema<IDevice>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  deviceName: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    enum: ['ios', 'android', 'web', 'unknown'],
    required: true
  },
  osVersion: {
    type: String,
    required: true
  },
  appVersion: {
    type: String,
    required: true
  },
  deviceFingerprint: {
    type: String,
    required: true,
    index: true
  },
  isInitialized: {
    type: Boolean,
    default: false
  },
  lastSyncTime: {
    type: Date,
    default: Date.now
  },
  lastActiveTime: {
    type: Date,
    default: Date.now
  },
  networkType: {
    type: String,
    enum: ['wifi', 'cellular', 'unknown'],
    default: 'unknown'
  },
  syncStatus: {
    type: String,
    enum: ['active', 'inactive', 'error'],
    default: 'active'
  },
  metadata: {
    manufacturer: String,
    model: String,
    screenResolution: String,
    totalStorage: Number,
    availableStorage: Number,
    batteryLevel: Number,
    isCharging: Boolean
  }
}, {
  timestamps: true,
  collection: 'devices'
});

// 复合索引
DeviceSchema.index({ userId: 1, deviceId: 1 });
DeviceSchema.index({ deviceFingerprint: 1, userId: 1 });
DeviceSchema.index({ lastActiveTime: 1 });
DeviceSchema.index({ syncStatus: 1, lastSyncTime: 1 });

// 虚拟字段：设备是否在线（30分钟内活跃）
DeviceSchema.virtual('isOnline').get(function() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  return this.lastActiveTime > thirtyMinutesAgo;
});

// 虚拟字段：设备年龄
DeviceSchema.virtual('deviceAge').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// 虚拟字段：同步延迟（分钟）
DeviceSchema.virtual('syncDelayMinutes').get(function() {
  return Math.floor((Date.now() - this.lastSyncTime.getTime()) / (1000 * 60));
});

// 中间件：更新时自动更新lastActiveTime
DeviceSchema.pre('save', function(next) {
  this.lastActiveTime = new Date();
  next();
});

// 中间件：更新时自动更新updatedAt
DeviceSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

// 静态方法：查找用户的活跃设备
DeviceSchema.statics.findActiveDevices = function(userId: string) {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  return this.find({
    userId,
    lastActiveTime: { $gt: thirtyMinutesAgo }
  }).sort({ lastActiveTime: -1 });
};

// 静态方法：查找用户的初始化设备
DeviceSchema.statics.findInitializedDevices = function(userId: string) {
  return this.find({
    userId,
    isInitialized: true
  }).sort({ lastSyncTime: -1 });
};

// 静态方法：清理过期设备（7天未活跃）
DeviceSchema.statics.cleanupExpiredDevices = function() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    lastActiveTime: { $lt: sevenDaysAgo }
  });
};

// 实例方法：更新同步状态
DeviceSchema.methods.updateSyncStatus = function(status: 'active' | 'inactive' | 'error') {
  this.syncStatus = status;
  this.lastSyncTime = new Date();
  return this.save();
};

// 实例方法：更新网络状态
DeviceSchema.methods.updateNetworkStatus = function(networkType: 'wifi' | 'cellular' | 'unknown') {
  this.networkType = networkType;
  this.lastActiveTime = new Date();
  return this.save();
};

// 实例方法：标记为已初始化
DeviceSchema.methods.markAsInitialized = function() {
  this.isInitialized = true;
  this.lastActiveTime = new Date();
  return this.save();
};

// 实例方法：更新设备指纹
DeviceSchema.methods.updateFingerprint = function(newFingerprint: string) {
  this.deviceFingerprint = newFingerprint;
  this.lastActiveTime = new Date();
  return this.save();
};

export const Device = mongoose.model<IDevice, IDeviceModel>('Device', DeviceSchema);

export default Device;
