import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(decoded.userId) as { username: string } | undefined;
    if (!user || !['admin', 'seuq', 'jakow', 'nikola'].includes(user.username)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    // Get all feedback with user info
    const feedback = db
      .prepare(`
        SELECT 
          f.id,
          f.user_id,
          u.username,
          f.feedback_text,
          f.created_at
        FROM feedback f
        LEFT JOIN users u ON f.user_id = u.id
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .all(limit, offset) as Array<{
        id: number;
        user_id: number | null;
        username: string | null;
        feedback_text: string;
        created_at: string;
      }>;

    // Get total count
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM feedback').get() as { count: number };

    return NextResponse.json({
      feedback: feedback.map((f) => ({
        id: f.id,
        userId: f.user_id,
        username: f.username || 'Anonymous',
        text: f.feedback_text,
        createdAt: f.created_at,
      })),
      total: totalCount.count,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Admin feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

