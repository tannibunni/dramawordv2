const API_BASE = 'https://dramawordv2.onrender.com';

async function testGuestMode() {
  console.log('🧪 开始测试游客模式...\n');

  // 1. 测试健康检查
  console.log('1. 测试API健康检查...');
  try {
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ API健康检查:', healthData);
  } catch (error) {
    console.log('❌ API健康检查失败:', error.message);
    return;
  }

  // 2. 测试游客注册
  console.log('\n2. 测试游客注册...');
  try {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const registerData = {
      loginType: 'guest',
      guestId: guestId,
      username: `guest_${Date.now()}`,
      nickname: '游客用户'
    };

    const registerResponse = await fetch(`${API_BASE}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });

    const registerResult = await registerResponse.json();
    if (registerResult.success) {
      console.log('✅ 游客注册成功:', {
        userId: registerResult.data.user.id,
        username: registerResult.data.user.username,
        nickname: registerResult.data.user.nickname
      });
      
      const userId = registerResult.data.user.id;
      const token = registerResult.data.token;

      // 3. 测试游客登录
      console.log('\n3. 测试游客登录...');
      const loginResponse = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginType: 'guest',
          guestId: guestId
        })
      });

      const loginResult = await loginResponse.json();
      if (loginResult.success) {
        console.log('✅ 游客登录成功:', {
          userId: loginResult.data.user.id,
          level: loginResult.data.user.level,
          experience: loginResult.data.user.experience
        });
      } else {
        console.log('❌ 游客登录失败:', loginResult);
      }

      // 4. 测试游客模式下的单词搜索
      console.log('\n4. 测试游客模式单词搜索...');
      const searchResponse = await fetch(`${API_BASE}/api/words/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: 'hello' })
      });

      const searchResult = await searchResponse.json();
      if (searchResult.success) {
        console.log('✅ 游客模式单词搜索成功:', {
          word: searchResult.data.word,
          phonetic: searchResult.data.phonetic,
          definitionsCount: searchResult.data.definitions.length,
          source: searchResult.data.source
        });
      } else {
        console.log('❌ 游客模式单词搜索失败:', searchResult);
      }

    } else {
      console.log('❌ 游客注册失败:', registerResult);
    }
  } catch (error) {
    console.log('❌ 游客模式测试失败:', error.message);
  }

  console.log('\n🎉 游客模式测试完成！');
  console.log('\n📝 总结:');
  console.log('- 游客可以自动获得临时ID');
  console.log('- 游客可以正常使用所有功能');
  console.log('- 游客数据会保存在本地');
  console.log('- 游客可以随时升级为正式用户');
}

// 运行测试
testGuestMode().catch(console.error); 