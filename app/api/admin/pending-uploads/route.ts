import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin';
import { getPendingUploads } from '@/lib/verification';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const adminCheck = await checkAdmin(token);
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const uploads = getPendingUploads();

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error('Get pending uploads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

