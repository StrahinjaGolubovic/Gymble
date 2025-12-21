import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin';
import { cleanupOldMessages } from '@/lib/chat';
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

    // Get count before cleanup
    const beforeCount = db.prepare('SELECT COUNT(*) as count FROM chat_messages').get() as { count: number };

    // Run cleanup
    cleanupOldMessages();

    // Get count after cleanup
    const afterCount = db.prepare('SELECT COUNT(*) as count FROM chat_messages').get() as { count: number };

    const deletedCount = beforeCount.count - afterCount.count;

    return NextResponse.json({ message: 'Chat cleaned up', deletedCount });
  } catch (error) {
    console.error('Cleanup chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

