const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 配置Metro服务器绑定到所有网络接口
config.server = {
  ...config.server,
  port: 8081,
  host: '0.0.0.0'
};

module.exports = config; 