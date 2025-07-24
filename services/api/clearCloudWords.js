const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://lt14gs:WZ7KwUo1F2SK0N6W@dramaword.azbr3wj.mongodb.net/dramaword?retryWrites=true&w=majority&appName=dramaword';

const cloudWordSchema = new mongoose.Schema({}, { strict: false, collection: 'cloudwords' });
const CloudWord = mongoose.model('CloudWord', cloudWordSchema);

async function clearCloudWords() {
  await mongoose.connect(MONGO_URI);
  const result = await CloudWord.deleteMany({});
  console.log('CloudWord 清空结果:', result);
  await mongoose.disconnect();
}

clearCloudWords(); 