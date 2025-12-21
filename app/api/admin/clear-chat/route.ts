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

    // Delete all chat messages
    const result = db.prepare('DELETE FROM chat_messages').run();

    return NextResponse.json({ message: 'All messages cleared', deletedCount: result.changes });
  } catch (error) {
    console.error('Clear chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

