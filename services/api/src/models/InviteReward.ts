import mongoose, { Document, Schema } from 'mongoose';

export interface IInviteReward extends Document {
  inviterId: string; // 邀请者ID
  inviteeId: string; // 被邀请者ID
  inviteCodeId: string; // 邀请码ID
  rewardType: 'experience' | 'badge' | 'premium_days' | 'coins'; // 奖励类型
  rewardValue: number; // 奖励数值
  rewardDescription: string; // 奖励描述
  status: 'pending' | 'claimed' | 'expired'; // 状态
  claimedAt?: Date; // 领取时间
  createdAt: Date;
  updatedAt: Date;
}

const InviteRewardSchema = new Schema<IInviteReward>({
  inviterId: { 
    type: String, 
    required: true, 
    index: true 
  },
  inviteeId: { 
    type: String, 
    required: true, 
    index: true 
  },
  inviteCodeId: { 
    type: String, 
    required: true, 
    index: true 
  },
  rewardType: { 
    type: String, 
    enum: ['experience', 'badge', 'premium_days', 'coins'], 
    required: true 
  },
  rewardValue: { 
    type: Number, 
    required: true 
  },
  rewardDescription: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'claimed', 'expired'], 
    default: 'pending' 
  },
  claimedAt: { 
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
InviteRewardSchema.index({ inviterId: 1, status: 1 });
InviteRewardSchema.index({ inviteeId: 1 });
InviteRewardSchema.index({ inviteCodeId: 1 });

// 更新时自动设置 updatedAt
InviteRewardSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const InviteReward = mongoose.model<IInviteReward>('InviteReward', InviteRewardSchema);
