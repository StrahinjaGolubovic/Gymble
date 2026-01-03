import Database from 'better-sqlite3';

const db = new Database('./data/gymble.db');

const userId = 1;

console.log('=== DEBUGGING STREAK ISSUE FOR USER 1 ===\n');

// Get all approved uploads
const approvedUploads = db.prepare(`
  SELECT upload_date, challenge_id, verification_status 
  FROM daily_uploads 
  WHERE user_id = ? 
  ORDER BY upload_date ASC
`).all(userId);

console.log('APPROVED UPLOADS:');
approvedUploads.forEach(u => {
  console.log(`  ${u.upload_date} - ${u.verification_status} (challenge ${u.challenge_id})`);
});

// Get rest days
const restDays = db.prepare(`
  SELECT rest_date, challenge_id 
  FROM rest_days 
  WHERE user_id = ? 
  ORDER BY rest_date ASC
`).all(userId);

console.log('\nREST DAYS:');
if (restDays.length === 0) {
  console.log('  (none)');
} else {
  restDays.forEach(r => {
    console.log(`  ${r.rest_date} (challenge ${r.challenge_id})`);
  });
}

// Get weekly challenges
const challenges = db.prepare(`
  SELECT id, start_date, end_date, status, completed_days 
  FROM weekly_challenges 
  WHERE user_id = ? 
  ORDER BY start_date DESC
`).all(userId);

console.log('\nWEEKLY CHALLENGES:');
challenges.forEach(c => {
  console.log(`  Challenge ${c.id}: ${c.start_date} to ${c.end_date} - ${c.status} (${c.completed_days}/7)`);
});

// Get current streak data
const streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);

console.log('\nCURRENT STREAK DATA:');
console.log('  current_streak:', streak?.current_streak ?? 'NULL');
console.log('  longest_streak:', streak?.longest_streak ?? 'NULL');
console.log('  last_activity_date:', streak?.last_activity_date ?? 'NULL');
console.log('  last_rollup_date:', streak?.last_rollup_date ?? 'NULL');

// Simulate streak computation
console.log('\n=== SIMULATING STREAK COMPUTATION ===');

const today = new Date().toISOString().split('T')[0]; // Simple date for testing
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

console.log('Today:', today);
console.log('Yesterday:', yesterday);

const approvedDates = approvedUploads
  .filter(u => u.verification_status === 'approved')
  .map(u => u.upload_date);

console.log('\nApproved dates:', approvedDates);

if (approvedDates.length > 0) {
  const lastApprovedDate = approvedDates[approvedDates.length - 1];
  console.log('Last approved date:', lastApprovedDate);
  console.log('Is last approved >= yesterday?', lastApprovedDate >= yesterday);
  
  if (lastApprovedDate >= yesterday) {
    console.log('✓ Streak should be MAINTAINED (last activity is recent)');
  } else {
    console.log('✗ Streak would RESET to 0 (last activity too old)');
    console.log(`  Days since last activity: ${Math.floor((Date.now() - new Date(lastApprovedDate).getTime()) / 86400000)}`);
  }
}

db.close();
