import mongoose, { Document, Schema } from 'mongoose';

export interface IDataVersion extends Document {
  userId: string;
  deviceId: string;
  dataType: 'vocabulary' | 'shows' | 'learningRecords' | 'experience' | 'badges' | 'userStats';
  version: string;
  timestamp: Date;
  checksum: string;
  data: any;
  metadata: {
    size: number;
    itemCount: number;
    lastModified: Date;
    source: 'local' | 'cloud' | 'merged';
    conflictResolved?: boolean;
    resolutionStrategy?: 'auto' | 'smart' | 'manual';
    parentVersion?: string;
    mergeHistory?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  
  // 实例方法
  createNewVersion(newData: any, version: string, source?: 'local' | 'cloud' | 'merged'): IDataVersion;
  markConflictResolved(resolutionStrategy: 'auto' | 'smart' | 'manual'): Promise<IDataVersion>;
  addMergeHistory(mergedVersion: string): Promise<IDataVersion>;
}

export interface IDataVersionModel extends mongoose.Model<IDataVersion> {
  findLatestVersion(userId: string, dataType: string, deviceId?: string): Promise<IDataVersion | null>;
  findUserVersions(userId: string, dataType: string, limit?: number): Promise<IDataVersion[]>;
  findConflicts(userId: string, dataType: string, checksum: string): Promise<IDataVersion[]>;
  cleanupOldVersions(userId: string, dataType: string, keepCount?: number): Promise<any>;
  findMergeHistory(userId: string, dataType: string, version: string): Promise<IDataVersion[]>;
}

const DataVersionSchema = new Schema<IDataVersion>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  dataType: {
    type: String,
    enum: ['vocabulary', 'shows', 'learningRecords', 'experience', 'badges', 'userStats'],
    required: true
  },
  version: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  checksum: {
    type: String,
    required: true,
    index: true
  },
  data: {
    type: Schema.Types.Mixed,
    required: true
  },
  metadata: {
    size: {
      type: Number,
      required: true
    },
    itemCount: {
      type: Number,
      required: true
    },
    lastModified: {
      type: Date,
      required: true,
      default: Date.now
    },
    source: {
      type: String,
      enum: ['local', 'cloud', 'merged'],
      required: true,
      default: 'local'
    },
    conflictResolved: {
      type: Boolean,
      default: false
    },
    resolutionStrategy: {
      type: String,
      enum: ['auto', 'smart', 'manual'],
      default: 'auto'
    },
    parentVersion: String,
    mergeHistory: [String]
  }
}, {
  timestamps: true,
  collection: 'dataVersions'
});

// 复合索引
DataVersionSchema.index({ userId: 1, deviceId: 1, dataType: 1 });
DataVersionSchema.index({ userId: 1, dataType: 1, timestamp: -1 });
DataVersionSchema.index({ checksum: 1, userId: 1 });
DataVersionSchema.index({ version: 1, userId: 1, dataType: 1 });

// 虚拟字段：版本年龄（小时）
DataVersionSchema.virtual('versionAgeHours').get(function() {
  return Math.floor((Date.now() - this.timestamp.getTime()) / (1000 * 60 * 60));
});

// 虚拟字段：数据大小（MB）
DataVersionSchema.virtual('dataSizeMB').get(function() {
  return (this.metadata.size / (1024 * 1024)).toFixed(2);
});

// 中间件：保存前自动更新元数据
DataVersionSchema.pre('save', function(next) {
  try {
    // 更新数据大小
    const dataString = JSON.stringify(this.data);
    this.metadata.size = Buffer.byteLength(dataString, 'utf8');
    
    // 更新项目数量
    if (Array.isArray(this.data)) {
      this.metadata.itemCount = this.data.length;
    } else if (typeof this.data === 'object') {
      this.metadata.itemCount = Object.keys(this.data).length;
    } else {
      this.metadata.itemCount = 1;
    }
    
    // 更新最后修改时间
    this.metadata.lastModified = new Date();
    
    next();
  } catch (error) {
    next(error);
  }
});

// 静态方法：查找用户的最新版本
DataVersionSchema.statics.findLatestVersion = function(
  userId: string,
  dataType: string,
  deviceId?: string
) {
  const query: any = { userId, dataType };
  if (deviceId) {
    query.deviceId = deviceId;
  }
  
  return this.findOne(query).sort({ timestamp: -1 });
};

// 静态方法：查找用户的所有版本
DataVersionSchema.statics.findUserVersions = function(
  userId: string,
  dataType: string,
  limit: number = 10
) {
  return this.find({ userId, dataType })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// 静态方法：查找冲突版本
DataVersionSchema.statics.findConflicts = function(
  userId: string,
  dataType: string,
  checksum: string
) {
  return this.find({
    userId,
    dataType,
    checksum: { $ne: checksum },
    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 最近24小时
  }).sort({ timestamp: -1 });
};

// 静态方法：清理旧版本
DataVersionSchema.statics.cleanupOldVersions = function(
  userId: string,
  dataType: string,
  keepCount: number = 5
) {
  return this.find({ userId, dataType })
    .sort({ timestamp: -1 })
    .skip(keepCount)
    .deleteMany();
};

// 静态方法：查找合并历史
DataVersionSchema.statics.findMergeHistory = function(
  userId: string,
  dataType: string,
  version: string
) {
  return this.find({
    userId,
    dataType,
    'metadata.mergeHistory': version
  }).sort({ timestamp: -1 });
};

// 实例方法：创建新版本
DataVersionSchema.methods.createNewVersion = function(
  newData: any,
  version: string,
  source: 'local' | 'cloud' | 'merged' = 'local'
) {
  const newVersion = new DataVersion({
    userId: this.userId,
    deviceId: this.deviceId,
    dataType: this.dataType,
    version,
    timestamp: new Date(),
    checksum: this.checksum, // 这里应该重新计算
    data: newData,
    metadata: {
      ...this.metadata,
      source,
      parentVersion: this.version,
      lastModified: new Date()
    }
  });
  
  return newVersion;
};

// 实例方法：标记为冲突已解决
DataVersionSchema.methods.markConflictResolved = function(
  resolutionStrategy: 'auto' | 'smart' | 'manual'
) {
  this.metadata.conflictResolved = true;
  this.metadata.resolutionStrategy = resolutionStrategy;
  return this.save();
};

// 实例方法：添加合并历史
DataVersionSchema.methods.addMergeHistory = function(mergedVersion: string) {
  if (!this.metadata.mergeHistory) {
    this.metadata.mergeHistory = [];
  }
  this.metadata.mergeHistory.push(mergedVersion);
  return this.save();
};

export const DataVersion = mongoose.model<IDataVersion, IDataVersionModel>('DataVersion', DataVersionSchema);

export default DataVersion;
