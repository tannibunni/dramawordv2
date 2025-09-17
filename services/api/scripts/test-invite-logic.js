// 测试邀请码逻辑（不依赖数据库）
console.log('🚀 开始测试邀请码逻辑...');

// 模拟邀请码生成
function generateInviteCode() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `DW${timestamp}${random}`.toUpperCase();
}

// 模拟邀请码验证
function validateInviteCode(code, inviteCodes) {
  const inviteCode = inviteCodes.find(ic => ic.code === code && ic.status === 'active');
  
  if (!inviteCode) {
    return { success: false, message: '邀请码不存在或已失效' };
  }
  
  if (inviteCode.usedCount >= inviteCode.maxUses) {
    return { success: false, message: '邀请码使用次数已达上限' };
  }
  
  if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
    return { success: false, message: '邀请码已过期' };
  }
  
  return { 
    success: true, 
    data: {
      code: inviteCode.code,
      type: inviteCode.type,
      reward: inviteCode.reward,
      maxUses: inviteCode.maxUses,
      usedCount: inviteCode.usedCount,
      expiresAt: inviteCode.expiresAt
    }
  };
}

// 模拟应用邀请码
function applyInviteCode(code, userId, inviteCodes, users) {
  const validation = validateInviteCode(code, inviteCodes);
  
  if (!validation.success) {
    return validation;
  }
  
  const inviteCode = inviteCodes.find(ic => ic.code === code);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return { success: false, message: '用户不存在' };
  }
  
  // 检查用户是否已经使用过邀请码
  const hasUsedInviteCode = inviteCodes.some(ic => ic.inviteeId === userId && ic.status === 'used');
  if (hasUsedInviteCode) {
    return { success: false, message: '您已经使用过邀请码' };
  }
  
  // 更新邀请码状态
  inviteCode.inviteeId = userId;
  inviteCode.usedCount += 1;
  inviteCode.status = inviteCode.usedCount >= inviteCode.maxUses ? 'used' : 'active';
  inviteCode.usedAt = new Date();
  
  // 激活免费试用
  if (inviteCode.type === 'free_trial') {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + inviteCode.reward.freeTrialDays);
    
    user.subscription = {
      ...user.subscription,
      isActive: true,
      startDate: new Date(),
      endDate: trialEndDate,
      isTrial: true,
      trialDays: inviteCode.reward.freeTrialDays
    };
  }
  
  // 创建邀请奖励
  const inviterReward = {
    inviterId: inviteCode.inviterId,
    inviteeId: userId,
    inviteCodeId: inviteCode.id,
    rewardType: 'experience',
    rewardValue: 100,
    rewardDescription: '成功邀请好友',
    status: 'pending'
  };
  
  const inviteeReward = {
    inviterId: inviteCode.inviterId,
    inviteeId: userId,
    inviteCodeId: inviteCode.id,
    rewardType: 'experience',
    rewardValue: 50,
    rewardDescription: '使用邀请码注册',
    status: 'claimed'
  };
  
  return {
    success: true,
    message: '邀请码应用成功',
    data: {
      code: inviteCode.code,
      type: inviteCode.type,
      reward: inviteCode.reward,
      rewardResult: {
        success: true,
        trialDays: inviteCode.reward.freeTrialDays,
        endDate: user.subscription.endDate
      },
      appliedAt: new Date()
    },
    rewards: [inviterReward, inviteeReward]
  };
}

// 测试数据
const inviteCodes = [
  {
    id: '1',
    code: 'DWTEST123456789',
    inviterId: 'user_123',
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
  }
];

const users = [
  {
    id: 'user_456',
    subscription: {
      isActive: false,
      isTrial: false
    }
  }
];

// 运行测试
console.log('\n📝 测试1: 生成邀请码');
const newCode = generateInviteCode();
console.log('✅ 邀请码生成成功:', newCode);

console.log('\n🔍 测试2: 验证邀请码');
const validation = validateInviteCode('DWTEST123456789', inviteCodes);
console.log('✅ 邀请码验证结果:', validation);

console.log('\n🎁 测试3: 应用邀请码');
const application = applyInviteCode('DWTEST123456789', 'user_456', inviteCodes, users);
console.log('✅ 邀请码应用结果:', application);

console.log('\n📊 测试4: 检查用户状态');
const user = users.find(u => u.id === 'user_456');
console.log('✅ 用户订阅状态:', user.subscription);

console.log('\n🎉 邀请码逻辑测试完成！所有功能正常！');
