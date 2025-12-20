// Script to reset all users' debt to 0
// Run with: node scripts/reset-debt.js

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'gymble.db');
const db = new Database(dbPath);

try {
  const result = db.prepare('UPDATE users SET credits = 0').run();
  console.log(`✅ Successfully reset debt for ${result.changes} user(s) to 0`);
} catch (error) {
  console.error('❌ Error resetting debt:', error);
  process.exit(1);
} finally {
  db.close();
}

