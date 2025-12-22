import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { checkAdmin } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token')?.value;

    // Only restore if the stored token is actually an admin session.
    const adminCheck = await checkAdmin(adminToken);
    if (!adminCheck.isAdmin || !adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    cookieStore.set('token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    // Clear the admin_token cookie
    cookieStore.set('admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Stop impersonate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


