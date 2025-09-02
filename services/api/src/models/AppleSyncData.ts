import mongoose, { Document, Schema } from 'mongoose';

export interface IAppleSyncData extends Document {
  appleId: string;           // Apple ID
  userId: mongoose.Types.ObjectId;  // 用户ID
  deviceId: string;          // 设备ID
  encryptedData: string;     // 加密的数据
  syncVersion: number;       // 同步版本号
  lastModified: number;      // 最后修改时间
  dataTypes: string[];       // 数据类型列表
  dataSize: number;          // 数据大小（字节）
  createdAt: Date;           // 创建时间
  updatedAt: Date;           // 更新时间
}

const AppleSyncDataSchema = new Schema<IAppleSyncData>({
  appleId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true
  },
  encryptedData: {
    type: String,
    required: true
  },
  syncVersion: {
    type: Number,
    required: true,
    default: 1
  },
  lastModified: {
    type: Number,
    required: true,
    default: Date.now
  },
  dataTypes: [{
    type: String,
    enum: ['vocabulary', 'shows', 'learningRecords', 'experience', 'badges', 'userStats']
  }],
  dataSize: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true,
  collection: 'apple_sync_data'
});

// 复合索引：Apple ID + 同步版本
AppleSyncDataSchema.index({ appleId: 1, syncVersion: -1 });

// 复合索引：Apple ID + 最后修改时间
AppleSyncDataSchema.index({ appleId: 1, lastModified: -1 });

// 复合索引：用户ID + 创建时间
AppleSyncDataSchema.index({ userId: 1, createdAt: -1 });

// 虚拟字段：数据大小（MB）
AppleSyncDataSchema.virtual('dataSizeMB').get(function() {
  return (this.dataSize / (1024 * 1024)).toFixed(2);
});

// 虚拟字段：数据年龄（天）
AppleSyncDataSchema.virtual('dataAgeDays').get(function() {
  const now = Date.now();
  return Math.floor((now - this.lastModified) / (1000 * 60 * 60 * 24));
});

// 实例方法：获取数据概览
AppleSyncDataSchema.methods.getDataOverview = function() {
  return {
    syncVersion: this.syncVersion,
    lastModified: this.lastModified,
    dataTypes: this.dataTypes,
    dataSize: this.dataSize,
    dataSizeMB: this.dataSizeMB,
    dataAgeDays: this.dataAgeDays,
    createdAt: this.createdAt
  };
};

// 静态方法：获取Apple ID的最新同步数据
AppleSyncDataSchema.statics.getLatestByAppleId = function(appleId: string) {
  return this.findOne({ appleId })
    .sort({ syncVersion: -1 })
    .limit(1);
};

// 静态方法：获取Apple ID的同步历史
AppleSyncDataSchema.statics.getSyncHistory = function(appleId: string, limit: number = 10) {
  return this.find({ appleId })
    .sort({ syncVersion: -1 })
    .limit(limit)
    .select('syncVersion lastModified dataTypes dataSize createdAt');
};

// 静态方法：清理旧版本数据
AppleSyncDataSchema.statics.cleanupOldVersions = async function(appleId: string, keepVersions: number = 5) {
  try {
    const oldVersions = await this.find({ appleId })
      .sort({ syncVersion: -1 })
      .skip(keepVersions)
      .select('_id');

    if (oldVersions.length > 0) {
      const deletedCount = await this.deleteMany({
        _id: { $in: oldVersions.map(v => v._id) }
      });
      
      console.log(`🍎 清理Apple ID ${appleId} 的旧版本数据: ${deletedCount.deletedCount} 条`);
      return deletedCount.deletedCount;
    }
    
    return 0;
  } catch (error) {
    console.error('清理旧版本数据失败:', error);
    throw error;
  }
};

// 静态方法：获取存储统计
AppleSyncDataSchema.statics.getStorageStats = async function() {
  try {
    const stats = await this.aggregate([
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalDataSize: { $sum: '$dataSize' },
          avgDataSize: { $avg: '$dataSize' },
          uniqueAppleIds: { $addToSet: '$appleId' }
        }
      },
      {
        $project: {
          _id: 0,
          totalRecords: 1,
          totalDataSize: 1,
          totalDataSizeMB: { $divide: ['$totalDataSize', 1024 * 1024] },
          avgDataSize: 1,
          avgDataSizeMB: { $divide: ['$avgDataSize', 1024 * 1024] },
          uniqueAppleIds: { $size: '$uniqueAppleIds' }
        }
      }
    ]);

    return stats[0] || {
      totalRecords: 0,
      totalDataSize: 0,
      totalDataSizeMB: 0,
      avgDataSize: 0,
      avgDataSizeMB: 0,
      uniqueAppleIds: 0
    };
  } catch (error) {
    console.error('获取存储统计失败:', error);
    throw error;
  }
};

// 中间件：保存前更新最后修改时间
AppleSyncDataSchema.pre('save', function(next) {
  this.lastModified = Date.now();
  next();
});

// 中间件：保存后清理旧版本（异步，不阻塞保存）
AppleSyncDataSchema.post('save', function() {
  // 异步清理旧版本数据
  (this.constructor as any).cleanupOldVersions(this.appleId).catch((err: any) => {
    console.error('异步清理旧版本数据失败:', err);
  });
});

export const AppleSyncData = mongoose.model<IAppleSyncData>('AppleSyncData', AppleSyncDataSchema);
