// 简单测试韩语字符检测
const testString = "I like to eat an apple every day.";
const hasKoreanChars = /[가-힣]/.test(testString);
const hasJapaneseChars = /[あ-んア-ン一-龯]/.test(testString);

console.log(`测试字符串: "${testString}"`);
console.log(`包含韩文字符: ${hasKoreanChars}`);
console.log(`包含日文字符: ${hasJapaneseChars}`);

// 测试韩语单词
const koreanWord = "사과";
const hasKoreanChars2 = /[가-힣]/.test(koreanWord);
console.log(`韩语单词: "${koreanWord}"`);
console.log(`包含韩文字符: ${hasKoreanChars2}`); 