// 模拟SUPPORTED_LANGUAGES和appLanguage
const SUPPORTED_LANGUAGES = {
  ENGLISH: { code: 'en', flag: '🇺🇸', name: 'English', nativeName: 'English', englishName: 'English' },
  CHINESE: { code: 'zh', flag: '🇨🇳', name: '中文', nativeName: '中文', englishName: 'Chinese' },
  JAPANESE: { code: 'ja', flag: '🇯🇵', name: '日本語', nativeName: '日本語', englishName: 'Japanese' },
  KOREAN: { code: 'ko', flag: '🇰🇷', name: '한국어', nativeName: '한국어', englishName: 'Korean' },
  FRENCH: { code: 'fr', flag: '🇫🇷', name: 'Français', nativeName: 'Français', englishName: 'French' },
  SPANISH: { code: 'es', flag: '🇪🇸', name: 'Español', nativeName: 'Español', englishName: 'Spanish' }
};

// 测试函数：模拟LanguagePicker的过滤逻辑
function testLanguagePickerFilter(appLanguage) {
  console.log(`\n🧪 测试 LanguagePicker 过滤逻辑 (UI语言: ${appLanguage})`);
  
  const learningLanguages = Object.values(SUPPORTED_LANGUAGES).map(lang => lang.code);
  console.log('📋 学习语言列表:', learningLanguages);
  
  const filteredLanguages = Object.entries(SUPPORTED_LANGUAGES)
    .filter(([key, language]) => {
      const isIncluded = learningLanguages.includes(language.code);
      
      // 根据UI语言过滤学习语言选项
      if (appLanguage === 'zh-CN' && language.code === 'zh') {
        console.log(`❌ 中文UI界面，过滤掉中文学习选项: ${language.name}`);
        return false;
      }
      
      return isIncluded;
    });
  
  console.log('✅ 过滤后的语言选项:');
  filteredLanguages.forEach(([key, lang]) => {
    console.log(`  - ${lang.flag} ${lang.name} (${lang.code})`);
  });
  
  return filteredLanguages;
}

// 测试函数：模拟InitialLanguageModal的过滤逻辑
function testInitialLanguageModalFilter(appLanguage) {
  console.log(`\n🧪 测试 InitialLanguageModal 过滤逻辑 (UI语言: ${appLanguage})`);
  
  const filteredLanguages = Object.values(SUPPORTED_LANGUAGES)
    .filter(language => {
      if (appLanguage === 'zh-CN' && language.code === 'zh') {
        console.log(`❌ 中文UI界面，过滤掉中文学习选项: ${language.name}`);
        return false;
      }
      return true;
    });
  
  console.log('✅ 过滤后的语言选项:');
  filteredLanguages.forEach(lang => {
    console.log(`  - ${lang.flag} ${lang.name} (${lang.code})`);
  });
  
  return filteredLanguages;
}

// 测试函数：模拟AppLanguageSelector的过滤逻辑
function testAppLanguageSelectorFilter(appLanguage) {
  console.log(`\n🧪 测试 AppLanguageSelector 过滤逻辑 (UI语言: ${appLanguage})`);
  
  const filteredLanguages = Object.values(SUPPORTED_LANGUAGES)
    .filter(language => {
      if (appLanguage === 'zh-CN' && language.code === 'zh') {
        console.log(`❌ 中文UI界面，过滤掉中文学习选项: ${language.name}`);
        return false;
      }
      return true;
    });
  
  console.log('✅ 过滤后的语言选项:');
  filteredLanguages.forEach(lang => {
    console.log(`  - ${lang.flag} ${lang.name} (${lang.code})`);
  });
  
  return filteredLanguages;
}

// 测试函数：模拟LanguageSelector的过滤逻辑
function testLanguageSelectorFilter(appLanguage) {
  console.log(`\n🧪 测试 LanguageSelector 过滤逻辑 (UI语言: ${appLanguage})`);
  
  const filteredLanguages = Object.keys(SUPPORTED_LANGUAGES)
    .filter(languageCode => {
      if (appLanguage === 'zh-CN' && languageCode === 'CHINESE') {
        console.log(`❌ 中文UI界面，过滤掉中文学习选项: ${SUPPORTED_LANGUAGES[languageCode].name}`);
        return false;
      }
      return true;
    });
  
  console.log('✅ 过滤后的语言选项:');
  filteredLanguages.forEach(key => {
    const lang = SUPPORTED_LANGUAGES[key];
    console.log(`  - ${lang.flag} ${lang.name} (${lang.code})`);
  });
  
  return filteredLanguages;
}

// 测试函数：模拟VocabularyScreen的过滤逻辑
function testVocabularyScreenFilter(appLanguage) {
  console.log(`\n🧪 测试 VocabularyScreen 过滤逻辑 (UI语言: ${appLanguage})`);
  
  let filterLanguageOptions = [];
  if (appLanguage === 'en-US') {
    // 英文UI界面：将英文选项替换为中文选项
    filterLanguageOptions = [
      { code: 'CHINESE', flag: '🇨🇳', name: '中文', nativeName: 'Chinese' },
      ...Object.entries(SUPPORTED_LANGUAGES)
        .filter(([key]) => key !== 'ENGLISH')
        .map(([key, lang]) => ({ code: lang.code, flag: lang.flag, name: lang.name, nativeName: lang.nativeName }))
    ];
  } else {
    // 中文UI界面：过滤掉中文学习选项
    filterLanguageOptions = Object.entries(SUPPORTED_LANGUAGES)
      .filter(([key, lang]) => {
        if (appLanguage === 'zh-CN' && lang.code === 'zh') {
          console.log(`❌ 中文UI界面，过滤掉中文学习选项: ${lang.name}`);
          return false;
        }
        return true;
      })
      .map(([key, lang]) => ({ code: lang.code, flag: lang.flag, name: lang.name, nativeName: lang.nativeName }));
  }
  
  console.log('✅ 过滤后的语言选项:');
  filterLanguageOptions.forEach(lang => {
    console.log(`  - ${lang.flag} ${lang.name} (${lang.code})`);
  });
  
  return filterLanguageOptions;
}

// 运行所有测试
console.log('🚀 开始测试所有语言选择器的过滤逻辑\n');

// 测试中文UI界面
console.log('=== 中文UI界面测试 ===');
testLanguagePickerFilter('zh-CN');
testInitialLanguageModalFilter('zh-CN');
testAppLanguageSelectorFilter('zh-CN');
testLanguageSelectorFilter('zh-CN');
testVocabularyScreenFilter('zh-CN');

// 测试英文UI界面
console.log('\n=== 英文UI界面测试 ===');
testLanguagePickerFilter('en-US');
testInitialLanguageModalFilter('en-US');
testAppLanguageSelectorFilter('en-US');
testLanguageSelectorFilter('en-US');
testVocabularyScreenFilter('en-US');

console.log('\n✅ 所有测试完成！');
