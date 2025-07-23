const mongoose = require('mongoose');
const { connectDatabase } = require('./src/config/database.ts');

async function dropCloudWords() {
  await connectDatabase();
  await mongoose.connection.db.dropCollection('cloudwords');
  console.log('✅ cloudwords collection dropped');
  process.exit(0);
}

if (process.argv[2] === 'dropCloudWords') {
  dropCloudWords();
} else {
  // ...原有测试逻辑...
} 