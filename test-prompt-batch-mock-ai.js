const mockResults = [
  // DINK
  {
    word: 'DINK',
    language: 'en',
    uiLanguage: 'zh-CN',
    phonetic: 'dɪŋk',
    definitions: [
      {
        partOfSpeech: 'noun',
        definition: '双职工无子女家庭',
        examples: [
          { english: 'They are a DINK couple.', chinese: '他们是一个丁克家庭。' }
        ]
      }
    ],
    slangMeaning: 'Double Income No Kids（丁克，指双职工无子女家庭，常用缩写）',
    phraseExplanation: null
  },
  // GOAT
  {
    word: 'GOAT',
    language: 'en',
    uiLanguage: 'zh-CN',
    phonetic: 'ɡoʊt',
    definitions: [
      {
        partOfSpeech: 'noun',
        definition: '山羊；（俚语）最伟大的人（Greatest Of All Time）',
        examples: [
          { english: 'He is the GOAT of basketball.', chinese: '他是篮球史上最伟大的人。' }
        ]
      }
    ],
    slangMeaning: 'Greatest Of All Time 的缩写，指最伟大的人/事物，网络流行语',
    phraseExplanation: null
  },
  // FOMO
  {
    word: 'FOMO',
    language: 'en',
    uiLanguage: 'zh-CN',
    phonetic: 'ˈfəʊməʊ',
    definitions: [
      {
        partOfSpeech: 'noun',
        definition: '错失恐惧症',
        examples: [
          { english: 'She bought the stock out of FOMO.', chinese: '她因为错失恐惧症买了这只股票。' }
        ]
      }
    ],
    slangMeaning: 'Fear Of Missing Out 的缩写，指害怕错过，网络流行语',
    phraseExplanation: null
  },
  // OOTD
  {
    word: 'OOTD',
    language: 'en',
    uiLanguage: 'zh-CN',
    phonetic: 'ˌoʊ oʊ tiː ˈdiː',
    definitions: [
      {
        partOfSpeech: 'noun',
        definition: '今日穿搭',
        examples: [
          { english: 'Check out my OOTD!', chinese: '看看我今天的穿搭！' }
        ]
      }
    ],
    slangMeaning: 'Outfit Of The Day 的缩写，网络流行语，指今日穿搭',
    phraseExplanation: null
  },
  // LOL
  {
    word: 'LOL',
    language: 'en',
    uiLanguage: 'zh-CN',
    phonetic: 'lɒl',
    definitions: [
      {
        partOfSpeech: 'interjection',
        definition: '大声笑，哈哈',
        examples: [
          { english: 'LOL, that was so funny!', chinese: '哈哈，太搞笑了！' }
        ]
      }
    ],
    slangMeaning: 'Laugh Out Loud 的缩写，网络用语，表示大声笑',
    phraseExplanation: null
  },
  // lit
  {
    word: 'lit',
    language: 'en',
    uiLanguage: 'zh-CN',
    phonetic: 'lɪt',
    definitions: [
      {
        partOfSpeech: 'adjective',
        definition: '很棒的，嗨爆的（俚语）；点燃的',
        examples: [
          { english: 'The party was lit!', chinese: '派对嗨爆了！' }
        ]
      }
    ],
    slangMeaning: '俚语，表示很棒、很嗨、很酷',
    phraseExplanation: null
  },
  // apple（非俚语/缩写/网络用语）
  {
    word: 'apple',
    language: 'en',
    uiLanguage: 'zh-CN',
    phonetic: 'ˈæpəl',
    definitions: [
      {
        partOfSpeech: 'noun',
        definition: '一种圆形水果，通常有红色或绿色的外皮和白色果肉。',
        examples: [
          { english: 'I eat an apple.', chinese: '我吃苹果。' }
        ]
      }
    ],
    slangMeaning: null,
    phraseExplanation: null
  }
];

for (const result of mockResults) {
  console.log('='.repeat(60));
  console.log('【查词内容】: ', result.word);
  console.log('【目标语言】: ', result.language);
  console.log('【界面语言】: ', result.uiLanguage);
  console.log('【AI 返回 JSON】:\n', JSON.stringify(result, null, 2));
  if (result.slangMeaning) {
    console.log('【slangMeaning 展示】: ', result.slangMeaning);
  } else {
    console.log('【slangMeaning 展示】: 无（非俚语/缩写/网络用语）');
  }
  console.log('\n');
} 