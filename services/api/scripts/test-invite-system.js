const mongoose = require('mongoose');
require('dotenv').config();

// 定义模型Schema
const InviteCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  inviterId: { type: String, required: true, index: true },
  inviteeId: { type: String, index: true },
  type: { type: String, enum: ['free_trial', 'discount', 'premium_gift'], default: 'free_trial' },
  reward: {
    freeTrialDays: { type: Number, default: 30 },
    discountPercent: { type: Number, default: 0 },
    premiumGift: { type: String, default: '' }
  },
  status: { type: String, enum: ['active', 'used', 'expired', 'cancelled'], default: 'active' },
  maxUses: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  usedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const InviteRewardSchema = new mongoose.Schema({
  inviterId: { type: String, required: true, index: true },
  inviteeId: { type: String, required: true, index: true },
  inviteCodeId: { type: String, required: true, index: true },
  rewardType: { type: String, enum: ['experience', 'badge', 'premium_days', 'coins'], required: true },
  rewardValue: { type: Number, required: true },
  rewardDescription: { type: String, required: true },
  status: { type: String, enum: ['pending', 'claimed', 'expired'], default: 'pending' },
  claimedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  auth: {
    loginType: { type: String, enum: ['phone', 'wechat', 'apple', 'guest'], required: true },
    deviceId: { type: String, index: true },
    lastLoginAt: { type: Date, default: Date.now }
  },
  subscription: {
    isActive: { type: Boolean, default: false },
    isTrial: { type: Boolean, default: false },
    startDate: { type: Date },
    endDate: { type: Date },
    trialDays: { type: Number, default: 0 }
  },
  experience: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 创建模型
const InviteCode = mongoose.model('InviteCode', InviteCodeSchema);
const InviteReward = mongoose.model('InviteReward', InviteRewardSchema);
const User = mongoose.model('User', UserSchema);

async function testInviteSystem() {
  try {
    console.log('🚀 开始测试邀请码系统...');
    
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dramaword');
    console.log('✅ 数据库连接成功');

    // 1. 测试生成邀请码
    console.log('\n📝 测试1: 生成邀请码');
    const inviteCode = new InviteCode({
      code: 'DWTEST123456789',
      inviterId: 'test_user_123',
      type: 'free_trial',
      reward: {
        freeTrialDays: 30,
        discountPercent: 0,
        premiumGift: ''
      },
      status: 'active',
      maxUses: 1,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await inviteCode.save();
    console.log('✅ 邀请码生成成功:', inviteCode.code);

    // 2. 测试验证邀请码
    console.log('\n🔍 测试2: 验证邀请码');
    const foundCode = await InviteCode.findOne({ 
      code: 'DWTEST123456789',
      status: 'active'
    });
    
    if (foundCode) {
      console.log('✅ 邀请码验证成功:', foundCode.code);
      console.log('   类型:', foundCode.type);
      console.log('   奖励:', foundCode.reward);
    } else {
      console.log('❌ 邀请码验证失败');
    }

    // 3. 测试应用邀请码
    console.log('\n🎁 测试3: 应用邀请码');
    const inviteeId = 'test_invitee_456';
    
    // 模拟用户
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      auth: {
        loginType: 'guest',
        deviceId: 'test_device_123'
      },
      subscription: {
        isActive: false,
        isTrial: false
      }
    });
    await user.save();
    console.log('✅ 测试用户创建成功:', user._id);

    // 开始事务
    const session = await InviteCode.startSession();
    session.startTransaction();

    try {
      // 更新邀请码状态
      foundCode.inviteeId = inviteeId;
      foundCode.usedCount += 1;
      foundCode.status = 'used';
      foundCode.usedAt = new Date();
      await foundCode.save({ session });

      // 激活免费试用
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + foundCode.reward.freeTrialDays);
      
      user.subscription = {
        ...user.subscription,
        isActive: true,
        startDate: new Date(),
        endDate: trialEndDate,
        isTrial: true,
        trialDays: foundCode.reward.freeTrialDays
      };
      await user.save({ session });

      // 创建邀请奖励
      const inviterReward = new InviteReward({
        inviterId: foundCode.inviterId,
        inviteeId: inviteeId,
        inviteCodeId: foundCode._id.toString(),
        rewardType: 'experience',
        rewardValue: 100,
        rewardDescription: '成功邀请好友',
        status: 'pending'
      });

      const inviteeReward = new InviteReward({
        inviterId: foundCode.inviterId,
        inviteeId: inviteeId,
        inviteCodeId: foundCode._id.toString(),
        rewardType: 'experience',
        rewardValue: 50,
        rewardDescription: '使用邀请码注册',
        status: 'claimed'
      });

      await InviteReward.insertMany([inviterReward, inviteeReward], { session });

      // 提交事务
      await session.commitTransaction();
      session.endSession();

      console.log('✅ 邀请码应用成功');
      console.log('   免费试用天数:', foundCode.reward.freeTrialDays);
      console.log('   试用结束时间:', trialEndDate);
      console.log('   邀请者奖励:', inviterReward.rewardValue, '经验值');
      console.log('   被邀请者奖励:', inviteeReward.rewardValue, '经验值');

    } catch (error) {
      // 回滚事务
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

    // 4. 测试查询邀请码统计
    console.log('\n📊 测试4: 查询邀请码统计');
    const stats = await InviteCode.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('✅ 邀请码统计:', stats);

    // 5. 测试查询邀请奖励
    console.log('\n🎁 测试5: 查询邀请奖励');
    const rewards = await InviteReward.find({
      inviterId: foundCode.inviterId
    });
    console.log('✅ 邀请奖励查询成功:', rewards.length, '条记录');

    // 清理测试数据
    console.log('\n🧹 清理测试数据...');
    await InviteCode.deleteOne({ code: 'DWTEST123456789' });
    await InviteReward.deleteMany({ inviteCodeId: foundCode._id.toString() });
    await User.deleteOne({ _id: user._id });
    console.log('✅ 测试数据清理完成');

    console.log('\n🎉 邀请码系统测试完成！所有功能正常！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 数据库连接已关闭');
  }
}

// 运行测试
testInviteSystem();
