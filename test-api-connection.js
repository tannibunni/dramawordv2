const API_BASE = 'https://dramawordv2.onrender.com';

async function testAPI() {
  console.log('🧪 开始测试API连接...\n');

  // 1. 测试健康检查
  console.log('1. 测试健康检查...');
  try {
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ 健康检查:', healthData);
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message);
  }

  // 2. 测试用户注册
  console.log('\n2. 测试用户注册...');
  try {
    const testId = `test_guest_${Date.now()}`;
    const registerData = {
      loginType: 'guest',
      guestId: testId,
      username: `testuser_${Date.now()}`,
      nickname: 'API测试用户'
    };

    const registerResponse = await fetch(`${API_BASE}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });

    const registerResult = await registerResponse.json();
    if (registerResult.success) {
      console.log('✅ 用户注册成功:', {
        userId: registerResult.data.user.id,
        username: registerResult.data.user.username,
        nickname: registerResult.data.user.nickname
      });
      
      // 保存用户ID用于后续测试
      const userId = registerResult.data.user.id;
      const token = registerResult.data.token;

      // 3. 测试用户登录
      console.log('\n3. 测试用户登录...');
      const loginResponse = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginType: 'guest',
          guestId: testId
        })
      });

      const loginResult = await loginResponse.json();
      if (loginResult.success) {
        console.log('✅ 用户登录成功:', {
          userId: loginResult.data.user.id,
          level: loginResult.data.user.level,
          experience: loginResult.data.user.experience
        });
      } else {
        console.log('❌ 用户登录失败:', loginResult);
      }

      // 4. 测试单词搜索
      console.log('\n4. 测试单词搜索...');
      const searchResponse = await fetch(`${API_BASE}/api/words/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: 'hello' })
      });

      const searchResult = await searchResponse.json();
      if (searchResult.success) {
        console.log('✅ 单词搜索成功:', {
          word: searchResult.data.word,
          phonetic: searchResult.data.phonetic,
          definitionsCount: searchResult.data.definitions.length,
          source: searchResult.source
        });
      } else {
        console.log('❌ 单词搜索失败:', searchResult);
      }

      // 5. 测试用户词汇本
      console.log('\n5. 测试用户词汇本...');
      const vocabularyResponse = await fetch(`${API_BASE}/api/words/user/vocabulary?userId=${userId}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const vocabularyResult = await vocabularyResponse.json();
      if (vocabularyResult.success) {
        console.log('✅ 用户词汇本获取成功:', {
          vocabularyCount: vocabularyResult.data.length
        });
      } else {
        console.log('⚠️ 用户词汇本为空或获取失败:', vocabularyResult.message);
      }

    } else {
      console.log('❌ 用户注册失败:', registerResult);
    }
  } catch (error) {
    console.log('❌ API测试失败:', error.message);
  }

  console.log('\n🎉 API连接测试完成！');
}

// 运行测试
testAPI().catch(console.error); 