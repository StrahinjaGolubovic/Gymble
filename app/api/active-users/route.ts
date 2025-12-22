import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { formatDateTimeSerbia } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  try {
    // Ensure user_activity table exists
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_activity (
          user_id INTEGER PRIMARY KEY,
          last_seen DATETIME NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
    } catch (error) {
      // Table might already exist
    }

    // Get users online in the last 2 minutes (currently on the website)
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const cutoffTime = formatDateTimeSerbia(twoMinutesAgo);

    // Count users who have sent a heartbeat in the last 2 minutes
    const onlineUsers = db
      .prepare(
        `SELECT COUNT(*) as count 
         FROM user_activity 
         WHERE last_seen >= ?`
      )
      .get(cutoffTime) as { count: number };

    return NextResponse.json({ onlineUsers: onlineUsers.count });
  } catch (error) {
    console.error('Online users error:', error);
    return NextResponse.json({ onlineUsers: 0 });
  }
}

