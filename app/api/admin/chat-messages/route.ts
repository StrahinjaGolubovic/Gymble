import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin';
import { getRecentMessages } from '@/lib/chat';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const adminCheck = await checkAdmin(token);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all messages from last 24 hours (no limit for admin)
    const messages = getRecentMessages(1000);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Admin chat messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

