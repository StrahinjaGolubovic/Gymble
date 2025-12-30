import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { formatDateTimeSerbia } from '@/lib/timezone';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;
    const { feedback } = await request.json();

    if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
      return NextResponse.json({ error: 'Feedback is required' }, { status: 400 });
    }

    if (feedback.length > 5000) {
      return NextResponse.json({ error: 'Feedback is too long (max 5000 characters)' }, { status: 400 });
    }

    // Check if user has already submitted 5 feedbacks (max limit)
    const existingCount = db
      .prepare('SELECT COUNT(*) as count FROM feedback WHERE user_id = ?')
      .get(userId) as { count: number } | undefined;

    if (existingCount && existingCount.count >= 5) {
      return NextResponse.json(
        { error: 'Maximum feedback limit reached (5 submissions per user)' },
        { status: 400 }
      );
    }

    const createdAt = formatDateTimeSerbia();
    db.prepare('INSERT INTO feedback (user_id, feedback_text, created_at) VALUES (?, ?, ?)').run(
      userId,
      feedback.trim(),
      createdAt
    );

    return NextResponse.json({ success: true, message: 'Feedback submitted successfully' });
  } catch (error: any) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

