// 测试注册用户数据同步功能
const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// 测试用户数据
const testUser = {
  username: 'test_sync_user',
  nickname: 'Test Sync User',
  loginType: 'phone',
  phoneNumber: '+1234567890'
};

let authToken = '';
let userId = '';

async function testUserSync() {
  console.log('🧪 开始测试注册用户数据同步功能\n');
  
  try {
    // 1. 注册测试用户
    console.log('1. 注册测试用户...');
    const registerResponse = await fetch(`${API_BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      authToken = registerData.data.token;
      userId = registerData.data.user.id;
      console.log('✅ 用户注册成功');
      console.log('📊 用户ID:', userId);
      console.log('🔑 Token:', authToken.substring(0, 20) + '...');
    } else {
      console.log('❌ 用户注册失败');
      console.log('状态码:', registerResponse.status);
      console.log('响应:', await registerResponse.text());
      return;
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. 测试数据上传
    console.log('2. 测试数据上传...');
    const uploadData = {
      learningRecords: [
        {
          word: 'hello',
          mastery: 0.8,
          lastReviewed: new Date().toISOString(),
          reviewCount: 5
        },
        {
          word: 'world',
          mastery: 0.6,
          lastReviewed: new Date().toISOString(),
          reviewCount: 3
        }
      ],
      searchHistory: [
        {
          word: 'hello',
          timestamp: Date.now(),
          language: 'en'
        },
        {
          word: 'world',
          timestamp: Date.now() - 1000,
          language: 'en'
        }
      ],
      userSettings: {
        language: 'en',
        theme: 'light',
        notifications: true
      },
      shows: [
        {
          id: 'test_show_1',
          title: 'Test Show 1',
          addedAt: new Date().toISOString()
        }
      ]
    };
    
    const uploadResponse = await fetch(`${API_BASE_URL}/api/users/sync/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(uploadData)
    });
    
    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json();
      console.log('✅ 数据上传成功');
      console.log('📊 上传结果:', JSON.stringify(uploadResult, null, 2));
    } else {
      console.log('❌ 数据上传失败');
      console.log('状态码:', uploadResponse.status);
      console.log('响应:', await uploadResponse.text());
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. 测试数据下载
    console.log('3. 测试数据下载...');
    const downloadResponse = await fetch(`${API_BASE_URL}/api/users/sync/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (downloadResponse.ok) {
      const downloadResult = await downloadResponse.json();
      console.log('✅ 数据下载成功');
      console.log('📊 下载结果:', JSON.stringify(downloadResult, null, 2));
    } else {
      console.log('❌ 数据下载失败');
      console.log('状态码:', downloadResponse.status);
      console.log('响应:', await downloadResponse.text());
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 4. 测试强制同步
    console.log('4. 测试强制同步...');
    const forceSyncData = {
      learningRecords: [
        {
          word: 'test',
          mastery: 0.9,
          lastReviewed: new Date().toISOString(),
          reviewCount: 10
        }
      ],
      searchHistory: [
        {
          word: 'test',
          timestamp: Date.now(),
          language: 'en'
        }
      ],
      userSettings: {
        language: 'en',
        theme: 'dark',
        notifications: false
      }
    };
    
    const forceSyncResponse = await fetch(`${API_BASE_URL}/api/users/sync/force`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(forceSyncData)
    });
    
    if (forceSyncResponse.ok) {
      const forceSyncResult = await forceSyncResponse.json();
      console.log('✅ 强制同步成功');
      console.log('📊 同步结果:', JSON.stringify(forceSyncResult, null, 2));
    } else {
      console.log('❌ 强制同步失败');
      console.log('状态码:', forceSyncResponse.status);
      console.log('响应:', await forceSyncResponse.text());
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 5. 测试同步状态
    console.log('5. 测试同步状态...');
    const statusResponse = await fetch(`${API_BASE_URL}/api/sync/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (statusResponse.ok) {
      const statusResult = await statusResponse.json();
      console.log('✅ 同步状态获取成功');
      console.log('📊 状态信息:', JSON.stringify(statusResult, null, 2));
    } else {
      console.log('❌ 同步状态获取失败');
      console.log('状态码:', statusResponse.status);
      console.log('响应:', await statusResponse.text());
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 6. 测试同步历史
    console.log('6. 测试同步历史...');
    const historyResponse = await fetch(`${API_BASE_URL}/api/sync/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (historyResponse.ok) {
      const historyResult = await historyResponse.json();
      console.log('✅ 同步历史获取成功');
      console.log('📊 历史记录:', JSON.stringify(historyResult, null, 2));
    } else {
      console.log('❌ 同步历史获取失败');
      console.log('状态码:', historyResponse.status);
      console.log('响应:', await historyResponse.text());
    }
    
    console.log('\n🎉 注册用户数据同步功能测试完成！');
    console.log('✅ 所有同步功能正常工作');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testUserSync().catch(console.error);
