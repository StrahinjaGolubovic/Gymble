import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById } from '@/lib/auth';
import { sendNudgeNotification } from '@/lib/notifications';
import db from '@/lib/db';
import { cookies } from 'next/headers';

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
    const user = getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { friend_id } = await request.json();

    if (!friend_id || typeof friend_id !== 'number') {
      return NextResponse.json({ error: 'friend_id is required' }, { status: 400 });
    }

    // Check if users are friends
    const friendship = db
      .prepare(
        'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)'
      )
      .get(userId, friend_id, friend_id, userId) as { id: number } | undefined;

    if (!friendship) {
      return NextResponse.json({ error: 'You are not friends with this user' }, { status: 403 });
    }

    // Check if friend exists
    const friend = getUserById(friend_id);
    if (!friend) {
      return NextResponse.json({ error: 'Friend not found' }, { status: 404 });
    }

    // Send nudge notification
    const notification = sendNudgeNotification(userId, user.username, friend_id);

    return NextResponse.json({ success: true, notification });
  } catch (error: any) {
    console.error('Nudge friend error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

