import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const adminCheck = await checkAdmin(token);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    db.prepare('UPDATE users SET credits = 0 WHERE id = ?').run(userId);

    return NextResponse.json({ message: 'Debt reset successfully' });
  } catch (error) {
    console.error('Reset user debt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

