// scripts/standardizePartOfSpeech.js

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://lt14gs:WZ7KwUo1F2SK0N6W@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';
const DB_NAME = 'dramaword';
const COLLECTION = 'cloudwords';

// 词性映射表（历史格式 => 标准英文小写）
const mapping = {
  'v.': 'verb', 'V.': 'verb', 'VERB': 'verb', 'Verb': 'verb', '动词': 'verb', 'verb': 'verb',
  'n.': 'noun', 'N.': 'noun', 'NOUN': 'noun', 'Noun': 'noun', '名词': 'noun', 'noun': 'noun',
  'adj.': 'adjective', 'ADJ.': 'adjective', 'ADJECTIVE': 'adjective', 'Adj.': 'adjective', '形容词': 'adjective', 'adjective': 'adjective',
  'adv.': 'adverb', 'ADV.': 'adverb', 'ADVERB': 'adverb', 'Adv.': 'adverb', '副词': 'adverb', 'adverb': 'adverb',
  'pron.': 'pronoun', 'PRON.': 'pronoun', 'PRONOUN': 'pronoun', 'Pron.': 'pronoun', '代词': 'pronoun', 'pronoun': 'pronoun',
  'prep.': 'preposition', 'PREP.': 'preposition', 'PREPOSITION': 'preposition', 'Prep.': 'preposition', '介词': 'preposition', 'preposition': 'preposition',
  'conj.': 'conjunction', 'CONJ.': 'conjunction', 'CONJUNCTION': 'conjunction', 'Conj.': 'conjunction', '连词': 'conjunction', 'conjunction': 'conjunction',
  'int.': 'interjection', 'INT.': 'interjection', 'INTERJECTION': 'interjection', 'Int.': 'interjection', '感叹词': 'interjection', 'interjection': 'interjection',
  'art.': 'article', 'ART.': 'article', 'ARTICLE': 'article', 'Art.': 'article', '冠词': 'article', 'article': 'article',
  'num.': 'numeral', 'NUM.': 'numeral', 'NUMERAL': 'numeral', 'Num.': 'numeral', '数词': 'numeral', 'numeral': 'numeral',
  'aux.': 'auxiliary', 'AUX.': 'auxiliary', 'AUXILIARY': 'auxiliary', 'Aux.': 'auxiliary', '助词': 'auxiliary', 'auxiliary': 'auxiliary',
  'modal.': 'modal', 'MODAL': 'modal', 'Modal': 'modal', '情态动词': 'modal', 'modal': 'modal',
  'det.': 'determiner', 'DET.': 'determiner', 'DETERMINER': 'determiner', 'Det.': 'determiner', '限定词': 'determiner', 'determiner': 'determiner',
  'prefix.': 'prefix', 'PREFIX': 'prefix', 'Prefix': 'prefix', '前缀': 'prefix', 'prefix': 'prefix',
  'suffix.': 'suffix', 'SUFFIX': 'suffix', 'Suffix': 'suffix', '后缀': 'suffix', 'suffix': 'suffix',
};

async function main() {
  const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);
    const cursor = col.find({ 'definitions.partOfSpeech': { $exists: true } });
    let updatedCount = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      let changed = false;
      const newDefs = (doc.definitions || []).map(def => {
        if (def.partOfSpeech && mapping[def.partOfSpeech]) {
          if (def.partOfSpeech !== mapping[def.partOfSpeech]) {
            changed = true;
            return { ...def, partOfSpeech: mapping[def.partOfSpeech] };
          }
        }
        return def;
      });
      if (changed) {
        await col.updateOne({ _id: doc._id }, { $set: { definitions: newDefs } });
        updatedCount++;
        console.log(`Updated _id: ${doc._id}`);
      }
    }
    console.log(`Done. Updated ${updatedCount} documents.`);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

main(); 