// Script to reset the entire database (delete all data)
// Run with: node scripts/reset-database.js

const Database = require('better-sqlite3');
const path = require('path');
const { existsSync, unlinkSync } = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'gymble.db');

try {
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
    console.log('✅ Database file deleted successfully');
  } else {
    console.log('ℹ️  Database file does not exist');
  }
  
  // Also delete uploads and profiles directories
  const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
  const profilesDir = path.join(__dirname, '..', 'public', 'profiles');
  
  const { rmSync } = require('fs');
  
  if (existsSync(uploadsDir)) {
    rmSync(uploadsDir, { recursive: true, force: true });
    console.log('✅ Uploads directory deleted');
  }
  
  if (existsSync(profilesDir)) {
    rmSync(profilesDir, { recursive: true, force: true });
    console.log('✅ Profiles directory deleted');
  }
  
  console.log('✅ Database reset complete. Restart the server to create a fresh database.');
} catch (error) {
  console.error('❌ Error resetting database:', error);
  process.exit(1);
}

