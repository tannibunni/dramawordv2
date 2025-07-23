// 清空 cloudwords 集合
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://lt14gs:WZ7KwUo1F2SK0N6W@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';
const dbName = 'dramaword';
const cloudWordCollection = 'cloudwords';

async function clearCloudWords() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const cloudWords = db.collection(cloudWordCollection);
    const result = await cloudWords.deleteMany({});
    console.log(`已删除 cloudwords 集合中的 ${result.deletedCount} 条记录`);
  } catch (err) {
    console.error('清空 cloudwords 失败:', err);
  } finally {
    await client.close();
  }
}

clearCloudWords(); 