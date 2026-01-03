import Database from 'better-sqlite3';

const db = new Database('./data/gymble.db');

const userId = 1;

console.log('=== USER INFO ===');
const user = db.prepare('SELECT id, username, created_at, trophies FROM users WHERE id = ?').get(userId);
console.log(user);

console.log('\n=== STREAK DATA ===');
const streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);
console.log(streak);

console.log('\n=== WEEKLY CHALLENGES ===');
const challenges = db.prepare(`
  SELECT id, start_date, end_date, status, completed_days, rest_days_available 
  FROM weekly_challenges 
  WHERE user_id = ? 
  ORDER BY start_date DESC 
  LIMIT 5
`).all(userId);
console.log(challenges);

console.log('\n=== RECENT UPLOADS ===');
const uploads = db.prepare(`
  SELECT id, upload_date, verification_status, challenge_id 
  FROM daily_uploads 
  WHERE user_id = ? 
  ORDER BY upload_date DESC 
  LIMIT 10
`).all(userId);
console.log(uploads);

console.log('\n=== REST DAYS ===');
const restDays = db.prepare(`
  SELECT rest_date, challenge_id 
  FROM rest_days 
  WHERE user_id = ? 
  ORDER BY rest_date DESC 
  LIMIT 10
`).all(userId);
console.log(restDays);

console.log('\n=== TROPHY TRANSACTIONS (last 20) ===');
const trophyTxs = db.prepare(`
  SELECT id, delta, reason, created_at 
  FROM trophy_transactions 
  WHERE user_id = ? 
  ORDER BY id DESC 
  LIMIT 20
`).all(userId);
console.log(trophyTxs);

db.close();
