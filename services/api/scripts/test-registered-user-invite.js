// 测试注册用户邀请码功能
console.log('🚀 开始测试注册用户邀请码功能...');

// 模拟注册用户数据
const registeredUser = {
  id: 'registered_user_123',
  loginType: 'phone', // 注册用户
  phone: '13800138000',
  nickname: '注册用户'
};

const guestUser = {
  id: 'guest_user_456',
  loginType: 'guest', // 游客用户
  deviceId: 'device_123',
  nickname: 'Guest456'
};

// 模拟邀请码数据库
const inviteCodes = [];

// 生成邀请码
function generateInviteCode() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `DW${timestamp}${random}`.toUpperCase();
}

// 模拟注册用户生成邀请码
function generateInviteCodeForRegisteredUser(user) {
  console.log(`\n📝 测试1: 注册用户 ${user.nickname} 生成邀请码`);
  
  if (user.loginType === 'guest') {
    console.log('❌ 游客用户不能生成邀请码');
    return {
      success: false,
      message: '只有注册用户才能生成邀请码',
      code: 'GUEST_USER_NOT_ALLOWED',
      data: {
        requireRegistration: true,
        message: '请先注册成为正式用户，然后才能生成邀请码'
      }
    };
  }

  // 检查是否已有活跃邀请码
  const existingCode = inviteCodes.find(ic => 
    ic.inviterId === user.id && 
    ic.status === 'active' && 
    new Date(ic.expiresAt) > new Date()
  );

  if (existingCode) {
    console.log('✅ 返回现有邀请码:', existingCode.code);
    return {
      success: true,
      message: '您已有一个活跃的邀请码',
      data: {
        code: existingCode.code,
        type: existingCode.type,
        reward: existingCode.reward,
        maxUses: existingCode.maxUses,
        usedCount: existingCode.usedCount,
        expiresAt: existingCode.expiresAt
      }
    };
  }

  // 生成新邀请码
  const code = generateInviteCode();
  const inviteCode = {
    id: Date.now().toString(),
    code,
    inviterId: user.id,
    type: 'free_trial',
    reward: {
      freeTrialDays: 30,
      discountPercent: 0,
      premiumGift: ''
    },
    status: 'active',
    maxUses: 1,
    usedCount: 0,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date()
  };

  inviteCodes.push(inviteCode);
  console.log('✅ 邀请码生成成功:', code);
  
  return {
    success: true,
    message: '邀请码生成成功',
    data: {
      code: inviteCode.code,
      type: inviteCode.type,
      reward: inviteCode.reward,
      maxUses: inviteCode.maxUses,
      expiresAt: inviteCode.expiresAt
    }
  };
}

// 模拟游客用户尝试生成邀请码
function generateInviteCodeForGuestUser(user) {
  console.log(`\n📝 测试2: 游客用户 ${user.nickname} 尝试生成邀请码`);
  
  if (user.loginType === 'guest') {
    console.log('❌ 游客用户不能生成邀请码，需要引导注册');
    return {
      success: false,
      message: '只有注册用户才能生成邀请码',
      code: 'GUEST_USER_NOT_ALLOWED',
      data: {
        requireRegistration: true,
        message: '请先注册成为正式用户，然后才能生成邀请码'
      }
    };
  }
}

// 模拟验证邀请码
function validateInviteCode(code) {
  console.log(`\n🔍 测试3: 验证邀请码 ${code}`);
  
  const inviteCode = inviteCodes.find(ic => ic.code === code && ic.status === 'active');
  
  if (!inviteCode) {
    console.log('❌ 邀请码不存在或已失效');
    return {
      success: false,
      message: '邀请码不存在或已失效',
      code: 'INVITE_CODE_NOT_FOUND'
    };
  }

  if (inviteCode.usedCount >= inviteCode.maxUses) {
    console.log('❌ 邀请码使用次数已达上限');
    return {
      success: false,
      message: '邀请码使用次数已达上限',
      code: 'INVITE_CODE_MAX_USES_REACHED'
    };
  }

  if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
    console.log('❌ 邀请码已过期');
    return {
      success: false,
      message: '邀请码已过期',
      code: 'INVITE_CODE_EXPIRED'
    };
  }

  console.log('✅ 邀请码验证成功');
  return {
    success: true,
    message: '邀请码验证成功',
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

// 运行测试
console.log('=== 注册用户邀请码功能测试 ===');

// 测试1: 注册用户生成邀请码
const result1 = generateInviteCodeForRegisteredUser(registeredUser);
console.log('结果:', result1);

// 测试2: 游客用户尝试生成邀请码
const result2 = generateInviteCodeForGuestUser(guestUser);
console.log('结果:', result2);

// 测试3: 验证邀请码
if (result1.success) {
  const validation = validateInviteCode(result1.data.code);
  console.log('验证结果:', validation);
}

// 测试4: 注册用户再次生成邀请码（应该返回现有邀请码）
const result3 = generateInviteCodeForRegisteredUser(registeredUser);
console.log('再次生成结果:', result3);

console.log('\n📊 邀请码数据库状态:');
console.log('邀请码数量:', inviteCodes.length);
console.log('邀请码列表:', inviteCodes.map(ic => ({
  code: ic.code,
  inviterId: ic.inviterId,
  status: ic.status,
  usedCount: ic.usedCount
})));

console.log('\n🎉 注册用户邀请码功能测试完成！');
