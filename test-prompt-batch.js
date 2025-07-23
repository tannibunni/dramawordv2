const fs = require('fs');
const path = require('path');

function renderPrompt(template, params) {
  let result = template;
  for (const key in params) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), params[key]);
  }
  return result;
}

function getPromptTemplate(uiLanguage, language, type) {
  const promptDir = path.join(__dirname, 'services/api/prompts', uiLanguage);
  const promptPath = path.join(promptDir, `${language}.json`);
  if (fs.existsSync(promptPath)) {
    const templates = JSON.parse(fs.readFileSync(promptPath, 'utf-8'));
    return templates[type];
  }
  throw new Error(`Prompt template not found: ${promptPath}`);
}

// 批量测试词列表
const testCases = [
  { uiLanguage: 'zh-CN', language: 'en', word: 'DINK' },
  { uiLanguage: 'zh-CN', language: 'en', word: 'GOAT' },
  { uiLanguage: 'zh-CN', language: 'en', word: 'FOMO' },
  { uiLanguage: 'zh-CN', language: 'en', word: 'OOTD' },
  { uiLanguage: 'zh-CN', language: 'en', word: 'LOL' },
  { uiLanguage: 'zh-CN', language: 'en', word: 'lit' },
  { uiLanguage: 'zh-CN', language: 'en', word: 'apple' },
  { uiLanguage: 'zh-CN', language: 'ja', word: 'やばい' },
  { uiLanguage: 'zh-CN', language: 'ko', word: '대박' },
  { uiLanguage: 'en', language: 'zh-CN', word: '躺平' },
  { uiLanguage: 'en', language: 'zh-CN', word: '内卷' },
  { uiLanguage: 'en', language: 'ja', word: '草' },
  { uiLanguage: 'en', language: 'ko', word: '눈치' }
];

const type = 'definition';

for (const test of testCases) {
  const params = {
    word: test.word,
    language: test.language,
    uiLanguage: test.uiLanguage === 'zh-CN' ? '中文' : (test.uiLanguage === 'en' ? 'English' : test.uiLanguage),
    targetLang: test.language === 'en' ? '英语' : (test.language === 'ja' ? '日语' : (test.language === 'ko' ? '韩语' : (test.language === 'zh-CN' ? '中文' : test.language))),
    exampleField: test.language === 'en' ? 'english' : (test.language === 'ja' ? 'japanese' : (test.language === 'ko' ? 'korean' : 'chinese'))
  };
  try {
    const template = getPromptTemplate(test.uiLanguage, test.language, type);
    const prompt = renderPrompt(template, params);
    console.log('='.repeat(60));
    console.log('【Prompt 文件】:', `${test.uiLanguage}/${test.language}.json`);
    console.log('【查词内容】: ', test.word);
    console.log('【渲染参数】:', params);
    console.log('\n【渲染后的 Prompt】:\n');
    console.log(prompt);
    console.log('\n');
  } catch (e) {
    console.error('❌ 测试失败:', e.message, test);
  }
} 