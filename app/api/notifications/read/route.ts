import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications';
import { cookies } from 'next/headers';

export async function PUT(request: NextRequest) {
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
    const body = await request.json();
    const { notification_id, mark_all } = body;

    if (mark_all) {
      const success = markAllNotificationsAsRead(userId);
      return NextResponse.json({ success });
    } else if (notification_id) {
      const success = markNotificationAsRead(notification_id, userId);
      return NextResponse.json({ success });
    } else {
      return NextResponse.json({ error: 'notification_id or mark_all is required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Mark notification read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

