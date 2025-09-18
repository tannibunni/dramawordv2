# Azure Translator 配置指南

## 环境变量配置

在Render上配置以下环境变量：

### 1. 端点配置
```
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
```

**注意**: 
- 使用 `https://api.cognitive.microsofttranslator.com` (Text Translation端点)
- 不要使用 `https://dramaword.cognitiveservices.azure.com/` (Document Translation端点)
- 确保端点末尾没有斜杠 `/`

### 2. API密钥配置
```
AZURE_TRANSLATOR_KEY=your-azure-translator-key
```

## 验证配置

### 1. 检查环境变量
在Render控制台检查环境变量是否正确设置：
- `AZURE_TRANSLATOR_ENDPOINT` 应该指向 `https://api.cognitive.microsofttranslator.com`
- `AZURE_TRANSLATOR_KEY` 应该是您的Azure Translator API密钥

### 2. 测试API连接
部署后可以通过以下端点测试：
```bash
POST https://dramawordv2.onrender.com/api/japanese/translate
{
  "text": "hello world"
}
```

## 支持的端点

### 翻译端点
- **Text Translation**: `https://api.cognitive.microsofttranslator.com/` ✅ 推荐
- **Document Translation**: `https://dramaword.cognitiveservices.azure.com/` ❌ 不适用

## 故障排除

### 常见问题
1. **端点错误**: 确保使用Text Translation端点
2. **密钥无效**: 检查API密钥是否正确
3. **网络问题**: 确保Render可以访问Azure服务

### 日志检查
查看Render日志中的以下信息：
- `✅ Azure Translator客户端初始化成功，端点: ...`
- `✅ Azure翻译成功: ... -> ...`

## 成本说明
- 翻译: $10/百万字符
- 罗马音转换: $10/百万字符
- 总计: $20/百万字符
