import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const adminCheck = await checkAdmin(token);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    db.prepare('DELETE FROM chat_messages WHERE id = ?').run(messageId);

    return NextResponse.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

