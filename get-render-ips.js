const https = require('https');

// 方法1: 使用 ipinfo.io 获取当前服务的出站 IP
function getOutboundIP() {
  return new Promise((resolve, reject) => {
    https.get('https://ipinfo.io/json', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const ipInfo = JSON.parse(data);
          console.log('当前服务的出站 IP:', ipInfo.ip);
          console.log('IP 信息:', ipInfo);
          resolve(ipInfo.ip);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// 方法2: 使用其他 IP 查询服务
function getIPFromAlternative() {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const ipInfo = JSON.parse(data);
          console.log('备用服务获取的 IP:', ipInfo.ip);
          resolve(ipInfo.ip);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// 运行脚本
async function main() {
  console.log('正在获取 Render 出站 IP...\n');
  
  try {
    const ip1 = await getOutboundIP();
    console.log('\n---\n');
    const ip2 = await getIPFromAlternative();
    
    if (ip1 === ip2) {
      console.log('\n✅ 两个服务返回的 IP 一致:', ip1);
    } else {
      console.log('\n⚠️  两个服务返回的 IP 不同:');
      console.log('服务1:', ip1);
      console.log('服务2:', ip2);
    }
    
    console.log('\n📝 请将以上 IP 地址添加到 MongoDB Atlas 的 IP 白名单中');
    
  } catch (error) {
    console.error('获取 IP 失败:', error.message);
  }
}

main(); 