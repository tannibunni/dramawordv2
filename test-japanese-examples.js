const API_BASE_URL = 'https://dramawordv2.onrender.com/api/words';

// 测试日语例句的三行显示效果
async function testJapaneseExamples() {
  console.log('🧪 测试日语例句三行显示效果...\n');
  
  const testWords = [
    'watashi',
    'taberu', 
    'nomu',
    'iku'
  ];
  
  for (const word of testWords) {
    console.log(`📝 测试单词: ${word}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: word,
          language: 'ja'
        }),
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        console.log(`  主要词语: ${data.data.correctedWord}`);
        console.log(`  罗马音: ${data.data.phonetic}`);
        console.log(`  释义: ${data.data.definitions[0]?.definition}`);
        
        // 显示例句的三行格式
        if (data.data.definitions[0]?.examples && data.data.definitions[0].examples.length > 0) {
          const example = data.data.definitions[0].examples[0];
          console.log(`  例句显示格式:`);
          console.log(`    日语原文: ${example.english}`);
          console.log(`    罗马音: ${convertToRomaji(example.english)}`);
          console.log(`    中文翻译: ${example.chinese}`);
        }
        console.log('');
      } else {
        console.log(`  ❌ 查询失败: ${data.error}\n`);
      }
    } catch (error) {
      console.error(`  ❌ 测试失败: ${error}\n`);
    }
  }
}

// 日语转罗马音函数（简化版）
const convertToRomaji = (japaneseText) => {
  const hiraganaToRomaji = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
    'っ': '', 'ー': '-'
  };

  let result = japaneseText;
  result = result.replace(/ー/g, '-');
  result = result.replace(/っ/g, '');
  
  for (const [hiragana, romaji] of Object.entries(hiraganaToRomaji)) {
    result = result.replace(new RegExp(hiragana, 'g'), romaji);
  }
  
  result = result.replace(/[一-龯]/g, (match) => ` ${match} `);
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
};

// 运行测试
testJapaneseExamples().catch(console.error); 