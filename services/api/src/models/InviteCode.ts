import mongoose, { Document, Schema } from 'mongoose';

export interface IInviteCode extends Document {
  code: string;
  inviterId: string; // 邀请者ID
  inviteeId?: string; // 被邀请者ID（使用后填写）
  type: 'free_trial' | 'discount' | 'premium_gift'; // 邀请码类型
  reward: {
    freeTrialDays: number; // 免费试用天数
    discountPercent?: number; // 折扣百分比
    premiumGift?: string; // 高级功能礼物
  };
  status: 'active' | 'used' | 'expired' | 'cancelled'; // 状态
  maxUses: number; // 最大使用次数
  usedCount: number; // 已使用次数
  expiresAt: Date; // 过期时间
  usedAt?: Date; // 使用时间
  createdAt: Date;
  updatedAt: Date;
}

const InviteCodeSchema = new Schema<IInviteCode>({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  inviterId: { 
    type: String, 
    required: true, 
    index: true 
  },
  inviteeId: { 
    type: String, 
    index: true 
  },
  type: { 
    type: String, 
    enum: ['free_trial', 'discount', 'premium_gift'], 
    default: 'free_trial' 
  },
  reward: {
    freeTrialDays: { type: Number, default: 30 }, // 默认30天免费试用
    discountPercent: { type: Number, default: 0 },
    premiumGift: { type: String, default: '' }
  },
  status: { 
    type: String, 
    enum: ['active', 'used', 'expired', 'cancelled'], 
    default: 'active' 
  },
  maxUses: { 
    type: Number, 
    default: 1 // 默认只能使用一次
  },
  usedCount: { 
    type: Number, 
    default: 0 
  },
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后过期
  },
  usedAt: { 
    type: Date 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// 索引优化
InviteCodeSchema.index({ code: 1, status: 1 });
InviteCodeSchema.index({ inviterId: 1, status: 1 });
InviteCodeSchema.index({ inviteeId: 1 });
InviteCodeSchema.index({ expiresAt: 1 });

// 更新时自动设置 updatedAt
InviteCodeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const InviteCode = mongoose.model<IInviteCode>('InviteCode', InviteCodeSchema);
