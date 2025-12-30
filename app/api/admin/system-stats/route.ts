import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { statSync } from 'fs';
import { join } from 'path';
import { formatDateDisplay } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const adminCheck = await checkAdmin(token);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get database file size
    const dbPath = process.env.DATABASE_PATH || './data/gymble.db';
    let dbSize = 'Unknown';
    try {
      const stats = statSync(dbPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      dbSize = `${sizeInMB} MB`;
    } catch (error) {
      // Database file might not exist or be inaccessible
    }

    // Whitelist of known tables to prevent SQL injection
    const allowedTables = [
      'users',
      'weekly_challenges',
      'daily_uploads',
      'streaks',
      'trophy_transactions',
      'user_activity',
      'invite_codes',
      'friends',
      'chat_messages',
      'crews',
      'crew_members',
      'crew_requests',
      'crew_chat_messages',
      'notifications',
      'nudges',
      'rest_days',
      'feedback',
      'app_settings'
    ];

    // Get total record count across all whitelisted tables
    let totalRecords = 0;
    for (const tableName of allowedTables) {
      try {
        // Safe: tableName is from whitelist, not user input
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as { count: number };
        totalRecords += count.count;
      } catch (error) {
        // Skip if table doesn't exist
      }
    }

    // Get oldest and newest user
    const oldestUser = db
      .prepare('SELECT username, created_at FROM users ORDER BY created_at ASC LIMIT 1')
      .get() as { username: string; created_at: string } | undefined;

    const newestUser = db
      .prepare('SELECT username, created_at FROM users ORDER BY created_at DESC LIMIT 1')
      .get() as { username: string; created_at: string } | undefined;

    return NextResponse.json({
      databaseSize: dbSize,
      totalTables: allowedTables.length,
      totalRecords,
      oldestUser: oldestUser ? `${oldestUser.username} (${formatDateDisplay(oldestUser.created_at)})` : 'N/A',
      newestUser: newestUser ? `${newestUser.username} (${formatDateDisplay(newestUser.created_at)})` : 'N/A',
    });
  } catch (error) {
    console.error('System stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

