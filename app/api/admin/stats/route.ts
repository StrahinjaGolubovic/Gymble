import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const adminCheck = await checkAdmin(token);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get total users
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    // Get active users (users with streak > 0 or recent activity)
    const activeUsers = db
      .prepare(
        `SELECT COUNT(DISTINCT u.id) as count 
         FROM users u
         LEFT JOIN streaks s ON u.id = s.user_id
         WHERE s.current_streak > 0 OR u.id IN (
           SELECT DISTINCT user_id FROM daily_uploads 
           WHERE created_at >= datetime('now', 'localtime', '-7 days')
         )`
      )
      .get() as { count: number };

    // Get total uploads
    const totalUploads = db.prepare('SELECT COUNT(*) as count FROM daily_uploads').get() as { count: number };

    // Get pending verifications
    const pendingVerifications = db
      .prepare("SELECT COUNT(*) as count FROM daily_uploads WHERE verification_status = 'pending'")
      .get() as { count: number };

    // Get total debt
    const totalDebt = db.prepare('SELECT SUM(credits) as total FROM users').get() as { total: number | null };

    // Get average streak
    const avgStreak = db
      .prepare('SELECT AVG(current_streak) as avg FROM streaks WHERE current_streak > 0')
      .get() as { avg: number | null };

    // Get chat messages in last 24 hours
    const totalMessages = db
      .prepare("SELECT COUNT(*) as count FROM chat_messages WHERE created_at >= datetime('now', 'localtime', '-24 hours')")
      .get() as { count: number };

    return NextResponse.json({
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      totalUploads: totalUploads.count,
      pendingVerifications: pendingVerifications.count,
      totalDebt: totalDebt.total || 0,
      averageStreak: avgStreak.avg || 0,
      totalMessages: totalMessages.count,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

