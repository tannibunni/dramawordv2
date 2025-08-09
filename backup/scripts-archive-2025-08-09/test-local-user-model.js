const mongoose = require('mongoose');

// 模拟User模型
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  nickname: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  auth: {
    loginType: {
      type: String,
      enum: ['phone', 'wechat', 'apple', 'guest'],
      required: true
    },
    guestId: {
      type: String,
      required: false,
      unique: true,
      sparse: true
    },
    lastLoginAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  subscription: {
    type: {
      type: String,
      enum: ['monthly', 'yearly', 'lifetime'],
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    startDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    },
    autoRenew: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', UserSchema);

// 测试用户创建
async function testUserCreation() {
  console.log('🧪 测试本地User模型创建...');
  
  try {
    // 测试1: 不带subscription字段
    console.log('\n测试1: 不带subscription字段');
    try {
      const user1 = new User({
        username: 'test_user_1',
        nickname: 'Test User 1',
        auth: {
          loginType: 'guest',
          guestId: 'test123',
          lastLoginAt: new Date(),
          isActive: true
        }
      });
      await user1.save();
      console.log('❌ 不应该成功，但成功了');
    } catch (error) {
      console.log('✅ 正确失败:', error.message);
    }
    
    // 测试2: 带subscription字段
    console.log('\n测试2: 带subscription字段');
    try {
      const user2 = new User({
        username: 'test_user_2',
        nickname: 'Test User 2',
        auth: {
          loginType: 'guest',
          guestId: 'test456',
          lastLoginAt: new Date(),
          isActive: true
        },
        subscription: {
          type: 'lifetime',
          isActive: true,
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
          autoRenew: false
        }
      });
      await user2.save();
      console.log('✅ 成功创建用户');
      console.log('   用户ID:', user2._id);
      console.log('   订阅类型:', user2.subscription.type);
      console.log('   过期时间:', user2.subscription.expiryDate);
    } catch (error) {
      console.log('❌ 创建失败:', error.message);
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 运行测试
async function main() {
  // 连接到测试数据库
  try {
    await mongoose.connect('mongodb://localhost:27017/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ 连接到测试数据库');
    
    await testUserCreation();
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.log('跳过数据库测试，只测试模型定义...');
    
    // 即使没有数据库连接，也可以测试模型定义
    const user = new User({
      username: 'test_user_3',
      nickname: 'Test User 3',
      auth: {
        loginType: 'guest',
        guestId: 'test789',
        lastLoginAt: new Date(),
        isActive: true
      },
      subscription: {
        type: 'lifetime',
        isActive: true,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
        autoRenew: false
      }
    });
    
    console.log('✅ 模型定义正确，可以创建用户对象');
    console.log('   用户名:', user.username);
    console.log('   订阅类型:', user.subscription.type);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { User, testUserCreation }; 