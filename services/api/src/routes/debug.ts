import { Router } from 'express';
import https from 'https';

const router = Router();

// 获取出站 IP 的辅助函数
function getOutboundIP(): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get('https://ipinfo.io/json', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const ipInfo = JSON.parse(data);
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

// 获取 Render 出站 IP 的端点
router.get('/outbound-ip', async (req, res) => {
  try {
    const ip = await getOutboundIP();
    res.json({
      success: true,
      outboundIP: ip,
      message: '请将此 IP 添加到 MongoDB Atlas 的 IP 白名单中',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get outbound IP',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取服务信息的端点
router.get('/service-info', (req, res) => {
  res.json({
    success: true,
    service: 'DramaWord API',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 'not set',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

export default router; 