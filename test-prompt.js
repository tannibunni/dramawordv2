const fs = require('fs');
const path = require('path');

// 参数化渲染函数
function renderPrompt(template, params) {
  let result = template;
  for (const key in params) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), params[key]);
  }
  return result;
}

// 读取 prompt 文件
function getPromptTemplate(uiLanguage, language, type) {
  const promptDir = path.join(__dirname, 'services/api/prompts', uiLanguage);
  const promptPath = path.join(promptDir, `${language}.json`);
  if (fs.existsSync(promptPath)) {
    const templates = JSON.parse(fs.readFileSync(promptPath, 'utf-8'));
    return templates[type];
  }
  throw new Error(`Prompt template not found: ${promptPath}`);
}

// 测试参数（可修改）
const uiLanguage = process.argv[2] || 'zh-CN'; // 例如 'zh-CN', 'en'
const language = process.argv[3] || 'en';      // 例如 'en', 'ja', 'ko', 'zh-CN'
const type = 'definition';
const params = {
  word: process.argv[4] || 'DINK',
  language,
  uiLanguage: uiLanguage === 'zh-CN' ? '中文' : (uiLanguage === 'en' ? 'English' : uiLanguage),
  targetLang: language === 'en' ? '英语' : (language === 'ja' ? '日语' : (language === 'ko' ? '韩语' : (language === 'zh-CN' ? '中文' : language))),
  exampleField: language === 'en' ? 'english' : (language === 'ja' ? 'japanese' : (language === 'ko' ? 'korean' : 'chinese'))
};

try {
  const template = getPromptTemplate(uiLanguage, language, type);
  const prompt = renderPrompt(template, params);
  console.log('【Prompt 文件】:', `${uiLanguage}/${language}.json`);
  console.log('【渲染参数】:', params);
  console.log('\n【渲染后的 Prompt】:\n');
  console.log(prompt);
} catch (e) {
  console.error('❌ 测试失败:', e.message);
} 