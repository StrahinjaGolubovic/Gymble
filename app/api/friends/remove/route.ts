import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { removeFriend } from '@/lib/friends';
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

    const { friendId } = await request.json();

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
    }

    const success = removeFriend(decoded.userId, friendId);

    if (!success) {
      return NextResponse.json({ error: 'Friend not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

